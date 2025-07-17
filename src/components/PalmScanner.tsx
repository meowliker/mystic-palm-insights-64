import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Hand, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import palmOutline from '@/assets/palm-outline.png';

type ScanState = 'ready' | 'scanning' | 'complete' | 'error';

const PalmScanner = ({ onScanComplete }: { onScanComplete: () => void }) => {
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [currentHand, setCurrentHand] = useState<'left' | 'right'>('left');
  const [countdown, setCountdown] = useState(0);
  const [alignment, setAlignment] = useState<'good' | 'poor'>('poor');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize camera
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCameraError(null);
      } catch (error) {
        setCameraError('Camera access denied. Please enable camera permissions.');
        console.error('Camera error:', error);
      }
    };

    initializeCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScan = () => {
    if (cameraError) {
      return;
    }
    
    setScanState('scanning');
    setCountdown(5);
    setAlignment('poor');
    
    // Simulate alignment detection
    const alignmentInterval = setInterval(() => {
      setAlignment(Math.random() > 0.3 ? 'good' : 'poor');
    }, 500);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(alignmentInterval);
          
          if (currentHand === 'left') {
            // Move to right hand
            setCurrentHand('right');
            setScanState('ready');
            return 0;
          } else {
            // Both hands complete
            setScanState('complete');
            setTimeout(onScanComplete, 2000);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  const retryCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (error) {
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {scanState === 'ready' && 'Position Your Palm'}
            {scanState === 'scanning' && `Scanning ${currentHand} Palm`}
            {scanState === 'complete' && 'Scan Complete!'}
          </h1>
          <p className="text-muted-foreground">
            {scanState === 'ready' && 'Align your palm with the outline to begin scanning'}
            {scanState === 'scanning' && `Hold steady... ${countdown}s remaining`}
            {scanState === 'complete' && 'Analyzing your cosmic patterns...'}
          </p>
        </div>

        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
          {/* Camera View */}
          <div className="aspect-[4/3] relative flex items-center justify-center">
            {cameraError ? (
              <div className="flex flex-col items-center space-y-4 text-center p-8">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-semibold">{cameraError}</p>
                <Button onClick={retryCamera} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Camera
                </Button>
              </div>
            ) : (
              <>
                {/* Camera Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Palm Outline Overlay */}
                <div className="relative z-10">
                  <img 
                    src={palmOutline} 
                    alt="Palm Outline" 
                    className={`w-48 h-60 transition-all duration-500 ${
                      alignment === 'good' 
                        ? 'opacity-80 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]' 
                        : 'opacity-60'
                    }`}
                  />
                  
                  {/* Alignment Indicator */}
                  <div className={`absolute -top-4 -right-4 p-2 rounded-full ${
                    alignment === 'good' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {alignment === 'good' ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  
                  {/* Countdown Display */}
                  {scanState === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl font-bold text-white drop-shadow-2xl animate-pulse-glow">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Scanning Animation */}
                {scanState === 'scanning' && (
                  <div className="absolute inset-0 bg-primary/20 animate-pulse z-5"></div>
                )}
              </>
            )}
          </div>
          
          {/* Instructions */}
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>
                {alignment === 'good' ? 'Perfect alignment!' : 'Adjust your hand position'}
              </span>
            </div>
            
            {scanState === 'ready' && (
              <Button 
                variant="glow" 
                size="lg" 
                onClick={startScan}
                className="w-full"
              >
                <Hand className="h-5 w-5" />
                Start Palm Scan
              </Button>
            )}
            
            {scanState === 'complete' && (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-pulse-glow" />
                <p className="text-green-500 font-semibold">Both palms scanned successfully!</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Progress Indicator */}
        <div className="flex justify-center space-x-4">
          <div className={`w-3 h-3 rounded-full transition-colors ${
            currentHand === 'left' || scanState === 'complete' 
              ? 'bg-primary' 
              : 'bg-muted'
          }`}></div>
          <div className={`w-3 h-3 rounded-full transition-colors ${
            currentHand === 'right' || scanState === 'complete' 
              ? 'bg-primary' 
              : 'bg-muted'
          }`}></div>
        </div>
      </div>
    </div>
  );
};

export default PalmScanner;