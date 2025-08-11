-- Add new columns to palm_scans table for enhanced palmistry analysis
ALTER TABLE public.palm_scans 
ADD COLUMN age_predictions JSONB,
ADD COLUMN wealth_analysis JSONB,
ADD COLUMN mount_analysis JSONB,
ADD COLUMN line_intersections JSONB,
ADD COLUMN age_timeline JSONB,
ADD COLUMN partnership_predictions JSONB;