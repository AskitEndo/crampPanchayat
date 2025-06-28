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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { StorageService } from "../services/storage";

type SettingsNavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { activeProfile, profiles, refreshProfiles, selectProfile } =
    useProfiles();

  const [profileStats, setProfileStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Force refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
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
  }, [activeProfile]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfiles();
    setRefreshing(false);
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
              await storage.deleteProfile(activeProfile.id);

              Alert.alert(
                "✅ Profile Deleted",
                "Profile data has been permanently deleted.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Switch to another profile if available, or go to onboarding
                      const remainingProfiles = profiles.filter(
                        (p) => p.id !== activeProfile.id
                      );
                      if (remainingProfiles.length > 0) {
                        selectProfile(remainingProfiles[0].id);
                      } else {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: "Onboarding" }],
                        });
                      }
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
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.dataCard}>
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
});

export default SettingsScreen;
