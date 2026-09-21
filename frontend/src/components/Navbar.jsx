import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Search, Settings, LogOut, Menu, X, User, ChevronDown, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from './ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { authAPI, productsAPI, salesAPI } from '../services/api';
import { logout } from '../store/authSlice';
import { useToast } from '@/hooks/use-toast';

const Navbar = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications on mount and every 10 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 600000); // Refresh every 10 minutes (600000ms)
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      const newNotifications = [];

      // Only Admin gets notifications
      if (user?.role === 'admin') {
        // Fetch products and sales in parallel
        const [productsRes, salesRes] = await Promise.all([
          productsAPI.getAll(),
          salesAPI.getAll({ sortBy: 'createdAt', order: 'desc' })
        ]);

        const products = productsRes.data || [];
        const sales = salesRes.data || [];

        // Out of stock items
        const outOfStock = products.filter(p => p.stock === 0);
        outOfStock.forEach(product => {
          newNotifications.push({
            id: `out-${product._id}`,
            type: 'out-of-stock',
            icon: AlertTriangle,
            iconColor: 'text-red-400',
            bgColor: 'bg-red-500/10',
            title: 'Out of Stock',
            message: `${product.name || product.model} - 0 units left`,
            time: 'Now',
            unread: true,
            clickable: false
          });
        });

        // Low stock items (1-10 units)
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10);
        lowStock.slice(0, 5).forEach(product => {
          newNotifications.push({
            id: `low-${product._id}`,
            type: 'low-stock',
            icon: Package,
            iconColor: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            title: 'Low Stock Alert',
            message: `${product.name || product.model} - Only ${product.stock} unit${product.stock > 1 ? 's' : ''} left`,
            time: 'Now',
            unread: true,
            clickable: false
          });
        });

        // Recent sales (last 5)
        const recentSales = sales.slice(0, 5);
        recentSales.forEach(sale => {
          const timeAgo = getTimeAgo(new Date(sale.createdAt));
          newNotifications.push({
            id: `sale-${sale._id}`,
            type: 'sale',
            icon: ShoppingCart,
            iconColor: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            title: 'New Sale',
            message: `${sale.customer} purchased ${sale.model}`,
            time: timeAgo,
            unread: timeAgo.includes('m') || timeAgo.includes('s'), // Mark as unread if less than 1 hour
            clickable: true,
            action: () => navigate(`/sales/view/${sale._id}`)
          });
        });

        // Sort notifications: unread first, then by type priority
        const sortedNotifications = newNotifications.sort((a, b) => {
          if (a.unread !== b.unread) return b.unread - a.unread;
          const typePriority = { 'out-of-stock': 3, 'low-stock': 2, 'sale': 1 };
          return typePriority[b.type] - typePriority[a.type];
        });

        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter(n => n.unread).length);
      } else {
        // Sales users get no notifications
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const handleLogout = useCallback(async () => {
    try {
      await authAPI.logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
        variant: 'success',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      navigate('/');
    }
  }, [dispatch, navigate, toast]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  }, [searchQuery, navigate]);

  const handleNotificationClick = (notification) => {
    // Don't navigate if notification is not clickable (stock alerts)
    if (!notification.clickable) {
      return;
    }
    
    if (notification.action) {
      notification.action();
      setShowNotifications(false);
    }
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogoClick = () => {
    navigate('/admin/dashboard');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    const names = user.username?.split(' ') || [];
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center space-x-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src={Logo} 
              alt="Unicorn EV Bikes Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Unicorn EV Bikes
              </h1>
              <p className="text-xs text-muted-foreground tracking-wider uppercase">
                {user?.role === 'admin' ? 'Admin Portal' : 'Sales Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 justify-end">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="pl-10 bg-background/50 border-border text-foreground placeholder-muted-foreground focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Popover */}
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative hover:bg-accent text-muted-foreground hover:text-foreground"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                      <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 bg-card border-border p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-cyan-400 hover:text-cyan-300 h-auto p-1"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notification) => {
                        const Icon = notification.icon;
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 transition-colors ${
                              notification.clickable ? 'cursor-pointer hover:bg-accent/50' : 'cursor-default'
                            } ${notification.unread ? 'bg-accent/20' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${notification.bgColor}`}>
                                <Icon className={`w-4 h-4 ${notification.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {notification.title}
                                  </p>
                                  {notification.unread && (
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1"></span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/notifications');
                      }}
                      className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSettingsClick}
              className="hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 pl-4 border-l border-border cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="w-10 h-10 border-2 border-cyan-500">
                    {user?.profilePhoto ? (
                      <AvatarImage src={user.profilePhoto} alt={user.username} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden xl:flex items-center space-x-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {user?.username || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuLabel className="text-foreground">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                    <p className="text-xs font-semibold text-cyan-400 uppercase mt-1">
                      {user?.role === 'admin' ? '👑 Admin' : '💼 Sales'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center space-x-2">
            {/* Mobile Search Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Theme Toggle Mobile */}
            <ThemeToggle />

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card border-border text-foreground w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* User Profile in Mobile */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-border">
                    <Avatar className="w-12 h-12 border-2 border-cyan-500">
                      {user?.profilePhoto ? (
                        <AvatarImage src={user.profilePhoto} alt={user.username} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {user?.username || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || 'user@example.com'}
                      </p>
                      <p className="text-xs font-semibold text-cyan-400 uppercase mt-1">
                        {user?.role === 'admin' ? '👑 Admin' : '💼 Sales'}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Menu Items */}
                  <div className="space-y-2">
                    <Button 
                      variant="ghost"
                      onClick={() => navigate('/profile')}
                      className="w-full justify-start hover:bg-accent text-foreground"
                    >
                      <User className="w-5 h-5 mr-3" />
                      My Profile
                    </Button>

                    <Button 
                      variant="ghost"
                      onClick={() => {
                        setShowNotifications(true);
                      }}
                      className="w-full justify-start hover:bg-accent text-foreground"
                    >
                      <Bell className="w-5 h-5 mr-3" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>

                    <Button 
                      variant="ghost"
                      onClick={handleSettingsClick}
                      className="w-full justify-start hover:bg-accent text-foreground"
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      Settings
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="w-full justify-start hover:bg-red-500/10 text-red-400"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar (Expandable) */}
        {isSearchOpen && (
          <div className="lg:hidden mt-4 animate-in slide-in-from-top-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="pl-10 pr-10 bg-background/50 border-border text-foreground placeholder-muted-foreground focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
