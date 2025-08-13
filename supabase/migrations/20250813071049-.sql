-- Phase 1: User Privacy Protection - Create secure functions for blog data
CREATE OR REPLACE FUNCTION public.get_safe_blog_comment_data(comment_blog_id uuid)
RETURNS TABLE(
  id uuid,
  blog_id uuid,
  parent_comment_id uuid,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  author_name text,
  author_profile_picture text,
  like_count bigint,
  user_has_liked boolean,
  replies jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    bc.id,
    bc.blog_id,
    bc.parent_comment_id,
    bc.content,
    bc.created_at,
    bc.updated_at,
    p.full_name as author_name,
    p.profile_picture_url as author_profile_picture,
    COALESCE(cl.like_count, 0) as like_count,
    COALESCE(ul.user_has_liked, false) as user_has_liked,
    '[]'::jsonb as replies
  FROM blog_comments bc
  LEFT JOIN profiles p ON bc.user_id = p.id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as like_count
    FROM comment_likes
    GROUP BY comment_id
  ) cl ON bc.id = cl.comment_id
  LEFT JOIN (
    SELECT comment_id, true as user_has_liked
    FROM comment_likes
    WHERE user_id = auth.uid()
  ) ul ON bc.id = ul.comment_id
  WHERE bc.blog_id = comment_blog_id
  AND EXISTS (
    SELECT 1 FROM blogs b 
    WHERE b.id = comment_blog_id AND b.published = true
  );
$$;

-- Phase 2: Database Function Hardening - Update existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete from palm_scans table first
  DELETE FROM public.palm_scans WHERE palm_scans.user_id = target_user_id;
  
  -- Delete from profiles table  
  DELETE FROM public.profiles WHERE profiles.id = target_user_id;
  
  -- Delete from auth.users (this is the main user record)
  DELETE FROM auth.users WHERE auth.users.id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS TABLE(id uuid, profile_picture_url text, full_name text, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.profile_picture_url,
    p.full_name,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_user_id;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;