export default {
  expo: {
    name: "CrampPanchayat",
    slug: "cramppanchayat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/images/app-icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./src/assets/images/app-icon.png",
      resizeMode: "contain",
      backgroundColor: "#E91E63",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cramppanchayat.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/app-icon.png",
        backgroundColor: "#E91E63",
      },
      package: "com.cramppanchayat.app",
    },
    web: {
      bundler: "metro",
    },
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "",
      APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
      UPI_ID: process.env.EXPO_PUBLIC_UPI_ID || "",
    },
  },
};
