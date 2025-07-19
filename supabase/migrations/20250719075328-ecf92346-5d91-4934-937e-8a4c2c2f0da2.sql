-- Add DELETE policy for palm_scans table
CREATE POLICY "Users can delete their own scans" 
ON public.palm_scans 
FOR DELETE 
USING (auth.uid() = user_id);