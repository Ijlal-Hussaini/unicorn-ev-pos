import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Loader2,
  User,
  MapPin
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { salesAPI, productsAPI } from '../../services/api';

const EditSale = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  
  const [saleData, setSaleData] = useState({
    customer: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    paymentMethod: 'Cash',
    status: 'completed',
    notes: ''
  });

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Pakistan'
    },
    notes: ''
  });

  useEffect(() => {
    fetchSaleData();
  }, [id]);

  const fetchSaleData = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getById(id);
      const sale = response.data;
      
      // Always try to fetch the actual product to get current stock
      let productData = null;
      
      if (sale.product && sale.product._id) {
        // Product is populated, fetch fresh data using its ID
        try {
          const productResponse = await productsAPI.getById(sale.product._id);
          productData = productResponse.data;
        } catch (error) {
          console.error('Failed to fetch product:', error);
          // Use populated product data as fallback
          productData = {
            ...sale.product,
            price: sale.product.price || sale.price || 0,
            stock: sale.product.stock
          };
        }
      } else if (sale.productId) {
        // Need to fetch product using productId
        try {
          const productResponse = await productsAPI.getById(sale.productId);
          productData = productResponse.data;
        } catch (error) {
          console.error('Failed to fetch product:', error);
        }
      }
      
      // If we still don't have product data, create fallback
      if (!productData) {
        productData = {
          _id: sale.productId || sale.product?._id || 'unknown',
          name: sale.product?.name || sale.model || 'Unknown Product',
          model: sale.product?.model || sale.model || 'N/A',
          sku: sale.product?.sku || 'N/A',
          price: sale.price || 0,
          stock: 0
        };
      }
      
      setProduct(productData);
      
      // Set sale data
      setSaleData({
        customer: sale.customer || '',
        customerEmail: sale.customerEmail || '',
        customerPhone: sale.customerPhone || '',
        quantity: sale.quantity || 1,
        paymentMethod: sale.paymentMethod || 'Cash',
        status: sale.status || 'completed',
        notes: sale.notes || ''
      });
      
      // Set customer details if available
      if (sale.customerDetails) {
        setCustomerDetails({
          name: sale.customerDetails.name || sale.customer || '',
          email: sale.customerDetails.email || sale.customerEmail || '',
          phone: sale.customerDetails.phone || sale.customerPhone || '',
          cnic: sale.customerDetails.cnic || '',
          address: {
            street: sale.customerDetails.address?.street || '',
            city: sale.customerDetails.address?.city || '',
            state: sale.customerDetails.address?.state || '',
            zipCode: sale.customerDetails.address?.zipCode || '',
            country: sale.customerDetails.address?.country || 'Pakistan'
          },
          notes: sale.customerDetails.notes || ''
        });
      } else {
        // Fallback to basic customer info
        setCustomerDetails(prev => ({
          ...prev,
          name: sale.customer || '',
          email: sale.customerEmail || '',
          phone: sale.customerPhone || ''
        }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sale data',
        variant: 'destructive',
      });
      navigate('/sales/history');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Sync with saleData for backward compatibility
    if (name === 'name') {
      setSaleData(prev => ({ ...prev, customer: value }));
    } else if (name === 'email') {
      setSaleData(prev => ({ ...prev, customerEmail: value }));
    } else if (name === 'phone') {
      setSaleData(prev => ({ ...prev, customerPhone: value }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!customerDetails.name.trim()) {
      toast({
        title: 'Error',
        description: 'Customer name is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!customerDetails.phone.trim()) {
      toast({
        title: 'Error',
        description: 'Customer phone is required',
        variant: 'destructive',
      });
      return;
    }

    if (!customerDetails.email.trim()) {
      toast({
        title: 'Error',
        description: 'Customer email is required',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(customerDetails.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    if (saleData.quantity < 1) {
      toast({
        title: 'Error',
        description: 'Quantity must be at least 1',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare update payload
      const updatePayload = {
        ...saleData,
        customer: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        customerDetails: customerDetails
      };

      await salesAPI.update(id, updatePayload);
      
      toast({
        title: 'Success',
        description: 'Sale updated successfully',
        variant: 'success',
      });
      
      navigate(-1);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update sale',
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

  const calculateTotal = () => {
    if (!product) return 0;
    return product.price * saleData.quantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
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

      <main className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Edit Sale</h1>
          <p className="text-muted-foreground">Update sale information</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <CardTitle>Customer Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={customerDetails.name}
                      onChange={handleCustomerChange}
                      placeholder="Enter customer full name"
                      className="bg-background border-border"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={customerDetails.phone}
                        onChange={handleCustomerChange}
                        placeholder="+92 300 1234567"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={customerDetails.email}
                        onChange={handleCustomerChange}
                        placeholder="customer@example.com"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cnic">CNIC (Optional)</Label>
                    <Input
                      id="cnic"
                      name="cnic"
                      value={customerDetails.cnic}
                      onChange={handleCustomerChange}
                      placeholder="13 digit CNIC (e.g., 7150123491057)"
                      className="bg-background border-border"
                      maxLength={13}
                    />
                  </div>

                  {/* Address Section */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <Label className="text-base font-semibold">Address (Optional)</Label>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          name="street"
                          value={customerDetails.address.street}
                          onChange={handleAddressChange}
                          placeholder="House/Plot number, Street name"
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={customerDetails.address.city}
                            onChange={handleAddressChange}
                            placeholder="e.g., Karachi"
                            className="bg-background border-border"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            name="state"
                            value={customerDetails.address.state}
                            onChange={handleAddressChange}
                            placeholder="e.g., Sindh"
                            className="bg-background border-border"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zipCode">Zip/Postal Code</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={customerDetails.address.zipCode}
                            onChange={handleAddressChange}
                            placeholder="e.g., 75500"
                            className="bg-background border-border"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            name="country"
                            value={customerDetails.address.country}
                            onChange={handleAddressChange}
                            placeholder="Pakistan"
                            className="bg-background border-border"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Information (Read-only) */}
              {product && (
                <Card className="bg-card/90 border-border backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                      <div className="mb-4">
                        <p className="font-semibold text-foreground text-lg">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.model}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Unit Price</p>
                          <p className="text-xl font-bold text-cyan-400">{formatCurrency(product.price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Stock</p>
                          <p className="text-xl font-bold text-emerald-400">
                            {product.stock !== undefined && product.stock !== null ? `${product.stock} units` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          value={saleData.quantity}
                          onChange={handleInputChange}
                          className="bg-background border-border"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: Changing quantity may affect inventory
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Details */}
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={saleData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      name="status"
                      value={saleData.status}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={saleData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Add any additional notes..."
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card/90 border-border backdrop-blur-sm sticky top-32">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product && (
                    <div className="space-y-3">
                      <div className="border-t border-border pt-3">
                        <p className="text-sm text-muted-foreground mb-2">Product</p>
                        <p className="font-semibold text-foreground">{product.name}</p>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unit Price</span>
                        <span className="font-semibold text-foreground">{formatCurrency(product.price)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="font-semibold text-foreground">{saleData.quantity}</span>
                      </div>
                      
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">Total Amount</span>
                          <span className="text-2xl font-bold text-cyan-400">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating Sale...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Sale
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditSale;
