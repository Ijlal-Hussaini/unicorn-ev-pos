import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Zap, Shield, TrendingUp, BarChart3, Package, Users } from 'lucide-react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import ThemeToggle from '../components/ThemeToggle';
import { authAPI } from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('rememberedEmail');
    return savedRememberMe === 'true' && savedEmail ? savedEmail : '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
  
  useEffect(() => {
    // Reset form state when component unmounts
    return () => {
      setEmail('');
      setPassword('');
      setShowPassword(false);
    };
  }, []);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    dispatch(loginStart());
    
    try {
      const response = await authAPI.login(email, password);
      
      localStorage.setItem('user', JSON.stringify(response.data));
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }
      
      dispatch(loginSuccess({
        user: response.data,
      }));
      
      toast({
        title: 'Login Successful!',
        description: `Welcome back, ${response.data.username}!`,
        variant: 'success',
      });
      
      setTimeout(() => {
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/sales/dashboard');
        }
      }, 500);
    } catch (err) {
      dispatch(loginFailure(err.message || 'Login failed'));
      
      toast({
        title: 'Login Failed',
        description: err.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-x-hidden bg-background">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 md:top-5 md:right-5 z-50">
        <ThemeToggle className="bg-card/90 backdrop-blur-sm border-border" />
      </div>

      {/* Left Panel - Branding & Features - Hidden on small screens */}
      <div className="hidden lg:flex w-full lg:w-[45%] relative flex-col bg-gradient-to-br from-cyan-500/5 via-background to-blue-500/5 lg:border-r border-border lg:min-h-screen">
        {/* Ambient Effects */}
        <div className="absolute top-10 left-10 md:top-20 md:left-20 w-48 h-48 md:w-72 md:h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 md:bottom-20 md:right-20 w-40 h-40 md:w-64 md:h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-60"></div>
              <div className="relative bg-card rounded-2xl p-2.5 border border-cyan-500/30">
                <img 
                  src={Logo} 
                  alt="Unicorn EV Bikes Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Unicorn EV Bikes
              </h1>
              <p className="text-muted-foreground text-xs">Point of Sale System</p>
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 rounded-full px-3 py-1.5 border border-cyan-500/30 w-fit mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-cyan-400 text-xs font-medium">Advanced POS Platform</span>
            </div>
            
            {/* Hero Text */}
            <h2 className="text-4xl font-bold text-foreground leading-tight mb-3">
              Streamline Your
              <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mt-1">
                Sales Operations
              </span>
            </h2>
            
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-md text-sm">
              Complete point-of-sale solution designed for electric vehicle dealers. Fast, secure, and powerful.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-md">
              {[
                { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live sales tracking' },
                { icon: Package, title: 'Inventory Sync', desc: 'Auto stock updates' },
                { icon: Zap, title: 'Lightning Fast', desc: 'Instant processing' },
                { icon: Shield, title: 'Bank-level Security', desc: 'Encrypted data' }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="bg-card/60 backdrop-blur-sm rounded-xl p-3 border border-border hover:border-cyan-500/50 transition-all group"
                >
                  <feature.icon className="w-5 h-5 text-cyan-400 mb-1.5" />
                  <h3 className="text-foreground font-semibold text-xs mb-0.5">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-6 pt-5 border-t border-border max-w-md">
              {[
                { value: '500+', label: 'Active Users', icon: Users },
                { value: '50K+', label: 'Bikes Sold', icon: Package },
                { value: '99.9%', label: 'Uptime', icon: TrendingUp }
              ].map((stat, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground text-xs">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 Unicorn EV Bikes</span>
            <div className="flex items-center space-x-4">
              {['Privacy', 'Terms', 'Support'].map((link) => (
                <a 
                  key={link}
                  href="#" 
                  className="hover:text-cyan-400 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form - Full width on small screens */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 md:p-8 lg:p-10 relative min-h-screen">
        {/* Decorative circles - behind content */}
        <div className="absolute top-6 right-6 md:top-10 md:right-10 w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-cyan-500/20 pointer-events-none"></div>
        <div className="absolute top-10 right-10 md:top-16 md:right-16 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-blue-500/20 pointer-events-none"></div>
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-cyan-500/20 pointer-events-none"></div>
        
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border shadow-2xl relative z-10">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8 text-center">
              {/* Logo on mobile only */}
              <div className="lg:hidden flex flex-col items-center mb-6">
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-md opacity-60"></div>
                  <div className="relative bg-card rounded-xl p-2 border border-cyan-500/30">
                    <img 
                      src={Logo} 
                      alt="Unicorn EV Bikes Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Unicorn EV Bikes
                  </h1>
                  <p className="text-muted-foreground text-xs">Point of Sale System</p>
                </div>
              </div>

              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-3 md:mb-4 mx-auto">
                <Lock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                Sign In
              </h2>
              <p className="text-muted-foreground text-sm">
                Access your POS dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-9 h-10 bg-background border-border focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground font-medium text-sm">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-9 h-10 bg-background border-border focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="border-border data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 md:h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl transition-all group disabled:opacity-50 mt-5 md:mt-6"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                {!loading && (
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5 md:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">Need Help?</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have access?{' '}
                <Button 
                  variant="link" 
                  className="text-cyan-400 hover:text-cyan-300 p-0 h-auto font-semibold text-sm"
                >
                  Contact Admin
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;