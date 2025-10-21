
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gem, Sparkles, Star, Moon, MessageCircle } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface WelcomeScreenProps {
  onStartScan: () => void;
  onGoToDashboard: () => void;
}

const WelcomeScreen = ({ onStartScan, onGoToDashboard }: WelcomeScreenProps) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const { user, loading, signOut } = useAuth();

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
                ← Back
              </Button>
            </div>
            <AuthForm
              mode={authMode}
              onModeChange={setAuthMode}
              onSuccess={() => {
                setShowAuth(false);
                // Both login and signup go to dashboard
                onGoToDashboard();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-y-auto safe-area-inset-top">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <Star
            key={i}
            className="absolute text-white/20 animate-pulse"
            size={Math.random() * 3 + 1}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col text-center p-4 max-w-sm mx-auto">
        {/* Logo and title - Compact */}
        <div className="pt-8 pb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gem className="h-8 w-8 text-yellow-300 animate-pulse-glow" />
            <h1 className="text-3xl font-bold text-white cosmic-title">
              PalmCosmic
            </h1>
          </div>
          <p className="text-base text-purple-200 font-light px-2">
            Unlock the mysteries of your destiny through AI-powered palm reading
          </p>
        </div>

        {/* Features - Compressed */}
        <div className="flex-1 flex flex-col justify-center space-y-4 py-4">
          <div className="space-y-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Sparkles className="h-6 w-6 text-yellow-300 mx-auto" />
            <h3 className="text-base font-semibold text-white">AI Analysis</h3>
            <p className="text-purple-200 text-xs leading-relaxed">Advanced AI interprets your palm lines with cosmic precision</p>
          </div>
          
          <div className="space-y-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Moon className="h-6 w-6 text-blue-300 mx-auto" />
            <h3 className="text-base font-semibold text-white">Cosmic Insights</h3>
            <p className="text-purple-200 text-xs leading-relaxed">Discover your life path, love lines, and hidden potentials</p>
          </div>
          
          <div className="space-y-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Star className="h-6 w-6 text-purple-300 mx-auto" />
            <h3 className="text-base font-semibold text-white">Personalized</h3>
            <p className="text-purple-200 text-xs leading-relaxed">Tailored readings based on your unique palm characteristics</p>
          </div>
        </div>

        {/* CTA Buttons - Bottom */}
        <div className="pb-8 space-y-4">
          {user ? (
            <div className="space-y-3">
              <Button
                onClick={onGoToDashboard}
                size="lg"
                variant="glow"
                className="w-full text-base px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Gem className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={signOut}
                className="text-purple-200 hover:text-white text-sm"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                size="lg"
                variant="glow"
                className="w-full text-base px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Gem className="mr-2 h-4 w-4" />
                Begin Your Journey
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
                className="text-purple-200 hover:text-white text-sm"
              >
                Already have an account? Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
