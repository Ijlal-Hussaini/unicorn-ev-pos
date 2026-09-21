import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const email = location.state?.email;
  const otp = location.state?.otp;

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 6) strength += 25;
    if (newPassword.length >= 8) strength += 25;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 25;
    if (/\d/.test(newPassword)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please make sure both passwords match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast({
        title: 'Password Reset Successful!',
        description: 'You can now login with your new password.',
        variant: 'success',
      });

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      toast({
        title: 'Reset Failed',
        description: err.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50">
        <ThemeToggle className="bg-card/90 backdrop-blur-sm border-border" />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-8 xl:p-12 flex-col justify-between z-10 overflow-y-auto">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-cyan-500/30">
              <img 
                src={Logo} 
                alt="Unicorn EV Bikes Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Unicorn EV Bikes
            </h1>
            <p className="text-muted-foreground text-xs">Electric Vehicle Management</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl py-8">
          <div className="inline-flex items-center space-x-2 bg-green-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-green-500/30 w-fit mb-8">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-medium">Almost Done</span>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4">
            Set New
            <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mt-2">
              Password
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
            Create a strong password to secure your account.
          </p>

          <div className="space-y-3">
            {[
              'At least 6 characters long',
              'Mix of uppercase & lowercase',
              'Include numbers and symbols'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span className="text-muted-foreground text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs flex-shrink-0">
          <div className="text-muted-foreground">
            © 2026 Unicorn EV Bikes
          </div>
          <div className="flex items-center space-x-4">
            {['Privacy', 'Terms', 'Support'].map((link) => (
              <a 
                key={link}
                href="#" 
                className="text-muted-foreground hover:text-cyan-400 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-8 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-card/90 backdrop-blur-sm border-border shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center mb-4">
                  <div className="lg:hidden bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-cyan-500/30">
                    <img 
                      src={Logo} 
                      alt="Unicorn EV Bikes Logo" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="hidden lg:flex w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 items-center justify-center shadow-lg shadow-cyan-500/50">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Create New Password
                </h2>
                <p className="text-muted-foreground text-sm">
                  Your new password must be different from previous passwords
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground font-medium text-sm">
                    New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors z-10" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 pr-10 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-cyan-400 transition-colors z-10"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className={`font-medium ${
                          passwordStrength < 40 ? 'text-red-500' : 
                          passwordStrength < 70 ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors z-10" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-cyan-400 transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <div className="flex items-center space-x-2 text-xs">
                      {newPassword === confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-red-500"></div>
                          <span className="text-red-500">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
                  {!loading && (
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:hidden text-center text-xs text-muted-foreground mt-6">
            © 2026 Unicorn EV Bikes. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
