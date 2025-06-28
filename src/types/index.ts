// Core Types for CrampPanchayat
// Privacy-first period tracking with emoji-based profiles

export type EmojiType =
  | "🩷"
  | "🦋"
  | "🌙"
  | "🌟"
  | "🌺"
  | "🦄"
  | "🌈"
  | "💫"
  | "🌹"
  | "🍃"
  | "🌻"
  | "🌿"
  | "🌷"
  | "🌼"
  | "✨"
  | "🌱";

export interface Profile {
  id: string;
  emoji: EmojiType;
  name?: string; // Optional display name (not required for privacy)
  createdAt: string;
  lastActive: string;
  settings: ProfileSettings;
  cycles: CycleRecord[]; // NOTE: Each profile should track only ONE cycle (one-profile-one-cycle architecture)
  symptoms: SymptomRecord[];
  notes: DailyNote[];
  predictions: CyclePrediction[];
}

export interface ProfileSettings {
  averageCycleLength: number; // Default: 28 days
  averagePeriodLength: number; // Default: 5 days
  remindersEnabled: boolean;
  reminderTime: string; // HH:MM format
  darkMode: boolean;
  language: string;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  onlineSync: boolean;
  donationPrompts: boolean;
}

export interface CycleRecord {
  id: string;
  profileId: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional if ongoing
  length?: number; // Calculated cycle length
  periodDays: string[]; // Array of ISO date strings
  symptoms: { [date: string]: SymptomIntensity[] };
  notes: { [date: string]: string };
  createdAt: string;
  updatedAt: string;
}

export interface SymptomRecord {
  id: string;
  profileId: string;
  date: string; // ISO date string
  symptoms: SymptomIntensity[];
  notes?: string; // Optional notes attached to this symptom record
  createdAt: string;
  updatedAt: string;
}

export interface SymptomIntensity {
  type: SymptomType;
  intensity: 1 | 2 | 3 | 4 | 5; // 1 = Very Mild, 5 = Severe
}

export type SymptomType =
  | "cramps"
  | "headache"
  | "mood_swings"
  | "bloating"
  | "breast_tenderness"
  | "fatigue"
  | "nausea"
  | "acne"
  | "food_cravings"
  | "backache"
  | "insomnia"
  | "diarrhea"
  | "constipation"
  | "hot_flashes"
  | "cold_chills"
  | "dizziness"
  | "anxiety"
  | "depression"
  | "irritability"
  | "joint_pain"
  | "tender_skin";

export interface DailyNote {
  id: string;
  profileId: string;
  date: string; // ISO date string
  note: string;
  mood: MoodType;
  energy: EnergyLevel;
  flow: FlowIntensity;
  createdAt: string;
  updatedAt: string;
}

export type MoodType =
  | "happy"
  | "sad"
  | "angry"
  | "anxious"
  | "neutral"
  | "excited"
  | "tired";

export type EnergyLevel = "very_low" | "low" | "normal" | "high" | "very_high";

export type FlowIntensity =
  | "none"
  | "light"
  | "medium"
  | "heavy"
  | "very_heavy";

export interface CyclePrediction {
  id: string;
  profileId: string;
  predictedStartDate: string; // ISO date string
  predictedEndDate: string; // ISO date string
  confidence: number; // 0-100 percentage
  basedOnCycles: number; // Number of cycles used for prediction
  createdAt: string;
}

// Online Sync Types
export interface SyncCredentials {
  username: string;
  password: string;
  profileId?: string; // Link local profile to online account
}

export interface SyncStatus {
  isEnabled: boolean;
  lastSync: string; // ISO timestamp
  isLoading: boolean;
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ProfileSelector: undefined;
  CreateProfile: undefined;
  DataManagement: undefined;
  PeriodSetup: undefined;
  Calendar: { profileId: string };
  Symptoms: { profileId: string; date: string };
  Analytics: { profileId: string };
  Settings: { profileId: string };
  Sync: { profileId: string };
  Donation: undefined;
  Support: { showDonationPrompt?: boolean } | undefined;
};

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Symptoms: undefined;
  Settings: undefined;
};

// Calendar Types
export interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

export interface MarkedDate {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  dotColor?: string;
  period?: boolean;
  predicted?: boolean;
  ovulation?: boolean;
  fertile?: boolean;
}

// Storage Types
export interface StorageKeys {
  PROFILES: string;
  ACTIVE_PROFILE: string;
  APP_SETTINGS: string;
  ONBOARDING_COMPLETED: string;
  DONATION_HISTORY: string;
  ANALYTICS_DATA: string;
  FIRST_LAUNCH: string;
}

// Analytics Types
export interface AnalyticsData {
  totalCycles: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastCycleDate?: string;
  nextPredictedDate?: string;
  cycleLengthVariation: number;
  mostCommonSymptoms: SymptomType[];
  moodPatterns: { [key in MoodType]: number };
  energyPatterns: { [key in EnergyLevel]: number };
}

// Donation Types
export interface DonationAmount {
  amount: number;
  currency: string;
  upiId: string;
  qrCode?: string;
}

export interface DonationHistory {
  date: string;
  amount: number;
  method: "upi" | "other";
  profileId: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          emoji: EmojiType;
          settings: ProfileSettings;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          emoji: EmojiType;
          settings: ProfileSettings;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          emoji?: EmojiType;
          settings?: ProfileSettings;
          updated_at?: string;
        };
      };
      cycles: {
        Row: {
          id: string;
          profile_id: string;
          start_date: string;
          end_date?: string;
          period_days: string[];
          symptoms: { [date: string]: SymptomIntensity[] };
          notes: { [date: string]: string };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          start_date: string;
          end_date?: string;
          period_days: string[];
          symptoms?: { [date: string]: SymptomIntensity[] };
          notes?: { [date: string]: string };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          end_date?: string;
          period_days?: string[];
          symptoms?: { [date: string]: SymptomIntensity[] };
          notes?: { [date: string]: string };
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string;
          event_name: string;
          properties: Record<string, any>;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_name: string;
          properties: Record<string, any>;
          platform: string;
          created_at?: string;
        };
        Update: never;
      };
    };
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
    accent: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: object;
    h2: object;
    h3: object;
    body: object;
    caption: object;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}
