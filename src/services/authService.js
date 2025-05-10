import { apiService } from './apiServices';

// Constants for token validation retry limit
const MAX_TOKEN_VALIDATION_ATTEMPTS = 3;
const TOKEN_VALIDATION_ATTEMPTS_KEY = 'tokenValidationAttempts';

/**
 * Authentication service for customer login and verification
 * Implements the authentication flow described in the API documentation
 */
export const authService = {
  /**
   * Customer login with phone number
   * Sends a request to generate and send OTP to the provided phone number
   * 
   * @param {string} phoneNumber - 10 digit Indian phone number
   * @returns {Promise<Object>} - Response with status and message
   */
  login: async (phoneNumber) => {
    try {
      // Validate phone number format (10 digits)
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        throw new Error('Please enter a valid 10-digit Indian phone number');
      }

      const response = await apiService.post('/customer/login', { phoneNumber }, false);
      return response;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  },

  /**
   * Verify OTP and complete login
   * 
   * @param {string} phoneNumber - Phone number used for login
   * @param {string} otp - 6-digit OTP received
   * @returns {Promise<Object>} - Response with token and user details
   */
  verifyOtp: async (phoneNumber, otp) => {
    try {
      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      const response = await apiService.post('/customer/verify', { phoneNumber, otp }, false);

      // Save auth token and user data
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        // Reset token validation attempts counter on successful login
        localStorage.removeItem(TOKEN_VALIDATION_ATTEMPTS_KEY);
      }

      return response;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  /**
   * Check if user is logged in and token is valid
   * 
   * @returns {Promise<boolean>} - True if user is logged in with valid token
   */
  isLoggedIn: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      // Get current validation attempts
      const attemptsStr = localStorage.getItem(TOKEN_VALIDATION_ATTEMPTS_KEY);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

      // Check if we've exceeded the retry limit
      if (attempts >= MAX_TOKEN_VALIDATION_ATTEMPTS) {
        console.log('Token validation retry limit reached, forcing reauth');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem(TOKEN_VALIDATION_ATTEMPTS_KEY);
        return false;
      }

      // Verify token validity by making a test request
      try {
        await apiService.get('/auth/me');
        // Reset attempts counter on successful validation
        localStorage.removeItem(TOKEN_VALIDATION_ATTEMPTS_KEY);
        return true;
      } catch (error) {
        if (error.response?.status === 401) {
          // Increment failed attempts counter
          localStorage.setItem(TOKEN_VALIDATION_ATTEMPTS_KEY, (attempts + 1).toString());
          
          // Token is invalid, clear it if we've reached the limit
          if (attempts + 1 >= MAX_TOKEN_VALIDATION_ATTEMPTS) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
          }
          return false;
        }
        throw error;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  /**
   * Get current user data
   * 
   * @returns {Promise<Object|null>} - User data or null if not logged in
   */
  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  },

  /**
   * Logout user and clear all auth data
   * 
   * @returns {Promise<void>}
   */
  logout: () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  /**
   * Force user to re-authenticate by clearing auth data
   * 
   * @returns {Promise<void>}
   */
  forceReauth: () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Force reauth error:', error);
      throw error;
    }
  },

  /**
   * Get the current auth token
   * 
   * @returns {Promise<string|null>} - The auth token or null if not available
   */
  getToken: () => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },
  
  /**
   * Update user profile 
   * 
   * @param {Object} userData - User data to update (name, email, etc.)
   * @returns {Promise<Object>} - Updated user data
   */
  updateProfile: async (userData) => {
    try {
      const response = await apiService.put('/customer/profile', userData);
      
      if (response && response.user) {
        // Update local storage with new user data
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile image
   * 
   * @param {Object} imageFile - Image file
   * @returns {Promise<Object>} - Updated user data with image URL
   */
  updateProfileImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);
      
      const response = await apiService.post('/customer/profile/image', formData, true, {
        'Content-Type': 'multipart/form-data',
      });
      
      if (response && response.user) {
        // Update local storage with new user data
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Update profile image error:', error);
      throw error;
    }
  },
  
  /**
   * Change user password
   * 
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Response with status and message
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiService.put('/customer/password', {
        currentPassword,
        newPassword
      });
      
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  updateUser: async (userData) => {
    try {
      const response = await apiService.put('/customer/profile', userData);
      if (response && response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },
};