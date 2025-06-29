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

CrampPanchayat is a Offline first period tracking app that prioritizes user privacy and accountability. Built with React Native and TypeScript, it offers an emoji-based anonymous profile system, ensuring users can track their menstrual health without compromising personal data.

### ✨ Key Features

- **🎭 Emoji-Based Anonymous Profiles**: Choose from 16 culturally diverse emojis (🩷, 🦋, 🌙, 🌟, etc.)
- **📱 Offline-First Architecture**: Works completely offline with optional cloud sync
- **🔒 Privacy-First Design**: No email, phone numbers, or personal information required or offline use
- **📅 Smart Calendar Tracking**: Manual date selection with intelligent cycle predictions
- **🩺 Comprehensive Symptom Tracking**: 13+ categories with intensity ratings and notes
- **👨‍👩‍👧‍👦 Multi-User Support**: Family sharing on a single device

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
│   ├── supabase.ts     # Cloud sync service
│   └── analytics.ts    # Anonymous usage tracking
├── hooks/              # Custom React hooks
│   ├── useProfiles.ts  # Profile management logic
│   ├── usePeriodData.ts# Cycle data operations
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

### Supabase Setup (Optional)

For cloud sync functionality, follow the setup guide in [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).

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
- **Local Storage**: All data stored locally on device
- **Anonymous IDs**: Cloud sync uses anonymous identifiers
- **Data Ownership**: Easy export and deletion of all data
- **Transparent**: Open source with clear privacy practices

## 🌍 Cultural Considerations

CrampPanchayat is designed with global users in mind:

- **Inclusive Emoji Selection**: Diverse representation in profile options
- **Cultural Sensitivity**: Respectful language and imagery
- **Accessibility**: Screen reader support and high contrast options
- **Multi-Language Ready**: Architecture supports localization
- **Educational Content**: Culturally appropriate health information

## 🗺️ Roadmap & Future Goals

### 🎯 Next Release (v1.1) - Q3 2025

- ✅ **Enhanced Cloud Sync**: Improved Supabase integration with real-time synchronization
- ✅ **Smart Notifications**: Period predictions, medication reminders, and symptom tracking prompts
- ✅ **Advanced Analytics**: Comprehensive cycle pattern analysis and personalized health insights
- ⏳ **Medication Tracking**: Birth control pills, supplements, and pain medication reminders
- ⏳ **Enhanced Symptom Categories**: Detailed mood tracking, energy levels, and sleep quality

### 🚀 Medium Term (v1.2-1.3) - Q4 2025

- 🔄 **Machine Learning Predictions**: AI-powered cycle forecasting based on individual patterns
- 📱 **Widget Support**: Home screen widgets for quick cycle overview and reminders
- 🏥 **Healthcare Integration**: Apple Health, Google Fit, and healthcare provider compatibility
- 📊 **PDF Reports**: Comprehensive cycle reports for healthcare consultations
- 🌍 **Multi-language Support**: Localization for global accessibility
- 🎨 **Advanced Customization**: Custom themes, emoji sets, and personalized layouts

### 🔮 Long Term Vision (v2.0+) - 2026

- 👥 **Privacy-First Community**: Anonymous health insights and peer support features
- 💊 **Comprehensive Fertility Tracking**: Optional fertility awareness method support
- 🧠 **Holistic Wellness**: Integration with sleep, stress, and nutrition tracking
- 🔐 **End-to-End Encryption**: Advanced security for all user data
- 📱 **Progressive Web App**: Browser-based access with full offline capabilities
- 🌙 **Wellness Ecosystem**: Complete menstrual and reproductive health platform

### 🛠️ Technical Goals

- ⚡ **Performance**: 50% faster data processing and smoother animations
- ♿ **Accessibility**: WCAG 2.1 AA compliance and enhanced screen reader support
- 🧪 **Quality**: 90%+ test coverage with comprehensive automation
- 🔄 **Real-time Features**: Live data synchronization across multiple devices
- 🌐 **Global Scale**: Support for 10+ languages and cultural contexts

_Want to contribute to these goals? Check out our [Contributing Guide](CONTRIBUTING.md)!_

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

### Cloud Sync (Optional)

- **Supabase**: PostgreSQL with Row Level Security (RLS)
- **Anonymous**: Uses device-generated anonymous IDs
- **Selective**: Users choose what data to sync

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
</div>
