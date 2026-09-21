import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, FileText } from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { salesAPI } from '../../services/api';
import { useToast } from '@/hooks/use-toast';
import Logo from '../../assets/Logo.png';
import HandoverModal from '../../components/HandoverDocuments';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const SaleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportRef = useRef();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getById(id);
      setSale(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sale details',
        variant: 'destructive',
      });
      navigate('/admin/sales-records');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const reportContent = reportRef.current;
    
    if (reportContent && printWindow) {
      const fileName = `Sales_Report_${sale.invoiceId}_${new Date().toISOString().split('T')[0]}`;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: white;
                color: #1f2937;
                line-height: 1.4;
                font-size: 11px;
              }
              
              @media print {
                body { 
                  margin: 0;
                  padding: 0;
                }
                @page { 
                  margin: 1.5cm 1.2cm;
                  size: A4;
                }
              }
              
              .report-container {
                max-width: 100%;
                margin: 0 auto;
              }
              
              /* Header Styling - Compact */
              .report-header {
                padding: 15px 0;
                margin-bottom: 20px;
                border-bottom: 3px solid #111827;
                background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
              }
              
              .company-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 15px;
              }
              
              .company-logo {
                width: 60px;
                height: 60px;
                object-fit: contain;
              }
              
              .company-info {
                text-align: left;
              }
              
              .company-name {
                font-size: 24px;
                font-weight: 800;
                color: #111827;
                margin-bottom: 3px;
              }
              
              .company-tagline {
                font-size: 11px;
                color: #6b7280;
                font-style: italic;
              }
              
              .report-title {
                font-size: 20px;
                font-weight: 800;
                color: #111827;
                letter-spacing: 1px;
                margin-bottom: 3px;
                text-transform: uppercase;
                text-align: center;
              }
              
              .report-subtitle {
                font-size: 10px;
                color: #6b7280;
                font-weight: 500;
                text-align: center;
              }
              
              /* Section Styling - Compact */
              .section {
                margin-bottom: 12px;
                page-break-inside: avoid;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 10px;
              }
              
              .section-title {
                font-size: 11px;
                font-weight: 700;
                color: #111827;
                padding-bottom: 6px;
                margin-bottom: 8px;
                border-bottom: 2px solid #3b82f6;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              /* Grid Layout for Better Space Usage */
              .info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-bottom: 8px;
              }
              
              .info-grid-2 {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-bottom: 8px;
              }
              
              .info-item {
                padding: 6px;
                background: #f9fafb;
                border-radius: 3px;
                border-left: 2px solid #e5e7eb;
              }
              
              .info-label {
                font-size: 8px;
                color: #6b7280;
                font-weight: 700;
                margin-bottom: 2px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
              }
              
              .info-value {
                font-size: 10px;
                color: #111827;
                font-weight: 600;
              }
              
              .info-value.large {
                font-size: 12px;
                color: #3b82f6;
                font-weight: 700;
              }
              
              /* Status Badge - Compact */
              .status-badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.3px;
              }
              
              .status-completed {
                background-color: #d1fae5;
                color: #065f46;
                border: 1px solid #10b981;
              }
              
              .status-pending {
                background-color: #fed7aa;
                color: #92400e;
                border: 1px solid #f59e0b;
              }
              
              .status-processing {
                background-color: #dbeafe;
                color: #1e40af;
                border: 1px solid #3b82f6;
              }
              
              .status-cancelled {
                background-color: #fee2e2;
                color: #991b1b;
                border: 1px solid #ef4444;
              }
              
              /* Product Section - Compact */
              .product-highlight {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                padding: 10px;
                border-radius: 4px;
                border: 2px solid #3b82f6;
              }
              
              /* Financial Summary - Compact */
              .financial-summary {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                padding: 12px;
                border-radius: 4px;
                border: 2px solid #10b981;
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                font-size: 10px;
                color: #374151;
              }
              
              .summary-row.total {
                border-top: 2px solid #111827;
                margin-top: 8px;
                padding-top: 8px;
                font-size: 13px;
                font-weight: 800;
                color: #111827;
              }
              
              .amount {
                color: #10b981;
                font-weight: 700;
              }
              
              .amount.total {
                color: #111827;
                font-size: 14px;
              }
              
              /* Notes Section - Compact */
              .notes-box {
                background: #fffbeb;
                padding: 8px;
                border-radius: 4px;
                border-left: 3px solid #f59e0b;
              }
              
              .notes-box .info-value {
                color: #92400e;
                line-height: 1.5;
                font-size: 9px;
              }
              
              /* Footer - Compact */
              .report-footer {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 2px solid #111827;
                text-align: center;
              }
              
              .footer-text {
                font-size: 8px;
                color: #6b7280;
                margin-bottom: 3px;
              }
              
              .timestamp {
                font-size: 8px;
                color: #9ca3af;
                font-style: italic;
              }
              
              /* Two-Column Layout for Main Content */
              .two-column-layout {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
              }
              
              .full-width {
                grid-column: 1 / -1;
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
        
        // Don't close immediately - let user complete the print/save dialog
        printWindow.onafterprint = () => {
          printWindow.close();
        };
        
        toast({
          title: 'Success',
          description: 'Report ready - You can print or save as PDF',
        });
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center min-h-[60vh] pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!sale) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
      <Navbar />
      <NavigationPanel />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-32">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Sale Details</h1>
              <p className="text-muted-foreground">Invoice: {sale.invoiceId}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowHandoverModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                <FileText className="w-4 h-4 mr-2" />
                Handover Documents
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sale Information */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice ID</p>
                  <p className="font-semibold">{sale.invoiceId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold">{new Date(sale.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
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
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-semibold">{sale.paymentMethod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                  <p className="font-semibold text-lg">{sale.customer}</p>
                </div>
                {sale.customerEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                    <p className="font-semibold">{sale.customerEmail}</p>
                  </div>
                )}
                {sale.customerPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                    <p className="font-semibold">{sale.customerPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer Since</p>
                  <p className="font-semibold">{new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
                {sale.customerCnic && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customer CNIC</p>
                    <p className="font-semibold font-mono text-cyan-400">{sale.customerCnic}</p>
                  </div>
                )}
                {sale.customerAddress && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="font-semibold">{sale.customerAddress}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales Representative Information */}
          {sale.soldBy && (
            <Card className="bg-card/90 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Sales Representative</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-semibold text-lg">{sale.soldBy.username || 'N/A'}</p>
                  </div>
                  {sale.soldBy.email && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-semibold">{sale.soldBy.email}</p>
                    </div>
                  )}
                  {sale.soldBy.role && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <p className="font-semibold capitalize">{sale.soldBy.role}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                    <p className="font-semibold">{sale.soldBy._id?.slice(-8).toUpperCase() || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Information */}
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Product Model</p>
                    <p className="font-semibold text-lg">{sale.model}</p>
                  </div>
                  {sale.product?.sku && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">SKU</p>
                      <p className="font-semibold">{sale.product.sku}</p>
                    </div>
                  )}
                  {sale.product?.category && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="font-semibold capitalize">{sale.product.category}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                    <p className="font-semibold">{sale.quantity} unit(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                    <p className="font-semibold">Rs. {sale.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-cyan-400">Rs. {sale.total.toLocaleString()}</p>
                  </div>
                  {sale.chassisNumber && (
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 md:col-span-2">
                      <p className="text-xs uppercase font-bold text-cyan-400 mb-2">Serialized Vehicle Identification</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Chassis (VIN):</span>
                          <p className="font-mono font-bold text-foreground text-sm">{sale.chassisNumber}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Motor Number:</span>
                          <p className="font-mono font-bold text-foreground">{sale.motorNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Battery Serial:</span>
                          <p className="font-mono font-bold text-foreground">{sale.batterySerial || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {sale.notes && (
            <Card className="bg-card/90 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{sale.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Hidden Report for Printing - Optimized for Single Page */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef} className="report-container">
          {/* Header with Logo and Company Info */}
          <div className="report-header">
            <div className="company-header">
              <img src={Logo} alt="Company Logo" className="company-logo" />
              <div className="company-info">
                <div className="company-name">Unicorn EV Bikes</div>
                <div className="company-tagline">Electric Mobility Solutions</div>
              </div>
            </div>
            <div className="report-title">SALES TRANSACTION REPORT</div>
            <div className="report-subtitle">Invoice: {sale.invoiceId} | Generated: {new Date().toLocaleDateString()}</div>
          </div>

          {/* Two-Column Layout for Main Content */}
          <div className="two-column-layout">
            
            {/* Left Column */}
            <div>
              {/* Transaction Information */}
              <div className="section">
                <div className="section-title">Transaction Details</div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Invoice ID</div>
                    <div className="info-value large">{sale.invoiceId}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Date</div>
                    <div className="info-value">{new Date(sale.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Time</div>
                    <div className="info-value">{new Date(sale.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="info-grid-2">
                  <div className="info-item">
                    <div className="info-label">Status</div>
                    <div className="info-value">
                      <span className={`status-badge status-${sale.status}`}>{sale.status}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Payment Method</div>
                    <div className="info-value">{sale.paymentMethod}</div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="section">
                <div className="section-title">Customer Details</div>
                <div className="info-grid-2">
                  <div className="info-item">
                    <div className="info-label">Customer Name</div>
                    <div className="info-value">{sale.customer}</div>
                  </div>
                  {sale.customerEmail && (
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{sale.customerEmail}</div>
                    </div>
                  )}
                  {sale.customerPhone && (
                    <div className="info-item">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{sale.customerPhone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Representative */}
              {sale.soldBy && (
                <div className="section">
                  <div className="section-title">Sales Representative</div>
                  <div className="info-grid-2">
                    <div className="info-item">
                      <div className="info-label">Name</div>
                      <div className="info-value">{sale.soldBy.username || 'N/A'}</div>
                    </div>
                    {sale.soldBy.email && (
                      <div className="info-item">
                        <div className="info-label">Email</div>
                        <div className="info-value">{sale.soldBy.email}</div>
                      </div>
                    )}
                    {sale.soldBy.role && (
                      <div className="info-item">
                        <div className="info-label">Role</div>
                        <div className="info-value" style={{ textTransform: 'capitalize' }}>{sale.soldBy.role}</div>
                      </div>
                    )}
                    <div className="info-item">
                      <div className="info-label">Employee ID</div>
                      <div className="info-value">{sale.soldBy._id?.slice(-8).toUpperCase() || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              {/* Product Information */}
              <div className="section">
                <div className="section-title">Product Details</div>
                <div className="product-highlight">
                  <div className="info-grid-2">
                    <div className="info-item" style={{ background: 'transparent', border: 'none' }}>
                      <div className="info-label">Product Model</div>
                      <div className="info-value large">{sale.model}</div>
                    </div>
                    {sale.product?.sku && (
                      <div className="info-item" style={{ background: 'transparent', border: 'none' }}>
                        <div className="info-label">SKU</div>
                        <div className="info-value">{sale.product.sku}</div>
                      </div>
                    )}
                    {sale.product?.category && (
                      <div className="info-item" style={{ background: 'transparent', border: 'none' }}>
                        <div className="info-label">Category</div>
                        <div className="info-value" style={{ textTransform: 'capitalize' }}>{sale.product.category}</div>
                      </div>
                    )}
                    <div className="info-item" style={{ background: 'transparent', border: 'none' }}>
                      <div className="info-label">Quantity</div>
                      <div className="info-value">{sale.quantity} unit(s)</div>
                    </div>
                    <div className="info-item" style={{ background: 'transparent', border: 'none' }}>
                      <div className="info-label">Unit Price</div>
                      <div className="info-value">Rs. {sale.price.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="section">
                <div className="section-title">Financial Summary</div>
                <div className="financial-summary">
                  <div className="summary-row">
                    <span>Subtotal ({sale.quantity} × Rs. {sale.price.toLocaleString()})</span>
                    <span className="amount">Rs. {sale.total.toLocaleString()}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount</span>
                    <span className="amount total">Rs. {sale.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {sale.notes && (
                <div className="section">
                  <div className="section-title">Additional Notes</div>
                  <div className="notes-box">
                    <div className="info-value">{sale.notes}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="report-footer">
            <div className="footer-text">This is a computer-generated report and does not require a signature.</div>
            <div className="timestamp">Report generated on {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Handover Documents Modal */}
      {sale && (
        <HandoverModal
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          sale={sale}
          customer={{
            name: sale.customer,
            cnic: sale.customerCnic,
            phone: sale.customerPhone,
            address: sale.customerAddress,
          }}
          vehicle={{
            name: sale.model,
            chassisNumber: sale.chassisNumber,
            motorNumber: sale.motorNumber,
            batterySerial: sale.batterySerial,
            color: sale.color,
          }}
        />
      )}
    </div>
  );
};

export default SaleView;