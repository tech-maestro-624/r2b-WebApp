import React, { createContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastAuthCheckRef = useRef(0);
  const authCheckTimeoutRef = useRef(null);

  // Debounced auth check function
  const debouncedAuthCheck = async () => {
    const now = Date.now();
    // Only check if more than 5 seconds have passed since last check
    if (now - lastAuthCheckRef.current < 5000) {
      return;
    }

    // Clear any pending timeout
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }

    // Set a new timeout
    authCheckTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const isLoggedIn = await authService.isLoggedIn();
        
        if (isLoggedIn) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        lastAuthCheckRef.current = Date.now();
      } catch (err) {
        console.error('Auth check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 1000); // Wait 1 second before checking
  };

  // Check authentication status on app load
  useEffect(() => {
    debouncedAuthCheck();

    // Cleanup timeout on unmount
    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, []);

  // Login with phone number
  const login = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);
      return await authService.login(phoneNumber);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (phoneNumber, otp) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.verifyOtp(phoneNumber, otp);
      
      if (response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        lastAuthCheckRef.current = Date.now();
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      lastAuthCheckRef.current = Date.now();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Skip login (for guest mode)
  const skipLogin = () => {
    setIsAuthenticated(true);
    setUser(null); // User is null but authenticated as guest
    lastAuthCheckRef.current = Date.now();
  };

  const updateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.updateUser(userData);
      if (response && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        verifyOtp,
        logout,
        skipLogin,
        debouncedAuthCheck,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};