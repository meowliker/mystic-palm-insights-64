import { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import constellationPattern from '@/assets/constellation-pattern.jpg';
import { useScans } from '@/hooks/useScans';
import { useAuth } from '@/hooks/useAuth';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { supabase } from '@/integrations/supabase/client';

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
  const { scans } = useScans();
  const { user } = useAuth();

  // Format scans for display
  const recentReadings = scans.map((scan) => ({
    id: scan.id,
    date: new Date(scan.scan_date).toLocaleDateString(),
    time: new Date(scan.scan_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    lines: [
      scan.life_line_strength && `Life Line (${scan.life_line_strength})`,
      scan.heart_line_strength && `Heart Line (${scan.heart_line_strength})`,
      scan.head_line_strength && `Head Line (${scan.head_line_strength})`,
      scan.fate_line_strength && `Fate Line (${scan.fate_line_strength})`
    ].filter(Boolean),
    insights: scan.overall_insight
  }));

  const todayHoroscope = {
    sign: 'Aquarius',
    prediction: 'The stars align favorably for new beginnings. Your palm readings suggest a day of emotional clarity and creative insights.',
    energy: 85,
    focus: 'Career & Relationships'
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
                          <Button variant="ghost" size="sm" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Button>
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
                  {recentReadings.length > 0 ? recentReadings.map((reading) => (
                    <Card key={reading.id} className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {reading.date} at {reading.time}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground">Palm Reading</h3>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {reading.lines.map((line) => (
                            <Badge key={line} variant="secondary" className="bg-primary/10 text-primary">
                              {line}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-muted-foreground">{reading.insights}</p>
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
                <Card className="p-6 bg-card/80 backdrop-blur-sm">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {todayHoroscope.sign} ♒
                      </h3>
                      <p className="text-muted-foreground">Today's Cosmic Guidance</p>
                    </div>
                    
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-foreground leading-relaxed">{todayHoroscope.prediction}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{todayHoroscope.energy}%</div>
                        <div className="text-sm text-muted-foreground">Energy Level</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-foreground mb-1">{todayHoroscope.focus}</div>
                        <div className="text-sm text-muted-foreground">Focus Areas</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'blog' && (
                <div className="space-y-4">
                  <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
                    <h3 className="font-semibold text-foreground mb-2">Understanding Your Palm Lines</h3>
                    <p className="text-muted-foreground mb-3">Discover the ancient art of palmistry and what each line reveals about your cosmic journey.</p>
                    <Button variant="outline" size="sm">Read More</Button>
                  </Card>
                  <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
                    <h3 className="font-semibold text-foreground mb-2">Mercury Retrograde Guide</h3>
                    <p className="text-muted-foreground mb-3">Navigate cosmic challenges with wisdom from your palm readings during planetary transitions.</p>
                    <Button variant="outline" size="sm">Read More</Button>
                  </Card>
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
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
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
    </div>
  );
};

export default Dashboard;