import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stars, User, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HoroscopeFormProps {
  onHoroscopeGenerated: (horoscope: any) => void;
}

const zodiacSigns = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const HoroscopeForm = ({ onHoroscopeGenerated }: HoroscopeFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'direct' | 'calculate'>('direct');
  
  // Direct method
  const [selectedSign, setSelectedSign] = useState('');
  
  // Calculate method
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  const handleGenerateHoroscope = async () => {
    if (method === 'direct' && !selectedSign) {
      toast({
        title: "Please select your zodiac sign",
        variant: "destructive"
      });
      return;
    }

    if (method === 'calculate' && (!birthDate || !birthTime || !birthPlace)) {
      toast({
        title: "Please fill in all required fields",
        description: "Birth date, time, and place are all required for moon sign calculation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-horoscope', {
        body: {
          zodiacSign: method === 'direct' ? selectedSign.toLowerCase() : null,
          birthDate: method === 'calculate' ? birthDate : null,
          birthTime: method === 'calculate' ? birthTime : null,
          birthPlace: method === 'calculate' ? birthPlace : null,
          method,
          signType: method === 'calculate' ? 'moon' : 'sun', // Flag for moon sign calculation
          requestType: 'detailed_daily_horoscope' // Flag for detailed daily horoscope
        }
      });

      if (error) throw error;

      onHoroscopeGenerated(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate horoscope",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Stars className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Today's Horoscope</h3>
            <Stars className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Discover what the cosmos has in store for you today
          </p>
        </div>

        <Tabs value={method} onValueChange={(value) => setMethod(value as 'direct' | 'calculate')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Sign
            </TabsTrigger>
            <TabsTrigger value="calculate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Know Your Sign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zodiac-select" className="flex items-center gap-2">
                <Stars className="h-4 w-4" />
                Select Your Zodiac Sign
              </Label>
              <Select value={selectedSign} onValueChange={setSelectedSign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your zodiac sign" />
                </SelectTrigger>
                <SelectContent>
                  {zodiacSigns.map((sign) => (
                    <SelectItem key={sign} value={sign}>
                      {sign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="calculate" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birth-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Birth Date *
                </Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Birth Time *
                </Label>
                <Input
                  id="birth-time"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  placeholder="HH:MM"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth-place" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Birth Place *
                </Label>
                <Input
                  id="birth-place"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="City, State, Country"
                  required
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleGenerateHoroscope}
          disabled={loading}
          className="w-full"
          variant="glow"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Consulting the Stars...
            </>
          ) : (
            <>
              <Stars className="h-4 w-4 mr-2" />
              Get My Horoscope
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default HoroscopeForm;