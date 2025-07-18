import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlogs, type Blog } from "@/hooks/useBlogs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BlogListProps {
  blogs: Blog[];
  onLike: (blogId: string) => void;
}

export const BlogList = ({ blogs, onLike }: BlogListProps) => {
  const { user } = useAuth();

  const handleShare = async (blog: Blog) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <Card key={blog.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                  {blog.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{blog.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(blog.created_at)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Astrology
              </Badge>
            </div>
            <Link to={`/blog/${blog.id}`}>
              <h3 className="font-bold text-lg hover:text-primary transition-colors line-clamp-2">
                {blog.title}
              </h3>
            </Link>
          </CardHeader>
          
          <CardContent>
            {blog.image_url && (
              <Link to={`/blog/${blog.id}`}>
                <img
                  src={blog.image_url}
                  alt={blog.title}
                  className="w-full h-48 object-cover rounded-lg mb-4 hover:opacity-90 transition-opacity"
                />
              </Link>
            )}
            
            <Link to={`/blog/${blog.id}`}>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {truncateContent(blog.content)}
              </p>
            </Link>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(blog.id)}
                  className={`flex items-center gap-1 ${
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
                
                <Link to={`/blog/${blog.id}`}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {blog.comments_count}
                  </Button>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(blog)}
                  className="flex items-center gap-1"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              
              <Link to={`/blog/${blog.id}`}>
                <Button variant="outline" size="sm">
                  Read More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};