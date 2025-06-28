// CrampPanchayat Supabase Service
// Optional cloud sync with privacy-first approach

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import {
  Database,
  Profile,
  CycleRecord,
  SyncCredentials,
  SyncStatus,
} from "../types";
import { AppError, PrivacyUtils } from "../utils";

// Get Supabase credentials from environment variables
const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://your-project.supabase.co";
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "your-anon-key";

export class SupabaseService {
  private static client: SupabaseClient<Database> | null = null;
  private static isInitialized = false;

  /**
   * Check if Supabase is properly configured
   */
  static isConfigured(): boolean {
    return (
      SUPABASE_URL !== "https://your-project.supabase.co" &&
      SUPABASE_ANON_KEY !== "your-anon-key" &&
      SUPABASE_URL &&
      SUPABASE_ANON_KEY
    );
  }

  /**
   * Initialize Supabase client
   */
  static initialize(): SupabaseClient<Database> | null {
    if (!this.isConfigured()) {
      console.warn(
        "Supabase credentials not configured. Cloud sync will be disabled."
      );
      return null;
    }

    if (!this.client) {
      try {
        this.client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isInitialized = true;
        console.log("Supabase client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
        return null;
      }
    }
    return this.client;
  }

  /**
   * Get Supabase client instance
   */
  static getClient(): SupabaseClient<Database> | null {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }

  /**
   * Check if username is available
   */
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) {
        console.warn(
          "Supabase not configured - cannot check username availability"
        );
        return false;
      }

      const { data, error } = await client.auth.admin.listUsers();

      if (error) {
        console.error("Error checking username availability:", error);
        return false;
      }

      // Check if username exists in metadata
      const existingUser = data.users.find(
        (user: any) => user.user_metadata?.username === username
      );

      return !existingUser;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  }

  /**
   * Create account with username and password (no email required)
   */
  static async createAccount(
    credentials: SyncCredentials
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();

      // Check username availability first
      const isAvailable = await this.checkUsernameAvailability(
        credentials.username
      );
      if (!isAvailable) {
        return {
          success: false,
          error: "Username is already taken. Please choose a different one.",
        };
      }

      // Create a dummy email for Supabase auth (not exposed to user)
      const dummyEmail = `${credentials.username}@cramppanchayat.local`;

      const { data, error } = await client.auth.signUp({
        email: dummyEmail,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            is_anonymous: true,
            created_via: "cramppanchayat_app",
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error creating account:", error);
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }
  }

  /**
   * Sign in with username and password
   */
  static async signIn(
    credentials: SyncCredentials
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();

      // Convert username to dummy email
      const dummyEmail = `${credentials.username}@cramppanchayat.local`;

      const { data, error } = await client.auth.signInWithPassword({
        email: dummyEmail,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: "Invalid username or password.",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error signing in:", error);
      return {
        success: false,
        error: "Failed to sign in. Please try again.",
      };
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      const client = this.getClient();
      await client.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      throw new AppError({
        code: "SUPABASE_SIGNOUT_ERROR",
        message: "Failed to sign out",
        details: error,
      });
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const client = this.getClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Sync profile to cloud
   */
  static async syncProfileToCloud(profile: Profile): Promise<void> {
    try {
      const client = this.getClient();
      const user = await this.getCurrentUser();

      if (!user) {
        throw new AppError({
          code: "USER_NOT_AUTHENTICATED",
          message: "User must be signed in to sync data",
        });
      }

      // Prepare profile data for cloud storage (remove local IDs)
      const cloudProfile = {
        user_id: user.id,
        emoji: profile.emoji,
        settings: profile.settings,
        created_at: profile.createdAt,
        updated_at: profile.lastActive,
      };

      const { error } = await client.from("profiles").upsert(cloudProfile);

      if (error) {
        throw new AppError({
          code: "SUPABASE_SYNC_PROFILE_ERROR",
          message: "Failed to sync profile to cloud",
          details: error,
        });
      }

      // Sync cycles
      await this.syncCyclesToCloud(profile.cycles, user.id);
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error syncing profile to cloud:", error);
      throw new AppError({
        code: "SUPABASE_SYNC_ERROR",
        message: "Failed to sync data to cloud",
        details: error,
      });
    }
  }

  /**
   * Sync cycles to cloud
   */
  static async syncCyclesToCloud(
    cycles: CycleRecord[],
    userId: string
  ): Promise<void> {
    try {
      const client = this.getClient();

      // Get profile ID from cloud
      const { data: profileData } = await client
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!profileData) {
        throw new AppError({
          code: "PROFILE_NOT_FOUND",
          message: "Profile not found in cloud storage",
        });
      }

      // Prepare cycles data for cloud storage
      const cloudCycles = cycles.map((cycle) => ({
        profile_id: profileData.id,
        start_date: cycle.startDate,
        end_date: cycle.endDate,
        period_days: cycle.periodDays,
        symptoms: cycle.symptoms,
        notes: cycle.notes,
        created_at: cycle.createdAt,
        updated_at: cycle.updatedAt,
      }));

      // Delete existing cycles and insert new ones
      await client.from("cycles").delete().eq("profile_id", profileData.id);

      if (cloudCycles.length > 0) {
        const { error } = await client.from("cycles").insert(cloudCycles);

        if (error) {
          throw new AppError({
            code: "SUPABASE_SYNC_CYCLES_ERROR",
            message: "Failed to sync cycles to cloud",
            details: error,
          });
        }
      }
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error syncing cycles to cloud:", error);
      throw new AppError({
        code: "SUPABASE_SYNC_CYCLES_ERROR",
        message: "Failed to sync cycles to cloud",
        details: error,
      });
    }
  }

  /**
   * Sync profile from cloud
   */
  static async syncProfileFromCloud(): Promise<Profile | null> {
    try {
      const client = this.getClient();
      const user = await this.getCurrentUser();

      if (!user) {
        throw new AppError({
          code: "USER_NOT_AUTHENTICATED",
          message: "User must be signed in to sync data",
        });
      }

      // Get profile from cloud
      const { data: profileData, error: profileError } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profileData) {
        return null; // No profile found
      }

      // Get cycles from cloud
      const { data: cyclesData, error: cyclesError } = await client
        .from("cycles")
        .select("*")
        .eq("profile_id", profileData.id)
        .order("created_at", { ascending: true });

      if (cyclesError) {
        console.error("Error fetching cycles:", cyclesError);
      }

      // Convert cloud data to local format
      const localProfile: Profile = {
        id: `cloud_${profileData.id}`,
        emoji: profileData.emoji,
        createdAt: profileData.created_at,
        lastActive: profileData.updated_at || profileData.created_at,
        settings: profileData.settings,
        cycles: (cyclesData || []).map((cycle) => ({
          id: `cloud_${cycle.id}`,
          profileId: `cloud_${profileData.id}`,
          startDate: cycle.start_date,
          endDate: cycle.end_date,
          periodDays: cycle.period_days,
          symptoms: cycle.symptoms,
          notes: cycle.notes,
          createdAt: cycle.created_at,
          updatedAt: cycle.updated_at,
        })),
        symptoms: [], // Would be populated from cycles
        notes: [], // Would be populated from cycles
        predictions: [], // Would be calculated locally
      };

      return localProfile;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error syncing profile from cloud:", error);
      throw new AppError({
        code: "SUPABASE_SYNC_FROM_CLOUD_ERROR",
        message: "Failed to sync data from cloud",
        details: error,
      });
    }
  }

  /**
   * Delete account and all data
   */
  static async deleteAccount(): Promise<void> {
    try {
      const client = this.getClient();
      const user = await this.getCurrentUser();

      if (!user) {
        throw new AppError({
          code: "USER_NOT_AUTHENTICATED",
          message: "User must be signed in to delete account",
        });
      }

      // Delete user data from database
      const { data: profileData } = await client
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        // Delete cycles first (due to foreign key constraints)
        await client.from("cycles").delete().eq("profile_id", profileData.id);

        // Delete profile
        await client.from("profiles").delete().eq("id", profileData.id);
      }

      // Delete auth user (requires admin access in production)
      // This would typically be handled by a server-side function
      console.log(
        "Account data deleted. Auth user deletion requires admin access."
      );
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error deleting account:", error);
      throw new AppError({
        code: "SUPABASE_DELETE_ACCOUNT_ERROR",
        message: "Failed to delete account",
        details: error,
      });
    }
  }

  /**
   * Log analytics event
   */
  static async logAnalyticsEvent(
    eventName: string,
    properties: Record<string, any> = {},
    platform: string = "mobile"
  ): Promise<void> {
    try {
      const client = this.getClient();

      // Generate anonymous user ID
      const anonymousUserId = PrivacyUtils.generateAnonymousId();

      const { error } = await client.from("analytics_events").insert({
        user_id: anonymousUserId,
        event_name: eventName,
        properties,
        platform,
      });

      if (error) {
        console.error("Error logging analytics event:", error);
        // Don't throw error for analytics to prevent disrupting main app flow
      }
    } catch (error) {
      console.error("Error logging analytics event:", error);
      // Don't throw error for analytics
    }
  }

  /**
   * Check connection status
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from("profiles")
        .select("count")
        .limit(1);

      return !error;
    } catch (error) {
      console.error("Error checking connection:", error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    try {
      const user = await this.getCurrentUser();
      const isConnected = await this.checkConnection();

      return {
        isEnabled: !!user && isConnected,
        lastSync: new Date().toISOString(), // Would track actual last sync time
        isLoading: false,
      };
    } catch (error) {
      console.error("Error getting sync status:", error);
      return {
        isEnabled: false,
        lastSync: "",
        isLoading: false,
        error: "Failed to check sync status",
      };
    }
  }
}

// Export a default configured instance
export default SupabaseService;
