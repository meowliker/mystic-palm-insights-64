-- Update the delete policy for blog_comments to allow blog authors to delete any comment on their blog
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.blog_comments;

-- Create a new policy that allows both comment authors and blog authors to delete comments
CREATE POLICY "Users can delete their own comments or blog authors can delete any comment on their blog"
ON public.blog_comments
FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.blogs WHERE id = blog_comments.blog_id
  )
);