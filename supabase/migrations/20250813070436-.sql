-- Create a security definer function to safely expose only non-sensitive profile data
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  profile_picture_url text,
  full_name text,
  created_at timestamptz
) 
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.profile_picture_url,
    p.full_name,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_user_id;
$$;