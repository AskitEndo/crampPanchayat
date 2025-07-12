// CrampPanchayat Constants
// Privacy-first period tracking app configuration

import { EmojiType, SymptomType, StorageKeys } from "../types";
import Constants from "expo-constants";

// Environment Configuration - Compatible with both Expo Go and APK builds
// Try process.env first (for development/Expo Go), then fall back to Constants (for production APK)
export const ENV_CONFIG = {
  SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    Constants.expoConfig?.extra?.SUPABASE_URL ||
    "",
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
    "",
  APP_ENV:
    process.env.EXPO_PUBLIC_APP_ENV ||
    Constants.expoConfig?.extra?.APP_ENV ||
    "",
  APP_VERSION:
    process.env.EXPO_PUBLIC_APP_VERSION ||
    Constants.expoConfig?.extra?.APP_VERSION ||
    "1.0.0",
  UPI_ID:
    process.env.EXPO_PUBLIC_UPI_ID ||
    Constants.expoConfig?.extra?.UPI_ID ||
    "animatedaskit5459@okicici",
} as const;

// Debug environment variables (only in development)
if (__DEV__) {
  console.log("🔧 Environment Variables Debug:");
  console.log("Using process.env:", {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL
      ? "✅ Set"
      : "❌ Missing",
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ Set"
      : "❌ Missing",
    APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "❌ Missing",
    APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || "❌ Missing",
    UPI_ID: process.env.EXPO_PUBLIC_UPI_ID ? "✅ Set" : "❌ Missing",
  });
  console.log("Using Constants.expoConfig:", {
    SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL
      ? "✅ Set"
      : "❌ Missing",
    SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY
      ? "✅ Set"
      : "❌ Missing",
    APP_ENV: Constants.expoConfig?.extra?.APP_ENV || "❌ Missing",
    APP_VERSION: Constants.expoConfig?.extra?.APP_VERSION || "❌ Missing",
    UPI_ID: Constants.expoConfig?.extra?.UPI_ID ? "✅ Set" : "❌ Missing",
  });
  console.log("Final ENV_CONFIG:", {
    SUPABASE_URL: ENV_CONFIG.SUPABASE_URL ? "✅ Set" : "❌ Missing",
    SUPABASE_ANON_KEY: ENV_CONFIG.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
    APP_ENV: ENV_CONFIG.APP_ENV,
    APP_VERSION: ENV_CONFIG.APP_VERSION,
    UPI_ID: ENV_CONFIG.UPI_ID ? "✅ Set" : "❌ Missing",
  });
}

// App Configuration
export const APP_CONFIG = {
  NAME: "CrampPanchayat",
  VERSION: ENV_CONFIG.APP_VERSION,
  PRIVACY_POLICY_URL:
    "https://github.com/AskitEndo/crampPanchayat/blob/main/PRIVACY.md",
  TERMS_URL: "https://github.com/AskitEndo/crampPanchayat/blob/main/PRIVACY.md",
  SUPPORT_EMAIL: "support@cramppanchayat.com",
  GITHUB_REPO: "https://github.com/AskitEndo/crampPanchayat",
} as const;

// Emoji Profiles - Culturally diverse and inclusive
export const AVAILABLE_EMOJIS: EmojiType[] = [
  "🩷", // Pink Heart
  "🦋", // Butterfly
  "🌙", // Crescent Moon
  "🌟", // Star
  "🌺", // Hibiscus
  "🦄", // Unicorn
  "🌈", // Rainbow
  "💫", // Shooting Star
  "🌹", // Rose
  "🍃", // Leaf
  "🌻", // Sunflower
  "🌿", // Herb
  "🌷", // Tulip
  "🌼", // Daisy
  "✨", // Sparkles
  "🌱", // Seedling
];

// Emoji Descriptions for Accessibility
export const EMOJI_DESCRIPTIONS: Record<EmojiType, string> = {
  "🩷": "Pink Heart",
  "🦋": "Butterfly",
  "🌙": "Crescent Moon",
  "🌟": "Star",
  "🌺": "Hibiscus",
  "🦄": "Unicorn",
  "🌈": "Rainbow",
  "💫": "Shooting Star",
  "🌹": "Rose",
  "🍃": "Leaf",
  "🌻": "Sunflower",
  "🌿": "Herb",
  "🌷": "Tulip",
  "🌼": "Daisy",
  "✨": "Sparkles",
  "🌱": "Seedling",
};

// Symptom Types and Descriptions - Organized with common symptoms first
export const SYMPTOMS: Record<
  SymptomType,
  { name: string; emoji: string; category: string; priority: number }
> = {
  // Most Common - Priority 1 (displayed first)
  cramps: { name: "Cramps", emoji: "🩸", category: "Physical", priority: 1 },
  headache: {
    name: "Headache",
    emoji: "🤕",
    category: "Physical",
    priority: 1,
  },
  mood_swings: {
    name: "Mood Swings",
    emoji: "😤",
    category: "Emotional",
    priority: 1,
  },
  bloating: {
    name: "Bloating",
    emoji: "🤰",
    category: "Physical",
    priority: 1,
  },
  breast_tenderness: {
    name: "Breast Tenderness",
    emoji: "💔",
    category: "Physical",
    priority: 1,
  },
  fatigue: { name: "Fatigue", emoji: "😴", category: "Physical", priority: 1 },

  // Common - Priority 2
  nausea: { name: "Nausea", emoji: "🤢", category: "Physical", priority: 2 },
  acne: { name: "Acne", emoji: "😣", category: "Physical", priority: 2 },
  food_cravings: {
    name: "Food Cravings",
    emoji: "🍫",
    category: "Physical",
    priority: 2,
  },
  backache: {
    name: "Back Ache",
    emoji: "🦴",
    category: "Physical",
    priority: 2,
  },
  insomnia: {
    name: "Insomnia",
    emoji: "🌃",
    category: "Physical",
    priority: 2,
  },

  // Less Common - Priority 3
  diarrhea: {
    name: "Diarrhea",
    emoji: "💧",
    category: "Physical",
    priority: 3,
  },
  constipation: {
    name: "Constipation",
    emoji: "🚽",
    category: "Physical",
    priority: 3,
  },
  hot_flashes: {
    name: "Hot Flashes",
    emoji: "🔥",
    category: "Physical",
    priority: 3,
  },
  cold_chills: {
    name: "Cold Chills",
    emoji: "🥶",
    category: "Physical",
    priority: 3,
  },
  dizziness: {
    name: "Dizziness",
    emoji: "😵",
    category: "Physical",
    priority: 3,
  },
  anxiety: { name: "Anxiety", emoji: "😰", category: "Emotional", priority: 3 },
  depression: {
    name: "Low Mood",
    emoji: "😔",
    category: "Emotional",
    priority: 3,
  },
  irritability: {
    name: "Irritability",
    emoji: "😠",
    category: "Emotional",
    priority: 3,
  },
  joint_pain: {
    name: "Joint Pain",
    emoji: "🦵",
    category: "Physical",
    priority: 3,
  },
  tender_skin: {
    name: "Sensitive Skin",
    emoji: "🤲",
    category: "Physical",
    priority: 3,
  },
};

// Intensity Levels
export const INTENSITY_LEVELS = {
  1: { label: "Very Mild", color: "#E8F5E8", emoji: "😌" },
  2: { label: "Mild", color: "#C8E6C9", emoji: "🙂" },
  3: { label: "Moderate", color: "#FFF3E0", emoji: "😐" },
  4: { label: "Strong", color: "#FFCDD2", emoji: "😣" },
  5: { label: "Severe", color: "#FFCDD2", emoji: "😖" },
} as const;

// Mood Types
export const MOOD_TYPES = {
  happy: { emoji: "😊", color: "#FFE082" },
  sad: { emoji: "😢", color: "#90CAF9" },
  angry: { emoji: "😠", color: "#FFCDD2" },
  anxious: { emoji: "😰", color: "#F8BBD9" },
  neutral: { emoji: "😐", color: "#E0E0E0" },
  excited: { emoji: "🤩", color: "#C8E6C9" },
  tired: { emoji: "😴", color: "#D1C4E9" },
} as const;

// Energy Levels
export const ENERGY_LEVELS = {
  very_low: { label: "Very Low", emoji: "🔋", color: "#FFCDD2" },
  low: { label: "Low", emoji: "🔋", color: "#FFE0B2" },
  normal: { label: "Normal", emoji: "🔋", color: "#E0E0E0" },
  high: { label: "High", emoji: "🔋", color: "#C8E6C9" },
  very_high: { label: "Very High", emoji: "🔋", color: "#A5D6A7" },
} as const;

// Flow Intensity
export const FLOW_INTENSITY = {
  none: { label: "None", color: "#E0E0E0", emoji: "⚪" },
  light: { label: "Light", color: "#FFCDD2", emoji: "🔴" },
  medium: { label: "Medium", color: "#F48FB1", emoji: "🔴" },
  heavy: { label: "Heavy", color: "#E91E63", emoji: "🔴" },
  very_heavy: { label: "Very Heavy", color: "#AD1457", emoji: "🔴" },
} as const;

// Storage Keys
export const STORAGE_KEYS: StorageKeys = {
  PROFILES: "@cramppanchayat:profiles",
  ACTIVE_PROFILE: "@cramppanchayat:active_profile",
  APP_SETTINGS: "@cramppanchayat:app_settings",
  ONBOARDING_COMPLETED: "@cramppanchayat:onboarding_completed",
  DONATION_HISTORY: "@cramppanchayat:donation_history",
  ANALYTICS_DATA: "@cramppanchayat:analytics_data",
  FIRST_LAUNCH: "@cramppanchayat:first_launch",
};

// Default Settings
export const DEFAULT_SETTINGS = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
  remindersEnabled: true,
  reminderTime: "09:00",
  darkMode: false,
  language: "en",
  firstDayOfWeek: 1, // Monday
  onlineSync: false,
  donationPrompts: true,
} as const;

// Calendar Configuration
export const CALENDAR_CONFIG = {
  markedDatesLimit: 100,
  theme: {
    backgroundColor: "#ffffff",
    calendarBackground: "#ffffff",
    textSectionTitleColor: "#b6c1cd",
    selectedDayBackgroundColor: "#00adf5",
    selectedDayTextColor: "#ffffff",
    todayTextColor: "#00adf5",
    dayTextColor: "#2d4150",
    textDisabledColor: "#d9e1e8",
    dotColor: "#00adf5",
    selectedDotColor: "#ffffff",
    arrowColor: "orange",
    disabledArrowColor: "#d9e1e8",
    monthTextColor: "blue",
    indicatorColor: "blue",
    textDayFontFamily: "monospace",
    textMonthFontFamily: "monospace",
    textDayHeaderFontFamily: "monospace",
    textDayFontWeight: "300",
    textMonthFontWeight: "bold",
    textDayHeaderFontWeight: "300",
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13,
  },
} as const;

// UPI Donation Configuration
export const UPI_CONFIG = {
  UPI_ID: ENV_CONFIG.UPI_ID || "animatedaskit5459@okicici", // Fallback UPI ID
  DONATION_AMOUNTS: [5, 10, 20, 50, 100, 200, 500] as const,
  CURRENCY: "INR",
  MERCHANT_NAME: "CrampPanchayat Developer",
  PAYMENT_DESCRIPTION: "Support sCrampPanchayat Development",
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  PERIOD_REMINDER: {
    identifier: "period_reminder",
    title: "Period Reminder 🌸",
    body: "Your period might start today. Take care!",
    categoryIdentifier: "period",
  },
  CYCLE_COMPLETE: {
    identifier: "cycle_complete",
    title: "Cycle Complete 🎉",
    body: "Great job tracking your cycle!",
    categoryIdentifier: "celebration",
  },
  SYMPTOM_TRACKING: {
    identifier: "symptom_tracking",
    title: "How are you feeling? 💕",
    body: "Log your symptoms to get better insights",
    categoryIdentifier: "tracking",
  },
} as const;

// Cycle Prediction Configuration
export const PREDICTION_CONFIG = {
  MIN_CYCLES_FOR_PREDICTION: 2,
  MAX_CYCLE_VARIATION: 7, // days
  CONFIDENCE_THRESHOLD: 70, // percentage
  PREDICTION_WINDOW: 3, // months ahead
} as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  BATCH_SIZE: 50,
  SYNC_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  RETENTION_DAYS: 365,
  ANONYMOUS_ID_PREFIX: "anon_",
} as const;

// Theme Colors
export const THEME_COLORS = {
  light: {
    primary: "#E91E63",
    secondary: "#FF4081",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#212121",
    textSecondary: "#757575",
    error: "#F44336",
    success: "#4CAF50",
    warning: "#FF9800",
    accent: "#9C27B0",
  },
  dark: {
    primary: "#F48FB1",
    secondary: "#FF80AB",
    background: "#121212",
    surface: "#1E1E1E",
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    error: "#CF6679",
    success: "#81C784",
    warning: "#FFB74D",
    accent: "#CE93D8",
  },
} as const;

// App Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

// Animation Duration
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Motivational Messages
export const MOTIVATIONAL_MESSAGES = [
  "You're doing great! 🌸",
  "Every cycle is a new beginning 🌙",
  "Your body is amazing ✨",
  "Self-care is the best care 💕",
  "You're stronger than you think 🦋",
  "Listen to your body 🌿",
  "Progress, not perfection 🌟",
  "You've got this! 💪",
  "Celebrate your journey 🎉",
  "Be gentle with yourself 🌺",
] as const;

// Motivational Quotes for Calendar and Home Screen
export const MOTIVATIONAL_QUOTES = [
  "You are stronger than you know 💪",
  "Your body is doing amazing things 🌸",
  "Rest when you need to, you deserve it 💕",
  "Every cycle is a reminder of your strength 🦋",
  "Listen to your body, it knows what it needs 🌙",
  "You're not alone in this journey 🤗",
  "Period pain is temporary, your strength is forever ✨",
  "Treat yourself with extra kindness today 🌺",
  "Your cycle is part of what makes you uniquely you 🌈",
  "Small steps forward are still progress 🌱",
  "You're doing better than you think 🌟",
  "Self-care isn't selfish, it's necessary 💖",
  "Your feelings are valid, honor them 🌷",
  "Tomorrow brings new possibilities 🌅",
  "You deserve all the love and care 💝",
  "Trust your body's wisdom 🧘‍♀️",
  "Every woman's cycle story is unique and beautiful 🎨",
  "You're exactly where you need to be 🗺️",
  "Breathe through the tough moments 🌬️",
  "Your strength shines even on difficult days ⭐",
] as const;

// Period Prediction Quotes
export const PREDICTION_QUOTES = [
  "Your period might be coming soon - prepare with kindness 🌸",
  "Predicted period days ahead - stock up on your favorites! 💕",
  "Your body is preparing - listen to what it needs 🌙",
  "Gentle reminder: period essentials check! 🛍️",
  "Self-care time approaching - plan something nice 🛁",
] as const;

// Tracking Success Quotes
export const TRACKING_SUCCESS_QUOTES = [
  "Great job tracking! Knowledge is power 📊",
  "Your dedication to tracking is admirable! 🎯",
  "Another day logged - you're building valuable insights 📈",
  "Consistency in tracking = better understanding 💡",
  "Every entry helps you know yourself better 🔍",
] as const;

// Educational Tips
export const EDUCATIONAL_TIPS = [
  "Regular exercise can help reduce period cramps",
  "Iron-rich foods are important during menstruation",
  "Tracking helps you understand your unique cycle",
  "Every person's cycle is different - that's normal!",
  "Stress can affect your menstrual cycle",
  "Stay hydrated during your period",
  "Heat therapy can help with cramps",
  "Getting enough sleep supports hormonal balance",
] as const;

// Performance and UX Constants
export const PERFORMANCE_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  CACHE_TTL: 300000, // 5 minutes
  MAX_SUGGESTIONS: 4,
  AUTO_SAVE_DELAY: 2000,
} as const;

// Enhanced UI Configuration
export const UI_CONFIG = {
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    EXTRA_LARGE: 20,
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
  },
  COLORS: {
    PRIMARY: "#E91E63",
    PRIMARY_DARK: "#AD1457",
    SECONDARY: "#4ECDC4",
    SUCCESS: "#4CAF50",
    WARNING: "#FF9800",
    ERROR: "#F44336",
    WHITE_TRANSPARENT: "rgba(255,255,255,0.2)",
    WHITE_SEMI_TRANSPARENT: "rgba(255,255,255,0.15)",
    BLACK_OVERLAY: "rgba(0,0,0,0.5)",
  },
} as const;

// Enhanced Symptom Suggestions by Category
export const SYMPTOM_SUGGESTIONS_ENHANCED = {
  PAIN_RELIEF: [
    "🔥 Apply heat therapy (heating pad for 15-20 mins)",
    "❄️ Try cold compress for headaches (10-15 mins)",
    "🧘‍♀️ Practice deep breathing exercises",
    "🚶‍♀️ Light exercise like walking or gentle yoga",
    "🛁 Take a warm bath with Epsom salts",
  ],
  HYDRATION: [
    "💧 Drink 8-10 glasses of water daily",
    "🫖 Try herbal teas (ginger, chamomile, peppermint)",
    "🥤 Avoid excessive caffeine and alcohol",
    "🍋 Add lemon to water for better absorption",
  ],
  NUTRITION: [
    "🥗 Eat iron-rich foods (spinach, lentils, lean meat)",
    "🍌 Include potassium-rich foods (bananas, avocados)",
    "🥜 Snack on nuts and seeds for healthy fats",
    "🍓 Choose dark chocolate (70%+ cacao) for cravings",
    "🥦 Eat antioxidant-rich foods for skin health",
  ],
  SLEEP_WELLNESS: [
    "😴 Aim for 7-9 hours of quality sleep",
    "📱 Limit screen time 1 hour before bed",
    "🌡️ Keep bedroom cool and dark",
    "🫖 Try chamomile tea before bedtime",
    "📖 Read or practice relaxation techniques",
  ],
  EMOTIONAL_CARE: [
    "🧘‍♀️ Practice mindfulness meditation",
    "📱 Connect with supportive friends/family",
    "🎵 Listen to calming music",
    "📝 Journal your thoughts and feelings",
    "🌸 Practice self-compassion and patience",
  ],
} as const;

// Quick Tips for Common Symptoms
export const QUICK_SYMPTOM_TIPS: Record<SymptomType, string[]> = {
  headache: [
    "💧 Stay hydrated throughout the day",
    "😴 Rest in a quiet, dark room",
    "❄️ Apply cold compress to forehead",
    "🧘‍♀️ Try relaxation techniques",
  ],
  cramps: [
    "🔥 Use heating pad on lower abdomen",
    "🚶‍♀️ Gentle exercise like walking",
    "🛁 Take warm baths",
    "💊 Consider anti-inflammatory medication",
  ],
  fatigue: [
    "😴 Prioritize quality sleep",
    "🥗 Eat iron-rich foods",
    "🌱 Take short energy walks",
    "☕ Limit caffeine crashes",
  ],
  nausea: [
    "🫖 Try ginger tea or chews",
    "🍋 Eat small, frequent meals",
    "🍪 Keep crackers nearby",
    "💨 Get fresh air and breathe deeply",
  ],
  bloating: [
    "🥤 Drink peppermint tea",
    "🚫 Avoid carbonated drinks",
    "🤸‍♀️ Try gentle abdominal massage",
    "🥬 Eat potassium-rich foods",
  ],
  mood_swings: [
    "🧘‍♀️ Practice mindfulness",
    "📱 Connect with loved ones",
    "🎵 Listen to calming music",
    "📝 Write in a journal",
  ],
  acne: [
    "🧴 Use gentle skincare",
    "🚫 Avoid touching your face",
    "💧 Stay hydrated",
    "🥦 Eat antioxidant-rich foods",
  ],
  breast_tenderness: [
    "👙 Wear supportive bra",
    "❄️ Apply cold compress",
    "🚫 Limit caffeine and salt",
    "🤗 Wear loose clothing",
  ],
  insomnia: [
    "📱 No screens before bed",
    "🫖 Try chamomile tea",
    "🌡️ Keep room cool",
    "📖 Read before sleeping",
  ],
  food_cravings: [
    "🍓 Choose dark chocolate",
    "🥜 Keep healthy snacks ready",
    "💧 Drink water first",
    "🍽️ Eat balanced meals",
  ],
  backache: [
    "🔥 Apply heat therapy",
    "🧘‍♀️ Do gentle stretches",
    "💆‍♀️ Try self-massage",
    "🛏️ Use supportive pillow",
  ],
  diarrhea: [
    "� Stay hydrated",
    "🍌 Eat BRAT foods (banana, rice, applesauce, toast)",
    "🫖 Try peppermint tea",
    "🚫 Avoid dairy and caffeine",
  ],
  hot_flashes: [
    "🌬️ Use fans and cool air",
    "👕 Dress in layers",
    "� Stay hydrated",
    "❄️ Apply cool cloths",
  ],
  cold_chills: [
    "🧥 Layer warm clothing",
    "🫖 Drink warm beverages",
    "🛁 Take warm baths",
    "🔥 Use heating pads",
  ],
  dizziness: [
    "💧 Stay hydrated",
    "🪑 Sit or lie down slowly",
    "🍯 Maintain blood sugar levels",
    "🌬️ Get fresh air",
  ],
  anxiety: [
    "🧘‍♀️ Practice deep breathing",
    "🚶‍♀️ Try gentle exercise",
    "📱 Connect with support",
    "🎵 Listen to calming music",
  ],
  depression: [
    "☀️ Get natural sunlight",
    "🚶‍♀️ Stay physically active",
    "📱 Reach out to loved ones",
    "💝 Practice self-care",
  ],
  irritability: [
    "🧘‍♀️ Take deep breaths",
    "🚶‍♀️ Take a short walk",
    "🎵 Listen to soothing music",
    "💤 Ensure adequate rest",
  ],
  joint_pain: [
    "🛁 Take warm baths",
    "🚶‍♀️ Do light movement",
    "❄️ Use ice for swelling",
    "💊 Consider anti-inflammatories",
  ],
  tender_skin: [
    "🧴 Use gentle skincare products",
    "☀️ Avoid harsh chemicals",
    "💧 Keep skin moisturized",
    "🧊 Apply cool compresses",
  ],
  constipation: [
    "💧 Increase water intake",
    "🥗 Eat more fiber",
    "🚶‍♀️ Stay active",
    "🍇 Try prunes or fiber supplements",
  ],
} as const;
