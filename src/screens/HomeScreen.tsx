// CrampPanchayat Home Screen - Enhanced with proper navigation and status bar handling
// Clean, mobile-first home screen with complete functionality

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { format, differenceInDays, addDays } from "date-fns";
import { MOTIVATIONAL_QUOTES } from "../constants";

type HomeNavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get("window");

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const {
    profiles,
    activeProfile,
    loading,
    error,
    selectProfile,
    refreshProfiles,
    clearError,
  } = useProfiles();

  const [refreshing, setRefreshing] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [dailyQuote, setDailyQuote] = useState<string>("");

  // Set daily motivational quote - refreshes each time screen is focused
  const refreshQuote = () => {
    const now = new Date();
    const seed = now.getTime() + Math.random() * 1000; // More dynamic seed
    const quoteIndex = Math.floor(seed) % MOTIVATIONAL_QUOTES.length;
    setDailyQuote(MOTIVATIONAL_QUOTES[quoteIndex]);
  };

  useEffect(() => {
    refreshQuote();
  }, []);

  // Refresh quote when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      refreshQuote();
    }, [])
  );

  // Set status bar content
  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#E91E63", true);
    } else {
      StatusBar.setBarStyle("light-content", true);
    }
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfiles();
    setRefreshing(false);
  };

  // Calculate current cycle info
  useEffect(() => {
    if (activeProfile && activeProfile.cycles.length > 0) {
      const lastCycle = activeProfile.cycles[activeProfile.cycles.length - 1];
      const cycleStartDate = new Date(lastCycle.startDate);
      const today = new Date();
      const daysSinceStart = differenceInDays(today, cycleStartDate);

      setCurrentCycle({
        startDate: cycleStartDate,
        daysSinceStart,
        isInPeriod: daysSinceStart < activeProfile.settings.averagePeriodLength,
        predictedNextPeriod: addDays(
          cycleStartDate,
          activeProfile.settings.averageCycleLength
        ),
      });
    } else {
      setCurrentCycle(null);
    }
  }, [activeProfile]);

  // Handle profile switching
  const handleProfileSwitch = async (profileId: string) => {
    try {
      console.log("Switching to profile:", profileId);
      await selectProfile(profileId);
    } catch (err) {
      console.error("Profile switch error:", err);
      Alert.alert("Error", "Failed to switch profile");
    }
  };

  // Handle period tracking
  const handleTrackPeriod = async () => {
    if (!activeProfile) {
      Alert.alert("No Profile", "Please select a profile first");
      return;
    }

    // Check if this is the first cycle setup
    if (activeProfile.cycles.length === 0) {
      Alert.alert(
        "First Period Setup",
        "Let's set up your period information first",
        [
          { text: "Cancel" },
          { text: "Setup", onPress: () => navigation.navigate("PeriodSetup") },
        ]
      );
      return;
    }

    // Check if profile already has a cycle (enforce one profile = one cycle rule)
    if (activeProfile.cycles.length >= 1) {
      Alert.alert(
        "One Profile, One Cycle 📋",
        `This profile (${activeProfile.emoji} ${
          activeProfile.name || "Unnamed"
        }) already has an active cycle being tracked.\n\nTo track a new cycle, please create a new profile or switch to a different profile.`,
        [
          { text: "Cancel" },
          {
            text: "Create New Profile",
            onPress: () => navigation.navigate("ProfileSelector"),
          },
          {
            text: "Switch Profile",
            onPress: () => navigation.navigate("ProfileSelector"),
          },
        ]
      );
      return;
    }

    // This code should never be reached since we check for cycles.length === 0 above,
    // but keeping it as fallback for safety
    Alert.alert("Track Period", "Did your period start today?", [
      { text: "Cancel" },
      {
        text: "Yes, Today",
        onPress: async () => {
          try {
            const { StorageService } = await import("../services/storage");
            const storage = StorageService.getInstance();
            await storage.addCycleRecord(activeProfile.id, {
              startDate: new Date().toISOString(),
              periodDays: [new Date().toISOString()],
              symptoms: {},
              notes: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            Alert.alert(
              "Success! 🎉",
              "Period start logged for today! Your new cycle has been created and tracking has begun."
            );
            await refreshProfiles(); // Refresh to show new data
          } catch (error) {
            console.error("Error logging period:", error);
            Alert.alert("Error", "Failed to log period start");
          }
        },
      },
      {
        text: "Different Date",
        onPress: () => navigation.navigate("Calendar"),
      },
    ]);
  };

  // Show error if present
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error, clearError]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
        <LinearGradient
          colors={["#E91E63", "#AD1457"]}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#E91E63"
        translucent={false}
      />
      <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>CrampPanchayat</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate("DataManagement")}
              >
                <Ionicons name="analytics-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate("ProfileSelector")}
              >
                <Ionicons name="people-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Motivational Quote */}
          {dailyQuote && (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>{dailyQuote}</Text>
            </View>
          )}

          {/* Active Profile Display */}
          {activeProfile && (
            <TouchableOpacity
              style={styles.activeProfileCard}
              onPress={() => navigation.navigate("ProfileSelector")}
            >
              <View style={styles.activeProfileInfo}>
                <Text style={styles.activeProfileEmoji}>
                  {activeProfile.emoji}
                </Text>
                <View style={styles.activeProfileDetails}>
                  <Text style={styles.activeProfileName}>
                    {activeProfile.name || "Unnamed Profile"}
                  </Text>
                  <Text style={styles.activeProfileStats}>
                    {activeProfile.cycles.length} cycles tracked
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          )}

          {/* Profile Switcher */}
          {profiles.length > 1 && (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Switch Profile</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.profileSwitcher}>
                  {profiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.id}
                      style={[
                        styles.profileButton,
                        activeProfile?.id === profile.id &&
                          styles.activeProfileButton,
                      ]}
                      onPress={() => handleProfileSwitch(profile.id)}
                    >
                      <Text style={styles.profileEmoji}>{profile.emoji}</Text>
                      {profile.name && (
                        <Text style={styles.profileName}>{profile.name}</Text>
                      )}
                      {activeProfile?.id === profile.id && (
                        <View style={styles.activeIndicator}>
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#4CAF50"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.addProfileButton}
                    onPress={() => navigation.navigate("ProfileSelector")}
                  >
                    <Ionicons
                      name="add"
                      size={24}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.addProfileText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Current Cycle Info */}
          {activeProfile && (
            <View style={styles.cycleSection}>
              <Text style={styles.sectionTitle}>Current Cycle</Text>
              <View style={styles.cycleCard}>
                {currentCycle ? (
                  <>
                    <View style={styles.cycleHeader}>
                      <Text style={styles.cycleTitle}>
                        {currentCycle.isInPeriod ? "Period Day" : "Cycle Day"}{" "}
                        {currentCycle.daysSinceStart + 1}
                      </Text>
                      <Text style={styles.cycleStatus}>
                        {currentCycle.isInPeriod ? "🩸 Period" : "📅 Tracking"}
                      </Text>
                    </View>
                    <Text style={styles.cycleSubtitle}>
                      Started: {format(currentCycle.startDate, "MMM dd, yyyy")}
                    </Text>
                    <Text style={styles.cycleNext}>
                      Next Period:{" "}
                      {format(currentCycle.predictedNextPeriod, "MMM dd")}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.cycleTitle}>Ready to track</Text>
                    <Text style={styles.cycleSubtitle}>
                      Start by logging your period
                    </Text>
                    <TouchableOpacity
                      style={styles.setupButton}
                      onPress={() => navigation.navigate("PeriodSetup")}
                    >
                      <Text style={styles.setupButtonText}>
                        Setup Period Info
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          {activeProfile && (
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleTrackPeriod}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={32}
                    color="#E91E63"
                  />
                  <Text style={styles.actionText}>Track Period</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("Calendar")}
                >
                  <Ionicons name="calendar-outline" size={32} color="#E91E63" />
                  <Text style={styles.actionText}>View Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("Symptoms")}
                >
                  <Ionicons name="heart-outline" size={32} color="#E91E63" />
                  <Text style={styles.actionText}>Log Symptoms</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("DataManagement")}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color="#E91E63"
                  />
                  <Text style={styles.actionText}>View Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* No Profiles State */}
          {profiles.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="person-add-outline"
                size={64}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.emptyTitle}>Welcome to CrampPanchayat!</Text>
              <Text style={styles.emptySubtitle}>
                Create your first profile to start tracking your cycle
              </Text>
              <TouchableOpacity
                style={styles.createProfileButton}
                onPress={() => navigation.navigate("ProfileSelector")}
              >
                <Text style={styles.createProfileButtonText}>
                  Create Profile
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  activeProfileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeProfileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activeProfileEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  activeProfileDetails: {
    flex: 1,
  },
  activeProfileName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  activeProfileStats: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  profileSwitcher: {
    flexDirection: "row",
    paddingVertical: 5,
    gap: 12,
  },
  profileButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    position: "relative",
  },
  activeProfileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  profileEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  profileName: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "white",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addProfileButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  addProfileText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  cycleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cycleCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
  },
  cycleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cycleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  cycleStatus: {
    fontSize: 14,
    fontWeight: "500",
    color: "#E91E63",
  },
  cycleSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cycleNext: {
    fontSize: 14,
    color: "#666",
  },
  setupButton: {
    backgroundColor: "#E91E63",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  setupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: (screenWidth - 52) / 2,
    minHeight: 100,
    justifyContent: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  createProfileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  createProfileButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  quoteCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(255, 255, 255, 0.5)",
  },
  quoteText: {
    color: "white",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;
