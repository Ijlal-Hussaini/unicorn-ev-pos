import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  FileText
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { salesAPI } from '../../services/api';
import SalesReport from '../../components/SalesReport';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const SalesHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const reportRef = useRef();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll({ sortBy: 'createdAt', order: 'desc' });
      const allSales = response.data || [];
      
      // Filter sales by current user
      const userSales = allSales.filter(sale => sale.soldBy?._id === user?._id);
      setSales(userSales);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sales',
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-0';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-0';
      case 'pending':
        return 'bg-orange-500/20 text-orange-400 border-0';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-0';
      case 'refunded':
        return 'bg-purple-500/20 text-purple-400 border-0';
      default:
        return 'bg-muted text-muted-foreground border-0';
    }
  };

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = 
      sale.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.model?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredSales.slice(startIndex, endIndex);

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Invoice ID', 'Customer', 'Model', 'Quantity', 'Price', 'Total', 'Payment Method', 'Status', 'Date'],
      ...filteredSales.map(sale => [
        sale.invoiceId,
        sale.customer,
        sale.model,
        sale.quantity,
        sale.price,
        sale.total,
        sale.paymentMethod,
        sale.status,
        formatDate(sale.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Sales history exported as CSV',
      variant: 'success',
    });
  };

  // Export to PDF
  const handleExportPDF = () => {
    setShowReportPreview(true);
  };

  // Print PDF Report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    const reportContent = reportRef.current;
    
    if (reportContent && printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sales Report - ${user?.username}</title>
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
              
              /* Print-specific styles */
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
              
              /* Table styles */
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
              
              /* Grid layouts */
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
              
              /* Borders and backgrounds */
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
              
              /* Status badges */
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
              
              /* Gradient backgrounds for stats */
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
              
              /* Text colors */
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
              
              /* Spacing */
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
              
              /* Typography */
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
              
              /* Layout */
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .rounded { border-radius: 0.25rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .inline-block { display: inline-block; }
              
              /* Page breaks */
              .page-break {
                page-break-before: always;
              }
              
              /* Prevent page breaks inside */
              table, .no-break {
                page-break-inside: avoid;
              }
              
              /* Image sizing */
              img {
                max-width: 48px !important;
                max-height: 48px !important;
                width: 48px !important;
                height: 48px !important;
                object-fit: contain;
              }
              
              /* Header specific */
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
        toast({
          title: 'Success',
          description: 'Report sent to printer',
          variant: 'success',
        });
      }, 500);
    }
  };

  const handleViewDetails = async (sale) => {
    try {
      const response = await salesAPI.getById(sale._id);
      setSelectedSale(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sale details',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading sales history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
      {/* Animated background */}
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
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/sales/dashboard')}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Sales History</h1>
          <p className="text-muted-foreground">View and manage your sales transactions</p>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                <div className="relative flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by invoice, customer, or model..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 bg-background border-border"
                  />
                </div>
                
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`border-border ${(statusFilter !== 'all' || paymentFilter !== 'all') ? 'bg-cyan-500/10 border-cyan-500/50' : ''}`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {(statusFilter !== 'all' || paymentFilter !== 'all') && (
                        <span className="ml-2 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {(statusFilter !== 'all' ? 1 : 0) + (paymentFilter !== 'all' ? 1 : 0)}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filter Sales</DialogTitle>
                      <DialogDescription>
                        Filter sales by status and payment method
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="status-filter">Status</Label>
                        <select
                          id="status-filter"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="processing">Processing</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payment-filter">Payment Method</Label>
                        <select
                          id="payment-filter"
                          value={paymentFilter}
                          onChange={(e) => setPaymentFilter(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="all">All Methods</option>
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStatusFilter('all');
                          setPaymentFilter('all');
                          setCurrentPage(1);
                        }}
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => {
                          setIsFilterOpen(false);
                          setCurrentPage(1);
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600"
                      >
                        Apply
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Export Button */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  className="border-border"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportPDF}
                  className="border-border"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((sale) => (
                      <tr 
                        key={sale._id}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm font-semibold text-foreground">{sale.invoiceId}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-foreground">{sale.customer}</p>
                            {sale.customerPhone && (
                              <p className="text-xs text-muted-foreground">{sale.customerPhone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-foreground">{sale.model}</td>
                        <td className="py-4 px-6 text-foreground">{sale.quantity}</td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-cyan-400">{formatCurrency(sale.total)}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-foreground">{sale.paymentMethod}</td>
                        <td className="py-4 px-6">
                          <Badge className={getStatusColor(sale.status)}>
                            {sale.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">
                          {formatDate(sale.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(sale)}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-muted-foreground">
                        No sales found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredSales.length)} of {filteredSales.length} sales
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-border"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-border"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>Invoice: {selectedSale.invoiceId}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-4 bg-accent/30 rounded-lg">
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedSale.customer}</span></p>
                  {selectedSale.customerPhone && (
                    <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedSale.customerPhone}</span></p>
                  )}
                  {selectedSale.customerEmail && (
                    <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedSale.customerEmail}</span></p>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 bg-accent/30 rounded-lg">
                <h4 className="font-semibold mb-2">Product Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Model:</span> <span className="font-medium">{selectedSale.model}</span></p>
                  <p><span className="text-muted-foreground">SKU:</span> <span className="font-medium">{selectedSale.product?.sku}</span></p>
                  <p><span className="text-muted-foreground">Quantity:</span> <span className="font-medium">{selectedSale.quantity}</span></p>
                  <p><span className="text-muted-foreground">Unit Price:</span> <span className="font-medium">{formatCurrency(selectedSale.price)}</span></p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Payment Information</h4>
                  <Badge className={getStatusColor(selectedSale.status)}>
                    {selectedSale.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Method:</span> <span className="font-medium">{selectedSale.paymentMethod}</span></p>
                  <p><span className="text-muted-foreground">Total Amount:</span> <span className="text-xl font-bold text-cyan-400">{formatCurrency(selectedSale.total)}</span></p>
                  <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{formatDate(selectedSale.createdAt)}</span></p>
                </div>
              </div>

              {/* Notes */}
              {selectedSale.notes && (
                <div className="p-4 bg-accent/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PDF Report Preview Dialog */}
      <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
        <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="text-2xl">Sales Report Preview</DialogTitle>
            <DialogDescription>
              Review your sales report before downloading or printing
            </DialogDescription>
          </DialogHeader>

          {/* Report Preview */}
          <div className="p-6">
            <SalesReport
              ref={reportRef}
              sales={filteredSales}
              dateRange="All Time"
              user={user}
            />
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-4 border-t border-border bg-accent/30">
            <div className="flex flex-wrap gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowReportPreview(false)}
                className="border-border"
              >
                Close
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="border-border"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              
              <Button
                onClick={handlePrintReport}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
