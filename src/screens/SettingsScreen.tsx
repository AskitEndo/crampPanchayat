// Settings Screen - Individual profile settings and data management
// Allows export/delete of current profile data only

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { StorageService } from "../services/storage";
import { CloudSyncService } from "../services/cloudSync";

type SettingsNavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { activeProfile, profiles, refreshProfiles, selectProfile } =
    useProfiles();

  const [profileStats, setProfileStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cloudAccountsCount, setCloudAccountsCount] = useState(0);
  const [cloudAvailable, setCloudAvailable] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Define loadCloudAccountsCount function first
  const loadCloudAccountsCount = useCallback(async () => {
    try {
      setStatsLoading(true);
      // Add haptic feedback for user interaction
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // UNIVERSAL STATISTICS: Always show total cloud users regardless of sign-in status
      // This gives users an idea of how many people are using CrampPanchayat with cloud sync
      const { SupabaseService } = await import("../services/supabase");

      // Check if Supabase is configured first
      if (!SupabaseService.isConfigured()) {
        console.log("Supabase not configured - cloud statistics unavailable");
        setCloudAccountsCount(0);
        setCloudAvailable(false);
        return;
      }

      const cloudStats = await SupabaseService.getCloudUserStatistics();

      if (cloudStats.error) {
        console.warn(
          "Error getting universal cloud statistics:",
          cloudStats.error
        );
        // Show a user-friendly message instead of breaking
        setCloudAccountsCount(0);
        setCloudAvailable(false);
      } else {
        // Show total unique cloud users (universal count)
        setCloudAccountsCount(cloudStats.totalUsers);
        setCloudAvailable(true);
        console.log("Universal cloud statistics loaded:", cloudStats);
      }
    } catch (error) {
      console.error("Failed to load universal cloud statistics:", error);
      // On any error, default to 0 but don't break the UI
      setCloudAccountsCount(0);
      setCloudAvailable(false);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Force refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
  );

  // Load universal statistics when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadCloudAccountsCount();
    }, [loadCloudAccountsCount])
  );

  // Load profile statistics whenever activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      const stats = {
        cyclesTracked: activeProfile.cycles.length,
        symptomsLogged: activeProfile.symptoms?.length || 0,
        notesWritten: activeProfile.notes?.length || 0,
        createdDate: new Date(activeProfile.createdAt).toLocaleDateString(),
        lastActive: new Date(activeProfile.lastActive).toLocaleDateString(),
      };
      setProfileStats(stats);
    } else {
      setProfileStats(null);
    }

    // UNIVERSAL: Always load cloud statistics regardless of profile status
    loadCloudAccountsCount();
  }, [activeProfile, loadCloudAccountsCount]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfiles();
    setRefreshing(false);
  };

  const handleManageCloudAccounts = async () => {
    try {
      // SECURITY FIX: Only show cloud accounts from THIS device's profiles
      const deviceProfiles = await StorageService.getInstance().getProfiles();
      const deviceCloudAccounts = [];

      for (const profile of deviceProfiles) {
        try {
          // Temporarily switch to this profile to check its cloud status
          const originalActiveProfile =
            await StorageService.getInstance().getActiveProfile();
          await StorageService.getInstance().setActiveProfile(profile.id);

          const cloudSync = CloudSyncService.getInstance();
          const accounts = await cloudSync.getLinkedCloudAccounts();

          if (accounts.length > 0) {
            deviceCloudAccounts.push({
              profileId: profile.id,
              emoji: profile.emoji,
              name: profile.name || "Unnamed",
              accounts: accounts,
            });
          }

          // Restore original active profile
          if (originalActiveProfile) {
            await StorageService.getInstance().setActiveProfile(
              originalActiveProfile.id
            );
          }
        } catch (error) {
          console.warn(
            `Could not check cloud accounts for profile ${profile.emoji}:`,
            error
          );
        }
      }

      if (deviceCloudAccounts.length === 0) {
        Alert.alert(
          "No Cloud Accounts",
          "No cloud accounts are currently linked to profiles on this device. You can set up cloud sync from the Data Management section above.",
          [{ text: "OK" }]
        );
        return;
      }

      // Create device-specific account list (no sensitive info leaked)
      const accountDetails = deviceCloudAccounts
        .map(
          (profile) =>
            `${profile.emoji} ${profile.name}: ${profile.accounts.length} linked`
        )
        .join("\n");

      Alert.alert(
        "Device Cloud Accounts",
        `Profiles with cloud sync on this device:\n\n${accountDetails}\n\nFor security, only accounts linked on this device are shown.`,
        [
          {
            text: "Manage Account",
            onPress: () => handleUnlinkAccount(deviceCloudAccounts),
          },
          { text: "Close", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Error managing cloud accounts:", error);
      Alert.alert(
        "Error",
        "Failed to load cloud account information. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleUnlinkAccount = async (
    deviceAccounts: {
      profileId: string;
      emoji: string;
      name: string;
      accounts: string[];
    }[]
  ) => {
    try {
      if (deviceAccounts.length === 0) {
        Alert.alert("No Accounts", "No accounts available to unlink.", [
          { text: "OK" },
        ]);
        return;
      }

      // If there's only one profile with cloud accounts, directly manage it
      if (deviceAccounts.length === 1) {
        const profile = deviceAccounts[0];

        Alert.alert(
          "Manage Cloud Account",
          `Profile: ${profile.emoji} ${profile.name}\nCloud accounts linked: ${profile.accounts.length}\n\nChoose an action:`,
          [
            {
              text: "Sign Out & Unlink",
              onPress: async () => {
                try {
                  // Switch to this profile and sign out
                  const originalActiveProfile =
                    await StorageService.getInstance().getActiveProfile();
                  await StorageService.getInstance().setActiveProfile(
                    profile.profileId
                  );

                  const cloudSync = CloudSyncService.getInstance();
                  await cloudSync.signOut();

                  // Restore original active profile
                  if (originalActiveProfile) {
                    await StorageService.getInstance().setActiveProfile(
                      originalActiveProfile.id
                    );
                  }

                  // Reload the count
                  await loadCloudAccountsCount();

                  Alert.alert(
                    "Cloud Account Unlinked",
                    `Profile ${profile.emoji} ${profile.name} has been signed out and unlinked from cloud sync.`,
                    [{ text: "OK" }]
                  );
                } catch (error) {
                  console.error("Error unlinking account:", error);
                  Alert.alert(
                    "Error",
                    "Failed to unlink the account. Please try again.",
                    [{ text: "OK" }]
                  );
                }
              },
            },
            {
              text: "Delete Cloud Account",
              style: "destructive",
              onPress: async () => {
                Alert.alert(
                  "⚠️ Delete Cloud Account",
                  `This will PERMANENTLY delete the cloud account and ALL its data from our servers.\n\nThis action cannot be undone.\n\nAre you sure you want to completely delete this cloud account?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete Forever",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          // Switch to this profile and delete account
                          const originalActiveProfile =
                            await StorageService.getInstance().getActiveProfile();
                          await StorageService.getInstance().setActiveProfile(
                            profile.profileId
                          );

                          const cloudSync = CloudSyncService.getInstance();
                          const result = await cloudSync.deleteCloudAccount();

                          // Restore original active profile
                          if (originalActiveProfile) {
                            await StorageService.getInstance().setActiveProfile(
                              originalActiveProfile.id
                            );
                          }

                          if (result.success) {
                            // FIXED: Force refresh profiles to update local state after cloud deletion
                            await refreshProfiles();
                            await loadCloudAccountsCount();
                            Alert.alert(
                              "✅ Account Deleted & Unlinked",
                              `The cloud account for profile ${profile.emoji} ${profile.name} has been permanently deleted from our servers and automatically unlinked from this device.`,
                              [{ text: "OK" }]
                            );
                          } else {
                            Alert.alert(
                              "Error",
                              result.error ||
                                "Failed to delete cloud account. Please try again.",
                              [{ text: "OK" }]
                            );
                          }
                        } catch (error) {
                          console.error("Error deleting cloud account:", error);
                          Alert.alert(
                            "Error",
                            "Failed to delete cloud account. Please try again.",
                            [{ text: "OK" }]
                          );
                        }
                      },
                    },
                  ]
                );
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        // Multiple profiles - show selection
        const profileChoices = deviceAccounts.map((profile, index) => ({
          text: `${profile.emoji} ${profile.name} (${profile.accounts.length} linked)`,
          onPress: () => handleUnlinkAccount([profile]),
        }));

        Alert.alert(
          "Select Profile",
          "Choose which profile to manage cloud accounts for:",
          [...profileChoices, { text: "Cancel", style: "cancel" }]
        );
      }
    } catch (error) {
      console.error("Error in unlink handler:", error);
      Alert.alert("Error", "Failed to process unlink request.", [
        { text: "OK" },
      ]);
    }
  };

  const handleExportProfileData = async () => {
    if (!activeProfile) {
      Alert.alert("Error", "No active profile to export");
      return;
    }

    try {
      const exportData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        profileData: {
          emoji: activeProfile.emoji,
          name: activeProfile.name,
          settings: activeProfile.settings,
          cycles: activeProfile.cycles,
          symptoms: activeProfile.symptoms,
          notes: activeProfile.notes,
          predictions: activeProfile.predictions,
          createdAt: activeProfile.createdAt,
          lastActive: activeProfile.lastActive,
        },
        statistics: profileStats,
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      Alert.alert(
        "Profile Data Exported! 📤",
        `Your ${
          activeProfile.emoji
        } profile data has been prepared for export.\n\nData size: ${(
          jsonString.length / 1024
        ).toFixed(2)} KB\n\nCheck the console logs for the exported JSON data.`,
        [
          { text: "OK" },
          {
            text: "View in Console",
            onPress: () => {
              console.log(
                `📋 === PROFILE DATA EXPORT (${activeProfile.emoji}) ===`
              );
              console.log(jsonString);
              console.log("📋 === END PROFILE EXPORT ===");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Export Failed",
        "Failed to export profile data. Please try again."
      );
      console.error("Profile export error:", error);
    }
  };

  const handleDeleteProfileData = () => {
    if (!activeProfile) {
      Alert.alert("Error", "No active profile to delete");
      return;
    }

    // Check if this is the last profile
    if (profiles.length === 1) {
      Alert.alert(
        `🗑️ Delete Last Profile`,
        `⚠️ This is your ONLY profile. Deleting it will:\n\n• Delete ALL data for ${
          activeProfile.emoji
        } ${
          activeProfile.name || "Unnamed"
        }\n• Reset the entire app to onboarding\n• Remove ${
          profileStats?.cyclesTracked || 0
        } cycles, ${profileStats?.symptomsLogged || 0} symptoms, and ${
          profileStats?.notesWritten || 0
        } notes\n\n🚨 This action cannot be undone and will erase EVERYTHING.\n\nAre you absolutely sure?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Export First",
            onPress: () => handleExportProfileData(),
          },
          {
            text: "Delete Everything",
            style: "destructive",
            onPress: async () => {
              try {
                const storage = StorageService.getInstance();
                await storage.deleteProfile(activeProfile.id);

                Alert.alert(
                  "✅ Profile Deleted",
                  "All app data has been permanently deleted. The app will restart to onboarding.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: "Onboarding" }],
                        });
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error("Delete profile error:", error);
                Alert.alert(
                  "Error",
                  "Failed to delete profile. Please try again."
                );
              }
            },
          },
        ]
      );
      return;
    }

    // Standard profile deletion (multiple profiles exist)
    Alert.alert(
      `🗑️ Delete Profile Data`,
      `⚠️ This will delete ALL data for your ${activeProfile.emoji} ${
        activeProfile.name || "Unnamed"
      } profile including:\n\n• ${profileStats?.cyclesTracked || 0} cycles\n• ${
        profileStats?.symptomsLogged || 0
      } symptoms\n• ${
        profileStats?.notesWritten || 0
      } notes\n\nThis action cannot be undone. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export First",
          onPress: () => handleExportProfileData(),
        },
        {
          text: "Delete Profile",
          style: "destructive",
          onPress: async () => {
            try {
              const storage = StorageService.getInstance();

              // Find the profile to switch to (previous/older profile)
              const currentIndex = profiles.findIndex(
                (p) => p.id === activeProfile.id
              );
              const remainingProfiles = profiles.filter(
                (p) => p.id !== activeProfile.id
              );

              // Select the previous profile if possible, otherwise the first remaining
              let targetProfile;
              if (currentIndex > 0) {
                // Select the profile that comes before this one in the list
                targetProfile = profiles[currentIndex - 1];
              } else {
                // If this was the first profile, select the next one (which becomes first after deletion)
                targetProfile = remainingProfiles[0];
              }

              await storage.deleteProfile(activeProfile.id);

              Alert.alert(
                "✅ Profile Deleted",
                `Profile data has been permanently deleted.\n\nSwitched to ${
                  targetProfile.emoji
                } ${targetProfile.name || "Unnamed"} profile.`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      selectProfile(targetProfile.id);
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Delete profile error:", error);
              Alert.alert(
                "Error",
                "Failed to delete profile. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleSetting = async (settingKey: string, value: boolean) => {
    if (!activeProfile) return;

    try {
      const storage = StorageService.getInstance();
      await storage.updateProfile(activeProfile.id, {
        settings: {
          ...activeProfile.settings,
          [settingKey]: value,
        },
      });
      // Force refresh to update UI immediately
      await refreshProfiles();
    } catch (error) {
      console.error("Failed to update setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#E91E63"
          translucent={false}
        />
        <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
          <View style={styles.centerContainer}>
            <Ionicons
              name="person-outline"
              size={64}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.noProfileText}>No Active Profile</Text>
            <Text style={styles.noProfileSubtext}>
              Select a profile to view settings
            </Text>
            <TouchableOpacity
              style={styles.selectProfileButton}
              onPress={() => navigation.navigate("ProfileSelector")}
            >
              <Text style={styles.selectProfileText}>Select Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#E91E63"
        translucent={false}
      />
      <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => navigation.navigate("ProfileSelector")}
          >
            <Text style={styles.profileEmoji}>{activeProfile.emoji}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="white"
              colors={["#E91E63"]}
            />
          }
        >
          {/* Profile Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileDisplayEmoji}>
                  {activeProfile.emoji}
                </Text>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {activeProfile.name || `${activeProfile.emoji} Profile`}
                  </Text>
                  <Text style={styles.profileSubtext}>
                    Created {profileStats?.createdDate}
                  </Text>
                </View>
              </View>

              {profileStats && (
                <View style={styles.profileStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Cycles Tracked:</Text>
                    <Text style={styles.statValue}>
                      {profileStats.cyclesTracked}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Symptoms Logged:</Text>
                    <Text style={styles.statValue}>
                      {profileStats.symptomsLogged}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Notes Written:</Text>
                    <Text style={styles.statValue}>
                      {profileStats.notesWritten}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Last Active:</Text>
                    <Text style={styles.statValue}>
                      {profileStats.lastActive}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Period tracking reminders
                  </Text>
                </View>
                <Switch
                  value={activeProfile.settings.remindersEnabled}
                  onValueChange={(value) =>
                    handleToggleSetting("remindersEnabled", value)
                  }
                  trackColor={{ false: "#E0E0E0", true: "#81C784" }}
                  thumbColor={
                    activeProfile.settings.remindersEnabled
                      ? "#4CAF50"
                      : "#f4f3f4"
                  }
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Donation Prompts</Text>
                  <Text style={styles.settingDescription}>
                    Show support prompts
                  </Text>
                </View>
                <Switch
                  value={activeProfile.settings.donationPrompts}
                  onValueChange={(value) =>
                    handleToggleSetting("donationPrompts", value)
                  }
                  trackColor={{ false: "#E0E0E0", true: "#81C784" }}
                  thumbColor={
                    activeProfile.settings.donationPrompts
                      ? "#4CAF50"
                      : "#f4f3f4"
                  }
                />
              </View>
            </View>
          </View>

          {/* Support & Donation - Highlighted */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💝 Support Development</Text>
            <View style={styles.donationCard}>
              <TouchableOpacity
                style={styles.donationAction}
                onPress={() => navigation.navigate("Support")}
              >
                <View style={styles.donationIconContainer}>
                  <Ionicons name="heart" size={28} color="#E91E63" />
                </View>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationLabel}>
                    Support CrampPanchayat
                  </Text>
                  <Text style={styles.donationDescription}>
                    Help keep the app free & privacy-focused
                  </Text>
                  <Text style={styles.donationHighlight}>
                    ✨ UPI donations available • Meet the developer
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#E91E63" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈Data Management</Text>
            <View style={styles.dataCard}>
              <TouchableOpacity
                style={styles.dataAction}
                onPress={() => navigation.navigate("SyncSettings")}
              >
                <Ionicons name="cloud-outline" size={24} color="#2196F3" />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>Cloud Sync</Text>
                  <Text style={styles.actionDescription}>
                    Backup & sync data across devices
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dataAction}
                onPress={handleExportProfileData}
              >
                <Ionicons name="download-outline" size={24} color="#4CAF50" />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>Export Profile Data</Text>
                  <Text style={styles.actionDescription}>
                    Export this profile's data as JSON
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dataAction, styles.deleteAction]}
                onPress={handleDeleteProfileData}
              >
                <Ionicons name="trash-outline" size={24} color="#F44336" />
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, styles.deleteLabel]}>
                    Delete Profile Data
                  </Text>
                  <Text style={styles.actionDescription}>
                    Permanently delete this profile
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Usage Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 App Usage Statistics</Text>
            <TouchableOpacity
              style={styles.statsCard}
              onPress={loadCloudAccountsCount}
              activeOpacity={0.7}
            >
              <View style={styles.statsHeader}>
                <Ionicons name="globe-outline" size={28} color="#4CAF50" />
                <View style={styles.statsHeaderText}>
                  <Text style={styles.statsTitle}>
                    CrampPanchayat Global Usage
                  </Text>
                  <Text style={styles.statsSubtitle}>
                    Universal cloud user statistics
                  </Text>
                </View>
                {statsLoading && (
                  <Ionicons
                    name="refresh"
                    size={20}
                    color="#4CAF50"
                    style={styles.refreshIcon}
                  />
                )}
              </View>

              <View style={styles.statsContent}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {statsLoading
                      ? "..."
                      : cloudAvailable
                      ? cloudAccountsCount
                      : "N/A"}
                  </Text>
                  <Text style={styles.statsDataLabel}>Total Cloud Users</Text>
                  <Text style={styles.statDescription}>
                    {cloudAvailable
                      ? "People using CrampPanchayat with cloud sync worldwide"
                      : "Cloud statistics unavailable (offline mode)"}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statsNote}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.statsNoteText}>
                    {cloudAvailable
                      ? "This shows total users worldwide using cloud sync. Offline-only users not counted - actual CrampPanchayat usage is much higher! 😤✨"
                      : "Cloud features are currently unavailable. The app works perfectly offline! �✨"}
                  </Text>
                </View>

                <View style={styles.statsRefreshHint}>
                  <Text style={styles.refreshHintText}>
                    Tap to refresh • Last updated now
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsCard}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate("ProfileSelector")}
              >
                <Ionicons name="people-outline" size={24} color="#E91E63" />
                <Text style={styles.quickActionText}>Manage Profiles</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate("DataManagement")}
              >
                <Ionicons name="analytics-outline" size={24} color="#E91E63" />
                <Text style={styles.quickActionText}>View All Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate("PeriodSetup")}
              >
                <Ionicons name="settings-outline" size={24} color="#E91E63" />
                <Text style={styles.quickActionText}>Period Setup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleManageCloudAccounts}
              >
                <Ionicons name="cloud-outline" size={24} color="#E91E63" />
                <Text style={styles.quickActionText}>Cloud Management</Text>
                {cloudAccountsCount > 0 && (
                  <View style={styles.cloudBadge}>
                    <Text style={styles.cloudBadgeText}>
                      {cloudAccountsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noProfileText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  noProfileSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  selectProfileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  selectProfileText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileDisplayEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  profileSubtext: {
    fontSize: 14,
    color: "#666",
  },
  profileStats: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  settingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 4,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
  },
  dataCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 4,
  },
  dataAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  deleteAction: {
    borderBottomWidth: 0,
  },
  actionInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  deleteLabel: {
    color: "#F44336",
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
  },
  actionsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 8,
    position: "relative",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  donationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 15,
    padding: 4,
    borderWidth: 2,
    borderColor: "#E91E63",
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  donationAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
  },
  donationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFE8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  donationInfo: {
    flex: 1,
    marginRight: 10,
  },
  donationLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 4,
  },
  donationDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  donationHighlight: {
    fontSize: 12,
    color: "#E91E63",
    fontWeight: "600",
    fontStyle: "italic",
  },
  cloudBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E91E63",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cloudBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  // App Usage Statistics Styles
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8F5E8",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statsHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  statsSubtitle: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  statsContent: {
    backgroundColor: "#F8FFF8",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statsDataLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  statDivider: {
    height: 1,
    backgroundColor: "#E0F2E0",
    marginVertical: 12,
  },
  statsNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  statsNoteText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    textAlign: "center",
    fontStyle: "italic",
    flex: 1,
  },
  refreshIcon: {
    marginLeft: 8,
  },
  statsRefreshHint: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0F2E0",
  },
  refreshHintText: {
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
  },
});

export default SettingsScreen;
