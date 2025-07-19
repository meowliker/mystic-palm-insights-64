import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScans } from '@/hooks/useScans';
import { cleanupMarkdown } from '@/utils/cleanupMarkdown';
import { Sparkles, Star, ArrowRight, Calendar } from 'lucide-react';

interface ResultsScreenProps {
  onGoToDashboard: () => void;
  scanData?: any;
}

const ResultsScreen = ({ onGoToDashboard, scanData }: ResultsScreenProps) => {
  const { saveScan } = useScans();

  // Require scan data - no fallback
  if (!scanData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No palm reading data available.</p>
          <Button onClick={onGoToDashboard}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const palmResults = scanData;

  useEffect(() => {
    // Save the scan results to the database ONLY ONCE
    const saveResults = async () => {
      if (palmResults) {
        console.log('Saving palm reading to database...');
        await saveScan(palmResults);
      }
    };
    
    saveResults();
  }, []); // Empty dependency array to run only once

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-cosmic p-4 sm:p-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse-glow" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">Your Cosmic Palm Reading</h1>
          <p className="text-lg sm:text-xl text-muted-foreground px-4">
            The ancient wisdom of your palms has been revealed
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Overall Insight */}
          <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Your Cosmic Overview</h2>
              <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line text-left max-w-4xl">
                {cleanupMarkdown(palmResults.overall_insight)}
              </div>
              <div className="flex justify-center gap-2">
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-muted" />
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm text-center">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">What's Next?</h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base px-2">
              Your reading has been saved to your cosmic profile. Continue your journey with daily horoscopes and more insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="glow" size="lg" onClick={onGoToDashboard} className="w-full sm:w-auto">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Go to Dashboard
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                Share Reading
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;