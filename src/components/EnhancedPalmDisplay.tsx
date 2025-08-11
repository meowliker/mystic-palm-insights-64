import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  TrendingUp, 
  Crown, 
  Heart, 
  MapPin, 
  Clock,
  DollarSign,
  Target,
  Users,
  Sparkles
} from 'lucide-react';

interface EnhancedPalmDisplayProps {
  palmData: any;
}

const EnhancedPalmDisplay = ({ palmData }: EnhancedPalmDisplayProps) => {
  if (!palmData) return null;

  // Check if this reading has enhanced data
  const hasEnhancedData = palmData.age_predictions || 
                         palmData.wealth_analysis || 
                         palmData.mount_analysis || 
                         palmData.line_intersections || 
                         palmData.age_timeline || 
                         palmData.partnership_predictions;

  // Check for basic palm reading data
  const hasBasicData = palmData.life_line || palmData.heart_line || palmData.head_line || palmData.fate_line;

  // If no data at all, show message
  if (!hasEnhancedData && !hasBasicData) {
    return (
      <Card className="p-6 bg-muted/20 border-primary/20">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 mx-auto text-primary/60" />
          <h3 className="text-lg font-semibold">No Analysis Data Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            This reading doesn't contain detailed analysis data. 
            Take a new palm reading to get comprehensive insights!
          </p>
        </div>
      </Card>
    );
  }

  const getPotentialColor = (potential: string) => {
    const level = potential?.toLowerCase() || '';
    if (level.includes('high')) return 'text-success';
    if (level.includes('medium')) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="age-predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="age-predictions" className="text-xs">Age Timeline</TabsTrigger>
          <TabsTrigger value="wealth" className="text-xs">Wealth</TabsTrigger>
          <TabsTrigger value="mounts" className="text-xs">Mounts</TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs">Love</TabsTrigger>
        </TabsList>

        <TabsContent value="age-predictions" className="mt-6">
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Life Timeline Predictions</h3>
            </div>
            
            {palmData.age_predictions ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">0-25 Years</Badge>
                    <span className="text-sm font-medium">Early Life</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {palmData.age_predictions.early_life}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-secondary/10">25-45 Years</Badge>
                    <span className="text-sm font-medium">Prime Years</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {palmData.age_predictions.prime_years}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-accent/10">45-65 Years</Badge>
                    <span className="text-sm font-medium">Maturity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {palmData.age_predictions.maturity}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-muted/50">65+ Years</Badge>
                    <span className="text-sm font-medium">Later Life</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {palmData.age_predictions.later_life}
                  </p>
                </div>
              </div>
            ) : hasBasicData && (
              <div className="space-y-4">
                {palmData.life_line && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Life Line Analysis</h4>
                    <p className="text-sm text-muted-foreground">{palmData.life_line}</p>
                  </div>
                )}
                {palmData.heart_line && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Heart Line Analysis</h4>
                    <p className="text-sm text-muted-foreground">{palmData.heart_line}</p>
                  </div>
                )}
                {palmData.head_line && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Head Line Analysis</h4>
                    <p className="text-sm text-muted-foreground">{palmData.head_line}</p>
                  </div>
                )}
                {palmData.fate_line && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Fate Line Analysis</h4>
                    <p className="text-sm text-muted-foreground">{palmData.fate_line}</p>
                  </div>
                )}
              </div>
            )}

            {palmData.age_timeline && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Key Life Milestones
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(palmData.age_timeline).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2">
                        <Target className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <span className="font-medium text-sm capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{value as string}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="wealth" className="mt-6">
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-success" />
              <h3 className="text-xl font-bold">Wealth & Financial Analysis</h3>
            </div>
            
            {palmData.wealth_analysis && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="font-medium">Financial Potential</span>
                    </div>
                    <p className={`text-sm font-semibold ${getPotentialColor(palmData.wealth_analysis.financial_potential)}`}>
                      {palmData.wealth_analysis.financial_potential}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-medium">Business Aptitude</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {palmData.wealth_analysis.business_aptitude}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Wealth Timeline</h5>
                    <p className="text-sm text-muted-foreground">
                      {palmData.wealth_analysis.wealth_timeline}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Asset Accumulation</h5>
                    <p className="text-sm text-muted-foreground">
                      {palmData.wealth_analysis.asset_accumulation}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Money Management Style</h5>
                    <p className="text-sm text-muted-foreground">
                      {palmData.wealth_analysis.money_management}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="mounts" className="mt-6">
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-secondary" />
              <h3 className="text-xl font-bold">Palm Mounts Analysis</h3>
            </div>
            
            {palmData.mount_analysis && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(palmData.mount_analysis).map(([mount, description]) => (
                  <div key={mount} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm capitalize">
                        {mount.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {description as string}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {palmData.line_intersections && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Line Intersections & Special Markings
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(palmData.line_intersections).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <span className="font-medium text-sm capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <p className="text-xs text-muted-foreground">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="mt-6">
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-destructive" />
              <h3 className="text-xl font-bold">Love & Partnership Predictions</h3>
            </div>
            
            {palmData.partnership_predictions && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">Partner Characteristics</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {palmData.partnership_predictions.partner_characteristics}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-secondary" />
                      <span className="font-medium">Marriage Timing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {palmData.partnership_predictions.marriage_timing}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Partner's Financial Status</h5>
                    <p className="text-sm text-muted-foreground">
                      {palmData.partnership_predictions.partner_wealth}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Relationship Challenges</h5>
                    <p className="text-sm text-muted-foreground">
                      {palmData.partnership_predictions.relationship_challenges}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Family Predictions</h5>
                    <p className="text-sm text-muted-foreground">
                      {palmData.partnership_predictions.family_predictions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedPalmDisplay;