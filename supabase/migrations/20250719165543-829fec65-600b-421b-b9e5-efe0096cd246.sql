-- Add column for right palm image URL to support dual palm analysis
ALTER TABLE palm_scans ADD COLUMN IF NOT EXISTS right_palm_image_url TEXT;