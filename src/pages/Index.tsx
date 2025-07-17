import { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import PalmScanner from '@/components/PalmScanner';
import ResultsScreen from '@/components/ResultsScreen';
import Dashboard from '@/components/Dashboard';

type AppState = 'welcome' | 'scanner' | 'results' | 'dashboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');

  const handleStartScan = () => setCurrentScreen('scanner');
  const handleScanComplete = () => setCurrentScreen('results');
  const handleGoToDashboard = () => setCurrentScreen('dashboard');

  switch (currentScreen) {
    case 'welcome':
      return <WelcomeScreen onStartScan={handleStartScan} />;
    case 'scanner':
      return <PalmScanner onScanComplete={handleScanComplete} />;
    case 'results':
      return <ResultsScreen onGoToDashboard={handleGoToDashboard} />;
    case 'dashboard':
      return <Dashboard onStartScan={handleStartScan} />;
    default:
      return <WelcomeScreen />;
  }
};

export default Index;
