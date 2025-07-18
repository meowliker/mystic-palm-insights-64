-- Fix the delete_user_account function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION delete_user_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from palm_scans table first
  DELETE FROM public.palm_scans WHERE palm_scans.user_id = target_user_id;
  
  -- Delete from profiles table
  DELETE FROM public.profiles WHERE profiles.id = target_user_id;
  
  -- Delete from auth.users (this is the main user record)
  DELETE FROM auth.users WHERE auth.users.id = target_user_id;
END;
$$;