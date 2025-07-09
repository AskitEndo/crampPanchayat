// Data Management Screen - View and manage all stored data
// Shows logs, symptoms, notes, and storage information

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  SectionList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  RootStackParamList,
  CycleRecord,
  SymptomRecord,
  DailyNote,
} from "../types";
import { useProfiles } from "../hooks/useProfiles";
import { StorageService } from "../services/storage";
import { format, parseISO } from "date-fns";
import { SYMPTOMS } from "../constants";
import * as Clipboard from "expo-clipboard";

type DataManagementNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DataManagement"
>;

interface DataEntry {
  id: string;
  date: string;
  type: "cycle" | "symptom" | "note";
  data: any;
}

const DataManagementScreen: React.FC = () => {
  const navigation = useNavigation<DataManagementNavigationProp>();
  const { activeProfile, profiles, refreshProfiles } = useProfiles();

  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [allData, setAllData] = useState<DataEntry[]>([]);
  const [selectedTab, setSelectedTab] = useState<"data" | "storage" | "export">(
    "data"
  );
  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadStorageInfo();
  }, [activeProfile]);

  const loadData = () => {
    if (!activeProfile) return;

    const entries: DataEntry[] = [];

    // Add cycle records
    activeProfile.cycles.forEach((cycle) => {
      entries.push({
        id: cycle.id,
        date: cycle.startDate,
        type: "cycle",
        data: cycle,
      });

      // Skip adding cycle notes as separate entries since they're now attached to symptoms
      // This prevents duplicate note display
    });

    // Add symptom records
    activeProfile.symptoms.forEach((symptom) => {
      entries.push({
        id: symptom.id,
        date: symptom.date,
        type: "symptom",
        data: symptom,
      });
    });

    // Add standalone notes from profile.notes array (if any exist)
    // These are notes that are NOT attached to symptoms
    activeProfile.notes.forEach((note) => {
      entries.push({
        id: note.id,
        date: note.date,
        type: "note",
        data: note,
      });
    });

    // Sort by date (newest first)
    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setAllData(entries);
  };

  const loadStorageInfo = async () => {
    try {
      const storage = StorageService.getInstance();

      // Log storage usage for developers
      await storage.logStorageUsage();

      // Get comprehensive stats
      const stats = await storage.getStorageStats();
      setStorageStats(stats);

      const profiles = await storage.getProfiles();
      const activeProfileId = await storage.getActiveProfileId();

      setStorageInfo({
        totalProfiles: stats.profileCount,
        activeProfileId,
        totalCycles: stats.totalCycles,
        totalSymptoms: stats.totalSymptoms,
        totalNotes: stats.totalNotes,
        estimatedSize: stats.estimatedSize,
        lastSync: "Never", // TODO: Implement sync tracking
      });
    } catch (error) {
      console.error("❌ Failed to load storage info:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfiles();
    loadData();
    loadStorageInfo();
    setRefreshing(false);
  };

  const handleExportData = async () => {
    try {
      const storage = StorageService.getInstance();
      const exportData = await storage.exportData();

      // Copy to clipboard
      await Clipboard.setStringAsync(exportData);

      Alert.alert(
        "Export Complete! 📤",
        `Your data has been prepared for export.\n\nData size: ${(
          exportData.length / 1024
        ).toFixed(2)} KB\n\nData copied to clipboard and logged to console.`,
        [
          { text: "OK" },
          {
            text: "View in Console",
            onPress: () => {
              console.log("📋 === EXPORTED DATA ===");
              console.log(exportData);
              console.log("📋 === END EXPORT ===");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Export Failed", "Failed to export data. Please try again.");
      console.error("Export error:", error);
    }
  };

  const handleDeleteAllData = () => {
    // Get comprehensive stats for all profiles
    const totalProfiles = profiles.length;
    const totalCycles = profiles.reduce((sum, p) => sum + p.cycles.length, 0);
    const totalSymptoms = profiles.reduce(
      (sum, p) => sum + p.symptoms.length,
      0
    );
    const totalNotes = profiles.reduce((sum, p) => sum + p.notes.length, 0);

    Alert.alert(
      "🗑️ Delete All App Data",
      `⚠️ This will PERMANENTLY delete ALL app data:\n\n📊 Complete Data Loss:\n• ${totalProfiles} profile(s)\n• ${totalCycles} cycle record(s)\n• ${totalSymptoms} symptom log(s)\n• ${totalNotes} note(s)\n\n🚨 This action is IRREVERSIBLE and will:\n• Erase all tracking history\n• Remove all profiles and data\n• Reset the app to factory state\n• Require complete re-setup\n\nAre you absolutely certain you want to delete EVERYTHING?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export All Data First",
          onPress: () => handleExportData(),
        },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            // Double confirmation for such a destructive action
            Alert.alert(
              "🚨 FINAL WARNING",
              `This is your FINAL chance to prevent total data loss.\n\nYou are about to delete:\n✗ ALL ${totalProfiles} profiles\n✗ ALL ${
                totalCycles + totalSymptoms + totalNotes
              } data entries\n✗ EVERYTHING you've tracked\n\nThis CANNOT be undone. Type continues below to proceed.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "YES, DELETE ALL",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const storage = StorageService.getInstance();

                      // Clear all app data
                      const success = await storage.clearAllData();

                      if (success) {
                        Alert.alert(
                          "✅ All Data Deleted",
                          "All app data has been permanently deleted. The app will restart to onboarding.",
                          [
                            {
                              text: "OK",
                              onPress: () => {
                                // Navigate back to onboarding
                                navigation.reset({
                                  index: 0,
                                  routes: [{ name: "Onboarding" }],
                                });
                              },
                            },
                          ]
                        );
                      } else {
                        Alert.alert("Error", "Failed to clear all data.");
                      }
                    } catch (error) {
                      console.error("Clear all data error:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete all data. Please try again."
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderDataEntry = (item: DataEntry) => {
    const date = format(parseISO(item.date), "MMM dd, yyyy");

    switch (item.type) {
      case "cycle":
        const cycle = item.data as CycleRecord;
        return (
          <View style={styles.dataEntry}>
            <View style={styles.entryHeader}>
              <Ionicons name="calendar" size={20} color="#E91E63" />
              <Text style={styles.entryTitle}>Cycle Started</Text>
              <Text style={styles.entryDate}>{date}</Text>
            </View>
            <Text style={styles.entryDetails}>
              Period days: {cycle.periodDays.length},
              {cycle.endDate
                ? ` Length: ${Math.round(
                    (new Date(cycle.endDate).getTime() -
                      new Date(cycle.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )} days`
                : " Ongoing"}
            </Text>
          </View>
        );

      case "symptom":
        const symptom = item.data as SymptomRecord;
        return (
          <View style={styles.dataEntry}>
            <View style={styles.entryHeader}>
              <Ionicons name="heart" size={20} color="#FF9800" />
              <Text style={styles.entryTitle}>Symptoms Logged</Text>
              <Text style={styles.entryDate}>{date}</Text>
            </View>
            <Text style={styles.entryDetails}>
              {symptom.symptoms
                .map(
                  (s) =>
                    `${SYMPTOMS[s.type]?.emoji} ${SYMPTOMS[s.type]?.name} (${
                      s.intensity
                    }/5)`
                )
                .join(", ")}
            </Text>
            {/* Show notes attached to this symptom record */}
            {symptom.notes && (
              <View style={styles.attachedNoteContainer}>
                <Ionicons name="document-text" size={16} color="#4CAF50" />
                <Text style={styles.attachedNoteText}>
                  Note: {symptom.notes}
                </Text>
              </View>
            )}
          </View>
        );

      case "note":
        const note = item.data as any; // Use any to handle both DailyNote and cycle notes
        return (
          <View style={styles.dataEntry}>
            <View style={styles.entryHeader}>
              <Ionicons name="document-text" size={20} color="#4CAF50" />
              <Text style={styles.entryTitle}>
                Note {note.source === "cycle" ? "(Cycle)" : ""}
              </Text>
              <Text style={styles.entryDate}>{date}</Text>
            </View>
            <Text style={styles.entryDetails}>
              {note.note}
              {note.mood && note.mood !== "N/A" && ` • Mood: ${note.mood}`}
              {note.energy &&
                note.energy !== "N/A" &&
                ` • Energy: ${note.energy}`}
              {note.flow && note.flow !== "N/A" && ` • Flow: ${note.flow}`}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderStorageInfo = () => (
    <View style={styles.storageContainer}>
      <View style={styles.storageCard}>
        <Text style={styles.storageTitle}>Storage Information</Text>
        {storageInfo && (
          <View style={styles.storageDetails}>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Total Profiles:</Text>
              <Text style={styles.storageValue}>
                {storageInfo.totalProfiles}
              </Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Active Profile:</Text>
              <Text style={styles.storageValue}>
                {activeProfile?.emoji} {activeProfile?.name || "Unnamed"}
              </Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Cycles Tracked:</Text>
              <Text style={styles.storageValue}>{storageInfo.totalCycles}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Symptoms Logged:</Text>
              <Text style={styles.storageValue}>
                {storageInfo.totalSymptoms}
              </Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Notes Written:</Text>
              <Text style={styles.storageValue}>{storageInfo.totalNotes}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Estimated Size:</Text>
              <Text style={styles.storageValue}>
                {storageInfo.estimatedSize}
              </Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Last Sync:</Text>
              <Text style={styles.storageValue}>{storageInfo.lastSync}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderExportOptions = () => (
    <View style={styles.exportContainer}>
      <View style={styles.exportCard}>
        <Text style={styles.exportTitle}>Data Export & Management</Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportData}
        >
          <Ionicons name="download-outline" size={24} color="#4CAF50" />
          <Text style={styles.exportButtonText}>
            Export Current Profile Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.deleteButton]}
          onPress={handleDeleteAllData}
        >
          <Ionicons name="trash-outline" size={24} color="#F44336" />
          <Text style={[styles.exportButtonText, styles.deleteButtonText]}>
            Delete All Data
          </Text>
        </TouchableOpacity>

        <Text style={styles.exportNote}>
          Export includes all cycles, symptoms, notes, and settings for the
          current profile. Data is stored locally on your device for privacy.
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Management</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "data" && styles.activeTab]}
            onPress={() => setSelectedTab("data")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "data" && styles.activeTabText,
              ]}
            >
              Data
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "storage" && styles.activeTab]}
            onPress={() => setSelectedTab("storage")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "storage" && styles.activeTabText,
              ]}
            >
              Storage
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "export" && styles.activeTab]}
            onPress={() => setSelectedTab("export")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "export" && styles.activeTabText,
              ]}
            >
              Export
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === "data" && (
          <View style={styles.dataContainer}>
            {!activeProfile ? (
              <Text style={styles.noProfileText}>No active profile</Text>
            ) : allData.length === 0 ? (
              <Text style={styles.noDataText}>No data logged yet</Text>
            ) : (
              allData.map((entry) => (
                <View key={`${entry.type}-${entry.id}`}>
                  {renderDataEntry(entry)}
                </View>
              ))
            )}
          </View>
        )}

        {selectedTab === "storage" && renderStorageInfo()}
        {selectedTab === "export" && renderExportOptions()}
      </ScrollView>
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
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#FFF",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFF",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dataContainer: {
    gap: 12,
  },
  dataEntry: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    color: "#666",
  },
  entryDetails: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  noProfileText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 40,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 40,
  },
  storageContainer: {
    gap: 16,
  },
  storageCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  storageDetails: {
    gap: 12,
  },
  storageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storageLabel: {
    fontSize: 14,
    color: "#666",
  },
  storageValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  exportContainer: {
    gap: 16,
  },
  exportCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  deleteButtonText: {
    color: "#F44336",
  },
  exportNote: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 8,
    fontStyle: "italic",
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
    fontSize: 13,
    color: "#4CAF50",
    marginLeft: 6,
    flex: 1,
    fontStyle: "italic",
  },
});

export default DataManagementScreen;
