import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BlogCommentComponent } from "@/components/BlogComment";
import { useBlogs, type Blog, type BlogComment } from "@/hooks/useBlogs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { blogs, likeBlog, fetchBlogComments, addComment, likeComment, deleteComment } = useBlogs();
  const { user } = useAuth();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      console.log('Starting blog fetch for ID:', id);
      
      try {
        // Always fetch directly from database to ensure fresh data
        console.log('Fetching blog directly for ID:', id);
        const { data: blogData, error: blogError } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .eq('published', true)
          .single();

        console.log('Blog query result:', { blogData, blogError });
        
        if (blogError) {
          console.error('Blog fetch error:', blogError);
          throw blogError;
        }
        
        if (!blogData) {
          console.log('No blog data found');
          return;
        }

        // Get author profile
        console.log('Fetching profile for user:', blogData.user_id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_picture_url')
          .eq('id', blogData.user_id)
          .single();

        console.log('Profile query result:', { profileData, profileError });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Continue without profile data rather than throwing
        }

        // Get likes for this blog
        const { data: likesData, error: likesError } = await supabase
          .from('blog_likes')
          .select('user_id')
          .eq('blog_id', id);

        if (likesError) {
          console.error('Likes fetch error:', likesError);
        }

        // Transform the data
        const transformedBlog = {
          ...blogData,
          author_name: profileData?.full_name || 'Unknown User',
          author_email: profileData?.email || '',
          author_profile_picture: profileData?.profile_picture_url || '',
          likes_count: likesData?.length || 0,
          comments_count: 0,
          isLikedByUser: user ? likesData?.some(like => like.user_id === user.id) || false : false
        };

        console.log('Transformed blog:', transformedBlog);
        setBlog(transformedBlog);
        
        // Fetch comments separately
        const blogComments = await fetchBlogComments(id);
        setComments(blogComments);
        
      } catch (error) {
        console.error('Error fetching blog data:', error);
        setBlog(null); // Explicitly set to null on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, [id, user]); // Removed blogs and fetchBlogComments from dependencies

  const handleShare = async () => {
    if (!blog) return;
    
    const url = `${window.location.origin}/blog/${blog.id}`;
    const shareData = {
      title: blog.title,
      text: `Check out this astrology blog: ${blog.title}`,
      url: url
    };
    
    // Try native share first, but handle permission errors
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; // Successfully shared
      } catch (err) {
        // Handle specific permission errors and user cancellation
        if (err.name === 'AbortError') {
          return; // User cancelled, don't show fallback
        }
        if (err.name === 'NotAllowedError') {
          // Permission denied - fall through to clipboard
          console.log('Share permission denied, using clipboard fallback');
        } else {
          console.error('Share failed:', err);
        }
        // For any error other than AbortError, fall through to clipboard
      }
    }
    
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error('Clipboard failed:', err);
      toast.error("Failed to copy link");
    }
  };

  const handleAddComment = async () => {
    if (!blog || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await addComment(blog.id, newComment);
      if (success) {
        setNewComment("");
        // Refresh comments
        const updatedComments = await fetchBlogComments(blog.id);
        setComments(updatedComments);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const success = await likeComment(commentId);
    if (success) {
      // Refresh comments to update like counts
      if (blog) {
        const updatedComments = await fetchBlogComments(blog.id);
        setComments(updatedComments);
      }
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    if (!blog) return;
    
    const success = await addComment(blog.id, content, commentId);
    if (success) {
      // Refresh comments to show new reply
      const updatedComments = await fetchBlogComments(blog.id);
      setComments(updatedComments);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      // Refresh comments to show updated list
      if (blog) {
        const updatedComments = await fetchBlogComments(blog.id);
        setComments(updatedComments);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The blog post you're looking for doesn't exist.
          </p>
          <Link to="/blogs">
            <Button>Back to Blogs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/blogs');
          }
        }}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Blog post */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={blog.author_profile_picture} 
                  alt={blog.author_name}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {blog.author_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{blog.author_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(blog.created_at)}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Astrology</Badge>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!user) return;
                
                // Optimistic update
                setBlog(prev => prev ? {
                  ...prev,
                  isLikedByUser: !prev.isLikedByUser,
                  likes_count: prev.isLikedByUser ? prev.likes_count - 1 : prev.likes_count + 1
                } : null);
                
                try {
                  await likeBlog(blog.id);
                  
                  // Refresh blog data to ensure consistency
                  if (id) {
                    const { data: likesData } = await supabase
                      .from('blog_likes')
                      .select('user_id')
                      .eq('blog_id', id);
                    
                    setBlog(prev => prev ? {
                      ...prev,
                      likes_count: likesData?.length || 0,
                      isLikedByUser: likesData?.some(like => like.user_id === user.id) || false
                    } : null);
                  }
                } catch (error) {
                  // Revert optimistic update on error
                  setBlog(prev => prev ? {
                    ...prev,
                    isLikedByUser: !prev.isLikedByUser,
                    likes_count: prev.isLikedByUser ? prev.likes_count + 1 : prev.likes_count - 1
                  } : null);
                  toast.error("Failed to update like");
                }
              }}
              className={`flex items-center gap-2 ${
                blog.isLikedByUser 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={!user}
            >
              <Heart 
                className={`w-4 h-4 ${blog.isLikedByUser ? 'fill-current' : ''}`} 
              />
              {blog.likes_count}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {comments.length}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {blog.image_url && (
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full max-h-96 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{blog.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            Comments ({comments.length})
          </h2>
        </CardHeader>
        
        <CardContent>
          {/* Add comment form */}
          {user ? (
            <div className="mb-6">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                    {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[100px] resize-none mb-2"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground">
                Please{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  log in
                </Link>{" "}
                to leave a comment.
              </p>
            </div>
          )}
          
          {comments.length > 0 && <Separator className="mb-6" />}
          
          {/* Comments list */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <BlogCommentComponent
                key={comment.id}
                comment={comment}
                blogAuthorId={blog.user_id}
                currentUserId={user?.id}
                onLike={handleLikeComment}
                onReply={handleReply}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
          
          {comments.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};