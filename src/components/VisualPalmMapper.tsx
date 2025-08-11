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
import { Eye, Hand, Palette } from 'lucide-react';

const VisualPalmMapper = () => {
  const [activeOverlay, setActiveOverlay] = useState<'lines' | 'mounts' | 'age' | null>('lines');

  const overlayColors = {
    life: '#ef4444', // red
    heart: '#ec4899', // pink  
    head: '#3b82f6', // blue
    fate: '#8b5cf6', // purple
    marriage: '#10b981', // green
    travel: '#f59e0b' // amber
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Visual Palm Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Visual Palm Line Mapping
          </DialogTitle>
          <DialogDescription>
            Interactive visual guide showing where to find different palm lines and their age markers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overlay Toggle Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeOverlay === 'lines' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveOverlay(activeOverlay === 'lines' ? null : 'lines')}
            >
              Major Lines
            </Button>
            <Button
              variant={activeOverlay === 'mounts' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveOverlay(activeOverlay === 'mounts' ? null : 'mounts')}
            >
              Palm Mounts
            </Button>
            <Button
              variant={activeOverlay === 'age' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveOverlay(activeOverlay === 'age' ? null : 'age')}
            >
              Age Timeline
            </Button>
          </div>

          {/* Palm Visualization */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Hand */}
            <Card className="p-4 relative">
              <h3 className="font-semibold mb-4 text-center">Left Palm (Passive Hand)</h3>
              <div className="relative mx-auto" style={{ width: '280px', height: '380px' }}>
                {/* Base palm image - simplified SVG representation */}
                <svg
                  viewBox="0 0 280 380"
                  className="w-full h-full border-2 border-muted rounded-lg bg-muted/20"
                  style={{ backgroundColor: '#fef7f0' }}
                >
                  {/* Palm outline */}
                  <path
                    d="M 70 50 Q 60 30 80 20 Q 120 10 160 20 Q 200 30 220 50 L 260 120 Q 270 160 260 200 L 250 240 Q 240 280 220 320 Q 180 370 140 370 Q 100 370 60 320 Q 40 280 30 240 L 20 200 Q 10 160 20 120 Z"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="2"
                  />
                  
                  {/* Finger guidelines */}
                  <line x1="80" y1="20" x2="80" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="120" y1="10" x2="120" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="160" y1="10" x2="160" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="200" y1="20" x2="200" y2="80" stroke="#e5e7eb" strokeWidth="1" />

                  {/* Major lines overlay */}
                  {activeOverlay === 'lines' && (
                    <g>
                      {/* Life Line */}
                      <path
                        d="M 70 80 Q 45 140 35 200 Q 30 260 40 320"
                        fill="none"
                        stroke={overlayColors.life}
                        strokeWidth="3"
                        opacity="0.8"
                      />
                      
                      {/* Heart Line */}
                      <path
                        d="M 30 120 Q 80 100 140 105 Q 200 110 250 120"
                        fill="none"
                        stroke={overlayColors.heart}
                        strokeWidth="3"
                        opacity="0.8"
                      />
                      
                      {/* Head Line */}
                      <path
                        d="M 70 80 Q 120 140 180 160 Q 220 170 240 180"
                        fill="none"
                        stroke={overlayColors.head}
                        strokeWidth="3"
                        opacity="0.8"
                      />
                      
                      {/* Fate Line */}
                      <path
                        d="M 140 360 L 140 280 Q 138 220 135 160 Q 132 100 130 80"
                        fill="none"
                        stroke={overlayColors.fate}
                        strokeWidth="3"
                        opacity="0.8"
                      />
                    </g>
                  )}

                  {/* Age markers overlay */}
                  {activeOverlay === 'age' && (
                    <g>
                      {/* Life line age markers */}
                      <circle cx="70" cy="80" r="3" fill="#ef4444" />
                      <text x="75" y="85" fontSize="10" fill="#374151">0</text>
                      
                      <circle cx="60" cy="120" r="3" fill="#ef4444" />
                      <text x="65" y="125" fontSize="10" fill="#374151">10</text>
                      
                      <circle cx="50" cy="160" r="3" fill="#ef4444" />
                      <text x="55" y="165" fontSize="10" fill="#374151">20</text>
                      
                      <circle cx="42" cy="200" r="3" fill="#ef4444" />
                      <text x="47" y="205" fontSize="10" fill="#374151">35</text>
                      
                      <circle cx="35" cy="240" r="3" fill="#ef4444" />
                      <text x="40" y="245" fontSize="10" fill="#374151">50</text>
                      
                      <circle cx="38" cy="280" r="3" fill="#ef4444" />
                      <text x="43" y="285" fontSize="10" fill="#374151">65</text>
                      
                      <circle cx="42" cy="320" r="3" fill="#ef4444" />
                      <text x="47" y="325" fontSize="10" fill="#374151">80+</text>
                    </g>
                  )}

                  {/* Mounts overlay */}
                  {activeOverlay === 'mounts' && (
                    <g>
                      {/* Mount of Venus */}
                      <circle cx="65" cy="180" r="25" fill="#fca5a5" opacity="0.5" />
                      <text x="55" y="185" fontSize="9" fill="#374151">Venus</text>
                      
                      {/* Mount of Jupiter */}
                      <circle cx="80" cy="90" r="15" fill="#93c5fd" opacity="0.5" />
                      <text x="70" y="95" fontSize="9" fill="#374151">Jupiter</text>
                      
                      {/* Mount of Saturn */}
                      <circle cx="120" cy="85" r="15" fill="#a78bfa" opacity="0.5" />
                      <text x="105" y="90" fontSize="9" fill="#374151">Saturn</text>
                      
                      {/* Mount of Apollo */}
                      <circle cx="160" cy="85" r="15" fill="#fbbf24" opacity="0.5" />
                      <text x="145" y="90" fontSize="9" fill="#374151">Apollo</text>
                      
                      {/* Mount of Mercury */}
                      <circle cx="200" cy="90" r="15" fill="#34d399" opacity="0.5" />
                      <text x="185" y="95" fontSize="9" fill="#374151">Mercury</text>
                    </g>
                  )}
                </svg>
              </div>
            </Card>

            {/* Right Hand */}
            <Card className="p-4 relative">
              <h3 className="font-semibold mb-4 text-center">Right Palm (Active Hand)</h3>
              <div className="relative mx-auto" style={{ width: '280px', height: '380px' }}>
                {/* Mirrored palm for right hand */}
                <svg
                  viewBox="0 0 280 380"
                  className="w-full h-full border-2 border-muted rounded-lg bg-muted/20"
                  style={{ backgroundColor: '#fef7f0', transform: 'scaleX(-1)' }}
                >
                  {/* Same paths as left hand but mirrored */}
                  <path
                    d="M 70 50 Q 60 30 80 20 Q 120 10 160 20 Q 200 30 220 50 L 260 120 Q 270 160 260 200 L 250 240 Q 240 280 220 320 Q 180 370 140 370 Q 100 370 60 320 Q 40 280 30 240 L 20 200 Q 10 160 20 120 Z"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="2"
                  />
                  
                  {/* Apply same overlays as left hand */}
                  {activeOverlay === 'lines' && (
                    <g>
                      <path d="M 70 80 Q 45 140 35 200 Q 30 260 40 320" fill="none" stroke={overlayColors.life} strokeWidth="3" opacity="0.8" />
                      <path d="M 30 120 Q 80 100 140 105 Q 200 110 250 120" fill="none" stroke={overlayColors.heart} strokeWidth="3" opacity="0.8" />
                      <path d="M 70 80 Q 120 140 180 160 Q 220 170 240 180" fill="none" stroke={overlayColors.head} strokeWidth="3" opacity="0.8" />
                      <path d="M 140 360 L 140 280 Q 138 220 135 160 Q 132 100 130 80" fill="none" stroke={overlayColors.fate} strokeWidth="3" opacity="0.8" />
                    </g>
                  )}
                  
                  {activeOverlay === 'age' && (
                    <g>
                      <circle cx="70" cy="80" r="3" fill="#ef4444" />
                      <circle cx="60" cy="120" r="3" fill="#ef4444" />
                      <circle cx="50" cy="160" r="3" fill="#ef4444" />
                      <circle cx="42" cy="200" r="3" fill="#ef4444" />
                      <circle cx="35" cy="240" r="3" fill="#ef4444" />
                      <circle cx="38" cy="280" r="3" fill="#ef4444" />
                      <circle cx="42" cy="320" r="3" fill="#ef4444" />
                    </g>
                  )}
                  
                  {activeOverlay === 'mounts' && (
                    <g>
                      <circle cx="65" cy="180" r="25" fill="#fca5a5" opacity="0.5" />
                      <circle cx="80" cy="90" r="15" fill="#93c5fd" opacity="0.5" />
                      <circle cx="120" cy="85" r="15" fill="#a78bfa" opacity="0.5" />
                      <circle cx="160" cy="85" r="15" fill="#fbbf24" opacity="0.5" />
                      <circle cx="200" cy="90" r="15" fill="#34d399" opacity="0.5" />
                    </g>
                  )}
                </svg>
              </div>
            </Card>
          </div>

          {/* Legend */}
          {activeOverlay === 'lines' && (
            <Card className="p-4 bg-muted/20">
              <h4 className="font-medium mb-3">Line Colors Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: overlayColors.life }}></div>
                  <span className="text-sm">Life Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: overlayColors.heart }}></div>
                  <span className="text-sm">Heart Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: overlayColors.head }}></div>
                  <span className="text-sm">Head Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: overlayColors.fate }}></div>
                  <span className="text-sm">Fate Line</span>
                </div>
              </div>
            </Card>
          )}

          {activeOverlay === 'age' && (
            <Card className="p-4 bg-primary/5">
              <h4 className="font-medium mb-2">Age Prediction Guide</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Age markers on the life line help predict timing of major life events. Start from the beginning of the line (between thumb and index finger) as age 0.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>• Early life events: Near the start of the life line</p>
                <p>• Mid-life events: Around the middle curve of the life line</p>
                <p>• Later life: Toward the end of the life line near the wrist</p>
              </div>
            </Card>
          )}

          {activeOverlay === 'mounts' && (
            <Card className="p-4 bg-secondary/5">
              <h4 className="font-medium mb-2">Palm Mounts Significance</h4>
              <p className="text-sm text-muted-foreground mb-3">
                The prominence and firmness of these mounts reveal personality traits and potential talents.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <p>• Well-developed mounts show strong characteristics</p>
                <p>• Flat mounts indicate lesser influence</p>
                <p>• Compare both hands for complete picture</p>
                <p>• Mounts can change with life experiences</p>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualPalmMapper;