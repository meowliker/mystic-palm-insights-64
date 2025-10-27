-- Update all chat messages to use 'elysia' instead of 'astrobot'
UPDATE chat_messages 
SET sender = 'elysia' 
WHERE sender = 'astrobot';