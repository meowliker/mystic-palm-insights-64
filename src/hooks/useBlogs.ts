import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Blog {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  published: boolean;
  author_name: string;
  author_email: string;
  author_profile_picture?: string;
  likes_count: number;
  comments_count: number;
  isLikedByUser: boolean;
}

export interface BlogComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  blog_id: string;
  parent_comment_id?: string;
  author_name: string;
  author_email: string;
  likes_count: number;
  isLikedByUser: boolean;
  replies?: BlogComment[];
}

export const useBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      // First get blogs
      const { data: blogsData, error: blogsError } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (blogsError) throw blogsError;

      if (!blogsData || blogsData.length === 0) {
        setBlogs([]);
        return;
      }

      // Get user profiles for the blogs
      const userIds = blogsData.map(blog => blog.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_picture_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue with blogs but without author names
      }

      // Get likes for the blogs
      const blogIds = blogsData.map(blog => blog.id);
      const { data: likesData, error: likesError } = await supabase
        .from('blog_likes')
        .select('blog_id, user_id')
        .in('blog_id', blogIds);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        // Continue without likes data
      }

      // Transform the data
      const transformedBlogs = blogsData.map(blog => {
        const profile = profilesData?.find(p => p.id === blog.user_id);
        const blogLikes = likesData?.filter(like => like.blog_id === blog.id) || [];
        
        return {
          ...blog,
          author_name: profile?.full_name || 'Unknown',
          author_email: profile?.email || '',
          author_profile_picture: profile?.profile_picture_url || '',
          likes_count: blogLikes.length,
          comments_count: 0, // Will be populated separately if needed
          isLikedByUser: user ? blogLikes.some(like => like.user_id === user.id) : false
        };
      });

      console.log('Transformed blogs:', transformedBlogs);
      setBlogs(transformedBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBlog = async (title: string, content: string, imageFile?: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a blog",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('blogs')
        .insert([
          {
            title,
            content,
            image_url: imageUrl,
            user_id: user.id,
            published: true
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog created successfully!"
      });

      fetchBlogs(); // Refresh blogs
      return true;
    } catch (error) {
      console.error('Error creating blog:', error);
      toast({
        title: "Error",
        description: "Failed to create blog",
        variant: "destructive"
      });
      return false;
    }
  };

  const likeBlog = async (blogId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to like a blog",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('blog_id', blogId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('blog_likes')
          .delete()
          .eq('blog_id', blogId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('blog_likes')
          .insert([{ blog_id: blogId, user_id: user.id }]);

        if (error) throw error;
      }

      fetchBlogs(); // Refresh to update like counts
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  const fetchBlogComments = async (blogId: string): Promise<BlogComment[]> => {
    try {
      // Get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get user profiles for the comments
      const userIds = commentsData?.map(comment => comment.user_id) || [];
      console.log('Fetching profiles for user IDs:', userIds);
      
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_picture_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching comment profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }
      
      console.log('Fetched profiles:', profilesData);

      // Get likes for the comments
      const commentIds = commentsData?.map(comment => comment.id) || [];
      const { data: likesData, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

      if (likesError) throw likesError;

      // Transform the data
      const transformedComments = commentsData?.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.user_id);
        const commentLikes = likesData?.filter(like => like.comment_id === comment.id) || [];
        
        return {
          ...comment,
          author_name: profile?.full_name || 'Unknown',
          author_email: profile?.email || '',
          likes_count: commentLikes.length,
          isLikedByUser: user ? commentLikes.some(like => like.user_id === user.id) : false
        };
      }) || [];

      // Organize comments with replies
      const commentsMap = new Map<string, BlogComment>();
      const rootComments: BlogComment[] = [];

      // First pass: create all comments
      transformedComments.forEach(comment => {
        const commentWithReplies = {
          ...comment,
          replies: []
        };
        commentsMap.set(comment.id, commentWithReplies);
        
        if (!comment.parent_comment_id) {
          rootComments.push(commentWithReplies);
        }
      });

      // Second pass: organize replies
      transformedComments.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies?.push(commentsMap.get(comment.id)!);
          }
        }
      });

      return rootComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const addComment = async (blogId: string, content: string, parentCommentId?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert([
          {
            blog_id: blogId,
            content,
            user_id: user.id,
            parent_comment_id: parentCommentId || null
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment added successfully!"
      });

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      return false;
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to like a comment",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert([{ comment_id: commentId, user_id: user.id }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast({
        title: "Error",
        description: "Failed to update comment like",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a comment",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully!"
      });

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
      return false;
    }
  };

  const fetchUserBlogs = async () => {
    if (!user) return [];

    try {
      // Get user's blogs (both published and drafts)
      const { data: blogsData, error: blogsError } = await supabase
        .from('blogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (blogsError) throw blogsError;

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_picture_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error in fetchUserBlogs:', profileError);
        // Continue without throwing to allow partial functionality
      }

      // Get likes for the blogs
      const blogIds = blogsData?.map(blog => blog.id) || [];
      const { data: likesData, error: likesError } = await supabase
        .from('blog_likes')
        .select('blog_id, user_id')
        .in('blog_id', blogIds);

      if (likesError) throw likesError;

      // Transform the data
      const transformedBlogs = blogsData?.map(blog => {
        const blogLikes = likesData?.filter(like => like.blog_id === blog.id) || [];
        
        return {
          ...blog,
          author_name: profileData?.full_name || 'Unknown',
          author_email: profileData?.email || '',
          author_profile_picture: profileData?.profile_picture_url || '',
          likes_count: blogLikes.length,
          comments_count: 0,
          isLikedByUser: blogLikes.some(like => like.user_id === user.id)
        };
      }) || [];

      return transformedBlogs;
    } catch (error) {
      console.error('Error fetching user blogs:', error);
      return [];
    }
  };

  const saveDraft = async (title: string, content: string, imageFile?: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a draft",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('blogs')
        .insert([
          {
            title,
            content,
            image_url: imageUrl,
            user_id: user.id,
            published: false // Save as draft
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Draft saved successfully!"
      });

      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive"
      });
      return false;
    }
  };

  const publishDraft = async (blogId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to publish a blog",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .update({ published: true })
        .eq('id', blogId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog published successfully!"
      });

      fetchBlogs(); // Refresh blogs
      return true;
    } catch (error) {
      console.error('Error publishing blog:', error);
      toast({
        title: "Error",
        description: "Failed to publish blog",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a blog",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog deleted successfully!"
      });

      return true;
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return {
    blogs,
    loading,
    fetchBlogs,
    createBlog,
    likeBlog,
    fetchBlogComments,
    addComment,
    likeComment,
    deleteComment,
    fetchUserBlogs,
    saveDraft,
    publishDraft,
    deleteBlog
  };
};