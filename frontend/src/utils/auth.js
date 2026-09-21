/**
 * Authentication utility functions
 * 
 * Security Note: 
 * - Tokens are stored in httpOnly cookies (protected from XSS attacks)
 * - Only non-sensitive user data is stored in localStorage/Redux
 * - Cookies are automatically sent with credentials: 'include'
 */

import { authAPI } from '../services/api';

/**
 * Verify if the user session is still valid
 * This makes a request to the backend which checks the httpOnly cookie
 */
export const verifySession = async () => {
  try {
    const response = await authAPI.getCurrentUser();
    return {
      isValid: true,
      user: response.data,
    };
  } catch (error) {
    return {
      isValid: false,
      user: null,
    };
  }
};

/**
 * Clear all client-side auth data
 * Note: The httpOnly cookie is cleared by the backend
 */
export const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
};
