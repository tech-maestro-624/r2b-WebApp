import React, { useContext, useEffect, useState, useRef } from 'react';
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
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useAuth } from '../../context/AuthContext';
import { useDeliveryAddress } from '../../context/LocationContext.jsx';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CloseIcon from '@mui/icons-material/Close';
import { locationService } from '../../services/locationService';
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
import { GoogleMap, LoadScript, Marker, useJsApiLoader } from '@react-google-maps/api';
import useMediaQuery from '@mui/material/useMediaQuery';
import logo from '../../assets/logo.png';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { handleBack } from '../../utils/navigation';

// Helper to extract short address
const getShortAddress = (address) => {
  if (!address) return '';
  const parts = address.split(',');
  return parts.slice(0, 4).join(',').trim();
};
// Helper to extract last line of address
const getLastLineOfAddress = (address) => {
  if (!address) return '';
  const parts = address.split(',');
  return parts[parts.length - 1].trim();
};

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
  showLogoutModal
}) => {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { openLoginModal  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isTicketDetailsPage = location.pathname.startsWith('/ticket/');
  const { selectedDeliveryAddress, savedAddresses, setSelectedDeliveryAddress, setSavedAddresses, openAddressModal } = useDeliveryAddress();
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [locationAddress, setLocationAddress] = React.useState('');
  const [locationInput, setLocationInput] = React.useState('');
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });
  const [showDetectModal, setShowDetectModal] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDA5ZUSnr2u0nw7Hu49Sm4ebhPte7AwiTM",
    libraries: ['places']
  });
  const [address, setAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const mapRef = useRef(null);
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [showSelectAddressModal, setShowSelectAddressModal] = React.useState(false);

  // Determine if back button should be shown
  const showBackButton =
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/restaurant') ||
    location.pathname.startsWith('/orders') ||
    location.pathname.startsWith('/tickets') ||
    location.pathname.startsWith('/ticket/') ||
    location.pathname.startsWith('/nearby-restaurants') ||
    location.pathname.startsWith('/search');
    
    

  const mapContainerStyle = {
    width: '100%',
    height: '300px'
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setMapError('Error getting location: ' + error.message);
        }
      );
    } else {
      setMapError('Geolocation is not supported by your browser');
    }
  };

  useEffect(() => {
    if (showDetectModal) {
      getCurrentLocation();
    }
  }, [showDetectModal]);

  const getAddressFromCoordinates = async (lat, lng) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDA5ZUSnr2u0nw7Hu49Sm4ebhPte7AwiTM`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('Address not available');
    }
    setIsLoadingAddress(false);
  };

  useEffect(() => {
    if (currentLocation) {
      getAddressFromCoordinates(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation]);

  // Helper for safe marker animation
  const markerAnimation =
    typeof window !== 'undefined' &&
    window.google &&
    window.google.maps &&
    window.google.maps.Animation
      ? window.google.maps.Animation.DROP
      : undefined;

  // Handler for input change (now uses Places library)
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowSuggestions(true);
    if (!value || !(window.google && window.google.maps && window.google.maps.places)) {
      setSuggestions([]);
      return;
    }
    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: value }, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
      } else {
        setSuggestions([]);
      }
    });
  };

  // Handler for selecting a suggestion (geocode placeId)
  const handleSuggestionClick = async (suggestion) => {
    setSearchInput(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    if (!(window.google && window.google.maps && window.google.maps.Geocoder)) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const newCenter = { lat: loc.lat(), lng: loc.lng() };
        setMapCenter(newCenter); // Only set center after search
        setAddress(results[0].formatted_address);
        setSearchedLocation({ lat: loc.lat(), lng: loc.lng(), address: results[0].formatted_address });
      } else {
        setSnackbar({ open: true, message: 'Location not found.', severity: 'error' });
      }
    });
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleMapIdle = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const lat = center.lat();
    const lng = center.lng();
    if (!(window.google && window.google.maps && window.google.maps.Geocoder)) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setAddress(results[0].formatted_address);
        setSearchedLocation({ lat, lng, address: results[0].formatted_address });
      }
    });
  };

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: theme.colors.background, color: theme.colors.text, borderBottom: `1px solid ${theme.colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>
        <Toolbar sx={{ maxWidth: 1440, minWidth: 0, width: '100%', mx: 'auto', px: `${theme.spacing.xl || 32}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, height: 64 }}>
          {/* Left: Back Button (if not on HomePage), then Menu Icon */}
          {showBackButton ? (
            <IconButton onClick={() => handleBack(navigate)} sx={{ color: theme.colors.primary, mr: 1, width: 80, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <ArrowBackIosNewIcon />
              <span style={{ marginLeft: 4, fontWeight: 600, fontSize: 16, fontFamily: 'Trebuchet MS, Arial, sans-serif', color: theme.colors.primary }}>Back</span>
            </IconButton>
          ) : (
            <Box sx={{ width: 80, height: 40, mr: 1 }} />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleSidebarOpen}
              sx={{
                color: theme.colors.text,
                mr: { xs: 0.5, sm: 2 },
                '&:hover': {
                  bgcolor: `${theme.colors.primary}10`,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginLeft: 8, marginRight: 8, height: 88, minWidth: 120 }}>
            <img
              src={logo}
              alt="Roll2Bowl Logo"
              style={{ height: 165, width: 'auto', display: 'block', objectFit: 'contain', verticalAlign: 'middle' }}
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML += '<span style="color:#FF5A33;font-family:Trebuchet MS, Arial, sans-serif;font-weight:700;font-size:2rem;">ROLL2BOWL</span>'; }}
            />
          </a>
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
                  {isSmallScreen
                    ? getLastLineOfAddress(selectedDeliveryAddress?.formattedAddress || selectedDeliveryAddress?.address) || 'Select location'
                    : getShortAddress(selectedDeliveryAddress?.formattedAddress || selectedDeliveryAddress?.address) || 'Select location'}
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
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{
                                mt: 1.5,
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
                              Change Delivery Address
                            </Button>
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
                            onClick={() => setShowDetectModal(true)}
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
                            onClick={() => setShowSelectAddressModal(true)}
                          >
                            Search Delivery Location
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
                              bgcolor: theme.colors.card,
                              color: theme.colors.text,
                              borderRadius: 2,
                              boxShadow: 1,
                            }
                          }}
                        >
                          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
                            Select Delivery Address
                            <IconButton onClick={() => setShowAddressModal(false)}>
                              <CloseIcon />
                            </IconButton>
                          </DialogTitle>
                          <DialogContent sx={{ bgcolor: theme.colors.card, color: theme.colors.text }}>
                            {savedAddresses.length === 0 ? (
                              <Typography>No saved addresses found.</Typography>
                            ) : (
                              savedAddresses.map((addr, idx) => (
                                <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                                  <Typography sx={{ fontWeight: 600 }}>{addr.label || addr.type || 'Address'}</Typography>
                                  <Typography sx={{ fontSize: 14 }}>{addr.formattedAddress || addr.address}</Typography>
                                  <Button
                                    variant="contained"
                                    sx={{
                                      bgcolor: theme.colors.primary,
                                      color: theme.colors.buttonText || '#fff',
                                      borderRadius: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      py: 0.5,
                                      px: 2,
                                      minWidth: 70,
                                      boxShadow: 'none',
                                      mt: 1,
                                      '&:hover': { bgcolor: theme.colors.primary }
                                    }}
                                    onClick={async () => {
                                      const addressToStore = {
                                        ...addr,
                                        coordinates: {
                                          latitude: addr.latitude || (addr.coordinates && addr.coordinates.latitude),
                                          longitude: addr.longitude || (addr.coordinates && addr.coordinates.longitude)
                                        }
                                      };
                                      await setSelectedDeliveryAddress(addressToStore);
                                      setShowAddressModal(false);
                                      setShowLocationModal(false);
                                      setShowDetectModal(false);
                                      setShowSelectAddressModal(false);
                                      setShowConfirmModal(false);
                                      setSnackbar({ open: true, message: 'Delivery address selected!', severity: 'success' });
                                    }}
                                  >
                                    Deliver Here
                                  </Button>
                                </Box>
                              ))
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
            {!isSmallScreen && (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton onClick={toggleTheme} sx={{ color: theme.colors.primary, p: 0.5, borderRadius: `${theme.borderRadius.small}px`, transition: 'background 0.2s' }}>
                  {isDarkMode ? <SunnyIcon sx={{ fontSize: 32 }} /> : <DarkModeIcon sx={{ fontSize: 32 }} />}
                </IconButton>
              </Tooltip>
            </Box>
            )}
          </Box>
          {/* Right: Auth/User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${theme.spacing.md}px`, ml: 2 }}>
            {isAuthenticated ? (
              <>
                <Typography sx={{ color: theme.colors.secondaryText, fontWeight: 500, fontSize: theme.typography.fontSize.md, textTransform: 'none' }}>
                  {user?.name || user?.email || 'User'}
                </Typography>
                <Button
                  sx={{ color: theme.colors.secondaryText, fontWeight: 500, fontSize: theme.typography.fontSize.md, textTransform: 'none' }}
                  onClick={() => setShowLogoutModal(true)}
                  startIcon={<LogoutIcon />}
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          icon={snackbar.severity === 'success' ? <CheckCircleIcon sx={{ fontSize: 28, mr: 1, color: '#fff' }} /> : undefined}
          sx={{
            bgcolor: snackbar.severity === 'success' ? '#219653' : theme.modal.background,
            color: snackbar.severity === 'success' ? '#fff' : theme.colors.text,
            borderRadius: 2.5,
            fontWeight: 400,
            fontSize: 16,
            minWidth: 280,
            px: 2,
            py: 1,
            boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Trebuchet MS, Arial, sans-serif',
            border: snackbar.severity === 'success' ? 'none' : `2px solid ${theme.colors.primary}`,
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      <Dialog open={showDetectModal} onClose={() => setShowDetectModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', bgcolor: theme.modal.background, color: theme.modal.text, minHeight: 0, py: 1, borderRadius: `${theme.modal.borderRadius}px ${theme.modal.borderRadius}px 0 0` }}>
          <Typography sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontWeight: 600,
            fontSize: '1.1rem',
            color: theme.modal.text,
            textAlign: 'center',
            width: '100%',
            pointerEvents: 'none',
          }}>
            Your Current Location
          </Typography>
          <IconButton onClick={() => setShowDetectModal(false)} size="large" sx={{ color: theme.modalCloseIcon.color, zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background, minWidth: '400px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <Box
              sx={{
                p: 2,
                border: `1px solid ${theme.colors.border}`,
                bgcolor: theme.colors.card,
                '&:hover': {
                  borderColor: theme.colors.primary,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              {mapError ? (
                <Typography sx={{ color: 'error.main', textAlign: 'center', fontSize: '1.1rem' }}>
                  {mapError}
                </Typography>
              ) : !isLoaded ? (
                <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <Box sx={{ position: 'relative', width: '100%', height: '300px', bgcolor: theme.colors.card, borderRadius: 2, border: `1px solid ${theme.colors.border}` }}>
                  <GoogleMap
                    mapContainerStyle={{
                      width: '100%',
                      height: '300px'
                    }}
                    center={currentLocation}
                    zoom={16}
                    options={{ disableDefaultUI: true }}
                  >
                    <Marker
                      position={currentLocation}
                      {...(markerAnimation ? { animation: markerAnimation } : {})}
                    />
                  </GoogleMap>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: theme.colors.card,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 2,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      py: 1,
                      minWidth: '90%',
                      maxWidth: '98%',
                      zIndex: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <LocationOnIcon sx={{ color: theme.colors.primary, mr: 1, fontSize: 24 }} />
                      {isLoadingAddress ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography sx={{ color: theme.colors.text }}>
                            Fetching address...
                          </Typography>
                        </Box>
                      ) : (
                        <Typography 
                          sx={{ 
                            color: theme.colors.text,
                            fontSize: '0.80rem',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-line'
                          }}
                        >
                          {address || 'Address not available'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                label=""
                variant="outlined"
                size="small"
                placeholder="Add house number"
                required
                value={houseNumber}
                onChange={e => setHouseNumber(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.colors.primary } }}
              />
              <TextField
                fullWidth
                label=""
                variant="outlined"
                size="small"
                placeholder="Add landmark"
                required
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.colors.primary } }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2, mb: 1, width: '100%' }}>
              <Button
                variant={selectedLabel === 'Home' ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 0,
                  minWidth: 0,
                  maxWidth: '100%',
                  bgcolor: selectedLabel === 'Home' ? theme.colors.primary : theme.colors.card,
                  color: selectedLabel === 'Home' ? theme.colors.buttonText || '#fff' : theme.colors.text,
                  borderColor: theme.colors.primary,
                  '&:hover': {
                    bgcolor: selectedLabel === 'Home' ? theme.colors.primary : theme.colors.background,
                    color: selectedLabel === 'Home' ? theme.colors.buttonText || '#fff' : theme.colors.primary,
                    borderColor: theme.colors.primary
                  }
                }}
                onClick={() => setSelectedLabel('Home')}
              >
                Home
              </Button>
              <Button
                variant={selectedLabel === 'Work' ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 0,
                  minWidth: 0,
                  maxWidth: '100%',
                  bgcolor: selectedLabel === 'Work' ? theme.colors.primary : theme.colors.card,
                  color: selectedLabel === 'Work' ? theme.colors.buttonText || '#fff' : theme.colors.text,
                  borderColor: theme.colors.primary,
                  '&:hover': {
                    bgcolor: selectedLabel === 'Work' ? theme.colors.primary : theme.colors.background,
                    color: selectedLabel === 'Work' ? theme.colors.buttonText || '#fff' : theme.colors.primary,
                    borderColor: theme.colors.primary
                  }
                }}
                onClick={() => setSelectedLabel('Work')}
              >
                Work
              </Button>
              <Button
                variant={selectedLabel === 'Others' ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 0,
                  minWidth: 0,
                  maxWidth: '100%',
                  bgcolor: selectedLabel === 'Others' ? theme.colors.primary : theme.colors.card,
                  color: selectedLabel === 'Others' ? theme.colors.buttonText || '#fff' : theme.colors.text,
                  borderColor: theme.colors.primary,
                  '&:hover': {
                    bgcolor: selectedLabel === 'Others' ? theme.colors.primary : theme.colors.background,
                    color: selectedLabel === 'Others' ? theme.colors.buttonText || '#fff' : theme.colors.primary,
                    borderColor: theme.colors.primary
                  }
                }}
                onClick={() => setSelectedLabel('Others')}
              >
                Others
              </Button>
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{
                mt: 1,
                width: '100%',
                fontWeight: 600,
                fontSize: '0.95rem',
                py: 0.7,
                borderRadius: 2,
                boxShadow: 'none',
                bgcolor: theme.colors.primary,
                color: theme.colors.buttonText || '#fff',
                minHeight: '32px',
                '&:hover': { bgcolor: theme.colors.primary }
              }}
              size="small"
              onClick={() => {
                const addressObj = {
                  label: selectedLabel,
                  address: address,
                  formattedAddress: `${houseNumber} ${address} landmark:${landmark}`,
                  coordinates: currentLocation ? {
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng
                  } : {},
                  timestamp: Date.now()
                };
                // Get current saved addresses from localStorage
                let saved = [];
                try {
                  saved = JSON.parse(localStorage.getItem('savedAddresses')) || [];
                } catch (e) { saved = []; }
                // Check for duplicate by address field
                const alreadyExists = saved.some(a => a.address === addressObj.address);
                if (alreadyExists) {
                  setShowLocationModal(false);
                  setShowDetectModal(false);
                  setShowConfirmModal(false);
                  setShowSelectAddressModal(false);
                  setSnackbar({ open: true, message: 'Address is already added.', severity: 'error' });
                  return;
                }
                // Add new address
                saved.push(addressObj);
                // Save back to localStorage
                localStorage.setItem('savedAddresses', JSON.stringify(saved));
                window.dispatchEvent(new Event('addressChanged'));
                // Update state
                setSavedAddresses(saved);
                setShowLocationModal(false);
                setShowDetectModal(false);
                setShowConfirmModal(false);
                setShowSelectAddressModal(false);
                setSnackbar({ open: true, message: 'Address added.', severity: 'success' });
              }}
              disabled={!houseNumber || !landmark || !selectedLabel}
            >
              Confirm Location
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', bgcolor: theme.modal.background, color: theme.modal.text, minHeight: 0, py: 1, borderRadius: `${theme.modal.borderRadius}px ${theme.modal.borderRadius}px 0 0` }}>
          <IconButton onClick={() => setShowConfirmModal(false)} size="large" sx={{ color: theme.modalCloseIcon.color }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background, minHeight: 120 }}>
          {/* Blank modal content for now */}
        </DialogContent>
      </Dialog>
      <Dialog open={showSelectAddressModal} onClose={() => setShowSelectAddressModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', bgcolor: theme.modal.background, color: theme.modal.text, minHeight: 0, py: 1, borderRadius: `${theme.modal.borderRadius}px ${theme.modal.borderRadius}px 0 0` }}>
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontWeight: 600,
            fontSize: '1.1rem',
            color: theme.modal.text,
            textAlign: 'center',
            width: '100%',
            pointerEvents: 'none',
          }}>Search Location</span>
          <IconButton onClick={() => setShowSelectAddressModal(false)} size="large" sx={{ color: theme.modalCloseIcon.color, zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background, minWidth: '400px' }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search address or location"
              sx={{ bgcolor: theme.colors.card, borderRadius: 2 }}
              InputProps={{
                style: { fontSize: '1rem' },
              }}
              value={searchInput}
              onChange={handleSearchInputChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <Box sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                bgcolor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                zIndex: 10,
                maxHeight: 220,
                overflowY: 'auto',
              }}>
                {suggestions.map((s, idx) => (
                  <Box
                    key={s.place_id}
                    sx={{
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      color: theme.colors.text,
                      fontSize: '0.97rem',
                      '&:hover': { bgcolor: theme.colors.primary + '11' },
                      borderBottom: idx !== suggestions.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                    }}
                    onMouseDown={() => handleSuggestionClick(s)}
                  >
                    {s.description}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {isLoaded && searchedLocation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, pt: 0 }}>
              <Box sx={{ position: 'relative', width: '100%', height: '300px', bgcolor: theme.colors.card, borderRadius: 2, border: `1px solid ${theme.colors.border}` }}>
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '300px'
                  }}
                  center={mapCenter}
                  zoom={16}
                  options={{ disableDefaultUI: true }}
                  onLoad={handleMapLoad}
                  onIdle={handleMapIdle}
                >
                  {/* Pin at center, not draggable */}
                </GoogleMap>
                {/* Center pin overlay */}
                <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 3, pointerEvents: 'none' }}>
                  <LocationOnIcon sx={{ color: theme.colors.primary, fontSize: 40, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 2,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    minWidth: '90%',
                    maxWidth: '98%',
                    zIndex: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <LocationOnIcon sx={{ color: theme.colors.primary, mr: 1, fontSize: 24 }} />
                    <Typography 
                      sx={{ 
                        color: theme.colors.text,
                        fontSize: '0.80rem',
                        fontWeight: 500,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {searchedLocation.address || 'Address not available'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 1, mb: 1 }}>
            <TextField
              fullWidth
              label=""
              variant="outlined"
              size="small"
              placeholder="Add house number"
              required
              value={houseNumber}
              onChange={e => setHouseNumber(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.colors.primary } }}
            />
            <TextField
              fullWidth
              label=""
              variant="outlined"
              size="small"
              placeholder="Add landmark"
              required
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.colors.primary } }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2, mb: 1, width: '100%' }}>
            <Button
              variant={selectedLabel === 'Home' ? 'contained' : 'outlined'}
              size="small"
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 500,
                textTransform: 'none',
                px: 0,
                minWidth: 0,
                maxWidth: '100%',
                bgcolor: selectedLabel === 'Home' ? theme.colors.primary : theme.colors.card,
                color: selectedLabel === 'Home' ? theme.colors.buttonText || '#fff' : theme.colors.text,
                borderColor: theme.colors.primary,
                '&:hover': {
                  bgcolor: selectedLabel === 'Home' ? theme.colors.primary : theme.colors.background,
                  color: selectedLabel === 'Home' ? theme.colors.buttonText || '#fff' : theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              }}
              onClick={() => setSelectedLabel('Home')}
            >
              Home
            </Button>
            <Button
              variant={selectedLabel === 'Work' ? 'contained' : 'outlined'}
              size="small"
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 500,
                textTransform: 'none',
                px: 0,
                minWidth: 0,
                maxWidth: '100%',
                bgcolor: selectedLabel === 'Work' ? theme.colors.primary : theme.colors.card,
                color: selectedLabel === 'Work' ? theme.colors.buttonText || '#fff' : theme.colors.text,
                borderColor: theme.colors.primary,
                '&:hover': {
                  bgcolor: selectedLabel === 'Work' ? theme.colors.primary : theme.colors.background,
                  color: selectedLabel === 'Work' ? theme.colors.buttonText || '#fff' : theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              }}
              onClick={() => setSelectedLabel('Work')}
            >
              Work
            </Button>
            <Button
              variant={selectedLabel === 'Others' ? 'contained' : 'outlined'}
              size="small"
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 500,
                textTransform: 'none',
                px: 0,
                minWidth: 0,
                maxWidth: '100%',
                bgcolor: selectedLabel === 'Others' ? theme.colors.primary : theme.colors.card,
                color: selectedLabel === 'Others' ? theme.colors.buttonText || '#fff' : theme.colors.text,
                borderColor: theme.colors.primary,
                '&:hover': {
                  bgcolor: selectedLabel === 'Others' ? theme.colors.primary : theme.colors.background,
                  color: selectedLabel === 'Others' ? theme.colors.buttonText || '#fff' : theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              }}
              onClick={() => setSelectedLabel('Others')}
            >
              Others
            </Button>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{
              mt: 1,
              width: '100%',
              fontWeight: 600,
              fontSize: '0.95rem',
              py: 0.7,
              borderRadius: 2,
              boxShadow: 'none',
              bgcolor: theme.colors.primary,
              color: theme.colors.buttonText || '#fff',
              minHeight: '32px',
              '&:hover': { bgcolor: theme.colors.primary }
            }}
            size="small"
            onClick={() => {
              const addressObj = {
                label: selectedLabel,
                address: searchedLocation?.address || '',
                formattedAddress: `${houseNumber} ${(searchedLocation?.address || '')} landmark:${landmark}`,
                coordinates: searchedLocation ? {
                  latitude: searchedLocation.lat,
                  longitude: searchedLocation.lng
                } : {},
                timestamp: Date.now()
              };
              // Get current saved addresses from localStorage
              let saved = [];
              try {
                saved = JSON.parse(localStorage.getItem('savedAddresses')) || [];
              } catch (e) { saved = []; }
              // Check for duplicate by address field
              const alreadyExists = saved.some(a => a.address === addressObj.address);
              if (alreadyExists) {
                setShowLocationModal(false);
                setShowDetectModal(false);
                setShowConfirmModal(false);
                setShowSelectAddressModal(false);
                setSnackbar({ open: true, message: 'Address is already added.', severity: 'error' });
                return;
              }
              // Add new address
              saved.push(addressObj);
              // Save back to localStorage
              localStorage.setItem('savedAddresses', JSON.stringify(saved));
              window.dispatchEvent(new Event('addressChanged'));
              // Update state
              setSavedAddresses(saved);
              setShowLocationModal(false);
              setShowDetectModal(false);
              setShowConfirmModal(false);
              setShowSelectAddressModal(false);
              setSnackbar({ open: true, message: 'Address added.', severity: 'success' });
            }}
            disabled={!houseNumber || !landmark || !selectedLabel || !searchedLocation}
          >
            Confirm Location
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar; 