import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Share as CapacitorShare } from '@capacitor/share';
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
  AlertTriangle,
  Upload,
  MessageCircle,
  Menu
} from 'lucide-react';
import constellationPattern from '@/assets/constellation-pattern.jpg';
import { useScans } from '@/hooks/useScans';
import { cleanupMarkdown } from '@/utils/cleanupMarkdown';
import { useAuth } from '@/hooks/useAuth';
import { useBlogs } from '@/hooks/useBlogs';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import HoroscopeForm from '@/components/HoroscopeForm';
import { HoroscopeResultDialog } from '@/components/HoroscopeResultDialog';
import ScanDetailDialog from '@/components/ScanDetailDialog';
import { useUserStats } from '@/hooks/useUserStats';

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

const Dashboard = ({ onStartScan, onStartUpload }: { onStartScan: () => void; onStartUpload?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'readings' | 'horoscope' | 'blog'>('readings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [userBlogs, setUserBlogs] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [horoscope, setHoroscope] = useState<any>(null);
  const [showHoroscopeDialog, setShowHoroscopeDialog] = useState(false);
  const { scans, clearAllScans, fetchScans } = useScans();
  const { user } = useAuth();
  const { fetchUserBlogs, publishDraft, deleteBlog } = useBlogs();
  const { toast } = useToast();
  const { stats } = useUserStats();

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

  const handleShareReading = async (reading: any) => {
    const shareData = {
      title: 'My Palm Reading',
      text: `Check out my palm reading insights: ${reading.overall_insight?.substring(0, 100)}...`,
      url: window.location.href
    };

    // Check if we're on mobile and Web Share API is supported
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const supportsWebShare = 'share' in navigator && window.isSecureContext;

    console.log('Share environment:', {
      isMobile,
      supportsWebShare,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol
    });

    try {
      // Try Capacitor Share API first
      await CapacitorShare.share(shareData);
      toast({
        title: "Shared successfully",
        description: "Your palm reading has been shared"
      });
    } catch (shareErr) {
      // Fallback for desktop or when sharing is not available
      console.log('Capacitor share failed, using fallback:', shareErr);
      
      const shareText = `🔮 My Palm Reading\n\n${reading.overall_insight}\n\nGenerated on ${new Date(reading.scan_date).toLocaleDateString()}\n\nGet your own reading at: ${window.location.origin}`;
      
      try {
        // Try clipboard as fallback
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard",
          description: "Palm reading copied! You can now share it anywhere."
        });
      } catch (clipboardErr) {
        // Final fallback - show share options
        const shareUrls = {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`
        };
        
        const shareChoice = confirm(
          "Choose how to share your palm reading:\n\nOK = Open WhatsApp\nCancel = Try Twitter"
        );
        
        if (shareChoice) {
          window.open(shareUrls.whatsapp, '_blank');
        } else {
          window.open(shareUrls.twitter, '_blank');
        }
        
        toast({
          title: "Opening share",
          description: "Choose your preferred app to share your reading"
        });
      }
    }
  };

  const handleClearAllScans = async () => {
    try {
      const success = await clearAllScans();
      if (success) {
        toast({
          title: "Readings cleared",
          description: "All palm readings have been deleted successfully."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to clear readings. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error clearing scans:', error);
      toast({
        title: "Error",
        description: "Failed to clear readings. Please try again.",
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 safe-area-inset-top">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 pt-6 sm:pt-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">Welcome back</h1>
              <p className="text-muted-foreground hidden sm:block text-sm">Ready to explore your cosmic destiny?</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Navigation Menu for Actions */}
              <Sheet open={navMenuOpen} onOpenChange={setNavMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <div className="space-y-4 pt-6">
                    <h3 className="font-semibold text-lg mb-4">Actions</h3>
                    
                    <div className="space-y-3">
                      <Button 
                        variant="glow" 
                        onClick={() => {
                          onStartScan();
                          setNavMenuOpen(false);
                        }}
                        className="w-full justify-start gap-3"
                        size="lg"
                      >
                        <Scan className="h-5 w-5" />
                        Scan Your Palm
                      </Button>
                      
                      
                      <Link to="/chatbot">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-3"
                          size="lg"
                          onClick={() => setNavMenuOpen(false)}
                        >
                          <MessageCircle className="h-5 w-5" />
                          Chat with Astrobot
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Settings Menu */}
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
                      <Card className="p-4 bg-card/80 backdrop-blur-sm text-center">
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

                      {/* Mobile Daily Insight */}
                      <Card className="p-4 bg-card/80 backdrop-blur-sm">
                        <h3 className="font-semibold text-foreground mb-4">Daily Insight</h3>
                        <div 
                          className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
                        >
                          <p className="text-sm text-foreground/90 italic">
                            "The stars align to reveal new possibilities. Trust your intuition as it guides you toward meaningful connections today."
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            ✨ Cosmic Guidance for {new Date().toLocaleDateString()}
                          </p>
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

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 text-center bg-card/80 backdrop-blur-sm">
                <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.loading ? "..." : stats.totalReadings}
                </div>
                <div className="text-xs text-muted-foreground">Total Readings</div>
              </Card>
              <Card className="p-3 sm:p-4 text-center bg-card/80 backdrop-blur-sm">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-accent mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.loading ? "..." : stats.daysStreak}
                </div>
                <div className="text-xs text-muted-foreground">Days Streak</div>
              </Card>
              <Card className="p-3 sm:p-4 text-center bg-card/80 backdrop-blur-sm">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-secondary mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.loading ? "..." : stats.accuracy}
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </Card>
              <Card className="p-3 sm:p-4 text-center bg-card/80 backdrop-blur-sm">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-glow mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.loading ? "..." : `${stats.cosmicSync}%`}
                </div>
                <div className="text-xs text-muted-foreground">Cosmic Sync</div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button 
                  variant={activeTab === 'readings' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('readings')}
                  className="justify-start sm:justify-center"
                  size="sm"
                >
                  <History className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Recent Readings</span>
                  <span className="sm:hidden">Recent</span>
                </Button>
                <Button 
                  variant={activeTab === 'horoscope' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('horoscope')}
                  className="justify-start sm:justify-center"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Today's Horoscope</span>
                  <span className="sm:hidden">Horoscope</span>
                </Button>
                <Button 
                  variant={activeTab === 'blog' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('blog')}
                  className="justify-start sm:justify-center"
                  size="sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Astrology Blog</span>
                  <span className="sm:hidden">Blog</span>
                </Button>
              </div>

              {/* Tab Content */}
              {activeTab === 'readings' && (
                <div className="space-y-4">
                  {/* Clear All History Button */}
                  {scans.length > 0 && (
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Recent Readings</h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Clear All Readings
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear All Readings</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all your palm readings? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearAllScans} className="bg-red-600 hover:bg-red-700">
                              Yes, Delete All
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  
                  {scans.length > 0 ? scans.map((scan) => (
                    <Card key={scan.id} className="p-4 sm:p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(scan.scan_date).toLocaleDateString()} at {new Date(scan.scan_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground">Palm Reading</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShareReading(scan)}
                            className="flex-1 sm:flex-none"
                          >
                            <Share className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Share</span>
                          </Button>
                           <ScanDetailDialog scan={scan} onScanDeleted={fetchScans}>
                             <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                               <Eye className="h-4 w-4 sm:mr-2" />
                               <span className="hidden sm:inline">View Details</span>
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
                        <p className="text-muted-foreground line-clamp-3">
                          {(() => {
                            const cleanedText = cleanupMarkdown(scan.overall_insight);
                            return cleanedText.length > 150 
                              ? `${cleanedText.substring(0, 150)}...` 
                              : cleanedText;
                          })()}
                        </p>
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

            
            {/* Daily Insight */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-4">Daily Insight</h3>
              <div 
                className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
              >
                <p className="text-sm text-foreground/90 italic">
                  "The stars align to reveal new possibilities. Trust your intuition as it guides you toward meaningful connections today."
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ✨ Cosmic Guidance for {new Date().toLocaleDateString()}
                </p>
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