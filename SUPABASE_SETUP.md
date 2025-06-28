# Supabase Setup Guide for CrampPanchayat

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: CrampPanchayat
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
   - **Pricing Plan**: Start with Free tier

## Step 2: Get Your Credentials

After project creation:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Public anon key**: `eyJ...` (this is your publishable key)

## Step 3: Update Environment Variables

Replace the placeholder in your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://uadpzbkiqgmrpknmevcq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

## Step 4: Create Database Tables

Go to **SQL Editor** in Supabase dashboard and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for anonymous users
CREATE TABLE IF NOT EXISTS profiles (
  anonymous_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  UNIQUE(emoji)
);

-- Cycles table
CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_profile_id UUID REFERENCES profiles(anonymous_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  flow_intensity INTEGER CHECK (flow_intensity >= 1 AND flow_intensity <= 5),
  cycle_length INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symptoms table
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_profile_id UUID REFERENCES profiles(anonymous_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symptom_type TEXT NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily notes table
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_profile_id UUID REFERENCES profiles(anonymous_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anonymous_profile_id, date)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow anonymous access - no auth required)
CREATE POLICY "Allow anonymous access to profiles" ON profiles
  FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to cycles" ON cycles
  FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to symptoms" ON symptoms
  FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to daily_notes" ON daily_notes
  FOR ALL USING (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cycles_profile_id ON cycles(anonymous_profile_id);
CREATE INDEX IF NOT EXISTS idx_cycles_start_date ON cycles(start_date);
CREATE INDEX IF NOT EXISTS idx_symptoms_profile_id ON symptoms(anonymous_profile_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_date ON symptoms(date);
CREATE INDEX IF NOT EXISTS idx_daily_notes_profile_date ON daily_notes(anonymous_profile_id, date);
```

## Step 5: Test Connection

Your app should now be able to connect to Supabase. Check the logs when running:

```bash
npx expo start --clear
```

Look for:

- ✅ "Supabase client initialized successfully"
- ❌ "Supabase credentials not configured" (means you need to update .env)

## Step 6: Security Notes

1. **No Authentication Required**: This app uses anonymous profiles only
2. **Data Privacy**: No personal information is stored
3. **RLS Enabled**: Row Level Security prevents data access issues
4. **Client-Side Only**: App works offline-first, cloud sync is optional

## Step 7: Optional - Real-time Subscriptions

If you want real-time updates, you can enable them:

```sql
-- Enable real-time on tables (optional)
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE cycles;
ALTER publication supabase_realtime ADD TABLE symptoms;
```

## Troubleshooting

### Common Issues:

1. **"Supabase credentials not configured"**

   - Check your .env file has correct values
   - Restart Expo with `npx expo start --clear`

2. **Database connection errors**

   - Verify your project URL and anon key
   - Check if your Supabase project is active

3. **RLS errors**
   - Ensure RLS policies are created
   - Our app uses anonymous access, no auth needed

### Testing Database

You can test your database directly in Supabase:

1. Go to **Table Editor**
2. Try inserting test data
3. Check if your app can read it

## Next Steps

Once Supabase is set up:

1. Test profile creation in your app
2. Try the sync functionality
3. Check data appears in Supabase dashboard
4. Test offline mode (disable internet, use app, re-enable)

Your app will work completely offline, with optional cloud sync when connected!
