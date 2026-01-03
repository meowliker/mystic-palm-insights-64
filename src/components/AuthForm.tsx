
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gem, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
  onSuccess: () => void;
}

const AuthForm = ({ mode, onModeChange, onSuccess }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        console.log('Signup error:', error); // Debug log
        if (error) {
          console.log('Error message:', error.message); // Debug log
          if (error.message.includes('already registered') || 
              error.message.includes('already been registered') ||
              error.message.includes('User already registered')) {
            toast({
              title: "User Already Exists",
              description: "Please Login with Your Password",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Registration failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Registration successful!",
            description: "Please check your email to verify your account."
          });
          // Don't call onSuccess for signup - let the auth state handle the redirect
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive"
          });
        } else {
          // Get user data after successful login to access full_name from metadata
          const { data: { user } } = await supabase.auth.getUser();
          const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
          
          toast({
            title: `Welcome ${userName}!`,
            description: "You've successfully signed in."
          });
          onSuccess();
        }
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: 'https://palm-cosmic.lovable.app/email-verified.html',
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password reset email sent",
          description: "Please check your email for password reset instructions."
        });
        setForgotPasswordOpen(false);
        setForgotPasswordEmail('');
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Gem className="h-8 w-8 text-primary animate-pulse-glow" />
          <span className="text-2xl font-bold text-foreground">PalmCosmic</span>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">
          {mode === 'signup' ? 'Create Your Account' : 'Sign In'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Enter your password"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {mode === 'login' && (
            <div className="text-right">
              <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto">
                    Forgot password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgotEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="forgotEmail"
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="pl-10"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForgotPasswordOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={forgotPasswordLoading}
                        className="flex-1"
                      >
                        {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="glow" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}
            className="text-muted-foreground hover:text-foreground"
          >
            {mode === 'signup' 
              ? 'Sign in' 
              : "Don't have an account? Sign up"
            }
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AuthForm;
