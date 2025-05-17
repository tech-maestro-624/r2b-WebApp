import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { apiService } from '../services/apiServices';
import { useNavigate } from 'react-router-dom';

// Create the combined context
export const AuthContext = createContext();

// Custom hook for easy context access (replaces useAuthModal)
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // Core auth state
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  });

  // Modal UI state (from AuthModalContext)
  const [modalState, setModalState] = useState({
    modalStep: 'none',  // 'none' | 'login' | 'otp'
    phone: '',
    countryCode: '+91',
    otp: '',
    isSubmitting: false,
    errorMessage: ''
  });

  // Update the modal state fields
  const updateModalField = (field, value) => {
    setModalState(prev => ({ ...prev, [field]: value }));
  };

  // Reset modal form to initial state
  const resetModalForm = () => {
    setModalState({
      modalStep: 'none',
      phone: '',
      countryCode: '+91',
      otp: '',
      isSubmitting: false,
      errorMessage: ''
    });
  };

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }

      try {
        authService.setToken(token);
        const userData = await apiService.get('/auth/me');
        setAuthState(prev => ({ 
          ...prev, 
          isAuthenticated: true, 
          user: userData,
          loading: false
        }));
      } catch (err) {
        localStorage.removeItem('authToken');
        setAuthState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          user: null,
          loading: false 
        }));
      }
    };

    checkAuth();
  }, []);

  // Handle post-login navigation (moved from AuthModalContext)
  useEffect(() => {
    if (authState.isAuthenticated) {
      const redirectPath = localStorage.getItem('postLoginRedirect');
      if (redirectPath) {
        navigate(redirectPath);
        localStorage.removeItem('postLoginRedirect');
      }
      resetModalForm();
    }
  }, [authState.isAuthenticated, navigate]);

  // Phone number validation (from AuthModalContext)
  const isValidPhoneNumber = (phoneNumber, countryCode) => {
    if (!phoneNumber) return false;
    
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Simple validation rules by country
    switch(countryCode) {
      case '+91': // India
        return /^[6-9]\d{9}$/.test(digitsOnly);
      case '+1':  // US
        return /^\d{10}$/.test(digitsOnly);
      default:    // Default case
        return digitsOnly.length >= 6;
    }
  };

  // CORE AUTH METHODS
  
  // Login with phone number
  const login = async (phoneNumber) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      return await authService.login(phoneNumber);
    } catch (err) {
      setAuthState(prev => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Verify OTP
  const verifyOtp = async (phoneNumber, otp) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const response = await authService.verifyOtp(phoneNumber, otp);
      
      if (response.token) {
        setAuthState(prev => ({ 
          ...prev, 
          isAuthenticated: true, 
          user: response.user,
          loading: false
        }));
      }
      
      return response;
    } catch (err) {
      setAuthState(prev => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Logout
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await authService.logout();
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        user: null, 
        loading: false 
      }));
    } catch (err) {
      setAuthState(prev => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const response = await authService.updateUser(userData);
      if (response && response.user) {
        setAuthState(prev => ({ ...prev, user: response.user }));
      }
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // UI AUTH MODAL METHODS (from AuthModalContext)
  
  // Handler for sending OTP via login modal
  const handleSendOTP = async () => {
    const phoneNumber = modalState.phone.replace(/\D/g, '');
    
    if (!isValidPhoneNumber(phoneNumber, modalState.countryCode)) {
      updateModalField('errorMessage', 'Please enter a valid phone number');
      return;
    }

    try {
      updateModalField('isSubmitting', true);
      updateModalField('errorMessage', '');
      
      await login(phoneNumber);
      updateModalField('modalStep', 'otp');
    } catch (error) {
      updateModalField('errorMessage', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      updateModalField('isSubmitting', false);
    }
  };

  // Handler for verifying OTP via login modal
  const handleVerifyOtp = async () => {
    if (modalState.otp.length !== 6) {
      updateModalField('errorMessage', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      updateModalField('isSubmitting', true);
      updateModalField('errorMessage', '');
      
      const phoneNumber = modalState.phone.replace(/\D/g, '');
      const response = await verifyOtp(phoneNumber, modalState.otp);
      
      if (!response || !response.token) {
        throw new Error('Authentication failed. Please try again.');
      }
      
      resetModalForm();
    } catch (err) {
      updateModalField('errorMessage', err.message || 'Invalid OTP. Please try again.');
    } finally {
      updateModalField('isSubmitting', false);
    }
  };

  // Modal control functions
  const openLoginModal = () => {
    setModalState(prev => ({
      ...prev,
      modalStep: 'login',
      otp: '',
      errorMessage: ''
    }));
  };

  const closeLoginModal = () => {
    resetModalForm();
  };

  // Combined context value
  const contextValue = {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    
    // Auth methods
    login,
    verifyOtp,
    logout,
    updateUser,
    
    // Modal state (formerly AuthModalContext)
    modalStep: modalState.modalStep,
    phone: modalState.phone,
    countryCode: modalState.countryCode,
    otp: modalState.otp,
    isSubmitting: modalState.isSubmitting,
    errorMessage: modalState.errorMessage,
    
    // Modal field setters
    setPhone: (value) => updateModalField('phone', value),
    setCountryCode: (value) => updateModalField('countryCode', value),
    setOtp: (value) => updateModalField('otp', value.replace(/\D/g, '').slice(0, 6)),
    
    // Modal handlers
    openLoginModal,
    closeLoginModal,
    handleSendOTP,
    handleVerifyOtp
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};