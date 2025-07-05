// CrampPanchayat Profile Management Hook - Rebuilt for Reliability
// Comprehensive hook for managing profiles with proper state management

import { useState, useEffect, useCallback } from "react";
import { Profile, EmojiType } from "../types";
import { StorageService } from "../services/storage";

interface UseProfilesState {
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  switching: boolean; // New state for profile switching
  error: string | null;
}

interface UseProfilesActions {
  createProfile: (emoji: EmojiType, name?: string) => Promise<Profile>;
  selectProfile: (profileId: string) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  updateProfile: (
    profileId: string,
    updates: Partial<Profile>
  ) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  clearError: () => void;
}

type UseProfilesReturn = UseProfilesState & UseProfilesActions;

/**
 * Comprehensive hook for profile management with robust error handling
 */
export function useProfiles(): UseProfilesReturn {
  const [state, setState] = useState<UseProfilesState>({
    profiles: [],
    activeProfile: null,
    loading: true,
    switching: false,
    error: null,
  });

  // Get storage instance
  const storage = StorageService.getInstance();

  /**
   * Update state safely with partial updates
   */
  const updateState = useCallback((updates: Partial<UseProfilesState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Load all profiles and active profile from storage
   */
  const loadProfiles = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });

      // Load all profiles
      const profiles = await storage.getProfiles();

      // Load active profile
      const activeProfile = await storage.getActiveProfile();

      updateState({
        profiles,
        activeProfile,
        loading: false,
      });

      console.log(
        `Loaded ${profiles.length} profiles, active: ${
          activeProfile?.emoji || "none"
        }`
      );
    } catch (error) {
      console.error("Error loading profiles:", error);
      updateState({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load profiles",
      });
    }
  }, [updateState]);

  /**
   * Create a new profile with comprehensive validation and auto-switching
   */
  const createProfile = useCallback(
    async (emoji: EmojiType, name?: string): Promise<Profile> => {
      try {
        updateState({ error: null, switching: true });

        // Check if emoji is already taken
        if (state.profiles.some((p) => p.emoji === emoji)) {
          throw new Error(
            "This emoji is already being used by another profile"
          );
        }

        console.log(`🆕 Creating new profile: ${emoji} ${name || "(unnamed)"}`);

        // Auto sign out from cloud when creating new profile - ensures profile independence
        try {
          const { CloudSyncService } = await import("../services/cloudSync");
          const cloudSync = CloudSyncService.getInstance();
          console.log(
            "🔐 Auto-signing out from cloud for profile independence..."
          );
          await cloudSync.handleProfileSwitch();
          console.log(
            "✅ Auto-signed out from cloud due to new profile creation"
          );
        } catch (cloudError) {
          console.warn("⚠️ Could not auto-signout from cloud:", cloudError);
          // Continue with profile creation even if cloud signout fails
        }

        const storage = StorageService.getInstance();
        // Create profile and automatically set it as active
        const newProfile = await storage.createProfile(emoji, name, true);

        // Update local state
        const updatedProfiles = [...state.profiles, newProfile];
        updateState({
          profiles: updatedProfiles,
          activeProfile: newProfile, // Auto-switch to new profile
          switching: false,
        });

        console.log(
          `✅ Created and switched to profile: ${emoji} ${name || "(unnamed)"}`
        );
        return newProfile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create profile";
        updateState({ error: errorMessage, switching: false });
        throw error;
      }
    },
    [state.profiles, updateState]
  );

  /**
   * Select and activate a profile with enhanced loading states
   */
  const selectProfile = useCallback(
    async (profileId: string): Promise<void> => {
      try {
        updateState({ error: null, switching: true });

        // Find the profile in our current state
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) {
          throw new Error("Profile not found");
        }

        console.log(
          `🔄 Switching to profile: ${profile.emoji} ${
            profile.name || "(unnamed)"
          }`
        );

        // Auto sign out from cloud when switching profiles - ensures profile independence
        try {
          const { CloudSyncService } = await import("../services/cloudSync");
          const cloudSync = CloudSyncService.getInstance();
          console.log(
            "🔐 Auto-signing out from cloud for profile independence..."
          );
          await cloudSync.handleProfileSwitch();
          console.log("✅ Auto-signed out from cloud due to profile switch");
        } catch (cloudError) {
          console.warn("⚠️ Could not auto-signout from cloud:", cloudError);
          // Continue with profile switch even if cloud signout fails
        }

        // Set as active in storage
        await storage.setActiveProfile(profileId);

        // Update local state
        updateState({ activeProfile: profile, switching: false });

        console.log(
          `✅ Selected profile: ${profile.emoji} ${profile.name || "(unnamed)"}`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to select profile";
        updateState({ error: errorMessage, switching: false });
        throw error;
      }
    },
    [state.profiles, updateState]
  );

  /**
   * Delete a profile with improved selection logic
   */
  const deleteProfile = useCallback(
    async (profileId: string): Promise<void> => {
      try {
        updateState({ error: null });

        // Find the current profile index before deletion
        const currentIndex = state.profiles.findIndex(
          (p) => p.id === profileId
        );
        if (currentIndex === -1) {
          throw new Error("Profile not found");
        }

        // Delete from storage
        await storage.deleteProfile(profileId);

        // Update local state
        const updatedProfiles = state.profiles.filter(
          (p) => p.id !== profileId
        );
        let updatedActiveProfile =
          state.activeProfile?.id === profileId ? null : state.activeProfile;

        // Smart profile selection logic
        if (
          state.activeProfile?.id === profileId &&
          updatedProfiles.length > 0
        ) {
          // Select the previous profile if possible, otherwise the next one
          let targetProfile;
          if (currentIndex > 0) {
            // Select the profile that was before this one
            targetProfile = state.profiles[currentIndex - 1];
          } else {
            // If this was the first profile, select what becomes the first
            targetProfile = updatedProfiles[0];
          }

          updatedActiveProfile = targetProfile;
          // Also update storage to set this as active
          await storage.setActiveProfile(updatedActiveProfile.id);
          console.log(
            `Auto-selected profile: ${updatedActiveProfile.emoji} ${
              updatedActiveProfile.name || "Unnamed"
            }`
          );
        }

        updateState({
          profiles: updatedProfiles,
          activeProfile: updatedActiveProfile,
        });

        console.log(`Deleted profile: ${profileId}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete profile";
        updateState({ error: errorMessage });
        throw error;
      }
    },
    [state.profiles, state.activeProfile, updateState]
  );

  /**
   * Update an existing profile
   */
  const updateProfile = useCallback(
    async (profileId: string, updates: Partial<Profile>): Promise<void> => {
      try {
        updateState({ error: null });

        const updatedProfile = await storage.updateProfile(profileId, updates);
        if (!updatedProfile) {
          throw new Error("Failed to update profile");
        }

        // Update local state
        const updatedProfiles = state.profiles.map((p) =>
          p.id === profileId ? updatedProfile : p
        );

        const updatedActiveProfile =
          state.activeProfile?.id === profileId
            ? updatedProfile
            : state.activeProfile;

        updateState({
          profiles: updatedProfiles,
          activeProfile: updatedActiveProfile,
        });

        console.log(`Updated profile: ${profileId}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update profile";
        updateState({ error: errorMessage });
        throw error;
      }
    },
    [state.profiles, state.activeProfile, updateState]
  );

  /**
   * Refresh profiles from storage
   */
  const refreshProfiles = useCallback(async (): Promise<void> => {
    await loadProfiles();
  }, [loadProfiles]);

  /**
   * Clear any error state
   */
  const clearError = useCallback((): void => {
    updateState({ error: null });
  }, [updateState]);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return {
    // State
    profiles: state.profiles,
    activeProfile: state.activeProfile,
    loading: state.loading,
    switching: state.switching,
    error: state.error,

    // Actions
    createProfile,
    selectProfile,
    deleteProfile,
    updateProfile,
    refreshProfiles,
    clearError,
  };
}

/**
 * Hook for getting just the active profile (lightweight)
 */
export function useActiveProfile() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveProfile = async () => {
      try {
        setLoading(true);
        const storage = StorageService.getInstance();
        const profile = await storage.getActiveProfile();
        setActiveProfile(profile);
      } catch (error) {
        console.error("Error loading active profile:", error);
        setActiveProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadActiveProfile();
  }, []);

  return { activeProfile, loading };
}
