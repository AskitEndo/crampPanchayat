import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const HowToUseScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#6B46C1"
        translucent={false}
      />

      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#6B46C1", "#9333EA", "#EC4899"]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>How to Use CrampPanchayat</Text>
          <Text style={styles.headerSubtitle}>
            Your complete guide to period tracking 🩷
          </Text>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Getting Started */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="play-circle" size={24} color="#6B46C1" />
              <Text style={styles.sectionTitle}>Getting Started</Text>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose Your Emoji Profile</Text>
                <Text style={styles.stepDescription}>
                  Select from 16 diverse emojis (🩷, 🦋, 🌙, 🌟, etc.) to create
                  your anonymous profile. No personal information needed!
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Add Your Profile Name</Text>
                <Text style={styles.stepDescription}>
                  Give your profile a fun name - it can be anything you like!
                  This stays completely private on your device.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Start Tracking</Text>
                <Text style={styles.stepDescription}>
                  Your profile is ready! You can now start tracking your periods
                  by tapping dates on the calendar.
                </Text>
              </View>
            </View>
          </View>

          {/* Period Tracking */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color="#EC4899" />
              <Text style={styles.sectionTitle}>Period Tracking</Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>📅 Calendar Tracking</Text>
              <Text style={styles.featureDescription}>
                • Tap any date to mark your period days{"\n"}• Red dots show
                your period dates{"\n"}• Pink predictions show expected periods
                {"\n"}• Long press to add notes to specific days
              </Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🔮 Smart Predictions</Text>
              <Text style={styles.featureDescription}>
                • App learns your cycle patterns{"\n"}• Predicts next period
                dates
                {"\n"}• Adjusts predictions as you track more{"\n"}• Shows cycle
                length and period length
              </Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🩺 Symptom Tracking</Text>
              <Text style={styles.featureDescription}>
                • Track 13+ symptom categories{"\n"}• Rate intensity from 1-5
                {"\n"}• Add personal notes{"\n"}• View patterns over time
              </Text>
            </View>
          </View>

          {/* Family Sharing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color="#10B981" />
              <Text style={styles.sectionTitle}>Family Sharing</Text>
            </View>

            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>👨‍👩‍👧‍👦 Multiple Profiles</Text>
              <Text style={styles.highlightDescription}>
                • Create separate profiles for family members{"\n"}• Each
                profile has its own data and emoji{"\n"}• Switch between
                profiles easily
                {"\n"}• All data stays private and separate{"\n"}• Perfect for
                mothers and daughters sharing a device
              </Text>
            </View>
          </View>

          {/* Cloud Sync */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud" size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Cloud Sync (Optional)</Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Cloud sync is completely optional! Your app works perfectly
                without it.
              </Text>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Create Cloud Account</Text>
                <Text style={styles.stepDescription}>
                  Go to Settings → Cloud Sync → Create Account. Choose a
                  username and password - no email needed!
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Upload Your Data</Text>
                <Text style={styles.stepDescription}>
                  Tap "Upload to Cloud" to backup your current profile data.
                  This overwrites any existing cloud data.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Sync Across Devices</Text>
                <Text style={styles.stepDescription}>
                  Sign in on other devices and "Download from Cloud" to sync
                  your data. Remember: downloading overwrites local data!
                </Text>
              </View>
            </View>

            <View style={styles.importantBox}>
              <Text style={styles.importantTitle}>⚠️ Important Notes</Text>
              <Text style={styles.importantDescription}>
                • Cloud sync is profile-specific - each profile needs its own
                cloud account{"\n"}• Upload = overwrites cloud data with local
                data{"\n"}• Download = overwrites local data with cloud data
                {"\n"}• You're signed out when switching profiles for privacy
                {"\n"}• Multiple profiles can use the same cloud account on
                different devices
              </Text>
            </View>
          </View>

          {/* Period Logic */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>
                How Period Predictions Work
              </Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🧠 Smart Algorithm</Text>
              <Text style={styles.featureDescription}>
                • Calculates your average cycle length{"\n"}• Learns your
                typical period duration{"\n"}• Adapts to irregular cycles{"\n"}•
                Improves predictions over time{"\n"}• Uses last 12 cycles for
                accuracy
              </Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>📊 What We Calculate</Text>
              <Text style={styles.featureDescription}>
                • <Text style={styles.bold}>Cycle Length:</Text> Days between
                period start dates{"\n"}•{" "}
                <Text style={styles.bold}>Period Length:</Text> How many days
                your period lasts{"\n"}•{" "}
                <Text style={styles.bold}>Next Period:</Text> Predicted start
                date{"\n"}• <Text style={styles.bold}>Fertile Window:</Text>{" "}
                Estimated ovulation time
              </Text>
            </View>
          </View>

          {/* Privacy & Data */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#059669" />
              <Text style={styles.sectionTitle}>Privacy & Your Data</Text>
            </View>

            <View style={styles.privacyBox}>
              <Text style={styles.privacyTitle}>🔒 Your Data is Safe</Text>
              <Text style={styles.privacyDescription}>
                • All data stored locally on your device{"\n"}• No personal
                information required{"\n"}• Anonymous emoji profiles only{"\n"}•
                Cloud sync is optional and anonymous{"\n"}• You can export or
                delete data anytime{"\n"}• Open source - you can verify the
                code!
              </Text>
            </View>

            <View style={styles.privacyBox}>
              <Text style={styles.privacyTitle}>📤 Data Export & Deletion</Text>
              <Text style={styles.privacyDescription}>
                • Go to Settings → Data Management{"\n"}• Export: Download all
                your data as JSON{"\n"}• Delete: Remove everything instantly
                {"\n"}• Cloud accounts can be deleted completely{"\n"}• No
                questions asked, no data recovery
              </Text>
            </View>
          </View>

          {/* Tips & Tricks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Tips & Tricks</Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Pro Tips</Text>
              <Text style={styles.tipDescription}>
                • Track consistently for better predictions{"\n"}• Use symptoms
                to identify patterns{"\n"}• Add notes for important events{"\n"}
                • Multiple profiles great for family sharing{"\n"}• Backup
                important data to cloud{"\n"}• Check statistics for health
                insights
              </Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>🚨 Troubleshooting</Text>
              <Text style={styles.tipDescription}>
                • If predictions seem off, track more cycles{"\n"}• Cloud sync
                issues? Try signing out and back in{"\n"}• App slow? Restart and
                clear cache{"\n"}• Lost data? Check if you have a cloud backup
                {"\n"}• Need help? Check our GitHub for community support
              </Text>
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={24} color="#EF4444" />
              <Text style={styles.sectionTitle}>Support This Project</Text>
            </View>

            <View style={styles.supportBox}>
              <Text style={styles.supportTitle}>💝 Made with Love</Text>
              <Text style={styles.supportDescription}>
                CrampPanchayat is a personal project created to help people
                track their periods privately. It's completely free and open
                source!
              </Text>

              <Text style={styles.supportTitle}>🙏 How to Support</Text>
              <Text style={styles.supportDescription}>
                • Use the app and share with friends{"\n"}• Contribute code on
                GitHub{"\n"}• Report bugs and suggest features{"\n"}• Optional
                donations via UPI QR code in Settings{"\n"}• Spread the word
                about privacy-first period tracking
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🩷 Happy tracking! Remember, this app is made for fun and learning.
              Your health data belongs to you - keep it private and secure.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginTop: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 10,
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6B46C1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  stepNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  featureBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  highlightBox: {
    backgroundColor: "#F0FDF4",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#065F46",
    marginBottom: 8,
  },
  highlightDescription: {
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: "#FFFBEB",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    marginLeft: 10,
    flex: 1,
  },
  importantBox: {
    backgroundColor: "#FEF3C7",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 8,
  },
  importantDescription: {
    fontSize: 14,
    color: "#B45309",
    lineHeight: 20,
  },
  privacyBox: {
    backgroundColor: "#F0F9FF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0C4A6E",
    marginBottom: 8,
  },
  privacyDescription: {
    fontSize: 14,
    color: "#075985",
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: "#FEF7CD",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#78350F",
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  supportBox: {
    backgroundColor: "#FEF2F2",
    padding: 15,
    borderRadius: 10,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#B91C1C",
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    color: "#DC2626",
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    backgroundColor: "#F3E8FF",
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#6B46C1",
    textAlign: "center",
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
});

export default HowToUseScreen;
