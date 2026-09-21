import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely parse user data from localStorage
// Note: We only store non-sensitive user data here (no tokens)
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// Check if user is authenticated by checking if user data exists
// The actual token is stored in httpOnly cookie (secure from XSS)
const initialState = {
  user: getUserFromStorage(),
  isAuthenticated: !!getUserFromStorage(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      // Only store non-sensitive user data (token is in httpOnly cookie)
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // Only remove user data (token is cleared by backend via httpOnly cookie)
      localStorage.removeItem('user');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      // Sync with localStorage
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
