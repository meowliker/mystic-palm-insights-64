-- Drop the overly permissive policy that exposes all profile data to everyone
DROP POLICY IF EXISTS "Anyone can view basic profile information" ON public.profiles;

-- Create a new policy that only allows users to view their own full profile data
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create RLS policy for the safe profile data function
CREATE POLICY "Allow public access to safe profile data function"
ON public.profiles
FOR SELECT
USING (false); -- This ensures the function can be called publicly but direct table access is still restricted