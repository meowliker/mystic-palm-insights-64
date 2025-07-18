import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { User, Lock, Mail, Calendar, Phone, Camera, Eye, EyeOff, Shield, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PhoneVerificationDialog } from '@/components/PhoneVerificationDialog';

interface EditProfileDialogProps {
  children: React.ReactNode;
}

export const EditProfileDialog = ({ children }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  // Profile form states
  const [fullName, setFullName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(false);
  
  // Verification dialog state
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || '');
        setBirthdate(profile.birthdate || '');
        setGender(profile.gender || '');
        setPhoneNumber(profile.phone_number || '');
        setProfilePictureUrl(profile.profile_picture_url || '');
        setPhoneVerified(profile.phone_verified || false);
        setPendingRemoval(false);
      }
    };

    if (open) {
      loadProfile();
    }
  }, [user, open]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsUpdatingProfile(true);
    try {
      let uploadedImageUrl = profilePictureUrl;

      // Upload profile picture if a new one is selected
      if (profilePicture) {
        setIsUploadingImage(true);
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${user.id}/profile.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, profilePicture, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        uploadedImageUrl = publicUrl;
        setIsUploadingImage(false);
      }

      // Handle profile picture removal
      if (pendingRemoval) {
        // Remove from storage if it exists
        if (profilePictureUrl && profilePictureUrl.includes('profiles/')) {
          const fileName = `${user.id}/profile.${profilePictureUrl.split('.').pop()}`;
          await supabase.storage.from('profiles').remove([fileName]);
        }
        uploadedImageUrl = '';
        setPendingRemoval(false);
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          birthdate: birthdate || null,
          gender: gender || null,
          phone_number: phoneNumber || null,
          profile_picture_url: uploadedImageUrl || null,
          phone_verified: phoneVerified
        });

      if (profileError) throw profileError;

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      setProfilePictureUrl(uploadedImageUrl);
      setProfilePicture(null);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
      setIsUploadingImage(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user?.email) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // First, verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Incorrect Current Password",
          variant: "destructive",
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Password Updated Successfully!",
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;

    setIsSendingResetEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      
      setShowForgotPasswordDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setPendingRemoval(true);
    setProfilePicture(null);
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      setPendingRemoval(false); // Clear any pending removal if new image is selected
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                 {/* Email (unchangeable) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Profile Picture
                  </Label>
                   <div className="flex items-center gap-4">
                     <div className="relative w-16 h-16 rounded-full overflow-hidden bg-mystical flex items-center justify-center">
                       {profilePicture ? (
                         <img 
                           src={URL.createObjectURL(profilePicture)} 
                           alt="Profile" 
                           className="w-full h-full object-cover"
                         />
                       ) : (profilePictureUrl && !pendingRemoval) ? (
                         <img 
                           src={profilePictureUrl} 
                           alt="Profile" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <User className="h-8 w-8 text-primary-foreground" />
                       )}
                     </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        id="profile-picture-input"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('profile-picture-input')?.click()}
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Profile
                      </Button>
                      {((profilePictureUrl && !pendingRemoval) || profilePicture) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveProfilePicture}
                          className="w-full"
                        >
                          Remove Picture
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a profile picture (JPG, PNG)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Birthdate */}
                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Birthdate
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      disabled={phoneVerified}
                      className={phoneVerified ? "bg-muted" : ""}
                    />
                    {phoneVerified ? (
                      <Button variant="outline" disabled className="shrink-0">
                        <Shield className="h-4 w-4 mr-2 text-green-500" />
                        Verified
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowVerificationDialog(true)}
                        disabled={!phoneNumber}
                        className="shrink-0"
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                  {phoneVerified && (
                    <p className="text-xs text-muted-foreground">
                      Phone number is verified and cannot be changed
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={isUpdatingProfile || isUploadingImage}
                  className="w-full"
                >
                  {isUploadingImage ? 'Uploading Image...' : isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </h3>
              
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => setShowForgotPasswordDialog(true)}
                  className="w-full text-sm"
                >
                  Forgot Password?
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Phone Verification Dialog */}
        <PhoneVerificationDialog
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
          phoneNumber={phoneNumber}
          onVerificationComplete={() => {
            setPhoneVerified(true);
            handleProfileUpdate();
          }}
        />

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Send a password reset email to your registered email address.
              </p>
              <Button 
                onClick={handleForgotPassword}
                disabled={isSendingResetEmail}
                className="w-full"
              >
                {isSendingResetEmail ? 'Sending...' : 'Reset Password through Email'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};