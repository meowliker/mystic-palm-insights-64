-- Add palm_image_url column to store captured palm images
ALTER TABLE public.palm_scans 
ADD COLUMN palm_image_url TEXT;

-- Create storage bucket for palm images
INSERT INTO storage.buckets (id, name, public) VALUES ('palm-images', 'palm-images', true);

-- Create storage policies for palm images
CREATE POLICY "Users can view their own palm images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'palm-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own palm images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'palm-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own palm images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'palm-images' AND auth.uid()::text = (storage.foldername(name))[1]);