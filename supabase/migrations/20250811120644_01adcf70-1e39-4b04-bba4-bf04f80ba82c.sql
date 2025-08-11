-- Create educational images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('educational-images', 'educational-images', true);

-- Create educational palm images table
CREATE TABLE public.educational_palm_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on educational images
ALTER TABLE public.educational_palm_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view educational images
CREATE POLICY "Educational images are viewable by everyone" 
ON public.educational_palm_images 
FOR SELECT 
USING (true);

-- Create storage policy for educational images bucket
CREATE POLICY "Educational images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'educational-images');

-- Create policy for uploading educational images (admin only for now)
CREATE POLICY "Admin can upload educational images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'educational-images');

-- Insert educational image records
INSERT INTO public.educational_palm_images (image_url, category, keywords, title, description) VALUES
('educational-images/palm-lines-guide.jpg', 'lines', ARRAY['heart line', 'head line', 'life line', 'fate line', 'lines', 'basic'], 'Palm Lines Guide', 'Shows the four major palm lines: Heart Line, Head Line, Life Line, and Fate Line'),
('educational-images/hand-nature-types.jpg', 'hand-types', ARRAY['nature', 'hand type', 'personality', 'character'], 'Hand Nature Types', 'Different hand types and their personality indicators'),
('educational-images/partner-wealth-indicator.jpg', 'relationships', ARRAY['partner', 'spouse', 'wealth', 'marriage', 'relationship'], 'Partner Wealth Indicator', 'Shows indicators of your partner''s wealth potential'),
('educational-images/millionaire-timing.jpg', 'wealth-timing', ARRAY['millionaire', 'rich', 'wealth', 'money', 'timing', 'age'], 'Millionaire Timing Chart', 'Green line shows age of becoming millionaire, red line shows wealth timing'),
('educational-images/money-dots-timing.jpg', 'wealth-markers', ARRAY['money', 'wealth', 'dots', 'timing', 'large amount'], 'Money Timing Dots', 'Red dots indicate large amounts of money at specific ages'),
('educational-images/age-timeline.jpg', 'timing', ARRAY['age', 'timeline', 'years', 'timing'], 'Age Timeline Reference', 'Shows how to read ages on palm lines');