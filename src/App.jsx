import React, { useContext, useState, useEffect, lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter } from 'react-router-dom';
// Remove NavigationContainer and View from React Native
// import { NavigationContainer } from '@react-navigation/native';
// import { View } from 'react-native';
import './App.css';

// Navigation
import AppNavigator from './Routes/ReactRouter.jsx';
const HomePage = lazy(() => import('./pages/HomePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const TicketDetails = lazy(() => import('./pages/TicketDetails'));
const SearchItems = lazy(() => import('./pages/SearchItems'));

// Context Providers
import { ThemeContext, ThemeProvider } from './context/ThemeContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';
import { CartProvider, CartContext } from './context/CartContext.jsx';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext.jsx';
import { LocationModalProvider } from './context/LocationModalContext.jsx';

// Components
import FloatingCart from './components/FloatingCart.jsx';
import GlobalAuthModals from './components/GlobalAuthModals';
import Navbar from './components/Navbar.jsx';
import SideMenu from './components/SideMenu.jsx';
import { Dialog, DialogTitle, DialogContent, List, ListItem, Button, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
// import Toast from 'react-native-toast-message';
// TODO: Use a web toast library like 'react-toastify' if needed
import { locationService } from './services/locationService';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import CartStatusModal from './components/CartStatusModal';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AuthModalProvider>
            <GlobalAuthModals />
            <LocationProvider>
              <LocationModalProvider>
                <CartProvider>
                  <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', padding: 32 }}>Loading...</div>}>
                    <AppWithCartContext />
                  </Suspense>
                </CartProvider>
              </LocationModalProvider>
            </LocationProvider>
          </AuthModalProvider>
        </AuthProvider>
      </ThemeProvider>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </BrowserRouter>
  );
}

function AppWithCartContext() {
  const { isCartOpen, closeCartModal, cartItems, changeCartItemQuantity, removeFromCart } = useContext(CartContext);

  // Sidebar state at the top level
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Logout modal state at the top level
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Location modal state at the top level
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Orders modal state at the top level
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Address modal state at the top level
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const openAddressModal = () => setShowAddressModal(true);

  useEffect(() => {
    if (showAddressModal) {
      (async () => {
        const selected = await locationService.getSelectedAddress();
        setSelectedDeliveryAddress(selected);
        setLocationAddress(selected?.formattedAddress || selected?.address || '');
        const addresses = await locationService.getSavedAddresses();
        setSavedAddresses(addresses || []);
      })();
    }
  }, [showAddressModal]);

  return (
    <>
      <Navbar 
        handleSidebarOpen={() => setSidebarOpen(true)} 
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
      />
      <AppContent
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        showOrdersModal={showOrdersModal}
        setShowOrdersModal={setShowOrdersModal}
      />
      <FloatingCart />
      <CartStatusModal
        open={isCartOpen}
        onClose={closeCartModal}
        cartItems={cartItems}
        handleQuantityChange={(itemId, delta) => changeCartItemQuantity(itemId, delta)}
        removeFromCart={removeFromCart}
      />
    </>
  );
}

// New child component
function AppContent({
  sidebarOpen,
  setSidebarOpen,
  showLogoutModal,
  setShowLogoutModal,
  showOrdersModal,
  setShowOrdersModal,
}) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { openLoginModal } = useAuthModal();
  const { theme } = useContext(ThemeContext);

  // Address modal state at the AppContent level
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const openAddressModal = () => setShowAddressModal(true);

  useEffect(() => {
    if (showAddressModal) {
      (async () => {
        const selected = await locationService.getSelectedAddress();
        setSelectedDeliveryAddress(selected);
        setLocationAddress(selected?.formattedAddress || selected?.address || '');
        const addresses = await locationService.getSavedAddresses();
        setSavedAddresses(addresses || []);
      })();
    }
  }, [showAddressModal]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SideMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showOrdersModal={showOrdersModal}
        setShowOrdersModal={setShowOrdersModal}
        user={user}
        isAuthenticated={isAuthenticated}
        openLoginModal={openLoginModal}
        openAddressModal={openAddressModal}
      />
      {/* Global Address Modal with theme support */}
      <Dialog
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.modal.background,
            color: theme.modal.text,
            borderRadius: theme.modal.borderRadius,
            boxShadow: theme.modal.boxShadow,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', bgcolor: theme.modal.background, color: theme.modal.text, minHeight: 0, py: 1, borderRadius: `${theme.modal.borderRadius}px ${theme.modal.borderRadius}px 0 0` }}>
          <IconButton onClick={() => setShowAddressModal(false)} size="large" sx={{ color: theme.modalCloseIcon.color }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background }}>
          <Typography variant="h6" sx={{ mb: 2, color: theme.modal.text, textAlign: 'center' }}>Saved Delivery Addresses</Typography>
          {savedAddresses.length === 0 ? (
            <Typography sx={{ color: theme.colors.secondaryText, textAlign: 'center' }}>No saved addresses found.</Typography>
          ) : (
            <List>
              {savedAddresses.map((addr, idx) => {
                const isSelected = selectedAddress && addr.coordinates && selectedAddress.coordinates &&
                  addr.coordinates.latitude === selectedAddress.coordinates.latitude &&
                  addr.coordinates.longitude === selectedAddress.coordinates.longitude &&
                  (addr.formattedAddress || addr.address) === (selectedAddress.formattedAddress || selectedAddress.address);
                return (
                  <ListItem key={idx} sx={{ flexDirection: 'row', alignItems: 'center', mb: 1 }}
                    secondaryAction={
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: theme.modalButton.primary,
                          color: theme.modalButton.primaryText,
                          borderRadius: theme.modalButton.borderRadius,
                          fontWeight: 500,
                          fontSize: 14,
                          py: 0.5,
                          px: 2,
                          minWidth: 70,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: theme.modalButton.primary }
                        }}
                        onClick={async () => {
                          setSelectedAddress(addr);
                          const addressToStore = {
                            ...addr,
                            coordinates: {
                              latitude: addr.latitude || (addr.coordinates && addr.coordinates.latitude),
                              longitude: addr.longitude || (addr.coordinates && addr.coordinates.longitude)
                            }
                          };
                          await locationService.storeSelectedAddress(addressToStore);
                          setSelectedDeliveryAddress(addressToStore);
                          setLocationAddress(addressToStore.formattedAddress || addressToStore.address);
                          setShowAddressModal(false);
                          setSidebarOpen(false);
                          setSnackbar({ open: true, message: 'Delivery address selected!', severity: 'success' });
                        }}
                      >
                        Deliver Here
                      </Button>
                    }
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, color: theme.modal.text }}>{addr.label || addr.type || 'Address'}</Typography>
                      <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14 }}>{addr.formattedAddress || addr.address}</Typography>
                      {addr.pincode && <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>Pincode: {addr.pincode}</Typography>}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      <AppNavigator />
      <Footer />
    </div>
  );
}
