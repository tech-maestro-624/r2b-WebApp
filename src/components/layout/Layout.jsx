import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from '../ui/Navbar.jsx';
import SideMenu from '../ui/SideMenu.jsx';
import Footer from '../ui/Footer.jsx';
import Loader from '../common/Loader';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEventBus } from '../../providers/EventBusProvider';
import { ThemeContext } from '../../context/ThemeContext';

// Layout Component - Provides the basic page structure
const Layout = ({ children, Component, componentKey }) => {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const eventBus = useEventBus();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Check active path for navigation
  const isActive = useCallback((path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }, [location.pathname]);
  
  // Basic actions - stable references
  const handleSidebarOpen = useCallback(() => setSidebarOpen(true), []);
  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
  
  // Navigation handler - stable reference
  const handleNavigate = useCallback((path) => {
    navigate(path);
    setSidebarOpen(false);
  }, [navigate]);
  
  // Address modal - stable reference
  const handleOpenAddressModal = useCallback(() => {
    if (eventBus) {
      eventBus.publish('openAddressModal');
    }
  }, [eventBus]);
  
  // Effect to close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  
  // Listen for address selected event
  useEffect(() => {
    if (!eventBus) return;
    
    const unsubscribe = eventBus.subscribe('addressSelected', () => {
      setSidebarOpen(false);
    });
    
    return unsubscribe;
  }, [eventBus]);
  
  // Handle transitions when Component changes
  useEffect(() => {
    if (Component) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [Component, componentKey]);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: theme.colors.background
    }}>
      {/* Navbar */}
      <Navbar 
        handleSidebarOpen={handleSidebarOpen} 
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
      />
      
      {/* Side Menu */}
      <SideMenu
        open={sidebarOpen}
        onClose={handleSidebarClose}
        showOrdersModal={showOrdersModal}
        setShowOrdersModal={setShowOrdersModal}
        user={user}
        isAuthenticated={isAuthenticated}
        openLoginModal={openLoginModal}
        openAddressModal={handleOpenAddressModal}
        onNavigate={handleNavigate}
        isActive={isActive}
      />
      
      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        background: theme.colors.background,
        minHeight: '400px'
      }}>
        {Component ? (
          <Box sx={{ 
            position: 'relative', 
            flex: 1,
            minHeight: '400px',
            overflow: 'hidden'
          }}>
            {isTransitioning && <Loader fullPage={false} />}
            <Component key={componentKey} />
          </Box>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 