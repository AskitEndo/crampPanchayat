# 🩷 CrampPanchayat

<div align="center">
  <img src="src/assets/images/app-icon.png" alt="CrampPanchayat App Icon" width="120" height="120" style="border-radius: 20px"/>
  
  **Privacy-First Period Tracking App**
  
  *Anonymous • Offline-First • Cultural Sensitivity*
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.74.5-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-51.0.28-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

</div>

## 🌟 Overview

CrampPanchayat is a **production-ready** offline-first period tracking app that prioritizes user privacy and accessibility. Built with React Native and TypeScript, it offers an emoji-based anonymous profile system, ensuring users can track their menstrual health without compromising personal data.

### ✨ Key Features

- **🎭 Emoji-Based Anonymous Profiles**: Choose from 16 culturally diverse emojis (🩷, 🦋, 🌙, 🌟, etc.)
- **📱 Offline-First Architecture**: Works completely offline with optional cloud sync
- **🔒 Privacy-First Design**: No email, phone numbers, or personal information required
- **📅 Smart Calendar Tracking**: Manual date selection with intelligent cycle predictions
- **🩺 Comprehensive Symptom Tracking**: 13+ categories with intensity ratings and notes
- **👨‍👩‍👧‍👦 Multi-User Support**: Family sharing on a single device
- **☁️ Real-time Cloud Sync**: Secure username-based cloud accounts with instant availability checking
- **📊 Live Statistics**: Real-time cloud user statistics and community insights

## 🏗️ Architecture

### Tech Stack

| Technology                 | Version  | Purpose                             |
| -------------------------- | -------- | ----------------------------------- |
| **React Native**           | 0.74.5   | Cross-platform mobile framework     |
| **Expo**                   | 51.0.28  | Development platform and deployment |
| **TypeScript**             | 5.3.3    | Type-safe JavaScript                |
| **React Navigation**       | 6.x      | Type-safe navigation                |
| **AsyncStorage**           | 1.23.1   | Offline-first local storage         |
| **Supabase**               | 2.43.5   | Optional cloud sync with RLS        |
| **React Native Calendars** | 1.1306.0 | Calendar components                 |
| **Expo Linear Gradient**   | 13.0.2   | Beautiful UI gradients              |

### 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ProfileCard/     # Emoji profile displays
│   ├── SymptomCard/     # Symptom tracking widgets
│   └── CalendarCard/    # Calendar components
├── screens/            # Application screens
│   ├── HomeScreen/      # Dashboard with cycle overview
│   ├── CalendarScreen/  # Period tracking calendar
│   ├── SymptomsScreen/  # Symptom logging interface
│   ├── SettingsScreen/  # App configuration
│   ├── ProfileSelector/ # Emoji profile management
│   ├── DataManagement/ # Export/import/delete data
│   ├── OnboardingScreen/# First-time user experience
│   └── SupportScreen/   # Help and donations
├── services/           # Business logic and APIs
│   ├── storage.ts      # AsyncStorage wrapper
│   ├── supabase.ts     # Cloud sync service with real-time features
│   ├── cloudSync.ts    # Enhanced cloud synchronization
│   ├── periodTracking.ts # Unified period tracking logic
│   └── analytics.ts    # Anonymous usage tracking
├── hooks/              # Custom React hooks
│   ├── useProfiles.ts  # Profile management logic
│   ├── usePeriodTracking.ts # Unified period data operations
│   └── useSymptoms.ts  # Symptom tracking logic
├── types/              # TypeScript definitions
│   ├── index.ts        # Core type definitions
│   └── navigation.ts   # Navigation types
├── constants/          # App configuration
│   └── index.ts        # Emojis, symptoms, settings
├── utils/              # Utility functions
│   ├── dateUtils.ts    # Date manipulation helpers
│   ├── cycleCalculations.ts # Prediction algorithms
│   └── optimization.ts # Performance utilities
└── navigation/         # Navigation configuration
    └── RootNavigator.tsx # Main navigation setup
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/askitendo/cramppanchayat.git
   cd cramppanchayat
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials (optional)
   ```

4. **Start the development server**

   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator**

   ```bash
   # Android
   npm run android

   # iOS
   npm run ios

   # Web
   npm run web
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Optional - for cloud sync)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Analytics (Optional - anonymous only)
EXPO_PUBLIC_ANALYTICS_ENABLED=false
```

**Note**: The app works perfectly without any environment variables - all cloud features are optional!

### Supabase Setup (Optional)

For cloud sync functionality, follow the **comprehensive setup guide**:

1. **Quick Setup**: Use the complete database setup script

   ```bash
   # Run SUPABASE_COMPLETE_SETUP.sql in your Supabase SQL editor
   # This includes all tables, functions, triggers, and security policies
   ```

2. **Features Included**:

   - ✅ **Real-time Username Availability**: Instant feedback during account creation
   - ✅ **Robust User Management**: Complete user deletion with proper cleanup
   - ✅ **Row Level Security**: Advanced RLS policies for data protection
   - ✅ **Cloud Statistics**: Live user count and community insights
   - ✅ **Anonymous Sync**: Privacy-first cloud data synchronization

3. **Database Functions**:
   - `check_username_exists()` - Real-time username availability checking
   - `delete_user_complete()` - Safe user deletion with full cleanup
   - `validate_period_data()` - Data integrity validation

For detailed setup instructions, see [`SUPABASE_COMPLETE_SETUP.sql`](SUPABASE_COMPLETE_SETUP.sql).

## 📱 Features in Detail

### 🎭 Anonymous Emoji Profiles

Choose from 16 carefully selected emojis representing diverse identities:

- 🩷 Pink Heart, 🦋 Butterfly, 🌙 Crescent Moon, 🌟 Star
- 🌺 Hibiscus, 🦄 Unicorn, 🌈 Rainbow, 💫 Shooting Star
- 🌹 Rose, 🍃 Leaf, 🌻 Sunflower, 🌿 Herb
- 🌷 Tulip, 🌼 Daisy, ✨ Sparkles, 🌱 Seedling

### 📅 Smart Period Tracking

- **Manual Date Selection**: Tap calendar dates to log periods
- **Cycle Predictions**: AI-powered predictions based on personal patterns
- **Flexible Tracking**: Handle irregular cycles and variations
- **Historical Data**: View past cycles and identify patterns

### 🩺 Comprehensive Symptom Tracking

Track 13+ symptom categories with intensity levels (1-5):

| Physical             | Emotional       | Other             |
| -------------------- | --------------- | ----------------- |
| Cramps 🩸            | Mood Swings 😤  | Sleep Issues 😴   |
| Headache 🤕          | Anxiety 😰      | Food Cravings 🍫  |
| Bloating 🤰          | Irritability 😡 | Acne 😣           |
| Breast Tenderness 💔 | Depression 😢   | Energy Changes ⚡ |
| Fatigue 😴           | Stress 😵       | And more...       |

### 🔒 Privacy & Security

- **No Personal Data**: No email, phone, or real names required
- **Local Storage**: All data stored locally on device by default
- **Anonymous IDs**: Cloud sync uses anonymous identifiers only
- **Data Ownership**: Easy export and deletion of all data
- **Transparent**: Open source with clear privacy practices
- **Real-time Username Check**: Secure username availability without data leaks
- **Robust Deletion**: Complete data removal including all cloud traces

### ☁️ Cloud Sync Features (Optional)

- **🔄 Real-time Synchronization**: Instant data sync across devices
- **👤 Username-based Accounts**: Simple username/password system
- **📊 Live Statistics**: Community insights while maintaining anonymity
- **🔒 Row Level Security**: Database-level privacy protection
- **📱 Multi-device Support**: Access your data from any device
- **🚫 Easy Account Deletion**: Complete data removal with one click

## 🌍 Cultural Considerations

CrampPanchayat is designed with global users in mind:

- **Inclusive Emoji Selection**: Diverse representation in profile options
- **Cultural Sensitivity**: Respectful language and imagery
- **Accessibility**: Screen reader support and high contrast options
- **Multi-Language Ready**: Architecture supports localization
- **Educational Content**: Culturally appropriate health information

## 🗺️ Roadmap & Recent Updates

### ✅ **Latest Release (v1.0.5) - January 2025**

- ✅ **Enhanced Cloud Sync**: Real-time username availability checking
- ✅ **Improved Statistics**: Live cloud user statistics with proper sign-in state handling
- ✅ **Robust User Management**: Complete user deletion with proper cleanup
- ✅ **Unified Period Tracking**: Consolidated period tracking logic for better performance
- ✅ **Enhanced Database**: Complete Supabase setup with advanced RLS policies
- ✅ **Bug Fixes**: Fixed duplicate notes, improved error handling, better state management

### 🔮 Long Term Vision (v2.0+) - 2026

- 👥 **Privacy-First Community**: Anonymous health insights and peer support features
- 💊 **Comprehensive Fertility Tracking**: Optional fertility awareness method support
- 🧠 **Holistic Wellness**: Integration with sleep, stress, and nutrition tracking
- 🔐 **End-to-End Encryption**: Advanced security for all user data
- 📱 **Progressive Web App**: Browser-based access with full offline capabilities
- 🌙 **Wellness Ecosystem**: Complete menstrual and reproductive health platform

### 🛠️ Technical Achievements

- ✅ **Zero TypeScript Errors**: Strict typing throughout the codebase
- ✅ **Robust Error Handling**: Comprehensive fallbacks and user feedback
- ✅ **Database Security**: Advanced RLS policies and safe user management
- ✅ **Real-time Features**: Live username checking and cloud statistics
- ✅ **Performance Optimized**: Unified tracking logic and efficient state management
- ✅ **Production Ready**: Comprehensive testing and error boundary implementation

### 🧪 **Quality Assurance**

- **Database Integrity**: All SQL functions tested with proper error handling
- **Type Safety**: 100% TypeScript coverage with strict configuration
- **User Experience**: Real-time feedback and intuitive error messages
- **Privacy Compliance**: No personal data logging or unauthorized access
- **Cross-platform**: Tested on iOS, Android, and web platforms

_Want to contribute to these goals? Check out our [Contributing Guide](CONTRIBUTING.md)!_

## 🚀 Production Ready Features

### ✅ **Recent Critical Fixes (January 2025)**

**Username Availability System**:

- ✅ Real-time database checking via `check_username_exists()` SQL function
- ✅ Accurate feedback during account creation (no more false "available" messages)
- ✅ Debounced checking (500ms) for optimal user experience
- ✅ Proper error handling and fallback behavior

**Cloud Statistics Display**:

- ✅ Shows "Sign in to see total cloud users" when not authenticated
- ✅ Live user count when signed in
- ✅ Proper loading states and error handling
- ✅ Responsive sign-in state management

**Database & User Management**:

- ✅ Complete Supabase setup in single `SUPABASE_COMPLETE_SETUP.sql` file
- ✅ Robust user deletion with UUID/TEXT type handling
- ✅ Advanced RLS policies for secure data access
- ✅ Automatic auth cleanup triggers

**Code Quality & Performance**:

- ✅ Unified period tracking logic (removed duplicates)
- ✅ Zero TypeScript compilation errors
- ✅ Enhanced error boundaries and user feedback
- ✅ Optimized state management and data flow

### 🔧 **Developer Experience**

- **Single SQL Setup**: One comprehensive database setup file
- **Type Safety**: Strict TypeScript with comprehensive interfaces
- **Error Handling**: Graceful degradation and user-friendly messages
- **Documentation**: Comprehensive setup guides and code comments
- **Testing**: Production-tested with real user scenarios

## 🤝 Contributing

We welcome contributions from developers, designers, and health advocates!

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style Guidelines

- **TypeScript**: Strict typing with comprehensive interfaces
- **React Components**: Functional components with proper TypeScript props
- **Testing**: Write tests for critical functionality
- **Performance**: Use React.memo, useMemo, and useCallback appropriately
- **Privacy**: Never log or store personal information

## 📊 Data Management

### Local Storage

- **AsyncStorage**: Primary storage for offline-first experience
- **Data Format**: JSON with version control for migrations
- **Backup**: Export data as JSON for personal backup
- **Performance**: Optimized unified period tracking logic

### Cloud Sync (Optional)

- **Supabase**: PostgreSQL with Row Level Security (RLS)
- **Anonymous**: Uses device-generated anonymous IDs
- **Selective**: Users choose what data to sync
- **Real-time**: Live username availability and statistics
- **Secure**: Complete user deletion with proper cleanup

### 🔧 Database Features

- **Advanced RLS**: Row Level Security for data protection
- **Smart Functions**: Real-time username checking and user management
- **Data Validation**: Automatic period data structure validation
- **Cleanup Triggers**: Automatic auth data cleanup on user deletion
- **Performance Indexes**: Optimized queries for large datasets

## 💝 Support the Project

CrampPanchayat is free and open source. Support development through:

- **UPI Donations**: Scan QR code in app
- **GitHub Sponsors**: [Sponsor on GitHub](https://github.com/sponsors/askitendo)
- **Contributions**: Code, design, translations, or documentation
- **Spread the Word**: Share with friends and family

<div align="center">
  <img src="src/assets/images/upi-qr.png" alt="UPI Donation QR Code" width="200" height="200"/>
  <p><em>UPI Donation QR Code</em></p>
</div>

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <img src="src/assets/images/AskitEndo.png" alt="Askit Endo Logo" width="150"/>
  
  **Made with 🩷 for menstrual health awareness**
  
  *For people you love from people they love.*
  
  ---

</div>
