// Enhanced screens for CrampPanchayat

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useProfiles } from "../hooks";
import { Button } from "../components";

// Create Profile Screen
export function CreateProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Profile</Text>
        <Text style={styles.subtitle}>
          Choose an emoji for your anonymous profile
        </Text>
        {/* TODO: Implement emoji selection */}
      </View>
    </SafeAreaView>
  );
}

// Enhanced Symptoms Screen
export function SymptomsScreen() {
  const { activeProfile } = useProfiles();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const SYMPTOM_CATEGORIES = [
    {
      title: "Physical",
      symptoms: [
        { id: "cramps", emoji: "😫", label: "Cramps" },
        { id: "headache", emoji: "🤕", label: "Headache" },
        { id: "backache", emoji: "😣", label: "Back Pain" },
        { id: "bloating", emoji: "🤰", label: "Bloating" },
        { id: "fatigue", emoji: "😴", label: "Fatigue" },
        { id: "nausea", emoji: "🤢", label: "Nausea" },
      ],
    },
    {
      title: "Flow",
      symptoms: [
        { id: "light_flow", emoji: "💧", label: "Light Flow" },
        { id: "normal_flow", emoji: "🩸", label: "Normal Flow" },
        { id: "heavy_flow", emoji: "🔴", label: "Heavy Flow" },
        { id: "spotting", emoji: "⭕", label: "Spotting" },
      ],
    },
    {
      title: "Emotional",
      symptoms: [
        { id: "mood_swings", emoji: "😤", label: "Mood Swings" },
        { id: "irritability", emoji: "😠", label: "Irritability" },
        { id: "anxiety", emoji: "😰", label: "Anxiety" },
        { id: "sadness", emoji: "😢", label: "Sadness" },
      ],
    },
    {
      title: "Cravings",
      symptoms: [
        { id: "sweet_cravings", emoji: "🍫", label: "Sweet Cravings" },
        { id: "salty_cravings", emoji: "🧂", label: "Salty Cravings" },
        { id: "increased_appetite", emoji: "🍽️", label: "Increased Appetite" },
      ],
    },
  ];

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const saveSymptoms = () => {
    // TODO: Save symptoms to storage
    Alert.alert("Saved", "Your symptoms have been recorded for today!");
    setSelectedSymptoms([]);
  };

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
          <View style={styles.centered}>
            <Text style={styles.noProfileText}>
              Select a profile to track symptoms
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Symptom Tracker</Text>
            <Text style={styles.headerSubtitle}>
              How are you feeling today?
            </Text>
          </View>

          {SYMPTOM_CATEGORIES.map((category) => (
            <View key={category.title} style={styles.symptomCategory}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.symptomGrid}>
                {category.symptoms.map((symptom) => (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[
                      styles.symptomCard,
                      selectedSymptoms.includes(symptom.id) &&
                        styles.symptomCardSelected,
                    ]}
                    onPress={() => toggleSymptom(symptom.id)}
                  >
                    <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                    <Text
                      style={[
                        styles.symptomLabel,
                        selectedSymptoms.includes(symptom.id) &&
                          styles.symptomLabelSelected,
                      ]}
                    >
                      {symptom.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {selectedSymptoms.length > 0 && (
            <TouchableOpacity style={styles.saveButton} onPress={saveSymptoms}>
              <Text style={styles.saveButtonText}>Save Today's Symptoms</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Enhanced Analytics Screen
export function AnalyticsScreen() {
  const { activeProfile } = useProfiles();

  const cycles = activeProfile?.cycles || [];
  const averageCycleLength = activeProfile?.settings.averageCycleLength || 28;
  const averagePeriodLength = activeProfile?.settings.averagePeriodLength || 5;

  const completedCycles = cycles.filter((cycle) => cycle.endDate);
  const totalCycles = completedCycles.length;

  function getCurrentStreak(cycles: any[]): number {
    let streak = 0;
    const today = new Date();
    for (let i = cycles.length - 1; i >= 0; i--) {
      const cycle = cycles[i];
      const cycleDate = new Date(cycle.startDate);
      const daysDiff = Math.floor(
        (today.getTime() - cycleDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 35) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const currentStreak = getCurrentStreak(cycles);

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
          <View style={styles.centered}>
            <Text style={styles.noProfileText}>
              Select a profile to view analytics
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Insights</Text>
            <Text style={styles.headerSubtitle}>
              Understanding your patterns
            </Text>
          </View>

          {totalCycles > 0 ? (
            <>
              {/* Key Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalCycles}</Text>
                  <Text style={styles.statLabel}>Cycles Tracked</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {averageCycleLength || "—"}
                  </Text>
                  <Text style={styles.statLabel}>Avg Cycle</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {averagePeriodLength || "—"}
                  </Text>
                  <Text style={styles.statLabel}>Avg Period</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{currentStreak}</Text>
                  <Text style={styles.statLabel}>Tracking Streak</Text>
                </View>
              </View>

              {/* Cycle History */}
              <View style={styles.analyticsCard}>
                <Text style={styles.cardTitle}>Recent Cycles</Text>
                {completedCycles.slice(-5).map((cycle) => (
                  <View key={cycle.id} style={styles.cycleItem}>
                    <View style={styles.cycleInfo}>
                      <Text style={styles.cycleDate}>
                        {new Date(cycle.startDate).toLocaleDateString()}
                      </Text>
                      <Text style={styles.cycleDuration}>
                        {cycle.length ? `${cycle.length} days` : "Ongoing"}
                      </Text>
                    </View>
                    <View style={styles.cycleFlow}>
                      <Text style={styles.flowText}>Normal Flow</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Predictions */}
              <View style={styles.analyticsCard}>
                <Text style={styles.cardTitle}>Predictions</Text>
                <Text style={styles.predictionText}>
                  Based on your patterns, your next period is likely to start
                  around{" "}
                  {averageCycleLength && completedCycles.length > 0
                    ? new Date(
                        new Date(
                          completedCycles[completedCycles.length - 1].endDate ||
                            completedCycles[completedCycles.length - 1]
                              .startDate
                        ).getTime() +
                          averageCycleLength * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()
                    : "calculating..."}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.centered}>
              <Ionicons name="analytics-outline" size={80} color="#FFFFFF" />
              <Text style={styles.emptyTitle}>Start Tracking</Text>
              <Text style={styles.emptyText}>
                Track a few cycles to see your personal insights and patterns
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Enhanced Settings Screen
export function SettingsScreen() {
  const { profiles, activeProfile, selectProfile } = useProfiles();
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const settingSections = [
    {
      title: "Account",
      items: [
        {
          id: "profiles",
          icon: "people-outline",
          title: "Manage Profiles",
          subtitle: `${profiles.length} profile${
            profiles.length !== 1 ? "s" : ""
          } created`,
          onPress: () => Alert.alert("Info", "Profile management coming soon!"),
        },
        {
          id: "sync",
          icon: "cloud-outline",
          title: "Online Sync",
          subtitle: isOnline ? "Connected" : "Offline",
          toggle: true,
          value: syncEnabled,
          onToggle: setSyncEnabled,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          icon: "notifications-outline",
          title: "Notifications",
          subtitle: "Period reminders and tips",
          onPress: () =>
            Alert.alert("Info", "Notification settings coming soon!"),
        },
        {
          id: "privacy",
          icon: "shield-outline",
          title: "Privacy",
          subtitle: "Data and security settings",
          onPress: () =>
            Alert.alert(
              "Privacy",
              "Your data stays on your device. We never collect personal information."
            ),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "donate",
          icon: "heart-outline",
          title: "Support Development",
          subtitle: "Help keep CrampPanchayat free",
          onPress: () =>
            Alert.alert("Support", "UPI donation feature coming soon!"),
        },
        {
          id: "about",
          icon: "information-outline",
          title: "About",
          subtitle: "Version 1.0.0",
          onPress: () =>
            Alert.alert(
              "About",
              "CrampPanchayat - Privacy-first period tracking app built with love for everyone who menstruates."
            ),
        },
      ],
    },
  ];

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
          <View style={styles.centered}>
            <Text style={styles.noProfileText}>
              Select a profile to access settings
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmoji}>{activeProfile.emoji}</Text>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>Current Profile</Text>
                <Text style={styles.profileStats}>
                  {profiles.find((p) => p.id === activeProfile.id)?.cycles
                    ?.length || 0}{" "}
                  cycles tracked
                </Text>
              </View>
            </View>
            <View style={styles.onlineStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? "#22C55E" : "#EF4444" },
                ]}
              />
              <Text style={styles.statusText}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Settings Sections */}
          {settingSections.map((section) => (
            <View key={section.title} style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingItem}
                  onPress={item.onPress}
                >
                  <View style={styles.settingContent}>
                    <View style={styles.settingIcon}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color="#666"
                      />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  {item.toggle ? (
                    <TouchableOpacity
                      style={[styles.toggle, item.value && styles.toggleActive]}
                      onPress={() => item.onToggle?.(!item.value)}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          item.value && styles.toggleThumbActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Data Management */}
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <TouchableOpacity style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Export All Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dangerButton, { backgroundColor: "#EF4444" }]}
              onPress={() => {
                Alert.alert(
                  "Delete All Data",
                  "This will permanently delete all your tracking data. This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        Alert.alert(
                          "Info",
                          "Data deletion will be implemented in a future update."
                        );
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.dangerButtonText}>Delete All Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Enhanced Sync Screen
export function SyncScreen() {
  const { profiles, activeProfile } = useProfiles();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      setIsOnline(true);
      setIsConnecting(false);
      Alert.alert("Connected", "Successfully connected to sync server!");
    }, 2000);
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Please connect to the internet first.");
      return;
    }

    setIsSyncing(true);

    // Simulate sync process
    setTimeout(() => {
      setLastSyncTime(new Date());
      setIsSyncing(false);
      Alert.alert("Sync Complete", "Your data has been synced successfully!");
    }, 3000);
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect",
      "Are you sure you want to disconnect from online sync?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            setIsOnline(false);
            setLastSyncTime(null);
            Alert.alert("Disconnected", "You're now in offline mode.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Online Sync</Text>
            <Text style={styles.headerSubtitle}>
              Keep your data safe across devices
            </Text>
          </View>

          {/* Connection Status */}
          <View style={styles.analyticsCard}>
            <View style={styles.syncStatus}>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? "#22C55E" : "#EF4444" },
                  ]}
                />
                <Text style={styles.statusTitle}>
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
              {lastSyncTime && (
                <Text style={styles.lastSyncText}>
                  Last sync: {lastSyncTime.toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          {/* Sync Controls */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Sync Controls</Text>

            {!isOnline ? (
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  isConnecting && styles.syncButtonDisabled,
                ]}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.syncButtonText}>
                  {isConnecting ? "Connecting..." : "Connect to Sync"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <TouchableOpacity
                  style={[
                    styles.syncButton,
                    isSyncing && styles.syncButtonDisabled,
                  ]}
                  onPress={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.syncButtonText}>
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.syncButton,
                    { backgroundColor: "#EF4444", marginTop: 10 },
                  ]}
                  onPress={handleDisconnect}
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.syncButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Privacy Info */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Privacy & Security</Text>
            <View style={styles.privacyPoints}>
              <View style={styles.privacyPoint}>
                <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
                <Text style={styles.privacyText}>End-to-end encrypted</Text>
              </View>
              <View style={styles.privacyPoint}>
                <Ionicons name="eye-off" size={20} color="#22C55E" />
                <Text style={styles.privacyText}>Anonymous data only</Text>
              </View>
              <View style={styles.privacyPoint}>
                <Ionicons name="trash" size={20} color="#22C55E" />
                <Text style={styles.privacyText}>Delete anytime</Text>
              </View>
              <View style={styles.privacyPoint}>
                <Ionicons name="download" size={20} color="#22C55E" />
                <Text style={styles.privacyText}>Export your data</Text>
              </View>
            </View>
          </View>

          {/* Sync Data Summary */}
          {activeProfile && (
            <View style={styles.analyticsCard}>
              <Text style={styles.cardTitle}>Data Summary</Text>
              <View style={styles.dataSummary}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataNumber}>{profiles.length}</Text>
                  <Text style={styles.dataLabel}>Profiles</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataNumber}>
                    {activeProfile.cycles?.length || 0}
                  </Text>
                  <Text style={styles.dataLabel}>Cycles</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataNumber}>
                    {activeProfile.symptoms?.length || 0}
                  </Text>
                  <Text style={styles.dataLabel}>Symptoms</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataNumber}>
                    {activeProfile.notes?.length || 0}
                  </Text>
                  <Text style={styles.dataLabel}>Notes</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Enhanced Donation Screen
export function DonationScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showQR, setShowQR] = useState(false);

  const donationAmounts = [10, 25, 50, 100, 250, 500];

  const generateUPILink = (amount: number) => {
    // This is a placeholder UPI ID - replace with your actual UPI ID
    const upiId = "cramppanchayat@upi";
    const merchantName = "CrampPanchayat";
    const note = "Support CrampPanchayat Development";

    return `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      note
    )}`;
  };

  const handleDonate = (amount: number) => {
    setSelectedAmount(amount);
    setShowQR(true);
    // In a real app, you would generate a QR code here
    Alert.alert(
      "Donation",
      `Thank you for your support! You can donate ₹${amount} using any UPI app.\n\nUPI ID: cramppanchayat@upi`,
      [
        {
          text: "Copy UPI ID",
          onPress: () => {
            // In a real app, copy to clipboard
            Alert.alert("Copied!", "UPI ID copied to clipboard");
          },
        },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#E91E63", "#F06292"]} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Support CrampPanchayat</Text>
            <Text style={styles.headerSubtitle}>
              Help us keep this app free and open source
            </Text>
          </View>

          {/* Mission Statement */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              CrampPanchayat is built with love for everyone who menstruates. We
              believe period tracking should be private, accessible, and free
              from judgment. Your support helps us:
            </Text>
            <View style={styles.missionPoints}>
              <Text style={styles.missionPoint}>
                • Keep the app completely free
              </Text>
              <Text style={styles.missionPoint}>
                • Maintain privacy-first architecture
              </Text>
              <Text style={styles.missionPoint}>
                • Add new features and improvements
              </Text>
              <Text style={styles.missionPoint}>
                • Support open-source development
              </Text>
            </View>
          </View>

          {/* Donation Amounts */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Choose Amount</Text>
            <View style={styles.donationGrid}>
              {donationAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.donationAmount,
                    selectedAmount === amount && styles.donationAmountSelected,
                  ]}
                  onPress={() => handleDonate(amount)}
                >
                  <Text
                    style={[
                      styles.donationAmountText,
                      selectedAmount === amount &&
                        styles.donationAmountTextSelected,
                    ]}
                  >
                    ₹{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            <View style={styles.customAmountContainer}>
              <Text style={styles.customAmountLabel}>
                Or enter custom amount:
              </Text>
              <View style={styles.customAmountInput}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <Text style={styles.customAmountPlaceholder}>
                  {customAmount || "Enter amount"}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Payment Methods</Text>
            <View style={styles.paymentMethods}>
              <View style={styles.paymentMethod}>
                <Ionicons name="card" size={24} color="#E91E63" />
                <View style={styles.paymentText}>
                  <Text style={styles.paymentTitle}>UPI Payment</Text>
                  <Text style={styles.paymentSubtitle}>
                    Pay using any UPI app
                  </Text>
                </View>
              </View>
              <View style={styles.paymentMethod}>
                <Ionicons name="phone-portrait" size={24} color="#E91E63" />
                <View style={styles.paymentText}>
                  <Text style={styles.paymentTitle}>Mobile Banking</Text>
                  <Text style={styles.paymentSubtitle}>
                    PhonePe, GPay, Paytm, etc.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Thank You Message */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Thank You! 💝</Text>
            <Text style={styles.thankYouText}>
              Every contribution, no matter how small, helps us continue
              developing CrampPanchayat. Your support means the world to us and
              to everyone who benefits from this app.
            </Text>
            <Text style={styles.thankYouSignature}>
              With gratitude,{"\n"}The CrampPanchayat Team
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },

  // Header styles
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  noProfileText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },

  // Symptom tracking styles
  symptomCategory: {
    marginBottom: 25,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  symptomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  symptomCard: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  symptomCardSelected: {
    backgroundColor: "#E91E63",
    borderColor: "#C2185B",
  },
  symptomEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  symptomLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  symptomLabelSelected: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E91E63",
  },

  // Analytics styles
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  analyticsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  cycleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cycleInfo: {
    flex: 1,
  },
  cycleDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  cycleDuration: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  cycleFlow: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  flowText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  predictionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 24,
  },

  // Settings screen styles
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  profileStats: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  settingsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    padding: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E0E0E0",
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#E91E63",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  dataSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  dangerButton: {
    backgroundColor: "#F59E0B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  // Sync screen styles
  syncStatus: {
    alignItems: "center",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  lastSyncText: {
    fontSize: 12,
    color: "#666",
  },
  syncButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  syncButtonDisabled: {
    backgroundColor: "#999",
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  privacyPoints: {
    gap: 15,
  },
  privacyPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  privacyText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  dataSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dataItem: {
    alignItems: "center",
  },
  dataNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
  },
  dataLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  // Donation screen styles
  missionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    marginBottom: 15,
  },
  missionPoints: {
    gap: 8,
  },
  missionPoint: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  donationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  donationAmount: {
    width: "48%",
    aspectRatio: 2,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  donationAmountSelected: {
    backgroundColor: "#E91E63",
    borderColor: "#C2185B",
  },
  donationAmountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  donationAmountTextSelected: {
    color: "#FFFFFF",
  },
  customAmountContainer: {
    marginTop: 10,
  },
  customAmountLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  customAmountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginRight: 8,
  },
  customAmountPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  paymentMethods: {
    gap: 15,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  paymentText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  paymentSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  thankYouText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    marginBottom: 15,
  },
  thankYouSignature: {
    fontSize: 14,
    color: "#E91E63",
    fontWeight: "600",
    fontStyle: "italic",
  },
});
