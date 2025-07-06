-- SQL script to create user deletion functions for CrampPanchayat
-- Run this in your Supabase SQL Editor to enable proper user deletion
-- 
-- This script only adds/updates the user deletion functions
-- For complete database setup, use SUPABASE_COMPLETE_SETUP.sql instead

-- =================================================================
-- CLEAN UP EXISTING FUNCTIONS
-- =================================================================

DROP FUNCTION IF EXISTS delete_user_complete(uuid);
DROP FUNCTION IF EXISTS delete_user(uuid);
DROP FUNCTION IF EXISTS cleanup_auth_on_user_data_delete();
DROP TRIGGER IF EXISTS cleanup_auth_trigger ON user_data;

-- =================================================================
-- USER DELETION FUNCTIONS
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
  
  -- Delete the user from auth.users table (id is UUID)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Log the deletion
  RAISE NOTICE 'User % and all associated data deleted successfully', target_user_id;
END;
$$;

-- Comprehensive user deletion function with better error handling and validation
CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  user_exists boolean;
  data_deleted_count integer;
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
  
  -- Delete user data first and count how many records were deleted
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
  
  -- Return success result with details
  result := json_build_object(
    'success', true,
    'message', 'User and all associated data deleted successfully',
    'user_id', target_user_id,
    'data_records_deleted', data_deleted_count,
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
      'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    RETURN result;
END;
$$;

-- Function to clean up auth data when user_data is deleted (automatic cleanup trigger)
CREATE OR REPLACE FUNCTION cleanup_auth_on_user_data_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When user_data is deleted, also clean up related auth data
  DELETE FROM auth.refresh_tokens WHERE user_id = OLD.user_id;
  DELETE FROM auth.sessions WHERE user_id = OLD.user_id;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up auth data for user %', OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- =================================================================
-- CREATE TRIGGERS
-- =================================================================

-- Create the trigger for automatic cleanup
CREATE TRIGGER cleanup_auth_trigger
  AFTER DELETE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_auth_on_user_data_delete();

-- =================================================================
-- GRANT PERMISSIONS
-- =================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete(uuid) TO authenticated;

-- =================================================================
-- VERIFICATION AND TESTING
-- =================================================================

-- Test the functions exist (uncomment to verify)
-- SELECT proname, prosrc FROM pg_proc WHERE proname IN ('delete_user', 'delete_user_complete');

-- Test function with a fake UUID (this should return "User does not exist")
-- SELECT delete_user_complete('00000000-0000-0000-0000-000000000000'::uuid);

-- =================================================================
-- IMPORTANT NOTES FOR PRODUCTION
-- =================================================================

-- 1. These functions require SECURITY DEFINER to access auth schema
-- 2. The functions will only work if the user_data table exists
-- 3. RLS policies should allow users to delete their own data
-- 4. Always test in development before deploying to production
-- 5. The cleanup trigger automatically removes auth data when user_data is deleted
-- 6. Both functions use the parameter name 'target_user_id' (not 'user_id')
--    to match the TypeScript RPC calls in the app

-- Instructions for manual setup:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor  
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Verify the functions are created in Database > Functions
-- 6. Test user deletion in your app
