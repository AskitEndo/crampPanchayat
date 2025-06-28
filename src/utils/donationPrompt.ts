// Donation Prompt Utility - Handles when to show donation prompts
// Manages donation prompt logic based on user settings and events

import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { StorageService } from "../services/storage";

export class DonationPromptManager {
  private static instance: DonationPromptManager;

  private constructor() {}

  public static getInstance(): DonationPromptManager {
    if (!DonationPromptManager.instance) {
      DonationPromptManager.instance = new DonationPromptManager();
    }
    return DonationPromptManager.instance;
  }

  /**
   * Check if donation prompts are enabled for the active profile
   */
  async isDonationPromptsEnabled(
    forFirstProfile: boolean = false
  ): Promise<boolean> {
    try {
      const storage = StorageService.getInstance();
      const activeProfile = await storage.getActiveProfile();

      // For first profile creation, default to enabled since no profile exists yet
      if (forFirstProfile && !activeProfile) {
        return true;
      }

      return activeProfile?.settings.donationPrompts ?? true;
    } catch (error) {
      console.error("Error checking donation prompts setting:", error);
      return true; // Default to enabled if error
    }
  }

  /**
   * Show donation prompt if enabled
   */
  async showDonationPromptIfEnabled(
    navigation: NavigationProp<RootStackParamList>,
    reason:
      | "profile_created"
      | "cycle_started"
      | "cycle_completed"
      | "period_confirmed"
  ): Promise<void> {
    const isFirstProfile = reason === "profile_created";
    const isEnabled = await this.isDonationPromptsEnabled(isFirstProfile);

    if (isEnabled) {
      console.log(`Showing donation prompt for: ${reason}`);
      navigation.navigate("Support", { showDonationPrompt: true });
    } else {
      console.log(`Donation prompts disabled, skipping prompt for: ${reason}`);
    }
  }

  /**
   * Toggle donation prompts setting for active profile
   */
  async toggleDonationPrompts(enabled: boolean): Promise<void> {
    try {
      const storage = StorageService.getInstance();
      const activeProfile = await storage.getActiveProfile();

      if (activeProfile) {
        const updatedSettings = {
          ...activeProfile.settings,
          donationPrompts: enabled,
        };

        await storage.updateProfile(activeProfile.id, {
          settings: updatedSettings,
        });
        console.log(`Donation prompts ${enabled ? "enabled" : "disabled"}`);
      }
    } catch (error) {
      console.error("Error toggling donation prompts:", error);
      throw error;
    }
  }
}

export const donationPromptManager = DonationPromptManager.getInstance();
