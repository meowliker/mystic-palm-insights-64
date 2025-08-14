-- Add follow_up_questions column to chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN follow_up_questions JSONB DEFAULT NULL;