// CrampPanchayat Cloud Sync Settings Screen
// Beautiful and intuitive cloud sync management

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { CloudSyncService, CloudSyncState } from "../services/cloudSync";
import { format } from "date-fns";

type SyncNavigationProp = StackNavigationProp<RootStackParamList>;

const SyncSettingsScreen: React.FC = () => {
  const navigation = useNavigation<SyncNavigationProp>();
  const [syncState, setSyncState] = useState<CloudSyncState>({
    isSignedIn: false,
    syncEnabled: false,
    isLoading: false,
  });

  // Form states
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const cloudSync = CloudSyncService.getInstance();

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribe = cloudSync.subscribe((state) => {
      setSyncState(state);
    });

    return unsubscribe;
  }, [cloudSync]);

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

  useFocusEffect(
    useCallback(() => {
      startAnimation();

      if (Platform.OS === "android") {
        StatusBar.setBarStyle("light-content", true);
        StatusBar.setBackgroundColor("#E91E63", true);
      }

      return () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      };
    }, [startAnimation, fadeAnim, slideAnim])
  );

  // Check username availability with debouncing
  useEffect(() => {
    if (username.length >= 3 && showSignUpForm) {
      const timeoutId = setTimeout(async () => {
        setCheckingUsername(true);
        try {
          const available = await cloudSync.checkUsernameAvailability(username);
          setUsernameAvailable(available);
        } catch (error) {
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, showSignUpForm, cloudSync]);

  const handleSignUp = async () => {
    if (!username.trim() || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters long");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (usernameAvailable === false) {
      Alert.alert("Error", "Username is already taken");
      return;
    }

    setFormLoading(true);
    try {
      const result = await cloudSync.createAccount({
        username: username.trim(),
        password,
      });

      if (result.success) {
        Alert.alert(
          "Success! 🎉",
          "Your sync account has been created and you're now signed in. Your data will be automatically backed up to the cloud.",
          [
            {
              text: "Great!",
              onPress: () => {
                setShowSignUpForm(false);
                setUsername("");
                setPassword("");
                setConfirmPassword("");
              },
            },
          ]
        );
      } else {
        Alert.alert("Sign Up Failed", result.error || "Unknown error occurred");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Error", "Please enter your username and password");
      return;
    }

    setFormLoading(true);
    try {
      const result = await cloudSync.signIn({
        username: username.trim(),
        password,
      });

      if (result.success) {
        Alert.alert(
          "Welcome Back! 🎉",
          "You're now signed in and your data will sync automatically.",
          [
            {
              text: "Great!",
              onPress: () => {
                setShowSignInForm(false);
                setUsername("");
                setPassword("");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Sign In Failed",
          result.error || "Invalid username or password"
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your local data will remain, but you won't sync to the cloud until you sign in again.",
      [
        { text: "Cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await cloudSync.signOut();
              Alert.alert(
                "Signed Out",
                "You've been signed out successfully. Your local data is safe."
              );
            } catch (error) {
              Alert.alert("Error", "Failed to sign out completely");
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    try {
      const result = await cloudSync.performFullSync();

      if (result.success) {
        Alert.alert(
          "Sync Complete! ✅",
          `Successfully synced ${result.profilesSynced} profile(s) and ${result.cyclesSynced} cycle(s) to the cloud.`
        );
      } else {
        Alert.alert("Sync Failed", result.error || "Unknown error occurred");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to sync data");
    }
  };

  // NEW: Handle explicit local → cloud sync (overwrite cloud)
  const handleSyncLocalToCloud = async () => {
    try {
      const result = await cloudSync.exportToCloudSafe();

      if (result.success) {
        Alert.alert(
          "Local → Cloud Sync Complete! ✅",
          result.message ||
            "Your local data has been uploaded to the cloud and will overwrite any existing cloud data."
        );
      } else {
        Alert.alert(
          "Sync Failed",
          result.message || result.error || "Unknown error occurred"
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to sync local data to cloud");
    }
  };

  // NEW: Handle explicit cloud → local sync (overwrite local)
  const handleSyncCloudToLocal = async () => {
    // Show confirmation dialog since this overwrites local data
    Alert.alert(
      "⚠️ Overwrite Local Data?",
      "This will replace ALL your local data with data from the cloud. Your current local data will be lost.\n\nAre you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Overwrite",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await cloudSync.importFromCloudSafe();

              if (result.success) {
                Alert.alert(
                  "Cloud → Local Sync Complete! ✅",
                  result.message ||
                    `Successfully imported ${
                      result.cyclesImported || 0
                    } cycles from cloud. Your local data has been replaced.`
                );
              } else {
                Alert.alert(
                  "Sync Failed",
                  result.message || result.error || "Unknown error occurred"
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to sync cloud data to local");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "⚠️ This will permanently delete your sync account and all cloud data. Your local data will remain on this device. This action cannot be undone.",
      [
        { text: "Cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await cloudSync.deleteAccount();
              if (result.success) {
                Alert.alert(
                  "Account Deleted",
                  "Your sync account has been permanently deleted."
                );
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Failed to delete account"
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  const renderSignUpForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Create Sync Account</Text>
      <Text style={styles.formSubtitle}>
        Securely backup your period data to the cloud
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="person"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Choose a username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#999"
        />
        {checkingUsername && (
          <ActivityIndicator
            size="small"
            color="#E91E63"
            style={styles.inputIcon}
          />
        )}
        {!checkingUsername && usernameAvailable === true && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#4CAF50"
            style={styles.inputIcon}
          />
        )}
        {!checkingUsername && usernameAvailable === false && (
          <Ionicons
            name="close-circle"
            size={20}
            color="#F44336"
            style={styles.inputIcon}
          />
        )}
      </View>

      {username.length >= 3 && (
        <Text
          style={[
            styles.usernameStatus,
            {
              color:
                usernameAvailable === true
                  ? "#4CAF50"
                  : usernameAvailable === false
                  ? "#F44336"
                  : "#666",
            },
          ]}
        >
          {checkingUsername
            ? "Checking availability..."
            : usernameAvailable === true
            ? "✓ Username available"
            : usernameAvailable === false
            ? "✗ Username taken"
            : ""}
        </Text>
      )}

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Create a password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (formLoading || !username || !password || !confirmPassword) &&
            styles.disabledButton,
        ]}
        onPress={handleSignUp}
        disabled={formLoading || !username || !password || !confirmPassword}
      >
        {formLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setShowSignUpForm(false);
          setShowSignInForm(true);
          setUsername("");
          setPassword("");
          setConfirmPassword("");
        }}
      >
        <Text style={styles.secondaryButtonText}>
          Already have an account? Sign in
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setShowSignUpForm(false);
          setUsername("");
          setPassword("");
          setConfirmPassword("");
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSignInForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Sign In to Sync</Text>
      <Text style={styles.formSubtitle}>
        Enter your credentials to access your cloud data
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="person"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (formLoading || !username || !password) && styles.disabledButton,
        ]}
        onPress={handleSignIn}
        disabled={formLoading || !username || !password}
      >
        {formLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setShowSignInForm(false);
          setShowSignUpForm(true);
          setUsername("");
          setPassword("");
        }}
      >
        <Text style={styles.secondaryButtonText}>
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setShowSignInForm(false);
          setUsername("");
          setPassword("");
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#E91E63"
        translucent={false}
      />
      <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cloud Sync</Text>
            <View style={styles.headerSpacer} />
          </View>

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
              showsVerticalScrollIndicator={false}
            >
              {/* Show forms if requested */}
              {showSignUpForm && renderSignUpForm()}
              {showSignInForm && renderSignInForm()}

              {/* Main sync interface */}
              {!showSignUpForm && !showSignInForm && (
                <>
                  {/* Sync Status Card */}
                  <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                      <View style={styles.statusIcon}>
                        <Ionicons
                          name={
                            syncState.isSignedIn
                              ? "cloud-done"
                              : "cloud-offline"
                          }
                          size={32}
                          color={syncState.isSignedIn ? "#4CAF50" : "#666"}
                        />
                      </View>
                      <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>
                          {syncState.isSignedIn
                            ? "Cloud Sync Active"
                            : "Cloud Sync Disabled"}
                        </Text>
                        <Text style={styles.statusSubtitle}>
                          {syncState.isSignedIn
                            ? `Signed in as ${syncState.username || "User"}`
                            : "Sign in to backup your data to the cloud"}
                        </Text>
                      </View>
                      {syncState.isLoading && (
                        <ActivityIndicator color="#E91E63" size="small" />
                      )}
                    </View>

                    {syncState.lastSync && (
                      <View style={styles.lastSyncContainer}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.lastSyncText}>
                          Last synced:{" "}
                          {format(
                            new Date(syncState.lastSync),
                            "MMM dd, yyyy 'at' h:mm a"
                          )}
                        </Text>
                      </View>
                    )}

                    {syncState.error && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="warning" size={16} color="#F44336" />
                        <Text style={styles.errorText}>{syncState.error}</Text>
                      </View>
                    )}
                  </View>

                  {/* Sign in/Sign up buttons */}
                  {!syncState.isSignedIn && (
                    <View style={styles.authButtonsContainer}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => setShowSignUpForm(true)}
                      >
                        <Ionicons
                          name="person-add"
                          size={20}
                          color="white"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.primaryButtonText}>
                          Create Account
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setShowSignInForm(true)}
                      >
                        <Ionicons
                          name="log-in"
                          size={20}
                          color="#E91E63"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.secondaryButtonText}>Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Sync explanation for signed in users */}
                  {syncState.isSignedIn && (
                    <View style={styles.infoSection}>
                      <Text style={styles.infoTitle}>🔄 How Sync Works</Text>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="arrow-up-circle"
                          size={18}
                          color="#4CAF50"
                        />
                        <Text style={styles.infoText}>
                          <Text style={styles.infoBold}>Local → Cloud:</Text>{" "}
                          Upload your phone's data to cloud, replacing any
                          existing cloud data.
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="arrow-down-circle"
                          size={18}
                          color="#2196F3"
                        />
                        <Text style={styles.infoText}>
                          <Text style={styles.infoBold}>Cloud → Local:</Text>{" "}
                          Download cloud data to your phone, replacing your
                          current local data.
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="information-circle"
                          size={18}
                          color="#FF9800"
                        />
                        <Text style={styles.infoText}>
                          <Text style={styles.infoBold}>Choose wisely:</Text>{" "}
                          Both actions completely overwrite the destination
                          data.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Sync actions for signed in users */}
                  {syncState.isSignedIn && (
                    <View style={styles.syncActionsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.exportButton,
                          syncState.isLoading && styles.disabledButton,
                        ]}
                        onPress={handleSyncLocalToCloud}
                        disabled={syncState.isLoading}
                      >
                        <Ionicons
                          name="cloud-upload"
                          size={20}
                          color="#4CAF50"
                        />
                        <Text style={styles.actionButtonText}>
                          Sync Local → Cloud
                        </Text>
                        <Text style={styles.actionButtonSubtext}>
                          Upload & overwrite cloud data
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.importButton,
                          syncState.isLoading && styles.disabledButton,
                        ]}
                        onPress={handleSyncCloudToLocal}
                        disabled={syncState.isLoading}
                      >
                        <Ionicons
                          name="cloud-download"
                          size={20}
                          color="#2196F3"
                        />
                        <Text style={styles.actionButtonText}>
                          Sync Cloud → Local
                        </Text>
                        <Text style={styles.actionButtonSubtext}>
                          Download & overwrite local data
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          syncState.isLoading && styles.disabledButton,
                        ]}
                        onPress={handleSignOut}
                        disabled={syncState.isLoading}
                      >
                        <Ionicons name="log-out" size={20} color="#FF9800" />
                        <Text style={styles.actionButtonText}>Sign Out</Text>
                        <Text style={styles.actionButtonSubtext}>
                          Keep local data
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.dangerButton,
                          syncState.isLoading && styles.disabledButton,
                        ]}
                        onPress={handleDeleteAccount}
                        disabled={syncState.isLoading}
                      >
                        <Ionicons name="trash" size={20} color="#F44336" />
                        <Text
                          style={[styles.actionButtonText, styles.dangerText]}
                        >
                          Delete Account
                        </Text>
                        <Text
                          style={[
                            styles.actionButtonSubtext,
                            styles.dangerText,
                          ]}
                        >
                          Remove all cloud data
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Info section */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>About Cloud Sync</Text>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="shield-checkmark"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.infoText}>
                        Your data is encrypted and secure
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="phone-portrait"
                        size={20}
                        color="#2196F3"
                      />
                      <Text style={styles.infoText}>
                        Access your data on multiple devices
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="wifi" size={20} color="#FF9800" />
                      <Text style={styles.infoText}>
                        App works offline, syncs when connected
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="person" size={20} color="#9C27B0" />
                      <Text style={styles.infoText}>
                        No personal info required, just username
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
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
  },
  safeArea: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 24,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  lastSyncContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  lastSyncText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#FFEBEE",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: -8,
  },
  errorText: {
    fontSize: 13,
    color: "#F44336",
    marginLeft: 8,
    flex: 1,
  },
  authButtonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.3)",
  },
  secondaryButtonText: {
    color: "#E91E63",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  syncActionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: "#666",
    marginLeft: 12,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  dangerText: {
    color: "#F44336",
  },
  infoSection: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  usernameStatus: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 48,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  exportButton: {
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  importButton: {
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  infoBold: {
    fontWeight: "600",
    color: "#333",
  },
});

export default SyncSettingsScreen;
