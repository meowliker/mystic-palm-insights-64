-- Update profiles RLS policy to allow viewing basic profile information for blogs and comments
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows everyone to view basic profile information
CREATE POLICY "Anyone can view basic profile information"
ON public.profiles
FOR SELECT
USING (true);