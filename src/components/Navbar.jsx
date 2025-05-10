import React, { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext';
import { useLocationModal } from '../context/LocationModalContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CloseIcon from '@mui/icons-material/Close';
import { locationService } from '../services/locationService';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Radio from '@mui/material/Radio';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SunnyIcon from '@mui/icons-material/Sunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const Navbar = ({
  handleSidebarOpen,
  searchTerm,
  setSearchTerm,
  showDropdown,
  setShowDropdown,
  searchLoading,
  searchResults,
  searchInputRef,
  setShowLogoutModal,
  showLogoutModal,
  openAddressModal
}) => {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { openLoginModal } = useAuthModal();
  const location = useLocation();
  const navigate = useNavigate();
  const isTicketDetailsPage = location.pathname.startsWith('/ticket/');
  // Local state for location modal
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [locationAddress, setLocationAddress] = React.useState('');
  const [locationInput, setLocationInput] = React.useState('');
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = React.useState(null);
  const [savedAddresses, setSavedAddresses] = React.useState([]);
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });

  // Determine if back button should be shown
  const showBackButton =
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/restaurant') ||
    location.pathname.startsWith('/orders') ||
    location.pathname.startsWith('/tickets') ||
    location.pathname.startsWith('/ticket/') ||
    location.pathname.startsWith('/nearby-restaurants') ||
    location.pathname.startsWith('/search');
    
    

  // Fetch selectedDeliveryAddress and savedAddresses on mount and when modal opens
  React.useEffect(() => {
    (async () => {
      const selected = await locationService.getSelectedAddress();
      setSelectedDeliveryAddress(selected);
      setLocationAddress(selected?.formattedAddress || selected?.address || '');
    })();
  }, []);

  React.useEffect(() => {
    if (showLocationModal) {
      (async () => {
        const selected = await locationService.getSelectedAddress();
        setSelectedDeliveryAddress(selected);
        setLocationAddress(selected?.formattedAddress || selected?.address || '');
        const addresses = await locationService.getSavedAddresses();
        setSavedAddresses(addresses || []);
      })();
    }
  }, [showLocationModal]);

  // Helper to extract short address
  const getShortAddress = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts.slice(0, 4).join(',').trim();
  };
  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: theme.colors.background, color: theme.colors.text, borderBottom: `1px solid ${theme.colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>
        <Toolbar sx={{ maxWidth: 1440, minWidth: 0, width: '100%', mx: 'auto', px: `${theme.spacing.xl || 32}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Back Button (if not on HomePage), then Menu Icon */}
          {showBackButton ? (
            <IconButton onClick={() => navigate(-1)} sx={{ color: theme.colors.primary, mr: 1, width: 80, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <ArrowBackIosNewIcon />
              <span style={{ marginLeft: 4, fontWeight: 600, fontSize: 16, fontFamily: 'Poppins, Arial, sans-serif', color: theme.colors.primary }}>Back</span>
            </IconButton>
          ) : (
            <Box sx={{ width: 80, height: 40, mr: 1 }} />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleSidebarOpen}
              sx={{
                color: theme.colors.text,
                mr: 2,
                '&:hover': {
                  bgcolor: `${theme.colors.primary}10`,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          {/* Logo */}
          <Typography component="a" href="/" sx={{ fontFamily: 'Poppins, Arial, sans-serif', fontWeight: 700, fontSize: theme.typography.fontSize.xxl, color: theme.colors.primary, letterSpacing: 1, textDecoration: 'none', mx: 2 }}>
            roll2bowl
          </Typography>
          {/* Center: Map/Location Bar and Theme Toggle */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Address/Map Bar Container */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme.colors.card, borderRadius: `${theme.borderRadius.large}px`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', px: `${theme.spacing.sm}px`, py: `${theme.spacing.xs}px`, gap: `${theme.spacing.sm}px`, minWidth: 340, position: 'relative' }}>
                {/* Location Selector */}
                <Button
                  startIcon={<LocationOnIcon sx={{ color: theme.colors.primary }} />}
                  onClick={() => setShowLocationModal(true)}
                  sx={{
                    minWidth: 60,
                    border: `1.5px solid ${theme.colors.primary}`,
                    borderRadius: '20px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: theme.typography.fontSize.md,
                    bgcolor: theme.colors.background,
                    color: theme.colors.text,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontWeight: 500,
                    textTransform: 'none',
                    mr: 1,
                    '&:hover': { bgcolor: theme.colors.background, borderColor: theme.colors.primary },
                  }}
                  endIcon={<Typography component="span" sx={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.secondaryText, ml: 0.5 }}>▼</Typography>}
                >
                  {getShortAddress(selectedDeliveryAddress?.formattedAddress || selectedDeliveryAddress?.address) || 'Select location'}
                </Button>
                {/* Location Modal */}
                <Dialog
                  open={showLocationModal}
                  onClose={() => setShowLocationModal(false)}
                  maxWidth="sm"
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
                  <DialogTitle
                    sx={{
                      color: theme.modal.text,
                      bgcolor: theme.modal.background,
                      borderRadius: `${theme.modal.borderRadius}px ${theme.modal.borderRadius}px 0 0`,
                    }}
                  >
                    <IconButton onClick={() => setShowLocationModal(false)} size="large" sx={{ color: theme.modalCloseIcon.color }}>
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ bgcolor: theme.modal.background, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, minWidth: 300 }}>
                    {isDetecting ? (
                      <>
                        <Typography
                          sx={{
                            mb: 2,
                            color: theme.modal.text,
                            textAlign: 'center',
                            wordBreak: 'break-word',
                            minHeight: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                          }}
                        >
                          <CircularProgress size={28} sx={{ color: theme.colors.primary, mb: 1 }} />
                          <span>Detecting your location...</span>
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Card sx={{ width: '100%', maxWidth: 340, bgcolor: theme.modal.background, color: theme.modal.text, borderRadius: 2, boxShadow: 1, mb: 2, border: `1px solid ${theme.colors.border}` }}>
                          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 12, color: theme.modal.text, opacity: 0.7, mb: 0.5 }}>Current Address</Typography>
                            <Typography sx={{ fontWeight: 500, fontSize: 14, color: theme.modal.text }}>
                              {selectedDeliveryAddress?.formattedAddress || selectedDeliveryAddress?.address || 'No address selected'}
                            </Typography>
                          </CardContent>
                        </Card>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<LocationOnIcon />}
                            sx={{
                              bgcolor: theme.modalButton.primary,
                              color: theme.modalButton.primaryText,
                              fontWeight: 500,
                              fontSize: 14,
                              borderRadius: theme.modalButton.borderRadius,
                              py: 0.5,
                              px: 2,
                              minWidth: 70,
                              boxShadow: 'none',
                              '&:hover': { bgcolor: theme.modalButton.primary }
                            }}
                            onClick={async () => {
                              setIsDetecting(true);
                              try {
                                const detected = await locationService.getCurrentLocation();
                                setIsDetecting(false);
                                let addresses = await locationService.getSavedAddresses();
                                if (!addresses || addresses.length === 0) {
                                  await locationService.saveAddress(detected);
                                  setSavedAddresses([detected]);
                                  setSelectedDeliveryAddress(detected);
                                  setLocationAddress(detected.formattedAddress || detected.address);
                                  setShowLocationModal(false);
                                  return;
                                }
                                const selected = selectedDeliveryAddress;
                                const sameCoords =
                                  selected &&
                                  detected &&
                                  selected.coordinates &&
                                  detected.coordinates &&
                                  selected.coordinates.latitude === detected.coordinates.latitude &&
                                  selected.coordinates.longitude === detected.coordinates.longitude;
                                const selectedAddr = selected?.formattedAddress || selected?.address;
                                const detectedAddr = detected?.formattedAddress || detected?.address;
                                const sameAddress = selectedAddr && detectedAddr && selectedAddr === detectedAddr;
                                if (sameCoords && sameAddress) {
                                  setSnackbar({ open: true, message: 'Selected address is same as the address detected', severity: 'info' });
                                  setShowLocationModal(false);
                                  return;
                                }
                                await locationService.storeSelectedAddress(detected);
                                setSelectedDeliveryAddress(detected);
                                setLocationAddress(detected.formattedAddress || detected.address);
                                setShowLocationModal(false);
                              } catch (e) {
                                setIsDetecting(false);
                                // Optionally show error feedback
                              }
                            }}
                            disabled={isDetecting}
                          >
                            Detect Current Location
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              bgcolor: theme.modalButton.secondary,
                              color: theme.modalButton.secondaryText,
                              border: `2px solid ${theme.modalButton.border}`,
                              borderRadius: theme.modalButton.borderRadius,
                              fontWeight: 500,
                              fontSize: 14,
                              py: 0.5,
                              px: 2,
                              minWidth: 70,
                              boxShadow: 'none',
                              '&:hover': { bgcolor: theme.modalButton.secondary }
                            }}
                            onClick={() => setShowAddressModal(true)}
                          >
                            Select Delivery Address
                          </Button>
                        </Box>
                        {/* Address Modal inside Location Modal */}
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
                                {savedAddresses.map((addr, idx) => (
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
                                          setShowLocationModal(false); // Close both modals
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
                                ))}
                              </List>
                            )}
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </Box>
            </Box>
            {/* Theme Icon Container */}
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton onClick={toggleTheme} sx={{ color: theme.colors.primary, p: 0.5, borderRadius: `${theme.borderRadius.small}px`, transition: 'background 0.2s' }}>
                  {isDarkMode ? <SunnyIcon sx={{ fontSize: 32 }} /> : <DarkModeIcon sx={{ fontSize: 32 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {/* Right: Auth/User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${theme.spacing.md}px`, ml: 2 }}>
            {isAuthenticated ? (
              <>
                {user && user.name && (
                  <Typography sx={{ fontWeight: 600, color: theme.colors.primary, mr: 1, display: 'flex', alignItems: 'center' }}>
                    <AccountCircleIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} /> {user.name}
                  </Typography>
                )}
                <Button
                  startIcon={<LogoutIcon />}
                  sx={{ color: theme.colors.secondaryText, fontWeight: 500, fontSize: theme.typography.fontSize.md, textTransform: 'none' }}
                  onClick={() => setShowLogoutModal(true)}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button sx={{ color: theme.colors.secondaryText, fontWeight: 500, fontSize: theme.typography.fontSize.md, textTransform: 'none' }} onClick={e => { e.preventDefault(); openLoginModal(); }}>Log in</Button>
                <Button sx={{ color: theme.colors.secondaryText, fontWeight: 500, fontSize: theme.typography.fontSize.md, textTransform: 'none' }}>Sign up</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Dialog open={showLogoutModal} onClose={() => setShowLogoutModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
          Logout
          <IconButton onClick={() => setShowLogoutModal(false)} size="large" sx={{ color: theme.colors.secondaryText }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.colors.card, textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: 22, mb: 3, color: theme.colors.text }}>Do you want to logout?</Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.colors.card, pb: 3, px: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            sx={{ bgcolor: theme.colors.primary, color: '#fff', fontWeight: 600, fontSize: 18, borderRadius: 2, px: 4, py: 1, boxShadow: 'none', '&:hover': { bgcolor: theme.colors.primary }, mr: 2 }}
            onClick={async () => {
              try {
                setShowLogoutModal(false);
                await logout();
                // Force a page reload to ensure all state is reset
                window.location.href = '/';
              } catch (error) {
                console.error('Logout error:', error);
                setSnackbar({ open: true, message: 'Failed to logout. Please try again.', severity: 'error' });
              }
            }}
          >
            Logout
          </Button>
          <Button
            variant="outlined"
            sx={{ color: theme.colors.text, borderColor: theme.colors.border, fontWeight: 600, fontSize: 18, borderRadius: 2, px: 4, py: 1, boxShadow: 'none', '&:hover': { borderColor: theme.colors.primary } }}
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          sx={{
            borderRadius: 2,
            fontSize: 18,
            fontWeight: 600,
            minWidth: 320,
            boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
            alignItems: 'center',
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default Navbar; 