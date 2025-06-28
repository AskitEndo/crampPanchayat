// CrampPanchayat Symptoms Screen - Comprehensive symptom tracking
// Allows users to log symptoms with intensity and get suggestions

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, SymptomType, SymptomIntensity } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { SYMPTOMS, INTENSITY_LEVELS } from "../constants";
import { format } from "date-fns";

type SymptomsNavigationProp = StackNavigationProp<RootStackParamList>;

const SymptomsScreen: React.FC = () => {
  const navigation = useNavigation<SymptomsNavigationProp>();
  const { activeProfile, refreshProfiles } = useProfiles();
  const notesInputRef = useRef<TextInput>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomIntensity[]>(
    []
  );
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [currentSymptom, setCurrentSymptom] = useState<SymptomType | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing symptoms for the selected date
  useEffect(() => {
    if (activeProfile) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      // Check for existing symptoms on this date across cycles
      const existingSymptoms: SymptomIntensity[] = [];

      activeProfile.cycles.forEach((cycle) => {
        if (cycle.symptoms[dateStr]) {
          existingSymptoms.push(...cycle.symptoms[dateStr]);
        }
      });

      setSelectedSymptoms(existingSymptoms);

      // Load notes for this date
      activeProfile.cycles.forEach((cycle) => {
        if (cycle.notes[dateStr]) {
          setNotes(cycle.notes[dateStr]);
        }
      });
    }
  }, [activeProfile, selectedDate]);

  // Force refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
  );

  // Clear form when navigating away from screen
  useEffect(() => {
    return () => {
      // Cleanup function runs when component unmounts (user navigates away)
      resetForm();
    };
  }, []);

  // Also clear form when date changes
  useEffect(() => {
    resetForm();
  }, [selectedDate]);

  const handleSymptomSelect = (symptomType: SymptomType) => {
    setCurrentSymptom(symptomType);
    setShowIntensityModal(true);
  };

  const handleIntensitySelect = (intensity: 1 | 2 | 3 | 4 | 5) => {
    if (!currentSymptom) return;

    const newSymptom: SymptomIntensity = {
      type: currentSymptom,
      intensity,
    };

    // Remove existing entry for this symptom if any
    const filteredSymptoms = selectedSymptoms.filter(
      (s) => s.type !== currentSymptom
    );
    setSelectedSymptoms([...filteredSymptoms, newSymptom]);

    setShowIntensityModal(false);
    setCurrentSymptom(null);
  };

  const removeSymptom = (symptomType: SymptomType) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s.type !== symptomType));
  };

  // Helper function to completely reset the form
  const resetForm = () => {
    setSelectedSymptoms([]);
    setNotes("");
    if (notesInputRef.current) {
      notesInputRef.current.clear();
      notesInputRef.current.blur();
      // Force native component to clear
      setTimeout(() => {
        if (notesInputRef.current) {
          notesInputRef.current.setNativeProps({ text: "" });
        }
      }, 50);
    }
    Keyboard.dismiss();
  };

  const saveSymptoms = async () => {
    if (!activeProfile) {
      Alert.alert("Error", "No active profile found");
      return;
    }

    // Validation: Must have at least symptoms selected
    if (selectedSymptoms.length === 0) {
      Alert.alert(
        "Select Symptoms",
        "Please select at least one symptom to track. Notes can only be saved with symptoms.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSaving(true);

    try {
      const { StorageService } = await import("../services/storage");
      const storage = StorageService.getInstance();

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Add symptom record with attached notes
      await storage.addSymptomRecord(activeProfile.id, {
        date: selectedDate.toISOString(),
        symptoms: selectedSymptoms,
        notes: notes.trim() || undefined, // Attach notes directly to symptom record
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Also add notes to cycle if we have both symptoms and notes
      if (notes.trim() && activeProfile.cycles.length > 0) {
        const latestCycle =
          activeProfile.cycles[activeProfile.cycles.length - 1];
        const updatedNotes = { ...latestCycle.notes, [dateStr]: notes.trim() };

        await storage.updateProfile(activeProfile.id, {
          cycles: activeProfile.cycles.map((cycle, index) =>
            index === activeProfile.cycles.length - 1
              ? { ...cycle, notes: updatedNotes }
              : cycle
          ),
        });
      }

      // Clear the form immediately after successful save
      resetForm();

      // Force refresh to get latest data
      await refreshProfiles();

      Alert.alert("Success", "Symptoms logged successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Final safety check to ensure form is cleared
            resetForm();
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving symptoms:", error);
      Alert.alert("Error", "Failed to save symptoms");
    } finally {
      setIsSaving(false);
    }
  };

  const getSymptomSuggestions = () => {
    if (selectedSymptoms.length === 0) return [];

    const suggestions: string[] = [];

    // Advanced suggestions based on symptoms and intensity
    const hasHeadache = selectedSymptoms.some(
      (s) => s.type === "headache" && s.intensity >= 3
    );
    const hasCramps = selectedSymptoms.some(
      (s) => s.type === "cramps" && s.intensity >= 3
    );
    const hasFatigue = selectedSymptoms.some(
      (s) => s.type === "fatigue" && s.intensity >= 2
    );
    const hasNausea = selectedSymptoms.some((s) => s.type === "nausea");
    const hasBloating = selectedSymptoms.some((s) => s.type === "bloating");
    const hasMoodSwings = selectedSymptoms.some(
      (s) => s.type === "mood_swings"
    );
    const hasAcne = selectedSymptoms.some((s) => s.type === "acne");
    const hasBreastTenderness = selectedSymptoms.some(
      (s) => s.type === "breast_tenderness"
    );
    const hasInsomnia = selectedSymptoms.some((s) => s.type === "insomnia");
    const hasFoodCravings = selectedSymptoms.some(
      (s) => s.type === "food_cravings"
    );

    // Headache remedies
    if (hasHeadache) {
      suggestions.push(
        "💧 Stay hydrated - drink 8-10 glasses water",
        "🧘‍♀️ Try relaxation techniques or meditation",
        "😴 Rest in a dark, quiet room",
        "❄️ Apply cold compress to forehead"
      );
    }

    // Cramp relief
    if (hasCramps) {
      suggestions.push(
        "🔥 Apply heat therapy (heating pad/hot water bottle)",
        "🚶‍♀️ Light exercise like walking or yoga",
        "🛁 Take a warm bath with Epsom salts",
        "💊 Consider anti-inflammatory medication"
      );
    }

    // Fatigue management
    if (hasFatigue) {
      suggestions.push(
        "😴 Prioritize 7-9 hours of quality sleep",
        "🥗 Eat iron-rich foods (spinach, lentils)",
        "☕ Limit caffeine and avoid energy crashes",
        "🌱 Take short walks for natural energy"
      );
    }

    // Nausea relief
    if (hasNausea) {
      suggestions.push(
        "🫖 Try ginger tea or ginger chews",
        "🍋 Small, frequent meals throughout day",
        "🍪 Keep plain crackers nearby",
        "💨 Fresh air and deep breathing exercises"
      );
    }

    // Bloating relief
    if (hasBloating) {
      suggestions.push(
        "🥤 Drink peppermint or chamomile tea",
        "🚫 Avoid carbonated drinks and salty foods",
        "🤸‍♀️ Gentle abdominal massage",
        "🥬 Eat potassium-rich foods (bananas, avocados)"
      );
    }

    // Mood support
    if (hasMoodSwings) {
      suggestions.push(
        "🧘‍♀️ Practice mindfulness or deep breathing",
        "📱 Connect with supportive friends/family",
        "🎵 Listen to calming music",
        "📝 Journal your thoughts and feelings"
      );
    }

    // Skin care
    if (hasAcne) {
      suggestions.push(
        "🧴 Use gentle, non-comedogenic skincare",
        "🚫 Avoid touching your face frequently",
        "💧 Stay hydrated for healthy skin",
        "🥦 Eat antioxidant-rich foods"
      );
    }

    // Breast tenderness
    if (hasBreastTenderness) {
      suggestions.push(
        "👙 Wear a supportive, well-fitting bra",
        "❄️ Apply cold compress for 10-15 minutes",
        "🚫 Limit caffeine and salt intake",
        "🤗 Use loose-fitting clothing"
      );
    }

    // Sleep improvement
    if (hasInsomnia) {
      suggestions.push(
        "📱 Limit screen time 1 hour before bed",
        "🫖 Try chamomile tea or warm milk",
        "🌡️ Keep bedroom cool and dark",
        "📖 Read a book or practice relaxation"
      );
    }

    // Food cravings
    if (hasFoodCravings) {
      suggestions.push(
        "🍓 Choose dark chocolate (70%+ cacao)",
        "🥜 Keep healthy snacks like nuts nearby",
        "💧 Sometimes thirst feels like hunger",
        "🍽️ Eat balanced meals to prevent cravings"
      );
    }

    // Return unique suggestions (max 4-5 to avoid overwhelming)
    return [...new Set(suggestions)].slice(0, 5);
  };

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
        <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.gradient}>
          <View style={styles.centerContainer}>
            <Text style={styles.noProfileText}>No active profile found</Text>
            <TouchableOpacity
              style={styles.createProfileButton}
              onPress={() => navigation.navigate("ProfileSelector")}
            >
              <Text style={styles.createProfileText}>Select Profile</Text>
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Track Symptoms</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveSymptoms}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Selection */}
          <View style={styles.dateSection}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.dateText}>
                {format(selectedDate, "MMMM dd, yyyy")}
              </Text>
              <Text style={styles.dateSubtext}>
                {selectedDate.toDateString() === new Date().toDateString()
                  ? "Today"
                  : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Suggestions Section */}
          {selectedSymptoms.length > 0 &&
            getSymptomSuggestions().length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>💡 Helpful Tips</Text>
                <View>
                  {getSymptomSuggestions().map((suggestion, index) => (
                    <View key={index} style={styles.suggestionCard}>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* Symptoms Grid */}
          <View style={styles.symptomsSection}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.symptomsGrid}>
              {Object.entries(SYMPTOMS)
                .sort(([, a], [, b]) => a.priority - b.priority) // Sort by priority (common symptoms first)
                .map(([key, symptom]) => {
                  const isSelected = selectedSymptoms.some(
                    (s) => s.type === key
                  );
                  const selectedSymptom = selectedSymptoms.find(
                    (s) => s.type === key
                  );

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.symptomCard,
                        isSelected && styles.selectedSymptomCard,
                      ]}
                      onPress={() => handleSymptomSelect(key as SymptomType)}
                    >
                      <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                      <Text style={styles.symptomName}>{symptom.name}</Text>
                      {isSelected && selectedSymptom && (
                        <View style={styles.intensityIndicator}>
                          <Text style={styles.intensityText}>
                            {INTENSITY_LEVELS[selectedSymptom.intensity].emoji}
                          </Text>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeSymptom(key as SymptomType)}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              {notes.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={resetForm}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              ref={notesInputRef}
              style={styles.notesInput}
              multiline
              placeholder="Any additional notes about how you're feeling..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              onBlur={() => {
                // Ensure state is in sync when user stops editing
                if (notesInputRef.current && notes === "") {
                  notesInputRef.current.clear();
                }
              }}
              onFocus={() => {
                // Clear any existing text when user starts typing if state is empty
                if (notes === "" && notesInputRef.current) {
                  notesInputRef.current.clear();
                }
              }}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>
        </ScrollView>

        {/* Intensity Selection Modal */}
        <Modal
          visible={showIntensityModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowIntensityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                How intense is your{" "}
                {currentSymptom
                  ? SYMPTOMS[currentSymptom].name.toLowerCase()
                  : "symptom"}
                ?
              </Text>

              <View style={styles.intensityOptions}>
                {Object.entries(INTENSITY_LEVELS).map(([level, data]) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.intensityOption}
                    onPress={() =>
                      handleIntensitySelect(
                        parseInt(level) as 1 | 2 | 3 | 4 | 5
                      )
                    }
                  >
                    <Text style={styles.intensityEmoji}>{data.emoji}</Text>
                    <Text style={styles.intensityLabel}>{data.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowIntensityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noProfileText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  createProfileButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createProfileText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
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
  saveButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dateSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  dateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dateSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 2,
  },
  symptomsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  symptomCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: "48%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  selectedSymptomCard: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderColor: "white",
    borderWidth: 2,
  },
  symptomEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  symptomName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  intensityIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  intensityText: {
    fontSize: 16,
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: "rgba(255,0,0,0.7)",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  notesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clearButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginLeft: 4,
  },
  notesInput: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 15,
    color: "white",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
  },
  suggestionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  suggestionCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  suggestionText: {
    color: "white",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  intensityOptions: {
    marginBottom: 20,
  },
  intensityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  intensityEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

export default SymptomsScreen;
