-- Enable real-time for palm_scans table
ALTER TABLE public.palm_scans REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.palm_scans;