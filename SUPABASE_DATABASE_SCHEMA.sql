-- CrampPanchayat Database Schema for Supabase
-- Cloud data storage with import/export model
-- 
-- ARCHITECTURE NOTES:
-- - Local profiles (emoji + name) are separate from cloud accounts (username + password)
-- - Each cloud account stores all period data as JSONB in user_data table
-- - Import always overwrites local profile data with cloud data
-- - Export uploads current profile data to cloud (overwrites cloud data)
-- - Multiple local profiles can sync with the same cloud account on different devices
-- - Local profile names/emojis are irrelevant to cloud sync

-- EXECUTION INSTRUCTIONS:
-- 1. Copy this entire file content
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run" to execute
-- 4. This will create a clean, production-ready database schema

-- Clean up any existing tables/policies/triggers from previous schema
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can insert cycles for their profiles" ON cycles;
DROP POLICY IF EXISTS "Users can update their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can delete their own cycles" ON cycles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_cycles_updated_at ON cycles;
DROP TABLE IF EXISTS cycles;
DROP TABLE IF EXISTS profiles;

-- Clean up any existing policies for new tables
DROP POLICY IF EXISTS "Users can view their own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert their own data" ON user_data;
DROP POLICY IF EXISTS "Users can update their own data" ON user_data;
DROP POLICY IF EXISTS "Users can delete their own data" ON user_data;
DROP POLICY IF EXISTS "Allow anonymous analytics inserts" ON analytics_events;

-- Clean up any existing triggers for new tables
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS user_data;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User data table (one record per cloud account)
-- This stores ALL period tracking data as JSONB for maximum flexibility
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_data JSONB NOT NULL DEFAULT '{
    "cycles": [],
    "symptoms": [],
    "notes": [],
    "predictions": [],
    "settings": {},
    "lastUpdated": ""
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_data UNIQUE(user_id) -- One data record per user
);

-- Analytics events table (optional - for anonymous usage analytics)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Anonymous user ID (not linked to auth.users)
  event_name TEXT NOT NULL CHECK (char_length(event_name) > 0),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform TEXT NOT NULL DEFAULT 'mobile' CHECK (platform IN ('mobile', 'web', 'desktop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_data (users can only access their own data)
CREATE POLICY "Users can view their own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data" ON user_data
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for analytics (allow anonymous inserts only, no reads/updates/deletes)
CREATE POLICY "Allow anonymous analytics inserts" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Indexes for optimal performance
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_updated_at ON user_data(updated_at);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on user_data changes
CREATE TRIGGER update_user_data_updated_at 
    BEFORE UPDATE ON user_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to validate period_data structure (optional data validation)
CREATE OR REPLACE FUNCTION validate_period_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure period_data has required structure
    IF NEW.period_data IS NULL THEN
        NEW.period_data = '{
            "cycles": [],
            "symptoms": [],
            "notes": [],
            "predictions": [],
            "settings": {},
            "lastUpdated": ""
        }'::jsonb;
    END IF;
    
    -- Ensure required fields exist
    IF NOT (NEW.period_data ? 'cycles') THEN
        NEW.period_data = NEW.period_data || '{"cycles": []}'::jsonb;
    END IF;
    
    IF NOT (NEW.period_data ? 'symptoms') THEN
        NEW.period_data = NEW.period_data || '{"symptoms": []}'::jsonb;
    END IF;
    
    IF NOT (NEW.period_data ? 'notes') THEN
        NEW.period_data = NEW.period_data || '{"notes": []}'::jsonb;
    END IF;
    
    IF NOT (NEW.period_data ? 'predictions') THEN
        NEW.period_data = NEW.period_data || '{"predictions": []}'::jsonb;
    END IF;
    
    IF NOT (NEW.period_data ? 'settings') THEN
        NEW.period_data = NEW.period_data || '{"settings": {}}'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate period_data structure
CREATE TRIGGER validate_user_period_data
    BEFORE INSERT OR UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION validate_period_data();

-- Optional: Enable real-time subscriptions (uncomment if needed for live sync)
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_data;

-- Grant necessary permissions (should be handled automatically by Supabase)
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_data TO authenticated;
-- GRANT INSERT ON analytics_events TO anon, authenticated;

-- Schema validation query (run this after setup to verify)
-- SELECT 
--   table_name,
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('user_data', 'analytics_events')
-- ORDER BY table_name, ordinal_position;

-- Test data query (run this to verify RLS is working)
-- SELECT COUNT(*) FROM user_data; -- Should return 0 for new setup
