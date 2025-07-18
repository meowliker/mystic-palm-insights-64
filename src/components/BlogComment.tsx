import { useState } from "react";
import { Heart, Reply, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { type BlogComment } from "@/hooks/useBlogs";
import { useAuth } from "@/hooks/useAuth";

interface BlogCommentProps {
  comment: BlogComment;
  blogAuthorId: string;
  onLike: (commentId: string) => void;
  onReply: (commentId: string, content: string) => void;
  depth?: number;
}

export const BlogCommentComponent = ({ 
  comment, 
  blogAuthorId, 
  onLike, 
  onReply, 
  depth = 0 
}: BlogCommentProps) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthor = comment.user_id === blogAuthorId;

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-muted' : ''}`}>
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {comment.author_name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.author_name}</span>
            {isAuthor && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Author
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
          </div>
          
          <p className="text-sm mb-3 leading-relaxed">{comment.content}</p>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 h-8 px-2 ${
                comment.isLikedByUser 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={!user}
            >
              <Heart 
                className={`w-3 h-3 ${comment.isLikedByUser ? 'fill-current' : ''}`} 
              />
              {comment.likes_count}
            </Button>
            
            {user && depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 h-8 px-2"
              >
                <Reply className="w-3 h-3" />
                Reply
              </Button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <BlogCommentComponent
              key={reply.id}
              comment={reply}
              blogAuthorId={blogAuthorId}
              onLike={onLike}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};