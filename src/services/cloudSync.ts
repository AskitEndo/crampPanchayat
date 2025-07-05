// CrampPanchayat Enhanced Sync Service
// Comprehensive cloud sync with offline-first architecture

import { StorageService } from "./storage";
import { SupabaseService } from "./supabase";
import { Profile, SyncCredentials, SyncStatus } from "../types";
import { AppError } from "../utils";
import NetInfo from "@react-native-community/netinfo";

export interface SyncResult {
  success: boolean;
  profilesSynced: number;
  cyclesSynced: number;
  error?: string;
}

export interface CloudSyncState {
  isSignedIn: boolean;
  username?: string;
  lastSync?: string;
  syncEnabled: boolean;
  isLoading: boolean;
  error?: string;
}

class CloudSyncService {
  private static instance: CloudSyncService;
  private storage: StorageService;
  private listeners: Set<(state: CloudSyncState) => void> = new Set();
  private currentState: CloudSyncState = {
    isSignedIn: false,
    syncEnabled: false,
    isLoading: false,
  };

  private constructor() {
    this.storage = StorageService.getInstance();
    this.initializeState();
  }

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  /**
   * Initialize sync state from storage and Supabase
   */
  private async initializeState(): Promise<void> {
    try {
      // Check if user is already signed in
      const user = await SupabaseService.getCurrentUser();
      const syncSettings = await this.getSyncSettings();

      this.updateState({
        isSignedIn: !!user,
        username: user?.user_metadata?.username,
        syncEnabled: syncSettings.enabled,
        lastSync: syncSettings.lastSync,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error initializing sync state:", error);
      this.updateState({
        isSignedIn: false,
        syncEnabled: false,
        isLoading: false,
        error: "Failed to initialize sync",
      });
    }
  }

  /**
   * Subscribe to sync state changes
   */
  public subscribe(listener: (state: CloudSyncState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.currentState);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update sync state and notify listeners
   */
  private updateState(updates: Partial<CloudSyncState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  /**
   * Get current sync state
   */
  public getCurrentState(): CloudSyncState {
    return { ...this.currentState };
  }

  /**
   * Check if network is available
   */
  private async isNetworkAvailable(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true && netInfo.isInternetReachable === true;
  }

  /**
   * Create new sync account
   */
  public async createAccount(
    credentials: SyncCredentials
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      if (!(await this.isNetworkAvailable())) {
        throw new Error(
          "No internet connection. Please check your network and try again."
        );
      }

      if (!SupabaseService.isConfigured()) {
        throw new Error(
          "Cloud sync is not configured. Please contact support."
        );
      }

      const result = await SupabaseService.createAccount(credentials);

      if (result.success) {
        // Sign in after successful account creation
        const signInResult = await this.signIn(credentials);
        return signInResult;
      } else {
        this.updateState({ isLoading: false, error: result.error });
        return result;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account";
      this.updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign in to sync account
   */
  public async signIn(
    credentials: SyncCredentials
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      if (!(await this.isNetworkAvailable())) {
        throw new Error(
          "No internet connection. Please check your network and try again."
        );
      }

      const result = await SupabaseService.signIn(credentials);

      if (result.success) {
        const user = await SupabaseService.getCurrentUser();

        this.updateState({
          isSignedIn: true,
          username: credentials.username,
          syncEnabled: true,
          isLoading: false,
          error: undefined,
        });

        // Save sync settings
        await this.saveSyncSettings({
          enabled: true,
          username: credentials.username,
          lastSync: undefined,
        });

        // Link this cloud account to the current profile
        await this.linkCloudAccountToProfile(credentials.username);

        // Trigger initial sync
        setTimeout(() => this.performFullSync(), 1000);

        return { success: true };
      } else {
        this.updateState({ isLoading: false, error: result.error });
        return result;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in";
      this.updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out of sync account
   */
  public async signOut(): Promise<void> {
    try {
      this.updateState({ isLoading: true });

      await SupabaseService.signOut();

      // Clear sync settings
      await this.saveSyncSettings({
        enabled: false,
        username: undefined,
        lastSync: undefined,
      });

      this.updateState({
        isSignedIn: false,
        username: undefined,
        syncEnabled: false,
        lastSync: undefined,
        isLoading: false,
        error: undefined,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      this.updateState({
        isLoading: false,
        error: "Failed to sign out completely, but local settings were cleared",
      });
    }
  }

  /**
   * Perform full sync (upload local data and download cloud data)
   */
  public async performFullSync(): Promise<SyncResult> {
    try {
      if (!this.currentState.isSignedIn) {
        throw new Error("Must be signed in to sync");
      }

      if (!(await this.isNetworkAvailable())) {
        throw new Error("No internet connection");
      }

      this.updateState({ isLoading: true, error: undefined });

      const profiles = await this.storage.getProfiles();
      const activeProfile = await this.storage.getActiveProfile();

      if (!activeProfile) {
        throw new Error("No active profile found");
      }

      // Check if this profile should sync to cloud
      const shouldSync = await this.shouldProfileSync(activeProfile);
      if (!shouldSync) {
        console.log("Profile not linked to cloud, skipping sync");
        this.updateState({ isLoading: false });
        return {
          success: true,
          profilesSynced: 0,
          cyclesSynced: 0,
        };
      }

      let profilesSynced = 0;
      let totalCyclesSynced = 0;

      // First, try to download cloud data
      const cloudData = await SupabaseService.importDataFromCloud();

      if (cloudData.hasData && cloudData.data) {
        // If cloud data exists, restore it to local storage (overwrite local data)
        await this.restoreCloudData(cloudData.data);
        profilesSynced = 1;
        totalCyclesSynced = cloudData.data.cycles.length;

        console.log("Cloud data restored successfully:", {
          cycles: cloudData.data.cycles.length,
          symptoms: cloudData.data.symptoms.length,
          notes: cloudData.data.notes.length,
        });
      } else {
        // If no cloud data but local data exists, upload to cloud
        await SupabaseService.exportDataToCloud(activeProfile);
        profilesSynced = 1;
        totalCyclesSynced = activeProfile.cycles.length;

        console.log("Local data uploaded to cloud successfully:", {
          cycles: activeProfile.cycles.length,
          symptoms: activeProfile.symptoms.length,
          notes: activeProfile.notes.length,
        });
      }

      const now = new Date().toISOString();
      await this.saveSyncSettings({
        enabled: true,
        username: this.currentState.username,
        lastSync: now,
      });

      this.updateState({
        isLoading: false,
        lastSync: now,
        error: undefined,
      });

      return {
        success: true,
        profilesSynced,
        cyclesSynced: totalCyclesSynced,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";
      console.error("Full sync error:", error);

      this.updateState({
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        profilesSynced: 0,
        cyclesSynced: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if a profile should sync to cloud
   */
  private async shouldProfileSync(profile: Profile): Promise<boolean> {
    // Profile should sync if:
    // 1. User is signed in to cloud sync
    // 2. Profile was created or restored from cloud (has cloud prefix or name matching cloud username)
    // 3. Or profile was explicitly linked to cloud

    if (!this.currentState.isSignedIn || !this.currentState.username) {
      return false;
    }

    // Check if profile ID indicates it came from cloud
    if (profile.id.startsWith("cloud_")) {
      return true;
    }

    // Check if profile name matches cloud username (indicates it's linked)
    if (profile.name === this.currentState.username) {
      return true;
    }

    // For now, if user is signed in and has an active profile, assume they want to sync
    // TODO: Add explicit profile linking mechanism in future
    return true;
  }

  /**
   * Restore cloud data to current local profile (complete data overwrite)
   */
  private async restoreCloudData(cloudData: any): Promise<void> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) {
        throw new Error("No active profile to restore cloud data to");
      }

      console.log("Restoring cloud data to profile:", {
        profileId: activeProfile.id,
        emoji: activeProfile.emoji,
        cloudDataSize: {
          cycles: cloudData.cycles?.length || 0,
          symptoms: cloudData.symptoms?.length || 0,
          notes: cloudData.notes?.length || 0,
          predictions: cloudData.predictions?.length || 0,
        },
      });

      // Enhanced data validation and sanitization
      const sanitizeArray = (arr: any[], name: string): any[] => {
        if (!Array.isArray(arr)) {
          console.warn(
            `Invalid ${name} data - not an array, using empty array`
          );
          return [];
        }
        // Filter out invalid items
        const validItems = arr.filter((item) => {
          if (!item || typeof item !== "object") {
            console.warn(`Filtering out invalid ${name} item:`, item);
            return false;
          }
          if (!item.id) {
            console.warn(`Filtering out ${name} item without ID:`, item);
            return false;
          }
          return true;
        });

        console.log(
          `Sanitized ${name}: ${arr.length} → ${validItems.length} items`
        );
        return validItems;
      };

      const sanitizeSettings = (settings: any): any => {
        if (!settings || typeof settings !== "object") {
          console.warn("Invalid settings data, using profile defaults");
          return { ...activeProfile.settings }; // Fallback to current profile settings
        }
        // Merge with existing settings, prioritizing cloud settings for valid fields
        return {
          ...activeProfile.settings, // Base defaults
          ...settings, // Cloud overrides (if valid)
        };
      };

      // Create updated profile with ALL cloud data - ensure data integrity
      const updatedProfile: Profile = {
        ...activeProfile, // Keep local profile identity (id, emoji, name, createdAt)
        // Overwrite ALL data with validated cloud data
        cycles: sanitizeArray(cloudData.cycles || [], "cycles"),
        symptoms: sanitizeArray(cloudData.symptoms || [], "symptoms"),
        notes: sanitizeArray(cloudData.notes || [], "notes"),
        predictions: sanitizeArray(cloudData.predictions || [], "predictions"),
        settings: sanitizeSettings(cloudData.settings),
        lastActive: new Date().toISOString(), // Update last active time
      };

      // Additional data integrity checks
      const dataIntegrityReport = {
        totalCycles: updatedProfile.cycles.length,
        totalSymptoms: updatedProfile.symptoms.length,
        totalNotes: updatedProfile.notes.length,
        totalPredictions: updatedProfile.predictions.length,
        cyclesWithValidDates: updatedProfile.cycles.filter(
          (c) => c.startDate && !isNaN(new Date(c.startDate).getTime())
        ).length,
        symptomsWithValidDates: updatedProfile.symptoms.filter(
          (s) => s.date && !isNaN(new Date(s.date).getTime())
        ).length,
        notesWithValidDates: updatedProfile.notes.filter(
          (n) => n.date && !isNaN(new Date(n.date).getTime())
        ).length,
      };

      console.log("Data integrity report:", dataIntegrityReport);

      // Update the profile in storage
      await this.storage.updateProfile(activeProfile.id, updatedProfile);

      console.log("Cloud data restored successfully:", {
        profileId: updatedProfile.id,
        emoji: updatedProfile.emoji,
        totalCycles: updatedProfile.cycles.length,
        totalSymptoms: updatedProfile.symptoms.length,
        totalNotes: updatedProfile.notes.length,
        totalPredictions: updatedProfile.predictions.length,
        dateRange: this.getDataDateRange(updatedProfile),
        settingsKeys: Object.keys(updatedProfile.settings),
      });
    } catch (error) {
      console.error("Error restoring cloud data:", error);
      throw new AppError({
        code: "RESTORE_CLOUD_DATA_ERROR",
        message: "Failed to restore cloud data to local profile",
        details: error,
      });
    }
  }

  /**
   * Get date range of profile data for logging
   */
  private getDataDateRange(profile: Profile): {
    earliest?: string;
    latest?: string;
  } {
    const allDates: string[] = [];

    // Collect all dates from cycles
    profile.cycles.forEach((cycle) => {
      if (cycle.startDate) allDates.push(cycle.startDate);
      if (cycle.endDate) allDates.push(cycle.endDate);
      allDates.push(...cycle.periodDays);
      allDates.push(...Object.keys(cycle.symptoms || {}));
      allDates.push(...Object.keys(cycle.notes || {}));
    });

    // Collect dates from symptoms
    profile.symptoms.forEach((symptom) => {
      allDates.push(symptom.date);
    });

    // Collect dates from notes
    profile.notes.forEach((note) => {
      allDates.push(note.date);
    });

    if (allDates.length === 0) {
      return {};
    }

    allDates.sort();
    return {
      earliest: allDates[0],
      latest: allDates[allDates.length - 1],
    };
  }

  /**
   * Upload local data to cloud
   */
  public async uploadToCloud(): Promise<SyncResult> {
    try {
      if (!this.currentState.isSignedIn) {
        throw new Error("Must be signed in to upload");
      }

      if (!(await this.isNetworkAvailable())) {
        throw new Error("No internet connection");
      }

      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) {
        throw new Error("No active profile to upload");
      }

      await SupabaseService.exportDataToCloud(activeProfile);

      return {
        success: true,
        profilesSynced: 1,
        cyclesSynced: activeProfile.cycles.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      return {
        success: false,
        profilesSynced: 0,
        cyclesSynced: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Download data from cloud
   */
  public async downloadFromCloud(): Promise<SyncResult> {
    try {
      if (!this.currentState.isSignedIn) {
        throw new Error("Must be signed in to download");
      }

      if (!(await this.isNetworkAvailable())) {
        throw new Error("No internet connection");
      }

      const cloudData = await SupabaseService.importDataFromCloud();

      if (cloudData.hasData && cloudData.data) {
        // Get current active profile
        const activeProfile = await this.storage.getActiveProfile();
        if (!activeProfile) {
          throw new Error("No active profile to import cloud data to");
        }

        // Overwrite current profile's data with cloud data
        await this.restoreCloudData(cloudData.data);

        return {
          success: true,
          profilesSynced: 1,
          cyclesSynced: cloudData.data.cycles.length,
        };
      } else {
        return {
          success: true,
          profilesSynced: 0,
          cyclesSynced: 0,
          error: "No cloud data found for this account",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Download failed";
      return {
        success: false,
        profilesSynced: 0,
        cyclesSynced: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete cloud account and all data
   */
  public async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true });

      await SupabaseService.deleteAccount();
      await this.signOut(); // This will clear local settings too

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete account";
      this.updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete cloud account and all associated data
   */
  public async deleteCloudAccount(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.currentState.isSignedIn) {
        return {
          success: false,
          error: "Must be signed in to delete cloud account",
        };
      }

      if (!(await this.isNetworkAvailable())) {
        return {
          success: false,
          error:
            "No internet connection. Please check your network and try again.",
        };
      }

      this.updateState({ isLoading: true, error: undefined });

      // Delete the account from Supabase (data + auth)
      await SupabaseService.deleteAccount();

      // Clear local sync settings for this profile
      await this.saveSyncSettings({
        enabled: false,
        username: undefined,
        lastSync: undefined,
      });

      // FIXED: Also clear cloud sync status from the current profile settings
      const activeProfile = await this.storage.getActiveProfile();
      if (activeProfile) {
        // Clear cloud sync status from profile settings
        await this.storage.updateProfile(activeProfile.id, {
          settings: {
            ...activeProfile.settings,
            onlineSync: false,
          },
        });
      }

      // Update state to reflect deletion and unlinking
      this.updateState({
        isSignedIn: false,
        username: undefined,
        syncEnabled: false,
        lastSync: undefined,
        isLoading: false,
        error: undefined,
      });

      console.log("Cloud account deleted and profile unlinked successfully");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete cloud account";
      console.error("Error deleting cloud account:", error);

      this.updateState({
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get sync settings from local storage (profile-specific)
   */
  private async getSyncSettings(): Promise<{
    enabled: boolean;
    username?: string;
    lastSync?: string;
  }> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      const settingsKey = activeProfile
        ? `cramp_sync_settings_${activeProfile.id}`
        : "cramp_sync_settings";

      const settings = await this.storage.getCustomData(settingsKey, {});
      return {
        enabled: (settings as any).enabled || false,
        username: (settings as any).username,
        lastSync: (settings as any).lastSync,
      };
    } catch (error) {
      console.error("Error getting sync settings:", error);
      return { enabled: false };
    }
  }

  /**
   * Save sync settings to local storage (profile-specific)
   */
  private async saveSyncSettings(settings: {
    enabled: boolean;
    username?: string;
    lastSync?: string;
  }): Promise<void> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      const settingsKey = activeProfile
        ? `cramp_sync_settings_${activeProfile.id}`
        : "cramp_sync_settings";

      await this.storage.setCustomData(settingsKey, settings);
    } catch (error) {
      console.error("Error saving sync settings:", error);
    }
  }

  /**
   * Check if username is available
   */
  public async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      if (!(await this.isNetworkAvailable())) {
        throw new Error("No internet connection");
      }

      if (!SupabaseService.isConfigured()) {
        return true; // Allow offline usage
      }

      return await SupabaseService.checkUsernameAvailability(username);
    } catch (error) {
      console.error("Error checking username availability:", error);
      return true; // Assume available on error
    }
  }

  /**
   * Auto-sync when app comes to foreground (if enabled)
   */
  public async autoSync(): Promise<void> {
    try {
      if (!this.currentState.isSignedIn || !this.currentState.syncEnabled) {
        return; // Skip if not signed in or sync disabled
      }

      if (!(await this.isNetworkAvailable())) {
        return; // Skip if no network
      }

      // Check if it's been more than 1 hour since last sync
      const lastSync = this.currentState.lastSync;
      if (!lastSync || Date.now() - new Date(lastSync).getTime() > 3600000) {
        console.log("Performing auto-sync...");
        await this.performFullSync();
      }
    } catch (error) {
      console.log("Auto-sync failed silently:", error);
      // Don't show errors for auto-sync - should be silent
    }
  }

  /**
   * Debug sync state and configuration
   */
  public debugSyncState(): void {
    console.log("=== CLOUD SYNC DEBUG STATE ===");
    console.log("Current state:", this.currentState);
    console.log("Supabase configured:", SupabaseService.isConfigured());
    console.log("Has client:", !!SupabaseService.getClient());

    // Check network
    this.isNetworkAvailable().then((connected) => {
      console.log("Network available:", connected);
    });

    // Check current user
    SupabaseService.getCurrentUser().then((user) => {
      console.log(
        "Current user:",
        user ? { id: user.id, email: user.email } : null
      );
    });

    console.log("=== END DEBUG STATE ===");
  }

  /**
   * Check if current profile has any data worth syncing
   */
  public async hasDataToSync(): Promise<{
    hasData: boolean;
    cycleCount: number;
    symptomCount: number;
    noteCount: number;
  }> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) {
        return {
          hasData: false,
          cycleCount: 0,
          symptomCount: 0,
          noteCount: 0,
        };
      }

      const cycleCount = activeProfile.cycles?.length || 0;
      const symptomCount = activeProfile.symptoms?.length || 0;
      const noteCount = activeProfile.notes?.length || 0;

      const hasData = cycleCount > 0 || symptomCount > 0 || noteCount > 0;

      return {
        hasData,
        cycleCount,
        symptomCount,
        noteCount,
      };
    } catch (error) {
      console.error("Error checking data to sync:", error);
      return {
        hasData: false,
        cycleCount: 0,
        symptomCount: 0,
        noteCount: 0,
      };
    }
  }

  /**
   * Enhanced export to cloud with data validation
   */
  public async exportToCloudSafe(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // First check if we have any data to export
      const dataCheck = await this.hasDataToSync();

      if (!dataCheck.hasData) {
        return {
          success: false,
          message:
            "No data to sync! Start tracking your cycle first.\n\nOnce you have cycles, symptoms, or notes recorded, you can sync them to the cloud.",
          error: "NO_DATA_TO_SYNC",
        };
      }

      // Proceed with normal export - inline implementation
      if (!this.currentState.isSignedIn) {
        return {
          success: false,
          message: "You must be signed in to export data to cloud",
          error: "NOT_SIGNED_IN",
        };
      }

      if (!(await this.isNetworkAvailable())) {
        return {
          success: false,
          message:
            "No internet connection. Please check your network and try again.",
          error: "NO_NETWORK",
        };
      }

      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) {
        return {
          success: false,
          message: "No active profile found to export",
          error: "NO_ACTIVE_PROFILE",
        };
      }

      await SupabaseService.exportDataToCloud(activeProfile);

      return {
        success: true,
        message: "Data exported to cloud successfully",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Export failed";
      return {
        success: false,
        message: errorMessage,
        error: "EXPORT_ERROR",
      };
    }
  }

  /**
   * Enhanced import from cloud with better empty state handling
   */
  public async importFromCloudSafe(): Promise<{
    success: boolean;
    message: string;
    dataFound: boolean;
    cyclesImported?: number;
    error?: string;
  }> {
    try {
      if (!this.currentState.isSignedIn) {
        return {
          success: false,
          message: "You must be signed in to import data from cloud",
          dataFound: false,
          error: "NOT_SIGNED_IN",
        };
      }

      if (!(await this.isNetworkAvailable())) {
        return {
          success: false,
          message:
            "No internet connection. Please check your network and try again.",
          dataFound: false,
          error: "NO_NETWORK",
        };
      }

      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) {
        return {
          success: false,
          message: "No active profile found to import data to",
          dataFound: false,
          error: "NO_ACTIVE_PROFILE",
        };
      }

      const cloudData = await SupabaseService.importDataFromCloud();

      if (!cloudData.hasData || !cloudData.data) {
        return {
          success: false,
          message:
            "No cloud data found for this account.\n\nTo sync data:\n1. Start tracking your cycle\n2. Export your data to cloud first\n3. Then you can import it on other devices",
          dataFound: false,
          error: "NO_CLOUD_DATA",
        };
      }

      // Check if cloud data is empty/minimal
      const cycles = cloudData.data.cycles || [];
      const symptoms = cloudData.data.symptoms || [];
      const notes = cloudData.data.notes || [];

      if (cycles.length === 0 && symptoms.length === 0 && notes.length === 0) {
        return {
          success: false,
          message:
            "Cloud account exists but contains no tracking data.\n\nExport your current data first, or start fresh by tracking your cycle.",
          dataFound: false,
          error: "EMPTY_CLOUD_DATA",
        };
      }

      // Overwrite current profile's data with cloud data
      await this.restoreCloudData(cloudData.data);

      return {
        success: true,
        message: `Data imported successfully!\n\n• ${cycles.length} cycles\n• ${symptoms.length} symptoms\n• ${notes.length} notes`,
        dataFound: true,
        cyclesImported: cycles.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Import failed";
      return {
        success: false,
        message: errorMessage,
        dataFound: false,
        error: "IMPORT_ERROR",
      };
    }
  }

  /**
   * Handle profile switching - auto sign out from cloud
   */
  public async handleProfileSwitch(): Promise<void> {
    try {
      console.log("Profile switched - automatically signing out from cloud");

      // Sign out from current cloud account when switching profiles
      if (this.currentState.isSignedIn) {
        await this.signOut();
        console.log("Auto-signed out from cloud due to profile switch");
      }
    } catch (error) {
      console.error("Error handling profile switch:", error);
    }
  }

  /**
   * Switch to a different profile and handle cloud signout
   */
  public async switchProfile(profileId: string): Promise<boolean> {
    try {
      console.log(`Switching to profile: ${profileId}`);

      // Auto sign out from cloud when switching profiles - this ensures profile independence
      await this.handleProfileSwitch();

      // Switch to the new profile
      const success = await this.storage.setActiveProfile(profileId);

      if (success) {
        console.log(
          `Successfully switched to profile ${profileId} and signed out from cloud`
        );

        // Re-initialize state for new profile
        await this.initializeState();
      }

      return success;
    } catch (error) {
      console.error("Error switching profile:", error);
      return false;
    }
  }

  /**
   * Create new profile and automatically switch to it
   */
  public async createAndSwitchProfile(
    emoji: any,
    name?: string
  ): Promise<Profile | null> {
    try {
      console.log(`Creating new profile: ${emoji} ${name || ""}`);

      // Auto sign out from cloud when creating new profile - ensures profile independence
      await this.handleProfileSwitch();

      // Create new profile and set as active
      const newProfile = await this.storage.createProfile(emoji, name, true);

      console.log(
        `Successfully created and switched to new profile: ${
          newProfile.emoji
        } ${newProfile.name || ""}`
      );

      // Re-initialize state for new profile
      await this.initializeState();

      return newProfile;
    } catch (error) {
      console.error("Error creating and switching profile:", error);
      return null;
    }
  }

  /**
   * Get cloud accounts linked to current profile
   */
  public async getLinkedCloudAccounts(): Promise<string[]> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) return [];

      // Get cloud accounts linked to this profile from storage
      const linkedAccounts = await this.storage.getCustomData(
        `cloud_accounts_${activeProfile.id}`,
        []
      );
      return Array.isArray(linkedAccounts) ? linkedAccounts : [];
    } catch (error) {
      console.error("Error getting linked cloud accounts:", error);
      return [];
    }
  }

  /**
   * Link cloud account to current profile
   */
  private async linkCloudAccountToProfile(username: string): Promise<void> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) return;

      const linkedAccounts = await this.getLinkedCloudAccounts();
      if (!linkedAccounts.includes(username)) {
        linkedAccounts.push(username);
        await this.storage.setCustomData(
          `cloud_accounts_${activeProfile.id}`,
          linkedAccounts
        );
        console.log(
          `Linked cloud account ${username} to profile ${activeProfile.emoji}`
        );
      }
    } catch (error) {
      console.error("Error linking cloud account to profile:", error);
    }
  }

  /**
   * Remove cloud account link from current profile
   */
  public async unlinkCloudAccountFromProfile(username: string): Promise<void> {
    try {
      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) return;

      const linkedAccounts = await this.getLinkedCloudAccounts();
      const updatedAccounts = linkedAccounts.filter(
        (account) => account !== username
      );

      await this.storage.setCustomData(
        `cloud_accounts_${activeProfile.id}`,
        updatedAccounts
      );

      // If this was the currently signed in account, sign out
      if (this.currentState.username === username) {
        await this.signOut();
      }

      console.log(
        `Unlinked cloud account ${username} from profile ${activeProfile.emoji}`
      );
    } catch (error) {
      console.error("Error unlinking cloud account:", error);
    }
  }

  /**
   * Get all cloud accounts across all profiles (for management)
   */
  public async getAllLinkedCloudAccounts(): Promise<
    { profileId: string; emoji: string; accounts: string[] }[]
  > {
    try {
      const profiles = await this.storage.getProfiles();
      const result = [];

      for (const profile of profiles) {
        const linkedAccounts = await this.storage.getCustomData(
          `cloud_accounts_${profile.id}`,
          []
        );
        const accounts = Array.isArray(linkedAccounts) ? linkedAccounts : [];

        if (accounts.length > 0) {
          result.push({
            profileId: profile.id,
            emoji: profile.emoji,
            accounts: accounts,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting all linked cloud accounts:", error);
      return [];
    }
  }

  /**
   * Smart sync - uploads local data if cloud is empty, imports if cloud has data
   */
  public async smartSync(): Promise<{
    success: boolean;
    message: string;
    action: "uploaded" | "downloaded" | "no_action";
    error?: string;
  }> {
    try {
      if (!this.currentState.isSignedIn) {
        return {
          success: false,
          message: "You must be signed in to sync data",
          action: "no_action",
          error: "NOT_SIGNED_IN",
        };
      }

      if (!(await this.isNetworkAvailable())) {
        return {
          success: false,
          message:
            "No internet connection. Please check your network and try again.",
          action: "no_action",
          error: "NO_NETWORK",
        };
      }

      const activeProfile = await this.storage.getActiveProfile();
      if (!activeProfile) {
        return {
          success: false,
          message: "No active profile found to sync",
          action: "no_action",
          error: "NO_ACTIVE_PROFILE",
        };
      }

      // Check if cloud has data
      const cloudData = await SupabaseService.importDataFromCloud();

      if (!cloudData.hasData || !cloudData.data) {
        // Cloud is empty - upload local data to cloud
        await SupabaseService.exportDataToCloud(activeProfile);

        return {
          success: true,
          message:
            "Local data uploaded to cloud successfully. Cloud was empty.",
          action: "uploaded",
        };
      } else {
        // Cloud has data - download and overwrite local data
        await this.restoreCloudData(cloudData.data);

        return {
          success: true,
          message:
            "Cloud data downloaded and merged with local data successfully.",
          action: "downloaded",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";
      return {
        success: false,
        message: errorMessage,
        action: "no_action",
        error: "SYNC_ERROR",
      };
    }
  }
}

export { CloudSyncService };
export default CloudSyncService;
