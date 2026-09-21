import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Loader2,
  Search,
  DollarSign,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { installmentsAPI, salesAPI } from '../../services/api';

const CreateInstallment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchingSales, setSearchingSales] = useState(false);
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [searchedSales, setSearchedSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [formData, setFormData] = useState({
    saleId: '',
    customerCNIC: '',
    downPayment: 0,
    numberOfInstallments: 12,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Pakistani Guarantor (Zamin) KYC State
  const [guarantor1, setGuarantor1] = useState({
    name: '',
    cnic: '',
    phone: '',
    relation: '',
    address: '',
    workplace: '',
  });

  const [guarantor2, setGuarantor2] = useState({
    name: '',
    cnic: '',
    phone: '',
    relation: '',
    address: '',
    workplace: '',
  });

  useEffect(() => {
    fetchEligibleSales();
    
    // Check if sale was pre-selected from NewSale page
    if (location.state?.preSelectedSale) {
      const sale = location.state.preSelectedSale;
      setSelectedSale(sale);
      setFormData(prev => ({
        ...prev,
        saleId: sale._id,
        customerCNIC: location.state.customerCNIC || ''
      }));
    }
  }, [location.state]);

  const fetchEligibleSales = async () => {
    try {
      setSearchingSales(true);
      const response = await salesAPI.getAll();
      const allSales = response.data || [];
      // Only sales with paymentType='installment' and no existing plan are eligible
      const eligibleSales = allSales.filter(sale => 
        sale.paymentType === 'installment' && 
        !sale.hasInstallmentPlan && 
        sale.status === 'completed'
      );
      setSales(eligibleSales);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales',
        variant: 'destructive',
      });
    } finally {
      setSearchingSales(false);
    }
  };

  const searchSales = () => {
    if (!saleSearchQuery.trim()) {
      setSearchedSales(sales); // Show all eligible sales when search is empty
      return;
    }
    const results = sales.filter(sale =>
      sale.invoiceId.toLowerCase().includes(saleSearchQuery.toLowerCase()) ||
      sale.customer.toLowerCase().includes(saleSearchQuery.toLowerCase())
    );
    setSearchedSales(results);
  };
  
  // Show all eligible sales initially
  useEffect(() => {
    if (sales.length > 0 && !selectedSale) {
      setSearchedSales(sales);
    }
  }, [sales]);

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setFormData({ ...formData, saleId: sale._id });
    setSearchedSales([]);
    setSaleSearchQuery('');
  };

  const calculateInstallmentAmount = () => {
    if (!selectedSale) return 0;
    const remaining = selectedSale.total - formData.downPayment;
    // Use floor to avoid overpayment, last installment will include remainder
    return Math.floor(remaining / formData.numberOfInstallments);
  };
  
  const calculateLastInstallmentAmount = () => {
    if (!selectedSale) return 0;
    const remaining = selectedSale.total - formData.downPayment;
    const baseAmount = Math.floor(remaining / formData.numberOfInstallments);
    const remainder = remaining - (baseAmount * formData.numberOfInstallments);
    return baseAmount + remainder;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.saleId) {
      toast({
        title: 'Error',
        description: 'Please select a sale',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.customerCNIC) {
      toast({
        title: 'Error',
        description: 'Customer CNIC is required',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate CNIC format (13 digits without dashes)
    const cnicRegex = /^\d{13}$/;
    const trimmedCNIC = formData.customerCNIC.trim();
    if (!cnicRegex.test(trimmedCNIC)) {
      toast({
        title: 'Error',
        description: 'Invalid CNIC format. Must be 13 digits',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate start date
    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      toast({
        title: 'Error',
        description: 'Start date cannot be in the past',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate down payment
    if (formData.downPayment < 0 || formData.downPayment >= selectedSale.total) {
      toast({
        title: 'Error',
        description: 'Down payment must be between 0 and total amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const guarantors = [];
      if (guarantor1.name?.trim() || guarantor1.cnic?.trim()) {
        guarantors.push(guarantor1);
      }
      if (guarantor2.name?.trim() || guarantor2.cnic?.trim()) {
        guarantors.push(guarantor2);
      }

      // Trim CNIC before sending
      const submissionData = {
        ...formData,
        customerCNIC: formData.customerCNIC.trim(),
        guarantors,
      };
      await installmentsAPI.create(submissionData);
      toast({
        title: 'Success',
        description: 'Installment plan created successfully',
      });
      navigate('/installments');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create installment plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      <Navbar />
      <NavigationPanel />

      <main className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create Installment Plan</h1>
            <p className="text-muted-foreground">Set up a new installment payment plan for a sale</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Selection */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select Sale</h2>
              
              {!selectedSale ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by invoice ID or customer name..."
                        value={saleSearchQuery}
                        onChange={(e) => {
                          setSaleSearchQuery(e.target.value);
                          searchSales();
                        }}
                        className="pl-10 bg-background border-border"
                      />
                    </div>
                  </div>

                  {searchingSales ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
                    </div>
                  ) : searchedSales.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchedSales.map((sale) => (
                        <div
                          key={sale._id}
                          onClick={() => handleSelectSale(sale)}
                          className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-foreground">{sale.invoiceId}</p>
                              <p className="text-sm text-muted-foreground">{sale.customer}</p>
                              <p className="text-xs text-muted-foreground">{sale.product?.name || sale.model}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-cyan-400">{formatCurrency(sale.total)}</p>
                              <p className="text-xs text-muted-foreground">Qty: {sale.quantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : saleSearchQuery ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No eligible sales found</p>
                      <p className="text-sm">Try searching with a different invoice ID or customer name</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Search for a sale to create an installment plan</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{selectedSale.invoiceId}</p>
                      <p className="text-sm text-muted-foreground">{selectedSale.customer}</p>
                      <p className="text-xs text-muted-foreground">{selectedSale.product?.name || selectedSale.model}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSale(null);
                        setFormData({ ...formData, saleId: '' });
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-semibold text-cyan-400">{formatCurrency(selectedSale.total)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity: </span>
                      <span className="font-semibold">{selectedSale.quantity}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Details */}
          {selectedSale && (
            <>
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Plan Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cnic">Customer CNIC *</Label>
                      <Input
                        id="cnic"
                        type="text"
                        value={formData.customerCNIC}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          setFormData({ ...formData, customerCNIC: value });
                        }}
                        placeholder="13 digit CNIC (e.g., 7150123491057)"
                        className="bg-background border-border"
                        maxLength={13}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="downPayment">Down Payment (Rs.) *</Label>
                        <Input
                          id="downPayment"
                          type="number"
                          value={formData.downPayment}
                          onChange={(e) => setFormData({ ...formData, downPayment: Number(e.target.value) })}
                          min="0"
                          max={selectedSale.total}
                          className="bg-background border-border"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="installments">Number of Installments *</Label>
                        <Input
                          id="installments"
                          type="number"
                          value={formData.numberOfInstallments}
                          onChange={(e) => setFormData({ ...formData, numberOfInstallments: Number(e.target.value) })}
                          min="2"
                          max="24"
                          className="bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frequency">Payment Frequency *</Label>
                        <select
                          id="frequency"
                          value={formData.frequency}
                          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Additional notes about this installment plan..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guarantors (Zamin) KYC Card */}
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Guarantors KYC (Zamin Details)</h2>
                      <p className="text-xs text-muted-foreground">Pakistani Legal Installment Compliance & Verification</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                      2 Guarantors Supported
                    </span>
                  </div>

                  <div className="space-y-6">
                    {/* Guarantor 1 */}
                    <div className="p-4 bg-accent/20 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-cyan-400 uppercase tracking-wider">Primary Guarantor (Zamin 1)</h3>
                        <span className="text-[10px] text-muted-foreground">Mandatory for high-value bikes</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Full Name</Label>
                          <Input
                            value={guarantor1.name}
                            onChange={(e) => setGuarantor1({ ...guarantor1, name: e.target.value })}
                            placeholder="e.g. Muhammad Tariq"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">CNIC Number</Label>
                          <Input
                            value={guarantor1.cnic}
                            onChange={(e) => setGuarantor1({ ...guarantor1, cnic: e.target.value.replace(/\D/g, '') })}
                            placeholder="13 digits (no dashes)"
                            maxLength={13}
                            className="bg-background border-border font-mono text-xs h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone Number</Label>
                          <Input
                            value={guarantor1.phone}
                            onChange={(e) => setGuarantor1({ ...guarantor1, phone: e.target.value })}
                            placeholder="0300-1234567"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Relation with Customer</Label>
                          <Input
                            value={guarantor1.relation}
                            onChange={(e) => setGuarantor1({ ...guarantor1, relation: e.target.value })}
                            placeholder="e.g. Brother, Uncle, Business Partner"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Workplace / Business Name</Label>
                          <Input
                            value={guarantor1.workplace}
                            onChange={(e) => setGuarantor1({ ...guarantor1, workplace: e.target.value })}
                            placeholder="Company, Shop, or Government Department"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Residential Address</Label>
                          <Input
                            value={guarantor1.address}
                            onChange={(e) => setGuarantor1({ ...guarantor1, address: e.target.value })}
                            placeholder="Permanent residential address as per CNIC"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guarantor 2 */}
                    <div className="p-4 bg-accent/10 rounded-lg border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-foreground/80 uppercase tracking-wider">Secondary Guarantor (Zamin 2)</h3>
                        <span className="text-[10px] text-muted-foreground">Optional</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Full Name</Label>
                          <Input
                            value={guarantor2.name}
                            onChange={(e) => setGuarantor2({ ...guarantor2, name: e.target.value })}
                            placeholder="e.g. Abdul Rehman"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">CNIC Number</Label>
                          <Input
                            value={guarantor2.cnic}
                            onChange={(e) => setGuarantor2({ ...guarantor2, cnic: e.target.value.replace(/\D/g, '') })}
                            placeholder="13 digits"
                            maxLength={13}
                            className="bg-background border-border font-mono text-xs h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone Number</Label>
                          <Input
                            value={guarantor2.phone}
                            onChange={(e) => setGuarantor2({ ...guarantor2, phone: e.target.value })}
                            placeholder="0321-9876543"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Relation with Customer</Label>
                          <Input
                            value={guarantor2.relation}
                            onChange={(e) => setGuarantor2({ ...guarantor2, relation: e.target.value })}
                            placeholder="e.g. Neighbor, Colleague"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Workplace / Business Name</Label>
                          <Input
                            value={guarantor2.workplace}
                            onChange={(e) => setGuarantor2({ ...guarantor2, workplace: e.target.value })}
                            placeholder="Office or Business location"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Residential Address</Label>
                          <Input
                            value={guarantor2.address}
                            onChange={(e) => setGuarantor2({ ...guarantor2, address: e.target.value })}
                            placeholder="Residential address"
                            className="bg-background border-border text-xs h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Installment Summary
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold text-lg">{formatCurrency(selectedSale.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Down Payment:</span>
                      <span className="font-semibold text-lg">{formatCurrency(formData.downPayment)}</span>
                    </div>
                    <div className="h-px bg-border"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Remaining Amount:</span>
                      <span className="font-semibold text-lg">{formatCurrency(selectedSale.total - formData.downPayment)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-foreground font-medium">Installment Amount:</span>
                      <span className="font-bold text-2xl text-cyan-400">
                        {formatCurrency(calculateInstallmentAmount())}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {formData.numberOfInstallments - 1} payments of {formatCurrency(calculateInstallmentAmount())} + final payment of {formatCurrency(calculateLastInstallmentAmount())}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Installment Plan'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/installments')}
                  className="border-border"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
};

export default CreateInstallment;
