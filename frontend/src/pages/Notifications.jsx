import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Bell,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  CheckCheck,
  Trash2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import NavigationPanel from '../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, salesAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, sales, stock

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 10 minutes
    const interval = setInterval(fetchNotifications, 600000); // 600000ms = 10 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
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
            category: 'stock',
            icon: AlertTriangle,
            iconColor: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
            title: 'Out of Stock',
            message: `${product.name || product.model} - 0 units left`,
            details: `Category: ${product.category}`,
            time: 'Now',
            timestamp: new Date(),
            unread: true,
            clickable: false
          });
        });

        // Low stock items (1-10 units)
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10);
        lowStock.forEach(product => {
          newNotifications.push({
            id: `low-${product._id}`,
            type: 'low-stock',
            category: 'stock',
            icon: Package,
            iconColor: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20',
            title: 'Low Stock Alert',
            message: `${product.name || product.model} - Only ${product.stock} unit${product.stock > 1 ? 's' : ''} left`,
            details: `Category: ${product.category}`,
            time: 'Now',
            timestamp: new Date(),
            unread: true,
            clickable: false
          });
        });

        // Recent sales (last 20)
        const recentSales = sales.slice(0, 20);
        recentSales.forEach(sale => {
          const saleDate = new Date(sale.createdAt);
          const timeAgo = getTimeAgo(saleDate);
          newNotifications.push({
            id: `sale-${sale._id}`,
            type: 'sale',
            category: 'sales',
            icon: ShoppingCart,
            iconColor: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            title: 'New Sale',
            message: `${sale.customer} purchased ${sale.model}`,
            details: `Amount: Rs. ${sale.total?.toLocaleString()} • Payment: ${sale.paymentMethod}`,
            time: timeAgo,
            timestamp: saleDate,
            unread: timeAgo.includes('m') || timeAgo.includes('s'), // Mark as unread if less than 1 hour
            clickable: true,
            action: () => navigate(`/sales/view/${sale._id}`)
          });
        });

        // Sort notifications: unread first, then by timestamp
        const sortedNotifications = newNotifications.sort((a, b) => {
          if (a.unread !== b.unread) return b.unread - a.unread;
          return b.timestamp - a.timestamp;
        });

        setNotifications(sortedNotifications);
      } else {
        // Sales users get no notifications
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
    toast({
      title: 'Success',
      description: 'All notifications marked as read',
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: 'Success',
      description: 'Notification deleted',
    });
  };

  const handleNotificationClick = (notification, e) => {
    console.log('Notification clicked:', notification.type, 'clickable:', notification.clickable);
    
    // Prevent default if clicking on buttons inside
    if (e?.target?.closest('button')) {
      console.log('Button clicked, ignoring');
      return;
    }
    
    // Don't navigate if notification is not clickable
    if (!notification.clickable) {
      console.log('Notification not clickable, ignoring');
      return;
    }
    
    console.log('Proceeding with navigation');
    markAsRead(notification.id);
    if (notification.action) {
      notification.action();
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread;
    if (filter === 'sales') return n.category === 'sales';
    if (filter === 'stock') return n.category === 'stock';
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;
  const stockCount = notifications.filter(n => n.category === 'stock').length;
  const salesCount = notifications.filter(n => n.category === 'sales').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      <Navbar />
      <NavigationPanel />

      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Alerts</p>
                  <p className="text-2xl font-bold text-foreground">{stockCount}</p>
                </div>
                <Package className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sales</p>
                  <p className="text-2xl font-bold text-foreground">{salesCount}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={filter === 'unread' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'stock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('stock')}
                className={filter === 'stock' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Stock Alerts ({stockCount})
              </Button>
              <Button
                variant={filter === 'sales' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('sales')}
                className={filter === 'sales' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
              >
                Sales ({salesCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl">
              {filter === 'all' && 'All Notifications'}
              {filter === 'unread' && 'Unread Notifications'}
              {filter === 'stock' && 'Stock Alerts'}
              {filter === 'sales' && 'Sales Notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No notifications to display</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => {
                  const Icon = notification.icon;
                  const isClickable = notification.clickable;
                  
                  return (
                    <div
                      key={notification.id}
                      {...(isClickable && { onClick: (e) => handleNotificationClick(notification, e) })}
                      className={`p-4 sm:p-6 transition-colors border-l-4 ${notification.borderColor} ${
                        isClickable ? 'cursor-pointer hover:bg-accent/30' : 'cursor-default'
                      } ${notification.unread ? 'bg-accent/20' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${notification.bgColor} flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${notification.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">
                                {notification.title}
                              </h3>
                              {notification.unread && (
                                <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mb-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {notification.details}
                          </p>
                          <div className="flex items-center gap-2">
                            {notification.unread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs"
                              >
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
