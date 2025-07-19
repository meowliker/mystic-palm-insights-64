import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScans } from '@/hooks/useScans';
import { Sparkles, Heart, Brain, TrendingUp, Star, ArrowRight, Calendar, Zap } from 'lucide-react';

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
      <div className="bg-cosmic p-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Your Cosmic Palm Reading</h1>
          <p className="text-xl text-muted-foreground">
            The ancient wisdom of your palms has been revealed
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overall Insight */}
          <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Your Cosmic Overview</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {palmResults.overall_insight}
              </p>
              <div className="flex justify-center gap-2">
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-secondary fill-current" />
                <Star className="h-5 w-5 text-muted" />
              </div>
            </div>
          </Card>

          {/* Palm Line Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Life Line */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Life Line</h3>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {palmResults.life_line_strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Represents vitality, health, and general life journey. Your life line indicates {palmResults.life_line_strength?.toLowerCase()} life force.
                  </p>
                </div>
              </div>
            </Card>

            {/* Heart Line */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Heart Line</h3>
                    <Badge variant="secondary" className="bg-accent/20 text-accent">
                      {palmResults.heart_line_strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Relates to emotions, relationships, and love life. Your heart line shows {palmResults.heart_line_strength?.toLowerCase()} emotional capacity.
                  </p>
                </div>
              </div>
            </Card>

            {/* Head Line */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Brain className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Head Line</h3>
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                      {palmResults.head_line_strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Represents intellect, reasoning, and thought processes. Your head line suggests {palmResults.head_line_strength?.toLowerCase()} mental clarity.
                  </p>
                </div>
              </div>
            </Card>

            {/* Fate Line */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Fate Line</h3>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {palmResults.fate_line_strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Indicates destiny, life's path, and external influences. Your fate line shows {palmResults.fate_line_strength?.toLowerCase()} destiny connection.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="p-8 bg-card/80 backdrop-blur-sm text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">What's Next?</h3>
            <p className="text-muted-foreground mb-6">
              Your reading has been saved to your cosmic profile. Continue your journey with daily horoscopes and more insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="glow" size="lg" onClick={onGoToDashboard}>
                <Calendar className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                <Sparkles className="h-5 w-5" />
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