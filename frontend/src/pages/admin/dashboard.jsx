import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  DollarSign, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Calendar,
  Loader2
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { salesAPI, productsAPI } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days
  const [chartView, setChartView] = useState('revenue'); // revenue or units

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [salesStatsRes, inventoryStatsRes, salesRes, chartRes] = await Promise.all([
        salesAPI.getStats(),
        productsAPI.getStats(),
        salesAPI.getAll({ sortBy: 'createdAt', order: 'desc' }),
        salesAPI.getChartData({ groupBy: 'month' })
      ]);

      setSalesStats(salesStatsRes.data);
      setInventoryStats(inventoryStatsRes.data);
      setRecentSales(salesRes.data.slice(0, 5)); // Get latest 5 sales
      setChartData(chartRes.data);
      
      // Calculate bikes and accessories sold separately from sales data
      const allSales = salesRes.data || [];
      
      // Count bikes and accessories sold separately
      let bikesSold = 0;
      let accessoriesSold = 0;
      
      allSales.forEach(sale => {
        // Only count completed sales
        if (sale.status !== 'completed') return;
        
        // Get the category from the populated product field
        const productCategory = sale.product?.category;
        const quantity = sale.quantity || 1;
        
        // Check if the sale's product is in Accessories category
        if (productCategory && productCategory.toLowerCase() === 'accessories') {
          accessoriesSold += quantity;
        } else {
          // Everything else is considered a bike (EV Bikes, Scooters, etc.)
          bikesSold += quantity;
        }
      });
      
      // Update salesStats with separate counts
      setSalesStats(prev => ({
        ...prev,
        bikesSold: bikesSold,
        accessoriesSold: accessoriesSold
      }));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const saleDate = new Date(date);
    const diffInMinutes = Math.floor((now - saleDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle date range change
  const handleDateRangeChange = async (days) => {
    setDateRange(days);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    try {
      const [salesStatsRes, salesRes, chartRes] = await Promise.all([
        salesAPI.getStats({ 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        }),
        salesAPI.getAll({ sortBy: 'createdAt', order: 'desc' }),
        salesAPI.getChartData({ groupBy: 'month' })
      ]);

      setSalesStats(salesStatsRes.data);
      setRecentSales(salesRes.data.slice(0, 5));
      setChartData(chartRes.data);
      
      toast({
        title: 'Updated',
        description: `Showing data for last ${days} days`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update date range',
        variant: 'destructive',
      });
    }
  };



  // Handle stat card click
  const handleStatClick = (statTitle) => {
    switch(statTitle) {
      case 'Total Revenue':
      case 'Bikes Sold':
        navigate('/sales/records');
        break;
      case 'Accessories Sold':
        navigate('/sales/records');
        break;
      case 'Inventory Stock':
        navigate('/inventory/manage');
        break;
      default:
        break;
    }
  };

  // Stats configuration
  const stats = [
    { 
      title: 'Total Revenue', 
      value: salesStats ? formatCurrency(salesStats.totalRevenue) : 'Rs. 0', 
      change: '+12.5%', 
      trend: 'up', 
      icon: DollarSign,
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      title: 'Bikes Sold', 
      value: salesStats?.bikesSold?.toString() || '0', 
      change: '+8.2%', 
      trend: 'up', 
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-600'
    },
    { 
      title: 'Accessories Sold', 
      value: salesStats?.accessoriesSold?.toString() || '0', 
      change: '+0', 
      trend: 'up', 
      icon: Package,
      color: 'from-violet-500 to-purple-600'
    },
    { 
      title: 'Inventory Stock', 
      value: inventoryStats ? inventoryStats.totalItems.toString() : '0', 
      change: inventoryStats?.lowStockItems ? `-${inventoryStats.lowStockItems}` : '0', 
      trend: inventoryStats?.lowStockItems > 0 ? 'down' : 'up',
      icon: Package,
      color: 'from-orange-500 to-red-600'
    }
  ];

  // Top models from sales stats
  const topModels = salesStats?.topProducts?.slice(0, 4).map(product => ({
    name: product.model,
    sales: product.totalQuantity,
    revenue: formatCurrency(product.totalRevenue),
    trend: '+' + Math.floor(Math.random() * 20) + '%' // You can calculate this from historical data
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
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
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <Navbar />
      <NavigationPanel />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-8 pt-44 sm:pt-40">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
            <p className="text-slate-400 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Tuesday, February 03, 2026</span>
            </p>
          </div>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-4 py-2 bg-accent/50 border border-border rounded-lg text-sm hover:bg-accent transition-colors text-foreground appearance-none pr-10 cursor-pointer"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                onClick={() => handleStatClick(stat.title)}
                className="group relative bg-card/90 border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 overflow-hidden backdrop-blur-sm cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                ></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm font-semibold ${
                      stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-card/90 border border-border rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold mb-1 text-foreground">Sales Performance</h3>
                <p className="text-muted-foreground text-sm">Monthly revenue trends</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setChartView('revenue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    chartView === 'revenue' 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-accent text-muted-foreground hover:bg-accent/80'
                  }`}
                >
                  Revenue
                </button>
                <button 
                  onClick={() => setChartView('units')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    chartView === 'units' 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-accent text-muted-foreground hover:bg-accent/80'
                  }`}
                >
                  Units
                </button>
              </div>
            </div>
            
            {/* Simple bar chart visualization */}
            <div className="space-y-4">
              {chartData.length > 0 ? (
                chartData.slice(-6).map((data, index) => {
                  const maxValue = chartView === 'revenue' 
                    ? Math.max(...chartData.map(d => d.revenue))
                    : Math.max(...chartData.map(d => d.sales));
                  const value = chartView === 'revenue' ? data.revenue : data.sales;
                  const width = (value / maxValue) * 100;
                  return (
                    <div key={data._id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium w-24">{data._id}</span>
                        <span className="text-foreground font-semibold">
                          {chartView === 'revenue' ? formatCurrency(data.revenue) : `${data.sales} units`}
                        </span>
                      </div>
                      <div className="relative h-8 bg-accent/50 rounded-lg overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${width}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available
                </div>
              )}
            </div>
          </div>

          {/* Top Models */}
          <div className="bg-card/90 border border-border rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold mb-1 text-foreground">Top Models</h3>
                <p className="text-muted-foreground text-sm">Best sellers this month</p>
              </div>
              <PieChart className="w-5 h-5 text-cyan-400" />
            </div>
            
            <div className="space-y-4">
              {topModels.length > 0 ? (
                topModels.map((model, index) => {
                  const maxSales = Math.max(...topModels.map(m => m.sales));
                  return (
                    <div key={index} className="group p-4 bg-accent/30 rounded-xl hover:bg-accent/50 transition-all cursor-pointer border border-transparent hover:border-cyan-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-foreground">{model.name}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                          {model.trend}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{model.sales} units</span>
                        <span className="text-cyan-400 font-semibold">{model.revenue}</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${(model.sales / maxSales) * 100}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-card/90 border border-border rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1 text-foreground">Recent Sales</h3>
              <p className="text-muted-foreground text-sm">Latest transactions from your showroom</p>
            </div>
            <button 
              onClick={() => navigate('/sales/records')}
              className="text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition-colors flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? (
                  recentSales.map((sale, index) => (
                    <tr 
                      key={sale._id}
                      onClick={() => navigate(`/sales/records`)}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                      style={{ 
                        animation: 'slideIn 0.3s ease-out',
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <td className="py-4 px-4">
                        <span className="font-semibold text-foreground">{sale.model}</span>
                      </td>
                      <td className="py-4 px-4 text-foreground">{sale.customer}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-cyan-400">{formatCurrency(sale.total)}</span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">{getTimeAgo(sale.createdAt)}</td>
                      <td className="py-4 px-4">
                        <Badge className={
                          sale.status === 'completed' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-0' 
                            : sale.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-400 border-0'
                            : sale.status === 'pending'
                            ? 'bg-orange-500/20 text-orange-400 border-0'
                            : sale.status === 'refunded'
                            ? 'bg-purple-500/20 text-purple-400 border-0'
                            : 'bg-red-500/20 text-red-400 border-0'
                        }>
                          {sale.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-muted-foreground">
                      No recent sales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div 
            onClick={() => navigate('/sales/records')}
            className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all cursor-pointer group backdrop-blur-sm"
          >
            <ShoppingCart className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-2 text-foreground">Sales Records</h4>
            <p className="text-muted-foreground text-sm">Check out the sales</p>
          </div>
          
          <div 
            onClick={() => navigate('/inventory/manage')}
            className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer group backdrop-blur-sm"
          >
            <Package className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-2 text-foreground">Manage Inventory</h4>
            <p className="text-muted-foreground text-sm">Add or update stock</p>
          </div>
          
          <div 
            onClick={() => navigate('/reports/analytics')}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-emerald-500/20 transition-all cursor-pointer group backdrop-blur-sm"
          >
            <BarChart3 className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-2 text-foreground">View Reports</h4>
            <p className="text-muted-foreground text-sm">Detailed analytics</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;