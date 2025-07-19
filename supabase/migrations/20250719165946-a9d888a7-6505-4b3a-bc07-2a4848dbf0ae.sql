-- Clean up all existing policies for storage objects
DROP POLICY IF EXISTS "Users can delete their palm images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their palm images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their palm images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their palm images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload palm images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view palm images" ON storage.objects;

-- Create simple public access policy for OpenAI
CREATE POLICY "Public read access for palm images" ON storage.objects 
FOR SELECT USING (bucket_id = 'palm-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload for palm images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'palm-images' 
  AND auth.role() = 'authenticated'
);