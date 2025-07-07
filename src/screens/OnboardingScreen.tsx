// CrampPanchayat Onboarding Screen - Rebuilt for Reliability
// Beautiful welcome screen that guides users to create their first profile

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  TextInput,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, EmojiType } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { StorageService } from "../services/storage";
import { donationPromptManager } from "../utils/donationPrompt";

type OnboardingNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Available emojis for profile creation
const AVAILABLE_EMOJIS: EmojiType[] = [
  "🩷",
  "🦋",
  "🌙",
  "🌟",
  "🌺",
  "🦄",
  "🌈",
  "💫",
  "🌹",
  "🍃",
  "🌻",
  "🌿",
  "🌷",
  "🌼",
  "✨",
  "🌱",
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();

  const [selectedEmoji, setSelectedEmoji] = useState<EmojiType | null>(null);
  const [profileName, setProfileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleEmojiSelect = (emoji: EmojiType) => {
    setSelectedEmoji(emoji);
    // Auto-focus name input after selecting emoji
    if (!isEditingName) {
      setIsEditingName(true);
    }
  };

  const handleCreateProfile = async () => {
    if (!selectedEmoji) {
      Alert.alert("Select an Emoji", "Please choose an emoji for your profile");
      return;
    }

    try {
      setIsCreating(true);

      const storage = StorageService.getInstance();

      // Create the profile and set as active (auto-switch)
      const newProfile = await storage.createProfile(
        selectedEmoji,
        profileName.trim() || undefined,
        true // Auto-set as active
      );

      // Mark app as launched
      await storage.markFirstLaunchComplete();

      // Show success message and navigate to main app
      Alert.alert(
        "Profile Created! 🎉",
        "Welcome to CrampPanchayat! Your profile has been created successfully.",
        [
          {
            text: "Continue",
            onPress: async () => {
              // Navigate to main app first - this ensures the new profile is active
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });

              // Show donation prompt after navigation (for first profile)
              setTimeout(async () => {
                await donationPromptManager.showDonationPromptIfEnabled(
                  navigation,
                  "profile_created"
                );
              }, 1000);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error Creating Profile",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkipNaming = () => {
    handleCreateProfile();
  };

  return (
    <LinearGradient colors={["#FF6B9D", "#C44569"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.appIconContainer}>
              <Image
                source={require("../assets/images/app-icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome to{"\n"}CrampPanchayat</Text>
            <Text style={styles.subtitle}>
              Your privacy-first period tracking companion
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={24} color="#FFF" />
              <Text style={styles.featureText}>Complete Privacy</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="trending-up" size={24} color="#FFF" />
              <Text style={styles.featureText}>Smart Predictions</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="people" size={24} color="#FFF" />
              <Text style={styles.featureText}>Family Friendly</Text>
            </View>
          </View>

          {/* Profile Creation */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Choose Your Profile</Text>
            <Text style={styles.sectionSubtitle}>
              Pick an emoji that represents you. No personal details required!
            </Text>

            {/* Emoji Grid */}
            <View style={styles.emojiGrid}>
              {AVAILABLE_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.emojiButtonSelected,
                  ]}
                  onPress={() => handleEmojiSelect(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Name Input */}
            {selectedEmoji && (
              <View style={styles.nameSection}>
                <Text style={styles.nameLabel}>
                  Give your profile a name (optional)
                </Text>
                <View style={styles.nameInputContainer}>
                  <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
                  {isEditingName ? (
                    <TextInput
                      style={styles.nameTextInput}
                      value={profileName}
                      onChangeText={setProfileName}
                      placeholder="Enter profile name"
                      placeholderTextColor="#999"
                      maxLength={30}
                      autoFocus
                      onBlur={() => setIsEditingName(false)}
                      returnKeyType="done"
                    />
                  ) : (
                    <Text style={styles.nameInput}>
                      {profileName || "Unnamed Profile"}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.nameEditButton}
                  onPress={() => setIsEditingName(true)}
                >
                  <Ionicons name="pencil" size={16} color="#666" />
                  <Text style={styles.nameEditText}>Edit Name</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Create Button */}
          {selectedEmoji && (
            <TouchableOpacity
              style={[
                styles.createButton,
                isCreating && styles.createButtonDisabled,
              ]}
              onPress={handleCreateProfile}
              disabled={isCreating}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>
                {isCreating ? "Creating Profile..." : "Start Tracking"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          {/* How to Use Button */}
          <TouchableOpacity
            style={styles.howToUseButton}
            onPress={() => navigation.navigate("HowToUse")}
            activeOpacity={0.7}
          >
            <Text style={styles.howToUseButtonText}>How to Use This App</Text>
            <Ionicons name="arrow-forward" size={20} color="#6B46C1" />
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ✨ Your data stays private and secure on your device
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  appIconContainer: {
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    padding: 12,
    marginBottom: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFE5EC",
    textAlign: "center",
    opacity: 0.9,
  },
  featuresContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  profileSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiButtonSelected: {
    backgroundColor: "#FFE5EC",
    borderColor: "#FF6B9D",
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 28,
  },
  nameSection: {
    alignItems: "center",
    marginTop: 10,
  },
  nameLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: 200,
  },
  selectedEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  nameInput: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  nameTextInput: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    padding: 0,
    margin: 0,
  },
  nameEditButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  nameEditText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  createButton: {
    backgroundColor: "#FF6B9D",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#FFE5EC",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  howToUseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#6B46C1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  howToUseButtonText: {
    fontSize: 16,
    color: "#6B46C1",
    fontWeight: "600",
  },
});

export default OnboardingScreen;
