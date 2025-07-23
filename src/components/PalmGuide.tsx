import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Hand, 
  Sun, 
  Focus, 
  Eye,
  Heart,
  Brain,
  Zap,
  Star,
  ChevronRight
} from 'lucide-react';

interface PalmGuideProps {
  onClose?: () => void;
}

export const PalmGuide: React.FC<PalmGuideProps> = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  const photographyTips = [
    {
      icon: Sun,
      title: "Good Lighting",
      description: "Use natural daylight or bright indoor lighting. Avoid harsh shadows.",
      tip: "Stand near a window or use overhead lighting"
    },
    {
      icon: Hand,
      title: "Flat Palm Position",
      description: "Keep your palm completely flat with fingers slightly spread apart.",
      tip: "Rest your hand on a table for stability"
    },
    {
      icon: Eye,
      title: "Direct Angle",
      description: "Take the photo from directly above your palm, perpendicular to the surface.",
      tip: "Your camera should be 12-18 inches above your palm"
    },
    {
      icon: Focus,
      title: "Clear Focus",
      description: "Ensure all palm lines are sharp and clearly visible in the image.",
      tip: "Tap on your palm in the camera app to focus"
    }
  ];

  const palmLines = [
    {
      name: "Heart Line",
      icon: Heart,
      description: "Runs horizontally across the upper palm, reveals emotional life and relationships",
      color: "text-red-500",
      position: "Upper palm, below fingers"
    },
    {
      name: "Head Line",
      icon: Brain,
      description: "Horizontal line across the middle palm, shows intelligence and decision-making",
      color: "text-blue-500",
      position: "Middle palm, parallel to heart line"
    },
    {
      name: "Life Line",
      icon: Zap,
      description: "Curves around the thumb, indicates vitality and life path",
      color: "text-green-500",
      position: "Curves from index finger to wrist"
    },
    {
      name: "Fate Line",
      icon: Star,
      description: "Vertical line running up the palm, reveals destiny and career path",
      color: "text-purple-500",
      position: "Center of palm, running vertically"
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          Palm Reading Guide
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="photo-tips" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo-tips">Photo Tips</TabsTrigger>
            <TabsTrigger value="palm-lines">Palm Lines</TabsTrigger>
            <TabsTrigger value="positioning">Hand Position</TabsTrigger>
          </TabsList>
          
          <TabsContent value="photo-tips" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Perfect Palm Photography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photographyTips.map((tip, index) => (
                <Card key={index} className="p-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <tip.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {tip.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        💡 {tip.tip}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="palm-lines" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Major Palm Lines to Capture</h3>
            <div className="space-y-3">
              {palmLines.map((line, index) => (
                <Card key={index} className="p-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <line.icon className={`h-5 w-5 ${line.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{line.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {line.position}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {line.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="positioning" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Ideal Hand Positioning</h3>
            
            <div className="space-y-6">
              {/* Visual positioning guide */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-48 h-64 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <Hand className="h-24 w-24 text-primary/50" />
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="text-xs">Fingers spread slightly</Badge>
                    </div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="text-xs">Palm flat on surface</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="font-medium text-green-600 mb-1">✓ DO</div>
                      <p>Keep palm completely flat</p>
                    </div>
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="font-medium text-green-600 mb-1">✓ DO</div>
                      <p>Use your dominant hand</p>
                    </div>
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="font-medium text-green-600 mb-1">✓ DO</div>
                      <p>Ensure all lines are visible</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-600 mb-1">✗ AVOID</div>
                      <p>Curved or cupped palm</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-600 mb-1">✗ AVOID</div>
                      <p>Shadows covering lines</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-600 mb-1">✗ AVOID</div>
                      <p>Blurry or angled photos</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              <div className="bg-cosmic-purple/10 rounded-lg p-4 border border-cosmic-purple/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-cosmic-purple" />
                  Pro Tips for Best Results
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Clean your hands before photography</li>
                  <li>• Remove rings and jewelry that might obstruct lines</li>
                  <li>• Take multiple photos and choose the clearest one</li>
                  <li>• Ensure your camera lens is clean</li>
                  <li>• Use portrait mode if available for better focus</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {onClose && (
          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button onClick={onClose} className="gap-2">
              Ready to Upload <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};