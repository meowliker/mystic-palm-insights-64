import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileImage, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PalmUploadFormProps {
  onScanComplete: (scanData: any) => void;
  onGoBack?: () => void;
}

const PalmUploadForm = ({ onScanComplete, onGoBack }: PalmUploadFormProps) => {
  const [leftPalmFile, setLeftPalmFile] = useState<File | null>(null);
  const [rightPalmFile, setRightPalmFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (file: File | null, hand: 'left' | 'right') => {
    if (hand === 'left') {
      setLeftPalmFile(file);
    } else {
      setRightPalmFile(file);
    }
  };

  const uploadImageToStorage = async (file: File, hand: 'left' | 'right'): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileName = `${user.id}/${Date.now()}-${hand}-palm.jpg`;
      
      const { data, error } = await supabase.storage
        .from('palm-images')
        .upload(fileName, file, {
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

  const generatePalmReading = async (leftImageUrl: string, rightImageUrl: string) => {
    try {
      console.log('Calling edge function with both palm images:', { leftImageUrl, rightImageUrl });
      
      const { data, error } = await supabase.functions.invoke('generate-horoscope', {
        body: { 
          palmImageUrl: leftImageUrl, // Primary image
          rightPalmImageUrl: rightImageUrl, // Secondary image for dual analysis
          analysisType: 'dual-palm'
        },
        headers: {
          'user-id': user?.id || 'anonymous'
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error generating reading:', error);
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

  const handleSubmit = async () => {
    if (!leftPalmFile || !rightPalmFile) {
      toast({
        title: "Missing images",
        description: "Please upload images of both palms",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload both images
      const leftImageUrl = await uploadImageToStorage(leftPalmFile, 'left');
      const rightImageUrl = await uploadImageToStorage(rightPalmFile, 'right');

      if (!leftImageUrl || !rightImageUrl) {
        throw new Error("Failed to upload palm images");
      }

      // Generate reading from both palms
      const palmReading = await generatePalmReading(leftImageUrl, rightImageUrl);
      
      // Pass the complete scan data
      const scanData = {
        ...palmReading,
        palm_image_url: leftImageUrl,
        right_palm_image_url: rightImageUrl
      };
      
      onScanComplete(scanData);
      
      toast({
        title: "Analysis complete!",
        description: "Your palm reading has been generated successfully"
      });
    } catch (error) {
      console.error('Error during upload and analysis:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze palms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center px-4 sm:px-6">
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
            Upload Palm Images
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-4">
            Upload clear images of both your palms for accurate AI analysis
          </p>
        </div>

        {/* Upload Form */}
        <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-primary/20">
          <div className="space-y-6">
            {/* Left Palm Upload */}
            <div className="space-y-3">
              <Label htmlFor="left-palm" className="text-base font-semibold text-foreground">
                Left Palm Image
              </Label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Input
                  id="left-palm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'left')}
                  className="hidden"
                />
                <Label 
                  htmlFor="left-palm" 
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  {leftPalmFile ? (
                    <>
                      <FileImage className="h-8 w-8 text-green-600" />
                      <span className="text-green-600 font-medium">{leftPalmFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Click to upload left palm image</span>
                    </>
                  )}
                </Label>
              </div>
            </div>

            {/* Right Palm Upload */}
            <div className="space-y-3">
              <Label htmlFor="right-palm" className="text-base font-semibold text-foreground">
                Right Palm Image
              </Label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Input
                  id="right-palm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'right')}
                  className="hidden"
                />
                <Label 
                  htmlFor="right-palm" 
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  {rightPalmFile ? (
                    <>
                      <FileImage className="h-8 w-8 text-green-600" />
                      <span className="text-green-600 font-medium">{rightPalmFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Click to upload right palm image</span>
                    </>
                  )}
                </Label>
              </div>
            </div>

            {/* Tips */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-medium text-foreground mb-2">Tips for best results:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use good lighting conditions</li>
                <li>• Keep your palms flat and straight</li>
                <li>• Ensure palm lines are clearly visible</li>
                <li>• Avoid shadows and reflections</li>
              </ul>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!leftPalmFile || !rightPalmFile || isUploading}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing your palms...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze Both Palms
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PalmUploadForm;