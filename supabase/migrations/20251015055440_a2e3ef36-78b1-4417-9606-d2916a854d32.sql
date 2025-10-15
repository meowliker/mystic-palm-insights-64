-- Add reading_name column to palm_scans table
ALTER TABLE public.palm_scans 
ADD COLUMN reading_name TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN public.palm_scans.reading_name IS 'Custom name for the palm reading, set by the user';