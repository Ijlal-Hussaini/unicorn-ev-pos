import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      toast({
        title: 'OTP Sent!',
        description: 'Please check your email for the verification code.',
        variant: 'success',
      });

      // Navigate to verify OTP page with email
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 500);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send OTP. Please try again.',
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
        {/* Logo & Brand */}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-xl py-8">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-500/30 w-fit mb-8">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-medium">Secure Password Recovery</span>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4">
            Reset Your
            <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mt-2">
              Password
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>

          {/* Security Features */}
          <div className="space-y-3">
            {[
              'OTP valid for 10 minutes',
              'Secure email verification',
              'One-time use code'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span className="text-muted-foreground text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
              {/* Header */}
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
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Forgot Password?
                </h2>
                <p className="text-muted-foreground text-sm">
                  No worries, we'll send you reset instructions
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium text-sm">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors z-10" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      className="pl-10 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                  {!loading && (
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="w-full text-muted-foreground hover:text-foreground group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Footer */}
          <div className="lg:hidden text-center text-xs text-muted-foreground mt-6">
            © 2026 Unicorn EV Bikes. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
