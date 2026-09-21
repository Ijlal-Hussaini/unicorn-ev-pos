const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to add timeout to fetch requests
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - Backend server may not be running')), timeout)
    )
  ]);
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    // Extract detailed error message from backend
    const errorMessage = data.error || data.message || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return data;
};

// Helper function to get auth headers
// For Electron, we use localStorage to store token and send it in Authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    
    // Store token in localStorage for Electron
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyOTP: async (email, otp) => {
    const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(response);
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp, newPassword }),
    });
    return handleResponse(response);
  },

  requestEmailChange: async (newEmail) => {
    const response = await fetch(`${API_BASE_URL}/users/request-email-change`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ newEmail }),
    });
    return handleResponse(response);
  },

  verifyEmailChange: async (otp) => {
    const response = await fetch(`${API_BASE_URL}/users/verify-email-change`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ otp }),
    });
    return handleResponse(response);
  },
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (productData) => {
    console.log('API: Creating product with URL:', `${API_BASE_URL}/products`);
    console.log('API: Product data:', JSON.stringify(productData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(productData),
    });
    
    console.log('API: Response status:', response.status);
    console.log('API: Response ok:', response.ok);
    
    return handleResponse(response);
  },

  update: async (id, productData) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  updateStock: async (id, quantity, operation) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ quantity, operation }),
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/products/stats/inventory`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Sales API
export const salesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/sales${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (saleData) => {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(saleData),
    });
    return handleResponse(response);
  },

  update: async (id, saleData) => {
    const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(saleData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/sales/stats/overview${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getChartData: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/sales/stats/chart${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/customers${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (customerData) => {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(customerData),
    });
    return handleResponse(response);
  },

  update: async (id, customerData) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(customerData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getPurchases: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/purchases`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/customers/stats/overview`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Users API
export const usersAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  update: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  changePassword: async (id, currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },
};

// Upload API
export const uploadAPI = {
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/profile`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: formData,
    });
    return handleResponse(response);
  },

  deleteProfilePhoto: async () => {
    const response = await fetch(`${API_BASE_URL}/upload/profile`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  uploadProductPhoto: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/product`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: formData,
    });
    return handleResponse(response);
  },

  deleteProductPhoto: async (photoUrl) => {
    const response = await fetch(`${API_BASE_URL}/upload/product`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ photoUrl }),
    });
    return handleResponse(response);
  },
};

// Reports API
export const reportsAPI = {
  getDashboardStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/reports/dashboard${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getRevenueTrend: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/reports/revenue-trend${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getCategoryBreakdown: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/reports/category-breakdown${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getTopProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/reports/top-products${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getPerformanceMetrics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/reports/performance${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  exportReport: async (type, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/reports/export/${type}${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },
};

// Refunds API
export const refundsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/refunds${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/refunds/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (refundData) => {
    const response = await fetch(`${API_BASE_URL}/refunds`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(refundData),
    });
    return handleResponse(response);
  },

  approve: async (id) => {
    const response = await fetch(`${API_BASE_URL}/refunds/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  reject: async (id, notes) => {
    const response = await fetch(`${API_BASE_URL}/refunds/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
  },

  complete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/refunds/${id}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/refunds/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/refunds/stats/overview${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },
};

// Installments API
export const installmentsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/installments${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/installments/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (installmentData) => {
    const response = await fetch(`${API_BASE_URL}/installments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(installmentData),
    });
    return handleResponse(response);
  },

  recordPayment: async (id, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/installments/${id}/payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  getPaymentHistory: async (id) => {
    const response = await fetch(`${API_BASE_URL}/installments/${id}/payments`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  markAsDefaulted: async (id, notes) => {
    const response = await fetch(`${API_BASE_URL}/installments/${id}/default`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
  },

  cancel: async (id, notes) => {
    const response = await fetch(`${API_BASE_URL}/installments/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
  },

  getOverdue: async () => {
    const response = await fetch(`${API_BASE_URL}/installments/overdue`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/installments/stats/overview`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};
