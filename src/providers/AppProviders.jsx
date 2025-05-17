import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { LocationProvider } from '../context/LocationContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { EventBusProvider } from './EventBusProvider';

// Root AppProviders component to organize context providers
const AppProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <EventBusProvider>
                {children}
              </EventBusProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
    </BrowserRouter>
  );
};

export default AppProviders; 