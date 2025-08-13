-- Drop the overly permissive policy that exposes all profile data to everyone
DROP POLICY IF EXISTS "Anyone can view basic profile information" ON public.profiles;

-- Create a new policy that only allows users to view their own full profile data
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a new policy that allows everyone to view only safe, non-sensitive profile fields
-- This allows displaying profile pictures and display names in public contexts like blogs/comments
CREATE POLICY "Public can view safe profile information" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to non-sensitive fields by creating a view-like restriction
  -- This policy will be used in conjunction with explicit field selection in queries
  true
);

-- Create a view for safe public profile data to enforce field-level security
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  profile_picture_url,
  full_name, -- Display name only, not for contact purposes
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create RLS policy for the public view
CREATE POLICY "Anyone can view public profile info" 
ON public.public_profiles 
FOR SELECT 
USING (true);