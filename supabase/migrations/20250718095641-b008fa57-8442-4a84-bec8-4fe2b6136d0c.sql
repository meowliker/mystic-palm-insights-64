-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- Create storage policies for profile pictures
CREATE POLICY "Users can view profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add profile picture URL to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_picture_url TEXT,
ADD COLUMN birthdate DATE,
ADD COLUMN gender TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;