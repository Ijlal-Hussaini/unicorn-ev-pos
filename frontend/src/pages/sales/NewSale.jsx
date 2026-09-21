import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  ShoppingCart,
  Loader2,
  Search,
  User,
  MapPin,
  Printer,
  Download,
  CheckCircle,
  Calendar
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { salesAPI, productsAPI } from '../../services/api';
import Receipt from '../../components/Receipt';

const NewSale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const receiptRef = useRef();
  
  // Cart to hold multiple products
  const [cart, setCart] = useState([]);
  
  const [saleData, setSaleData] = useState({
    invoiceId: `INV-${Date.now()}`,
    customer: '',
    customerEmail: '',
    customerPhone: '',
    paymentMethod: 'Cash',
    paymentType: 'full',
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
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [cnicError, setCnicError] = useState('');

  useEffect(() => {
    fetchProducts();
    
    // Check if product was pre-selected from catalog
    if (location.state?.selectedProduct) {
      const product = location.state.selectedProduct;
      setSelectedProduct(product);
      setSaleData(prev => ({
        ...prev,
        productId: product._id
      }));
    }
  }, [location.state]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      // Filter only in-stock products
      const inStockProducts = (response.data || []).filter(p => p.stock > 0);
      setProducts(inStockProducts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
  };

  const addToCart = () => {
    if (!selectedProduct) {
      toast({
        title: 'Error',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    if (selectedQuantity < 1) {
      toast({
        title: 'Error',
        description: 'Quantity must be at least 1',
        variant: 'destructive',
      });
      return;
    }

    if (selectedQuantity > selectedProduct.stock) {
      toast({
        title: 'Error',
        description: `Only ${selectedProduct.stock} units available`,
        variant: 'destructive',
      });
      return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.product._id === selectedProduct._id);
    
    if (existingIndex >= 0) {
      // Update quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += selectedQuantity;
      setCart(newCart);
      toast({
        title: 'Updated',
        description: `${selectedProduct.name} quantity updated in cart`,
      });
    } else {
      // Add new item
      setCart([...cart, {
        product: selectedProduct,
        quantity: selectedQuantity
      }]);
      toast({
        title: 'Added to Cart',
        description: `${selectedProduct.name} added to cart`,
      });
    }

    // Reset selection
    setSelectedProduct(null);
    setSelectedQuantity(1);
    setSearchQuery('');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
    toast({
      title: 'Removed',
      description: 'Item removed from cart',
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const newCart = cart.map(item => {
      if (item.product._id === productId) {
        if (newQuantity > item.product.stock) {
          toast({
            title: 'Error',
            description: `Only ${item.product.stock} units available`,
            variant: 'destructive',
          });
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCart(newCart);
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
    
    // Clear CNIC error when user types
    if (name === 'cnic') {
      setCnicError('');
    }
    
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
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(customerDetails.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    // CNIC validation for installment payment type
    if (saleData.paymentType === 'installment') {
      if (!customerDetails.cnic.trim()) {
        setCnicError('CNIC is required for installment payments');
        toast({
          title: 'Error',
          description: 'CNIC is required for installment payments',
          variant: 'destructive',
        });
        return;
      }
      
      // CNIC format validation (13 digits without dashes)
      const cnicRegex = /^\d{13}$/;
      const trimmedCNIC = customerDetails.cnic.trim();
      if (!cnicRegex.test(trimmedCNIC)) {
        setCnicError('CNIC must be 13 digits');
        toast({
          title: 'Error',
          description: 'Invalid CNIC format. Must be 13 digits',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setCnicError('');
    
    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one product to cart',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const createdSales = [];
      
      // Create a sale for each cart item
      for (const item of cart) {
        const salePayload = {
          invoiceId: `INV-${Date.now()}-${item.product._id.slice(-4)}`,
          customer: customerDetails.name,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          productId: item.product._id,
          quantity: item.quantity,
          paymentMethod: saleData.paymentType === 'installment' ? 'Installment' : saleData.paymentMethod,
          paymentType: saleData.paymentType,
          status: saleData.paymentType === 'installment' ? 'completed' : saleData.status,
          notes: saleData.notes,
          customerDetails: customerDetails
        };

        const response = await salesAPI.create(salePayload);
        createdSales.push({
          ...response.data,
          product: item.product,
          quantity: item.quantity
        });
      }
      
      // Store completed sale data for receipt
      setCompletedSale({
        sales: createdSales,
        customerData: customerDetails,
        cartItems: cart,
        createdAt: new Date()
      });
      
      toast({
        title: 'Success',
        description: `${createdSales.length} sale(s) created successfully`,
        variant: 'success',
      });
      
      // Clear cart
      setCart([]);
      
      // Show receipt dialog
      setShowReceipt(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create sale',
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

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Print handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const receiptContent = receiptRef.current;
    
    if (receiptContent && printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${saleData.invoiceId}</title>
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
              
              /* Table styles */
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              
              table th,
              table td {
                border: 1px solid #333 !important;
                padding: 8px;
                text-align: left;
              }
              
              table thead tr {
                background-color: #1f2937 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              table thead th {
                color: white !important;
                font-weight: bold;
              }
              
              table tbody tr {
                border-bottom: 1px solid #d1d5db;
              }
              
              /* Totals alignment */
              .justify-end {
                display: flex !important;
                justify-content: flex-end !important;
              }
              
              .w-80 {
                width: 20rem !important;
                margin-left: auto !important;
              }
              
              /* Borders */
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
              
              .border-t {
                border-top: 1px solid #d1d5db;
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
              
              .border-gray-200 {
                border-color: #e5e7eb;
              }
              
              /* Rounded corners */
              .rounded {
                border-radius: 0.25rem;
              }
              
              /* Backgrounds */
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
              
              .bg-accent\\/50 {
                background-color: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Text colors */
              .text-gray-600 {
                color: #4b5563;
              }
              
              .text-gray-700 {
                color: #374151;
              }
              
              .text-gray-900 {
                color: #111827;
              }
              
              .text-muted-foreground {
                color: #6b7280;
              }
              
              .text-foreground {
                color: #111827;
              }
              
              .text-cyan-400 {
                color: #22d3ee;
              }
              
              /* Spacing */
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .p-8 { padding: 2rem; }
              .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
              .pb-6 { padding-bottom: 1.5rem; }
              .pt-2 { padding-top: 0.5rem; }
              .pt-6 { padding-top: 1.5rem; }
              .mb-1 { margin-bottom: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-5 { margin-bottom: 1.25rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mb-8 { margin-bottom: 2rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .gap-4 { gap: 1rem; }
              .gap-6 { gap: 1.5rem; }
              .gap-8 { gap: 2rem; }
              
              /* Typography */
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-base { font-size: 1rem; line-height: 1.5rem; }
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .uppercase { text-transform: uppercase; }
              .capitalize { text-transform: capitalize; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              
              /* Layout */
              .flex { display: flex; }
              .grid { display: grid; }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .space-y-4 > * + * { margin-top: 1rem; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
              .w-96 { width: 24rem; }
              .rounded { border-radius: 0.25rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .rounded-xl { border-radius: 0.75rem; }
              .rounded-full { border-radius: 9999px; }
              
              /* Image sizing */
              img {
                max-width: 64px !important;
                max-height: 64px !important;
                width: 64px !important;
                height: 64px !important;
                object-fit: contain;
              }
              
              /* List styles */
              .list-disc {
                list-style-type: disc;
              }
              
              .list-inside {
                list-style-position: inside;
              }
              
              /* Page breaks */
              .page-break {
                page-break-before: always;
              }
              
              table {
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body>
            ${receiptContent.innerHTML}
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
          description: 'Receipt sent to printer',
          variant: 'success',
        });
      }, 500);
    }
  };

  // Download as PDF handler
  const handleDownload = () => {
    handlePrint(); // Use same print dialog, user can save as PDF
  };

  // Navigate to create installment plan
  const handleCreateInstallmentPlan = () => {
    setShowReceipt(false);
    if (completedSale?.saleResponse?.data?._id) {
      navigate('/installments/create', { 
        state: { 
          preSelectedSale: completedSale.saleResponse.data,
          customerCNIC: completedSale.customerData.cnic 
        } 
      });
    } else {
      navigate('/installments/create');
    }
  };

  // Navigate to history
  const handleViewHistory = () => {
    setShowReceipt(false);
    navigate('/sales/history');
  };

  // Create another sale
  const handleNewSale = () => {
    setShowReceipt(false);
    setCompletedSale(null);
    setSelectedProduct(null);
    setSearchQuery('');
    
    // Reset sale data with new invoice ID
    setSaleData({
      invoiceId: `INV-${Date.now()}`,
      customer: '',
      customerEmail: '',
      customerPhone: '',
      productId: '',
      quantity: 1,
      paymentMethod: 'Cash',
      paymentType: 'full',
      status: 'completed',
      notes: ''
    });
    
    // Reset customer details
    setCustomerDetails({
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
    
    // Show success toast
    toast({
      title: 'Ready for New Sale',
      description: 'Form has been reset. You can create a new sale now.',
      variant: 'success',
    });
  };

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
            onClick={() => navigate('/sales/dashboard')}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create New Sale</h1>
          <p className="text-muted-foreground">Record a new transaction</p>
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
                    <Label htmlFor="cnic">
                      CNIC {saleData.paymentType === 'installment' && <span className="text-red-400">*</span>}
                    </Label>
                    <Input
                      id="cnic"
                      name="cnic"
                      type="text"
                      value={customerDetails.cnic}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        setCustomerDetails(prev => ({ ...prev, cnic: value }));
                        setCnicError('');
                      }}
                      placeholder="13 digit CNIC (e.g., 7150123491057)"
                      className={`bg-background border-border ${cnicError ? 'border-red-500' : ''}`}
                      maxLength={13}
                      required={saleData.paymentType === 'installment'}
                    />
                    {cnicError && (
                      <p className="text-xs text-red-400 mt-1">{cnicError}</p>
                    )}
                    {saleData.paymentType === 'installment' && !cnicError && (
                      <p className="text-xs text-amber-400 mt-1">Required for installment payments</p>
                    )}
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

              {/* Product Selection */}
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Add Products to Cart</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedProduct ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-background border-border"
                        />
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {loading ? (
                          <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
                          </div>
                        ) : filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <div
                              key={product._id}
                              onClick={() => handleProductSelect(product)}
                              className="p-4 bg-accent/30 rounded-lg hover:bg-accent/50 cursor-pointer transition-all border border-transparent hover:border-cyan-500/50"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-foreground">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">{product.model}</p>
                                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-cyan-400">{formatCurrency(product.price)}</p>
                                  <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No products available
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold text-foreground text-lg">{selectedProduct.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedProduct.model}</p>
                            <p className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProduct(null)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Cancel
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Unit Price</p>
                            <p className="text-xl font-bold text-cyan-400">{formatCurrency(selectedProduct.price)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Available Stock</p>
                            <p className="text-xl font-bold text-emerald-400">{selectedProduct.stock} units</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="selectedQuantity">Quantity</Label>
                          <Input
                            id="selectedQuantity"
                            type="number"
                            min="1"
                            max={selectedProduct.stock}
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                            className="bg-background border-border"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={addToCart}
                          className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paymentType">Payment Type *</Label>
                    <select
                      id="paymentType"
                      name="paymentType"
                      value={saleData.paymentType}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    >
                      <option value="full">Full Payment</option>
                      <option value="installment">Installment</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {saleData.paymentType === 'installment' 
                        ? 'Sale will be eligible for installment plan creation' 
                        : 'Payment completed in full'}
                    </p>
                  </div>

                  {saleData.paymentType !== 'installment' && (
                    <>
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
                        </select>
                      </div>
                    </>
                  )}
                  
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

            {/* Right Column - Cart & Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Cart */}
              {cart.length > 0 && (
                <Card className="bg-card/90 border-border backdrop-blur-sm sticky top-32">
                  <CardHeader>
                    <CardTitle>Cart ({cart.length} items)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.product._id} className="p-3 bg-accent/30 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)} × {item.quantity}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product._id)}
                              className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.product._id, Number(e.target.value))}
                              className="w-20 h-8 text-center"
                            />
                            <p className="font-bold text-cyan-400 flex-1 text-right">{formatCurrency(item.product.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-lg">Total:</span>
                          <span className="font-bold text-2xl text-cyan-400">{formatCurrency(calculateCartTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Summary */}
              <Card className="bg-card/90 border-border backdrop-blur-sm sticky top-32">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invoice ID</span>
                      <span className="font-mono text-foreground">{saleData.invoiceId}</span>
                    </div>
                    
                    {cart.length > 0 ? (
                      <>
                        <div className="border-t border-border pt-3">
                          <p className="text-sm text-muted-foreground mb-2">Items</p>
                          <div className="space-y-2">
                            {cart.map((item) => (
                              <div key={item.product._id} className="flex justify-between text-sm">
                                <span className="text-foreground">{item.product.name} × {item.quantity}</span>
                                <span className="font-semibold text-foreground">{formatCurrency(item.product.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border-t border-border pt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-foreground">Total Amount</span>
                            <span className="text-2xl font-bold text-cyan-400">{formatCurrency(calculateCartTotal())}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No items in cart</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Sale...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create Sale
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Sale Completed Successfully!</DialogTitle>
                <DialogDescription>
                  Your receipt is ready. You can print or download it below.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Receipt Preview */}
          {completedSale && (
            <div className="p-6">
              <Receipt
                ref={receiptRef}
                saleData={completedSale.sales?.[0] || {}}
                customerData={completedSale.customerData}
                cartItems={completedSale.cartItems}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 pt-4 border-t border-border bg-accent/30">
            <div className="flex flex-wrap gap-3 justify-end">
              {completedSale?.saleData?.paymentType === 'installment' && (
                <Button
                  onClick={handleCreateInstallmentPlan}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Installment Plan
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleNewSale}
                className="border-border"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                New Sale
              </Button>
              
              <Button
                variant="outline"
                onClick={handleViewHistory}
                className="border-border"
              >
                View History
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownload}
                className="border-border"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                onClick={handlePrint}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewSale;
