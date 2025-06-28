// CrampPanchayat Constants
// Privacy-first period tracking app configuration

import { EmojiType, SymptomType, StorageKeys } from "../types";

// App Configuration
export const APP_CONFIG = {
  NAME: "CrampPanchayat",
  VERSION: "1.0.0",
  PRIVACY_POLICY_URL: "https://cramppanchayat.com/privacy",
  TERMS_URL: "https://cramppanchayat.com/terms",
  SUPPORT_EMAIL: "support@cramppanchayat.com",
  GITHUB_REPO: "https://github.com/cramppanchayat/app",
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

// Symptom Types and Descriptions
export const SYMPTOMS: Record<
  SymptomType,
  { name: string; emoji: string; category: string }
> = {
  cramps: { name: "Cramps", emoji: "🩸", category: "Physical" },
  headache: { name: "Headache", emoji: "🤕", category: "Physical" },
  mood_swings: { name: "Mood Swings", emoji: "😤", category: "Emotional" },
  bloating: { name: "Bloating", emoji: "🤰", category: "Physical" },
  breast_tenderness: {
    name: "Breast Tenderness",
    emoji: "💔",
    category: "Physical",
  },
  fatigue: { name: "Fatigue", emoji: "😴", category: "Physical" },
  nausea: { name: "Nausea", emoji: "🤢", category: "Physical" },
  acne: { name: "Acne", emoji: "😣", category: "Physical" },
  food_cravings: { name: "Food Cravings", emoji: "🍫", category: "Physical" },
  backache: { name: "Back Ache", emoji: "🦴", category: "Physical" },
  insomnia: { name: "Insomnia", emoji: "🌃", category: "Physical" },
  diarrhea: { name: "Diarrhea", emoji: "💧", category: "Physical" },
  constipation: { name: "Constipation", emoji: "🚽", category: "Physical" },
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
  UPI_ID: "developer@cramppanchayat.upi", // Replace with actual UPI ID
  DONATION_AMOUNTS: [5, 10, 20, 50, 100, 200, 500] as const,
  CURRENCY: "INR",
  MERCHANT_NAME: "CrampPanchayat Developer",
  PAYMENT_DESCRIPTION: "Support CrampPanchayat Development",
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
