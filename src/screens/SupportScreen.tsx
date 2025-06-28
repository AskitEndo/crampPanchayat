// CrampPanchayat Support Screen - Developer Information and Support
// Shows developer info, GitHub profile, LinkedIn, and donation options

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

type SupportNavigationProp = StackNavigationProp<RootStackParamList>;

const SupportScreen: React.FC = () => {
  const navigation = useNavigation<SupportNavigationProp>();
  const route = useRoute();
  const [githubProfile, setGithubProfile] = useState<any>(null);
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const donationSectionRef = useRef<View>(null);

  // Check if this is a donation prompt navigation
  const isDonationPrompt =
    (route.params as { showDonationPrompt?: boolean } | undefined)
      ?.showDonationPrompt === true;

  // Fetch GitHub profile info
  useEffect(() => {
    fetchGitHubProfile();
  }, []);

  // Handle donation prompt auto-scroll and notification
  useEffect(() => {
    if (isDonationPrompt) {
      setShowDonationPrompt(true);
      // Auto-scroll to donation section after screen loads
      const timer = setTimeout(() => {
        scrollToDonationSection();
        showDonationNotification();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDonationPrompt]);

  const fetchGitHubProfile = async () => {
    try {
      const response = await fetch("https://api.github.com/users/AskitEndo");
      const data = await response.json();
      setGithubProfile(data);
    } catch (error) {
      console.error("Failed to fetch GitHub profile:", error);
      // Fallback data
      setGithubProfile({
        name: "AskitEndo",
        bio: "Passionate developer with love for open source",
        avatar_url: "https://avatars.githubusercontent.com/u/160294709?v=4",
        public_repos: "Various",
        followers: "Open Source Community",
      });
    }
  };

  const openLink = async (url: string, linkName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          `Cannot open ${linkName}. Please try again later.`
        );
      }
    } catch (error) {
      Alert.alert("Error", `Failed to open ${linkName}`);
    }
  };

  const openGitHub = () => {
    openLink("https://github.com/AskitEndo", "GitHub");
  };

  const openLinkedIn = () => {
    openLink("https://linkedin.com/in/askitendo", "LinkedIn");
  };

  const showDonationInfo = () => {
    Alert.alert(
      "Support Development 💝",
      "Your donations help keep CrampPanchayat free and privacy-focused. Every contribution supports ongoing development and new features!",
      [
        { text: "Maybe Later" },
        {
          text: "Show QR Code",
          onPress: () => {
            /* QR code will be shown below */
          },
        },
      ]
    );
  };

  const scrollToDonationSection = () => {
    if (donationSectionRef.current && scrollViewRef.current) {
      donationSectionRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
        },
        () => console.log("Failed to measure donation section")
      );
    }
  };

  const showDonationNotification = () => {
    Alert.alert(
      "💝 Consider Supporting CrampPanchayat",
      "Your support helps keep this app free and privacy-focused for everyone. Even a small contribution makes a big difference!\n\nYou can disable these prompts in Settings → Donation Prompts.",
      [
        {
          text: "Maybe Later",
          style: "cancel",
          onPress: () => {
            if (isDonationPrompt) {
              navigation.navigate("Main");
            }
          },
        },
        {
          text: "Donate Now ❤️",
          onPress: () => {
            scrollToDonationSection();
            // Show UPI app selection
            setTimeout(() => {
              Alert.alert(
                "Open UPI App",
                "Scan the QR code with any UPI app (PhonePe, GPay, Paytm, BHIM, etc.)",
                [
                  {
                    text: "Done",
                    onPress: () => {
                      if (isDonationPrompt) {
                        navigation.navigate("Main");
                      }
                    },
                  },
                ]
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const closeDonationPrompt = () => {
    setShowDonationPrompt(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
      <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={
              isDonationPrompt ? closeDonationPrompt : () => navigation.goBack()
            }
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconContainer}>
              <Image
                source={require("../assets/images/app-icon.png")}
                style={styles.headerIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.headerTitle}>Support CrampPanchayat</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
        >
          {/* App Info */}
          <View style={styles.appInfoContainer}>
            <View style={styles.appIconContainer}>
              <View style={styles.appIconPlaceholder}>
                <Image
                  source={require("../assets/images/app-icon.png")}
                  style={{ width: 140, height: 140 }}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.appName}>CrampPanchayat</Text>
            <Text style={styles.appTagline}>Privacy-First Period Tracking</Text>
            <Text style={styles.appDescription}>
              An offline-first, secure period tracking app that respects your
              privacy. Can be synced online while keeping your data anonymous
              and secure.
            </Text>
          </View>

          {/* Developer Info */}
          <View style={styles.developerContainer}>
            <Text style={styles.sectionTitle}>Meet the Developer</Text>

            <View style={styles.developerCard}>
              {githubProfile && (
                <View style={styles.profileImageContainer}>
                  <Image
                    source={{ uri: githubProfile.avatar_url }}
                    style={styles.profileImage}
                    defaultSource={require("../assets/images/AskitEndo.png")}
                  />
                </View>
              )}

              <View style={styles.developerInfo}>
                <Text style={styles.developerName}>
                  {githubProfile?.name || "AskitEndo"}
                </Text>
                <Text style={styles.developerBio}>
                  Passionate developer with love for open source projects.
                  Believes in building tools that empower users while respecting
                  their privacy.
                </Text>
              </View>
            </View>

            {/* Social Links */}
            <View style={styles.socialLinksContainer}>
              <TouchableOpacity style={styles.socialLink} onPress={openGitHub}>
                <View style={styles.socialIconContainer}>
                  <Ionicons name="logo-github" size={24} color="#333" />
                </View>
                <View style={styles.socialLinkText}>
                  <Text style={styles.socialLinkTitle}>GitHub</Text>
                  <Text style={styles.socialLinkSubtitle}>
                    View source code & contribute
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialLink}
                onPress={openLinkedIn}
              >
                <View style={styles.socialIconContainer}>
                  <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                </View>
                <View style={styles.socialLinkText}>
                  <Text style={styles.socialLinkTitle}>LinkedIn</Text>
                  <Text style={styles.socialLinkSubtitle}>
                    Connect professionally
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Donation Section */}
          <View style={styles.donationContainer} ref={donationSectionRef}>
            <Text style={styles.sectionTitle}>Support Development</Text>
            <View style={styles.donationCard}>
              <View style={styles.upiContainer}>
                <Text style={styles.upiTitle}>Scan with any UPI app</Text>
                <View style={styles.qrCodeContainer}>
                  <Image
                    source={require("../assets/images/upi-qr.png")}
                    style={styles.upiQrImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.qrCodeSubtext}>
                    CrampPanchayat is free and will always be free. Your
                    donations help keep the app running and support new feature
                    development.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* App Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Why CrampPanchayat?</Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Privacy First</Text>
                  <Text style={styles.featureDescription}>
                    No personal information required. Anonymous emoji-based
                    profiles.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="cloud-offline" size={24} color="#FF9800" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Offline First</Text>
                  <Text style={styles.featureDescription}>
                    Works completely offline. Optional cloud sync available.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="heart" size={24} color="#E91E63" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Open Source</Text>
                  <Text style={styles.featureDescription}>
                    Transparent, community-driven development.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="people" size={24} color="#9C27B0" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Multi-User</Text>
                  <Text style={styles.featureDescription}>
                    Family sharing on a single device with separate profiles.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              Version 1.0.0 • Made with 🩷 for the community
            </Text>
            <Text style={[styles.versionText, { opacity: 0.2 }]}>
              Importantly a gift to Darpan from Askit🩷✨
            </Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  headerIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appInfoContainer: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    marginBottom: 20,
  },
  appIconContainer: {
    marginBottom: 15,
  },
  appIconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  appTagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 15,
  },
  appDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  developerContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  developerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  developerBio: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  socialLinksContainer: {
    gap: 12,
  },
  socialLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 12,
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  socialLinkText: {
    flex: 1,
  },
  socialLinkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  socialLinkSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  donationContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  donationCard: {
    alignItems: "center",
  },
  donationHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  donationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  donationDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  upiContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  upiTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  qrCodeContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    padding: 20,
  },
  qrCodePlaceholder: {
    alignItems: "center",
  },
  upiQrImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
  },
  qrCodeSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  donationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E91E63",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  donationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  featuresList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureText: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});

export default SupportScreen;
