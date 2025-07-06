-- URGENT FIX: User Deletion UUID Type Error
-- Run this immediately to fix the "character varying = uuid" error
-- This updates only the deletion functions without touching your data

-- =================================================================
-- DROP AND RECREATE FUNCTIONS WITH PROPER TYPE HANDLING
-- =================================================================

-- Clean up existing functions
DROP FUNCTION IF EXISTS delete_user_complete(uuid);
DROP FUNCTION IF EXISTS delete_user(uuid);
DROP FUNCTION IF EXISTS cleanup_auth_on_user_data_delete();
DROP TRIGGER IF EXISTS cleanup_auth_trigger ON user_data;

-- =================================================================
-- FIXED FUNCTIONS WITH PROPER UUID/TEXT HANDLING
-- =================================================================

-- Basic user deletion function with proper type handling
CREATE OR REPLACE FUNCTION delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
      -- Try as text if UUID casting fails
      DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.sessions WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try as text if UUID casting fails
      DELETE FROM auth.sessions WHERE user_id = target_user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.identities WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try as text if UUID casting fails
      DELETE FROM auth.identities WHERE user_id = target_user_id::text;
  END;
  
  -- Delete the user from auth.users table (id is always UUID)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Log the deletion
  RAISE NOTICE 'User % and all associated data deleted successfully', target_user_id;
END;
$$;

-- Comprehensive user deletion function with proper type handling
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
  
  -- Delete from auth tables with proper type casting (order matters)
  BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try as text if UUID casting fails
      DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.sessions WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try as text if UUID casting fails
      DELETE FROM auth.sessions WHERE user_id = target_user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.identities WHERE user_id::uuid = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try as text if UUID casting fails
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

-- Cleanup trigger function with proper type handling
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
      -- Try as text if UUID casting fails
      DELETE FROM auth.refresh_tokens WHERE user_id = OLD.user_id::text;
  END;
  
  BEGIN
    DELETE FROM auth.sessions WHERE user_id::uuid = OLD.user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Try as text if UUID casting fails
      DELETE FROM auth.sessions WHERE user_id = OLD.user_id::text;
  END;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up auth data for user %', OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- =================================================================
-- RECREATE TRIGGER AND GRANT PERMISSIONS
-- =================================================================

-- Recreate the cleanup trigger
CREATE TRIGGER cleanup_auth_trigger
  AFTER DELETE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_auth_on_user_data_delete();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete(uuid) TO authenticated;

-- =================================================================
-- VERIFICATION
-- =================================================================

-- Test that functions exist
-- SELECT proname FROM pg_proc WHERE proname IN ('delete_user', 'delete_user_complete');

-- Test with a fake UUID (should return "User does not exist")
-- SELECT delete_user_complete('00000000-0000-0000-0000-000000000000'::uuid);

-- =================================================================
-- URGENT FIX COMPLETE!
-- =================================================================

-- The UUID type error should now be fixed!
-- Try deleting your account again in the app.
