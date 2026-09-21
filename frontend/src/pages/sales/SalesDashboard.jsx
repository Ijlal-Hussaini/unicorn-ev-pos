import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  Package,
  Plus,
  ArrowUpRight,
  Calendar,
  Loader2,
  Award,
  Target
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { salesAPI, productsAPI } from '../../services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [mySales, setMySales] = useState([]);
  const [myStats, setMyStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    pendingOrders: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales data
      const salesRes = await salesAPI.getAll({ sortBy: 'createdAt', order: 'desc' });
      const allSales = salesRes.data || [];
      
      // Filter sales by current user
      const userSales = allSales.filter(sale => sale.soldBy?._id === user?._id);
      setMySales(userSales.slice(0, 5));
      
      // Calculate stats (excluding refunded sales and using net revenue)
      const completedSales = userSales.filter(s => s.status === 'completed' || s.status === 'refunded');
      
      // Calculate net revenue (total - refunded amount)
      const totalRevenue = completedSales.reduce((sum, sale) => {
        const netRevenue = sale.total - (sale.refundedAmount || 0);
        return sum + netRevenue;
      }, 0);
      
      // Count only non-refunded sales
      const activeSalesCount = completedSales.filter(s => s.status !== 'refunded').length;
      const pendingSales = userSales.filter(s => s.status === 'pending').length;
      
      setMyStats({
        totalSales: activeSalesCount,
        totalRevenue: totalRevenue,
        avgOrderValue: activeSalesCount > 0 ? totalRevenue / activeSalesCount : 0,
        pendingOrders: pendingSales
      });
      
      // Fetch low stock products
      const productsRes = await productsAPI.getAll();
      const products = productsRes.data || [];
      const lowStock = products.filter(p => p.stock > 0 && p.stock < (p.minStock || 10)).slice(0, 5);
      setLowStockProducts(lowStock);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const saleDate = new Date(date);
    const diffInMinutes = Math.floor((now - saleDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const stats = [
    { 
      title: 'My Total Sales', 
      value: myStats.totalSales.toString(), 
      icon: ShoppingCart,
      color: 'from-cyan-500 to-blue-600',
      change: 'This month'
    },
    { 
      title: 'Total Revenue', 
      value: formatCurrency(myStats.totalRevenue), 
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      change: 'Earned'
    },
    { 
      title: 'Avg Order Value', 
      value: formatCurrency(myStats.avgOrderValue), 
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-600',
      change: 'Per sale'
    },
    { 
      title: 'Pending Orders', 
      value: myStats.pendingOrders.toString(), 
      icon: Package,
      color: 'from-orange-500 to-red-600',
      change: 'To complete'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] pt-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Sales Dashboard</h2>
            <p className="text-muted-foreground flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Welcome back, {user?.username}!</span>
            </p>
          </div>
          <Button 
            onClick={() => navigate('/sales/new')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-card/90 border-border backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales */}
          <div className="lg:col-span-2">
            <Card className="bg-card/90 border-border backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">My Recent Sales</h3>
                    <p className="text-sm text-muted-foreground">Your latest transactions</p>
                  </div>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate('/sales/history')}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {mySales.length > 0 ? (
                    mySales.map((sale) => (
                      <div 
                        key={sale._id}
                        className="flex items-center justify-between p-4 bg-accent/30 rounded-xl hover:bg-accent/50 transition-all cursor-pointer"
                        onClick={() => navigate('/sales/history')}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{sale.model}</p>
                          <p className="text-sm text-muted-foreground">{sale.customer}</p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="font-semibold text-cyan-400">{formatCurrency(sale.total)}</p>
                          <p className="text-xs text-muted-foreground">{getTimeAgo(sale.createdAt)}</p>
                        </div>
                        <Badge className={
                          sale.status === 'completed' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-0' 
                            : sale.status === 'pending'
                            ? 'bg-orange-500/20 text-orange-400 border-0'
                            : sale.status === 'refunded'
                            ? 'bg-purple-500/20 text-purple-400 border-0'
                            : 'bg-blue-500/20 text-blue-400 border-0'
                        }>
                          {sale.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No sales yet</p>
                      <Button 
                        onClick={() => navigate('/sales/new')}
                        className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600"
                      >
                        Create Your First Sale
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          <div>
            <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Low Stock Alert</h3>
                    <p className="text-sm text-muted-foreground">Products running low</p>
                  </div>
                  <Package className="w-5 h-5 text-orange-400" />
                </div>

                <div className="space-y-3">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <div 
                        key={product._id}
                        className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg"
                      >
                        <p className="font-semibold text-sm text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{product.model}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-orange-400">Only {product.stock} left</span>
                          <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">
                            Low Stock
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">All products well stocked</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <Target className="w-10 h-10 text-cyan-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Sales Target</h4>
                <p className="text-muted-foreground text-sm mb-4">Keep up the great work!</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-cyan-400">{myStats.totalSales} / 20</span>
                  </div>
                  <div className="h-2 bg-accent/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((myStats.totalSales / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div 
            onClick={() => navigate('/sales/new')}
            className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all cursor-pointer group backdrop-blur-sm"
          >
            <Plus className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-2">Create New Sale</h4>
            <p className="text-muted-foreground text-sm">Record a new transaction</p>
          </div>
          
          <div 
            onClick={() => navigate('/sales/products')}
            className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer group backdrop-blur-sm"
          >
            <Package className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-2">Browse Products</h4>
            <p className="text-muted-foreground text-sm">View available inventory</p>
          </div>
          
          <div 
            onClick={() => navigate('/sales/history')}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-emerald-500/20 transition-all cursor-pointer group backdrop-blur-sm"
          >
            <Award className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-2">Sales History</h4>
            <p className="text-muted-foreground text-sm">View all your sales</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
