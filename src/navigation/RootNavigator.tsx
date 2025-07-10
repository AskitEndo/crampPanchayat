// CrampPanchayat Root Navigator - Rebuilt for Reliability
// Main navigation logic with onboarding flow and tab navigation

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RootStackParamList, TabParamList } from "../types";
import { StorageService } from "../services/storage";

// Screens
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ProfileSelectorScreen from "../screens/ProfileSelectorScreen";
import DataManagementScreen from "../screens/DataManagementScreen";
import PeriodSetupScreen from "../screens/PeriodSetupScreen";
import SymptomsScreen from "../screens/SymptomsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SupportScreen from "../screens/SupportScreen";
import SyncSettingsScreen from "../screens/SyncSettingsScreen";
import HowToUseScreen from "../screens/HowToUseScreen";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator Component
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Calendar":
              iconName = focused ? "calendar" : "calendar-outline";
              break;
            case "Symptoms":
              iconName = focused ? "heart" : "heart-outline";
              break;
            case "Settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#E5E5E5",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Symptoms" component={SymptomsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main Root Navigator Component
const RootNavigator: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [hasProfiles, setHasProfiles] = useState<boolean | null>(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      const storage = StorageService.getInstance();

      // Check if this is first launch
      const firstLaunch = await storage.isFirstLaunch();
      setIsFirstLaunch(firstLaunch);

      // Check if there are any profiles
      const profiles = await storage.getProfiles();
      setHasProfiles(profiles.length > 0);
    } catch (error) {
      console.error("Failed to check app state:", error);
      // Default to showing onboarding on error
      setIsFirstLaunch(true);
      setHasProfiles(false);
    }
  };

  // Function to refresh app state (called after profile creation)
  const refreshAppState = () => {
    checkAppState();
  };

  // Show loading while checking app state
  if (isFirstLaunch === null || hasProfiles === null) {
    return null; // Could show a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isFirstLaunch || !hasProfiles ? "Onboarding" : "Main"}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="ProfileSelector"
          component={ProfileSelectorScreen}
        />
        <Stack.Screen name="DataManagement" component={DataManagementScreen} />
        <Stack.Screen name="PeriodSetup" component={PeriodSetupScreen} />
        <Stack.Screen name="SyncSettings" component={SyncSettingsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="HowToUse" component={HowToUseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
