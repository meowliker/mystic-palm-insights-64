import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Info, Hand, Map } from 'lucide-react';

const palmLines = [
  {
    id: 'life',
    name: 'Life Line',
    color: 'text-primary',
    description: 'Represents vitality, health, and general life journey. Usually curves around the thumb.',
    position: 'Starts between thumb and index finger, curves around the thumb mount.',
    meaning: 'Length indicates life span, depth shows vitality, breaks may indicate health challenges.',
    ageMarkers: 'Ages 0-100 can be mapped along this line from start to end.'
  },
  {
    id: 'heart',
    name: 'Heart Line',
    color: 'text-destructive',
    description: 'Relates to emotions, relationships, and love life. Runs horizontally at the top of the palm.',
    position: 'Starts from the edge of the palm under the pinky, runs toward the index finger.',
    meaning: 'Depth shows emotional intensity, length indicates capacity for love, branches show relationships.',
    ageMarkers: 'Relationship timing can be read from right to left along this line.'
  },
  {
    id: 'head',
    name: 'Head Line',
    color: 'text-secondary',
    description: 'Represents intellect, reasoning, and thought processes. Runs horizontally below the heart line.',
    position: 'Starts near the life line between thumb and index finger, crosses the palm horizontally.',
    meaning: 'Straight line indicates logical thinking, curved shows creativity, forks show versatility.',
    ageMarkers: 'Mental development phases can be tracked along this line.'
  },
  {
    id: 'fate',
    name: 'Fate Line',
    color: 'text-accent',
    description: 'Indicates destiny, career path, and external influences. Runs vertically up the palm.',
    position: 'Starts from the wrist and travels up toward the middle finger (not always present).',
    meaning: 'Deep line shows strong destiny, absent line indicates freedom of choice, breaks show career changes.',
    ageMarkers: 'Career milestones and life changes mapped from bottom (young) to top (older).'
  }
];

const palmMounts = [
  {
    id: 'venus',
    name: 'Mount of Venus',
    position: 'Base of thumb, inside the life line',
    meaning: 'Love, passion, physical vitality, and family relationships.'
  },
  {
    id: 'jupiter',
    name: 'Mount of Jupiter',
    position: 'Under the index finger',
    meaning: 'Leadership, ambition, authority, and self-confidence.'
  },
  {
    id: 'saturn',
    name: 'Mount of Saturn',
    position: 'Under the middle finger',
    meaning: 'Wisdom, responsibility, discipline, and life challenges.'
  },
  {
    id: 'apollo',
    name: 'Mount of Apollo',
    position: 'Under the ring finger',
    meaning: 'Creativity, artistic talents, fame, and success.'
  },
  {
    id: 'mercury',
    name: 'Mount of Mercury',
    position: 'Under the pinky finger',
    meaning: 'Communication, business skills, and adaptability.'
  }
];

const InteractivePalmGuide = () => {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [showMounts, setShowMounts] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Map className="h-4 w-4 mr-2" />
          Palm Reading Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            Interactive Palm Reading Guide
          </DialogTitle>
          <DialogDescription>
            Learn about palm lines, mounts, and how to read age predictions from your palms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toggle Buttons */}
          <div className="flex gap-2">
            <Button
              variant={!showMounts ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMounts(false)}
            >
              Major Lines
            </Button>
            <Button
              variant={showMounts ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMounts(true)}
            >
              Palm Mounts
            </Button>
          </div>

          {!showMounts ? (
            <>
              {/* Palm Lines Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold">Major Palm Lines</h3>
                  {palmLines.map((line) => (
                    <Card 
                      key={line.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedLine === line.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedLine(selectedLine === line.id ? null : line.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-current ${line.color}`} />
                          <span className="font-medium">{line.name}</span>
                        </div>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {line.description}
                      </p>
                    </Card>
                  ))}
                </div>

                <div className="space-y-3">
                  {selectedLine ? (
                    <div className="space-y-4">
                      {palmLines
                        .filter(line => line.id === selectedLine)
                        .map((line) => (
                          <Card key={line.id} className="p-4 bg-primary/5 border-primary/20">
                            <h4 className="font-semibold text-lg mb-3">{line.name} Details</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <Badge variant="outline" className="mb-2">Position</Badge>
                                <p className="text-sm text-muted-foreground">{line.position}</p>
                              </div>
                              
                              <div>
                                <Badge variant="outline" className="mb-2">Meaning</Badge>
                                <p className="text-sm text-muted-foreground">{line.meaning}</p>
                              </div>
                              
                              <div>
                                <Badge variant="outline" className="mb-2">Age Predictions</Badge>
                                <p className="text-sm text-muted-foreground">{line.ageMarkers}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      
                      <Card className="p-4 bg-secondary/5 border-secondary/20">
                        <h5 className="font-medium mb-2">Reading Tips</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Line depth indicates strength of influence</li>
                          <li>• Breaks may show significant life changes</li>
                          <li>• Forks often represent choices or talents</li>
                          <li>• Islands (oval shapes) may indicate challenges</li>
                          <li>• Age timing is approximate, not exact</li>
                        </ul>
                      </Card>
                    </div>
                  ) : (
                    <Card className="p-6 text-center bg-muted/20">
                      <Hand className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <h4 className="font-medium mb-2">Select a Line</h4>
                      <p className="text-sm text-muted-foreground">
                        Click on any major line to learn about its position, meaning, and how to read age predictions.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Palm Mounts Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Palm Mounts & Their Meanings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Palm mounts are the raised, fleshy areas of your palm. Their size and firmness indicate different personality traits and potentials.
                </p>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {palmMounts.map((mount) => (
                    <Card key={mount.id} className="p-4">
                      <h4 className="font-medium mb-2">{mount.name}</h4>
                      <div className="space-y-2">
                        <div>
                          <Badge variant="secondary" className="text-xs mb-1">Location</Badge>
                          <p className="text-xs text-muted-foreground">{mount.position}</p>
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs mb-1">Meaning</Badge>
                          <p className="text-xs text-muted-foreground">{mount.meaning}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-4 bg-accent/5 border-accent/20">
                  <h5 className="font-medium mb-2">Mount Analysis Tips</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Well-developed mounts indicate strong traits</li>
                    <li>• Flat mounts suggest less influence in that area</li>
    `              <li>• Overly prominent mounts may indicate excess</li>
                    <li>• Compare both hands for complete picture</li>
                    <li>• Mounts can change over time with life experiences</li>
                  </ul>
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InteractivePalmGuide;