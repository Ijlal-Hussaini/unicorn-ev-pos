import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [resendTimer, setResendTimer] = useState(60); // 1 minute cooldown for resend
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const inputRefs = useRef([]);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Timer countdown for OTP expiry
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Timer countdown for resend cooldown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter all 6 digits',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      toast({
        title: 'OTP Verified!',
        description: 'Please set your new password.',
        variant: 'success',
      });

      setTimeout(() => {
        navigate('/reset-password', { state: { email, otp: otpString } });
      }, 500);
    } catch (err) {
      toast({
        title: 'Verification Failed',
        description: err.message || 'Invalid or expired OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      toast({
        title: 'OTP Resent!',
        description: 'A new verification code has been sent to your email.',
        variant: 'success',
      });

      setTimer(600); // Reset OTP expiry timer
      setResendTimer(60); // Reset resend cooldown to 1 minute
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
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
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-500/30 w-fit mb-8">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-medium">Secure Verification</span>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4">
            Check Your
            <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mt-2">
              Email
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
            We've sent a 6-digit verification code to <span className="text-foreground font-medium">{email}</span>
          </p>

          <div className="space-y-3">
            {[
              'Enter the 6-digit code',
              'Code expires in 10 minutes',
              'Check your spam folder'
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
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Enter Verification Code
                </h2>
                <p className="text-muted-foreground text-sm">
                  Code sent to {email}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* OTP Input */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-background border-2 border-border rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all outline-none text-foreground"
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Code expires in{' '}
                    <span className={`font-semibold ${timer < 60 ? 'text-red-500' : 'text-cyan-400'}`}>
                      {formatTime(timer)}
                    </span>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
                  {!loading && (
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>
              </form>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResend}
                  disabled={resending || resendTimer > 0}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                  {resending 
                    ? 'Resending...' 
                    : resendTimer > 0 
                      ? `Resend Code (${resendTimer}s)` 
                      : 'Resend Code'}
                </Button>
              </div>

              {/* Back */}
              <div className="mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/forgot-password')}
                  className="w-full text-muted-foreground hover:text-foreground group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>
              </div>
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

export default VerifyOTP;
