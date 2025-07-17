import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Hand, Stars, Gem } from 'lucide-react';
import heroImage from '@/assets/hero-cosmic-palm.jpg';
import AuthForm from './AuthForm';

interface WelcomeScreenProps {
  onStartScan?: () => void;
}

const WelcomeScreen = ({ onStartScan }: WelcomeScreenProps) => {
  const [isAuthMode, setIsAuthMode] = useState<'welcome' | 'login' | 'signup'>('welcome');

  const handleAuthSuccess = () => {
    // When auth is successful, redirect to scanner
    onStartScan?.();
  };

  if (isAuthMode === 'login' || isAuthMode === 'signup') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
        {/* Cosmic Background Pattern */}
        <div className="absolute inset-0 bg-starfield opacity-40"></div>
        <div className="absolute inset-0 bg-cosmic opacity-20"></div>
        
        {/* Floating Stars */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-secondary rounded-full animate-twinkle"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-primary-glow rounded-full animate-twinkle delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-accent rounded-full animate-twinkle delay-2000"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <AuthForm 
            mode={isAuthMode}
            onModeChange={setIsAuthMode}
            onSuccess={handleAuthSuccess}
          />
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setIsAuthMode('welcome')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Welcome
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cosmic Background Pattern */}
      <div className="absolute inset-0 bg-starfield opacity-40"></div>
      <div className="absolute inset-0 bg-cosmic opacity-20"></div>
      
      {/* Floating Stars */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-secondary rounded-full animate-twinkle"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-primary-glow rounded-full animate-twinkle delay-1000"></div>
      <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-accent rounded-full animate-twinkle delay-2000"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gem className="h-8 w-8 text-primary animate-pulse-glow" />
            <span className="text-xl font-bold text-foreground">PalmCosmic</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-12">
          <div className="flex-1 max-w-2xl space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                Unlock Your
                <span className="text-transparent bg-clip-text bg-mystical block">
                  Cosmic Destiny
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Discover the ancient wisdom hidden in your palms through AI-powered readings and personalized astrological insights.
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button 
                variant="glow" 
                size="lg"
                onClick={() => setIsAuthMode('signup')}
                className="font-semibold"
              >
                <Sparkles className="h-5 w-5" />
                Begin Your Journey
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsAuthMode('login')}
              >
                Sign In
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center">
                <Hand className="h-8 w-8 text-primary mx-auto mb-3 animate-float" />
                <h3 className="font-semibold text-foreground mb-2">AI Palm Reading</h3>
                <p className="text-sm text-muted-foreground">Advanced AI analyzes your palm lines for profound insights</p>
              </Card>
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center">
                <Stars className="h-8 w-8 text-accent mx-auto mb-3 animate-float delay-500" />
                <h3 className="font-semibold text-foreground mb-2">Daily Horoscope</h3>
                <p className="text-sm text-muted-foreground">Personalized cosmic guidance for your journey ahead</p>
              </Card>
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center">
                <Gem className="h-8 w-8 text-secondary mx-auto mb-3 animate-float delay-1000" />
                <h3 className="font-semibold text-foreground mb-2">Reading History</h3>
                <p className="text-sm text-muted-foreground">Track your spiritual growth with detailed records</p>
              </Card>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 max-w-2xl mt-12 lg:mt-0">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Cosmic Palm Reading" 
                className="w-full h-auto rounded-2xl shadow-cosmic"
              />
              <div className="absolute inset-0 bg-mystical opacity-20 rounded-2xl"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WelcomeScreen;
