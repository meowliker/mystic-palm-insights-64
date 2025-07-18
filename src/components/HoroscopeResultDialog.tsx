import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stars, Zap, Target, Palette, Lightbulb, Info } from 'lucide-react';

interface HoroscopeResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horoscope: any;
}

export const HoroscopeResultDialog = ({ open, onOpenChange, horoscope }: HoroscopeResultDialogProps) => {
  if (!horoscope) return null;

  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">
          Your personalized daily horoscope reading with cosmic insights and guidance.
        </DialogDescription>
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Stars className="h-6 w-6 text-primary" />
            {horoscope.sign} Horoscope
            <Stars className="h-6 w-6 text-primary" />
          </DialogTitle>
          <p className="text-muted-foreground">{todayDate}</p>
          {horoscope.calculatedSign && (
            <Badge variant="secondary" className="mx-auto">
              Calculated from birth details
            </Badge>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Sign Information */}
          {horoscope.signInfo && (
            <Card className="p-4 bg-primary/10 border-none">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground">Your Sign</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Dates:</span>
                  <p className="font-medium">{horoscope.signInfo.dates}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Element:</span>
                  <p className="font-medium">{horoscope.signInfo.element}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Planet:</span>
                  <p className="font-medium">{horoscope.signInfo.planet}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Daily Prediction */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-none">
            <div className="flex items-center gap-2 mb-4">
              <Stars className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Today's Cosmic Message</h4>
            </div>
            <p className="text-foreground leading-relaxed text-lg">
              {horoscope.prediction}
            </p>
          </Card>

          {/* Energy and Focus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 text-center bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Energy Level</h4>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {horoscope.energy}%
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${horoscope.energy}%` }}
                ></div>
              </div>
            </Card>

            <Card className="p-4 text-center bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold">Focus Areas</h4>
              </div>
              <div className="space-y-2">
                {horoscope.focus.split(',').map((area: string, index: number) => (
                  <Badge key={index} variant="outline" className="mx-1">
                    {area.trim()}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Lucky Color and Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-5 w-5 text-accent" />
                <h4 className="font-semibold">Lucky Color</h4>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: horoscope.luckyColor.toLowerCase() }}
                ></div>
                <span className="font-medium text-foreground">
                  {horoscope.luckyColor}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold">Cosmic Advice</h4>
              </div>
              <p className="text-foreground italic">
                "{horoscope.advice}"
              </p>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};