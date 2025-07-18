import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PhoneVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onVerificationComplete: () => void;
}

export const PhoneVerificationDialog = ({ 
  open, 
  onOpenChange, 
  phoneNumber, 
  onVerificationComplete 
}: PhoneVerificationDialogProps) => {
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate a simple 6-digit OTP for demo purposes
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  const handleSendOtp = async () => {
    if (!phoneNumber || !user) return;

    setIsSendingOtp(true);
    try {
      // For demo purposes, we'll generate a random OTP and show it to the user
      // In a real app, you'd integrate with an SMS service
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);
      setOtpSent(true);

      toast({
        title: "OTP Sent",
        description: `Demo OTP: ${newOtp} (In production, this would be sent via SMS)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !user || !phoneNumber) return;

    setIsVerifying(true);
    try {
      // Verify OTP
      if (otp !== generatedOtp) {
        toast({
          title: "Error",
          description: "Enter the Correct OTP",
          variant: "destructive",
        });
        return;
      }

      // Update user profile with verified phone number
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          phone_number: phoneNumber,
          phone_verified: true
        });

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Phone Number Verified",
      });

      onVerificationComplete();
      onOpenChange(false);
      setOtp('');
      setOtpSent(false);
      setGeneratedOtp('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify phone number.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verify Phone Number
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <Phone className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">
              We'll send a verification code to
            </p>
            <p className="font-semibold">{phoneNumber}</p>
          </div>

          {!otpSent ? (
            <Button 
              onClick={handleSendOtp} 
              disabled={isSendingOtp}
              className="w-full"
            >
              {isSendingOtp ? 'Sending...' : 'Send OTP'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
              </div>
              
              <Button 
                onClick={handleVerifyOtp} 
                disabled={isVerifying || otp.length !== 6}
                className="w-full"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>

              <Button 
                variant="ghost" 
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="w-full"
              >
                Resend OTP
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};