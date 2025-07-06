// CrampPanchayat Home Screen - Optimized and Enhanced
// Clean, mobile-first home screen with better performance and UI

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Image,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { useAdvancedPeriodTracking } from "../hooks/useAdvancedPeriodTracking";
import { format, differenceInDays, addDays, isToday } from "date-fns";
import { MOTIVATIONAL_QUOTES } from "../constants";
import { donationPromptManager } from "../utils/donationPrompt";
import { CloudSyncService } from "../services/cloudSync";
import { StorageService } from "../services/storage";

type HomeNavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get("window");

// Memoized quick action component for better performance
const QuickActionButton = React.memo(
  ({
    action,
    onPress,
  }: {
    action: {
      icon: string;
      title: string;
      subtitle: string;
      color: string;
    };
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={action.icon as any} size={32} color={action.color} />
      <Text style={styles.actionText}>{action.title}</Text>
      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
    </TouchableOpacity>
  )
);

// Memoized profile button component
const ProfileButton = React.memo(
  ({
    profile,
    isActive,
    onPress,
  }: {
    profile: any;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.profileButton, isActive && styles.activeProfileButton]}
      onPress={onPress}
    >
      <Text style={styles.profileEmoji}>{profile.emoji}</Text>
      {profile.name && <Text style={styles.profileName}>{profile.name}</Text>}
      {isActive && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark" size={12} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  )
);

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

  // Enhanced period tracking with robust algorithms
  const periodTracking = useAdvancedPeriodTracking(activeProfile);

  const [refreshing, setRefreshing] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<string>("");
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Enhanced cycle calculations using the new period tracking service
  const cycleInfo = useMemo(() => {
    if (!activeProfile || activeProfile.cycles.length === 0) {
      return null;
    }

    return {
      // Current status - use the direct properties from the hook
      isInPeriod: periodTracking.isOnPeriod,
      periodDay: periodTracking.periodDay,
      cycleDay: periodTracking.dayInCycle,
      currentPhase: periodTracking.currentPhase,
      phaseDescription: periodTracking.phaseDescription,

      // Cycle metrics - use the direct properties from the hook
      averageCycleLength: periodTracking.averageCycleLength,
      averagePeriodLength: periodTracking.averagePeriodLength,
      cycleVariation: periodTracking.cycleVariation,

      // Predictions - use the direct properties from the hook
      nextPeriodDate: periodTracking.nextPeriodDate,
      daysUntilNext: periodTracking.daysUntilNextPeriod,
      isOverdue: periodTracking.isOverdue,
      overdueBy: periodTracking.overdueByDays,
      confidenceLevel: periodTracking.predictionConfidence,

      // Progress calculation
      progressPercentage: Math.min(
        100,
        Math.max(
          0,
          (periodTracking.dayInCycle / periodTracking.averageCycleLength) * 100
        )
      ),

      // Regularity
      regularity: periodTracking.cycleRegularity,
      regularityDescription: periodTracking.regularityDescription,

      // Health insights
      healthInsights: periodTracking.healthInsights,
      dataQuality: periodTracking.dataQualityScore,
    };
  }, [activeProfile, periodTracking]);

  // Memoized quick stats with enhanced calculations and proper notes detection
  const quickStats = useMemo(() => {
    if (!activeProfile) return null;

    const recentSymptoms = activeProfile.symptoms.filter((s) => {
      const symptomDate = new Date(s.date);
      const daysDiff = differenceInDays(new Date(), symptomDate);
      return daysDiff <= 7; // Last 7 days
    });

    // Count total notes from both direct notes and notes within symptoms
    // FIXED: More accurate counting that doesn't double-count or include empty entries
    let totalNotesCount = 0;
    const seenNotes = new Set<string>(); // Track date+note combinations to avoid duplicates

    // Count direct notes (only non-empty ones)
    if (activeProfile.notes && Array.isArray(activeProfile.notes)) {
      activeProfile.notes.forEach((note) => {
        if (note && note.note && note.note.trim().length > 0) {
          const noteKey = `${note.date}:${note.note.trim()}`;
          if (!seenNotes.has(noteKey)) {
            seenNotes.add(noteKey);
            totalNotesCount++;
          }
        }
      });
    }

    // Add notes from symptoms that have meaningful notes (avoid duplicates)
    if (activeProfile.symptoms && Array.isArray(activeProfile.symptoms)) {
      activeProfile.symptoms.forEach((symptom) => {
        if (symptom.notes && symptom.notes.trim().length > 0) {
          const noteKey = `${symptom.date}:${symptom.notes.trim()}`;
          if (!seenNotes.has(noteKey)) {
            seenNotes.add(noteKey);
            totalNotesCount++;
          }
        }
      });
    }

    // Add notes from cycles (only meaningful cycle notes, avoid duplicates)
    if (activeProfile.cycles && Array.isArray(activeProfile.cycles)) {
      activeProfile.cycles.forEach((cycle) => {
        if (cycle.notes && typeof cycle.notes === "object") {
          Object.entries(cycle.notes).forEach(([date, note]) => {
            if (note && typeof note === "string" && note.trim().length > 0) {
              const noteKey = `${date}:${note.trim()}`;
              if (!seenNotes.has(noteKey)) {
                seenNotes.add(noteKey);
                totalNotesCount++;
              }
            }
          });
        }
      });
    }

    return {
      totalCycles: activeProfile.cycles.length,
      totalSymptoms: activeProfile.symptoms.length,
      totalNotes: totalNotesCount,
      recentSymptoms: recentSymptoms.length,
      averageCycleLength:
        activeProfile.cycles.length > 1
          ? Math.round(
              activeProfile.cycles.reduce((acc, cycle, index) => {
                if (index === 0) return acc;
                const prevCycle = activeProfile.cycles[index - 1];
                const daysBetween = differenceInDays(
                  new Date(cycle.startDate),
                  new Date(prevCycle.startDate)
                );
                return acc + daysBetween;
              }, 0) /
                (activeProfile.cycles.length - 1)
            )
          : activeProfile.settings?.averageCycleLength || 28,
    };
  }, [activeProfile]);

  // Optimized quote refresh with daily consistency
  const refreshQuote = useCallback(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
    setDailyQuote(MOTIVATIONAL_QUOTES[quoteIndex]);
  }, []);

  // Entrance animation
  const startAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  // Focus effect with animation and auto-sync
  useFocusEffect(
    useCallback(() => {
      refreshQuote();
      startAnimation();

      // Always refresh profiles when screen comes into focus
      refreshProfiles();

      // Trigger auto-sync when app comes to focus
      const cloudSync = CloudSyncService.getInstance();
      cloudSync.autoSync().catch((error) => {
        console.log("Auto-sync failed (silent):", error);
        // Don't show errors for auto-sync
      });

      if (Platform.OS === "android") {
        StatusBar.setBarStyle("light-content", true);
        StatusBar.setBackgroundColor("#E91E63", true);
      } else {
        StatusBar.setBarStyle("light-content", true);
      }

      return () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      };
    }, [refreshQuote, startAnimation, fadeAnim, slideAnim, refreshProfiles])
  );

  // Enhanced refresh handler with better error handling
  const handleRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    try {
      await refreshProfiles();
      refreshQuote();
    } catch (err) {
      console.error("Refresh error:", err);
      Alert.alert(
        "Refresh Failed",
        "Could not refresh data. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, refreshProfiles, refreshQuote]);

  // Helper function to navigate to symptoms with proper parameters
  const navigateToSymptoms = useCallback(() => {
    if (activeProfile) {
      navigation.navigate("Symptoms", {
        profileId: activeProfile.id,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [activeProfile, navigation]);

  // Helper function to navigate to calendar with proper parameters
  const navigateToCalendar = useCallback(() => {
    if (activeProfile) {
      navigation.navigate("Calendar", {
        profileId: activeProfile.id,
      });
    }
  }, [activeProfile, navigation]);

  // Quick action handlers
  const quickActions = useMemo(
    () => [
      {
        icon: "add-circle",
        title: "Log Period",
        subtitle: "Mark period start",
        color: "#FF6B6B",
        onPress: navigateToCalendar,
      },
      {
        icon: "heart",
        title: "Track Symptoms",
        subtitle: "How are you feeling?",
        color: "#4ECDC4",
        onPress: navigateToSymptoms,
      },
      {
        icon: "document-text",
        title: "See My Notes",
        subtitle: `${quickStats?.totalNotes || 0} notes`,
        color: "#FFA726",
        onPress: () => handleViewNotes(),
      },
      {
        icon: "analytics",
        title: "See My Symptoms",
        subtitle: `${quickStats?.totalSymptoms || 0} symptoms`,
        color: "#AB47BC",
        onPress: () => handleViewSymptoms(),
      },
      {
        icon: "calendar",
        title: "View Calendar",
        subtitle: "See your cycle",
        color: "#45B7D1",
        onPress: navigateToCalendar,
      },
      {
        icon: "settings",
        title: "Settings",
        subtitle: "Manage profile",
        color: "#96CEB4",
        onPress: () => navigation.navigate("Settings"),
      },
    ],
    [navigation, quickStats, navigateToSymptoms, navigateToCalendar]
  );

  // Enhanced profile switching with better error handling and auto-refresh
  const handleProfileSwitch = useCallback(
    async (profileId?: string) => {
      if (profileId) {
        if (profileId === activeProfile?.id) return; // Already active

        setSwitchingProfile(true);
        try {
          console.log("Switching to profile:", profileId);
          await selectProfile(profileId);
          // Force refresh after profile switch
          setTimeout(() => {
            refreshProfiles();
          }, 100);
        } catch (err) {
          console.error("Profile switch error:", err);
          Alert.alert("Error", "Failed to switch profile. Please try again.", [
            { text: "OK" },
          ]);
        } finally {
          setSwitchingProfile(false);
        }
      } else {
        // Navigate to profile selector
        navigation.navigate("ProfileSelector");
      }
    },
    [activeProfile?.id, selectProfile, navigation, refreshProfiles]
  );

  // Handle viewing all notes
  const handleViewNotes = useCallback(() => {
    if (!activeProfile) {
      Alert.alert("No Profile", "Please select a profile first");
      return;
    }

    // Collect all notes from different sources with deduplication
    const allNotes: Array<{ date: string; note: string; source: string }> = [];
    const seenNotes = new Set<string>(); // Track date+note combinations to avoid duplicates

    // Direct notes (DailyNote entries)
    if (activeProfile.notes && Array.isArray(activeProfile.notes)) {
      activeProfile.notes.forEach((note) => {
        if (note && note.note && note.note.trim().length > 0) {
          const noteKey = `${note.date}:${note.note.trim()}`;
          if (!seenNotes.has(noteKey)) {
            seenNotes.add(noteKey);
            allNotes.push({
              date: note.date,
              note: note.note,
              source: "Daily Note",
            });
          }
        }
      });
    }

    // Notes from symptoms (SymptomRecord.notes)
    if (activeProfile.symptoms && Array.isArray(activeProfile.symptoms)) {
      activeProfile.symptoms.forEach((symptom) => {
        if (symptom.notes && symptom.notes.trim().length > 0) {
          const noteKey = `${symptom.date}:${symptom.notes.trim()}`;
          if (!seenNotes.has(noteKey)) {
            seenNotes.add(noteKey);
            allNotes.push({
              date: symptom.date,
              note: symptom.notes,
              source: "Symptom Note",
            });
          }
        }
      });
    }

    // Notes from cycles (CycleRecord.notes) - only if not already added from symptoms
    if (activeProfile.cycles && Array.isArray(activeProfile.cycles)) {
      activeProfile.cycles.forEach((cycle) => {
        if (cycle.notes && typeof cycle.notes === "object") {
          Object.entries(cycle.notes).forEach(([date, note]) => {
            if (note && typeof note === "string" && note.trim().length > 0) {
              const noteKey = `${date}:${note.trim()}`;
              if (!seenNotes.has(noteKey)) {
                seenNotes.add(noteKey);
                allNotes.push({
                  date,
                  note,
                  source: "Cycle Note",
                });
              }
            }
          });
        }
      });
    }

    // Sort notes by date (newest first)
    allNotes.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (allNotes.length === 0) {
      Alert.alert(
        "No Notes Found",
        "You haven't written any notes yet. Start tracking your symptoms or add daily notes to see them here!"
      );
      return;
    }

    // Create a formatted message for the alert
    const notesText = allNotes
      .slice(0, 10) // Show only first 10 notes to avoid overwhelming the alert
      .map((note) => {
        const formattedDate = format(new Date(note.date), "MMM dd, yyyy");
        return `📅 ${formattedDate} (${note.source})\n📝 ${
          note.note.length > 100
            ? note.note.substring(0, 100) + "..."
            : note.note
        }`;
      })
      .join("\n\n");

    const moreText =
      allNotes.length > 10
        ? `\n\n... and ${allNotes.length - 10} more notes`
        : "";

    Alert.alert(
      `📝 Your Notes (${allNotes.length})`,
      notesText + moreText,
      [
        { text: "Close", style: "cancel" },
        {
          text: "Add Note",
          onPress: () => {
            if (activeProfile) {
              navigation.navigate("Symptoms", {
                profileId: activeProfile.id,
                date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [activeProfile, navigation]);

  // Handle viewing all symptoms
  const handleViewSymptoms = useCallback(() => {
    if (!activeProfile) {
      Alert.alert("No Profile", "Please select a profile first");
      return;
    }

    if (!activeProfile.symptoms || activeProfile.symptoms.length === 0) {
      Alert.alert(
        "No Symptoms Found",
        "You haven't tracked any symptoms yet. Start tracking how you feel to see patterns and insights!"
      );
      return;
    }

    // Group symptoms by date and create summary
    const symptomsByDate = activeProfile.symptoms
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Show last 10 entries

    const symptomsText = symptomsByDate
      .map((symptom) => {
        const formattedDate = format(new Date(symptom.date), "MMM dd, yyyy");
        const intensities = symptom.symptoms
          .map((s) => `${s.type}: ${s.intensity}`)
          .join(", ");
        const noteText = symptom.notes ? `\n💭 ${symptom.notes}` : "";
        return `📅 ${formattedDate}\n💝 ${intensities}${noteText}`;
      })
      .join("\n\n");

    const moreText =
      activeProfile.symptoms.length > 10
        ? `\n\n... and ${activeProfile.symptoms.length - 10} more entries`
        : "";

    Alert.alert(
      `💗 Your Symptoms (${activeProfile.symptoms.length})`,
      symptomsText + moreText,
      [
        { text: "Close", style: "cancel" },
        {
          text: "Track Now",
          onPress: () => {
            if (activeProfile) {
              navigation.navigate("Symptoms", {
                profileId: activeProfile.id,
                date: new Date().toISOString().split("T")[0], // Today's date
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [activeProfile, navigation]);

  // Handle period tracking
  const handleTrackPeriod = useCallback(() => {
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

    // Navigate to calendar to log period
    navigation.navigate("Calendar", {
      profileId: activeProfile.id,
    });
  }, [activeProfile, navigation]);

  // Remove duplicate auto-refresh effect - we handle this in useFocusEffect now
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error, clearError]);

  // Only show loading on initial load, not during profile switches
  if (loading && !refreshing && !switchingProfile && profiles.length === 0) {
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

  // Handle no active profile case without full loading screen
  if (!activeProfile && profiles.length > 0 && !loading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#E91E63"
          translucent={false}
        />
        <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
          <View style={styles.centerContainer}>
            <Text style={styles.noProfileText}>No active profile found</Text>
            <TouchableOpacity
              style={styles.createProfileButton}
              onPress={() => navigation.navigate("ProfileSelector")}
            >
              <Text style={styles.createProfileButtonText}>Select Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Main render with failsafe for any edge cases
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#E91E63"
        translucent={false}
      />
      <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="white"
                colors={["white"]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Profile Info */}
            <View style={styles.header}>
              <View style={styles.appIconContainer}>
                <Image
                  source={require("../assets/images/app-icon.png")}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>CrampPanchayat</Text>
              </View>

              {activeProfile && (
                <TouchableOpacity
                  style={[
                    styles.profileBadge,
                    switchingProfile && styles.profileBadgeLoading,
                  ]}
                  onPress={() => handleProfileSwitch()}
                  accessibilityLabel="Switch profile"
                  disabled={switchingProfile}
                >
                  <Text style={styles.profileEmoji}>{activeProfile.emoji}</Text>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {activeProfile.name || "Profile"}
                    </Text>
                    <Text style={styles.profileSubtext}>
                      {switchingProfile
                        ? "Switching..."
                        : `${profiles.length} profile${
                            profiles.length !== 1 ? "s" : ""
                          }`}
                    </Text>
                  </View>
                  <Ionicons
                    name={switchingProfile ? "sync" : "chevron-down"}
                    size={16}
                    color="rgba(255,255,255,0.8)"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Daily Quote */}
            {dailyQuote && (
              <View style={styles.quoteSection}>
                <Text style={styles.quoteText}>"{dailyQuote}"</Text>
              </View>
            )}

            {/* Quick Stats Section */}
            {activeProfile && quickStats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {quickStats.totalCycles}
                    </Text>
                    <Text style={styles.statLabel}>Cycles</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {quickStats.averageCycleLength}
                    </Text>
                    <Text style={styles.statLabel}>Avg Length</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {quickStats.recentSymptoms}
                    </Text>
                    <Text style={styles.statLabel}>Recent Symptoms</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {quickStats.totalNotes}
                    </Text>
                    <Text style={styles.statLabel}>Notes</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Current Cycle Info */}
            {activeProfile && (
              <View style={styles.cycleSection}>
                <Text style={styles.sectionTitle}>Current Cycle</Text>
                {cycleInfo ? (
                  <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                      <Text style={styles.statusTitle}>
                        {cycleInfo.isInPeriod ? "🩸 On Period" : "📅 Cycle Day"}
                      </Text>
                      <Text style={styles.statusDay}>
                        Day {cycleInfo.cycleDay}
                      </Text>
                    </View>

                    <View style={styles.statusDetails}>
                      <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Next Expected</Text>
                        <Text style={styles.statusValue}>
                          {cycleInfo.isOverdue
                            ? `Overdue by ${cycleInfo.overdueBy} days`
                            : cycleInfo.daysUntilNext > 0
                            ? `${cycleInfo.daysUntilNext} days`
                            : "Today"}
                        </Text>
                      </View>

                      <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>
                          {cycleInfo.isOverdue
                            ? "Confidence"
                            : "Predicted Date"}
                        </Text>
                        <Text style={styles.statusValue}>
                          {cycleInfo.isOverdue
                            ? `${cycleInfo.confidenceLevel}%`
                            : format(cycleInfo.nextPeriodDate, "MMM dd")}
                        </Text>
                      </View>
                    </View>

                    {/* Cycle Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${cycleInfo.progressPercentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {cycleInfo.progressPercentage.toFixed(0)}% through cycle
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.statusCard}>
                    <Text style={styles.statusTitle}>
                      🌟 Ready to Start Tracking
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      Track your first period to begin cycle predictions
                    </Text>
                    <TouchableOpacity
                      style={styles.setupButton}
                      onPress={handleTrackPeriod}
                    >
                      <Text style={styles.setupButtonText}>Start Tracking</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Quick Actions */}
            {activeProfile && (
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                  {quickActions.map((action, index) => (
                    <QuickActionButton
                      key={index}
                      action={action}
                      onPress={action.onPress}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* No Profiles State - Always show if no profiles */}
            {(profiles.length === 0 ||
              (!activeProfile && !loading && !switchingProfile)) && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Image
                    source={require("../assets/images/app-icon.png")}
                    style={styles.emptyIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {profiles.length === 0
                    ? "Welcome to CrampPanchayat!"
                    : "Select a Profile"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {profiles.length === 0
                    ? "Create your first profile to start tracking your cycle"
                    : "Choose a profile to start tracking"}
                </Text>
                <TouchableOpacity
                  style={styles.createProfileButton}
                  onPress={() => navigation.navigate("ProfileSelector")}
                >
                  <Text style={styles.createProfileButtonText}>
                    {profiles.length === 0
                      ? "Create Profile"
                      : "Select Profile"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>
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
  animatedContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noProfileText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  appName: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  profileBadgeLoading: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    opacity: 0.8,
  },
  profileInfo: {
    marginLeft: 8,
    marginRight: 6,
  },
  profileSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
  },
  quoteSection: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(255, 255, 255, 0.4)",
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
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    flex: 1,
    minHeight: 60,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
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
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 80,
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
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusDay: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
  },
  statusDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  statusValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
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
  daysUntilNext: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E91E63",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
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
  actionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    padding: 16,
    marginBottom: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
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
