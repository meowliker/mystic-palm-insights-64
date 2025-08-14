-- Add seen_questions field to profiles table to track which questions each user has seen
ALTER TABLE public.profiles 
ADD COLUMN seen_questions INTEGER[] DEFAULT '{}';

-- Create index for better performance when filtering seen questions
CREATE INDEX idx_profiles_seen_questions ON public.profiles USING GIN(seen_questions);