import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScans } from '@/hooks/useScans';
import { useAuth } from '@/hooks/useAuth';
import { useQuestionRotation } from '@/hooks/useQuestionRotation';
import { cleanupMarkdown } from '@/utils/cleanupMarkdown';
import { Sparkles, Star, ArrowRight, Calendar, MessageCircle, Zap } from 'lucide-react';
import EnhancedPalmDisplay from '@/components/EnhancedPalmDisplay';
import { useNavigate } from 'react-router-dom';

interface ResultsScreenProps {
  onGoToDashboard: () => void;
  scanData?: any;
}

const ResultsScreen = ({ onGoToDashboard, scanData }: ResultsScreenProps) => {
  const { saveScan } = useScans();
  const { user, loading } = useAuth();
  const { selectedQuestions, loading: questionsLoading } = useQuestionRotation();
  const navigate = useNavigate();
  const hasSaved = useRef(false); // Prevent duplicate saves

  // Always call useEffect - it's a hook and must be called in the same order every render
  useEffect(() => {
    // Save the scan results to the database ONLY ONCE using ref to prevent duplicates
    const saveResults = async () => {
      // Prevent duplicate saves
      if (hasSaved.current) {
        console.log('Scan already saved, skipping...');
        return;
      }

      // Wait for user to be properly authenticated
      if (!user || loading || !scanData) {
        console.log('Waiting for user authentication or scan data...');
        return;
      }

      console.log('=== SAVING PALM READING TO DATABASE (ONCE) ===');
      console.log('User authenticated:', user.id);
      console.log('Raw scanData received:', scanData);
      console.log('Enhanced data check in scanData:', {
        age_predictions: !!scanData.age_predictions,
        wealth_analysis: !!scanData.wealth_analysis,
        mount_analysis: !!scanData.mount_analysis,
        line_intersections: !!scanData.line_intersections,
        age_timeline: !!scanData.age_timeline,
        partnership_predictions: !!scanData.partnership_predictions
      });
      hasSaved.current = true; // Mark as saved to prevent duplicates
      
      // Format the data to match the database schema
      const scanDataToSave = {
        life_line_strength: scanData.life_line_strength || 'Unknown',
        heart_line_strength: scanData.heart_line_strength || 'Unknown', 
        head_line_strength: scanData.head_line_strength || 'Unknown',
        fate_line_strength: scanData.fate_line_strength || 'Unknown',
        overall_insight: scanData.overall_insight || '',
        traits: scanData.traits || {},
        palm_image_url: scanData.palm_image_url || null,
        right_palm_image_url: scanData.right_palm_image_url || null,
        // Enhanced palmistry fields - these are what make the detailed view work
        age_predictions: scanData.age_predictions || null,
        wealth_analysis: scanData.wealth_analysis || null,
        mount_analysis: scanData.mount_analysis || null,
        line_intersections: scanData.line_intersections || null,
        age_timeline: scanData.age_timeline || null,
        partnership_predictions: scanData.partnership_predictions || null
      };
      
      console.log('Formatted scan data for database:', scanDataToSave);
      console.log('Enhanced fields check:', {
        age_predictions: !!scanData.age_predictions,
        wealth_analysis: !!scanData.wealth_analysis,
        mount_analysis: !!scanData.mount_analysis,
        line_intersections: !!scanData.line_intersections,
        age_timeline: !!scanData.age_timeline,
        partnership_predictions: !!scanData.partnership_predictions
      });
      const result = await saveScan(scanDataToSave);
      console.log('Save result:', result);
      
      if (result) {
        console.log('✅ Palm reading saved successfully!');
      } else {
        console.error('❌ Failed to save palm reading');
        hasSaved.current = false; // Reset if failed, allow retry
      }
    };
    
    saveResults();
  }, [user, loading, scanData, saveScan]); // Include all dependencies

  // Show loading if auth is still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your reading...</p>
        </Card>
      </div>
    );
  }

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

  // Require user authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please log in to save your reading.</p>
          <Button onClick={onGoToDashboard}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const palmResults = scanData;

  const handleQuestionClick = (question: string) => {
    navigate('/chatbot', { 
      state: { 
        question, 
        palmImage: scanData.palm_image_url || scanData.right_palm_image_url,
        autoSend: true 
      } 
    });
  };

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
          {/* Overall Insight - This contains all the palm line details */}
          <Card className="p-4 sm:p-6 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Your Cosmic Palm Reading</h2>
              <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line text-center max-w-4xl mx-auto">
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

          {/* Enhanced Palm Analysis */}
          <EnhancedPalmDisplay palmData={palmResults} />

          {/* Palmistry Questions */}
          <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm overflow-hidden max-w-full">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Get to Know More</h3>
              <p className="text-muted-foreground mb-6">
                Dive Deeper with Elysia
              </p>
              <div className="grid gap-3 sm:gap-4">
                {selectedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="lg"
                    onClick={() => handleQuestionClick(question)}
                    className="w-full max-w-full text-left justify-start hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 group h-auto py-3 px-3 whitespace-normal overflow-hidden"
                  >
                    <MessageCircle className="h-3 w-3 mr-2 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="flex-1 min-w-0 text-xs leading-snug break-words">
                      {question}
                    </span>
                    <ArrowRight className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Button>
                ))}
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