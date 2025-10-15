-- Drop the old check constraint
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_check;

-- Add new check constraint that allows 'user', 'astrobot' (legacy), and 'elysia'
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_check 
  CHECK (sender = ANY (ARRAY['user'::text, 'astrobot'::text, 'elysia'::text]));