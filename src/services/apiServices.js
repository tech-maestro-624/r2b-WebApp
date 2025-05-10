import axios from 'axios';

// Base API URL
const API_BASE_URL = 'https://r2bserver.azurewebsites.net/api';
// const API_BASE_URL = 'https://obliging-humble-tortoise.ngrok-free.app/api';
// const API_BASE_URL = 'https://acc9-2406-7400-10a-f972-d9fe-f1bc-8229-302c.ngrok-free.app/api'
// const API_BASE_URL='http://192.168.1.10:8080/api'
// const API_BASE_URL='https://greatly-magical-bluejay.ngrok-free.app/api'
  // const API_BASE_URL='https://equipped-piranha-briefly.ngrok-free.app/api'
  // const API_BASE_URL='http://192.168.1.106:8081/api'


// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    "ngrok-skip-browser-warning": "69420",
  },
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip auth header if includeAuth is false
    if (config.headers.skipAuth) {
      delete config.headers.skipAuth;
      return config;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.message || 'API request failed';
    console.error(`API Error (${error.config?.url}):`, errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Export API service methods
export const apiService = {
  // Get request
  get: (endpoint, includeAuth = true) => {
    return axiosInstance.get(endpoint, {
      headers: includeAuth ? {} : { skipAuth: true }
    });
  },
  
  // Post request
  post: (endpoint, data, includeAuth = true) => {
    return axiosInstance.post(endpoint, data, {
      headers: includeAuth ? {} : { skipAuth: true }
    });
  },
  
  // Put request
  put: (endpoint, data, includeAuth = true) => {
    return axiosInstance.put(endpoint, data, {
      headers: includeAuth ? {} : { skipAuth: true }
    });
  },
  
  // Patch request
  patch: (endpoint, data, includeAuth = true) => {
    return axiosInstance.patch(endpoint, data, {
      headers: includeAuth ? {} : { skipAuth: true }
    });
  },
  
  // Delete request
  delete: (endpoint, includeAuth = true) => {
    return axiosInstance.delete(endpoint, {
      headers: includeAuth ? {} : { skipAuth: true }
    });
  },
};

// Export the axios instance for direct use in other services
export default axiosInstance;