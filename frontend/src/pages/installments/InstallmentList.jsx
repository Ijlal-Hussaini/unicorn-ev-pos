import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { installmentsAPI } from '../../services/api';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const InstallmentList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const response = await installmentsAPI.getAll({ sortBy: 'createdAt', order: 'desc' });
      setInstallments(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch installments',
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
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-0';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-0';
      case 'defaulted': return 'bg-red-500/20 text-red-400 border-0';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-0';
      default: return 'bg-muted text-muted-foreground border-0';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'defaulted': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredInstallments = installments.filter((plan) => {
    const matchesSearch = 
      plan.installmentPlanId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredInstallments.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading installments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      <Navbar />
      <NavigationPanel />

      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Installment Plans</h1>
          <p className="text-muted-foreground">Manage and track customer payment plans</p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                <div className="relative flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by plan ID, customer, or invoice..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10 bg-background border-border"
                  />
                </div>

                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`border-border ${statusFilter !== 'all' ? 'bg-cyan-500/10 border-cyan-500/50' : ''}`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {statusFilter !== 'all' && (
                        <span className="ml-2 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filter Installments</DialogTitle>
                      <DialogDescription>Filter installment plans by status</DialogDescription>
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
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="defaulted">Defaulted</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                      >
                        Clear Filter
                      </Button>
                      <Button 
                        onClick={() => { setIsFilterOpen(false); setCurrentPage(1); }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        Apply
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Button 
                onClick={() => navigate('/installments/create')}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Installments Table */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Plan ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Total Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Next Due</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-12 h-12 text-muted-foreground/50" />
                          <p>No installment plans found</p>
                          <p className="text-sm">Create your first installment plan to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentData.map((plan) => (
                      <tr key={plan._id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {plan.installmentPlanId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-foreground">{plan.customer}</div>
                          <div className="text-muted-foreground text-xs">{plan.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {plan.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                          {formatCurrency(plan.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  plan.status === 'active' && plan.nextDueDate && new Date(plan.nextDueDate) < new Date()
                                    ? 'bg-gradient-to-r from-red-500 to-orange-600'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                                }`}
                                style={{
                                  width: `${(plan.paidInstallments / plan.numberOfInstallments) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {plan.paidInstallments}/{plan.numberOfInstallments}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className={`text-muted-foreground ${
                            plan.status === 'active' && plan.nextDueDate && new Date(plan.nextDueDate) < new Date()
                              ? 'text-red-400 font-semibold'
                              : ''
                          }`}>
                            {plan.nextDueDate ? formatDate(plan.nextDueDate) : 'N/A'}
                          </div>
                          {plan.status === 'active' && plan.nextDueDate && new Date(plan.nextDueDate) < new Date() && (
                            <div className="text-xs text-red-400 font-medium">OVERDUE</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={getStatusColor(plan.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(plan.status)}
                              {plan.status}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/installments/${plan._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredInstallments.length)} of {filteredInstallments.length} plans
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? 'bg-cyan-500' : ''}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstallmentList;
