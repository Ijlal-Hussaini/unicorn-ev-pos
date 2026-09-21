import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  Plus,
  History,
  RefreshCw,
  Calendar,
} from 'lucide-react';

const NavigationPanel = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  // Admin navigation items
  const adminNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      path: '/users',
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: ShoppingCart,
      path: '/sales/records',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'refunds',
      label: 'Refunds',
      icon: RefreshCw,
      path: '/sales/refunds',
      color: 'from-red-500 to-rose-600',
    },
    {
      id: 'installments',
      label: 'Installments',
      icon: Calendar,
      path: '/installments',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      path: '/admin/inventory',
      color: 'from-orange-500 to-amber-600',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      path: '/reports/analytics',
      color: 'from-indigo-500 to-violet-600',
    },
  ];

  // Sales navigation items
  const salesNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/sales/dashboard',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'new-sale',
      label: 'New Sale',
      icon: Plus,
      path: '/sales/new',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      path: '/sales/products',
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      path: '/sales/history',
      color: 'from-orange-500 to-amber-600',
    },
    {
      id: 'refunds',
      label: 'Refunds',
      icon: RefreshCw,
      path: '/sales/refunds',
      color: 'from-red-500 to-rose-600',
    },
    {
      id: 'installments',
      label: 'Installments',
      icon: Calendar,
      path: '/installments',
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  // Select navigation items based on user role
  const navItems = user?.role === 'admin' ? adminNavItems : salesNavItems;

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40">
      <nav className="bg-card/95 backdrop-blur-xl rounded-full shadow-2xl border border-slate-200/50 dark:border-slate-700/50 px-3 py-3">
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="group relative"
                title={item.label}
              >
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                  active
                    ? `bg-gradient-to-r ${item.color} shadow-lg scale-110`
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                }`}>
                  <Icon className={`w-5 h-5 transition-colors duration-300 ${
                    active ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                  }`} />
                  
                  {/* Active dot indicator */}
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {item.label}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45" />
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});

NavigationPanel.displayName = 'NavigationPanel';

export default NavigationPanel;