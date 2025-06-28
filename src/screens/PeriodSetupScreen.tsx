// Period Setup Screen - Initial cycle setup questions
// Collects period start date, cycle length, and period duration

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { format } from "date-fns";

type PeriodSetupNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PeriodSetup"
>;

const PeriodSetupScreen: React.FC = () => {
  const navigation = useNavigation<PeriodSetupNavigationProp>();
  const { activeProfile, updateProfile } = useProfiles();

  const [currentStep, setCurrentStep] = useState(1);
  const [lastPeriodStart, setLastPeriodStart] = useState<string>("");
  const [periodLength, setPeriodLength] = useState("5");
  const [cycleLength, setCycleLength] = useState("28");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;

  const handleDateSelect = (date: any) => {
    setLastPeriodStart(date.dateString);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!lastPeriodStart) {
        Alert.alert("Please select a date", "When did your last period start?");
        return;
      }
    } else if (currentStep === 2) {
      const length = parseInt(periodLength);
      if (isNaN(length) || length < 1 || length > 10) {
        Alert.alert(
          "Invalid input",
          "Period length should be between 1-10 days"
        );
        return;
      }
    } else if (currentStep === 3) {
      const length = parseInt(cycleLength);
      if (isNaN(length) || length < 20 || length > 45) {
        Alert.alert(
          "Invalid input",
          "Cycle length should be between 20-45 days"
        );
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!activeProfile) return;

    try {
      setIsSubmitting(true);

      if (!activeProfile) {
        Alert.alert("Error", "No active profile found");
        return;
      }

      // Check if profile already has a cycle (enforce one profile = one cycle rule)
      if (activeProfile.cycles.length >= 1) {
        Alert.alert(
          "Setup Already Complete",
          `This profile (${activeProfile.emoji} ${
            activeProfile.name || "Unnamed"
          }) already has period information set up.\n\nTo track a new cycle, please create a new profile.`,
          [
            { text: "OK" },
            {
              text: "Create New Profile",
              onPress: () => navigation.navigate("ProfileSelector"),
            },
          ]
        );
        return;
      }

      const { StorageService } = await import("../services/storage");
      const storage = StorageService.getInstance();

      // Generate period days based on start date and length
      const startDate = new Date(lastPeriodStart);
      const periodDays: string[] = [];

      for (let i = 0; i < parseInt(periodLength); i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        periodDays.push(date.toISOString());
      }

      // Create initial cycle record
      await storage.addCycleRecord(activeProfile.id, {
        startDate: lastPeriodStart,
        periodDays,
        symptoms: {},
        notes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update profile settings
      await storage.updateProfile(activeProfile.id, {
        settings: {
          ...activeProfile.settings,
          averagePeriodLength: parseInt(periodLength),
          averageCycleLength: parseInt(cycleLength),
        },
      });

      Alert.alert(
        "Setup Complete! 🎉",
        "Your period information has been saved. You can now start tracking your cycles.",
        [
          {
            text: "Continue",
            onPress: () => navigation.navigate("Main"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save period information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index < currentStep ? styles.stepDotCompleted : {},
            index === currentStep - 1 ? styles.stepDotActive : {},
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When did your last period start?</Text>
      <Text style={styles.stepSubtitle}>
        This helps us predict your next period more accurately
      </Text>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [lastPeriodStart]: {
              selected: true,
              selectedColor: "#E91E63",
            },
          }}
          maxDate={format(new Date(), "yyyy-MM-dd")}
          theme={{
            selectedDayBackgroundColor: "#E91E63",
            todayTextColor: "#E91E63",
            arrowColor: "#E91E63",
          }}
        />
      </View>

      {lastPeriodStart && (
        <View style={styles.selectedDateContainer}>
          <Ionicons name="calendar" size={20} color="#E91E63" />
          <Text style={styles.selectedDateText}>
            Last period started:{" "}
            {format(new Date(lastPeriodStart), "MMMM dd, yyyy")}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        How long does your period usually last?
      </Text>
      <Text style={styles.stepSubtitle}>
        The number of days you typically bleed
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.numberInput}
          value={periodLength}
          onChangeText={setPeriodLength}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={styles.inputLabel}>days</Text>
      </View>

      <View style={styles.commonOptions}>
        <Text style={styles.commonOptionsTitle}>Common lengths:</Text>
        <View style={styles.optionsRow}>
          {["3", "4", "5", "6", "7"].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.optionButton,
                periodLength === days && styles.optionButtonSelected,
              ]}
              onPress={() => setPeriodLength(days)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  periodLength === days && styles.optionButtonTextSelected,
                ]}
              >
                {days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How long is your typical cycle?</Text>
      <Text style={styles.stepSubtitle}>
        From the first day of one period to the first day of the next
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.numberInput}
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={styles.inputLabel}>days</Text>
      </View>

      <View style={styles.commonOptions}>
        <Text style={styles.commonOptionsTitle}>Common cycle lengths:</Text>
        <View style={styles.optionsRow}>
          {["21", "24", "28", "30", "35"].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.optionButton,
                cycleLength === days && styles.optionButtonSelected,
              ]}
              onPress={() => setCycleLength(days)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  cycleLength === days && styles.optionButtonTextSelected,
                ]}
              >
                {days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          Don't worry if you're not sure - we can adjust this later as we learn
          your patterns
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FF6B9D", "#C44569"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={currentStep === 1 ? () => navigation.goBack() : handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Period Setup</Text>
          <View style={styles.placeholder} />
        </View>
        {renderStepIndicator()}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <Text style={styles.nextButtonText}>
            {isSubmitting
              ? "Saving..."
              : currentStep === totalSteps
              ? "Complete Setup"
              : "Continue"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
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
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  stepDotActive: {
    backgroundColor: "#FFF",
  },
  stepDotCompleted: {
    backgroundColor: "#FFF",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  calendarContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5EC",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#E91E63",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    gap: 12,
  },
  numberInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    minWidth: 80,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  inputLabel: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  commonOptions: {
    marginBottom: 20,
  },
  commonOptionsTitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  optionButtonSelected: {
    borderColor: "#E91E63",
    backgroundColor: "#FFE5EC",
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  optionButtonTextSelected: {
    color: "#E91E63",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  nextButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default PeriodSetupScreen;
