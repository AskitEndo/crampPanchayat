import "react-native-get-random-values";
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { SupabaseService } from "./src/services/supabase";

export default function App() {
  useEffect(() => {
    // Initialize Supabase on app start
    SupabaseService.initialize();
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="light" backgroundColor="#E91E63" />
    </>
  );
}
