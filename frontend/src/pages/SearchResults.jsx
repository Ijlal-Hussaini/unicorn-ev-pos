import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search,
  Package,
  ShoppingCart,
  Users,
  ArrowLeft,
  Loader2,
  Eye,
  Edit,
  X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import NavigationPanel from '../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, salesAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const SearchResults = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    products: [],
    sales: [],
    customers: []
  });

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Search products
      const productsRes = await productsAPI.getAll();
      const allProducts = productsRes.data || [];
      const filteredProducts = allProducts.filter(product => 
        product.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Search sales
      const salesRes = await salesAPI.getAll();
      const allSales = salesRes.data || [];
      const filteredSales = allSales.filter(sale =>
        sale.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Extract unique customers from sales
      const customerMap = new Map();
      allSales.forEach(sale => {
        const customerKey = sale.customerEmail || sale.customer;
        if (
          (sale.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerPhone?.includes(searchTerm)) &&
          !customerMap.has(customerKey)
        ) {
          customerMap.set(customerKey, {
            name: sale.customer,
            email: sale.customerEmail || 'N/A',
            phone: sale.customerPhone || 'N/A',
            totalPurchases: allSales.filter(s => 
              (s.customerEmail || s.customer) === customerKey
            ).length,
            totalSpent: allSales
              .filter(s => (s.customerEmail || s.customer) === customerKey)
              .reduce((sum, s) => sum + s.total, 0)
          });
        }
      });

      setResults({
        products: filteredProducts,
        sales: filteredSales,
        customers: Array.from(customerMap.values())
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform search',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    }
  };

  const totalResults = results.products.length + results.sales.length + results.customers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground relative overflow-hidden">
      {/* Animated background effects */}
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
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {query && `Showing results for "${query}"`}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="bg-card/90 border-border backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, sales, customers..."
                className="pl-12 pr-10 h-12 bg-background border-border text-lg"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : !query ? (
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Enter a search term to find products, sales, or customers</p>
            </CardContent>
          </Card>
        ) : totalResults === 0 ? (
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground text-lg font-semibold mb-2">No results found</p>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-card/90 border-border backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <p className="text-muted-foreground">
                  Found <span className="font-semibold text-cyan-400">{totalResults}</span> results
                  {results.products.length > 0 && ` • ${results.products.length} products`}
                  {results.sales.length > 0 && ` • ${results.sales.length} sales`}
                  {results.customers.length > 0 && ` • ${results.customers.length} customers`}
                </p>
              </CardContent>
            </Card>

            {/* Products Results */}
            {results.products.length > 0 && (
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-xl flex items-center">
                    <Package className="w-5 h-5 mr-2 text-cyan-400" />
                    Products ({results.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {results.products.map((product) => (
                      <div
                        key={product._id}
                        className="p-4 sm:p-6 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/inventory/view/${product._id}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">{product.model}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                                {product.category}
                              </Badge>
                              <Badge className="bg-purple-500/20 text-purple-400 border-0">
                                {product.brand}
                              </Badge>
                              <Badge className={`border-0 ${
                                product.stock > 10 
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : product.stock > 0
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                Stock: {product.stock}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Price: <span className="font-semibold text-cyan-400">Rs. {product.price?.toLocaleString()}</span>
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/view/${product._id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sales Results */}
            {results.sales.length > 0 && (
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-xl flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-emerald-400" />
                    Sales ({results.sales.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {results.sales.map((sale) => (
                      <div
                        key={sale._id}
                        className="p-4 sm:p-6 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/sales/view/${sale._id}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{sale.invoiceId}</h3>
                              <Badge className={
                                sale.status === 'completed' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-0' 
                                  : sale.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-400 border-0'
                                  : sale.status === 'pending'
                                  ? 'bg-orange-500/20 text-orange-400 border-0'
                                  : 'bg-red-500/20 text-red-400 border-0'
                              }>
                                {sale.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Customer: <span className="text-foreground font-medium">{sale.customer}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              Product: <span className="text-foreground">{sale.model}</span> × {sale.quantity}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: <span className="font-semibold text-emerald-400">Rs. {sale.total?.toLocaleString()}</span>
                              {' • '}
                              <span className="text-xs">{new Date(sale.createdAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sales/view/${sale._id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customers Results */}
            {results.customers.length > 0 && (
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-xl flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-400" />
                    Customers ({results.customers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {results.customers.map((customer, index) => (
                      <div
                        key={index}
                        className="p-4 sm:p-6 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              📧 {customer.email}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              📱 {customer.phone}
                            </p>
                            <div className="flex gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Purchases: <span className="font-semibold text-cyan-400">{customer.totalPurchases}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Total Spent: <span className="font-semibold text-emerald-400">Rs. {customer.totalSpent?.toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
