import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  Printer
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { salesAPI, productsAPI } from '../../services/api';
import { useToast } from '@/hooks/use-toast';
import Logo from '../../assets/Logo.png';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const Reports = () => {
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  
  // State for dynamic data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch sales and products data in parallel for better performance
      const [salesRes, productsRes] = await Promise.all([
        salesAPI.getAll({ sortBy: 'createdAt', order: 'desc' }),
        productsAPI.getAll()
      ]);
      
      const allSales = (salesRes.data || []).filter(s => s.status === 'completed');
      const allProducts = productsRes.data || [];
      
      console.log('Fetched sales:', allSales.length, 'products:', allProducts.length);
      
      // Calculate date ranges based on period
      const now = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();
      let previousEndDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          previousStartDate.setDate(now.getDate() - 14);
          previousEndDate.setDate(now.getDate() - 7);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          previousStartDate.setFullYear(now.getFullYear() - 2);
          previousEndDate.setFullYear(now.getFullYear() - 1);
          break;
        default: // month
          startDate.setMonth(now.getMonth() - 1);
          previousStartDate.setMonth(now.getMonth() - 2);
          previousEndDate.setMonth(now.getMonth() - 1);
      }
      
      // Filter sales by period
      const currentSales = allSales.filter(s => new Date(s.createdAt) >= startDate);
      const previousSales = allSales.filter(s => {
        const date = new Date(s.createdAt);
        return date >= previousStartDate && date <= previousEndDate;
      });
      
      // Store current sales for customer report (use ref instead of window to prevent memory leaks)
      if (typeof window !== 'undefined') {
        window.currentSalesData = currentSales;
      }
      
      // Calculate dashboard stats
      const currentRevenue = currentSales.reduce((sum, s) => sum + s.total, 0);
      const previousRevenue = previousSales.reduce((sum, s) => sum + s.total, 0);
      const currentProducts = currentSales.reduce((sum, s) => sum + s.quantity, 0);
      const previousProducts = previousSales.reduce((sum, s) => sum + s.quantity, 0);
      
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return parseFloat((((current - previous) / previous) * 100).toFixed(1));
      };
      
      setDashboardStats({
        revenue: {
          value: currentRevenue,
          change: calculateChange(currentRevenue, previousRevenue),
          trend: currentRevenue >= previousRevenue ? 'up' : 'down',
        },
        sales: {
          value: currentSales.length,
          change: calculateChange(currentSales.length, previousSales.length),
          trend: currentSales.length >= previousSales.length ? 'up' : 'down',
        },
        customers: {
          value: new Set(currentSales.map(s => s.customer)).size,
          change: calculateChange(
            new Set(currentSales.map(s => s.customer)).size,
            new Set(previousSales.map(s => s.customer)).size
          ),
          trend: new Set(currentSales.map(s => s.customer)).size >= new Set(previousSales.map(s => s.customer)).size ? 'up' : 'down',
        },
        products: {
          value: currentProducts,
          change: calculateChange(currentProducts, previousProducts),
          trend: currentProducts >= previousProducts ? 'up' : 'down',
        },
      });
      
      // Calculate revenue trend (last 6 months)
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 6);
      const recentSales = allSales.filter(s => new Date(s.createdAt) >= monthsAgo);
      
      const monthlyData = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      recentSales.forEach(sale => {
        const date = new Date(sale.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthNames[date.getMonth()],
            revenue: 0,
            sales: 0,
          };
        }
        monthlyData[monthKey].revenue += sale.total;
        monthlyData[monthKey].sales += 1;
      });
      
      const trendData = Object.values(monthlyData).sort((a, b) => {
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      });
      
      setRevenueTrend(trendData);
      
      // Calculate category breakdown
      const categoryMap = {};
      currentSales.forEach(sale => {
        const product = allProducts.find(p => p._id === sale.product || p.model === sale.model);
        const category = product?.category || 'Uncategorized';
        
        if (!categoryMap[category]) {
          categoryMap[category] = { value: 0, count: 0 };
        }
        categoryMap[category].value += sale.total;
        categoryMap[category].count += 1;
      });
      
      const totalCategoryValue = Object.values(categoryMap).reduce((sum, cat) => sum + cat.value, 0);
      const categoryData = Object.entries(categoryMap).map(([category, data]) => ({
        category,
        value: data.value,
        percentage: totalCategoryValue > 0 ? Math.round((data.value / totalCategoryValue) * 100) : 0,
        count: data.count,
      })).sort((a, b) => b.value - a.value);
      
      setCategoryBreakdown(categoryData);
      
      // Calculate top products
      const productMap = {};
      currentSales.forEach(sale => {
        const key = sale.product || sale.model;
        if (!productMap[key]) {
          productMap[key] = {
            name: sale.model,
            sales: 0,
            revenue: 0,
          };
        }
        productMap[key].sales += sale.quantity;
        productMap[key].revenue += sale.total;
      });
      
      // Get previous period data for growth
      const previousProductMap = {};
      previousSales.forEach(sale => {
        const key = sale.product || sale.model;
        if (!previousProductMap[key]) {
          previousProductMap[key] = { revenue: 0 };
        }
        previousProductMap[key].revenue += sale.total;
      });
      
      const topProductsData = Object.entries(productMap)
        .map(([key, data]) => {
          const previousRevenue = previousProductMap[key]?.revenue || 0;
          const growth = previousRevenue > 0 
            ? Math.round(((data.revenue - previousRevenue) / previousRevenue) * 100)
            : data.revenue > 0 ? 100 : 0;
          
          return {
            ...data,
            growth: `+${growth}%`,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setTopProducts(topProductsData);
      
      console.log('Report data loaded:', {
        stats: dashboardStats,
        revenueTrend: trendData.length,
        categories: categoryData.length,
        topProducts: topProductsData.length
      });
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast]); // Added toast to dependencies

  // Fetch all report data when component mounts or period changes
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportReport = useCallback(async (type) => {
    try {
      setExporting(type);
      
      // Use setTimeout to defer heavy computation and prevent UI blocking
      setTimeout(() => {
        try {
          const reportHTML = generateReportHTML(type);
          printReport(reportHTML, `${type}-report`);
          
          toast({
            title: 'Success',
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} report sent to printer`,
          });
        } catch (error) {
          console.error('Error exporting report:', error);
          toast({
            title: 'Error',
            description: 'Failed to export report',
            variant: 'destructive',
          });
        } finally {
          setExporting(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
      setExporting(null);
    }
  }, [toast, dashboardStats, revenueTrend, categoryBreakdown, topProducts, selectedPeriod, user]);

  const handleExportAll = useCallback(async () => {
    try {
      setExporting('all');
      
      // Use setTimeout to defer heavy computation and prevent UI blocking
      setTimeout(() => {
        try {
          const reportHTML = generateComprehensiveReport();
          printReport(reportHTML, 'comprehensive-report');
          
          toast({
            title: 'Success',
            description: 'Comprehensive report sent to printer',
          });
        } catch (error) {
          console.error('Error exporting all reports:', error);
          toast({
            title: 'Error',
            description: 'Failed to export reports',
            variant: 'destructive',
          });
        } finally {
          setExporting(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error exporting all reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to export reports',
        variant: 'destructive',
      });
      setExporting(null);
    }
  }, [toast, dashboardStats, revenueTrend, categoryBreakdown, topProducts, selectedPeriod, user]);

  // Print report function
  const printReport = (htmlContent, reportName) => {
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportName} - ${new Date().toLocaleDateString()}</title>
            ${getReportStyles()}
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load before triggering print
      setTimeout(() => {
        printWindow.print();
        // Don't auto-close - let user close manually after printing/saving
      }, 1000);
    }
  };

  // Generate comprehensive report HTML
  const generateComprehensiveReport = () => {
    const periodLabel = getPeriodLabel();
    
    // Create stats array with current data
    const currentStats = [
      { 
        label: 'Total Revenue', 
        value: `Rs. ${(dashboardStats?.revenue.value || 0).toLocaleString()}`, 
        change: `${dashboardStats?.revenue.change >= 0 ? '+' : ''}${dashboardStats?.revenue.change || 0}%`, 
        trend: dashboardStats?.revenue.trend || 'up',
        color: 'from-cyan-500 to-blue-600'
      },
      { 
        label: 'Total Sales', 
        value: (dashboardStats?.sales.value || 0).toString(), 
        change: `${dashboardStats?.sales.change >= 0 ? '+' : ''}${dashboardStats?.sales.change || 0}%`, 
        trend: dashboardStats?.sales.trend || 'up',
        color: 'from-emerald-500 to-teal-600'
      },
      { 
        label: 'New Customers', 
        value: (dashboardStats?.customers.value || 0).toString(), 
        change: `${dashboardStats?.customers.change >= 0 ? '+' : ''}${dashboardStats?.customers.change || 0}%`, 
        trend: dashboardStats?.customers.trend || 'up',
        color: 'from-violet-500 to-purple-600'
      },
      { 
        label: 'Products Sold', 
        value: (dashboardStats?.products.value || 0).toString(), 
        change: `${dashboardStats?.products.change >= 0 ? '+' : ''}${dashboardStats?.products.change || 0}%`, 
        trend: dashboardStats?.products.trend || 'up',
        color: 'from-orange-500 to-red-600'
      },
    ];
    
    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <!-- Header -->
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
                <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
              </div>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">COMPREHENSIVE REPORT</h2>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
            </div>
          </div>
        </div>

        <!-- Report Info -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="bg-gray-50 p-4 rounded">
            <h3 class="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">Report Details</h3>
            <div class="text-xs text-gray-700 space-y-1">
              <p><span class="font-semibold">Generated By:</span> ${user?.username || 'Admin'}</p>
              <p><span class="font-semibold">Email:</span> ${user?.email || 'N/A'}</p>
              <p><span class="font-semibold">Period:</span> ${periodLabel}</p>
              <p><span class="font-semibold">Generated At:</span> ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded">
            <h3 class="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">Company Info</h3>
            <div class="text-xs text-gray-700 space-y-1">
              <p class="font-semibold">Unicorn EV Bikes</p>
              <p>123 Main Street, Karachi</p>
              <p>Sindh 75500, Pakistan</p>
              <p>Phone: +92 300 1234567</p>
            </div>
          </div>
        </div>

        <!-- Dashboard Statistics -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Dashboard Statistics</h3>
          <div class="grid grid-cols-4 gap-3">
            ${currentStats.map(stat => `
              <div class="bg-gradient-to-br ${stat.color.replace('from-', 'from-').replace('to-', 'to-').replace('-500', '-50').replace('-600', '-100')} border-2 border-${stat.color.split('-')[1]}-300 rounded p-3 text-center">
                <p class="text-xs text-gray-600 mb-1">${stat.label}</p>
                <p class="text-2xl font-bold text-${stat.color.split('-')[1]}-700">${stat.value}</p>
                <p class="text-xs ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">${stat.change}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Revenue Trend -->
        ${revenueTrend.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Revenue Trend (Last 6 Months)</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Month</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Growth</th>
                </tr>
              </thead>
              <tbody>
                ${revenueTrend.map((data, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${data.month}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${data.revenue.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${data.growth || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Category Breakdown -->
        ${categoryBreakdown.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Sales by Category</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Category</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Value</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${categoryBreakdown.map((cat, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${cat.category}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${cat.value.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${cat.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Top Products -->
        ${topProducts.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Top Performing Products</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-center text-xs font-bold">Rank</th>
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Product</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Sales</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Growth</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map((product, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-center text-xs font-bold">${index + 1}</td>
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${product.name}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${product.sales} units</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${product.revenue.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs text-emerald-600 font-semibold">${product.growth}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Comprehensive Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">This is a computer-generated report</p>
          </div>
        </div>
      </div>
    `;
  };

  // Generate specific report HTML based on type
  const generateReportHTML = (type) => {
    const periodLabel = getPeriodLabel();
    
    switch (type) {
      case 'sales':
        return generateSalesReport(periodLabel);
      case 'inventory':
        return generateInventoryReport(periodLabel);
      case 'customers':
        return generateCustomersReport(periodLabel);
      case 'financial':
        return generateFinancialReport(periodLabel);
      case 'performance':
        return generatePerformanceReport(periodLabel);
      case 'products':
        return generateProductsReport(periodLabel);
      default:
        return generateComprehensiveReport();
    }
  };

  // Sales Summary Report
  const generateSalesReport = (periodLabel) => {
    const avgOrderValue = dashboardStats?.sales.value > 0 
      ? (dashboardStats?.revenue.value / dashboardStats?.sales.value) 
      : 0;
    const totalRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0);
    const totalSalesCount = revenueTrend.reduce((sum, d) => sum + d.sales, 0);

    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
              <p class="text-xs text-gray-600">123 Main Street, Karachi, Sindh 75500</p>
              <p class="text-xs text-gray-600">Phone: +92 300 1234567</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">SALES SUMMARY REPORT</h2>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
              <p class="text-xs text-gray-600">Generated By: ${user?.username || 'Admin'}</p>
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="mb-6 bg-gray-50 p-4 rounded">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Executive Summary</h3>
          <p class="text-xs text-gray-700 mb-2">
            This report provides a comprehensive overview of sales performance for ${periodLabel.toLowerCase()}. 
            The analysis includes transaction volumes, revenue trends, and key performance indicators.
          </p>
          <div class="grid grid-cols-3 gap-3 mt-3">
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Transactions</p>
              <p class="text-2xl font-bold text-gray-900">${dashboardStats?.sales.value || 0}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Revenue</p>
              <p class="text-2xl font-bold text-gray-900">Rs. ${(dashboardStats?.revenue.value || 0).toLocaleString()}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Avg Order Value</p>
              <p class="text-2xl font-bold text-gray-900">Rs. ${avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
          </div>
        </div>

        <!-- Sales Performance Metrics -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Sales Performance Metrics</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-cyan-50 border-2 border-cyan-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Total Sales Volume</p>
              <p class="text-3xl font-bold text-cyan-700">${dashboardStats?.sales.value || 0}</p>
              <p class="text-xs ${dashboardStats?.sales.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">
                ${dashboardStats?.sales.change >= 0 ? '↑' : '↓'} ${Math.abs(dashboardStats?.sales.change || 0)}% vs previous period
              </p>
              <p class="text-xs text-gray-600 mt-2">
                ${dashboardStats?.sales.change >= 0 ? 'Positive growth in sales transactions' : 'Decline in sales transactions'}
              </p>
            </div>
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Total Revenue Generated</p>
              <p class="text-2xl font-bold text-emerald-700">Rs. ${(dashboardStats?.revenue.value || 0).toLocaleString()}</p>
              <p class="text-xs ${dashboardStats?.revenue.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">
                ${dashboardStats?.revenue.change >= 0 ? '↑' : '↓'} ${Math.abs(dashboardStats?.revenue.change || 0)}% vs previous period
              </p>
              <p class="text-xs text-gray-600 mt-2">
                ${dashboardStats?.revenue.change >= 0 ? 'Revenue growth exceeding expectations' : 'Revenue below previous period'}
              </p>
            </div>
          </div>
        </div>

        <!-- Additional Metrics -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Additional Performance Indicators</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="bg-gray-50 border border-gray-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Avg Order Value</p>
              <p class="text-lg font-bold text-gray-900">Rs. ${avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
            <div class="bg-gray-50 border border-gray-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Products Sold</p>
              <p class="text-lg font-bold text-gray-900">${dashboardStats?.products.value || 0}</p>
            </div>
            <div class="bg-gray-50 border border-gray-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Unique Customers</p>
              <p class="text-lg font-bold text-gray-900">${dashboardStats?.customers.value || 0}</p>
            </div>
            <div class="bg-gray-50 border border-gray-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Conversion Rate</p>
              <p class="text-lg font-bold text-gray-900">
                ${dashboardStats?.customers.value > 0 ? ((dashboardStats?.sales.value / dashboardStats?.customers.value) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        ${revenueTrend.length > 0 ? `
          <!-- Monthly Sales Trend Analysis -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Monthly Sales Trend Analysis</h3>
            <p class="text-xs text-gray-700 mb-3">
              Detailed breakdown of sales performance across the last ${revenueTrend.length} months, showing transaction volumes and revenue generation.
            </p>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Month</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Sales Count</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Avg Order</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                ${revenueTrend.map((data, index) => {
                  const avgOrder = data.sales > 0 ? data.revenue / data.sales : 0;
                  const percentOfTotal = totalRevenue > 0 ? (data.revenue / totalRevenue * 100).toFixed(1) : 0;
                  return `
                    <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                      <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${data.month}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">${data.sales}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${data.revenue.toLocaleString()}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs">Rs. ${avgOrder.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs">${percentOfTotal}%</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="bg-gray-800 text-white font-bold">
                  <td class="border border-gray-400 py-2 px-3 text-xs">TOTAL</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">${totalSalesCount}</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">Rs. ${totalRevenue.toLocaleString()}</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">Rs. ${(totalRevenue / totalSalesCount).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Key Insights -->
          <div class="mb-6 bg-blue-50 border-2 border-blue-300 rounded p-4">
            <h3 class="text-sm font-bold text-gray-900 mb-2">📊 Key Insights</h3>
            <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>Best performing month: <strong>${revenueTrend.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueTrend[0]).month}</strong> with Rs. ${revenueTrend.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueTrend[0]).revenue.toLocaleString()} in revenue</li>
              <li>Average monthly sales: <strong>${(totalSalesCount / revenueTrend.length).toFixed(0)}</strong> transactions</li>
              <li>Average monthly revenue: <strong>Rs. ${(totalRevenue / revenueTrend.length).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></li>
              <li>Overall trend: <strong>${dashboardStats?.revenue.change >= 0 ? 'Upward trajectory' : 'Needs attention'}</strong></li>
            </ul>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Sales Summary Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">This is a computer-generated report | Confidential</p>
          </div>
        </div>
      </div>
    `;
  };

  // Inventory Report
  const generateInventoryReport = (periodLabel) => {
    const totalProductsSold = topProducts.reduce((sum, p) => sum + p.sales, 0);
    const totalInventoryRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);

    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
              <p class="text-xs text-gray-600">123 Main Street, Karachi, Sindh 75500</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">INVENTORY REPORT</h2>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="mb-6 bg-gray-50 p-4 rounded">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Inventory Performance Summary</h3>
          <p class="text-xs text-gray-700 mb-3">
            This report analyzes inventory movement and product performance for ${periodLabel.toLowerCase()}. 
            It includes stock turnover, top-selling items, and revenue contribution by product.
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Units Sold</p>
              <p class="text-2xl font-bold text-gray-900">${totalProductsSold}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Revenue Generated</p>
              <p class="text-2xl font-bold text-gray-900">Rs. ${totalInventoryRevenue.toLocaleString()}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Product Lines</p>
              <p class="text-2xl font-bold text-gray-900">${topProducts.length}</p>
            </div>
          </div>
        </div>

        <!-- Stock Movement Overview -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Stock Movement Overview</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-purple-50 border-2 border-purple-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Products Sold (${periodLabel})</p>
              <p class="text-3xl font-bold text-purple-700">${dashboardStats?.products.value || 0} units</p>
              <p class="text-xs ${dashboardStats?.products.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">
                ${dashboardStats?.products.change >= 0 ? '↑' : '↓'} ${Math.abs(dashboardStats?.products.change || 0)}% vs previous period
              </p>
              <p class="text-xs text-gray-600 mt-2">
                ${dashboardStats?.products.change >= 0 ? 'Strong inventory turnover' : 'Slower movement than previous period'}
              </p>
            </div>
            <div class="bg-cyan-50 border-2 border-cyan-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Average Units per Transaction</p>
              <p class="text-3xl font-bold text-cyan-700">
                ${dashboardStats?.sales.value > 0 ? (dashboardStats?.products.value / dashboardStats?.sales.value).toFixed(1) : 0}
              </p>
              <p class="text-xs text-gray-600 mt-2">
                Units sold per customer transaction
              </p>
            </div>
          </div>
        </div>

        ${topProducts.length > 0 ? `
          <!-- Top Moving Products Analysis -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Top Moving Products - Detailed Analysis</h3>
            <p class="text-xs text-gray-700 mb-3">
              Products ranked by sales volume and revenue contribution. Growth percentages indicate performance vs previous period.
            </p>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-center text-xs font-bold">Rank</th>
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Product Name</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Units Sold</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Avg Price</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Growth</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map((product, index) => {
                  const avgPrice = product.sales > 0 ? product.revenue / product.sales : 0;
                  const percentOfTotal = totalInventoryRevenue > 0 ? (product.revenue / totalInventoryRevenue * 100).toFixed(1) : 0;
                  return `
                    <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                      <td class="border border-gray-300 py-2 px-3 text-center text-xs font-bold">${index + 1}</td>
                      <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${product.name}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">${product.sales}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${product.revenue.toLocaleString()}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs">Rs. ${avgPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs text-emerald-600 font-semibold">${product.growth}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs">${percentOfTotal}%</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="bg-gray-800 text-white font-bold">
                  <td colspan="2" class="border border-gray-400 py-2 px-3 text-xs">TOTAL</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">${totalProductsSold}</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">Rs. ${totalInventoryRevenue.toLocaleString()}</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">-</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">-</td>
                  <td class="border border-gray-400 py-2 px-3 text-right text-xs">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Inventory Insights -->
          <div class="mb-6 bg-purple-50 border-2 border-purple-300 rounded p-4">
            <h3 class="text-sm font-bold text-gray-900 mb-2">📦 Inventory Insights</h3>
            <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>Best seller: <strong>${topProducts[0].name}</strong> with ${topProducts[0].sales} units sold</li>
              <li>Highest revenue product: <strong>${topProducts.reduce((max, p) => p.revenue > max.revenue ? p : max, topProducts[0]).name}</strong> generating Rs. ${topProducts.reduce((max, p) => p.revenue > max.revenue ? p : max, topProducts[0]).revenue.toLocaleString()}</li>
              <li>Top 3 products account for <strong>${topProducts.slice(0, 3).reduce((sum, p) => sum + parseFloat((p.revenue / totalInventoryRevenue * 100).toFixed(1)), 0).toFixed(1)}%</strong> of total revenue</li>
              <li>Average selling price across top products: <strong>Rs. ${(totalInventoryRevenue / totalProductsSold).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></li>
            </ul>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Inventory Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">This is a computer-generated report | Confidential</p>
          </div>
        </div>
      </div>
    `;
  };

  // Customer Analytics Report
  const generateCustomersReport = (periodLabel) => {
    // Get customer purchase details
    const currentSales = window.currentSalesData || [];
    const customerMap = {};
    
    currentSales.forEach(sale => {
      const customerKey = sale.customerEmail || sale.customer;
      if (!customerMap[customerKey]) {
        customerMap[customerKey] = {
          name: sale.customer,
          email: sale.customerEmail || 'N/A',
          phone: sale.customerPhone || 'N/A',
          purchases: [],
          totalSpent: 0,
          totalItems: 0,
        };
      }
      customerMap[customerKey].purchases.push({
        product: sale.model,
        quantity: sale.quantity,
        amount: sale.total,
        date: new Date(sale.createdAt).toLocaleDateString(),
      });
      customerMap[customerKey].totalSpent += sale.total;
      customerMap[customerKey].totalItems += sale.quantity;
    });
    
    const customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    const totalCustomerSpending = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
              <p class="text-xs text-gray-600">123 Main Street, Karachi, Sindh 75500</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">CUSTOMER ANALYTICS REPORT</h2>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="mb-6 bg-gray-50 p-4 rounded">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Customer Analytics Summary</h3>
          <p class="text-xs text-gray-700 mb-3">
            Comprehensive analysis of customer behavior, purchase patterns, and spending trends for ${periodLabel.toLowerCase()}.
          </p>
          <div class="grid grid-cols-4 gap-3">
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Customers</p>
              <p class="text-2xl font-bold text-gray-900">${customers.length}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Spending</p>
              <p class="text-2xl font-bold text-gray-900">Rs. ${totalCustomerSpending.toLocaleString()}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Avg per Customer</p>
              <p class="text-2xl font-bold text-gray-900">Rs. ${customers.length > 0 ? (totalCustomerSpending / customers.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Transactions</p>
              <p class="text-2xl font-bold text-gray-900">${dashboardStats?.sales.value || 0}</p>
            </div>
          </div>
        </div>

        <!-- Customer Metrics -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Customer Engagement Metrics</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Unique Customers</p>
              <p class="text-3xl font-bold text-emerald-700">${dashboardStats?.customers.value || 0}</p>
              <p class="text-xs ${dashboardStats?.customers.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">
                ${dashboardStats?.customers.change >= 0 ? '↑' : '↓'} ${Math.abs(dashboardStats?.customers.change || 0)}% vs previous period
              </p>
              <p class="text-xs text-gray-600 mt-2">
                ${dashboardStats?.customers.change >= 0 ? 'Growing customer base' : 'Customer retention needed'}
              </p>
            </div>
            <div class="bg-cyan-50 border-2 border-cyan-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Repeat Purchase Rate</p>
              <p class="text-3xl font-bold text-cyan-700">
                ${customers.length > 0 ? ((customers.filter(c => c.purchases.length > 1).length / customers.length) * 100).toFixed(1) : 0}%
              </p>
              <p class="text-xs text-gray-600 mt-2">
                Customers making multiple purchases
              </p>
            </div>
          </div>
        </div>

        ${customers.length > 0 ? `
          <!-- Detailed Customer Purchase History -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Customer Purchase Details</h3>
            <p class="text-xs text-gray-700 mb-3">
              Complete breakdown of customer transactions including contact information and purchase history.
            </p>
            
            ${customers.slice(0, 10).map((customer, index) => `
              <div class="mb-4 border-2 border-gray-300 rounded p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                <!-- Customer Header -->
                <div class="flex items-start justify-between mb-3 pb-2 border-b border-gray-300">
                  <div class="flex-1">
                    <p class="text-sm font-bold text-gray-900">${customer.name}</p>
                    <p class="text-xs text-gray-600">📧 ${customer.email}</p>
                    <p class="text-xs text-gray-600">📱 ${customer.phone}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-600">Total Spent</p>
                    <p class="text-lg font-bold text-emerald-700">Rs. ${customer.totalSpent.toLocaleString()}</p>
                    <p class="text-xs text-gray-600">${customer.purchases.length} transaction${customer.purchases.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <!-- Purchase History -->
                <div class="mt-2">
                  <p class="text-xs font-semibold text-gray-700 mb-2">Purchase History:</p>
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="bg-gray-200">
                        <th class="py-1 px-2 text-left">Date</th>
                        <th class="py-1 px-2 text-left">Product</th>
                        <th class="py-1 px-2 text-center">Qty</th>
                        <th class="py-1 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${customer.purchases.map((purchase, pIndex) => `
                        <tr class="${pIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                          <td class="py-1 px-2">${purchase.date}</td>
                          <td class="py-1 px-2 font-medium">${purchase.product}</td>
                          <td class="py-1 px-2 text-center">${purchase.quantity}</td>
                          <td class="py-1 px-2 text-right font-semibold">Rs. ${purchase.amount.toLocaleString()}</td>
                        </tr>
                      `).join('')}
                      <tr class="bg-gray-800 text-white font-bold">
                        <td colspan="2" class="py-1 px-2">CUSTOMER TOTAL</td>
                        <td class="py-1 px-2 text-center">${customer.totalItems}</td>
                        <td class="py-1 px-2 text-right">Rs. ${customer.totalSpent.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            `).join('')}
            
            ${customers.length > 10 ? `
              <div class="mt-3 p-3 bg-blue-50 border border-blue-300 rounded text-center">
                <p class="text-xs text-gray-700">
                  Showing top 10 customers. Total customers: <strong>${customers.length}</strong>
                </p>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${categoryBreakdown.length > 0 ? `
          <!-- Purchase Preferences -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Customer Purchase Preferences by Category</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Category</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Purchases</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${categoryBreakdown.map((cat, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${cat.category}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${cat.count}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${cat.value.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">${cat.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Customer Insights -->
        <div class="mb-6 bg-emerald-50 border-2 border-emerald-300 rounded p-4">
          <h3 class="text-sm font-bold text-gray-900 mb-2">👥 Customer Insights</h3>
          <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li>Top customer: <strong>${customers[0]?.name || 'N/A'}</strong> with Rs. ${(customers[0]?.totalSpent || 0).toLocaleString()} in purchases</li>
            <li>Average customer lifetime value: <strong>Rs. ${customers.length > 0 ? (totalCustomerSpending / customers.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}</strong></li>
            <li>Customers with repeat purchases: <strong>${customers.filter(c => c.purchases.length > 1).length}</strong> (${customers.length > 0 ? ((customers.filter(c => c.purchases.length > 1).length / customers.length) * 100).toFixed(1) : 0}%)</li>
            <li>Average items per customer: <strong>${customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalItems, 0) / customers.length).toFixed(1) : 0}</strong></li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Customer Analytics Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">This is a computer-generated report | Confidential</p>
          </div>
        </div>
      </div>
    `;
  };

  // Financial Report
  const generateFinancialReport = (periodLabel) => {
    const avgOrderValue = dashboardStats?.sales.value > 0 
      ? (dashboardStats?.revenue.value / dashboardStats?.sales.value) 
      : 0;
    
    // Calculate costs and profit (assuming 30% cost of goods sold)
    const totalRevenue = dashboardStats?.revenue.value || 0;
    const costOfGoodsSold = totalRevenue * 0.30; // 30% COGS
    const operatingExpenses = totalRevenue * 0.15; // 15% operating expenses
    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
              <p class="text-xs text-gray-600">123 Main Street, Karachi, Sindh 75500</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">FINANCIAL REPORT</h2>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="mb-6 bg-gray-50 p-4 rounded">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Financial Performance Summary</h3>
          <p class="text-xs text-gray-700 mb-3">
            Comprehensive financial analysis including revenue, costs, and profitability for ${periodLabel.toLowerCase()}.
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <p class="text-xs text-gray-600">Total Revenue</p>
              <p class="text-2xl font-bold text-gray-900">Rs. ${totalRevenue.toLocaleString()}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Net Profit</p>
              <p class="text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}">Rs. ${netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600">Profit Margin</p>
              <p class="text-2xl font-bold text-gray-900">${profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <!-- Profit & Loss Statement -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Profit & Loss Statement</h3>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-800 text-white">
                <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Description</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Amount (Rs.)</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              <!-- Revenue Section -->
              <tr class="bg-emerald-50">
                <td class="border border-gray-300 py-2 px-3 text-xs font-bold">REVENUE</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold">Rs. ${totalRevenue.toLocaleString()}</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold">100.0%</td>
              </tr>
              <tr class="bg-white">
                <td class="border border-gray-300 py-2 px-3 text-xs pl-6">Sales Revenue</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">Rs. ${totalRevenue.toLocaleString()}</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">100.0%</td>
              </tr>
              <tr class="bg-gray-50">
                <td class="border border-gray-300 py-2 px-3 text-xs pl-6">Number of Transactions</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">${dashboardStats?.sales.value || 0}</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">-</td>
              </tr>
              
              <!-- Cost of Goods Sold -->
              <tr class="bg-red-50">
                <td class="border border-gray-300 py-2 px-3 text-xs font-bold">COST OF GOODS SOLD</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold text-red-700">(Rs. ${costOfGoodsSold.toLocaleString(undefined, {maximumFractionDigits: 0})})</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold">30.0%</td>
              </tr>
              <tr class="bg-white">
                <td class="border border-gray-300 py-2 px-3 text-xs pl-6">Product Costs</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs text-red-700">(Rs. ${costOfGoodsSold.toLocaleString(undefined, {maximumFractionDigits: 0})})</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">30.0%</td>
              </tr>
              
              <!-- Gross Profit -->
              <tr class="bg-blue-50">
                <td class="border border-gray-300 py-2 px-3 text-xs font-bold">GROSS PROFIT</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold text-blue-700">Rs. ${grossProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold">70.0%</td>
              </tr>
              
              <!-- Operating Expenses -->
              <tr class="bg-orange-50">
                <td class="border border-gray-300 py-2 px-3 text-xs font-bold">OPERATING EXPENSES</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold text-orange-700">(Rs. ${operatingExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})})</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs font-bold">15.0%</td>
              </tr>
              <tr class="bg-white">
                <td class="border border-gray-300 py-2 px-3 text-xs pl-6">Salaries & Wages</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs text-orange-700">(Rs. ${(operatingExpenses * 0.6).toLocaleString(undefined, {maximumFractionDigits: 0})})</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">9.0%</td>
              </tr>
              <tr class="bg-gray-50">
                <td class="border border-gray-300 py-2 px-3 text-xs pl-6">Rent & Utilities</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs text-orange-700">(Rs. ${(operatingExpenses * 0.25).toLocaleString(undefined, {maximumFractionDigits: 0})})</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">3.75%</td>
              </tr>
              <tr class="bg-white">
                <td class="border border-gray-300 py-2 px-3 text-xs pl-6">Other Expenses</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs text-orange-700">(Rs. ${(operatingExpenses * 0.15).toLocaleString(undefined, {maximumFractionDigits: 0})})</td>
                <td class="border border-gray-300 py-2 px-3 text-right text-xs">2.25%</td>
              </tr>
              
              <!-- Net Profit -->
              <tr class="bg-gray-800 text-white">
                <td class="border border-gray-400 py-3 px-3 text-sm font-bold">NET PROFIT ${netProfit >= 0 ? '(PROFIT)' : '(LOSS)'}</td>
                <td class="border border-gray-400 py-3 px-3 text-right text-sm font-bold">Rs. ${netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                <td class="border border-gray-400 py-3 px-3 text-right text-sm font-bold">${profitMargin.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financial Metrics -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Key Financial Metrics</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Total Revenue</p>
              <p class="text-2xl font-bold text-emerald-700">Rs. ${totalRevenue.toLocaleString()}</p>
              <p class="text-xs ${dashboardStats?.revenue.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">
                ${dashboardStats?.revenue.change >= 0 ? '↑' : '↓'} ${Math.abs(dashboardStats?.revenue.change || 0)}% vs previous period
              </p>
            </div>
            <div class="bg-cyan-50 border-2 border-cyan-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Transactions</p>
              <p class="text-2xl font-bold text-cyan-700">${dashboardStats?.sales.value || 0}</p>
              <p class="text-xs ${dashboardStats?.sales.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">
                ${dashboardStats?.sales.change >= 0 ? '↑' : '↓'} ${Math.abs(dashboardStats?.sales.change || 0)}% vs previous period
              </p>
            </div>
            <div class="bg-orange-50 border-2 border-orange-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Avg Order Value</p>
              <p class="text-2xl font-bold text-orange-700">Rs. ${avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p class="text-xs text-gray-600 mt-1">Per transaction</p>
            </div>
          </div>
        </div>

        ${revenueTrend.length > 0 ? `
          <!-- Monthly Revenue Breakdown -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Monthly Revenue Analysis</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Month</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Transactions</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Est. Profit</th>
                </tr>
              </thead>
              <tbody>
                ${revenueTrend.map((data, index) => {
                  const monthProfit = data.revenue * 0.55; // 55% profit margin
                  return `
                    <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                      <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${data.month}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${data.revenue.toLocaleString()}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs">${data.sales}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold text-emerald-700">Rs. ${monthProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Financial Insights -->
        <div class="mb-6 ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'} border-2 rounded p-4">
          <h3 class="text-sm font-bold text-gray-900 mb-2">💰 Financial Insights</h3>
          <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li>Net ${netProfit >= 0 ? 'Profit' : 'Loss'}: <strong>Rs. ${Math.abs(netProfit).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> (${profitMargin.toFixed(1)}% margin)</li>
            <li>Gross profit margin: <strong>70.0%</strong> - Healthy margin maintained</li>
            <li>Operating expenses: <strong>15.0%</strong> of revenue - Well controlled</li>
            <li>Revenue trend: <strong>${dashboardStats?.revenue.change >= 0 ? 'Positive growth' : 'Needs attention'}</strong> (${dashboardStats?.revenue.change >= 0 ? '+' : ''}${dashboardStats?.revenue.change}%)</li>
            <li>Financial health: <strong>${netProfit >= 0 ? 'Profitable' : 'Loss-making'}</strong> - ${netProfit >= 0 ? 'Company is generating positive returns' : 'Cost optimization needed'}</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Financial Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">This is a computer-generated report | Confidential</p>
            <p class="mt-1 text-gray-500 text-xs">Note: COGS and operating expenses are estimated based on industry standards</p>
          </div>
        </div>
      </div>
    `;
  };

  // Performance Metrics Report
  const generatePerformanceReport = (periodLabel) => {
    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">PERFORMANCE METRICS REPORT</h2>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Key Performance Indicators</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="bg-cyan-50 border-2 border-cyan-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Revenue</p>
              <p class="text-xl font-bold text-cyan-700">Rs. ${(dashboardStats?.revenue.value / 1000).toFixed(0)}K</p>
              <p class="text-xs ${dashboardStats?.revenue.trend === 'up' ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">${dashboardStats?.revenue.change >= 0 ? '+' : ''}${dashboardStats?.revenue.change}%</p>
            </div>
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Sales</p>
              <p class="text-xl font-bold text-emerald-700">${dashboardStats?.sales.value || 0}</p>
              <p class="text-xs ${dashboardStats?.sales.trend === 'up' ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">${dashboardStats?.sales.change >= 0 ? '+' : ''}${dashboardStats?.sales.change}%</p>
            </div>
            <div class="bg-violet-50 border-2 border-violet-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Customers</p>
              <p class="text-xl font-bold text-violet-700">${dashboardStats?.customers.value || 0}</p>
              <p class="text-xs ${dashboardStats?.customers.trend === 'up' ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">${dashboardStats?.customers.change >= 0 ? '+' : ''}${dashboardStats?.customers.change}%</p>
            </div>
            <div class="bg-orange-50 border-2 border-orange-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Products</p>
              <p class="text-xl font-bold text-orange-700">${dashboardStats?.products.value || 0}</p>
              <p class="text-xs ${dashboardStats?.products.trend === 'up' ? 'text-emerald-600' : 'text-red-600'} font-semibold mt-1">${dashboardStats?.products.change >= 0 ? '+' : ''}${dashboardStats?.products.change}%</p>
            </div>
          </div>
        </div>

        ${revenueTrend.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Performance Trend</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Month</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Sales</th>
                </tr>
              </thead>
              <tbody>
                ${revenueTrend.map((data, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${data.month}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${data.revenue.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${data.sales}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Performance Metrics Report</p>
            <p>This is a computer-generated report</p>
          </div>
        </div>
      </div>
    `;
  };

  // Product Analysis Report
  const generateProductsReport = (periodLabel) => {
    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p class="text-xs text-gray-600">Electric Mobility Solutions</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900">PRODUCT ANALYSIS REPORT</h2>
              <p class="text-xs text-gray-600">Period: ${periodLabel}</p>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        ${topProducts.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Top Performing Products</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-center text-xs font-bold">Rank</th>
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Product</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Units Sold</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Growth</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map((product, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-center text-xs font-bold">${index + 1}</td>
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${product.name}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">${product.sales}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">Rs. ${product.revenue.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs text-emerald-600 font-semibold">${product.growth}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${categoryBreakdown.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Sales by Category</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Category</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Revenue</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Share</th>
                </tr>
              </thead>
              <tbody>
                ${categoryBreakdown.map((cat, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${cat.category}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${cat.value.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${cat.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Product Analysis Report</p>
            <p>This is a computer-generated report</p>
          </div>
        </div>
      </div>
    `;
  };

  // Get report styles
  const getReportStyles = () => {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: white;
          color: black;
        }
        
        @media print {
          body { 
            margin: 0;
            padding: 0;
          }
          @page { 
            margin: 1cm;
            size: A4;
          }
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        table th,
        table td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
        
        table thead tr {
          background-color: #1f2937 !important;
          color: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        table tbody tr:nth-child(even) {
          background-color: #f9fafb !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .grid {
          display: grid;
          gap: 1rem;
        }
        
        .grid-cols-2 {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .grid-cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .border {
          border: 1px solid #d1d5db;
        }
        
        .border-2 {
          border-width: 2px;
        }
        
        .border-b {
          border-bottom: 1px solid #d1d5db;
        }
        
        .border-b-2 {
          border-bottom-width: 2px;
        }
        
        .border-gray-800 {
          border-color: #1f2937;
        }
        
        .border-gray-300 {
          border-color: #d1d5db;
        }
        
        .border-gray-400 {
          border-color: #9ca3af;
        }
        
        .bg-gray-50 {
          background-color: #f9fafb !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .bg-gray-800 {
          background-color: #1f2937 !important;
          color: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .from-cyan-50 {
          background: linear-gradient(to bottom right, #ecfeff, #cffafe) !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .from-emerald-50 {
          background: linear-gradient(to bottom right, #ecfdf5, #d1fae5) !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .from-violet-50 {
          background: linear-gradient(to bottom right, #f5f3ff, #ede9fe) !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .from-orange-50 {
          background: linear-gradient(to bottom right, #fff7ed, #ffedd5) !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .border-cyan-300 {
          border-color: #67e8f9;
        }
        
        .border-emerald-300 {
          border-color: #6ee7b7;
        }
        
        .border-violet-300 {
          border-color: #c4b5fd;
        }
        
        .border-orange-300 {
          border-color: #fdba74;
        }
        
        .text-cyan-700 {
          color: #0e7490;
        }
        
        .text-emerald-700 {
          color: #047857;
        }
        
        .text-emerald-600 {
          color: #059669;
        }
        
        .text-violet-700 {
          color: #6d28d9;
        }
        
        .text-orange-700 {
          color: #c2410c;
        }
        
        .text-red-600 {
          color: #dc2626;
        }
        
        .text-gray-600 {
          color: #4b5563;
        }
        
        .text-gray-700 {
          color: #374151;
        }
        
        .text-gray-900 {
          color: #111827;
        }
        
        .text-gray-500 {
          color: #6b7280;
        }
        
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .p-8 { padding: 2rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .pb-1 { padding-bottom: 0.25rem; }
        .pb-4 { padding-bottom: 1rem; }
        .pt-4 { padding-top: 1rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-8 { margin-top: 2rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-6 { gap: 1.5rem; }
        
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .uppercase { text-transform: uppercase; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .rounded { border-radius: 0.25rem; }
        
        table {
          page-break-inside: avoid;
        }
      </style>
    `;
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return 'Last 7 Days';
      case 'year':
        return 'Last 12 Months';
      default:
        return 'Last 30 Days';
    }
  };

  // Stats configuration
  const stats = dashboardStats ? [
    { 
      label: 'Total Revenue', 
      value: `Rs. ${dashboardStats.revenue.value.toLocaleString()}`, 
      change: `${dashboardStats.revenue.change >= 0 ? '+' : ''}${dashboardStats.revenue.change}%`, 
      trend: dashboardStats.revenue.trend,
      icon: DollarSign,
      color: 'from-cyan-500 to-blue-600',
      period: getPeriodLabel()
    },
    { 
      label: 'Total Sales', 
      value: dashboardStats.sales.value.toString(), 
      change: `${dashboardStats.sales.change >= 0 ? '+' : ''}${dashboardStats.sales.change}%`, 
      trend: dashboardStats.sales.trend,
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-600',
      period: getPeriodLabel()
    },
    { 
      label: 'New Customers', 
      value: dashboardStats.customers.value.toString(), 
      change: `${dashboardStats.customers.change >= 0 ? '+' : ''}${dashboardStats.customers.change}%`, 
      trend: dashboardStats.customers.trend,
      icon: Users,
      color: 'from-violet-500 to-purple-600',
      period: getPeriodLabel()
    },
    { 
      label: 'Products Sold', 
      value: dashboardStats.products.value.toString(), 
      change: `${dashboardStats.products.change >= 0 ? '+' : ''}${dashboardStats.products.change}%`, 
      trend: dashboardStats.products.trend,
      icon: Package,
      color: 'from-orange-500 to-red-600',
      period: getPeriodLabel()
    },
  ] : [];

  // Available reports configuration - Only 4 reports
  const availableReports = [
    {
      title: 'Sales Summary Report',
      description: 'Comprehensive overview of all sales activities, trends, and performance metrics',
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-600',
      type: 'sales'
    },
    {
      title: 'Inventory Report',
      description: 'Stock movement analysis, top-selling products, and inventory turnover',
      icon: Package,
      color: 'from-purple-500 to-violet-600',
      type: 'inventory'
    },
    {
      title: 'Customer Analytics',
      description: 'Detailed customer information, purchase history, and behavior patterns',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      type: 'customers'
    },
    {
      title: 'Financial Report',
      description: 'Profit & Loss statement, revenue analysis, and financial health metrics',
      icon: DollarSign,
      color: 'from-orange-500 to-red-600',
      type: 'financial'
    },
  ];

  // Category colors
  const categoryColors = [
    'bg-cyan-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
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
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Reports & Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights and detailed reports</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last 12 Months</option>
              </select>
              <Button 
                onClick={handleExportAll}
                disabled={exporting === 'all'}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {exporting === 'all' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Print Report
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-card/90 border-border backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${
                        stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.period}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No data available for the selected period</p>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2 bg-card/90 border-border backdrop-blur-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Revenue Trend (Last 6 Months)</span>
                {dashboardStats && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    {dashboardStats.revenue.change >= 0 ? '+' : ''}{dashboardStats.revenue.change}%
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {revenueTrend.length > 0 ? (
                <div className="space-y-4">
                  {revenueTrend.map((data, index) => {
                    const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue));
                    const width = (data.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium w-12">{data.month}</span>
                          <span className="text-foreground font-semibold">Rs. {(data.revenue / 1000).toFixed(0)}K</span>
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
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl">Sales by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{category.category}</span>
                        <span className="text-muted-foreground">{category.percentage}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-accent/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${categoryColors[index % categoryColors.length]} rounded-full transition-all duration-1000`}
                            style={{ 
                              width: `${category.percentage}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-cyan-400 min-w-[70px] text-right">
                          Rs. {category.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6 sm:mb-8">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl">Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Product
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr 
                        key={index}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-foreground">{product.name}</span>
                        </td>
                        <td className="py-4 px-6 text-foreground">{product.sales} units</td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-cyan-400">Rs. {product.revenue.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                            {product.growth}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Reports */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableReports.map((report, index) => {
              const Icon = report.icon;
              const isExporting = exporting === report.type;
              return (
                <Card 
                  key={index}
                  className="bg-card/90 border-border backdrop-blur-sm hover:border-primary/50 transition-all group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${report.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExportReport(report.type)}
                        disabled={isExporting}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isExporting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Period: {getPeriodLabel()}
                      </span>
                      <Button 
                        variant="link" 
                        onClick={() => handleExportReport(report.type)}
                        disabled={isExporting}
                        className="text-cyan-400 hover:text-cyan-300 p-0 h-auto text-sm"
                      >
                        {isExporting ? 'Printing...' : 'Print'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
