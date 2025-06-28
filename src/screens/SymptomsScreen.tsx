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

      // Refresh profiles to get latest data BEFORE showing success alert
      await refreshProfiles();

      // Clear the form immediately after successful save and refresh
      setSelectedSymptoms([]);
      setNotes("");
      setSelectedDate(new Date()); // Reset to today

      // Dismiss keyboard and blur input
      Keyboard.dismiss();
      notesInputRef.current?.blur();

      Alert.alert("Success", "Symptoms logged successfully!", [
        {
          text: "OK",
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

    // Basic suggestions based on symptoms
    const hasHeadache = selectedSymptoms.some(
      (s) => s.type === "headache" && s.intensity >= 3
    );
    const hasCramps = selectedSymptoms.some(
      (s) => s.type === "cramps" && s.intensity >= 3
    );
    const hasFatigue = selectedSymptoms.some(
      (s) => s.type === "fatigue" && s.intensity >= 3
    );
    const hasNausea = selectedSymptoms.some((s) => s.type === "nausea");

    if (hasHeadache) {
      suggestions.push("💧 Stay hydrated", "🧘‍♀️ Try relaxation techniques");
    }

    if (hasCramps) {
      suggestions.push("🔥 Apply heat therapy", "🚶‍♀️ Light exercise might help");
    }

    if (hasFatigue) {
      suggestions.push("😴 Get enough rest", "🥗 Eat iron-rich foods");
    }

    if (hasNausea) {
      suggestions.push("🫖 Try ginger tea", "🍋 Small, frequent meals");
    }

    return suggestions.slice(0, 3); // Show max 3 suggestions
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

          {/* Symptoms Grid */}
          <View style={styles.symptomsSection}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.symptomsGrid}>
              {Object.entries(SYMPTOMS).map(([key, symptom]) => {
                const isSelected = selectedSymptoms.some((s) => s.type === key);
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
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              ref={notesInputRef}
              style={styles.notesInput}
              multiline
              placeholder="Any additional notes about how you're feeling..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>

          {/* Suggestions */}
          {getSymptomSuggestions().length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>💡 Suggestions</Text>
              {getSymptomSuggestions().map((suggestion, index) => (
                <View key={index} style={styles.suggestionCard}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}
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
