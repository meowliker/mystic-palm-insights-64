
import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import PalmScanner from '@/components/PalmScanner';
import PalmUploadForm from '@/components/PalmUploadForm';
import ResultsScreen from '@/components/ResultsScreen';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useScans } from '@/hooks/useScans';

type AppState = 'welcome' | 'scanner' | 'upload' | 'results' | 'dashboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [scanData, setScanData] = useState<any>(null);
  const { user, loading } = useAuth();
  const { hasScans, loading: scansLoading } = useScans();

  // Only redirect unauthenticated users away from protected screens
  useEffect(() => {
    if (!loading && !scansLoading) {
      if (!user && (currentScreen === 'scanner' || currentScreen === 'upload' || currentScreen === 'results' || currentScreen === 'dashboard')) {
        setCurrentScreen('welcome');
      }
    }
  }, [user, loading, scansLoading, currentScreen]);

  const handleStartScan = () => {
    if (user) {
      setCurrentScreen('scanner');
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleStartUpload = () => {
    if (user) {
      setCurrentScreen('upload');
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleScanComplete = (data: any) => {
    setScanData(data);
    setCurrentScreen('results');
  };
  
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
      return <WelcomeScreen onStartScan={handleStartScan} onGoToDashboard={handleGoToDashboard} />;
    case 'scanner':
      return user ? <PalmScanner onScanComplete={handleScanComplete} onGoBack={handleGoToDashboard} /> : <WelcomeScreen onStartScan={handleStartScan} onGoToDashboard={handleGoToDashboard} />;
    case 'upload':
      return user ? <PalmUploadForm onScanComplete={handleScanComplete} onGoBack={handleGoToDashboard} /> : <WelcomeScreen onStartScan={handleStartScan} onGoToDashboard={handleGoToDashboard} />;
    case 'results':
      return user ? <ResultsScreen onGoToDashboard={handleGoToDashboard} scanData={scanData} /> : <WelcomeScreen onStartScan={handleStartScan} onGoToDashboard={handleGoToDashboard} />;
    case 'dashboard':
      return user ? <Dashboard onStartScan={handleStartScan} onStartUpload={handleStartUpload} /> : <WelcomeScreen onStartScan={handleStartScan} onGoToDashboard={handleGoToDashboard} />;
    default:
      return <WelcomeScreen onStartScan={handleStartScan} onGoToDashboard={handleGoToDashboard} />;
  }
};

export default Index;
