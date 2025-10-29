import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Camera, Hand, CheckCircle, AlertCircle, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CameraService } from '@/services/cameraService';
import { Capacitor } from '@capacitor/core';
import { CameraPreview } from '@capacitor-community/camera-preview';
type ScanState = 'ready' | 'detecting' | 'scanning' | 'capturing' | 'analyzing' | 'complete' | 'error';

// Configuration constants for timing
const DETECTION_DURATION = 2000; // 2 seconds for palm detection
const SCANNING_DURATION = 5000; // 5 seconds for hand positioning with countdown
const COUNTDOWN_INTERVAL = 1000; // 1 second countdown intervals

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alignmentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize camera automatically when component mounts
  useEffect(() => {
    initializeCamera(); // Auto-start camera by default
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
      if (Capacitor.isNativePlatform()) {
        console.log('[PalmScanner] Native platform detected, requesting camera permissions');
        
        // Check and request Camera permissions
        const cameraPermissions = await CameraService.checkPermissions();
        console.log('[PalmScanner] Camera permissions:', cameraPermissions);
        
        if (cameraPermissions.camera !== 'granted') {
          console.log('[PalmScanner] Requesting camera permissions');
          const requestResult = await CameraService.requestPermissions();
          console.log('[PalmScanner] Permission request result:', requestResult);
          
          if (requestResult.camera !== 'granted') {
            const platform = Capacitor.getPlatform();
            const settingsMsg = platform === 'ios' 
              ? 'Go to Settings > PalmCosmic > Camera and enable access'
              : 'Go to Settings > Apps > PalmCosmic > Permissions > Camera';
            setCameraError(`Camera permission denied. ${settingsMsg}`);
            toast({
              title: "Camera Permission Required",
              description: settingsMsg,
              variant: "destructive"
            });
            return;
          }
        }
        
        // Check CameraPreview permissions specifically
        try {
          console.log('[PalmScanner] Starting CameraPreview');
          
          // CRITICAL: Set transparent background for toBack:true to work
          document.body.style.backgroundColor = 'transparent';
          document.documentElement.style.backgroundColor = 'transparent';
          
          // Wait a tick to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await CameraPreview.start({
            position: 'rear',
            width: window.screen.width,
            height: window.screen.height,
            toBack: true,  // MUST be true for Android to show UI elements
            disableAudio: true,
            enableZoom: true,
          });
          console.log('[PalmScanner] CameraPreview started successfully');
          setCameraActive(true);
          document.body.classList.add('camera-active');
          setCameraError(null);
        } catch (previewError) {
          console.error('[PalmScanner] CameraPreview error:', previewError);
          // Fallback to standard camera if preview fails
          setCameraError('Camera preview failed. Using standard camera capture instead.');
          toast({
            title: "Using Alternative Camera Mode",
            description: "Camera preview unavailable, but capture will work.",
            variant: "default"
          });
          setCameraActive(true);
          setCameraError(null);
        }
      } else {
        // Web platforms use getUserMedia
        console.log('[PalmScanner] Web platform detected, using getUserMedia');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Use rear camera for palm scanning
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        setStream(mediaStream);
        setCameraActive(true);
        if (videoRef.current) {
          (videoRef.current as any).srcObject = mediaStream;
        }
        document.body.classList.add('camera-active');
        setCameraError(null);
        console.log('[PalmScanner] Web camera initialized successfully');
      }
    } catch (error) {
      console.error('[PalmScanner] Camera initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        setCameraError('Camera access denied. Please enable camera permissions in your browser/device settings.');
      } else if (errorMessage.includes('NotFoundError')) {
        setCameraError('No camera found on this device.');
      } else if (errorMessage.includes('NotReadableError')) {
        setCameraError('Camera is in use by another app. Please close other camera apps and try again.');
      } else {
        setCameraError(`Camera error: ${errorMessage}`);
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const stopCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await CameraPreview.stop();
      } catch (e) {
        // ignore
      }
      setCameraActive(false);
      document.body.classList.remove('camera-active');
      return;
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      setStream(null);
      setCameraActive(false);
      if (videoRef.current) {
        (videoRef.current as any).srcObject = null;
      }
      document.body.classList.remove('camera-active');
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

  // New: call Edge Function directly with in-memory image data (works without auth)
  const generatePalmReadingDirect = async (imageDataUrl: string) => {
    try {
      console.log('Calling palm reading function with inline image data');
      const { data, error } = await supabase.functions.invoke('palm-reading', {
        body: { imageDataUrl }
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
      console.error('Error generating reading (direct):', error);
      throw error;
    }
  };

  const startScan = async () => {
    if (cameraError) return;
    
    try {
      console.log('[PalmScanner] startScan clicked');
      // Unified in-app scanning UX on all platforms
      setScanState('detecting');
      setProgress(0);
      setCountdown(null);
      
      // Enhanced alignment detection - more forgiving
      alignmentIntervalRef.current = setInterval(() => {
        const isAligned = Math.random() > 0.2; // 80% chance of good alignment
        setAlignment(isAligned ? 'good' : 'poor');
      }, 500);

      // Move to scanning phase after detection
      setTimeout(() => {
        console.log('[PalmScanner] detection phase complete, moving to scanning');
        setScanState('scanning');
        startCountdownTimer();
      }, DETECTION_DURATION);
    } catch (error) {
      console.error('Camera error:', error);
      setScanState('error');
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const startCountdownTimer = () => {
    console.log('[PalmScanner] scanning phase started');
    // Remove countdown, just wait for the scanning duration
    setTimeout(() => {
      console.log('[PalmScanner] capturing frame');
      setScanState('capturing');
      setCountdown(null);
      // Immediate capture after scanning duration
      setTimeout(() => handleScanComplete(), 500);
    }, SCANNING_DURATION);
  };

  // Cleanup effect for countdown and intervals
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (alignmentIntervalRef.current) {
        clearInterval(alignmentIntervalRef.current);
      }
    };
  }, [scanState]);

  const handleScanComplete = async () => {
    console.log('[PalmScanner] handleScanComplete invoked');
    setScanState('analyzing');
    setProcessingStage('Analyzing cosmic patterns...');
    
    try {
      // Capture the palm image immediately
      let imageDataUrl: string | null = null;
      
      if (Capacitor.isNativePlatform()) {
        console.log('[PalmScanner] Capturing image on native platform');
        try {
          const result = await CameraPreview.capture({ quality: 90 });
          imageDataUrl = result?.value ? `data:image/jpeg;base64,${result.value}` : null;
          console.log('[PalmScanner] Native image captured:', imageDataUrl ? 'success' : 'failed');
        } catch (captureError) {
          console.warn('[PalmScanner] CameraPreview capture failed, trying fallback:', captureError);
          // Fallback to CameraService if CameraPreview fails
          try {
            const image = await CameraService.takePicture();
            imageDataUrl = image.dataUrl || null;
            console.log('[PalmScanner] Fallback camera capture:', imageDataUrl ? 'success' : 'failed');
          } catch (fallbackError) {
            console.error('[PalmScanner] Fallback camera also failed:', fallbackError);
            throw new Error('Failed to capture image. Please try again.');
          }
        }
      } else {
        console.log('[PalmScanner] Capturing image on web platform');
        imageDataUrl = await captureImage();
        console.log('[PalmScanner] Web image captured:', imageDataUrl ? 'success' : 'failed');
      }
      
      if (!imageDataUrl) {
        throw new Error("Failed to capture palm image");
      }

      setCapturedImage(imageDataUrl);
      
      // Stop camera immediately for privacy after capture
      await stopCamera();

      // Prefer direct analysis with in-memory data to avoid storage issues
      try {
        setProcessingStage('Analyzing your palm...');
        const palmReading = await generatePalmReadingDirect(imageDataUrl);
        setProcessingStage('Generating insights...');
        setScanState('complete');
        const scanData = {
          ...palmReading,
          palm_image_url: null,
          capturedImage: imageDataUrl
        };
        setTimeout(() => onScanComplete(scanData), 1500);
        return; // Done
      } catch (e) {
        console.warn('Direct analysis failed, falling back to storage upload:', e);
      }

      // Fallback: upload then analyze via public URL
      setProcessingStage('Uploading to secure storage...');
      const imageUrl = await uploadImageToStorage(imageDataUrl);
      if (!imageUrl) {
        throw new Error("Failed to save palm image");
      }

      setProcessingStage('Analyzing cosmic patterns...');
      const palmReading = await generatePalmReading(imageUrl);
      if (!palmReading) {
        throw new Error("Failed to generate palm reading");
      }

      setProcessingStage('Generating insights...');
      
      // Palm scan complete
      setScanState('complete');
      
      // Pass the complete scan data
      const scanData = {
        ...palmReading,
        palm_image_url: imageUrl,
        capturedImage: imageDataUrl
      };
      
      setTimeout(() => onScanComplete(scanData), 1500);
    } catch (error) {
      console.error('Error during scan completion:', error);
      setScanState('error');
      setProcessingStage('');
      const errorMsg = error instanceof Error ? error.message : "Failed to analyze palm. Please try again.";
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive"
      });
      // Restart camera for retry
      await initializeCamera();
    }
  };

  const retryCamera = async () => {
    await initializeCamera();
  };

  const getStatusMessage = () => {
    switch (scanState) {
      case 'ready':
        return 'Position your palm for scanning';
      case 'detecting':
        return 'Looking for your palm...';
      case 'scanning':
        return 'Hold Steady';
      case 'capturing':
        return 'Capturing your palm...';
      case 'analyzing':
        return processingStage || 'Analyzing cosmic patterns in your palm...';
      case 'complete':
        return 'Palm reading complete!';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Full Screen Analysis Animation */}
      {scanState === 'analyzing' && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-purple-900 z-50 flex flex-col items-center justify-center">
          {/* Cosmic Background Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full animate-pulse" />
            <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 right-1/3 w-20 h-20 bg-yellow-500/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          </div>
          
          {/* Main Analysis Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Multiple spinning sparkles */}
            <div className="relative">
              <div className="text-purple-400 animate-spin">
                <Sparkles className="h-24 w-24" />
              </div>
              <div className="absolute inset-0 text-pink-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}>
                <Sparkles className="h-16 w-16" />
              </div>
              <div className="absolute inset-0 text-blue-400 animate-spin" style={{ animationDuration: '4s' }}>
                <Sparkles className="h-12 w-12" />
              </div>
            </div>
            
            {/* Analysis Text */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white animate-pulse">
                Analyzing Your Palm
              </h1>
              <p className="text-white/80 text-lg animate-fade-in">
                {processingStage || 'Reading cosmic patterns...'}
              </p>
              <div className="flex justify-center space-x-2 mt-4">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile: Fullscreen camera view */}
      <div className="sm:hidden">
        {/* Fullscreen Camera Area */}
        <div className={`fixed inset-0 z-10 ${
          cameraActive ? 'bg-transparent' : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950'
        }`}>
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
              {/* Camera Feed Container with purple card background */}
              <div className={`absolute inset-x-4 top-20 bottom-32 rounded-2xl overflow-hidden border border-purple-400/20 shadow-2xl ${
                cameraActive ? 'bg-transparent backdrop-blur-none' : 'bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-purple-950/50 backdrop-blur-sm'
              }`}>
                {/* Camera Feed */}
                {Capacitor.isNativePlatform() ? (
                  <div 
                  id="camera-preview-container" 
                  className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
                  style={{ backgroundColor: 'black' }}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  style={{ backgroundColor: 'transparent' }}
                />
                )}
                
                {/* Scanning Progress Overlay - Don't show during analyzing */}
                {(scanState === 'scanning' || scanState === 'capturing') && (
                  <div className="absolute inset-0 bg-primary/10 animate-pulse z-15 rounded-2xl" />
                )}
              </div>
              
              {/* Hidden canvas for image capture */}
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
          
          {/* Overlapping Controls for Mobile */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-purple-950/95 via-purple-900/90 to-purple-900/60">
            {/* Back Button */}
            {onGoBack && (
              <div className="absolute top-4 left-4">
                <Button 
                  variant="outline" 
                  onClick={onGoBack}
                  size="sm"
                  className="bg-purple-900/80 backdrop-blur-md border-purple-400/30 text-white hover:bg-purple-800/90 shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Header Text */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <Sparkles className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                Palm Reading
              </h1>
              {scanState === 'analyzing' ? (
                <div className="text-center">
                  <p className="text-white text-lg font-semibold animate-pulse mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Analyzing Your Palm
                  </p>
                  <p className="text-white/90 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Reading cosmic patterns...
                  </p>
                </div>
              ) : (
                <p className="text-white/90 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {getStatusMessage()}
                </p>
              )}
              {scanState === 'ready' && (
                <p className="text-xs text-white/80 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Please use the flashlight for better scans in dark backgrounds
                </p>
              )}
            </div>
            
            {/* Camera Privacy Controls */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm backdrop-blur-md shadow-lg ${
                cameraActive ? 'bg-purple-900/50 text-red-100 border border-red-400/50' : 'bg-purple-900/50 text-green-100 border border-green-400/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Camera {cameraActive ? 'Active' : 'Off'}</span>
              </div>
              {cameraActive && scanState === 'ready' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={stopCamera}
                  className="text-red-100 border-red-400/30 hover:bg-red-400/20 bg-purple-900/80 backdrop-blur-md shadow-lg"
                >
                  Stop Camera
                </Button>
              )}
              {!cameraActive && scanState === 'ready' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={initializeCamera}
                  className="text-green-100 border-green-400/30 hover:bg-green-400/20 bg-purple-900/80 backdrop-blur-md shadow-lg"
                >
                  Start Camera
                </Button>
              )}
            </div>
            
            {/* Enhanced Progress Bar for Mobile */}
            {(scanState === 'scanning' || scanState === 'analyzing' || scanState === 'capturing') && (
              <div className="mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {scanState === 'scanning' && countdown ? `Hold steady... ${countdown}s` : 
                       scanState === 'capturing' ? 'Capturing...' :
                       scanState === 'analyzing' ? processingStage || 'Analyzing...' : 'Processing...'}
                    </span>
                    {scanState === 'scanning' && countdown && (
                      <span className="text-primary font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{countdown}</span>
                    )}
                  </div>
                  <Progress 
                    value={scanState === 'scanning' && countdown ? ((5 - countdown) / 5) * 100 : undefined}
                    className="h-2 bg-white/20"
                  />
                </div>
              </div>
            )}
            
            {/* Controls for Mobile - Hide message during scanning and analysis */}
            <div className="text-center space-y-3">
              {scanState !== 'analyzing' && scanState !== 'scanning' && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <Camera className="h-4 w-4 flex-shrink-0" />
                  <span className="text-center">
                    {alignment === 'good' ? 
                      'Perfect alignment! Ready to scan...' : 
                      'Position your palm for scanning'
                    }
                  </span>
                </div>
              )}
              
              {scanState === 'ready' && cameraActive && (
                <Button 
                  onClick={startScan}
                  variant="glow"
                  size="lg"
                  className="w-full shadow-xl"
                >
                  <Hand className="h-5 w-5 mr-2" />
                  Start Palm Scan
                </Button>
              )}
              
              {scanState === 'complete' && (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto drop-shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
                  <p className="text-white font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Scan Complete!</p>
                  <p className="text-white/90 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Preparing your cosmic insights...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Original design */}
      <div className={`hidden sm:block min-h-screen flex items-center justify-center px-6 ${
        Capacitor.isNativePlatform() && cameraActive 
          ? 'bg-transparent' 
          : 'bg-gradient-to-br from-background via-background to-background/80'
      }`}>
        <div className="w-full max-w-2xl mx-auto space-y-6">
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
              Position your palm for scanning
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
          <Card className={`relative overflow-hidden border-primary/20 z-10 ${
            Capacitor.isNativePlatform() && cameraActive 
              ? 'bg-transparent' 
              : 'bg-card/80 backdrop-blur-sm'
          }`}>
            <div className={`aspect-[4/3] relative flex items-center justify-center ${
              Capacitor.isNativePlatform() && cameraActive 
                ? 'bg-transparent' 
                : 'bg-gradient-to-br from-primary/5 to-secondary/5'
            }`}>
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
                  {!Capacitor.isNativePlatform() && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      style={{ backgroundColor: 'black' }}
                    />
                  )}
                  
                  {/* Hidden canvas for image capture */}
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Palm Outline Overlay - COMPLETELY REMOVED */}
                  
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
            
            {/* Controls - Hide message during scanning and analysis */}
            <div className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4 relative z-20">
              {scanState !== 'analyzing' && scanState !== 'scanning' && (
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground px-2">
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-center">
                    {alignment === 'good' 
                      ? 'Perfect alignment! Ready to scan...' 
                      : 'Position your palm for scanning'
                    }
                  </span>
                </div>
              )}
              
              {scanState === 'ready' && cameraActive && (
                <Button 
                  onClick={startScan}
                  size="lg"
                  variant="glow"
                  disabled={!cameraActive}
                  className="gap-2"
                >
                  <Hand className="h-5 w-5" />
                  Start Palm Scan
                </Button>
              )}
              
              {scanState === 'complete' && (
                <div className="text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-foreground">Scan Complete!</h3>
                    <p className="text-muted-foreground text-sm">Preparing your cosmic insights...</p>
                  </div>
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