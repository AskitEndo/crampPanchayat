// Profile Selector Screen - Enhanced Profile Management
// Allows users to switch between profiles, create new ones, and manage existing profiles

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, EmojiType } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { AVAILABLE_EMOJIS } from "../constants";
import { donationPromptManager } from "../utils/donationPrompt";

type ProfileSelectorNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ProfileSelector"
>;

const { width: screenWidth } = Dimensions.get("window");

const ProfileSelectorScreen: React.FC = () => {
  const navigation = useNavigation<ProfileSelectorNavigationProp>();
  const {
    profiles,
    activeProfile,
    loading,
    switching,
    selectProfile,
    createProfile,
    deleteProfile,
    refreshProfiles,
  } = useProfiles();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiType | null>(null);
  const [profileName, setProfileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [wasSwitch, setWasSwitch] = useState(false);

  // Handle navigation after switching completes
  useEffect(() => {
    if (wasSwitch && !switching) {
      // Profile switch completed, navigate back
      setWasSwitch(false);
      navigation.goBack();
    }
  }, [switching, wasSwitch, navigation]);

  const handleCreateProfile = async () => {
    if (!selectedEmoji) {
      Alert.alert("Select an Emoji", "Please choose an emoji for your profile");
      return;
    }

    try {
      setIsCreating(true);

      // Create and auto-switch to new profile
      const newProfile = await createProfile(
        selectedEmoji,
        profileName.trim() || undefined
      );

      // Close modal and reset form
      setShowCreateModal(false);
      setSelectedEmoji(null);
      setProfileName("");

      Alert.alert("Success", "Profile created successfully!", [
        {
          text: "Continue",
          onPress: async () => {
            // Navigate back to main first - this ensures the new profile is selected
            navigation.goBack();

            // Show donation prompt after navigation (delayed to ensure navigation completes)
            setTimeout(async () => {
              await donationPromptManager.showDonationPromptIfEnabled(
                navigation,
                "profile_created"
              );
            }, 500);
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create profile"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
      Alert.alert("Cannot Delete", "You must have at least one profile");
      return;
    }

    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete this profile? All data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProfile(profileId);
              Alert.alert("Success", "Profile deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete profile");
            }
          },
        },
      ]
    );
  };

  const handleSelectProfile = async (profileId: string) => {
    if (switching) return; // Prevent multiple switches

    try {
      setWasSwitch(true);
      await selectProfile(profileId);
      // Navigation will be handled by useEffect when switching completes
    } catch (error) {
      setWasSwitch(false);
      Alert.alert("Error", "Failed to select profile");
    }
  };

  const getAvailableEmojis = () => {
    const usedEmojis = profiles.map((p) => p.emoji);
    return AVAILABLE_EMOJIS.filter((emoji) => !usedEmojis.includes(emoji));
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FF6B9D", "#C44569"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Profile</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profilesContainer}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCard,
                activeProfile?.id === profile.id && styles.activeProfileCard,
                switching && styles.profileCardDisabled,
              ]}
              onPress={() => handleSelectProfile(profile.id)}
              disabled={switching}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.profileEmoji}>{profile.emoji}</Text>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>
                    {profile.name || "Unnamed Profile"}
                  </Text>
                  <Text style={styles.profileStats}>
                    {profile.cycles.length} cycles tracked
                  </Text>
                  <Text style={styles.profileDate}>
                    Active: {new Date(profile.lastActive).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.profileActions}>
                {switching ? (
                  <View style={styles.switchingIndicator}>
                    <ActivityIndicator size="small" color="#E91E63" />
                    <Text style={styles.switchingText}>Switching...</Text>
                  </View>
                ) : activeProfile?.id === profile.id ? (
                  <View style={styles.activeIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProfile(profile.id)}
                  disabled={switching}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={switching ? "#CCC" : "#FF5252"}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {profiles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No profiles found</Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>
                Create Your First Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Profile Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Profile</Text>
            <TouchableOpacity
              onPress={handleCreateProfile}
              disabled={!selectedEmoji || isCreating}
            >
              <Text
                style={[
                  styles.modalSave,
                  (!selectedEmoji || isCreating) && styles.modalSaveDisabled,
                ]}
              >
                {isCreating ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Choose an Emoji</Text>
            <View style={styles.emojiGrid}>
              {getAvailableEmojis().map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.emojiButtonSelected,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {getAvailableEmojis().length === 0 && (
              <Text style={styles.noEmojisText}>
                All emojis are in use. Delete a profile to create a new one.
              </Text>
            )}

            <Text style={styles.sectionTitle}>Profile Name (Optional)</Text>
            <TextInput
              style={styles.nameInput}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Enter profile name"
              maxLength={30}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profilesContainer: {
    gap: 16,
  },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeProfileCard: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  profileStats: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  profileDate: {
    fontSize: 12,
    color: "#999",
  },
  profileActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalCancel: {
    fontSize: 16,
    color: "#666",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalSave: {
    fontSize: 16,
    color: "#E91E63",
    fontWeight: "600",
  },
  modalSaveDisabled: {
    color: "#CCC",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    marginTop: 20,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiButtonSelected: {
    backgroundColor: "#FFE5EC",
    borderColor: "#E91E63",
  },
  emojiText: {
    fontSize: 28,
  },
  noEmojisText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginVertical: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  switchingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FFE5EC",
    borderRadius: 12,
  },
  switchingText: {
    fontSize: 12,
    color: "#E91E63",
    fontWeight: "500",
  },
  profileCardDisabled: {
    opacity: 0.6,
  },
});

export default ProfileSelectorScreen;
