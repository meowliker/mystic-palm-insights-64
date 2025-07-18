
import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import PalmScanner from '@/components/PalmScanner';
import ResultsScreen from '@/components/ResultsScreen';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useScans } from '@/hooks/useScans';

type AppState = 'welcome' | 'scanner' | 'results' | 'dashboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const { user, loading } = useAuth();
  const { hasScans, loading: scansLoading } = useScans();

  // Redirect logic based on user authentication and scan history
  useEffect(() => {
    if (!loading && !scansLoading) {
      if (!user && currentScreen !== 'welcome') {
        setCurrentScreen('welcome');
      } else if (user && currentScreen === 'welcome') {
        // If user is authenticated and on welcome screen, check for scan history
        if (hasScans()) {
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('scanner');
        }
      }
    }
  }, [user, loading, scansLoading, currentScreen, hasScans]);

  const handleStartScan = () => {
    if (user) {
      setCurrentScreen('scanner');
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleScanComplete = () => setCurrentScreen('results');
  const handleGoToDashboard = () => setCurrentScreen('dashboard');

  // Show loading state while checking auth and scans
  if (loading || scansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  switch (currentScreen) {
    case 'welcome':
      return <WelcomeScreen onStartScan={handleStartScan} />;
    case 'scanner':
      return user ? <PalmScanner onScanComplete={handleScanComplete} /> : <WelcomeScreen onStartScan={handleStartScan} />;
    case 'results':
      return user ? <ResultsScreen onGoToDashboard={handleGoToDashboard} /> : <WelcomeScreen onStartScan={handleStartScan} />;
    case 'dashboard':
      return user ? <Dashboard onStartScan={handleStartScan} /> : <WelcomeScreen onStartScan={handleStartScan} />;
    default:
      return <WelcomeScreen onStartScan={handleStartScan} />;
  }
};

export default Index;
