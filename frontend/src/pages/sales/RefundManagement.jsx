import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
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
import { refundsAPI, salesAPI } from '../../services/api';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const RefundManagement = () => {
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [refundForm, setRefundForm] = useState({
    invoiceId: '',
    quantityRefunded: 1,
    reason: '',
    reasonDetails: '',
    refundMethod: 'Cash',
    notes: '',
    restockProduct: true,
  });
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [searchedSales, setSearchedSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchingSales, setSearchingSales] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await refundsAPI.getAll({ sortBy: 'createdAt', order: 'desc' });
      setRefunds(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch refunds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchSales = async () => {
    if (!saleSearchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invoice ID',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSearchingSales(true);
      const response = await salesAPI.getAll();
      const allSales = response.data || [];
      const matchingSales = allSales.filter(sale => 
        sale.invoiceId.toLowerCase().includes(saleSearchQuery.toLowerCase()) &&
        sale.status === 'completed'
      );
      setSearchedSales(matchingSales);
      if (matchingSales.length === 0) {
        toast({
          title: 'No Results',
          description: 'No completed sales found with that invoice ID',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to search sales',
        variant: 'destructive',
      });
    } finally {
      setSearchingSales(false);
    }
  };

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setRefundForm({
      ...refundForm,
      invoiceId: sale.invoiceId,
      quantityRefunded: 1,
      refundMethod: sale.paymentMethod,
    });
    setSearchedSales([]);
    setSaleSearchQuery('');
  };

  const handleCreateRefund = async () => {
    if (!selectedSale) {
      toast({ title: 'Error', description: 'Please select a sale first', variant: 'destructive' });
      return;
    }
    if (!refundForm.reason) {
      toast({ title: 'Error', description: 'Please select a refund reason', variant: 'destructive' });
      return;
    }
    if (refundForm.quantityRefunded < 1 || refundForm.quantityRefunded > selectedSale.quantity) {
      toast({ title: 'Error', description: `Quantity must be between 1 and ${selectedSale.quantity}`, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await refundsAPI.create({ saleId: selectedSale._id, ...refundForm });
      toast({ title: 'Success', description: 'Refund request created successfully', variant: 'success' });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRefunds();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to create refund', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSale(null);
    setSearchedSales([]);
    setSaleSearchQuery('');
    setRefundForm({
      invoiceId: '',
      quantityRefunded: 1,
      reason: '',
      reasonDetails: '',
      refundMethod: 'Cash',
      notes: '',
      restockProduct: true,
    });
  };

  const handleApproveRefund = async (refundId) => {
    if (!window.confirm('Are you sure you want to approve this refund? Stock will be restored automatically.')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await refundsAPI.approve(refundId);
      toast({
        title: 'Success',
        description: 'Refund approved successfully. Stock has been restored.',
        variant: 'success',
      });
      fetchRefunds();
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve refund',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedRefund) return;
    
    setIsSubmitting(true);
    try {
      await refundsAPI.reject(selectedRefund._id, rejectNotes);
      toast({
        title: 'Success',
        description: 'Refund rejected',
        variant: 'success',
      });
      setIsRejectDialogOpen(false);
      setRejectNotes('');
      fetchRefunds();
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject refund',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRefund = async (refundId) => {
    if (!window.confirm('Mark this refund as completed? This means payment has been processed to the customer.')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await refundsAPI.complete(refundId);
      toast({
        title: 'Success',
        description: 'Refund marked as completed',
        variant: 'success',
      });
      fetchRefunds();
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete refund',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-0';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-0';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-0';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-0';
      default: return 'bg-muted text-muted-foreground border-0';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch = 
      refund.refundId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.customer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredRefunds.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading refunds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>
      <Navbar />
      <NavigationPanel />
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Refund Management</h1>
          <p className="text-muted-foreground">Process and track product refunds</p>
        </div>
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                <div className="relative flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by refund ID, invoice ID, or customer..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10 bg-background border-border"
                  />
                </div>
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className={`border-border ${statusFilter !== 'all' ? 'bg-cyan-500/10 border-cyan-500/50' : ''}`}>
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {statusFilter !== 'all' && (
                        <span className="ml-2 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filter Refunds</DialogTitle>
                      <DialogDescription>Filter refunds by status</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="status-filter">Status</Label>
                        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500">
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}>Clear Filter</Button>
                      <Button onClick={() => { setIsFilterOpen(false); setCurrentPage(1); }} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">Apply</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Refund
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Refund Request</DialogTitle>
                    <DialogDescription>Search for the original sale and create a refund request</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {!selectedSale ? (
                      <div className="space-y-3">
                        <Label>Search for Sale</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Enter Invoice ID..." value={saleSearchQuery} onChange={(e) => setSaleSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchSales()} />
                          <Button onClick={searchSales} disabled={searchingSales}>
                            {searchingSales ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                        {searchedSales.length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {searchedSales.map((sale) => (
                              <div key={sale._id} onClick={() => handleSelectSale(sale)} className="p-3 border rounded-lg cursor-pointer hover:bg-accent">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="font-semibold">{sale.invoiceId}</p>
                                    <p className="text-sm text-muted-foreground">{sale.customer}</p>
                                    <p className="text-xs text-muted-foreground">{sale.model}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(sale.total)}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {sale.quantity}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{selectedSale.invoiceId}</p>
                              <p className="text-sm">{selectedSale.customer}</p>
                              <p className="text-xs text-muted-foreground">{selectedSale.model}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={resetForm}>Change</Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Total: </span><span className="font-semibold">{formatCurrency(selectedSale.total)}</span></div>
                            <div><span className="text-muted-foreground">Qty: </span><span className="font-semibold">{selectedSale.quantity}</span></div>
                          </div>
                        </div>
                        <div>
                          <Label>Quantity to Refund *</Label>
                          <Input type="number" min="1" max={selectedSale.quantity} value={refundForm.quantityRefunded} onChange={(e) => setRefundForm({...refundForm, quantityRefunded: parseInt(e.target.value)})} />
                          <p className="text-xs text-muted-foreground mt-1">Refund Amount: {formatCurrency(selectedSale.price * refundForm.quantityRefunded)}</p>
                        </div>
                        <div>
                          <Label>Refund Reason *</Label>
                          <select value={refundForm.reason} onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})} className="w-full h-10 px-3 rounded-md border border-border bg-background">
                            <option value="">Select Reason</option>
                            <option value="Defective Product">Defective Product</option>
                            <option value="Wrong Product">Wrong Product</option>
                            <option value="Customer Changed Mind">Customer Changed Mind</option>
                            <option value="Product Not as Described">Product Not as Described</option>
                            <option value="Damaged During Delivery">Damaged During Delivery</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label>Additional Details</Label>
                          <textarea value={refundForm.reasonDetails} onChange={(e) => setRefundForm({...refundForm, reasonDetails: e.target.value})} className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background" placeholder="Provide more details..." />
                        </div>
                        <div>
                          <Label>Refund Method</Label>
                          <select value={refundForm.refundMethod} onChange={(e) => setRefundForm({...refundForm, refundMethod: e.target.value})} className="w-full h-10 px-3 rounded-md border border-border bg-background">
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Store Credit">Store Credit</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="restock" checked={refundForm.restockProduct} onChange={(e) => setRefundForm({...refundForm, restockProduct: e.target.checked})} className="w-4 h-4" />
                          <Label htmlFor="restock" className="cursor-pointer">Restock product (add back to inventory)</Label>
                        </div>
                        <div>
                          <Label>Notes (Optional)</Label>
                          <textarea value={refundForm.notes} onChange={(e) => setRefundForm({...refundForm, notes: e.target.value})} className="w-full min-h-[60px] px-3 py-2 border rounded-md bg-background" placeholder="Internal notes..." />
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>Cancel</Button>
                    {selectedSale && (
                      <Button onClick={handleCreateRefund} disabled={isSubmitting} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Refund
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        {/* Refunds Table */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Refund ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Invoice ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length > 0 ? (
                    currentData.map((refund) => (
                      <tr key={refund._id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{refund.refundId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{refund.invoiceId}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{refund.customer}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{refund.model}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">{formatCurrency(refund.refundAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={getStatusColor(refund.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(refund.status)}
                              {refund.status}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{formatDate(refund.createdAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedRefund(refund); setIsDetailOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <p>No refunds found</p>
                          <p className="text-sm">Create your first refund request to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRefunds.length)} of {filteredRefunds.length} refunds
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className={currentPage === page ? 'bg-cyan-500' : ''}>
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      {/* Refund Detail Dialog */}
      {selectedRefund && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Refund Details</DialogTitle>
              <DialogDescription>Refund ID: {selectedRefund.refundId}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Invoice ID</Label>
                  <p className="font-semibold">{selectedRefund.invoiceId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedRefund.status)}>{selectedRefund.status}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-semibold">{selectedRefund.customer}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-semibold">{selectedRefund.model}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity Refunded</Label>
                  <p className="font-semibold">{selectedRefund.quantityRefunded} units</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Refund Amount</Label>
                  <p className="font-semibold text-cyan-400">{formatCurrency(selectedRefund.refundAmount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <p className="font-semibold">{selectedRefund.reason}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Refund Method</Label>
                  <p className="font-semibold">{selectedRefund.refundMethod}</p>
                </div>
              </div>
              {selectedRefund.reasonDetails && (
                <div>
                  <Label className="text-muted-foreground">Details</Label>
                  <p className="text-sm">{selectedRefund.reasonDetails}</p>
                </div>
              )}
              {selectedRefund.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedRefund.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{formatDate(selectedRefund.createdAt)}</p>
                </div>
                {selectedRefund.approvedAt && (
                  <div>
                    <Label className="text-muted-foreground">Approved</Label>
                    <p className="text-sm">{formatDate(selectedRefund.approvedAt)}</p>
                  </div>
                )}
              </div>
              
              {/* Admin Action Buttons */}
              {isAdmin && (
                <div className="pt-4 border-t space-y-3">
                  {selectedRefund.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveRefund(selectedRefund._id)}
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Approve Refund
                      </Button>
                      <Button
                        onClick={() => setIsRejectDialogOpen(true)}
                        disabled={isSubmitting}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {selectedRefund.status === 'approved' && (
                    <Button
                      onClick={() => handleCompleteRefund(selectedRefund._id)}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Mark as Completed
                    </Button>
                  )}
                  
                  {(selectedRefund.status === 'completed' || selectedRefund.status === 'rejected') && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      This refund has been {selectedRefund.status}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Refund</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reject-notes">Rejection Reason *</Label>
              <textarea
                id="reject-notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                placeholder="Explain why this refund is being rejected..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsRejectDialogOpen(false); setRejectNotes(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectRefund}
              disabled={isSubmitting || !rejectNotes.trim()}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundManagement;
