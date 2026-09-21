/**
 * Permission Utilities - Usage Examples
 * 
 * This file demonstrates how to use the permission utilities
 * throughout the application.
 */

import { 
  hasPermission, 
  isAdmin, 
  isSales,
  canAccessRoute,
  filterDataByRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  PERMISSIONS 
} from './permissions';

// ============================================
// Example 1: Check if user can view all sales
// ============================================
const ExampleCheckPermission = ({ user }) => {
  const canViewAllSales = hasPermission(user, 'VIEW_ALL_SALES');
  
  return (
    <div>
      {canViewAllSales ? (
        <button>View All Sales</button>
      ) : (
        <button>View My Sales</button>
      )}
    </div>
  );
};

// ============================================
// Example 2: Conditional rendering based on role
// ============================================
const ExampleRoleBasedUI = ({ user }) => {
  return (
    <div>
      {isAdmin(user) && (
        <button>Delete User</button>
      )}
      
      {isSales(user) && (
        <button>Create Sale</button>
      )}
    </div>
  );
};

// ============================================
// Example 3: Filter sales data by role
// ============================================
const ExampleFilterData = ({ user, allSales }) => {
  // This will automatically filter sales for sales users
  // Admin will see all sales
  const visibleSales = filterDataByRole(user, allSales);
  
  return (
    <div>
      {visibleSales.map(sale => (
        <div key={sale._id}>{sale.invoiceId}</div>
      ))}
    </div>
  );
};

// ============================================
// Example 4: Display user role with badge
// ============================================
const ExampleRoleBadge = ({ user }) => {
  const roleName = getRoleDisplayName(user.role);
  const badgeColor = getRoleBadgeColor(user.role);
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
      {roleName}
    </span>
  );
};

// ============================================
// Example 5: Check route access
// ============================================
const ExampleRouteCheck = ({ user, requestedRoute }) => {
  const canAccess = canAccessRoute(user, requestedRoute);
  
  if (!canAccess) {
    return <div>Access Denied</div>;
  }
  
  return <div>Welcome to {requestedRoute}</div>;
};

// ============================================
// Example 6: Multiple permission check
// ============================================
const ExampleMultiplePermissions = ({ user }) => {
  const canManageInventory = 
    hasPermission(user, 'CREATE_PRODUCT') && 
    hasPermission(user, 'EDIT_PRODUCT');
  
  return (
    <div>
      {canManageInventory && (
        <button>Manage Inventory</button>
      )}
    </div>
  );
};

// ============================================
// Example 7: Use in API calls
// ============================================
const ExampleAPICall = async ({ user }) => {
  // Fetch sales based on user role
  const endpoint = hasPermission(user, 'VIEW_ALL_SALES')
    ? '/api/sales' // Admin sees all
    : `/api/sales?soldBy=${user._id}`; // Sales sees only their own
  
  const response = await fetch(endpoint);
  const data = await response.json();
  return data;
};

// ============================================
// Example 8: Protect component actions
// ============================================
const ExampleProtectedActions = ({ user, sale: _sale }) => {
  const canEdit = hasPermission(user, 'EDIT_SALE');
  const canDelete = hasPermission(user, 'DELETE_SALE');
  
  return (
    <div>
      <button disabled={!canEdit}>Edit</button>
      <button disabled={!canDelete}>Delete</button>
    </div>
  );
};

// ============================================
// Example 9: Navigation menu based on permissions
// ============================================
const ExampleNavigationMenu = ({ user }) => {
  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      show: true, // Always show
    },
    {
      label: 'Users',
      path: '/users',
      show: hasPermission(user, 'VIEW_USERS'),
    },
    {
      label: 'Inventory',
      path: '/inventory',
      show: hasPermission(user, 'VIEW_INVENTORY'),
    },
    {
      label: 'Reports',
      path: '/reports',
      show: hasPermission(user, 'VIEW_REPORTS'),
    },
  ];
  
  return (
    <nav>
      {menuItems.filter(item => item.show).map(item => (
        <a key={item.path} href={item.path}>
          {item.label}
        </a>
      ))}
    </nav>
  );
};

// ============================================
// Example 10: Form field visibility
// ============================================
const ExampleFormFields = ({ user }) => {
  return (
    <form>
      <input name="customer" placeholder="Customer Name" />
      <input name="amount" placeholder="Amount" />
      
      {/* Only admins can set custom status */}
      {isAdmin(user) && (
        <select name="status">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      )}
      
      {/* Only admins can add notes */}
      {hasPermission(user, 'EDIT_SALE') && (
        <textarea name="notes" placeholder="Internal notes" />
      )}
    </form>
  );
};

export {
  ExampleCheckPermission,
  ExampleRoleBasedUI,
  ExampleFilterData,
  ExampleRoleBadge,
  ExampleRouteCheck,
  ExampleMultiplePermissions,
  ExampleAPICall,
  ExampleProtectedActions,
  ExampleNavigationMenu,
  ExampleFormFields,
};
