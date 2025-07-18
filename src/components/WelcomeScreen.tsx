
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gem, Sparkles, Star, Moon, LogOut, User } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useScans } from '@/hooks/useScans';

interface WelcomeScreenProps {
  onStartScan: () => void;
  onGoToDashboard: () => void;
}

const WelcomeScreen = ({ onStartScan, onGoToDashboard }: WelcomeScreenProps) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [showSwitchAccounts, setShowSwitchAccounts] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { hasScans, loading: scansLoading } = useScans();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <Star
              key={i}
              className="absolute text-white/20 animate-pulse"
              size={Math.random() * 4 + 2}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => setShowAuth(false)}
                className="mb-4 text-white/70 hover:text-white"
              >
                ← Back to Welcome
              </Button>
            </div>
            <AuthForm
              mode={authMode}
              onModeChange={setAuthMode}
              onSuccess={() => {
                setShowAuth(false);
                // For new users after auth, always go to scanner first
                onStartScan();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <Star
            key={i}
            className="absolute text-white/20 animate-pulse"
            size={Math.random() * 4 + 2}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center p-6">
        <div className="space-y-8 max-w-2xl mx-auto">
          {/* Logo and title */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Gem className="h-12 w-12 text-yellow-300 animate-pulse-glow" />
              <h1 className="text-5xl font-bold text-white cosmic-title">
                PalmCosmic
              </h1>
            </div>
            <p className="text-xl text-purple-200 font-light">
              Unlock the mysteries of your destiny through AI-powered palm reading
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="space-y-3 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="h-8 w-8 text-yellow-300 mx-auto" />
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <p className="text-purple-200 text-sm">Advanced AI interprets your palm lines with cosmic precision</p>
            </div>
            <div className="space-y-3 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Moon className="h-8 w-8 text-blue-300 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Cosmic Insights</h3>
              <p className="text-purple-200 text-sm">Discover your life path, love lines, and hidden potentials</p>
            </div>
            <div className="space-y-3 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Star className="h-8 w-8 text-purple-300 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Personalized</h3>
              <p className="text-purple-200 text-sm">Tailored readings based on your unique palm characteristics</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4">
            {user ? (
              <>
                <Button
                  onClick={hasScans ? onGoToDashboard : onStartScan}
                  size="lg"
                  variant="glow"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={scansLoading}
                >
                  <Gem className="mr-2 h-5 w-5" />
                  {scansLoading ? 'Loading...' : hasScans ? 'Go to Your Dashboard' : 'Scan Your Palm'}
                </Button>
                <div className="text-center space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowSwitchAccounts(!showSwitchAccounts)}
                    className="text-purple-200 hover:text-white"
                  >
                    Switch Accounts
                  </Button>
                  {showSwitchAccounts && (
                    <div className="space-y-2 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                      <Button
                        onClick={async () => {
                          await signOut();
                          setAuthMode('login');
                          setShowAuth(true);
                          setShowSwitchAccounts(false);
                        }}
                        variant="ghost"
                        className="w-full text-purple-200 hover:text-white"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log into existing account
                      </Button>
                      <Button
                        onClick={async () => {
                          await signOut();
                          setAuthMode('signup');
                          setShowAuth(true);
                          setShowSwitchAccounts(false);
                        }}
                        variant="ghost"
                        className="w-full text-purple-200 hover:text-white"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  size="lg"
                  variant="glow"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Gem className="mr-2 h-5 w-5" />
                  Begin Your Journey
                </Button>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="text-purple-200 hover:text-white"
                  >
                    Already have an account? Login
                  </Button>
                </div>
              </>
            )}
          </div>

          <p className="text-purple-300 text-sm max-w-md mx-auto">
            Join thousands who have discovered their cosmic path through the ancient art of palmistry, 
            enhanced with modern AI technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
