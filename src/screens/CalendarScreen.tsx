// CrampPanchayat Calendar Screen - Rebuilt for Reliability
// Visual calendar with cycle tracking and predictions

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { TabParamList, RootStackParamList } from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import {
  MOTIVATIONAL_QUOTES,
  PREDICTION_QUOTES,
  TRACKING_SUCCESS_QUOTES,
  SYMPTOMS,
} from "../constants";
import { donationPromptManager } from "../utils/donationPrompt";

type CalendarNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Calendar">,
  StackNavigationProp<RootStackParamList>
>;

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarNavigationProp>();
  const { activeProfile, loading, refreshProfiles } = useProfiles();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [markedDates, setMarkedDates] = useState<any>({});
  const [currentQuote, setCurrentQuote] = useState<string>("");
  const [calendarView, setCalendarView] = useState<"calendar" | "agenda">(
    "calendar"
  );
  const [periodLogs, setPeriodLogs] = useState<
    Array<{
      date: string;
      type: "period" | "symptom" | "note";
      data: any;
    }>
  >([]);

  // Set random motivational quote
  useEffect(() => {
    const quotes = [...MOTIVATIONAL_QUOTES, ...PREDICTION_QUOTES];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Force refresh when screen is focused (to pick up new data)
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
  );

  // Generate period logs for scrolling view
  useEffect(() => {
    if (!activeProfile) return;

    const logs: any[] = [];

    console.log("=== GENERATING PERIOD LOGS ===");
    console.log("Active profile:", activeProfile.emoji);
    console.log("Cycles:", activeProfile.cycles.length);
    console.log("Symptoms:", activeProfile.symptoms.length);
    console.log("Notes:", activeProfile.notes.length);

    // Add cycle records (period days)
    activeProfile.cycles.forEach((cycle, cycleIndex) => {
      console.log(
        `Processing cycle ${cycleIndex + 1}:`,
        cycle.periodDays.length,
        "period days"
      );
      cycle.periodDays.forEach((periodDay) => {
        logs.push({
          date: periodDay,
          type: "period",
          data: { cycleId: cycle.id, isStart: periodDay === cycle.startDate },
        });
      });
    });

    // Add symptom records from profile.symptoms array
    if (activeProfile.symptoms && activeProfile.symptoms.length > 0) {
      console.log("Processing symptoms:", activeProfile.symptoms.length);
      activeProfile.symptoms.forEach((symptom, index) => {
        console.log(
          `Symptom ${index + 1}:`,
          symptom.date,
          symptom.symptoms?.length || 0,
          "symptoms"
        );
        logs.push({
          date: symptom.date,
          type: "symptom",
          data: symptom,
        });
      });
    }

    // Add notes from profile.notes array (standalone notes only)
    if (activeProfile.notes && activeProfile.notes.length > 0) {
      console.log("Processing profile notes:", activeProfile.notes.length);
      activeProfile.notes.forEach((note, index) => {
        console.log(
          `Note ${index + 1}:`,
          note.date,
          note.note?.substring(0, 50) || "No note"
        );
        logs.push({
          date: note.date,
          type: "note",
          data: {
            note: note.note,
            mood: note.mood,
            energy: note.energy,
            source: "profile",
          },
        });
      });
    } else {
      console.log("No profile notes found");
    }

    // Skip adding cycle notes separately since they're now attached to symptom records
    // This prevents duplicate display of notes that are attached to symptoms

    // Sort by date (newest first)
    logs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log("Total logs generated:", logs.length);
    console.log("Log types:", {
      period: logs.filter((l) => l.type === "period").length,
      symptom: logs.filter((l) => l.type === "symptom").length,
      note: logs.filter((l) => l.type === "note").length,
    });
    console.log("=== PERIOD LOGS COMPLETE ===\n");

    setPeriodLogs(logs);
  }, [activeProfile]);

  // Generate marked dates based on profile data - COMPLETELY FIXED VERSION
  const generateMarkedDates = useMemo(() => {
    if (!activeProfile) return {};

    const marked: any = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = format(today, "yyyy-MM-dd");

    console.log("=== CALENDAR MARKING STARTED ===");
    console.log("Profile:", activeProfile.emoji, "| Today:", todayString);
    console.log("Total cycles:", activeProfile.cycles.length);

    // STEP 1: Mark actual period days from cycles
    if (activeProfile.cycles.length > 0) {
      activeProfile.cycles.forEach((cycle, cycleIndex) => {
        console.log(`\nCycle ${cycleIndex + 1}:`, {
          startDate: cycle.startDate,
          periodDays: cycle.periodDays.length,
          endDate: cycle.endDate || "ongoing",
        });

        // Mark each actual period day
        cycle.periodDays.forEach((periodDay, dayIndex) => {
          const periodDate = new Date(periodDay);
          periodDate.setHours(0, 0, 0, 0);
          const dateString = format(periodDate, "yyyy-MM-dd");
          const isPastPeriod = periodDate < today;
          const isToday = dateString === todayString;

          // Choose color based on timing
          let selectedColor = "#E91E63"; // Current/future period (bright red)
          if (isPastPeriod && !isToday) {
            selectedColor = "#C48B9F"; // Past period (reddish grey)
          }

          marked[dateString] = {
            selected: true,
            selectedColor: selectedColor,
            selectedTextColor: "white",
            isPeriod: true,
            isPastPeriod: isPastPeriod && !isToday,
            isToday: isToday,
          };

          console.log(
            `  ✓ Period day ${dayIndex + 1}: ${dateString} (${
              isPastPeriod && !isToday ? "past" : isToday ? "today" : "current"
            })`
          );
        });

        // STEP 2: Predict next period ONLY for the most recent ongoing cycle
        if (cycleIndex === activeProfile.cycles.length - 1 && !cycle.endDate) {
          const lastStartDate = new Date(cycle.startDate);
          lastStartDate.setHours(0, 0, 0, 0);
          const cycleLength = activeProfile.settings.averageCycleLength || 28;
          const nextPeriodStart = addDays(lastStartDate, cycleLength);
          const periodLength = activeProfile.settings.averagePeriodLength || 5;

          console.log(`\nPrediction for cycle ${cycleIndex + 1}:`, {
            lastStart: format(lastStartDate, "yyyy-MM-dd"),
            cycleLength,
            nextStart: format(nextPeriodStart, "yyyy-MM-dd"),
            periodLength,
            isInFuture: nextPeriodStart > today,
          });

          // Only show predictions for future dates
          if (nextPeriodStart > today) {
            let predictedCount = 0;
            for (let i = 0; i < periodLength; i++) {
              const predDate = addDays(nextPeriodStart, i);
              const predDateString = format(predDate, "yyyy-MM-dd");

              // Don't override actual period days
              if (!marked[predDateString]) {
                marked[predDateString] = {
                  selected: true,
                  selectedColor: "#FFB3BA", // Light pink for predicted
                  selectedTextColor: "#E91E63",
                  predicted: true,
                };
                predictedCount++;
                console.log(`  ✓ Predicted day ${i + 1}: ${predDateString}`);
              }
            }
            console.log(`Total predicted days: ${predictedCount}`);
          } else {
            console.log(
              "  ⚠ Next period is in the past - no predictions shown"
            );
          }
        }
      });
    } else {
      console.log("No cycles found - no period days to mark");
    }

    // STEP 3: Mark symptom days (orange)
    if (activeProfile.symptoms && activeProfile.symptoms.length > 0) {
      console.log(`\nMarking ${activeProfile.symptoms.length} symptom days:`);
      activeProfile.symptoms.forEach((symptom, index) => {
        const symptomDate = new Date(symptom.date);
        symptomDate.setHours(0, 0, 0, 0);
        const dateString = format(symptomDate, "yyyy-MM-dd");

        if (!marked[dateString]) {
          // New symptom-only day
          marked[dateString] = {
            marked: true,
            dotColor: "#FF9800", // Orange dot for symptoms only
            hasSymptoms: true,
          };
          console.log(
            `  ✓ Symptom day ${index + 1}: ${dateString} (standalone)`
          );
        } else {
          // Add symptom flag to existing period day
          marked[dateString].hasSymptoms = true;
          console.log(`  ✓ Added symptoms to period day: ${dateString}`);
        }
      });
    }

    // STEP 4: Skip past empty days marking for now to debug
    console.log("\nSkipping past empty days marking for debug purposes");

    // STEP 5: Handle today specifically
    console.log(`\nHandling today (${todayString}):`);
    if (!marked[todayString]) {
      // Today has no data - mark as green
      marked[todayString] = {
        selected: true,
        selectedColor: "#4CAF50",
        selectedTextColor: "white",
        isToday: true,
      };
      console.log("  ✓ Today marked as green (no data)");
    } else {
      // Today has data - enhance the existing marking
      const existingData = marked[todayString];
      marked[todayString] = {
        ...existingData,
        selected: true,
        selectedColor: existingData.selectedColor || "#4CAF50", // Fallback to green if missing
        isToday: true,
      };
      console.log(
        "  ✓ Today enhanced with existing data:",
        existingData.selectedColor || "#4CAF50"
      );
    }

    // FINAL SUMMARY
    const summary = {
      total: Object.keys(marked).length,
      periods: Object.values(marked).filter((d: any) => d.isPeriod).length,
      predictions: Object.values(marked).filter((d: any) => d.predicted).length,
      symptoms: Object.values(marked).filter((d: any) => d.hasSymptoms).length,
      today: Object.values(marked).filter((d: any) => d.isToday).length,
    };

    console.log("\n=== FINAL SUMMARY ===");
    console.log("Total marked dates:", summary.total);
    console.log("Period days:", summary.periods);
    console.log("Predicted days:", summary.predictions);
    console.log("Symptom days:", summary.symptoms);
    console.log("Today entries:", summary.today);
    console.log(
      "Sample marked dates:",
      Object.keys(marked)
        .slice(0, 5)
        .map((k) => ({ date: k, data: marked[k] }))
    );
    console.log("=== CALENDAR MARKING COMPLETE ===\n");

    return marked;
  }, [activeProfile]);

  useEffect(() => {
    setMarkedDates(generateMarkedDates);
  }, [generateMarkedDates]);

  // Handle date selection
  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);

    if (!activeProfile) {
      Alert.alert("No Profile", "Please select a profile first");
      return;
    }

    const selectedDate = new Date(day.dateString);
    const today = new Date();
    const dateString = day.dateString;
    const markingData = markedDates[dateString];

    // Check if this is a predicted period day
    const isPredictedPeriod = markingData?.predicted;

    // Check if date already has period data
    const hasExistingPeriod = activeProfile.cycles.some((cycle) =>
      cycle.periodDays.some(
        (periodDay) => format(new Date(periodDay), "yyyy-MM-dd") === dateString
      )
    );

    if (hasExistingPeriod) {
      Alert.alert(
        "Period Already Logged",
        `This date is already marked as a period day.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (isPredictedPeriod) {
      Alert.alert(
        "Predicted Period Day! 🌸",
        `Did your period start on ${format(
          selectedDate,
          "MMM dd, yyyy"
        )}? This matches our prediction!`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Track Period!",
            onPress: async () => {
              await trackPeriodForDate(dateString);
              // Show success message with tracking confirmation
              const successQuote =
                TRACKING_SUCCESS_QUOTES[
                  Math.floor(Math.random() * TRACKING_SUCCESS_QUOTES.length)
                ];
              Alert.alert(
                "Period Tracked! ✨",
                `Great! Your tracking is working perfectly. ${successQuote}`,
                [
                  {
                    text: "Awesome!",
                    onPress: async () => {
                      // Show donation prompt if enabled
                      await donationPromptManager.showDonationPromptIfEnabled(
                        navigation as any,
                        "period_confirmed"
                      );
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Track Period",
        `Mark ${format(selectedDate, "MMM dd, yyyy")} as period day?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              await trackPeriodForDate(dateString);
              Alert.alert("Success! 🌺", "Period day marked successfully!", [
                {
                  text: "Great!",
                  onPress: async () => {
                    // Show donation prompt if enabled
                    await donationPromptManager.showDonationPromptIfEnabled(
                      navigation as any,
                      "period_confirmed"
                    );
                  },
                },
              ]);
            },
          },
        ]
      );
    }
  };

  // Track period for a specific date
  const trackPeriodForDate = async (dateString: string) => {
    if (!activeProfile) return;

    try {
      const { StorageService } = await import("../services/storage");
      const storage = StorageService.getInstance();

      // Find existing cycle or create new one
      const selectedDate = new Date(dateString);
      const lastCycle = activeProfile.cycles[activeProfile.cycles.length - 1];

      if (lastCycle && !lastCycle.endDate) {
        // Add to existing cycle
        const updatedPeriodDays = [
          ...lastCycle.periodDays,
          selectedDate.toISOString(),
        ];
        const updatedCycle = { ...lastCycle, periodDays: updatedPeriodDays };

        // Update the profile
        const updatedCycles = [...activeProfile.cycles];
        updatedCycles[updatedCycles.length - 1] = updatedCycle;

        await storage.updateProfile(activeProfile.id, {
          cycles: updatedCycles,
        });
      } else {
        // Check if profile already has a cycle (enforce one profile = one cycle rule)
        if (activeProfile.cycles.length >= 1) {
          Alert.alert(
            "One Profile, One Cycle 📋",
            `This profile (${activeProfile.emoji} ${
              activeProfile.name || "Unnamed"
            }) already has a cycle being tracked.\n\nTo start tracking a new cycle, please create a new profile or switch to a different profile.`,
            [
              { text: "Cancel" },
              {
                text: "Create New Profile",
                onPress: () => navigation.navigate("ProfileSelector"),
              },
              {
                text: "Switch Profile",
                onPress: () => navigation.navigate("ProfileSelector"),
              },
            ]
          );
          return;
        }

        // Create new cycle (only if no cycles exist)
        await storage.addCycleRecord(activeProfile.id, {
          startDate: selectedDate.toISOString(),
          periodDays: [selectedDate.toISOString()],
          symptoms: {},
          notes: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Refresh data
      await refreshProfiles();
    } catch (error) {
      console.error("Error tracking period:", error);
      Alert.alert("Error", "Failed to track period. Please try again.");
    }
  };

  // Get cycle info for selected date
  const getDateInfo = (dateString: string) => {
    if (!activeProfile || !dateString) return null;

    const selectedDate = new Date(dateString);
    const cycles = activeProfile.cycles;

    if (cycles.length === 0) return null;

    // Find relevant cycle
    const cycle = cycles.find((c) => {
      const startDate = new Date(c.startDate);
      const endDate = addDays(
        startDate,
        activeProfile.settings.averageCycleLength
      );
      return selectedDate >= startDate && selectedDate < endDate;
    });

    if (cycle) {
      const startDate = new Date(cycle.startDate);
      const dayInCycle = differenceInDays(selectedDate, startDate) + 1;
      const isInPeriod =
        dayInCycle <= activeProfile.settings.averagePeriodLength;

      return {
        dayInCycle,
        isInPeriod,
        cycleLength: activeProfile.settings.averageCycleLength,
      };
    }

    return null;
  };

  const selectedDateInfo = selectedDate ? getDateInfo(selectedDate) : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#E91E63", "#AD1457"]}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#E91E63", "#AD1457"]}
          style={styles.emptyContainer}
        >
          <Ionicons
            name="person-add-outline"
            size={64}
            color="rgba(255,255,255,0.7)"
          />
          <Text style={styles.emptyTitle}>No Active Profile</Text>
          <Text style={styles.emptySubtitle}>
            Select a profile from the home screen to view calendar
          </Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.viewSwitcher}
              onPress={() =>
                setCalendarView(
                  calendarView === "calendar" ? "agenda" : "calendar"
                )
              }
            >
              <Ionicons
                name={calendarView === "calendar" ? "list" : "calendar"}
                size={20}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBadge}
              onPress={() => navigation.navigate("ProfileSelector")}
            >
              <Text style={styles.profileEmoji}>{activeProfile.emoji}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Quote */}
        {currentQuote && (
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>{currentQuote}</Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Calendar or Agenda View */}
          {calendarView === "calendar" ? (
            <View style={styles.calendarContainer}>
              <Calendar
                current={format(new Date(), "yyyy-MM-dd")}
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                theme={{
                  backgroundColor: "white",
                  calendarBackground: "white",
                  textSectionTitleColor: "#E91E63",
                  selectedDayBackgroundColor: "#E91E63",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#E91E63",
                  dayTextColor: "#2d4150",
                  textDisabledColor: "#d9e1e8",
                  dotColor: "#E91E63",
                  selectedDotColor: "#ffffff",
                  arrowColor: "#E91E63",
                  disabledArrowColor: "#d9e1e8",
                  monthTextColor: "#E91E63",
                  indicatorColor: "#E91E63",
                  textDayFontWeight: "500",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
              />
            </View>
          ) : (
            <View style={styles.agendaContainer}>
              <Text style={styles.agendaTitle}>Agenda View</Text>
              <Text style={styles.agendaSubtitle}>
                Your period tracking at a glance
              </Text>

              {/* Compact Stats */}
              {activeProfile.cycles.length > 0 && (
                <View style={styles.compactStatsContainer}>
                  <View style={styles.compactStatItem}>
                    <Text style={styles.compactStatNumber}>
                      {activeProfile.cycles.length}
                    </Text>
                    <Text style={styles.compactStatLabel}>Cycles</Text>
                  </View>
                  <View style={styles.compactStatItem}>
                    <Text style={styles.compactStatNumber}>
                      {activeProfile.settings.averageCycleLength}
                    </Text>
                    <Text style={styles.compactStatLabel}>Avg Length</Text>
                  </View>
                  <View style={styles.compactStatItem}>
                    <Text style={styles.compactStatNumber}>
                      {activeProfile.settings.averagePeriodLength}
                    </Text>
                    <Text style={styles.compactStatLabel}>Period Days</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#E91E63" }]}
                />
                <Text style={styles.legendText}>Current Period</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#C48B9F" }]}
                />
                <Text style={styles.legendText}>Past Period</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FFB3BA" }]}
                />
                <Text style={styles.legendText}>Predicted Period</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FFE0B2" }]}
                />
                <Text style={styles.legendText}>Symptoms</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#F5F5F5" }]}
                />
                <Text style={styles.legendText}>Past Days</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
                />
                <Text style={styles.legendText}>Today</Text>
              </View>
            </View>
          </View>

          {/* Selected Date Info */}
          {selectedDate && (
            <View style={styles.dateInfoContainer}>
              <Text style={styles.dateInfoTitle}>
                {format(new Date(selectedDate), "MMMM dd, yyyy")}
              </Text>
              {selectedDateInfo ? (
                <View>
                  <Text style={styles.dateInfoText}>
                    Day {selectedDateInfo.dayInCycle} of cycle
                  </Text>
                  <Text style={styles.dateInfoText}>
                    {selectedDateInfo.isInPeriod ? "Period Day" : "Cycle Day"}
                  </Text>
                </View>
              ) : (
                <Text style={styles.dateInfoText}>
                  No cycle data for this date
                </Text>
              )}
            </View>
          )}

          {/* Period Logs History */}
          {periodLogs.length > 0 && (
            <View style={styles.logsContainer}>
              <Text style={styles.logsTitle}>Recent Logs & Notes</Text>
              {periodLogs.slice(0, 10).map((log, index) => (
                <View
                  key={`${log.type}-${log.date}-${index}`}
                  style={styles.logEntry}
                >
                  <View style={styles.logHeader}>
                    <View style={styles.logTypeIcon}>
                      {log.type === "period" && (
                        <Ionicons name="water" size={16} color="#E91E63" />
                      )}
                      {log.type === "symptom" && (
                        <Ionicons name="heart" size={16} color="#FF9800" />
                      )}
                      {log.type === "note" && (
                        <Ionicons
                          name="document-text"
                          size={16}
                          color="#4CAF50"
                        />
                      )}
                    </View>
                    <Text style={styles.logDate}>
                      {format(parseISO(log.date), "MMM dd, yyyy")}
                    </Text>
                    {log.type === "period" && log.data.isStart && (
                      <View style={styles.cycleStartBadge}>
                        <Text style={styles.cycleStartText}>Cycle Start</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.logContentContainer}>
                    {log.type === "period" && (
                      <Text style={[styles.logContent, styles.periodLog]}>
                        🩸 {log.data.isStart ? "Period started" : "Period day"}
                      </Text>
                    )}
                    {log.type === "symptom" && (
                      <View style={styles.symptomLogContainer}>
                        <Text style={[styles.logContent, styles.symptomLog]}>
                          💊 Symptoms logged:
                        </Text>
                        {log.data.symptoms &&
                          Array.isArray(log.data.symptoms) &&
                          log.data.symptoms.map((s: any, idx: number) => (
                            <Text key={idx} style={styles.symptomDetail}>
                              {SYMPTOMS[s.type]?.emoji || "•"}{" "}
                              {SYMPTOMS[s.type]?.name || s.type}
                              <Text style={styles.intensityText}>
                                {" "}
                                (Intensity: {s.intensity}/5)
                              </Text>
                            </Text>
                          ))}
                        {/* Handle case where symptoms might not be an array */}
                        {(!log.data.symptoms ||
                          !Array.isArray(log.data.symptoms)) && (
                          <Text style={styles.symptomDetail}>
                            • General symptoms logged
                          </Text>
                        )}
                        {/* Show notes attached to this symptom record */}
                        {log.data.notes && (
                          <View style={styles.attachedNoteContainer}>
                            <Ionicons
                              name="document-text"
                              size={14}
                              color="#4CAF50"
                            />
                            <Text style={styles.attachedNoteText}>
                              Note: {log.data.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    {log.type === "note" && (
                      <View style={styles.logContentContainer}>
                        {log.data.note && (
                          <Text style={[styles.logContent, styles.noteLog]}>
                            📝 Note
                            {log.data.source === "cycle"
                              ? " (from symptoms)"
                              : ""}
                            : {log.data.note}
                          </Text>
                        )}
                        {log.data.mood && (
                          <Text style={[styles.logContent, styles.noteLog]}>
                            😊 Mood: {log.data.mood}
                          </Text>
                        )}
                        {log.data.energy && (
                          <Text style={[styles.logContent, styles.noteLog]}>
                            ⚡ Energy: {log.data.energy}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {periodLogs.length > 10 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => navigation.navigate("Settings")}
                >
                  <Text style={styles.viewMoreText}>View All Logs</Text>
                  <Ionicons name="arrow-forward" size={16} color="#E91E63" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Stats */}
          {activeProfile.cycles.length > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Cycle Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {activeProfile.cycles.length}
                  </Text>
                  <Text style={styles.statLabel}>Cycles Tracked</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {activeProfile.settings.averageCycleLength}
                  </Text>
                  <Text style={styles.statLabel}>Avg Cycle Length</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {activeProfile.settings.averagePeriodLength}
                  </Text>
                  <Text style={styles.statLabel}>Avg Period Length</Text>
                </View>
              </View>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewSwitcher: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    padding: 10,
  },
  legendContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
  dateInfoContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dateInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dateInfoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statsContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
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
  quoteContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  quoteText: {
    color: "white",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
  },
  logsContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  logEntry: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  logTypeIcon: {
    marginRight: 8,
  },
  logDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  cycleStartBadge: {
    backgroundColor: "#E91E63",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cycleStartText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  logContent: {
    fontSize: 12,
    color: "#666",
    marginLeft: 24,
  },
  logContentContainer: {
    marginLeft: 24,
  },
  periodLog: {
    color: "#E91E63",
    fontWeight: "600",
  },
  symptomLog: {
    color: "#FF9800",
    fontWeight: "600",
    marginBottom: 4,
  },
  noteLog: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  symptomLogContainer: {
    marginLeft: 0,
  },
  symptomDetail: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    marginBottom: 2,
  },
  intensityText: {
    color: "#999",
    fontSize: 11,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#E91E63",
    marginRight: 4,
  },
  agendaContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  agendaSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  compactStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  compactStatItem: {
    alignItems: "center",
  },
  compactStatNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  attachedNoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingTop: 8,
    paddingLeft: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    padding: 8,
  },
  attachedNoteText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 6,
    flex: 1,
    fontStyle: "italic",
  },
});

export default CalendarScreen;
