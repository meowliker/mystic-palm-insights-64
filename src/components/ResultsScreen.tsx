import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScans } from '@/hooks/useScans';
import { Sparkles, Heart, Brain, TrendingUp, Star, ArrowRight, Calendar } from 'lucide-react';

interface ResultsScreenProps {
  onGoToDashboard: () => void;
  scanData?: any;
}

const ResultsScreen = ({ onGoToDashboard, scanData }: ResultsScreenProps) => {
  const { saveScan } = useScans();

  // Use the passed scan data or fallback to default results
  const palmResults = scanData || {
    life_line_strength: "Strong",
    heart_line_strength: "Deep", 
    head_line_strength: "Clear",
    fate_line_strength: "Prominent",
    overall_insight: "Your palm reveals a harmonious balance of emotional depth and intellectual clarity. The planets and cosmic energy are perfectly aligned, indicating a period of growth and self-discovery ahead.",
    traits: {
      emotional_capacity: "High",
      intellectual_approach: "Analytical", 
      life_energy: "Vibrant",
      destiny_path: "Self-directed"
    }
  };

  useEffect(() => {
    // Save the scan results to the database
    const saveResults = async () => {
      if (palmResults) {
        await saveScan(palmResults);
      }
    };
    
    saveResults();
  }, [saveScan, palmResults]);

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
                {overallInsight}
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
                      {palmResults.lifeLine.strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {palmResults.lifeLine.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {palmResults.lifeLine.traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
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
                      {palmResults.heartLine.strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {palmResults.heartLine.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {palmResults.heartLine.traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
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
                      {palmResults.headLine.strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {palmResults.headLine.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {palmResults.headLine.traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Fate Line */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-mystical transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-glow/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary-glow" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Fate Line</h3>
                    <Badge variant="secondary" className="bg-primary-glow/20 text-primary-glow">
                      {palmResults.fateLine.strength}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {palmResults.fateLine.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {palmResults.fateLine.traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
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