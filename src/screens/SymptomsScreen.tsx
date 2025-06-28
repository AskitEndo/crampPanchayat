// CrampPanchayat Symptoms Screen - Comprehensive symptom tracking
// Allows users to log symptoms with intensity and get suggestions

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, SymptomType, SymptomIntensity } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import {
  SYMPTOMS,
  INTENSITY_LEVELS,
  QUICK_SYMPTOM_TIPS,
  UI_CONFIG,
} from "../constants";
import { format } from "date-fns";
import { Calendar } from "react-native-calendars";

type SymptomsNavigationProp = StackNavigationProp<RootStackParamList>;

const SymptomsScreen: React.FC = () => {
  const navigation = useNavigation<SymptomsNavigationProp>();
  const { activeProfile, refreshProfiles } = useProfiles();
  const notesInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomIntensity[]>(
    []
  );
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentSymptom, setCurrentSymptom] = useState<SymptomType | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Optimized date string computation
  const dateStr = useMemo(
    () => selectedDate.toISOString().split("T")[0],
    [selectedDate]
  );

  // Optimized symptom suggestions - memoized for performance
  const symptomSuggestions = useMemo(() => {
    if (selectedSymptoms.length === 0) return [];

    const allSuggestions: string[] = [];

    // Get suggestions for each selected symptom
    selectedSymptoms.forEach((symptom) => {
      const tips = QUICK_SYMPTOM_TIPS[symptom.type];
      if (tips) {
        // Add intensity-based filtering for high intensity symptoms
        if (symptom.intensity >= 3) {
          allSuggestions.push(...tips);
        } else {
          // For mild symptoms, show only the first 2 tips
          allSuggestions.push(...tips.slice(0, 2));
        }
      }
    });

    // Remove duplicates and limit to 4 suggestions for better UX
    return [...new Set(allSuggestions)].slice(0, 4);
  }, [selectedSymptoms]);

  // Load existing data efficiently
  useEffect(() => {
    if (!activeProfile) return;

    const existingSymptoms: SymptomIntensity[] = [];
    let foundNotes = "";

    // Single loop through cycles for better performance
    activeProfile.cycles.forEach((cycle) => {
      if (cycle.symptoms[dateStr]) {
        existingSymptoms.push(...cycle.symptoms[dateStr]);
      }
      if (cycle.notes[dateStr] && !foundNotes) {
        foundNotes = cycle.notes[dateStr];
      }
    });

    setSelectedSymptoms(existingSymptoms);
    setNotes(foundNotes);

    // Update input ref if needed
    if (notesInputRef.current && foundNotes !== notes) {
      notesInputRef.current.setNativeProps({ text: foundNotes });
    }
  }, [activeProfile, dateStr]);

  // Simplified focus effect
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      return () => {
        // Cleanup on unmount
        fadeAnim.setValue(0);
      };
    }, [refreshProfiles, fadeAnim])
  );

  // Optimized form reset
  const resetForm = useCallback(() => {
    setSelectedSymptoms([]);
    setNotes("");
    if (notesInputRef.current) {
      notesInputRef.current.clear();
      notesInputRef.current.blur();
    }
    Keyboard.dismiss();
  }, []);

  const handleSymptomSelect = useCallback((symptomType: SymptomType) => {
    setCurrentSymptom(symptomType);
    setShowIntensityModal(true);
  }, []);

  const handleIntensitySelect = useCallback(
    (intensity: 1 | 2 | 3 | 4 | 5) => {
      if (!currentSymptom) return;

      const newSymptom: SymptomIntensity = {
        type: currentSymptom,
        intensity,
      };

      setSelectedSymptoms((prev) => [
        ...prev.filter((s) => s.type !== currentSymptom),
        newSymptom,
      ]);

      setShowIntensityModal(false);
      setCurrentSymptom(null);
    },
    [currentSymptom]
  );

  const removeSymptom = useCallback((symptomType: SymptomType) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.type !== symptomType));
  }, []);

  const handleDateSelect = useCallback((day: any) => {
    setSelectedDate(new Date(day.dateString));
    setShowDatePicker(false);
  }, []);

  const saveSymptoms = useCallback(async () => {
    if (!activeProfile) {
      Alert.alert("Error", "No active profile found");
      return;
    }

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

      await storage.addSymptomRecord(activeProfile.id, {
        date: selectedDate.toISOString(),
        symptoms: selectedSymptoms,
        notes: notes.trim() || undefined,
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

      resetForm();
      await refreshProfiles();

      Alert.alert("Success", "Symptoms logged successfully!", [
        { text: "OK", onPress: resetForm },
      ]);
    } catch (error) {
      console.error("Error saving symptoms:", error);
      Alert.alert("Error", "Failed to save symptoms");
    } finally {
      setIsSaving(false);
    }
  }, [
    activeProfile,
    selectedSymptoms,
    notes,
    selectedDate,
    dateStr,
    resetForm,
    refreshProfiles,
  ]);

  // Memoized symptom cards for performance
  const symptomCards = useMemo(() => {
    return Object.entries(SYMPTOMS)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([key, symptom]) => {
        const isSelected = selectedSymptoms.some((s) => s.type === key);
        const selectedSymptom = selectedSymptoms.find((s) => s.type === key);

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.symptomCard,
              isSelected && styles.selectedSymptomCard,
            ]}
            onPress={() => handleSymptomSelect(key as SymptomType)}
            accessibilityLabel={`${symptom.name} symptom`}
            accessibilityHint={
              isSelected
                ? "Tap to change intensity or remove"
                : "Tap to add symptom"
            }
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
                  accessibilityLabel={`Remove ${symptom.name}`}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        );
      });
  }, [selectedSymptoms, handleSymptomSelect, removeSymptom]);

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
        <Animated.View
          style={[styles.animatedContainer, { opacity: fadeAnim }]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Quick Actions */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Track Symptoms</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedSymptoms.length > 0
                    ? `${selectedSymptoms.length} symptom${
                        selectedSymptoms.length > 1 ? "s" : ""
                      } selected`
                    : "Select symptoms to track"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={saveSymptoms}
                disabled={isSaving || selectedSymptoms.length === 0}
                accessibilityLabel="Save symptoms"
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Enhanced Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>📅 Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                accessibilityLabel="Select date"
              >
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateText}>
                    {format(selectedDate, "MMMM dd, yyyy")}
                  </Text>
                  <Text style={styles.dateSubtext}>
                    {selectedDate.toDateString() === new Date().toDateString()
                      ? "Today"
                      : format(selectedDate, "EEEE")}
                  </Text>
                </View>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
            </View>

            {/* Suggestions Section - Now more prominent */}
            {symptomSuggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>💡 Helpful Tips</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsContainer}
                >
                  {symptomSuggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionCard}>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Symptoms Grid - Redesigned */}
            <View style={styles.symptomsSection}>
              <Text style={styles.sectionTitle}>🎭 How are you feeling?</Text>
              <View style={styles.symptomsGrid}>{symptomCards}</View>
            </View>

            {/* Enhanced Notes Section */}
            <View style={styles.notesSection}>
              <View style={styles.notesSectionHeader}>
                <Text style={styles.sectionTitle}>📝 Notes (Optional)</Text>
                {notes.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setNotes("");
                      if (notesInputRef.current) {
                        notesInputRef.current.clear();
                      }
                    }}
                    accessibilityLabel="Clear notes"
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
                textAlignVertical="top"
                accessibilityLabel="Notes input"
              />
              <Text style={styles.characterCount}>{notes.length}/500</Text>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={resetForm}
                accessibilityLabel="Clear all"
              >
                <Ionicons name="refresh-outline" size={20} color="#fff" />
                <Text style={styles.quickActionText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate("Calendar")}
                accessibilityLabel="View calendar"
              >
                <Ionicons name="calendar" size={20} color="#fff" />
                <Text style={styles.quickActionText}>View Calendar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={handleDateSelect}
                maxDate={new Date().toISOString().split("T")[0]}
                markedDates={{
                  [dateStr]: { selected: true, selectedColor: "#E91E63" },
                }}
                theme={{
                  selectedDayBackgroundColor: "#E91E63",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#E91E63",
                  arrowColor: "#E91E63",
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Intensity Selection Modal - Enhanced */}
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
                    accessibilityLabel={`${data.label} intensity`}
                  >
                    <Text style={styles.intensityEmoji}>{data.emoji}</Text>
                    <View style={styles.intensityTextContainer}>
                      <Text style={styles.intensityLabel}>{data.label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowIntensityModal(false)}
                accessibilityLabel="Cancel intensity selection"
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
  animatedContainer: {
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
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
    opacity: 0.6,
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
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonContent: {
    flex: 1,
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
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    minHeight: 80,
    justifyContent: "center",
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
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  intensityText: {
    fontSize: 16,
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: "rgba(255,0,0,0.8)",
    borderRadius: 10,
    width: 20,
    height: 20,
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
    borderRadius: 12,
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
    paddingLeft: 20,
    marginBottom: 20,
  },
  suggestionsContainer: {
    paddingRight: 20,
  },
  suggestionCard: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 200,
  },
  suggestionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickActionText: {
    color: "white",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
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
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
  },
  intensityEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  intensityTextContainer: {
    flex: 1,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  intensityDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: "#e9ecef",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  datePickerModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});

export default SymptomsScreen;
