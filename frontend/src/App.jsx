import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const SalesRecords = lazy(() => import('./pages/admin/SalesRecords'));
const ManageInventory = lazy(() => import('./pages/admin/ManageInventory'));
const ProductView = lazy(() => import('./pages/admin/ProductView'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Profile = lazy(() => import('./pages/admin/Profile'));
const SalesDashboard = lazy(() => import('./pages/sales/SalesDashboard'));
const ProductCatalog = lazy(() => import('./pages/sales/ProductCatalog'));
const NewSale = lazy(() => import('./pages/sales/NewSale'));
const EditSale = lazy(() => import('./pages/sales/EditSale'));
const SalesHistory = lazy(() => import('./pages/sales/SalesHistory'));
const SaleView = lazy(() => import('./pages/sales/SaleView'));
const RefundManagement = lazy(() => import('./pages/sales/RefundManagement'));
const InstallmentList = lazy(() => import('./pages/installments/InstallmentList'));
const CreateInstallment = lazy(() => import('./pages/installments/CreateInstallment'));
const InstallmentDetails = lazy(() => import('./pages/installments/InstallmentDetails'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Login page */}
          <Route path="/" element={<Login />} />

          {/* Forgot password flow */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin routes - Only accessible by admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory/view/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProductView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-records"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SalesRecords />
              </ProtectedRoute>
            }
          />

          {/* Sales routes - Accessible by all authenticated users */}
          <Route
            path="/sales/dashboard"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <SalesDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/products"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <ProductCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/new"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <NewSale />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <EditSale />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/history"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <SalesHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/view/:id"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <SaleView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/refunds"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin']}>
                <RefundManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/records"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SalesRecords />
              </ProtectedRoute>
            }
          />

          {/* Installment routes - Accessible by sales and admin */}
          <Route
            path="/installments"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin', 'manager', 'cashier']}>
                <InstallmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/installments/create"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin', 'manager', 'cashier']}>
                <CreateInstallment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/installments/:id"
            element={
              <ProtectedRoute allowedRoles={['sales', 'admin', 'manager', 'cashier']}>
                <InstallmentDetails />
              </ProtectedRoute>
            }
          />

          {/* Users route - Only admin can manage users */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Inventory routes - Only admin */}
          <Route
            path="/inventory/manage"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageInventory />
              </ProtectedRoute>
            }
          />

          {/* Reports routes - Only admin */}
          <Route
            path="/reports/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Settings route - All authenticated users */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Profile route - All authenticated users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Search route - All authenticated users */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />

          {/* Notifications route - Only admin */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
    </HashRouter>
  );
};

export default App;
