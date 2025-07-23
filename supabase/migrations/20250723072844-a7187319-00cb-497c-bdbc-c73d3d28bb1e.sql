-- Create storage bucket for chatbot palm images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('palm-images', 'palm-images', true);

-- Create policies for palm images bucket
CREATE POLICY "Anyone can view palm images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'palm-images');

CREATE POLICY "Authenticated users can upload palm images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'palm-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own palm images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'palm-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own palm images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'palm-images' AND auth.role() = 'authenticated');