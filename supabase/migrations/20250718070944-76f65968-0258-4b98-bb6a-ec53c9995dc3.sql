-- Create palm_scans table to store user scan history
CREATE TABLE public.palm_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  life_line_strength TEXT,
  heart_line_strength TEXT,
  head_line_strength TEXT,
  fate_line_strength TEXT,
  overall_insight TEXT,
  traits JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.palm_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scans" 
  ON public.palm_scans 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans" 
  ON public.palm_scans 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" 
  ON public.palm_scans 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_palm_scans_updated_at
  BEFORE UPDATE ON public.palm_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();