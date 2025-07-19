-- Make palm-images bucket public and add proper policies for OpenAI access
UPDATE storage.buckets SET public = true WHERE id = 'palm-images';

-- Create policy to allow public access to palm images (needed for OpenAI to download them)
CREATE POLICY "Public Access for AI Analysis" ON storage.objects FOR SELECT USING (bucket_id = 'palm-images');

-- Allow authenticated users to upload their own palm images
CREATE POLICY "Users can upload their palm images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'palm-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to manage their own uploaded images
CREATE POLICY "Users can manage their palm images" ON storage.objects FOR UPDATE 
USING (bucket_id = 'palm-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their palm images" ON storage.objects FOR DELETE 
USING (bucket_id = 'palm-images' AND auth.uid()::text = (storage.foldername(name))[1]);