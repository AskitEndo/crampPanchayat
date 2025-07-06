-- CrampPanchayat Complete Database Setup for Supabase
-- This file contains the complete database schema and all functions
-- Run this to set up a fresh database or reset existing one
-- 


-- ARCHITECTURE NOTES:
-- - Local profiles (emoji + name) are separate from cloud accounts (username + password)
-- - Each cloud account stores all period data as JSONB in user_data table
-- - Import always overwrites local profile data with cloud data
-- - Export uploads current profile data to cloud (overwrites cloud data)
-- - Multiple local profiles can sync with the same cloud account on different devices
-- - Local profile names/emojis are irrelevant to cloud sync

-- =================================================================
-- IMPORTANT: This will CLEAR ALL EXISTING DATA and recreate the schema
-- Only run this when you want to start fresh!

-- =================================================================
-- PART 1: CLEAN UP EXISTING SCHEMA
-- =================================================================

-- Clean up existing functions first
DROP FUNCTION IF EXISTS delete_user_complete(uuid);
DROP FUNCTION IF EXISTS delete_user(uuid);
DROP FUNCTION IF EXISTS cleanup_auth_on_user_data_delete();
DROP FUNCTION IF EXISTS validate_period_data();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Clean up existing triggers
DROP TRIGGER IF EXISTS cleanup_auth_trigger ON user_data;
DROP TRIGGER IF EXISTS validate_user_period_data ON user_data;
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_cycles_updated_at ON cycles;

-- Clean up existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert their own data" ON user_data;
DROP POLICY IF EXISTS "Users can update their own data" ON user_data;
DROP POLICY IF EXISTS "Users can delete their own data" ON user_data;
DROP POLICY IF EXISTS "Users can upsert their own data" ON user_data;
DROP POLICY IF EXISTS "Allow anonymous analytics inserts" ON analytics_events;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can insert cycles for their profiles" ON cycles;
DROP POLICY IF EXISTS "Users can update their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can delete their own cycles" ON cycles;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON user_data;

-- Clean up existing tables (in dependency order)
DROP TABLE IF EXISTS cycles;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS user_data;

-- =================================================================
-- PART 2: CREATE SCHEMA
-- =================================================================

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
    "settings": {
      "averageCycleLength": 28,
      "averagePeriodLength": 5,
      "remindersEnabled": true,
      "reminderTime": "08:00",
      "darkMode": false,
      "language": "en",
      "firstDayOfWeek": 1,
      "onlineSync": false,
      "donationPrompts": true
    },
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

-- =================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- =================================================================

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- PART 4: CREATE RLS POLICIES (FIXED FOR PROPER AUTHENTICATION)
-- =================================================================

-- RLS Policies for user_data (users can only access their own data)
-- Fixed to handle both INSERT and UPSERT operations properly

CREATE POLICY "Users can view their own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data" ON user_data
  FOR DELETE USING (auth.uid() = user_id);

-- Additional policy to handle UPSERT operations (INSERT + UPDATE combined)
-- This is critical for data sync operations
CREATE POLICY "Users can upsert their own data" ON user_data
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for analytics (allow anonymous inserts only, no reads/updates/deletes)
CREATE POLICY "Allow anonymous analytics inserts" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- =================================================================
-- PART 5: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_updated_at ON user_data(updated_at);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);

-- =================================================================
-- PART 6: CREATE UTILITY FUNCTIONS
-- =================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate period_data structure (ensures data integrity)
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
            "settings": {
              "averageCycleLength": 28,
              "averagePeriodLength": 5,
              "remindersEnabled": true,
              "reminderTime": "08:00",
              "darkMode": false,
              "language": "en",
              "firstDayOfWeek": 1,
              "onlineSync": false,
              "donationPrompts": true
            },
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
    
    -- Update lastUpdated timestamp
    NEW.period_data = NEW.period_data || jsonb_build_object('lastUpdated', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- PART 7: USER DELETION FUNCTIONS (CRITICAL FOR USER MANAGEMENT)
-- =================================================================

-- Basic user deletion function with proper type handling
CREATE OR REPLACE FUNCTION delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
BEGIN
  -- First delete all user data from user_data table
  DELETE FROM user_data WHERE user_id = target_user_id;
  
  -- Delete from auth tables with proper type casting
  -- Some auth tables use TEXT for user_id, others use UUID
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = target_user_id;
  DELETE FROM auth.sessions WHERE user_id::uuid = target_user_id;
  DELETE FROM auth.identities WHERE user_id::uuid = target_user_id;
  
  -- Delete the user from auth.users table (id is UUID)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Log the deletion
  RAISE NOTICE 'User % and all associated data deleted successfully', target_user_id;
END;
$$;

-- Comprehensive user deletion function with better error handling and type safety
CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  user_exists boolean;
  data_deleted_count integer;
  auth_deleted_count integer;
BEGIN
  -- Check if user exists first
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    result := json_build_object(
      'success', false,
      'message', 'User does not exist in auth.users table',
      'user_id', target_user_id
    );
    RETURN result;
  END IF;
  
  -- Delete user data first and count deletions
  DELETE FROM user_data WHERE user_id = target_user_id;
  GET DIAGNOSTICS data_deleted_count = ROW_COUNT;
  
  -- Delete from auth tables with proper type casting (order matters - dependencies first)
  -- Handle both TEXT and UUID types in auth tables
  BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try without casting if it fails
      DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.sessions WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try without casting if it fails
      DELETE FROM auth.sessions WHERE user_id = target_user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.identities WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try without casting if it fails  
      DELETE FROM auth.identities WHERE user_id = target_user_id::text;
  END;
  
  -- Delete from auth.users (id is always UUID)
  DELETE FROM auth.users WHERE id = target_user_id;
  GET DIAGNOSTICS auth_deleted_count = ROW_COUNT;
  
  -- Return success result with details
  result := json_build_object(
    'success', true,
    'message', 'User and all associated data deleted successfully',
    'user_id', target_user_id,
    'data_records_deleted', data_deleted_count,
    'auth_user_deleted', auth_deleted_count > 0,
    'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return detailed error result
    result := json_build_object(
      'success', false,
      'message', SQLERRM,
      'user_id', target_user_id,
      'error_code', SQLSTATE,
      'error_detail', SQLSTATE || ': ' || SQLERRM,
      'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    RETURN result;
END;
$$;

-- Function to clean up auth data when user_data is deleted (automatic cleanup)
CREATE OR REPLACE FUNCTION cleanup_auth_on_user_data_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When user_data is deleted, also clean up auth data with proper type handling
  BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id::uuid = OLD.user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try without casting if it fails
      DELETE FROM auth.refresh_tokens WHERE user_id = OLD.user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.sessions WHERE user_id::uuid = OLD.user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try without casting if it fails
      DELETE FROM auth.sessions WHERE user_id = OLD.user_id::text;
  END;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up auth data for user %', OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- =================================================================
-- PART 8: CREATE TRIGGERS
-- =================================================================

-- Trigger to automatically update updated_at on user_data changes
CREATE TRIGGER update_user_data_updated_at 
    BEFORE UPDATE ON user_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to validate period_data structure
CREATE TRIGGER validate_user_period_data
    BEFORE INSERT OR UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION validate_period_data();

-- Trigger for automatic auth cleanup when user_data is deleted
CREATE TRIGGER cleanup_auth_trigger
  AFTER DELETE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_auth_on_user_data_delete();

-- =================================================================
-- PART 9: GRANT PERMISSIONS
-- =================================================================

-- Grant execute permission to authenticated users for deletion functions
GRANT EXECUTE ON FUNCTION delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete(uuid) TO authenticated;

-- =================================================================
-- PART 10: VERIFICATION QUERIES (UNCOMMENT TO TEST)
-- =================================================================

-- Verify schema is created correctly
-- SELECT 
--   table_name,
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('user_data', 'analytics_events')
-- ORDER BY table_name, ordinal_position;

-- Verify functions are created
-- SELECT proname, prosrc FROM pg_proc WHERE proname IN ('delete_user', 'delete_user_complete', 'validate_period_data');

-- Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('user_data', 'analytics_events');

-- Test data query (should return 0 for fresh setup)
-- SELECT COUNT(*) FROM user_data;

-- =================================================================
-- SETUP COMPLETE!
-- =================================================================

-- Your database is now ready for CrampPanchayat!
-- 
-- Next steps:
-- 1. Verify your Supabase URL and anon key in your app
-- 2. Test user registration and deletion
-- 3. Test period data sync
-- 
-- If you need to reset the database again, just run this script again.
