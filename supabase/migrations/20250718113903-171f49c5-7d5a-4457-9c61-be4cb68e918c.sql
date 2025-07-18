-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from profiles table (will cascade due to foreign key)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Delete from palm_scans table
  DELETE FROM public.palm_scans WHERE user_id = user_id;
  
  -- Delete from auth.users (this is the main user record)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;