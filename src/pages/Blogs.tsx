import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Search, Filter, ArrowLeft, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlogList } from "@/components/BlogList";
import { useBlogs } from "@/hooks/useBlogs";
import { useAuth } from "@/hooks/useAuth";

export const Blogs = () => {
  const { blogs, loading, likeBlog, fetchUserBlogs } = useBlogs();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showDrafts, setShowDrafts] = useState(false);
  const [userBlogs, setUserBlogs] = useState<any[]>([]);
  const [userBlogsLoading, setUserBlogsLoading] = useState(false);

  // Load user's blogs when showDrafts is true
  const loadUserBlogs = async () => {
    if (!user) return;
    setUserBlogsLoading(true);
    try {
      const userBlogsData = await fetchUserBlogs();
      setUserBlogs(userBlogsData);
    } finally {
      setUserBlogsLoading(false);
    }
  };

  // Load user blogs when showDrafts is toggled
  useEffect(() => {
    if (showDrafts && user) {
      loadUserBlogs();
    }
  }, [showDrafts, user]);

  const blogsToShow = showDrafts ? userBlogs : blogs;
  const isLoading = showDrafts ? userBlogsLoading : loading;

  const filteredAndSortedBlogs = blogsToShow
    .filter(blog => 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most-liked":
          return b.likes_count - a.likes_count;
        case "most-commented":
          return b.comments_count - a.comments_count;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Astrology Blog</h1>
          <p className="text-muted-foreground">
            Discover insights about the stars, planets, and cosmic energies
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          {user && (
            <>
              <Button
                variant={showDrafts ? "default" : "outline"}
                onClick={() => {
                  setShowDrafts(!showDrafts);
                  if (!showDrafts) {
                    loadUserBlogs();
                  }
                }}
                className="flex items-center gap-2"
              >
                {showDrafts ? <Eye className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {showDrafts ? "Show All Blogs" : "My Blogs & Drafts"}
              </Button>
              <Link to="/blogs/create">
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Write Blog
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most-liked">Most Liked</SelectItem>
            <SelectItem value="most-commented">Most Commented</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Blog List */}
      {filteredAndSortedBlogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-xl font-semibold mb-2">
            {showDrafts ? "No blogs found" : "No blogs found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? "No blogs match your search criteria" 
              : showDrafts 
                ? "You haven't written any blogs yet!"
                : "Be the first to write about astrology!"
            }
          </p>
          {user && !searchTerm && (
            <Link to="/blogs/create">
              <Button>
                {showDrafts ? "Write Your First Blog" : "Write the First Blog"}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <BlogList blogs={filteredAndSortedBlogs} onLike={likeBlog} />
      )}
    </div>
  );
};