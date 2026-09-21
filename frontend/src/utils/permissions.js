/**
 * Role-Based Access Control (RBAC) Utilities
 * Centralized permission checking for the application
 */

// Define user roles
export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
};

// Define permissions for each role
export const PERMISSIONS = {
  // User Management
  VIEW_USERS: [ROLES.ADMIN],
  CREATE_USER: [ROLES.ADMIN],
  EDIT_USER: [ROLES.ADMIN],
  DELETE_USER: [ROLES.ADMIN],
  
  // Inventory Management
  VIEW_INVENTORY: [ROLES.ADMIN, ROLES.SALES],
  CREATE_PRODUCT: [ROLES.ADMIN],
  EDIT_PRODUCT: [ROLES.ADMIN],
  DELETE_PRODUCT: [ROLES.ADMIN],
  
  // Sales Management
  VIEW_ALL_SALES: [ROLES.ADMIN],
  VIEW_OWN_SALES: [ROLES.ADMIN, ROLES.SALES],
  CREATE_SALE: [ROLES.ADMIN, ROLES.SALES],
  EDIT_SALE: [ROLES.ADMIN],
  DELETE_SALE: [ROLES.ADMIN],
  
  // Reports & Analytics
  VIEW_REPORTS: [ROLES.ADMIN],
  EXPORT_DATA: [ROLES.ADMIN],
  
  // Settings
  VIEW_SETTINGS: [ROLES.ADMIN],
  EDIT_SETTINGS: [ROLES.ADMIN],
  
  // Customer Management
  VIEW_CUSTOMERS: [ROLES.ADMIN, ROLES.SALES],
  CREATE_CUSTOMER: [ROLES.ADMIN, ROLES.SALES],
  EDIT_CUSTOMER: [ROLES.ADMIN],
  DELETE_CUSTOMER: [ROLES.ADMIN],
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission key from PERMISSIONS
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Permission "${permission}" not found`);
    return false;
  }
  
  return allowedRoles.includes(user.role);
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with role property
 * @param {Array<string>} permissions - Array of permission keys
 * @returns {boolean} - True if user has at least one permission
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object with role property
 * @param {Array<string>} permissions - Array of permission keys
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user is an admin
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role === ROLES.ADMIN;
};

/**
 * Check if user is sales
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is sales
 */
export const isSales = (user) => {
  return user?.role === ROLES.SALES;
};

/**
 * Get user's dashboard route based on role
 * @param {Object} user - User object with role property
 * @returns {string} - Dashboard route path
 */
export const getDashboardRoute = (user) => {
  if (!user || !user.role) {
    return '/';
  }
  
  switch (user.role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.SALES:
      return '/sales/dashboard';
    default:
      return '/';
  }
};

/**
 * Get allowed routes for a user based on their role
 * @param {Object} user - User object with role property
 * @returns {Array<string>} - Array of allowed route paths
 */
export const getAllowedRoutes = (user) => {
  if (!user || !user.role) {
    return ['/'];
  }
  
  const commonRoutes = ['/profile', '/settings'];
  
  switch (user.role) {
    case ROLES.ADMIN:
      return [
        '/admin/dashboard',
        '/users',
        '/sales/records',
        '/inventory/manage',
        '/admin/inventory',
        '/admin/inventory/view/:id',
        '/reports/analytics',
        ...commonRoutes,
      ];
    case ROLES.SALES:
      return [
        '/sales/dashboard',
        '/sales/products',
        '/sales/new',
        '/sales/history',
        ...commonRoutes,
      ];
    default:
      return ['/'];
  }
};

/**
 * Check if user can access a specific route
 * @param {Object} user - User object with role property
 * @param {string} route - Route path to check
 * @returns {boolean} - True if user can access the route
 */
export const canAccessRoute = (user, route) => {
  const allowedRoutes = getAllowedRoutes(user);
  
  // Check exact match
  if (allowedRoutes.includes(route)) {
    return true;
  }
  
  // Check pattern match (for dynamic routes like /admin/inventory/view/:id)
  return allowedRoutes.some(allowedRoute => {
    if (allowedRoute.includes(':')) {
      const pattern = allowedRoute.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(route);
    }
    return false;
  });
};

/**
 * Get user role display name
 * @param {string} role - Role key
 * @returns {string} - Display name for role
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.SALES]: 'Sales Representative',
  };
  
  return roleNames[role] || 'Unknown';
};

/**
 * Get role badge color
 * @param {string} role - Role key
 * @returns {string} - Tailwind CSS classes for badge
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.ADMIN]: 'bg-red-500/20 text-red-400 border-red-500/30',
    [ROLES.SALES]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  
  return colors[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

/**
 * Filter data based on user role
 * For sales users, filter to show only their own data
 * @param {Object} user - User object with role and _id
 * @param {Array} data - Array of data items with soldBy property
 * @returns {Array} - Filtered data
 */
export const filterDataByRole = (user, data) => {
  if (!user || !data) {
    return [];
  }
  
  // Admin can see all data
  if (isAdmin(user)) {
    return data;
  }
  
  // Sales can only see their own data
  if (isSales(user)) {
    return data.filter(item => {
      // Check if item has soldBy property (for sales records)
      if (item.soldBy) {
        return item.soldBy._id === user._id || item.soldBy === user._id;
      }
      // Check if item has addedBy property (for customers)
      if (item.addedBy) {
        return item.addedBy._id === user._id || item.addedBy === user._id;
      }
      return false;
    });
  }
  
  return [];
};

/**
 * Check if user can perform action on specific item
 * @param {Object} user - User object
 * @param {Object} item - Item with owner/creator info
 * @param {string} action - Action to perform (edit, delete, etc.)
 * @returns {boolean} - True if user can perform action
 */
export const canPerformAction = (user, item, action) => {
  if (!user || !item) {
    return false;
  }
  
  // Admin can do anything
  if (isAdmin(user)) {
    return true;
  }
  
  // Sales can only view their own items
  if (isSales(user)) {
    const isOwner = 
      item.soldBy?._id === user._id || 
      item.soldBy === user._id ||
      item.addedBy?._id === user._id ||
      item.addedBy === user._id;
    
    return action === 'view' && isOwner;
  }
  
  return false;
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isSales,
  getDashboardRoute,
  getAllowedRoutes,
  canAccessRoute,
  getRoleDisplayName,
  getRoleBadgeColor,
  filterDataByRole,
  canPerformAction,
};
