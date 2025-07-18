-- Create blogs table
CREATE TABLE public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published BOOLEAN NOT NULL DEFAULT true
);

-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_likes table
CREATE TABLE public.blog_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blog_id, user_id)
);

-- Create comment_likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for blogs
CREATE POLICY "Anyone can view published blogs" 
ON public.blogs 
FOR SELECT 
USING (published = true);

CREATE POLICY "Users can create their own blogs" 
ON public.blogs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blogs" 
ON public.blogs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blogs" 
ON public.blogs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for blog_comments
CREATE POLICY "Anyone can view comments on published blogs" 
ON public.blog_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.blogs 
  WHERE blogs.id = blog_comments.blog_id 
  AND blogs.published = true
));

CREATE POLICY "Authenticated users can create comments" 
ON public.blog_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.blog_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.blog_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for blog_likes
CREATE POLICY "Anyone can view likes on published blogs" 
ON public.blog_likes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.blogs 
  WHERE blogs.id = blog_likes.blog_id 
  AND blogs.published = true
));

CREATE POLICY "Authenticated users can like blogs" 
ON public.blog_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.blog_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for comment_likes
CREATE POLICY "Anyone can view comment likes" 
ON public.comment_likes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.blog_comments 
  JOIN public.blogs ON blogs.id = blog_comments.blog_id
  WHERE blog_comments.id = comment_likes.comment_id 
  AND blogs.published = true
));

CREATE POLICY "Authenticated users can like comments" 
ON public.comment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own comment likes" 
ON public.comment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for blog images
CREATE POLICY "Anyone can view blog images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own blog images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own blog images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for updated_at
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
BEFORE UPDATE ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_blogs_user_id ON public.blogs(user_id);
CREATE INDEX idx_blogs_created_at ON public.blogs(created_at DESC);
CREATE INDEX idx_blog_comments_blog_id ON public.blog_comments(blog_id);
CREATE INDEX idx_blog_comments_user_id ON public.blog_comments(user_id);
CREATE INDEX idx_blog_likes_blog_id ON public.blog_likes(blog_id);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);