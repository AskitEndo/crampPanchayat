// CrampPanchayat Storage Service - Rebuilt for Reliability
// Robust offline-first storage with proper validation and error handling

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Profile,
  CycleRecord,
  SymptomRecord,
  DailyNote,
  EmojiType,
} from "../types";

// Storage keys for different data types
const STORAGE_KEYS = {
  PROFILES: "cramp_profiles",
  ACTIVE_PROFILE: "cramp_active_profile",
  FIRST_LAUNCH: "cramp_first_launch",
  APP_SETTINGS: "cramp_app_settings",
} as const;

// Default profile settings
const DEFAULT_PROFILE_SETTINGS = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
  remindersEnabled: true,
  reminderTime: "09:00",
  darkMode: false,
  language: "en",
  firstDayOfWeek: 1 as const,
  onlineSync: false,
  donationPrompts: true,
};

/**
 * Comprehensive storage service for offline-first data management
 */
class StorageService {
  private static instance: StorageService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Helper to safely parse JSON from storage
   */
  private async safeGetItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse storage item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Helper to safely set items to storage
   */
  private async safeSetItem(key: string, value: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if this is the first app launch
   */
  public async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      return hasLaunched === null;
    } catch (error) {
      console.warn("Failed to check first launch:", error);
      return true; // Assume first launch on error
    }
  }

  /**
   * Mark that the app has been launched
   */
  public async markFirstLaunchComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, "false");
    } catch (error) {
      console.error("Failed to mark first launch complete:", error);
    }
  }

  /**
   * Get all profiles
   */
  public async getProfiles(): Promise<Profile[]> {
    return this.safeGetItem<Profile[]>(STORAGE_KEYS.PROFILES, []);
  }

  /**
   * Save all profiles
   */
  public async saveProfiles(profiles: Profile[]): Promise<boolean> {
    return this.safeSetItem(STORAGE_KEYS.PROFILES, profiles);
  }

  /**
   * Get a specific profile by ID
   */
  public async getProfile(profileId: string): Promise<Profile | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === profileId) || null;
  }

  /**
   * Create a new profile
   */
  public async createProfile(
    emoji: EmojiType,
    name?: string,
    setAsActive: boolean = false
  ): Promise<Profile> {
    const profiles = await this.getProfiles();

    // Check if emoji is already used
    const existingProfile = profiles.find((p) => p.emoji === emoji);
    if (existingProfile) {
      throw new Error(`Emoji ${emoji} is already in use`);
    }

    const now = new Date().toISOString();
    const newProfile: Profile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emoji,
      name,
      createdAt: now,
      lastActive: now,
      settings: { ...DEFAULT_PROFILE_SETTINGS },
      cycles: [],
      symptoms: [],
      notes: [],
      predictions: [],
    };

    const updatedProfiles = [...profiles, newProfile];
    const saved = await this.saveProfiles(updatedProfiles);

    if (!saved) {
      throw new Error("Failed to save new profile");
    }

    // Auto-activate the new profile if requested
    if (setAsActive) {
      await this.setActiveProfile(newProfile.id);
    }

    return newProfile;
  }

  /**
   * Update an existing profile
   */
  public async updateProfile(
    profileId: string,
    updates: Partial<Profile>
  ): Promise<Profile> {
    const profiles = await this.getProfiles();
    const profileIndex = profiles.findIndex((p) => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const updatedProfile = {
      ...profiles[profileIndex],
      ...updates,
      lastActive: new Date().toISOString(),
    };

    profiles[profileIndex] = updatedProfile;
    const saved = await this.saveProfiles(profiles);

    if (!saved) {
      throw new Error("Failed to update profile");
    }

    return updatedProfile;
  }

  /**
   * Delete a profile
   */
  public async deleteProfile(profileId: string): Promise<boolean> {
    const profiles = await this.getProfiles();
    const filteredProfiles = profiles.filter((p) => p.id !== profileId);

    if (filteredProfiles.length === profiles.length) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Clear active profile if it's the one being deleted
    const activeProfileId = await this.getActiveProfileId();
    if (activeProfileId === profileId) {
      await this.clearActiveProfile();
    }

    return this.saveProfiles(filteredProfiles);
  }

  /**
   * Get active profile ID
   */
  public async getActiveProfileId(): Promise<string | null> {
    return this.safeGetItem<string | null>(STORAGE_KEYS.ACTIVE_PROFILE, null);
  }

  /**
   * Get active profile
   */
  public async getActiveProfile(): Promise<Profile | null> {
    const activeProfileId = await this.getActiveProfileId();
    if (!activeProfileId) return null;
    return this.getProfile(activeProfileId);
  }

  /**
   * Set active profile
   */
  public async setActiveProfile(profileId: string): Promise<boolean> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const success = await this.safeSetItem(
      STORAGE_KEYS.ACTIVE_PROFILE,
      profileId
    );

    // Update profile's last active time
    if (success) {
      await this.updateProfile(profileId, {
        lastActive: new Date().toISOString(),
      });
    }

    return success;
  }

  /**
   * Clear active profile
   */
  public async clearActiveProfile(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
      return true;
    } catch (error) {
      console.error("Failed to clear active profile:", error);
      return false;
    }
  }

  /**
   * Add a cycle record to a profile
   */
  public async addCycleRecord(
    profileId: string,
    cycleRecord: Omit<CycleRecord, "id" | "profileId">
  ): Promise<CycleRecord> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const newCycle: CycleRecord = {
      ...cycleRecord,
      id: `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      profileId,
    };

    const updatedCycles = [...profile.cycles, newCycle];
    await this.updateProfile(profileId, { cycles: updatedCycles });

    return newCycle;
  }

  /**
   * Add a symptom record to a profile
   */
  public async addSymptomRecord(
    profileId: string,
    symptomRecord: Omit<SymptomRecord, "id" | "profileId">
  ): Promise<SymptomRecord> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const newSymptom: SymptomRecord = {
      ...symptomRecord,
      id: `symptom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      profileId,
    };

    const updatedSymptoms = [...profile.symptoms, newSymptom];
    await this.updateProfile(profileId, { symptoms: updatedSymptoms });

    return newSymptom;
  }

  /**
   * Add a daily note to a profile
   */
  public async addDailyNote(
    profileId: string,
    note: Omit<DailyNote, "id" | "profileId">
  ): Promise<DailyNote> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const newNote: DailyNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      profileId,
    };

    const updatedNotes = [...profile.notes, newNote];
    await this.updateProfile(profileId, { notes: updatedNotes });

    return newNote;
  }

  /**
   * Clear all data (for testing or reset)
   */
  public async clearAllData(): Promise<boolean> {
    try {
      console.log("🗑️ Clearing all app data...");

      // Get all keys first for logging
      const allKeys = await AsyncStorage.getAllKeys();
      const crampKeys = allKeys.filter(
        (key) => key.startsWith("cramp_") || key.includes("cramppanchayat")
      );

      console.log(`🔑 Removing ${crampKeys.length} storage keys:`, crampKeys);

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROFILES,
        STORAGE_KEYS.ACTIVE_PROFILE,
        STORAGE_KEYS.FIRST_LAUNCH,
        STORAGE_KEYS.APP_SETTINGS,
      ]);

      // Also remove any other app-related keys
      if (crampKeys.length > 0) {
        await AsyncStorage.multiRemove(crampKeys);
      }

      console.log("✅ All data cleared successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to clear all data:", error);
      return false;
    }
  }

  /**
   * Export all data for backup
   */
  public async exportData(): Promise<string> {
    try {
      console.log("📤 Exporting all data...");

      const profiles = await this.getProfiles();
      const activeProfileId = await this.getActiveProfileId();
      const stats = await this.getStorageStats();

      const exportData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        deviceInfo: {
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        statistics: stats,
        data: {
          profiles,
          activeProfileId,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      console.log(
        `📊 Export completed: ${(jsonString.length / 1024).toFixed(2)} KB`
      );

      return jsonString;
    } catch (error) {
      console.error("❌ Failed to export data:", error);
      throw new Error(
        "Export failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Developer method: Log storage usage and statistics
   */
  public async logStorageUsage(): Promise<void> {
    try {
      const profiles = await this.getProfiles();
      const activeProfileId = await this.getActiveProfileId();

      console.log("📊 === STORAGE USAGE REPORT ===");
      console.log(`📱 Total Profiles: ${profiles.length}`);
      console.log(`🎯 Active Profile: ${activeProfileId || "None"}`);

      let totalCycles = 0;
      let totalSymptoms = 0;
      let totalNotes = 0;

      profiles.forEach((profile, index) => {
        console.log(
          `\n👤 Profile ${index + 1}: ${profile.emoji} ${
            profile.name || "Unnamed"
          }`
        );
        console.log(`   📅 Cycles: ${profile.cycles.length}`);
        console.log(`   🩸 Symptoms: ${profile.symptoms.length}`);
        console.log(`   📝 Notes: ${profile.notes.length}`);
        console.log(
          `   🕐 Created: ${new Date(profile.createdAt).toLocaleDateString()}`
        );
        console.log(
          `   ⏰ Last Active: ${new Date(
            profile.lastActive
          ).toLocaleDateString()}`
        );

        totalCycles += profile.cycles.length;
        totalSymptoms += profile.symptoms.length;
        totalNotes += profile.notes.length;
      });

      console.log(`\n📈 TOTALS:`);
      console.log(`   📅 Total Cycles: ${totalCycles}`);
      console.log(`   🩸 Total Symptoms: ${totalSymptoms}`);
      console.log(`   📝 Total Notes: ${totalNotes}`);

      // Check storage size
      const allKeys = await AsyncStorage.getAllKeys();
      const crampKeys = allKeys.filter(
        (key) => key.startsWith("cramp_") || key.includes("cramppanchayat")
      );
      console.log(`\n💾 Storage Keys: ${crampKeys.length}`);
      crampKeys.forEach((key) => console.log(`   🔑 ${key}`));

      console.log("📊 === END STORAGE REPORT ===\n");
    } catch (error) {
      console.error("❌ Failed to log storage usage:", error);
    }
  }

  /**
   * Developer method: Get detailed storage statistics
   */
  public async getStorageStats(): Promise<{
    profileCount: number;
    totalCycles: number;
    totalSymptoms: number;
    totalNotes: number;
    storageKeys: string[];
    estimatedSize: string;
  }> {
    try {
      const profiles = await this.getProfiles();
      const allKeys = await AsyncStorage.getAllKeys();
      const crampKeys = allKeys.filter(
        (key) => key.startsWith("cramp_") || key.includes("cramppanchayat")
      );

      let totalCycles = 0;
      let totalSymptoms = 0;
      let totalNotes = 0;

      profiles.forEach((profile) => {
        totalCycles += profile.cycles.length;
        totalSymptoms += profile.symptoms.length;
        totalNotes += profile.notes.length;
      });

      // Rough estimate of storage size
      const dataString = JSON.stringify(profiles);
      const estimatedSize = `${(dataString.length / 1024).toFixed(2)} KB`;

      return {
        profileCount: profiles.length,
        totalCycles,
        totalSymptoms,
        totalNotes,
        storageKeys: crampKeys,
        estimatedSize,
      };
    } catch (error) {
      console.error("Failed to get storage stats:", error);
      throw error;
    }
  }

  /**
   * Public helper to safely get items from storage (for use by other services)
   */
  public async getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
    return this.safeGetItem(key, defaultValue);
  }

  /**
   * Public helper to safely set items to storage (for use by other services)
   */
  public async setStorageItem(key: string, value: any): Promise<boolean> {
    return this.safeSetItem(key, value);
  }

  /**
   * Public method to get custom data with default value
   */
  public async getCustomData<T>(key: string, defaultValue: T): Promise<T> {
    return this.safeGetItem(key, defaultValue);
  }

  /**
   * Public method to set custom data
   */
  public async setCustomData(key: string, value: any): Promise<boolean> {
    return this.safeSetItem(key, value);
  }
}

// Export both named and default for flexibility
export { StorageService };
export default StorageService;
