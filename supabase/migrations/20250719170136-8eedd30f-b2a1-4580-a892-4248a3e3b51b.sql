-- Fix the palm-images bucket configuration
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,  -- 10MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'palm-images';