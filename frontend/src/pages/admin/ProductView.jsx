import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  DollarSign,
  Box,
  Tag,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { productsAPI } from '../../services/api';

const ProductView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      setProduct(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch product details',
        variant: 'destructive',
      });
      navigate('/admin/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
        variant: 'success',
      });
      navigate('/admin/inventory');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'low-stock':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'out-of-stock':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStockIndicator = (stock, minStock) => {
    if (stock === 0) return 'out-of-stock';
    if (stock < minStock) return 'low-stock';
    return 'in-stock';
  };

  const nextPhoto = () => {
    if (product?.photos?.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % product.photos.length);
    }
  };

  const prevPhoto = () => {
    if (product?.photos?.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + product.photos.length) % product.photos.length);
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
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const status = getStockIndicator(product.stock, product.minStock || 10);
  const profitMargin = product.price - (product.cost || 0);
  const profitPercentage = product.cost ? ((profitMargin / product.cost) * 100).toFixed(2) : 0;

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

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-44 sm:pt-40">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/inventory')}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Title and Status */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-1">
                  <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-lg text-muted-foreground">{product.model || product.category}</p>
                    <Badge className={`${getStatusColor(status)} text-sm px-3 py-1`}>
                      {status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="px-4 py-2 bg-card/90 border border-border rounded-full backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground">SKU: </span>
                  <span className="text-sm font-semibold text-foreground">{product.sku}</span>
                </div>
                <div className="px-4 py-2 bg-card/90 border border-border rounded-full backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground">Category: </span>
                  <span className="text-sm font-semibold text-foreground">{product.category}</span>
                </div>
                <div className="px-4 py-2 bg-card/90 border border-border rounded-full backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground">Supplier: </span>
                  <span className="text-sm font-semibold text-foreground">{product.supplier}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 lg:flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/inventory', { state: { editProductId: id } })}
                className="border-border hover:bg-cyan-500/10 hover:border-cyan-500/50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Selling Price</p>
              <p className="text-2xl font-bold text-cyan-400">
                Rs. {product.price.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Tag className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Cost Price</p>
              <p className="text-2xl font-bold text-purple-400">
                Rs. {(product.cost || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${
            product.stock === 0 ? 'from-red-500/10 to-red-500/5 border-red-500/30' :
            product.stock < (product.minStock || 10) ? 'from-orange-500/10 to-orange-500/5 border-orange-500/30' :
            'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30'
          } backdrop-blur-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${
                  product.stock === 0 ? 'bg-red-500/20' :
                  product.stock < (product.minStock || 10) ? 'bg-orange-500/20' :
                  'bg-emerald-500/20'
                } rounded-lg`}>
                  <Box className={`w-5 h-5 ${
                    product.stock === 0 ? 'text-red-400' :
                    product.stock < (product.minStock || 10) ? 'text-orange-400' :
                    'text-emerald-400'
                  }`} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Stock Available</p>
              <p className={`text-2xl font-bold ${
                product.stock === 0 ? 'text-red-400' :
                product.stock < (product.minStock || 10) ? 'text-orange-400' :
                'text-emerald-400'
              }`}>
                {product.stock} units
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-amber-400">
                {profitPercentage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rs. {profitMargin.toLocaleString()} per unit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Images (5 columns) */}
          <div className="xl:col-span-5">
            <Card className="bg-card/90 border-border backdrop-blur-sm overflow-hidden sticky top-40">
              <CardContent className="p-0">
                {product.photos && product.photos.length > 0 ? (
                  <div className="relative">
                    <div className="aspect-square bg-accent/50">
                      <img
                        src={product.photos[currentPhotoIndex]}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setIsImageModalOpen(true)}
                      />
                    </div>
                    {product.photos.length > 1 && (
                      <>
                        <button
                          onClick={prevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 px-3 py-2 rounded-full backdrop-blur-sm">
                          {product.photos.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentPhotoIndex
                                  ? 'bg-white w-6'
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-accent/50 flex items-center justify-center">
                    <Package className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
                
                {/* Thumbnail Grid */}
                {product.photos && product.photos.length > 1 && (
                  <div className="p-4 bg-accent/20">
                    <div className="grid grid-cols-5 gap-2">
                      {product.photos.slice(0, 5).map((photo, index) => (
                        <div
                          key={index}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            index === currentPhotoIndex
                              ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                              : 'border-border hover:border-cyan-500/50'
                          }`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        >
                          <img
                            src={photo}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details (7 columns) */}
          <div className="xl:col-span-7 space-y-6">
            {/* Description */}
            {product.description && (
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed text-base">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Financial Overview */}
            <Card className="bg-card/90 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl border border-cyan-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      Rs. {(product.price * product.stock).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl border border-purple-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Cost Value</p>
                    <p className="text-2xl font-bold text-purple-400">
                      Rs. {((product.cost || 0) * product.stock).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-xl border border-emerald-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Potential Profit</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      Rs. {(profitMargin * product.stock).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl border border-orange-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Minimum Stock Alert</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {product.minStock || 10} units
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            {product.specifications && Object.values(product.specifications).some(val => val) && (
              <Card className="bg-card/90 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.specifications.maxSpeed && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Max Speed</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.maxSpeed}</p>
                      </div>
                    )}
                    {product.specifications.range && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Range</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.range}</p>
                      </div>
                    )}
                    {product.specifications.motor && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Motor</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.motor}</p>
                      </div>
                    )}
                    {product.specifications.controller && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Controller</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.controller}</p>
                      </div>
                    )}
                    {product.specifications.batteries && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Batteries</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.batteries}</p>
                      </div>
                    )}
                    {product.specifications.motorBatteryWarranty && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Motor & Battery Warranty</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.motorBatteryWarranty}</p>
                      </div>
                    )}
                    {product.specifications.brake && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Brake</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.brake}</p>
                      </div>
                    )}
                    {product.specifications.tyre && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Tyre</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.tyre}</p>
                      </div>
                    )}
                    {product.specifications.suspension && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Suspension</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.suspension}</p>
                      </div>
                    )}
                    {product.specifications.charging && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Charging</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.charging}</p>
                      </div>
                    )}
                    {product.specifications.batteryType && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Battery Type</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.batteryType}</p>
                      </div>
                    )}
                    {product.specifications.chargingTime && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Charging Time</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.chargingTime}</p>
                      </div>
                    )}
                    {product.specifications.modes && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Modes</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.modes}</p>
                      </div>
                    )}
                    {product.specifications.extraFeatures && (
                      <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/20 rounded-lg border border-border/50 sm:col-span-2">
                        <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Extra Features</label>
                        <p className="text-foreground font-medium mt-1.5">{product.specifications.extraFeatures}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card className="bg-card/90 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Product Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-lg border-l-4 border-cyan-500">
                    <div className="p-2.5 bg-cyan-500/20 rounded-lg mt-0.5">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-cyan-400 mb-1">Product Created</p>
                      <p className="text-foreground">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-4 border-purple-500">
                    <div className="p-2.5 bg-purple-500/20 rounded-lg mt-0.5">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-purple-400 mb-1">Last Updated</p>
                      <p className="text-foreground">
                        {new Date(product.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {product.lastRestocked && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-lg border-l-4 border-emerald-500">
                      <div className="p-2.5 bg-emerald-500/20 rounded-lg mt-0.5">
                        <Package className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-400 mb-1">Last Restocked</p>
                        <p className="text-foreground">
                          {new Date(product.lastRestocked).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {isImageModalOpen && product.photos && product.photos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors bg-black/40 p-2 rounded-full backdrop-blur-sm"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={product.photos[currentPhotoIndex]}
              alt={product.name}
              className="w-full h-auto max-h-[90vh] object-contain rounded-xl"
            />
            {product.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                  <p className="text-white text-sm font-medium">
                    {currentPhotoIndex + 1} / {product.photos.length}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;