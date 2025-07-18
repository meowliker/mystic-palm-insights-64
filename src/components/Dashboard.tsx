import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Scan, 
  Calendar, 
  History, 
  BookOpen, 
  User, 
  Settings,
  Heart,
  Brain,
  Zap,
  Star,
  Clock,
  Edit,
  Trash2,
  Eye,
  FileText,
  PlusCircle,
  Share,
  AlertTriangle
} from 'lucide-react';
import constellationPattern from '@/assets/constellation-pattern.jpg';
import { useScans } from '@/hooks/useScans';
import { useAuth } from '@/hooks/useAuth';
import { useBlogs } from '@/hooks/useBlogs';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import HoroscopeForm from '@/components/HoroscopeForm';
import { HoroscopeResultDialog } from '@/components/HoroscopeResultDialog';
import ScanDetailDialog from '@/components/ScanDetailDialog';

const ProfilePicture = ({ userId, onUpdate }: { userId?: string; onUpdate?: () => void }) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  const loadProfilePicture = async () => {
    if (!userId) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();
    
    if (profile?.profile_picture_url) {
      setProfilePictureUrl(profile.profile_picture_url);
    } else {
      setProfilePictureUrl('');
    }
  };

  useEffect(() => {
    loadProfilePicture();
  }, [userId]);

  // Listen for profile updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          loadProfilePicture();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden bg-mystical flex items-center justify-center">
      {profilePictureUrl ? (
        <img 
          src={profilePictureUrl} 
          alt="Profile" 
          className="w-full h-full object-cover"
          key={profilePictureUrl} // Force re-render when URL changes
        />
      ) : (
        <User className="h-8 w-8 text-primary-foreground" />
      )}
    </div>
  );
};

const Dashboard = ({ onStartScan }: { onStartScan: () => void }) => {
  const [activeTab, setActiveTab] = useState<'readings' | 'horoscope' | 'blog'>('readings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userBlogs, setUserBlogs] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [horoscope, setHoroscope] = useState<any>(null);
  const [showHoroscopeDialog, setShowHoroscopeDialog] = useState(false);
  const { scans, clearAllScans } = useScans();
  const { user } = useAuth();
  const { fetchUserBlogs, publishDraft, deleteBlog } = useBlogs();
  const { toast } = useToast();

  // Load user's blogs when blog tab is active
  useEffect(() => {
    if (activeTab === 'blog' && user) {
      loadUserBlogs();
    }
  }, [activeTab, user]);

  const loadUserBlogs = async () => {
    setBlogsLoading(true);
    try {
      const blogs = await fetchUserBlogs();
      setUserBlogs(blogs);
    } finally {
      setBlogsLoading(false);
    }
  };

  const handlePublishDraft = async (blogId: string) => {
    const success = await publishDraft(blogId);
    if (success) {
      loadUserBlogs(); // Refresh the list
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    const success = await deleteBlog(blogId);
    if (success) {
      loadUserBlogs(); // Refresh the list
    }
  };

  const handleShareReading = (reading: any) => {
    if (navigator.share) {
      navigator.share({
        title: 'My Palm Reading',
        text: `Check out my palm reading insights: ${reading.overall_insight?.substring(0, 100)}...`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `My Palm Reading:\n${reading.overall_insight}\n\nGenerated on ${new Date(reading.scan_date).toLocaleDateString()}`
      );
      toast({
        title: "Copied to clipboard",
        description: "Your palm reading has been copied to clipboard"
      });
    }
  };

  const handleClearAllScans = async () => {
    try {
      const success = await clearAllScans();
      if (success) {
        toast({
          title: "History cleared",
          description: "All palm readings have been deleted successfully."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to clear history. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error clearing scans:', error);
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleHoroscopeGenerated = (generatedHoroscope: any) => {
    setHoroscope(generatedHoroscope);
    setShowHoroscopeDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Welcome back, {user?.user_metadata?.full_name || 'Cosmic Explorer'}</h1>
              <p className="text-muted-foreground hidden sm:block">Ready to explore your cosmic destiny?</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="glow" 
                onClick={onStartScan}
                className="gap-2"
                size="sm"
              >
                <Scan className="h-4 w-4" />
                <span className="hidden sm:inline">New Scan</span>
              </Button>
              {/* Mobile Settings */}
              <div className="lg:hidden">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="space-y-6 pt-6">
                      {/* Mobile Profile Card */}
                      <Card className="p-6 bg-card/80 backdrop-blur-sm text-center">
                        <ProfilePicture userId={user?.id} />
                        <h3 className="font-semibold text-foreground mb-4">{user?.user_metadata?.full_name || 'Cosmic Explorer'}</h3>
                        <div className="space-y-2">
                          <EditProfileDialog>
                            <Button variant="outline" size="sm" className="w-full">
                              <User className="h-4 w-4 mr-2" />
                              Edit Profile
                            </Button>
                          </EditProfileDialog>
                        </div>
                      </Card>

                      {/* Mobile Cosmic Profile */}
                      <Card 
                        className="p-6 bg-card/80 backdrop-blur-sm relative overflow-hidden"
                        style={{
                          backgroundImage: `url(${constellationPattern})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute inset-0 bg-background/80"></div>
                        <div className="relative z-10">
                          <h3 className="font-semibold text-foreground mb-4">Your Cosmic Profile</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Heart className="h-5 w-5 text-accent" />
                              <div>
                                <div className="text-sm font-medium text-foreground">Heart Line</div>
                                <div className="text-xs text-muted-foreground">Strong emotional connections</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Brain className="h-5 w-5 text-primary" />
                              <div>
                                <div className="text-sm font-medium text-foreground">Head Line</div>
                                <div className="text-xs text-muted-foreground">Analytical and creative</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Zap className="h-5 w-5 text-secondary" />
                              <div>
                                <div className="text-sm font-medium text-foreground">Life Line</div>
                                <div className="text-xs text-muted-foreground">Vibrant life energy</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center bg-card/80 backdrop-blur-sm">
                <History className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{scans.length}</div>
                <div className="text-xs text-muted-foreground">Total Readings</div>
              </Card>
              <Card className="p-4 text-center bg-card/80 backdrop-blur-sm">
                <Calendar className="h-6 w-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">28</div>
                <div className="text-xs text-muted-foreground">Days Streak</div>
              </Card>
              <Card className="p-4 text-center bg-card/80 backdrop-blur-sm">
                <Star className="h-6 w-6 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">8.5</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </Card>
              <Card className="p-4 text-center bg-card/80 backdrop-blur-sm">
                <Zap className="h-6 w-6 text-primary-glow mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">95%</div>
                <div className="text-xs text-muted-foreground">Cosmic Sync</div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <Button 
                  variant={activeTab === 'readings' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('readings')}
                >
                  <History className="h-4 w-4 mr-2" />
                  Recent Readings
                </Button>
                <Button 
                  variant={activeTab === 'horoscope' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('horoscope')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Today's Horoscope
                </Button>
                <Button 
                  variant={activeTab === 'blog' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('blog')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Astrology Blog
                </Button>
              </div>

              {/* Tab Content */}
              {activeTab === 'readings' && (
                <div className="space-y-4">
                  {/* Clear All History Button */}
                  {scans.length > 0 && (
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Recent Readings</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllScans}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Clear All History
                      </Button>
                    </div>
                  )}
                  
                  {scans.length > 0 ? scans.map((scan) => (
                    <Card key={scan.id} className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(scan.scan_date).toLocaleDateString()} at {new Date(scan.scan_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground">Palm Reading</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShareReading(scan)}
                          >
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <ScanDetailDialog scan={scan}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </ScanDetailDialog>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[
                            scan.life_line_strength && `Life Line (${scan.life_line_strength})`,
                            scan.heart_line_strength && `Heart Line (${scan.heart_line_strength})`,
                            scan.head_line_strength && `Head Line (${scan.head_line_strength})`,
                            scan.fate_line_strength && `Fate Line (${scan.fate_line_strength})`
                          ].filter(Boolean).map((line) => (
                            <Badge key={line} variant="secondary" className="bg-primary/10 text-primary">
                              {line}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-muted-foreground">{scan.overall_insight}</p>
                      </div>
                    </Card>
                  )) : (
                    <Card className="p-8 bg-card/80 backdrop-blur-sm text-center">
                      <div className="space-y-4">
                        <Scan className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-semibold text-foreground">No scans yet</h3>
                        <p className="text-muted-foreground">Start your cosmic journey with your first palm reading!</p>
                        <Button onClick={onStartScan} variant="glow">
                          <Scan className="h-4 w-4 mr-2" />
                          Get Your First Reading
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'horoscope' && (
                <HoroscopeForm onHoroscopeGenerated={handleHoroscopeGenerated} />
              )}

              {activeTab === 'blog' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">My Blogs</h3>
                    <div className="flex gap-2">
                      <Link to="/blogs">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View All Blogs
                        </Button>
                      </Link>
                      <Link to="/blogs/create">
                        <Button size="sm">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Write Blog
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {blogsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading your blogs...</p>
                    </div>
                  ) : userBlogs.length > 0 ? (
                    <div className="space-y-4">
                      {userBlogs.map((blog) => (
                        <Card key={blog.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-foreground line-clamp-1">{blog.title}</h4>
                                <Badge variant={blog.published ? "default" : "secondary"}>
                                  {blog.published ? "Published" : "Draft"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {blog.content.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {new Date(blog.created_at).toLocaleDateString()}
                                </span>
                                {blog.published && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      {blog.likes_count}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      {blog.comments_count}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {!blog.published && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePublishDraft(blog.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Publish
                                </Button>
                              )}
                              <Link to={`/blog/${blog.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  {blog.published ? "View" : "Edit"}
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBlog(blog.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 bg-card/80 backdrop-blur-sm text-center">
                      <div className="space-y-4">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-semibold text-foreground">No blogs yet</h3>
                        <p className="text-muted-foreground">Share your astrology insights with the community!</p>
                        <Link to="/blogs/create">
                          <Button>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Write Your First Blog
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Profile Card */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm text-center">
              <ProfilePicture userId={user?.id} />
              <h3 className="font-semibold text-foreground mb-4">{user?.user_metadata?.full_name || 'Cosmic Explorer'}</h3>
              <div className="space-y-2">
                <EditProfileDialog>
                  <Button variant="outline" size="sm" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </EditProfileDialog>
              </div>
            </Card>

            {/* Quick Insights */}
            <Card 
              className="p-6 bg-card/80 backdrop-blur-sm relative overflow-hidden"
              style={{
                backgroundImage: `url(${constellationPattern})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-background/80"></div>
              <div className="relative z-10">
                <h3 className="font-semibold text-foreground mb-4">Your Cosmic Profile</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-accent" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Heart Line</div>
                      <div className="text-xs text-muted-foreground">Strong emotional connections</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Head Line</div>
                      <div className="text-xs text-muted-foreground">Analytical and creative</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Life Line</div>
                      <div className="text-xs text-muted-foreground">Vibrant life energy</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Horoscope Result Dialog */}
      <HoroscopeResultDialog 
        open={showHoroscopeDialog}
        onOpenChange={setShowHoroscopeDialog}
        horoscope={horoscope}
      />
    </div>
  );
};

export default Dashboard;