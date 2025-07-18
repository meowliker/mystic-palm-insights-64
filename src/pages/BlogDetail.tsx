import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BlogCommentComponent } from "@/components/BlogComment";
import { useBlogs, type Blog, type BlogComment } from "@/hooks/useBlogs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { blogs, likeBlog, fetchBlogComments, addComment, likeComment } = useBlogs();
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
      try {
        const foundBlog = blogs.find(b => b.id === id);
        if (foundBlog) {
          setBlog(foundBlog);
          const blogComments = await fetchBlogComments(id);
          setComments(blogComments);
        }
      } catch (error) {
        console.error('Error fetching blog data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, [id, blogs, fetchBlogComments]);

  const handleShare = async () => {
    if (!blog) return;
    
    const url = `${window.location.origin}/blog/${blog.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: `Check out this astrology blog: ${blog.title}`,
          url: url
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
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
        onClick={() => navigate("/blogs")}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blogs
      </Button>

      {/* Blog post */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                {blog.author_name.charAt(0).toUpperCase()}
              </div>
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
              onClick={() => likeBlog(blog.id)}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
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
                onLike={handleLikeComment}
                onReply={handleReply}
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