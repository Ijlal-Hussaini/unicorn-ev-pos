import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { productsAPI, uploadAPI } from '../../services/api';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const ManageInventory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    model: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    supplier: '',
    description: '',
    specifications: {
      maxSpeed: '',
      range: '',
      motor: '',
      controller: '',
      batteries: '',
      motorBatteryWarranty: '',
      brake: '',
      extraFeatures: '',
      tyre: '',
      suspension: '',
      charging: '',
      batteryType: '',
      chargingTime: '',
      modes: '',
    },
  });
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle edit trigger from ProductView page
  useEffect(() => {
    if (location.state?.editProductId && products.length > 0) {
      const productToEdit = products.find(p => p._id === location.state.editProductId);
      if (productToEdit) {
        handleEditProduct(productToEdit);
        // Clear the state to prevent re-triggering
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state?.editProductId, products.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await productsAPI.getStats();
      if (response.data) {
        setStats({
          totalItems: response.data.totalItems || 0,
          lowStock: response.data.lowStockItems || 0,
          outOfStock: response.data.outOfStockItems || 0,
          totalValue: response.data.totalValue || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProductData({
      name: product.name || '',
      model: product.model || '',
      sku: product.sku || '',
      category: product.category || '',
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
      stock: product.stock?.toString() || '',
      minStock: product.minStock?.toString() || '',
      supplier: product.supplier || '',
      description: product.description || '',
      specifications: {
        maxSpeed: product.specifications?.maxSpeed || '',
        range: product.specifications?.range || '',
        motor: product.specifications?.motor || '',
        controller: product.specifications?.controller || '',
        batteries: product.specifications?.batteries || '',
        motorBatteryWarranty: product.specifications?.motorBatteryWarranty || '',
        brake: product.specifications?.brake || '',
        extraFeatures: product.specifications?.extraFeatures || '',
        tyre: product.specifications?.tyre || '',
        suspension: product.specifications?.suspension || '',
        charging: product.specifications?.charging || '',
        batteryType: product.specifications?.batteryType || '',
        chargingTime: product.specifications?.chargingTime || '',
        modes: product.specifications?.modes || '',
      },
    });
    setExistingPhotos(product.photos || []);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setIsEditDialogOpen(true);
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos(existingPhotos.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = async () => {
    // Validation
    if (!newProductData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.model.trim()) {
      toast({
        title: 'Error',
        description: 'Model is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.sku.trim()) {
      toast({
        title: 'Error',
        description: 'SKU is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.price || parseFloat(newProductData.price) <= 0) {
      toast({
        title: 'Error',
        description: 'Valid price is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.cost || parseFloat(newProductData.cost) < 0) {
      toast({
        title: 'Error',
        description: 'Valid cost is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.stock || parseInt(newProductData.stock) < 0) {
      toast({
        title: 'Error',
        description: 'Valid stock quantity is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.supplier.trim()) {
      toast({
        title: 'Error',
        description: 'Supplier is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrls = [...existingPhotos];
      
      // Upload new photos if selected
      if (photoFiles.length > 0) {
        setUploadingPhoto(true);
        try {
          const uploadResponse = await uploadAPI.uploadProductPhoto(photoFiles);
          photoUrls = [...photoUrls, ...uploadResponse.data.photoUrls];
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          toast({
            title: 'Warning',
            description: 'Product will be updated without new photos. Photo upload failed.',
            variant: 'destructive',
          });
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Clean up specifications - remove empty strings
      const cleanedSpecifications = {};
      Object.keys(newProductData.specifications).forEach(key => {
        if (newProductData.specifications[key] && newProductData.specifications[key].trim()) {
          cleanedSpecifications[key] = newProductData.specifications[key].trim();
        }
      });

      const productPayload = {
        name: newProductData.name.trim(),
        sku: newProductData.sku.trim().toUpperCase(),
        price: parseFloat(newProductData.price),
        cost: parseFloat(newProductData.cost),
        stock: parseInt(newProductData.stock),
        minStock: parseInt(newProductData.minStock) || 10,
        supplier: newProductData.supplier.trim(),
        category: newProductData.category.trim() || 'EV Bikes',
        photos: photoUrls,
      };

      // Add optional fields only if they have values
      if (newProductData.model && newProductData.model.trim()) {
        productPayload.model = newProductData.model.trim();
      }

      if (newProductData.description && newProductData.description.trim()) {
        productPayload.description = newProductData.description.trim();
      }

      // Only add specifications if there are any non-empty values
      if (Object.keys(cleanedSpecifications).length > 0) {
        productPayload.specifications = cleanedSpecifications;
      }

      await productsAPI.update(editingProduct._id, productPayload);
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
        variant: 'success',
      });
      
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setExistingPhotos([]);
      setNewProductData({
        name: '',
        model: '',
        sku: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        supplier: '',
        description: '',
        specifications: {
          maxSpeed: '',
          range: '',
          motor: '',
          controller: '',
          batteries: '',
          motorBatteryWarranty: '',
          brake: '',
          extraFeatures: '',
          tyre: '',
          suspension: '',
          charging: '',
          batteryType: '',
          chargingTime: '',
          modes: '',
        },
      });
      
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Product update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(productId);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
        variant: 'success',
      });
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (photoFiles.length + files.length > 5) {
      toast({
        title: 'Error',
        description: 'Maximum 5 photos allowed per product',
        variant: 'destructive',
      });
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: `${file.name} is larger than 5MB`,
          variant: 'destructive',
        });
        return;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setPhotoPreviews([...photoPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setPhotoFiles([...photoFiles, ...validFiles]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleExportInventory = () => {
    try {
      setIsExporting(true);
      
      // Generate inventory report HTML
      const reportHTML = generateInventoryReportHTML();
      printReport(reportHTML, 'inventory-export');
      
      toast({
        title: 'Success',
        description: 'Inventory report sent to printer',
      });
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to export inventory report',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

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
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const generateInventoryReportHTML = () => {
    const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalCost = filteredProducts.reduce((sum, p) => sum + ((p.cost || 0) * p.stock), 0);
    const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
    const lowStockItems = filteredProducts.filter(p => p.stock < (p.minStock || 10));
    const outOfStockItems = filteredProducts.filter(p => p.stock === 0);

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
              <h2 class="text-xl font-bold text-gray-900">INVENTORY EXPORT REPORT</h2>
              <p class="text-xs text-gray-600">Generated: ${new Date().toLocaleDateString()}</p>
              <p class="text-xs text-gray-600">Total Items: ${filteredProducts.length}</p>
            </div>
          </div>
        </div>

        <!-- Summary Statistics -->
        <div class="mb-6 bg-gray-50 p-4 rounded">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Inventory Summary</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="text-center">
              <p class="text-xs text-gray-600 mb-1">Total Items</p>
              <p class="text-2xl font-bold text-gray-900">${stats.totalItems}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600 mb-1">Total Stock</p>
              <p class="text-2xl font-bold text-gray-900">${totalStock}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600 mb-1">Low Stock</p>
              <p class="text-2xl font-bold text-orange-600">${stats.lowStock}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-600 mb-1">Out of Stock</p>
              <p class="text-2xl font-bold text-red-600">${stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <!-- Financial Overview -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Financial Overview</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Total Inventory Value</p>
              <p class="text-2xl font-bold text-emerald-700">Rs. ${totalValue.toLocaleString()}</p>
              <p class="text-xs text-gray-600 mt-1">At selling price</p>
            </div>
            <div class="bg-cyan-50 border-2 border-cyan-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Total Cost Value</p>
              <p class="text-2xl font-bold text-cyan-700">Rs. ${totalCost.toLocaleString()}</p>
              <p class="text-xs text-gray-600 mt-1">At cost price</p>
            </div>
            <div class="bg-purple-50 border-2 border-purple-300 rounded p-4">
              <p class="text-xs text-gray-600 mb-1">Potential Profit</p>
              <p class="text-2xl font-bold text-purple-700">Rs. ${(totalValue - totalCost).toLocaleString()}</p>
              <p class="text-xs text-gray-600 mt-1">If all sold</p>
            </div>
          </div>
        </div>

        <!-- Inventory Details Table -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Complete Inventory List</h3>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-800 text-white">
                <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">SKU</th>
                <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Product Name</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Stock</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Min Stock</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Price</th>
                <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Cost</th>
                <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Supplier</th>
                <th class="border border-gray-400 py-2 px-3 text-center text-xs font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map((product, index) => {
                const status = getStockIndicator(product.stock, product.minStock || 10);
                const statusColor = status === 'in-stock' ? 'text-emerald-600' : status === 'low-stock' ? 'text-orange-600' : 'text-red-600';
                const statusBg = status === 'in-stock' ? 'bg-emerald-50' : status === 'low-stock' ? 'bg-orange-50' : 'bg-red-50';
                return `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="border border-gray-300 py-2 px-3 text-xs font-semibold">${product.sku || 'N/A'}</td>
                    <td class="border border-gray-300 py-2 px-3 text-xs">
                      <div class="font-medium">${product.name}</div>
                      <div class="text-gray-600">${product.model || product.category || ''}</div>
                    </td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold ${statusColor}">${product.stock}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">${product.minStock || 10}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${product.price?.toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-right text-xs">Rs. ${(product.cost || 0).toLocaleString()}</td>
                    <td class="border border-gray-300 py-2 px-3 text-xs">${product.supplier || 'N/A'}</td>
                    <td class="border border-gray-300 py-2 px-3 text-center">
                      <span class="${statusBg} ${statusColor} px-2 py-1 rounded text-xs font-medium">
                        ${status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
              <tr class="bg-gray-800 text-white font-bold">
                <td colspan="2" class="border border-gray-400 py-2 px-3 text-xs">TOTAL</td>
                <td class="border border-gray-400 py-2 px-3 text-right text-xs">${totalStock}</td>
                <td class="border border-gray-400 py-2 px-3 text-right text-xs">-</td>
                <td class="border border-gray-400 py-2 px-3 text-right text-xs">Rs. ${totalValue.toLocaleString()}</td>
                <td class="border border-gray-400 py-2 px-3 text-right text-xs">Rs. ${totalCost.toLocaleString()}</td>
                <td colspan="2" class="border border-gray-400 py-2 px-3 text-xs">${filteredProducts.length} Products</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${lowStockItems.length > 0 ? `
          <!-- Low Stock Alert -->
          <div class="mb-6 bg-orange-50 border-2 border-orange-300 rounded p-4">
            <h3 class="text-sm font-bold text-gray-900 mb-2">⚠️ Low Stock Alert</h3>
            <p class="text-xs text-gray-700 mb-3">The following items need restocking:</p>
            <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
              ${lowStockItems.slice(0, 10).map(item => `
                <li><strong>${item.name}</strong> (${item.sku}) - Only ${item.stock} units remaining (Min: ${item.minStock || 10})</li>
              `).join('')}
              ${lowStockItems.length > 10 ? `<li class="font-semibold">...and ${lowStockItems.length - 10} more items</li>` : ''}
            </ul>
          </div>
        ` : ''}

        ${outOfStockItems.length > 0 ? `
          <!-- Out of Stock Alert -->
          <div class="mb-6 bg-red-50 border-2 border-red-300 rounded p-4">
            <h3 class="text-sm font-bold text-gray-900 mb-2">🚨 Out of Stock Alert</h3>
            <p class="text-xs text-gray-700 mb-3">The following items are completely out of stock:</p>
            <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
              ${outOfStockItems.map(item => `
                <li><strong>${item.name}</strong> (${item.sku}) - Supplier: ${item.supplier || 'N/A'}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Supplier Breakdown -->
        ${uniqueSuppliers.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Inventory by Supplier</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-800 text-white">
                  <th class="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Supplier</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Products</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Total Stock</th>
                  <th class="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Total Value</th>
                </tr>
              </thead>
              <tbody>
                ${uniqueSuppliers.map((supplier, index) => {
                  const supplierProducts = filteredProducts.filter(p => p.supplier === supplier);
                  const supplierStock = supplierProducts.reduce((sum, p) => sum + p.stock, 0);
                  const supplierValue = supplierProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
                  return `
                    <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                      <td class="border border-gray-300 py-2 px-3 text-xs font-medium">${supplier}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs">${supplierProducts.length}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">${supplierStock}</td>
                      <td class="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">Rs. ${supplierValue.toLocaleString()}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="border-t-2 border-gray-800 pt-4 mt-8">
          <div class="text-center text-xs text-gray-600">
            <p class="font-bold mb-1">Unicorn EV Bikes - Inventory Export Report</p>
            <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
            <p class="mt-2 text-gray-500">This is a computer-generated report | Confidential</p>
          </div>
        </div>
      </div>
    `;
  };

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
        
        .grid-cols-3 {
          grid-template-columns: repeat(3, 1fr);
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
        
        .border-emerald-300 {
          border-color: #6ee7b7;
        }
        
        .border-cyan-300 {
          border-color: #67e8f9;
        }
        
        .border-purple-300 {
          border-color: #d8b4fe;
        }
        
        .border-orange-300 {
          border-color: #fdba74;
        }
        
        .border-red-300 {
          border-color: #fca5a5;
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
        
        .bg-emerald-50 {
          background-color: #ecfdf5 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .bg-cyan-50 {
          background-color: #ecfeff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .bg-purple-50 {
          background-color: #faf5ff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .bg-orange-50 {
          background-color: #fff7ed !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .bg-red-50 {
          background-color: #fef2f2 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .text-emerald-700 {
          color: #047857;
        }
        
        .text-emerald-600 {
          color: #059669;
        }
        
        .text-cyan-700 {
          color: #0e7490;
        }
        
        .text-purple-700 {
          color: #7e22ce;
        }
        
        .text-orange-600 {
          color: #ea580c;
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
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
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
        .gap-4 { gap: 1rem; }
        
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .rounded { border-radius: 0.25rem; }
        
        .list-disc { list-style-type: disc; }
        .list-inside { list-style-position: inside; }
        
        table {
          page-break-inside: avoid;
        }
      </style>
    `;
  };

  const handleAddProduct = async () => {
    // Validation
    if (!newProductData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.model.trim()) {
      toast({
        title: 'Error',
        description: 'Model is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.sku.trim()) {
      toast({
        title: 'Error',
        description: 'SKU is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.price || parseFloat(newProductData.price) <= 0) {
      toast({
        title: 'Error',
        description: 'Valid price is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.cost || parseFloat(newProductData.cost) < 0) {
      toast({
        title: 'Error',
        description: 'Valid cost is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.stock || parseInt(newProductData.stock) < 0) {
      toast({
        title: 'Error',
        description: 'Valid stock quantity is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newProductData.supplier.trim()) {
      toast({
        title: 'Error',
        description: 'Supplier is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrls = [];
      
      // Upload photos first if selected
      if (photoFiles.length > 0) {
        setUploadingPhoto(true);
        try {
          const uploadResponse = await uploadAPI.uploadProductPhoto(photoFiles);
          photoUrls = uploadResponse.data.photoUrls;
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          toast({
            title: 'Warning',
            description: 'Product will be added without photos. Photo upload failed.',
            variant: 'destructive',
          });
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Clean up specifications - remove empty strings
      const cleanedSpecifications = {};
      Object.keys(newProductData.specifications).forEach(key => {
        if (newProductData.specifications[key] && newProductData.specifications[key].trim()) {
          cleanedSpecifications[key] = newProductData.specifications[key].trim();
        }
      });

      const productPayload = {
        name: newProductData.name.trim(),
        sku: newProductData.sku.trim().toUpperCase(),
        price: parseFloat(newProductData.price),
        cost: parseFloat(newProductData.cost),
        stock: parseInt(newProductData.stock),
        minStock: parseInt(newProductData.minStock) || 10,
        supplier: newProductData.supplier.trim(),
        category: newProductData.category.trim() || 'EV Bikes',
        photos: photoUrls,
      };

      // Add optional fields only if they have values
      if (newProductData.model && newProductData.model.trim()) {
        productPayload.model = newProductData.model.trim();
      }

      if (newProductData.description && newProductData.description.trim()) {
        productPayload.description = newProductData.description.trim();
      }

      // Only add specifications if there are any non-empty values
      if (Object.keys(cleanedSpecifications).length > 0) {
        productPayload.specifications = cleanedSpecifications;
      }

      await productsAPI.create(productPayload);
      
      toast({
        title: 'Success',
        description: 'Product added successfully',
        variant: 'success',
      });
      
      setIsAddDialogOpen(false);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setNewProductData({
        name: '',
        model: '',
        sku: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        supplier: '',
        description: '',
        specifications: {
          maxSpeed: '',
          range: '',
          motor: '',
          controller: '',
          batteries: '',
          motorBatteryWarranty: '',
          brake: '',
          extraFeatures: '',
          tyre: '',
          suspension: '',
          charging: '',
          batteryType: '',
          chargingTime: '',
          modes: '',
        },
      });
      
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Product creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockIndicator = (stock, minStock) => {
    if (stock === 0) return 'out-of-stock';
    if (stock < minStock) return 'low-stock';
    return 'in-stock';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return 'bg-emerald-500/20 text-emerald-400 border-0';
      case 'low-stock':
        return 'bg-orange-500/20 text-orange-400 border-0';
      case 'out-of-stock':
        return 'bg-red-500/20 text-red-400 border-0';
      default:
        return 'bg-muted text-muted-foreground border-0';
    }
  };

  // Filter products based on search query and filters
  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const productStatus = getStockIndicator(product.stock, product.minStock || 10);
    const matchesStatus = statusFilter === 'all' || productStatus === statusFilter;
    
    // Supplier filter
    const matchesSupplier = supplierFilter === 'all' || product.supplier === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))].sort();

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredProducts.slice(startIndex, endIndex);

  const statsData = [
    { 
      label: 'Total Items', 
      value: stats.totalItems.toString(), 
      icon: Package,
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      label: 'Low Stock Items', 
      value: stats.lowStock.toString(), 
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-600'
    },
    { 
      label: 'Out of Stock', 
      value: stats.outOfStock.toString(), 
      icon: TrendingDown,
      color: 'from-red-500 to-pink-600'
    },
    { 
      label: 'Total Value', 
      value: `Rs. ${(parseFloat(stats.totalValue) / 1000).toFixed(1)}K`, 
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Manage Inventory</h1>
          <p className="text-muted-foreground">Track and manage your bike inventory and stock levels</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-card/90 border-border backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
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
                    placeholder="Search by SKU, model, or name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-10 bg-background border-border"
                  />
                </div>
                
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`border-border ${(statusFilter !== 'all' || supplierFilter !== 'all') ? 'bg-cyan-500/10 border-cyan-500/50' : ''}`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {(statusFilter !== 'all' || supplierFilter !== 'all') && (
                        <span className="ml-2 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {(statusFilter !== 'all' ? 1 : 0) + (supplierFilter !== 'all' ? 1 : 0)}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filter Products</DialogTitle>
                      <DialogDescription>
                        Filter products by status and supplier
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
                          <option value="in-stock">In Stock</option>
                          <option value="low-stock">Low Stock</option>
                          <option value="out-of-stock">Out of Stock</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="supplier-filter">Supplier</Label>
                        <select
                          id="supplier-filter"
                          value={supplierFilter}
                          onChange={(e) => setSupplierFilter(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="all">All Suppliers</option>
                          {uniqueSuppliers.map((supplier) => (
                            <option key={supplier} value={supplier}>
                              {supplier}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStatusFilter('all');
                          setSupplierFilter('all');
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
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        Apply Filters
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none border-border dark:bg-gray-800"
                  onClick={handleExportInventory}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
                      <DialogDescription>
                        Add a new product to your inventory. Fields marked with * are required.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Photo Upload Section */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Product Photos (Max 5)</Label>
                        <div className="space-y-3">
                          {/* Photo Previews Grid */}
                          {photoPreviews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                              {photoPreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border-2 border-border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  {index === 0 && (
                                    <div className="absolute bottom-1 left-1 bg-cyan-500 text-white text-xs px-1.5 py-0.5 rounded">
                                      Main
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Upload Button */}
                          {photoPreviews.length < 5 && (
                            <label className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-cyan-500 transition-colors bg-accent/30">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoChange}
                                className="hidden"
                              />
                              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground text-center px-2">
                                Click to upload {photoPreviews.length > 0 ? 'more photos' : 'photos'}
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                {photoPreviews.length}/5 photos
                              </span>
                            </label>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Max 5 photos, 5MB each. First photo will be the main display image.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-base font-semibold">
                            Product Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            placeholder="Enter product name"
                            value={newProductData.name}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, name: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model" className="text-base font-semibold">
                            Model <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="model"
                            placeholder="Enter model"
                            value={newProductData.model}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, model: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sku" className="text-base font-semibold">
                            SKU <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="sku"
                            placeholder="Enter SKU (e.g., BULL1)"
                            value={newProductData.sku}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, sku: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-base font-semibold">
                            Category <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="category"
                            value={newProductData.category}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, category: e.target.value })
                            }
                            className="h-11 w-full px-3 rounded-md border-2 border-border bg-background text-foreground focus:outline-none focus:border-cyan-500"
                          >
                            <option value="">Select Category</option>
                            <option value="EV Bikes">EV Bikes</option>
                            <option value="Accessories">Accessories</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-base font-semibold">
                            Price (PKR) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="0.00"
                            value={newProductData.price}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, price: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cost" className="text-base font-semibold">
                            Cost (PKR) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cost"
                            type="number"
                            placeholder="0.00"
                            value={newProductData.cost}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, cost: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stock" className="text-base font-semibold">
                            Stock Quantity <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="stock"
                            type="number"
                            placeholder="0"
                            value={newProductData.stock}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, stock: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minStock" className="text-base font-semibold">
                            Minimum Stock
                          </Label>
                          <Input
                            id="minStock"
                            type="number"
                            placeholder="10"
                            value={newProductData.minStock}
                            onChange={(e) =>
                              setNewProductData({ ...newProductData, minStock: e.target.value })
                            }
                            className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-base font-semibold">
                          Supplier <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="supplier"
                          placeholder="Enter supplier name"
                          value={newProductData.supplier}
                          onChange={(e) =>
                            setNewProductData({ ...newProductData, supplier: e.target.value })
                          }
                          className="h-11 border-2 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-semibold">
                          Description
                        </Label>
                        <textarea
                          id="description"
                          placeholder="Enter product description"
                          value={newProductData.description}
                          onChange={(e) =>
                            setNewProductData({ ...newProductData, description: e.target.value })
                          }
                          className="w-full min-h-[80px] px-3 py-2 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Specifications Section */}
                      <div className="pt-4 border-t border-border">
                        <h3 className="text-lg font-semibold mb-4">Specifications (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="maxSpeed" className="text-sm font-medium">Max Speed</Label>
                            <Input
                              id="maxSpeed"
                              placeholder="e.g., Upto 60 KM/H"
                              value={newProductData.specifications.maxSpeed}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, maxSpeed: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="range" className="text-sm font-medium">Range</Label>
                            <Input
                              id="range"
                              placeholder="e.g., Upto 100 KM in One Charge"
                              value={newProductData.specifications.range}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, range: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="motor" className="text-sm font-medium">Motor</Label>
                            <Input
                              id="motor"
                              placeholder="e.g., 1000W Pure Copper Vector Motor"
                              value={newProductData.specifications.motor}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, motor: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="controller" className="text-sm font-medium">Controller</Label>
                            <Input
                              id="controller"
                              placeholder="e.g., 12-Tube"
                              value={newProductData.specifications.controller}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, controller: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="batteries" className="text-sm font-medium">Batteries</Label>
                            <Input
                              id="batteries"
                              placeholder="e.g., 72V 20Ah Graphene"
                              value={newProductData.specifications.batteries}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, batteries: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="motorBatteryWarranty" className="text-sm font-medium">Motor & Battery Warranty</Label>
                            <Input
                              id="motorBatteryWarranty"
                              placeholder="e.g., 18-Months"
                              value={newProductData.specifications.motorBatteryWarranty}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, motorBatteryWarranty: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="brake" className="text-sm font-medium">Brake</Label>
                            <Input
                              id="brake"
                              placeholder="e.g., Front & Rear Disk Brake"
                              value={newProductData.specifications.brake}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, brake: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="extraFeatures" className="text-sm font-medium">Extra Features</Label>
                            <Input
                              id="extraFeatures"
                              placeholder="e.g., Digital Meter, Security Alarm System"
                              value={newProductData.specifications.extraFeatures}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, extraFeatures: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tyre" className="text-sm font-medium">Tyre</Label>
                            <Input
                              id="tyre"
                              placeholder="e.g., 3.00×10 Tube Less"
                              value={newProductData.specifications.tyre}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, tyre: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="suspension" className="text-sm font-medium">Suspension</Label>
                            <Input
                              id="suspension"
                              placeholder="e.g., Heavy Duty Front Rear Shocks"
                              value={newProductData.specifications.suspension}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, suspension: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="charging" className="text-sm font-medium">Charging</Label>
                            <Input
                              id="charging"
                              placeholder="e.g., 1200+ Charging Cycles"
                              value={newProductData.specifications.charging}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, charging: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="batteryType" className="text-sm font-medium">Battery Type</Label>
                            <Input
                              id="batteryType"
                              placeholder="e.g., Non-Flammable"
                              value={newProductData.specifications.batteryType}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, batteryType: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="chargingTime" className="text-sm font-medium">Charging Time</Label>
                            <Input
                              id="chargingTime"
                              placeholder="e.g., 6 TO 8 HRS"
                              value={newProductData.specifications.chargingTime}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, chargingTime: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="modes" className="text-sm font-medium">Modes</Label>
                            <Input
                              id="modes"
                              placeholder="e.g., 1+2+3"
                              value={newProductData.specifications.modes}
                              onChange={(e) =>
                                setNewProductData({
                                  ...newProductData,
                                  specifications: { ...newProductData.specifications, modes: e.target.value }
                                })
                              }
                              className="h-10 border-2 focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setPhotoFiles([]);
                          setPhotoPreviews([]);
                        }}
                        disabled={isSubmitting || uploadingPhoto}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddProduct}
                        disabled={isSubmitting || uploadingPhoto}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading Photos...
                          </>
                        ) : isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding Product...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Product</DialogTitle>
              <DialogDescription>
                Update product information. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Photo Upload Section */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Product Photos (Max 5)</Label>
                <div className="space-y-3">
                  {/* Existing Photos Grid */}
                  {existingPhotos.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Existing Photos</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {existingPhotos.map((photo, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={photo}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingPhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-1 left-1 bg-cyan-500 text-white text-xs px-1.5 py-0.5 rounded">
                                Main
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Photo Previews Grid */}
                  {photoPreviews.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">New Photos</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {photoPreviews.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img
                              src={preview}
                              alt={`New ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-cyan-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                              New
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {(existingPhotos.length + photoPreviews.length) < 5 && (
                    <label className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-cyan-500 transition-colors bg-accent/30">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        Click to upload more photos
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {existingPhotos.length + photoPreviews.length}/5 photos
                      </span>
                    </label>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Max 5 photos, 5MB each. First photo will be the main display image.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-base font-semibold">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter product name"
                    value={newProductData.name}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, name: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model" className="text-base font-semibold">
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-model"
                    placeholder="Enter model"
                    value={newProductData.model}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, model: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sku" className="text-base font-semibold">
                    SKU <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-sku"
                    placeholder="Enter SKU (e.g., BULL1)"
                    value={newProductData.sku}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, sku: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="text-base font-semibold">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="edit-category"
                    value={newProductData.category}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, category: e.target.value })
                    }
                    className="h-11 w-full px-3 rounded-md border-2 border-border bg-background text-foreground focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Select Category</option>
                    <option value="EV Bikes">EV Bikes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-base font-semibold">
                    Price (PKR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    placeholder="0.00"
                    value={newProductData.price}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, price: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost" className="text-base font-semibold">
                    Cost (PKR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    placeholder="0.00"
                    value={newProductData.cost}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, cost: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stock" className="text-base font-semibold">
                    Stock Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    placeholder="0"
                    value={newProductData.stock}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, stock: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minStock" className="text-base font-semibold">
                    Minimum Stock
                  </Label>
                  <Input
                    id="edit-minStock"
                    type="number"
                    placeholder="10"
                    value={newProductData.minStock}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, minStock: e.target.value })
                    }
                    className="h-11 border-2 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier" className="text-base font-semibold">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-supplier"
                  placeholder="Enter supplier name"
                  value={newProductData.supplier}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, supplier: e.target.value })
                  }
                  className="h-11 border-2 focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-base font-semibold">
                  Description
                </Label>
                <textarea
                  id="edit-description"
                  placeholder="Enter product description"
                  value={newProductData.description}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, description: e.target.value })
                  }
                  className="w-full min-h-[80px] px-3 py-2 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              {/* Specifications Section */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-4">Specifications (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxSpeed" className="text-sm font-medium">Max Speed</Label>
                    <Input
                      id="edit-maxSpeed"
                      placeholder="e.g., Upto 60 KM/H"
                      value={newProductData.specifications.maxSpeed}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, maxSpeed: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-range" className="text-sm font-medium">Range</Label>
                    <Input
                      id="edit-range"
                      placeholder="e.g., Upto 100 KM in One Charge"
                      value={newProductData.specifications.range}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, range: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-motor" className="text-sm font-medium">Motor</Label>
                    <Input
                      id="edit-motor"
                      placeholder="e.g., 1000W Pure Copper Vector Motor"
                      value={newProductData.specifications.motor}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, motor: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-controller" className="text-sm font-medium">Controller</Label>
                    <Input
                      id="edit-controller"
                      placeholder="e.g., 12-Tube"
                      value={newProductData.specifications.controller}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, controller: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-batteries" className="text-sm font-medium">Batteries</Label>
                    <Input
                      id="edit-batteries"
                      placeholder="e.g., 72V 20Ah Graphene"
                      value={newProductData.specifications.batteries}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, batteries: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-motorBatteryWarranty" className="text-sm font-medium">Motor & Battery Warranty</Label>
                    <Input
                      id="edit-motorBatteryWarranty"
                      placeholder="e.g., 18-Months"
                      value={newProductData.specifications.motorBatteryWarranty}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, motorBatteryWarranty: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-brake" className="text-sm font-medium">Brake</Label>
                    <Input
                      id="edit-brake"
                      placeholder="e.g., Front & Rear Disk Brake"
                      value={newProductData.specifications.brake}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, brake: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-extraFeatures" className="text-sm font-medium">Extra Features</Label>
                    <Input
                      id="edit-extraFeatures"
                      placeholder="e.g., Digital Meter, Security Alarm System"
                      value={newProductData.specifications.extraFeatures}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, extraFeatures: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tyre" className="text-sm font-medium">Tyre</Label>
                    <Input
                      id="edit-tyre"
                      placeholder="e.g., 3.00×10 Tube Less"
                      value={newProductData.specifications.tyre}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, tyre: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-suspension" className="text-sm font-medium">Suspension</Label>
                    <Input
                      id="edit-suspension"
                      placeholder="e.g., Heavy Duty Front Rear Shocks"
                      value={newProductData.specifications.suspension}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, suspension: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-charging" className="text-sm font-medium">Charging</Label>
                    <Input
                      id="edit-charging"
                      placeholder="e.g., 1200+ Charging Cycles"
                      value={newProductData.specifications.charging}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, charging: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-batteryType" className="text-sm font-medium">Battery Type</Label>
                    <Input
                      id="edit-batteryType"
                      placeholder="e.g., Non-Flammable"
                      value={newProductData.specifications.batteryType}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, batteryType: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-chargingTime" className="text-sm font-medium">Charging Time</Label>
                    <Input
                      id="edit-chargingTime"
                      placeholder="e.g., 6 TO 8 HRS"
                      value={newProductData.specifications.chargingTime}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, chargingTime: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-modes" className="text-sm font-medium">Modes</Label>
                    <Input
                      id="edit-modes"
                      placeholder="e.g., 1+2+3"
                      value={newProductData.specifications.modes}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          specifications: { ...newProductData.specifications, modes: e.target.value }
                        })
                      }
                      className="h-10 border-2 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingProduct(null);
                  setPhotoFiles([]);
                  setPhotoPreviews([]);
                  setExistingPhotos([]);
                }}
                disabled={isSubmitting || uploadingPhoto}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProduct}
                disabled={isSubmitting || uploadingPhoto}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Photos...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Product...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Inventory Table */}
        <Card className="bg-card/90 border-border backdrop-blur-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl">Inventory Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Model
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Restocked
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
                  {currentData.map((item, index) => (
                    <tr 
                      key={item._id}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="font-semibold text-foreground text-sm">{item.sku || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {item.photos && item.photos.length > 0 ? (
                            <div className="relative">
                              <img
                                src={item.photos[0]}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg border border-border"
                              />
                              {item.photos.length > 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                                  {item.photos.length}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center border border-border">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.model || item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-semibold ${
                          item.stock === 0 ? 'text-red-400' : 
                          item.stock < (item.minStock || 10) ? 'text-orange-400' : 
                          'text-emerald-400'
                        }`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{item.minStock || 10}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-cyan-400">Rs. {item.price?.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6 text-foreground text-sm">{item.supplier || 'N/A'}</td>
                      <td className="py-4 px-6 text-muted-foreground text-sm">
                        {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getStatusColor(getStockIndicator(item.stock, item.minStock || 10))}>
                          {getStockIndicator(item.stock, item.minStock || 10).replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => navigate(`/admin/inventory/view/${item._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditProduct(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-red-400"
                            onClick={() => handleDeleteProduct(item._id)}
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

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-border">
              {currentData.map((item) => (
                <div key={item._id} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground mb-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.sku || 'N/A'}</p>
                    </div>
                    <Badge className={getStatusColor(getStockIndicator(item.stock, item.minStock || 10))}>
                      {getStockIndicator(item.stock, item.minStock || 10).replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Stock</p>
                      <p className={`font-semibold ${
                        item.stock === 0 ? 'text-red-400' : 
                        item.stock < (item.minStock || 10) ? 'text-orange-400' : 
                        'text-emerald-400'
                      }`}>
                        {item.stock} / {item.minStock || 10}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Price</p>
                      <p className="font-semibold text-cyan-400">Rs. {item.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Supplier</p>
                      <p className="text-sm text-foreground">{item.supplier || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-sm text-foreground">{new Date(item.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-3 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/admin/inventory/view/${item._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditProduct(item)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => handleDeleteProduct(item._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} items
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

export default ManageInventory;
