import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { salesAPI } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const SalesRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const itemsPerPage = 10;

  // Fetch sales data
  useEffect(() => {
    fetchSalesData();
    fetchStats();
  }, [statusFilter, paymentFilter, dateRange, sortBy, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, dateRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter && paymentFilter !== 'all') params.paymentMethod = paymentFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.order = sortOrder;

      const response = await salesAPI.getAll(params);
      setSalesData(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sales data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await salesAPI.getStats(params);
      const data = response.data;
      
      setStats({
        totalSales: { 
          label: 'Total Sales', 
          value: `Rs. ${parseFloat(data.totalRevenue || 0).toLocaleString()}`, 
          change: '+12.5%', 
          trend: 'up' 
        },
        totalOrders: { 
          label: 'Total Orders', 
          value: data.totalSales?.toString() || '0', 
          change: '+8.2%', 
          trend: 'up' 
        },
        avgOrderValue: { 
          label: 'Avg Order Value', 
          value: `Rs. ${parseFloat(data.avgOrderValue || 0).toLocaleString()}`, 
          change: '+4.1%', 
          trend: 'up' 
        },
        pendingOrders: { 
          label: 'Pending Orders', 
          value: data.pendingOrders?.toString() || '0', 
          change: '-2.3%', 
          trend: 'down' 
        },
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;

    try {
      await salesAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Sale deleted successfully',
      });
      fetchSalesData();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale',
        variant: 'destructive',
      });
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
  };

  // Check if any filters are active
  const hasActiveFilters = 
    searchQuery || 
    (statusFilter && statusFilter !== 'all') || 
    (paymentFilter && paymentFilter !== 'all') || 
    dateRange.start || 
    dateRange.end;

  // Handle export - Generate and print PDF directly
  const handleExport = () => {
    // Create a temporary container for the report
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    // Create the report content
    const reportContent = document.createElement('div');
    reportContent.innerHTML = generateReportHTML();
    tempContainer.appendChild(reportContent);

    // Open print window
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sales Report - ${user?.username || 'Admin'}</title>
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
              
              table tfoot tr {
                background-color: #1f2937 !important;
                color: white !important;
                font-weight: bold;
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
              
              .border-t-2 {
                border-top-width: 2px;
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
              
              .bg-emerald-200 {
                background-color: #a7f3d0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .text-emerald-800 {
                color: #065f46 !important;
              }
              
              .bg-orange-200 {
                background-color: #fed7aa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .text-orange-800 {
                color: #9a3412 !important;
              }
              
              .bg-blue-200 {
                background-color: #bfdbfe !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .text-blue-800 {
                color: #1e40af !important;
              }
              
              .bg-red-200 {
                background-color: #fecaca !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .text-red-800 {
                color: #991b1b !important;
              }
              
              .bg-purple-200 {
                background-color: #e9d5ff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .text-purple-800 {
                color: #6b21a8 !important;
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
              
              .from-blue-50 {
                background: linear-gradient(to bottom right, #eff6ff, #dbeafe) !important;
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
              
              .border-blue-300 {
                border-color: #93c5fd;
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
              
              .text-blue-700 {
                color: #1d4ed8;
              }
              
              .text-orange-700 {
                color: #c2410c;
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
              
              .p-3 { padding: 0.75rem; }
              .p-4 { padding: 1rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
              .pb-1 { padding-bottom: 0.25rem; }
              .pb-4 { padding-bottom: 1rem; }
              .pt-4 { padding-top: 1rem; }
              .mb-1 { margin-bottom: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-8 { margin-top: 2rem; }
              .gap-3 { gap: 0.75rem; }
              .gap-6 { gap: 1.5rem; }
              
              .text-xs { font-size: 0.75rem; }
              .text-sm { font-size: 0.875rem; }
              .text-lg { font-size: 1.125rem; }
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
              .rounded { border-radius: 0.25rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .inline-block { display: inline-block; }
              
              .page-break {
                page-break-before: always;
              }
              
              table, .no-break {
                page-break-inside: avoid;
              }
              
              img {
                max-width: 48px !important;
                max-height: 48px !important;
                width: 48px !important;
                height: 48px !important;
                object-fit: contain;
              }
              
              h1, h2 {
                line-height: 1.2;
                margin: 0;
              }
              
              .text-xl {
                font-size: 20px !important;
              }
              
              .text-2xl {
                font-size: 24px !important;
              }
            </style>
          </head>
          <body>
            ${reportContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        
        // Clean up
        document.body.removeChild(tempContainer);
        
        toast({
          title: 'Success',
          description: 'Report sent to printer. Use "Save as PDF" to download.',
        });
      }, 500);
    } else {
      document.body.removeChild(tempContainer);
      toast({
        title: 'Error',
        description: 'Failed to open print window',
        variant: 'destructive',
      });
    }
  };

  // Generate report HTML
  const generateReportHTML = () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const totalSales = filteredData.length;
    const totalRevenue = filteredData.reduce((sum, sale) => {
      const netRevenue = sale.total - (sale.refundedAmount || 0);
      return sum + netRevenue;
    }, 0);
    const completedSales = filteredData.filter(s => s.status === 'completed').length;
    const pendingSales = filteredData.filter(s => s.status === 'pending').length;
    const refundedSales = filteredData.filter(s => s.status === 'refunded').length;

    const paymentMethodStats = filteredData.reduce((acc, sale) => {
      if (!acc[sale.paymentMethod]) {
        acc[sale.paymentMethod] = { count: 0, total: 0 };
      }
      acc[sale.paymentMethod].count++;
      acc[sale.paymentMethod].total += sale.total;
      return acc;
    }, {});

    const dateRangeText = dateRange.start || dateRange.end
      ? `${dateRange.start || '...'} to ${dateRange.end || '...'}`
      : 'All Time';

    return `
      <div class="bg-white text-black p-8 max-w-[210mm] mx-auto" style="font-family: Arial, sans-serif;">
        <!-- Header -->
        <div class="border-b-2 border-gray-800 pb-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <h1 class="text-xl font-bold text-gray-900" style="font-size: 20px; line-height: 1.2; margin-bottom: 2px;">Unicorn EV Bikes</h1>
                <p class="text-xs text-gray-600" style="font-size: 10px;">Electric Mobility Solutions</p>
              </div>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-gray-900" style="font-size: 20px; line-height: 1.2; margin-bottom: 2px;">SALES REPORT</h2>
              <p class="text-xs text-gray-600" style="font-size: 10px;">Generated: ${formatDate(new Date())}</p>
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
              <p><span class="font-semibold">Period:</span> ${dateRangeText}</p>
              <p><span class="font-semibold">Total Records:</span> ${totalSales}</p>
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

        <!-- Summary Statistics -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Summary Statistics</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Total Sales</p>
              <p class="text-2xl font-bold text-cyan-700">${totalSales}</p>
            </div>
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Total Revenue</p>
              <p class="text-lg font-bold text-emerald-700">${formatCurrency(totalRevenue)}</p>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Completed</p>
              <p class="text-2xl font-bold text-blue-700">${completedSales}</p>
            </div>
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded p-3 text-center">
              <p class="text-xs text-gray-600 mb-1">Pending</p>
              <p class="text-2xl font-bold text-orange-700">${pendingSales}</p>
            </div>
          </div>
        </div>

        <!-- Payment Method Breakdown -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Payment Method Breakdown</h3>
          <table class="w-full border-collapse" style="page-break-inside: avoid;">
            <thead>
              <tr class="bg-gray-800 text-white">
                <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Payment Method</th>
                <th class="border border-gray-400 py-2 px-3 text-center text-xs font-bold">Count</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Total Amount</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(paymentMethodStats).map(([method, stats], index) => `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                  <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${method}</td>
                  <td class="border border-gray-300 py-2 px-3 text-center text-xs">${stats.count}</td>
                  <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">${formatCurrency(stats.total)}</td>
                  <td class="border border-gray-300 py-2 px-3 text-right text-xs">${((stats.total / totalRevenue) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
              <tr class="bg-gray-800 text-white font-bold">
                <td class="border border-gray-400 py-2 px-3 text-xs">TOTAL</td>
                <td class="border border-gray-400 py-2 px-3 text-center text-xs">${totalSales}</td>
                <td class="border border-gray-400 py-2 px-3 text-right text-xs">${formatCurrency(totalRevenue)}</td>
                <td class="border border-gray-400 py-2 px-3 text-right text-xs">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sales Details Table -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Detailed Sales Transactions</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-2 text-left font-bold" style="width: 12%;">Invoice</th>
                  <th class="border border-gray-400 py-2 px-2 text-left font-bold" style="width: 10%;">Date</th>
                  <th class="border border-gray-400 py-2 px-2 text-left font-bold" style="width: 18%;">Customer</th>
                  <th class="border border-gray-400 py-2 px-2 text-left font-bold" style="width: 15%;">Model</th>
                  <th class="border border-gray-400 py-2 px-2 text-center font-bold" style="width: 6%;">Qty</th>
                  <th class="border border-gray-400 py-2 px-2 text-right font-bold" style="width: 12%;">Amount</th>
                  <th class="border border-gray-400 py-2 px-2 text-center font-bold" style="width: 12%;">Payment</th>
                  <th class="border border-gray-400 py-2 px-2 text-center font-bold" style="width: 10%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map((sale, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}" style="page-break-inside: avoid;">
                    <td class="border border-gray-300 py-2 px-2 font-mono text-xs">${sale.invoiceId}</td>
                    <td class="border border-gray-300 py-2 px-2 text-xs">${formatDate(sale.createdAt)}</td>
                    <td class="border border-gray-300 py-2 px-2 text-xs">${sale.customer}</td>
                    <td class="border border-gray-300 py-2 px-2 text-xs">${sale.model}</td>
                    <td class="border border-gray-300 py-2 px-2 text-center text-xs font-semibold">${sale.quantity}</td>
                    <td class="border border-gray-300 py-2 px-2 text-right text-xs font-bold">${formatCurrency(sale.total)}</td>
                    <td class="border border-gray-300 py-2 px-2 text-center text-xs">${sale.paymentMethod}</td>
                    <td class="border border-gray-300 py-2 px-2 text-center">
                      <span class="inline-block px-2 py-1 rounded text-xs font-bold ${
                        sale.status === 'completed' ? 'bg-emerald-200 text-emerald-800' :
                        sale.status === 'pending' ? 'bg-orange-200 text-orange-800' :
                        sale.status === 'processing' ? 'bg-blue-200 text-blue-800' :
                        sale.status === 'refunded' ? 'bg-purple-200 text-purple-800' :
                        'bg-red-200 text-red-800'
                      }">
                        ${sale.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="bg-gray-800 text-white font-bold">
                  <td colspan="4" class="border border-gray-400 py-2 px-2 text-xs text-right">GRAND TOTAL:</td>
                  <td class="border border-gray-400 py-2 px-2 text-center text-xs">${filteredData.reduce((sum, s) => sum + s.quantity, 0)}</td>
                  <td class="border border-gray-400 py-2 px-2 text-right text-xs">${formatCurrency(totalRevenue)}</td>
                  <td colspan="2" class="border border-gray-400 py-2 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Sales Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">Generated on ${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} | This is a computer-generated report</p>
          </div>
        </div>
      </div>
    `;
  };

  // Filter data based on search query
  const filteredData = salesData.filter(sale => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sale.invoiceId?.toLowerCase().includes(searchLower) ||
      sale.customer?.toLowerCase().includes(searchLower) ||
      sale.model?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Sales Records</h1>
          <p className="text-muted-foreground">Track and manage all your sales transactions</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {Object.values(stats).map((stat, index) => (
              <Card key={index} className="bg-card/90 border-border backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <span className={`text-xs font-semibold ${
                      stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Top Row: Search and Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 sm:max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by invoice, customer, or model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full sm:w-auto">
                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`flex-1 sm:flex-none dark:bg-gray-800 border-border hover:bg-purple-500/10 hover:border-purple-500/50 transition-colors ${((statusFilter && statusFilter !== 'all') || (paymentFilter && paymentFilter !== 'all')) ? 'bg-purple-500/20 border-purple-500/50' : ''}`}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                        {((statusFilter && statusFilter !== 'all') || (paymentFilter && paymentFilter !== 'all')) && (
                          <span className="ml-2 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {(statusFilter && statusFilter !== 'all' ? 1 : 0) + (paymentFilter && paymentFilter !== 'all' ? 1 : 0)}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-card border-border" align="end">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3 text-foreground">Filter Options</h4>
                        </div>
                        
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Payment Method Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="All Methods" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="all">All Methods</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="Debit Card">Debit Card</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setStatusFilter('all');
                              setPaymentFilter('all');
                            }}
                            className="flex-1"
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowFilters(false)}
                            className="flex-1 bg-purple-500 hover:bg-purple-600"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`flex-1 sm:flex-none dark:bg-gray-800 border-border hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-colors ${(dateRange.start || dateRange.end) ? 'bg-emerald-500/20 border-emerald-500/50' : ''}`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Date Range
                        {(dateRange.start || dateRange.end) && (
                          <span className="ml-2 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            1
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-card border-border" align="end">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3 text-foreground">Date Range</h4>
                        </div>
                        
                        {/* Start Date */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                          <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-background border-border"
                          />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">End Date</label>
                          <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-background border-border"
                          />
                        </div>

                        {/* Quick Filters */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Quick Select</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setDateRange({ start: today, end: today });
                              }}
                            >
                              Today
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const today = new Date();
                                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                setDateRange({ 
                                  start: weekAgo.toISOString().split('T')[0], 
                                  end: today.toISOString().split('T')[0] 
                                });
                              }}
                            >
                              Last 7 Days
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const today = new Date();
                                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                                setDateRange({ 
                                  start: monthAgo.toISOString().split('T')[0], 
                                  end: today.toISOString().split('T')[0] 
                                });
                              }}
                            >
                              Last 30 Days
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const today = new Date();
                                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                setDateRange({ 
                                  start: firstDay.toISOString().split('T')[0], 
                                  end: today.toISOString().split('T')[0] 
                                });
                              }}
                            >
                              This Month
                            </Button>
                          </div>
                        </div>

                        {/* Date Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="flex-1"
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowDatePicker(false)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none dark:bg-gray-800 border-border hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
                    onClick={handleExport}
                    disabled={filteredData.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 flex items-center gap-1">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-cyan-300">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {statusFilter && statusFilter !== 'all' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 flex items-center gap-1">
                      Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-cyan-300">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {paymentFilter && paymentFilter !== 'all' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 flex items-center gap-1">
                      Payment: {paymentFilter}
                      <button onClick={() => setPaymentFilter('all')} className="ml-1 hover:text-cyan-300">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {(dateRange.start || dateRange.end) && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 flex items-center gap-1">
                      Date: {dateRange.start || '...'} to {dateRange.end || '...'}
                      <button onClick={() => setDateRange({ start: '', end: '' })} className="ml-1 hover:text-cyan-300">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-cyan-400 hover:text-cyan-300 h-6 px-2"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sales records found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <button className="flex items-center space-x-1 hover:text-foreground transition-colors">
                            <span>Invoice</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Model
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Total
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((sale) => (
                        <tr 
                          key={sale._id}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="font-semibold text-foreground">{sale.invoiceId}</span>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground text-sm">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-foreground">{sale.customer}</td>
                          <td className="py-4 px-6 text-foreground">{sale.model}</td>
                          <td className="py-4 px-6 text-muted-foreground">{sale.quantity}</td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-cyan-400">Rs. {sale.total.toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground text-sm">{sale.paymentMethod}</td>
                          <td className="py-4 px-6">
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
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/sales/view/${sale._id}`)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/sales/edit/${sale._id}`)}
                                title="Edit Sale"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-red-400"
                                onClick={() => handleDelete(sale._id)}
                                title="Delete Sale"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Mobile Cards */}
            {!loading && currentData.length > 0 && (
              <div className="md:hidden divide-y divide-border">
                {currentData.map((sale) => (
                  <div key={sale._id} className="p-4 hover:bg-accent/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground mb-1">{sale.invoiceId}</p>
                        <p className="text-sm text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={
                        sale.status === 'completed' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-0' 
                          : sale.status === 'processing'
                          ? 'bg-blue-500/20 text-blue-400 border-0'
                          : sale.status === 'pending'
                          ? 'bg-orange-500/20 text-orange-400 border-0'
                          : 'bg-red-500/20 text-red-400 border-0'
                      }>
                        {sale.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="text-foreground font-medium">{sale.customer}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="text-foreground">{sale.model}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="text-foreground">{sale.quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="text-foreground">{sale.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Total:</span>
                        <span className="text-cyan-400 font-semibold">Rs. {sale.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-3 border-t border-border">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/sales/view/${sale._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/sales/edit/${sale._id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-primary" : "border-border"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="border-border"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesRecords;
