import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Stars, Zap, Target, Palette, Lightbulb, Info, Heart, Sparkles } from 'lucide-react';

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

  // Capitalize first letter of zodiac sign
  const capitalizedSign = horoscope.sign ? 
    horoscope.sign.charAt(0).toUpperCase() + horoscope.sign.slice(1).toLowerCase() : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background/95 to-muted/50 backdrop-blur-sm border border-border/50">
        <DialogDescription className="sr-only">
          Your personalized daily horoscope reading with cosmic insights and guidance.
        </DialogDescription>
        <DialogHeader className="text-center space-y-3 pb-6 border-b border-border/20">
          <DialogTitle className="flex items-center justify-center gap-2 text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            <Stars className="h-7 w-7 text-primary animate-pulse" />
            {capitalizedSign} Horoscope
            <Stars className="h-7 w-7 text-primary animate-pulse" />
          </DialogTitle>
          <p className="text-muted-foreground text-lg">{todayDate}</p>
          {horoscope.calculated && (
            <Badge variant="secondary" className="mx-auto bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Calculated from birth details
            </Badge>
          )}
        </DialogHeader>

        <div className="space-y-6 animate-fade-in">
          {/* Check if this is a detailed horoscope */}
          {horoscope.type === 'detailed_daily' && horoscope.detailed_reading ? (
            <>
              {/* Sign Information for detailed reading */}
              <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 shadow-lg hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Your Zodiac Sign
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Dates</p>
                      <p className="font-semibold text-foreground">{horoscope.dates}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Element</p>
                      <Badge variant="outline" className="font-semibold">{horoscope.element}</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Ruling Planet</p>
                      <p className="font-semibold text-foreground">{horoscope.planet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed AI-generated reading */}
              <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                    Today's Detailed Horoscope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-line text-foreground leading-relaxed space-y-4">
                      {horoscope.detailed_reading}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Sign Information */}
              {horoscope.signInfo && (
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 shadow-lg hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5 text-primary" />
                      Your Zodiac Sign
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Dates</p>
                        <p className="font-semibold text-foreground">{horoscope.signInfo.dates}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Element</p>
                        <Badge variant="outline" className="font-semibold">{horoscope.signInfo.element}</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Ruling Planet</p>
                        <p className="font-semibold text-foreground">{horoscope.signInfo.planet}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Prediction */}
              <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Stars className="h-6 w-6 text-blue-500" />
                    Today's Cosmic Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed text-lg">
                    {horoscope.prediction}
                  </p>
                </CardContent>
              </Card>

              {/* Energy and Focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 shadow-lg hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-green-500" />
                      Energy Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Today's Energy</span>
                        <span className="text-2xl font-bold text-green-500">{horoscope.energy}%</span>
                      </div>
                      <Progress value={horoscope.energy} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20 shadow-lg hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-purple-500" />
                      Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {horoscope.focus && horoscope.focus.split(',').map((area: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                          {area.trim()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lucky Color and Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20 shadow-lg hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette className="h-5 w-5 text-orange-500" />
                      Lucky Color
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                        style={{ backgroundColor: horoscope.luckyColor?.toLowerCase() }}
                      />
                      <span className="font-semibold text-lg text-foreground">
                        {horoscope.luckyColor}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border-yellow-500/20 shadow-lg hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="h-5 w-5 text-yellow-500" />
                      Cosmic Advice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground italic text-lg leading-relaxed">
                      "{horoscope.advice}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};