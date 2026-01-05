-- Make palm-images bucket private to protect biometric data
UPDATE storage.buckets SET public = false WHERE id = 'palm-images';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public Access for AI Analysis" ON storage.objects;