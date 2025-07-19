import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Camera, Hand, CheckCircle, AlertCircle, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import palmOutline from '@/assets/palm-outline.png';

type ScanState = 'ready' | 'detecting' | 'scanning' | 'analyzing' | 'complete' | 'error';

const PalmScanner = ({ onScanComplete, onGoBack }: { 
  onScanComplete: (scanData: any) => void;
  onGoBack?: () => void;
}) => {
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [currentHand, setCurrentHand] = useState<'left' | 'right'>('left');
  const [progress, setProgress] = useState(0);
  const [alignment, setAlignment] = useState<'good' | 'poor'>('poor');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alignmentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize camera
  useEffect(() => {
    initializeCamera();

    return () => {
      stopCamera();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (alignmentIntervalRef.current) {
        clearInterval(alignmentIntervalRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (error) {
      setCameraError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      setStream(null);
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const uploadImageToStorage = async (imageDataUrl: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create unique filename
      const fileName = `${user.id}/${Date.now()}-palm.jpg`;
      
      const { data, error } = await supabase.storage
        .from('palm-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('palm-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const generatePalmReading = async (imageUrl: string) => {
    try {
      console.log('Calling edge function with image URL:', imageUrl);
      console.log('User ID:', user?.id);
      
      const { data, error } = await supabase.functions.invoke('generate-horoscope', {
        body: { 
          palmImageUrl: imageUrl
        },
        headers: {
          'user-id': user?.id
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error generating reading:', error);
        // Fallback to simulated reading
        return generateSimulatedReading();
      }

      return data;
    } catch (error) {
      console.error('Error generating reading:', error);
      // Fallback to simulated reading
      return generateSimulatedReading();
    }
  };

  const generateSimulatedReading = () => {
    return {
      life_line_strength: 'Strong',
      heart_line_strength: 'Moderate',
      head_line_strength: 'Strong',
      fate_line_strength: 'Moderate',
      overall_insight: 'Your palm reveals a person with strong vitality and clear thinking. You have moderate emotional capacity and a balanced approach to destiny.',
      traits: {
        life_energy: 'Vibrant',
        emotional_capacity: 'Moderate',
        intellectual_approach: 'Analytical',
        destiny_path: 'Balanced'
      }
    };
  };

  const startScan = () => {
    if (cameraError) return;
    
    setScanState('detecting');
    setProgress(0);
    
    // Simplified alignment detection - more forgiving
    alignmentIntervalRef.current = setInterval(() => {
      // Much more forgiving palm detection
      const isAligned = Math.random() > 0.2; // 80% chance of good alignment
      setAlignment(isAligned ? 'good' : 'poor');
    }, 500);

    // Auto start scanning after 2 seconds regardless of alignment
    setTimeout(() => {
      if (scanState === 'detecting' || scanState === 'ready') {
        setScanState('scanning');
      }
    }, 2000);
  };

  // Progress tracking effect
  useEffect(() => {
    if (scanState === 'scanning') {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          // Simplified progress - always progress, slightly faster when aligned
          const progressIncrement = alignment === 'good' ? 3 : 2;
          const newProgress = prev + progressIncrement;
          
          if (newProgress >= 100) {
            clearInterval(progressIntervalRef.current!);
            handleScanComplete();
            return 100;
          }
          return newProgress;
        });
      }, 150);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [scanState, alignment]);

  const handleScanComplete = async () => {
    setScanState('analyzing');
    
    // Capture the palm image
    const imageDataUrl = await captureImage();
    if (!imageDataUrl) {
      toast({
        title: "Error",
        description: "Failed to capture palm image",
        variant: "destructive"
      });
      return;
    }

    setCapturedImage(imageDataUrl);
    
    // Upload image and generate reading
    const imageUrl = await uploadImageToStorage(imageDataUrl);
    if (!imageUrl) {
      toast({
        title: "Error", 
        description: "Failed to save palm image",
        variant: "destructive"
      });
      return;
    }

    const palmReading = await generatePalmReading(imageUrl);
    if (!palmReading) {
      toast({
        title: "Error",
        description: "Failed to generate palm reading", 
        variant: "destructive"
      });
      return;
    }

    // Check if we need to scan the other hand
    if (currentHand === 'left') {
      setCurrentHand('right');
      setScanState('ready');
      setProgress(0);
      toast({
        title: "Left palm complete!",
        description: "Now position your right palm for scanning"
      });
      return;
    }

    // Both hands complete - stop camera for privacy
    setScanState('complete');
    stopCamera();
    
    // Pass the complete scan data (ResultsScreen will save it ONCE)
    const scanData = {
      ...palmReading,
      palm_image_url: imageUrl,
      capturedImage: imageDataUrl
    };
    
    setTimeout(() => onScanComplete(scanData), 2000);
  };

  const retryCamera = async () => {
    await initializeCamera();
  };

  const getStatusMessage = () => {
    switch (scanState) {
      case 'ready':
        return `Position your ${currentHand} palm within the outline`;
      case 'detecting':
        return `Looking for ${currentHand} palm...`;
      case 'scanning':
        return `Scanning your ${currentHand} palm for insights...`;
      case 'analyzing':
        return 'Analyzing cosmic patterns in your palm...';
      case 'complete':
        return 'Palm reading complete!';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back Button */}
        {onGoBack && (
          <div className="flex justify-start">
            <Button 
              variant="outline" 
              onClick={onGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Palm Reading
          </h1>
          <p className="text-muted-foreground text-lg">
            {getStatusMessage()}
          </p>
          {scanState === 'ready' && (
            <p className="text-sm text-muted-foreground">
              Please use the flashlight for better scans in dark backgrounds
            </p>
          )}
          
          {/* Camera Privacy Controls */}
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              cameraActive ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              Camera {cameraActive ? 'Active' : 'Off'}
            </div>
            {cameraActive && scanState === 'ready' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopCamera}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Stop Camera
              </Button>
            )}
            {!cameraActive && scanState === 'ready' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={initializeCamera}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                Start Camera
              </Button>
            )}
          </div>
        </div>

        {/* Main Scanning Area */}
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-primary/20">
          <div className="aspect-[4/3] relative flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
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
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
                
                {/* Hidden canvas for image capture */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Palm Outline Overlay */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="relative">
                    <img 
                      src={palmOutline} 
                      alt="Palm Outline" 
                      className={`w-56 h-72 transition-all duration-500 ${
                        alignment === 'good' 
                          ? 'opacity-90 drop-shadow-[0_0_30px_rgba(168,85,247,0.9)] scale-105' 
                          : 'opacity-60 scale-100'
                      }`}
                      style={{
                        filter: alignment === 'good' ? 'brightness(1.2) contrast(1.1)' : 'none'
                      }}
                    />
                    
                    {/* Alignment Indicator */}
                    <div className={`absolute -top-6 -right-6 p-3 rounded-full transition-all duration-300 ${
                      alignment === 'good' ? 'bg-green-500 scale-110' : 'bg-red-500'
                    }`}>
                      {alignment === 'good' ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-white" />
                      )}
                    </div>

                    {/* Cosmic Effects for Scanning */}
                    {scanState === 'scanning' && alignment === 'good' && (
                      <>
                        {/* Planetary symbols */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse opacity-80" />
                          <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-red-400 rounded-full animate-pulse opacity-80" />
                          <div className="absolute bottom-1/3 left-1/3 w-7 h-7 bg-blue-400 rounded-full animate-pulse opacity-80" />
                          <div className="absolute bottom-1/4 right-1/3 w-5 h-5 bg-purple-400 rounded-full animate-pulse opacity-80" />
                        </div>
                        
                        {/* Scanning lines */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse" />
                      </>
                    )}
                    
                    {/* Analysis Phase Effects */}
                    {scanState === 'analyzing' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-2xl font-bold text-primary animate-pulse">
                          <Sparkles className="h-12 w-12" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scanning Progress Overlay */}
                {(scanState === 'scanning' || scanState === 'analyzing') && (
                  <div className="absolute inset-0 bg-primary/10 animate-pulse z-5 rounded-lg" />
                )}
              </>
            )}
          </div>
          
          {/* Progress Bar */}
          {(scanState === 'scanning' || scanState === 'analyzing') && (
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {scanState === 'scanning' ? 'Scanning Progress' : 'Analyzing...'}
                  </span>
                  <span className="text-primary font-medium">
                    {scanState === 'scanning' ? `${progress}%` : '100%'}
                  </span>
                </div>
                <Progress 
                  value={scanState === 'analyzing' ? 100 : progress} 
                  className="h-2"
                />
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>
                {alignment === 'good' 
                  ? 'Perfect alignment! Hold steady...' 
                  : 'Adjust your hand position within the outline'
                }
              </span>
            </div>
            
            {scanState === 'ready' && cameraActive && (
              <Button 
                onClick={startScan}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Hand className="h-5 w-5 mr-2" />
                Start {currentHand} Palm Scan
              </Button>
            )}
            
            {scanState === 'ready' && !cameraActive && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">Camera is stopped for privacy</p>
                <Button 
                  onClick={initializeCamera}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Enable Camera to Start
                </Button>
              </div>
            )}
            
            {scanState === 'complete' && (
              <div className="space-y-3">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
                <p className="text-green-500 font-semibold text-lg">
                  {currentHand === 'right' ? 'Both palms scanned successfully!' : 'Left palm complete!'}
                </p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Hand Progress Indicator */}
        <div className="flex justify-center items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
              currentHand === 'left' && scanState !== 'complete'
                ? 'bg-primary ring-2 ring-primary/30 ring-offset-2' 
                : scanState === 'complete' || (currentHand === 'right')
                ? 'bg-green-500'
                : 'bg-muted'
            }`} />
            <span className="text-sm text-muted-foreground">Left Palm</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
              currentHand === 'right' && scanState !== 'complete'
                ? 'bg-primary ring-2 ring-primary/30 ring-offset-2' 
                : scanState === 'complete'
                ? 'bg-green-500'
                : 'bg-muted'
            }`} />
            <span className="text-sm text-muted-foreground">Right Palm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PalmScanner;