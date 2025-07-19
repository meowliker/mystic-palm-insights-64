-- Update storage bucket to allow CORS and larger files
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,  -- 10MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'palm-images';

-- Drop existing conflicting policies and create new ones
DROP POLICY IF EXISTS "Public Access for AI Analysis" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_3" ON storage.objects;

-- Create comprehensive storage policies for palm images
CREATE POLICY "Anyone can view palm images" ON storage.objects 
FOR SELECT USING (bucket_id = 'palm-images');

CREATE POLICY "Authenticated users can upload palm images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'palm-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their palm images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'palm-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their palm images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'palm-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);