import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Loader2,
  DollarSign,
  User,
  Package,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { installmentsAPI } from '../../services/api';
import { useSelector } from 'react-redux';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const InstallmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  
  const [plan, setPlan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'Cash',
    notes: '',
  });

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchPlanDetails();
  }, [id]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await installmentsAPI.getById(id);
      setPlan(response.data.plan);
      setPayments(response.data.payments || []);
      
      // Set payment amount based on whether it's the last installment
      const isLastPayment = response.data.plan.paidInstallments + 1 === response.data.plan.numberOfInstallments;
      const expectedAmount = isLastPayment && response.data.plan.lastInstallmentAmount
        ? response.data.plan.lastInstallmentAmount
        : response.data.plan.installmentAmount;
      
      setPaymentData({ ...paymentData, amount: expectedAmount });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch plan details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await installmentsAPI.recordPayment(id, paymentData);
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      setShowPaymentModal(false);
      fetchPlanDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDefaulted = async () => {
    if (!window.confirm('Are you sure you want to mark this plan as defaulted?')) return;
    
    const notes = prompt('Enter reason for default:');
    try {
      setIsSubmitting(true);
      await installmentsAPI.markAsDefaulted(id, notes);
      toast({
        title: 'Success',
        description: 'Plan marked as defaulted',
      });
      fetchPlanDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as defaulted',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this plan?')) return;
    
    const notes = prompt('Enter reason for cancellation:');
    try {
      setIsSubmitting(true);
      await installmentsAPI.cancel(id, notes);
      toast({
        title: 'Success',
        description: 'Plan cancelled successfully',
      });
      fetchPlanDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel plan',
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
    });
  };

  const formatDateTime = (date) => {
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
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-0';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-0';
      case 'defaulted': return 'bg-red-500/20 text-red-400 border-0';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-0';
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-0';
      case 'late': return 'bg-red-500/20 text-red-400 border-0';
      default: return 'bg-muted text-muted-foreground border-0';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'defaulted': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'late': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
            <p className="text-muted-foreground">Loading plan details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <p className="text-muted-foreground">Plan not found</p>
            <Button onClick={() => navigate('/installments')} className="mt-4">
              Back to List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue = plan.status === 'active' && new Date() > new Date(plan.nextDueDate);

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
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/installments')}
              className="border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">{plan.installmentPlanId}</h1>
              <p className="text-muted-foreground">Installment Plan Details</p>
            </div>
          </div>
          <Badge className={getStatusColor(plan.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(plan.status)}
              {plan.status}
            </span>
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(plan.totalAmount)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(plan.totalPaid)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-orange-400">
                {formatCurrency(plan.remainingAmount)}
              </p>
              {plan.accumulatedVariance !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Variance: {plan.accumulatedVariance > 0 ? '+' : ''}{formatCurrency(plan.accumulatedVariance)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Information */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{plan.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{plan.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{plan.customerEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNIC:</span>
                  <span className="font-medium">{plan.customerCNIC}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Details */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Plan Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{plan.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice:</span>
                  <span className="font-medium">{plan.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="font-medium capitalize">{plan.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installment Amount:</span>
                  <span className="font-medium text-cyan-400">{formatCurrency(plan.installmentAmount)}</span>
                </div>
                {plan.lastInstallmentAmount && plan.lastInstallmentAmount !== plan.installmentAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final Installment:</span>
                    <span className="font-medium text-cyan-400">{formatCurrency(plan.lastInstallmentAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">
                    {plan.paidInstallments} / {plan.numberOfInstallments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grace Period:</span>
                  <span className="font-medium">{plan.gracePeriodDays || 3} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Due Date:</span>
                  <span className={`font-medium ${isOverdue ? 'text-red-400' : ''}`}>
                    {plan.nextDueDate ? formatDate(plan.nextDueDate) : 'N/A'}
                    {isOverdue && ' (OVERDUE)'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {plan.status === 'active' && (
          <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleMarkDefaulted}
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark as Defaulted
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="border-border"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Cancel Plan
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payment History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Payment ID</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Installment #</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-12 h-12 text-muted-foreground/50" />
                          <p>No payments recorded yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{payment.paymentId}</td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{payment.installmentNumber}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="font-semibold text-foreground">{formatCurrency(payment.amount)}</div>
                          {payment.lateFee > 0 && (
                            <div className="text-xs text-red-400">Late Fee: {formatCurrency(payment.lateFee)}</div>
                          )}
                          {payment.paymentVariance !== 0 && (
                            <div className={`text-xs ${payment.paymentVariance > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {payment.paymentVariance > 0 ? '+' : ''}{formatCurrency(payment.paymentVariance)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{payment.paymentMethod}</td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                          {formatDateTime(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={getStatusColor(payment.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record installment payment for {plan.installmentPlanId}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="amount">Amount (Rs.) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="bg-background border-border"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {formatCurrency(
                    plan.paidInstallments + 1 === plan.numberOfInstallments && plan.lastInstallmentAmount
                      ? plan.lastInstallmentAmount
                      : plan.installmentAmount
                  )}
                  {plan.paidInstallments + 1 === plan.numberOfInstallments && ' (Final Payment)'}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstallmentDetails;
