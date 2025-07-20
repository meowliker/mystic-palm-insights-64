import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Camera, Hand, CheckCircle, AlertCircle, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import palmOutline from '@/assets/palm-outline.png';
import leftPalmOutline from '@/assets/left-palm-outline.png';
import rightPalmOutline from '@/assets/right-palm-outline.png';

type ScanState = 'ready' | 'detecting' | 'scanning' | 'analyzing' | 'complete' | 'error';

const PalmScanner = ({ onScanComplete, onGoBack }: { 
  onScanComplete: (scanData: any) => void;
  onGoBack?: () => void;
}) => {
  const [scanState, setScanState] = useState<ScanState>('ready');
  
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

  // Initialize camera only when component mounts
  useEffect(() => {
    // Don't auto-start camera for privacy - user needs to explicitly start it
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

    // Set high-quality canvas dimensions
    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.min(video.videoHeight, 720);
    
    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return high-quality JPEG with good compression
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const uploadImageToStorage = async (imageDataUrl: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert data URL to blob with better quality
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create unique filename
      const fileName = `${user.id}/${Date.now()}-palm.jpg`;
      
      console.log('Uploading captured image to storage, size:', blob.size);
      
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

      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const generatePalmReading = async (imageUrl: string) => {
    try {
      console.log('Calling palm reading function with captured image URL:', imageUrl);
      console.log('User ID:', user?.id);
      
      // Add a small delay to ensure image is fully uploaded and accessible
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data, error } = await supabase.functions.invoke('palm-reading', {
        body: { 
          imageUrl
        }
      });

      console.log('Palm reading response:', { data, error });

      if (error) {
        console.error('Error from palm reading function:', error);
        throw new Error(error.message || 'Failed to generate palm reading');
      }

      if (!data) {
        throw new Error('No data received from palm analysis');
      }

      return data;
    } catch (error) {
      console.error('Error generating reading:', error);
      throw error;
    }
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

  // Progress tracking effect - unlimited loop
  useEffect(() => {
    if (scanState === 'scanning') {
      // Start scanning automatically after 3 seconds
      const scanTimeout = setTimeout(() => {
        handleScanComplete();
      }, 3000);
      
      return () => clearTimeout(scanTimeout);
    }
  }, [scanState]);

  const handleScanComplete = async () => {
    setScanState('analyzing');
    
    try {
      // Capture the palm image
      const imageDataUrl = await captureImage();
      if (!imageDataUrl) {
        throw new Error("Failed to capture palm image");
      }

      setCapturedImage(imageDataUrl);
      
      // Upload image and generate reading
      const imageUrl = await uploadImageToStorage(imageDataUrl);
      if (!imageUrl) {
        throw new Error("Failed to save palm image");
      }

      const palmReading = await generatePalmReading(imageUrl);
      if (!palmReading) {
        throw new Error("Failed to generate palm reading");
      }

      // Palm scan complete - stop camera for privacy
      setScanState('complete');
      stopCamera();
      
      // Pass the complete scan data (ResultsScreen will save it ONCE)
      const scanData = {
        ...palmReading,
        palm_image_url: imageUrl,
        capturedImage: imageDataUrl
      };
      
      setTimeout(() => onScanComplete(scanData), 2000);
    } catch (error) {
      console.error('Error during scan completion:', error);
      setScanState('error');
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze palm. Please try again.",
        variant: "destructive"
      });
    }
  };

  const retryCamera = async () => {
    await initializeCamera();
  };

  const getStatusMessage = () => {
    switch (scanState) {
      case 'ready':
        return 'Position your palm within the outline';
      case 'detecting':
        return 'Looking for your palm...';
      case 'scanning':
        return 'Scanning your palm for insights...';
      case 'analyzing':
        return 'Analyzing cosmic patterns in your palm...';
      case 'complete':
        return 'Palm reading complete!';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mobile: Fullscreen camera view */}
      <div className="sm:hidden">
        {/* Fullscreen Camera Area */}
        <div className="fixed inset-0 bg-black z-10">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
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
              
              {/* Hidden canvas for image capture */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Palm Outline Overlay */}
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="relative">
                  <img 
                    src={palmOutline} 
                    alt="Palm Outline" 
                    className={`w-48 h-60 transition-all duration-500 ${
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
                <div className="absolute inset-0 bg-primary/10 animate-pulse z-15" />
              )}
            </>
          )}
          
          {/* Overlapping Controls for Mobile */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {/* Back Button */}
            {onGoBack && (
              <div className="absolute top-4 left-4">
                <Button 
                  variant="outline" 
                  onClick={onGoBack}
                  size="sm"
                  className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Header Text */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Palm Reading
              </h1>
              <p className="text-white/80 text-sm">
                {getStatusMessage()}
              </p>
              {scanState === 'ready' && (
                <p className="text-xs text-white/60 mt-1">
                  Please use the flashlight for better scans in dark backgrounds
                </p>
              )}
            </div>
            
            {/* Camera Privacy Controls */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                cameraActive ? 'bg-red-500/20 text-red-400 border border-red-400/20' : 'bg-green-500/20 text-green-400 border border-green-400/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
                Camera {cameraActive ? 'Active' : 'Off'}
              </div>
              {cameraActive && scanState === 'ready' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={stopCamera}
                  className="text-red-400 border-red-400/20 hover:bg-red-400/10 bg-black/50 backdrop-blur-sm"
                >
                  Stop Camera
                </Button>
              )}
              {!cameraActive && scanState === 'ready' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={initializeCamera}
                  className="text-green-400 border-green-400/20 hover:bg-green-400/10 bg-black/50 backdrop-blur-sm"
                >
                  Start Camera
                </Button>
              )}
            </div>
            
            {/* Progress Bar for Mobile */}
            {(scanState === 'scanning' || scanState === 'analyzing') && (
              <div className="mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">
                      {scanState === 'scanning' ? 'Scanning Progress' : 'Analyzing...'}
                    </span>
                  </div>
                  <Progress 
                    value={scanState === 'analyzing' ? undefined : undefined}
                    className="h-2 bg-white/20"
                  />
                </div>
              </div>
            )}
            
            {/* Controls for Mobile */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                <Camera className="h-4 w-4 flex-shrink-0" />
                <span className="text-center">
                  {alignment === 'good' 
                    ? 'Perfect alignment! Hold steady...' 
                    : 'Adjust your hand position within the outline'
                  }
                </span>
              </div>
              
              {scanState === 'ready' && cameraActive && (
                <Button 
                  onClick={startScan}
                  variant="glow"
                  size="lg"
                  className="w-full"
                >
                  <Hand className="h-5 w-5 mr-2" />
                  Start Palm Scan
                </Button>
              )}
              
              {scanState === 'complete' && (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                  <p className="text-white font-medium">Scan Complete!</p>
                  <p className="text-white/70 text-sm">Preparing your cosmic insights...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Original design */}
      <div className="hidden sm:block min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center px-6">
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
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Palm Reading
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              {getStatusMessage()}
            </p>
            {scanState === 'ready' && (
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
                Please use the flashlight for better scans in dark backgrounds
              </p>
            )}
            
            {/* Camera Privacy Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4">
              <div className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
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
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                >
                  Stop Camera
                </Button>
              )}
              {!cameraActive && scanState === 'ready' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={initializeCamera}
                  className="text-green-600 border-green-200 hover:bg-green-50 text-xs sm:text-sm"
                >
                  Start Camera
                </Button>
              )}
            </div>
          </div>

          {/* Main Scanning Area */}
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-primary/20 mx-2 sm:mx-0">
            <div className="aspect-[4/3] sm:aspect-[4/3] relative flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
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
                        className={`w-40 h-52 sm:w-56 sm:h-72 transition-all duration-500 ${
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
              <div className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">
                      {scanState === 'scanning' ? 'Scanning Progress' : 'Analyzing...'}
                    </span>
                  </div>
                  <Progress 
                    value={undefined}
                    className="h-2"
                  />
                </div>
              </div>
            )}
          
            {/* Controls */}
            <div className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground px-2">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-center">
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
                <Hand className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Start Palm Scan
              </Button>
            )}
            
            {scanState === 'ready' && !cameraActive && (
              <div className="space-y-3 px-2">
                <p className="text-muted-foreground text-xs sm:text-sm">Camera is stopped for privacy</p>
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
                  Palm scanned successfully!
                </p>
              </div>
            )}
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default PalmScanner;