// CrampPanchayat Supabase Service
// Cloud data import/export service (not profile-based)

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  Profile,
  CycleRecord,
  SyncCredentials,
  SyncStatus,
  SymptomRecord,
  DailyNote,
  CyclePrediction,
} from "../types";
import { AppError, PrivacyUtils } from "../utils";
import { ENV_CONFIG } from "../constants";

// Cloud data structure for storage - includes ALL profile data
interface CloudPeriodData {
  cycles: CycleRecord[];
  symptoms: SymptomRecord[];
  notes: DailyNote[];
  predictions: CyclePrediction[];
  settings: any;
  lastUpdated: string;
}

// Get Supabase credentials from environment configuration
const SUPABASE_URL = ENV_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV_CONFIG.SUPABASE_ANON_KEY;

export class SupabaseService {
  private static client: SupabaseClient<Database> | null = null;
  private static isInitialized = false;

  /**
   * Check if Supabase is properly configured
   */
  static isConfigured(): boolean {
    const isConfigured =
      SUPABASE_URL !== "https://your-project.supabase.co" &&
      SUPABASE_ANON_KEY !== "your-anon-key" &&
      SUPABASE_URL &&
      SUPABASE_ANON_KEY;

    if (__DEV__) {
      console.log("🔍 Supabase Configuration Check:", {
        SUPABASE_URL: SUPABASE_URL ? "✅ Set" : "❌ Missing",
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        isConfigured: isConfigured ? "✅ Ready" : "❌ Not configured",
      });
    }

    return isConfigured;
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

        if (__DEV__) {
          console.log("✅ Supabase client initialized successfully");
        }
      } catch (error) {
        console.error("❌ Failed to initialize Supabase client:", error);
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
   * Check if username is available (for cloud account creation)
   */
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) {
        console.warn(
          "Supabase not configured - cannot check username availability"
        );
        return true; // Allow offline usage
      }

      console.log(`Checking username availability for: ${username}`);

      // Convert username to the dummy email format used in auth
      const dummyEmail = `${username}@cramppanchayat.local`;

      // Use Supabase RPC function to check if username exists
      // This is safer than creating temporary users
      const { data, error } = await client.rpc("check_username_exists", {
        email_to_check: dummyEmail,
      });

      if (error) {
        console.warn("Error checking username via RPC:", error);
        // If RPC fails, fall back to optimistic approach
        return true;
      }

      // RPC returns true if username exists, false if available
      const usernameExists = data === true;
      console.log(
        `Username ${username} availability check: ${
          usernameExists ? "NOT available" : "available"
        }`
      );
      return !usernameExists;
    } catch (error) {
      console.error("Error checking username availability:", error);
      // On any error, be optimistic to not block user
      return true;
    }
  }

  /**
   * Create account with username and password (for cloud data storage access)
   */
  static async createAccount(
    credentials: SyncCredentials
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      if (!client) {
        throw new Error("Supabase client not initialized");
      }

      // Skip username availability check for now to fix blocking issue
      // In production, implement proper duplicate handling via Supabase error codes
      console.log(`Creating account for username: ${credentials.username}`);

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
        // Handle duplicate email error specifically
        if (error.message.includes("User already registered")) {
          return {
            success: false,
            error: "Username is already taken. Please choose a different one.",
          };
        }

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
      if (!client) {
        throw new Error("Supabase client not initialized");
      }

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
      if (!client) return;

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
      if (!client) return null;

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
   * Export data TO cloud (upload current profile data to cloud storage)
   */
  static async exportDataToCloud(profile: Profile): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        throw new AppError({
          code: "SUPABASE_NOT_CONFIGURED",
          message: "Supabase client not initialized",
        });
      }

      const user = await this.getCurrentUser();
      if (!user) {
        throw new AppError({
          code: "USER_NOT_AUTHENTICATED",
          message: "User must be signed in to export data",
        });
      }

      console.log("Exporting data to cloud:", {
        profileId: profile.id,
        emoji: profile.emoji,
        cycles: profile.cycles?.length || 0,
        symptoms: profile.symptoms?.length || 0,
        notes: profile.notes?.length || 0,
        predictions: profile.predictions?.length || 0,
      });

      // Enhanced data validation before upload
      const validateAndSanitizeArray = (arr: any[], name: string): any[] => {
        if (!Array.isArray(arr)) {
          console.warn(
            `Invalid ${name} data - not an array, using empty array`
          );
          return [];
        }
        return arr.filter((item) => {
          if (!item || typeof item !== "object") {
            console.warn(`Filtering out invalid ${name} item:`, item);
            return false;
          }
          return true;
        });
      };

      const validateSettings = (settings: any): any => {
        if (!settings || typeof settings !== "object") {
          console.warn("Invalid settings, using empty object");
          return {};
        }
        return settings;
      };

      // Prepare period data for cloud storage - include ALL profile data with validation
      const cloudData: CloudPeriodData = {
        cycles: validateAndSanitizeArray(profile.cycles || [], "cycles"),
        symptoms: validateAndSanitizeArray(profile.symptoms || [], "symptoms"),
        notes: validateAndSanitizeArray(profile.notes || [], "notes"),
        predictions: validateAndSanitizeArray(
          profile.predictions || [],
          "predictions"
        ),
        settings: validateSettings(profile.settings || {}),
        lastUpdated: new Date().toISOString(),
      };

      console.log("Cloud data prepared and validated for upload:", {
        cycles: cloudData.cycles.length,
        symptoms: cloudData.symptoms.length,
        notes: cloudData.notes.length,
        predictions: cloudData.predictions.length,
        settingsKeys: Object.keys(cloudData.settings),
        validCycles: cloudData.cycles.filter((c) => c.id && c.startDate).length,
        validSymptoms: cloudData.symptoms.filter((s) => s.id && s.date).length,
        validNotes: cloudData.notes.filter((n) => n.id && n.date).length,
      });

      // Debug: Check authentication status before upsert
      const { data: authUser, error: authError } = await client.auth.getUser();
      if (authError || !authUser?.user) {
        console.error("Authentication check failed:", authError);
        throw new AppError({
          code: "AUTHENTICATION_ERROR",
          message: "User not properly authenticated for data export",
          details: authError,
        });
      }

      console.log("Authentication verified for user:", authUser.user.id);

      // Try upsert with explicit user_id matching auth user
      const upsertData = {
        user_id: authUser.user.id, // Use auth user ID explicitly
        period_data: cloudData,
      };

      console.log("Attempting upsert with data:", {
        user_id: upsertData.user_id,
        period_data_keys: Object.keys(upsertData.period_data),
      });

      // Upsert the data (insert or update)
      const { error } = await client.from("user_data").upsert(upsertData, {
        onConflict: "user_id",
      });

      if (error) {
        console.error("Export data error:", error);

        // If RLS error, try alternative approach
        if (error.code === "42501") {
          console.log(
            "RLS policy violation detected, trying manual insert/update..."
          );

          // Check if record exists first
          const { data: existingData, error: selectError } = await client
            .from("user_data")
            .select("id")
            .eq("user_id", authUser.user.id)
            .single();

          if (selectError && selectError.code !== "PGRST116") {
            console.error("Error checking existing data:", selectError);
          }

          if (existingData) {
            // Record exists, try update
            console.log("Record exists, attempting update...");
            const { error: updateError } = await client
              .from("user_data")
              .update({ period_data: cloudData })
              .eq("user_id", authUser.user.id);

            if (updateError) {
              console.error("Update failed:", updateError);
              throw new AppError({
                code: "SUPABASE_UPDATE_ERROR",
                message: "Failed to update existing data in cloud",
                details: updateError,
              });
            }
          } else {
            // Record doesn't exist, try insert
            console.log("Record doesn't exist, attempting insert...");
            const { error: insertError } = await client
              .from("user_data")
              .insert({
                user_id: authUser.user.id,
                period_data: cloudData,
              });

            if (insertError) {
              console.error("Insert failed:", insertError);
              throw new AppError({
                code: "SUPABASE_INSERT_ERROR",
                message: "Failed to insert new data to cloud",
                details: insertError,
              });
            }
          }

          console.log("Manual insert/update completed successfully");
        } else {
          throw new AppError({
            code: "SUPABASE_EXPORT_ERROR",
            message: "Failed to export data to cloud",
            details: error,
          });
        }
      } else {
        console.log("Upsert completed successfully");
      }

      console.log("Data exported to cloud successfully with full validation");
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error exporting data to cloud:", error);
      throw new AppError({
        code: "SUPABASE_EXPORT_ERROR",
        message: "Failed to export data to cloud",
        details: error,
      });
    }
  }

  /**
   * Import data FROM cloud (download and return period data)
   */
  static async importDataFromCloud(): Promise<{
    hasData: boolean;
    data?: CloudPeriodData;
  }> {
    try {
      const client = this.getClient();
      if (!client) {
        throw new AppError({
          code: "SUPABASE_NOT_CONFIGURED",
          message: "Supabase client not initialized",
        });
      }

      const user = await this.getCurrentUser();
      if (!user) {
        throw new AppError({
          code: "USER_NOT_AUTHENTICATED",
          message: "User must be signed in to import data",
        });
      }

      console.log("Importing data from cloud for user:", user.id);

      // Get user data from cloud
      const { data: userData, error } = await client
        .from("user_data")
        .select("period_data")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No data found
          console.log("No cloud data found for user");
          return { hasData: false };
        }

        console.error("Import data error:", error);
        throw new AppError({
          code: "SUPABASE_IMPORT_ERROR",
          message: "Failed to import data from cloud",
          details: error,
        });
      }

      if (!userData || !userData.period_data) {
        console.log("No period data found in cloud");
        return { hasData: false };
      }

      // Enhanced data validation and sanitization
      const rawData = userData.period_data;

      // Validate and sanitize arrays
      const validateArray = (arr: any, name: string): any[] => {
        if (!arr) return [];
        if (!Array.isArray(arr)) {
          console.warn(
            `Invalid ${name} data - not an array, converting to empty array`
          );
          return [];
        }
        return arr.filter((item) => item && typeof item === "object");
      };

      // Validate and sanitize settings object
      const validateSettings = (settings: any): any => {
        if (!settings || typeof settings !== "object") {
          console.warn("Invalid settings data - using empty object");
          return {};
        }
        return settings;
      };

      // Ensure all required fields exist with proper validation
      const safeCloudData: CloudPeriodData = {
        cycles: validateArray(rawData.cycles, "cycles"),
        symptoms: validateArray(rawData.symptoms, "symptoms"),
        notes: validateArray(rawData.notes, "notes"),
        predictions: validateArray(rawData.predictions, "predictions"),
        settings: validateSettings(rawData.settings),
        lastUpdated:
          rawData.lastUpdated && typeof rawData.lastUpdated === "string"
            ? rawData.lastUpdated
            : new Date().toISOString(),
      };

      // Additional data integrity checks
      console.log("Cloud data imported and validated successfully:", {
        cycles: safeCloudData.cycles.length,
        symptoms: safeCloudData.symptoms.length,
        notes: safeCloudData.notes.length,
        predictions: safeCloudData.predictions.length,
        settingsKeys: Object.keys(safeCloudData.settings),
        lastUpdated: safeCloudData.lastUpdated,
        validCycles: safeCloudData.cycles.filter((c) => c.id && c.startDate)
          .length,
        validSymptoms: safeCloudData.symptoms.filter((s) => s.id && s.date)
          .length,
        validNotes: safeCloudData.notes.filter((n) => n.id && n.date).length,
      });

      return {
        hasData: true,
        data: safeCloudData,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error importing data from cloud:", error);
      throw new AppError({
        code: "SUPABASE_IMPORT_ERROR",
        message: "Failed to import data from cloud",
        details: error,
      });
    }
  }

  /**
   * Check connection status
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;

      const { data, error } = await client
        .from("user_data")
        .select("count")
        .limit(1);

      return !error;
    } catch (error) {
      console.error("Error checking connection:", error);
      return false;
    }
  }

  /**
   * Delete account and all data
   */
  static async deleteAccount(): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        throw new AppError({
          code: "SUPABASE_NOT_CONFIGURED",
          message: "Supabase client not initialized",
        });
      }

      const user = await this.getCurrentUser();
      if (!user) {
        throw new AppError({
          code: "USER_NOT_AUTHENTICATED",
          message: "User must be signed in to delete account",
        });
      }

      console.log("Deleting account and all data for user:", user.id);

      // Step 1: Delete user data from database
      const { error: dataError } = await client
        .from("user_data")
        .delete()
        .eq("user_id", user.id);

      if (dataError) {
        console.error("Error deleting user data:", dataError);
        throw new AppError({
          code: "SUPABASE_DELETE_ERROR",
          message: "Failed to delete user data",
          details: dataError,
        });
      }

      console.log("User data deleted successfully");

      // Step 2: Delete the authentication user using the comprehensive function
      try {
        // Use the comprehensive delete function that handles everything
        // Pass the user ID as target_user_id parameter (matching SQL function parameter name)
        const { data, error: rpcError } = await client.rpc(
          "delete_user_complete",
          {
            target_user_id: user.id,
          }
        );

        if (rpcError) {
          console.log(
            "Comprehensive delete function not available, trying individual methods..."
          );

          // Fallback 1: Try basic delete_user RPC function
          const { error: basicRpcError } = await client.rpc("delete_user", {
            target_user_id: user.id,
          });

          if (basicRpcError) {
            console.log(
              "Basic RPC delete_user not available, trying admin API delete..."
            );

            // Fallback 2: Try using admin.deleteUser (requires service role key)
            const { error: adminError } = await client.auth.admin.deleteUser(
              user.id
            );

            if (adminError) {
              console.error("Admin delete failed:", adminError);

              // Fallback 3: Call a custom edge function for user deletion
              try {
                const { error: edgeFunctionError } =
                  await client.functions.invoke("delete-user", {
                    body: { userId: user.id },
                  });

                if (edgeFunctionError) {
                  console.error(
                    "Edge function delete failed:",
                    edgeFunctionError
                  );
                  throw new Error("All deletion methods failed");
                } else {
                  console.log("User deleted via edge function successfully");
                }
              } catch (edgeError) {
                console.error("Edge function not available:", edgeError);
                throw new Error(
                  "All deletion methods failed - user data deleted but auth user remains"
                );
              }
            } else {
              console.log("User deleted via admin API successfully");
            }
          } else {
            console.log("User deleted via basic RPC function successfully");
          }
        } else {
          console.log("User deleted via comprehensive function successfully");
          if (data && !data.success) {
            console.error("Deletion function returned error:", data.message);
            throw new Error(data.message);
          }
        }
      } catch (deleteError) {
        console.warn("Could not delete auth user:", deleteError);

        // Final fallback: Sign out and warn user
        try {
          const { error: signOutError } = await client.auth.signOut();
          if (signOutError) {
            console.warn("Error signing out user:", signOutError);
          } else {
            console.log(
              "User signed out successfully - data deleted but auth user may remain"
            );
          }

          // Throw a specific error to inform the user
          throw new AppError({
            code: "PARTIAL_DELETE_SUCCESS",
            message:
              "Your data has been deleted successfully, but you may need to contact support to fully remove your account from our authentication system.",
          });
        } catch (signOutError) {
          console.warn("Could not sign out user:", signOutError);
          throw new AppError({
            code: "DELETE_INCOMPLETE",
            message:
              "Data deletion completed but could not fully remove account. Please contact support.",
          });
        }
      }

      console.log("Account deletion completed successfully");
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
      if (!client) return;

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

  /**
   * Get cloud user statistics (unique users only)
   */
  static async getCloudUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    error?: string;
  }> {
    try {
      const client = this.getClient();
      if (!client) {
        return {
          totalUsers: 0,
          activeUsers: 0,
          error: "Supabase not configured",
        };
      }

      // Count unique users in user_data table (these are actual cloud users)
      const { data: userData, error: userError } = await client
        .from("user_data")
        .select("user_id", { count: "exact" });

      if (userError) {
        console.error("Error getting user statistics:", userError);
        return {
          totalUsers: 0,
          activeUsers: 0,
          error: "Failed to fetch user statistics",
        };
      }

      const totalUsers = userData ? userData.length : 0;

      // For now, consider all users as active
      // In the future, you could filter by last_updated date
      const activeUsers = totalUsers;

      console.log("Cloud user statistics:", { totalUsers, activeUsers });

      return {
        totalUsers,
        activeUsers,
      };
    } catch (error) {
      console.error("Error getting cloud user statistics:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        error: "Failed to fetch user statistics",
      };
    }
  }
}

// Export a default configured instance
export default SupabaseService;
