import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Filter,
  Package,
  Eye,
  ShoppingCart,
  Loader2,
  X
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
import { productsAPI } from '../../services/api';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const ProductCatalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const productStatus = getStockIndicator(product.stock, product.minStock || 10);
    const matchesStatus = statusFilter === 'all' || productStatus === statusFilter;
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleCreateSale = (product) => {
    navigate('/sales/new', { state: { selectedProduct: product } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Product Catalog</h1>
          <p className="text-muted-foreground">Browse available products and create sales</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, model, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
              
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`border-border ${(statusFilter !== 'all' || categoryFilter !== 'all') ? 'bg-cyan-500/10 border-cyan-500/50' : ''}`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                      <span className="ml-2 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {(statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Filter Products</DialogTitle>
                    <DialogDescription>
                      Filter products by status and category
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="status-filter">Stock Status</Label>
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
                      <Label htmlFor="category-filter">Category</Label>
                      <select
                        id="category-filter"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Categories</option>
                        {uniqueCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter('all');
                        setCategoryFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600"
                    >
                      Apply
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const status = getStockIndicator(product.stock, product.minStock || 10);
              return (
                <Card key={product._id} className="bg-card/90 border-border backdrop-blur-sm overflow-hidden group hover:shadow-xl hover:shadow-cyan-500/10 transition-all">
                  <div className="aspect-square bg-accent/50 overflow-hidden">
                    {product.photos && product.photos.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{product.model}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-cyan-400">{formatCurrency(product.price)}</span>
                      <Badge className={getStatusColor(status)}>
                        {status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Stock: <span className="font-semibold text-foreground">{product.stock} units</span></p>
                      <p>SKU: <span className="font-semibold text-foreground">{product.sku}</span></p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(product)}
                        className="flex-1 border-border"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCreateSale(product)}
                        disabled={product.stock === 0}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Sell
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
              <DialogDescription>{selectedProduct.model}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Image */}
              {selectedProduct.photos && selectedProduct.photos.length > 0 && (
                <div className="aspect-video bg-accent/50 rounded-lg overflow-hidden">
                  <img
                    src={selectedProduct.photos[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-2xl font-bold text-cyan-400">{formatCurrency(selectedProduct.price)}</p>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <p className="text-sm text-muted-foreground mb-1">Stock</p>
                  <p className="text-2xl font-bold text-emerald-400">{selectedProduct.stock} units</p>
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-semibold">{selectedProduct.sku}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-semibold">{selectedProduct.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-semibold">{selectedProduct.supplier}</span>
                </div>
              </div>
              
              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>
              )}
              
              {/* Specifications */}
              {selectedProduct.specifications && Object.values(selectedProduct.specifications).some(val => val) && (
                <div>
                  <h4 className="font-semibold mb-2">Specifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedProduct.specifications).map(([key, value]) => 
                      value && (
                        <div key={key} className="text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <Button
                onClick={() => {
                  setIsDetailOpen(false);
                  handleCreateSale(selectedProduct);
                }}
                disabled={selectedProduct.stock === 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductCatalog;
