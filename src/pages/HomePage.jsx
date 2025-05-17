import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { restaurantService } from '../services/restaurantService';
import { fileService } from '../services/fileService';
import { AuthContext } from '../context/AuthContext.jsx';
import { locationService } from '../services/locationService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

import {  Suspense } from 'react';
const OrdersPage = React.lazy(() => import('./OrdersPage'));

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Link } from 'react-router-dom';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';
import { searchFoodItems } from '../services/foodService';
import CircularProgress from '@mui/material/CircularProgress';
import { useDeliveryAddress } from '../context/LocationContext.jsx';
import { Helmet } from 'react-helmet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { handleBack } from '../utils/navigation';


const HomePage = () => {
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoriesRowRef = React.useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [loadingNearbyRestaurants, setLoadingNearbyRestaurants] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    key: 0,
  });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const featuredRowRef = useRef(null);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef();
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [visibleNearbyCount, setVisibleNearbyCount] = useState(8); // 2 rows of 4 columns (8 cards)
  const [loadingMoreNearby, setLoadingMoreNearby] = useState(false);
  const observerRef = useRef(null);

  // Veg Only filter state
  const [isVegOnly, setIsVegOnly] = useState(() => {
    const saved = localStorage.getItem('isVegOnly');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('isVegOnly', JSON.stringify(isVegOnly));
  }, [isVegOnly]);

  // Filtered search results based on veg filter
  const filteredSearchResults = searchResults.filter(item => !isVegOnly || item.dishType === 'veg');

  console.log('isAuthenticated:', isAuthenticated);
  const navigate = useNavigate();
  // Memoized scroll handlers to avoid unnecessary re-renders
  const scrollCategories = useCallback((direction) => {
    if (categoriesRowRef.current) {
      const scrollAmount = 300;
      categoriesRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollFeatured = useCallback((direction) => {
    if (featuredRowRef.current) {
      const scrollAmount = 320;
      featuredRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        let res = await restaurantService.getAllCategories();
        console.log('Raw categories response:', res.categories);
        let categories = res.categories || [];
        categories = categories.map(cat => ({
          ...cat,
          imageUrl: cat.image
            ? cat.image.startsWith('http')
              ? cat.image
              : `/api/download/${cat.image}`
            : null
        }));
        console.log('Mapped categories with imageUrl:', categories);
        setCategories(categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const { selectedDeliveryAddress, savedAddresses } = useDeliveryAddress();

  const fetchNearbyRestaurants = async (address) => {
    setLoadingNearbyRestaurants(true);
    try {
      if (!address || !address.coordinates || !address.coordinates.latitude || !address.coordinates.longitude) {
        setNearbyRestaurants([]);
        setLoadingNearbyRestaurants(false);
        return;
      }
      const params = {
        page: 1,
        limit: 100,
        order: 'asc',
        condition: { coords: [address.coordinates.latitude, address.coordinates.longitude] }
      };
      let res = await restaurantService.getRestaurants(params);
      let restaurants = res.restaurants || [];
      if (restaurants.length > 0) {
        restaurants = restaurants.sort((a, b) => {
          const distA = Number(a.nearestBranch?.distanceInKm) || Infinity;
          const distB = Number(b.nearestBranch?.distanceInKm) || Infinity;
          return distA - distB;
        });
        restaurants = await Promise.all(restaurants.map(async restaurant => {
          let imageUrl = restaurant.coverImageUrl || restaurant.logoUrl || 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
          if (!restaurant.coverImageUrl && restaurant.coverImage) {
            imageUrl = await fileService.downloadFile(restaurant.coverImage);
          }
          return {
            id: restaurant._id,
            name: `${restaurant.nearestBranch?.name}`,
            image: imageUrl,
            rating: restaurant.rating || 4.0,
            reviewCount: restaurant.reviewCount || 0,
            distance: restaurant.nearestBranch?.distanceInKm ? `${restaurant.nearestBranch.distanceInKm} km` : 'Nearby',
            tags: restaurant.cuisineTypes || ['FAST FOOD'],
            verified: restaurant.verified || false,
            nearestBranchId: restaurant.nearestBranch?._id || null,
            nearestBranch: restaurant.nearestBranch || null,
            address: restaurant.nearestBranch?.address || '',
            ...restaurant,
          };
        }));
      }
      setNearbyRestaurants(restaurants);
      console.log('Nearby restaurants from API:', restaurants);
    } catch (error) {
      setNearbyRestaurants([]);
      console.error('Error fetching nearby restaurants:', error);
    }
    setLoadingNearbyRestaurants(false);
  };

  useEffect(() => {
    console.log('HomePage detected address change:', selectedDeliveryAddress);
    fetchNearbyRestaurants(selectedDeliveryAddress);
  }, [selectedDeliveryAddress]);

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity, key: new Date().getTime() });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (showAddressModal) {
      (async () => {
        setAddressLoading(true);
        const selected = await locationService.getSelectedAddress();
        setSelectedAddress(selected);
      // Listen for custom addressChanged event (same tab)
      const handleAddressChanged = async () => {
          setAddressLoading(true);
        const addresses = await locationService.getSavedAddresses();
          // Sort by createdAt descending if available, else reverse
          let sorted = addresses || [];
          if (sorted.length > 0 && sorted[0].createdAt) {
            sorted = [...sorted].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else {
            sorted = [...sorted].reverse();
          }
          setSavedAddresses(sorted);
          setAddressLoading(false);
      };
      window.addEventListener('addressChanged', handleAddressChanged);
        // Initial fetch and sort
        const addresses = await locationService.getSavedAddresses();
        let sorted = addresses || [];
        if (sorted.length > 0 && sorted[0].createdAt) {
          sorted = [...sorted].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
          sorted = [...sorted].reverse();
        }
        setSavedAddresses(sorted);
        setAddressLoading(false);
      return () => window.removeEventListener('addressChanged', handleAddressChanged);
      })();
    }
  }, [showAddressModal]);

  useEffect(() => {
    if (showLocationModal) {
      (async () => {
        const selected = await locationService.getSelectedAddress();
      })();
    }
  }, [showLocationModal]);

  // Helper to extract short address for mapbar
  const getShortAddress = (address) => {
    if (!address) return '';
    // Split by comma and join the first 3-4 parts for a short address
    const parts = address.split(',');
    return parts.slice(0, 4).join(',').trim();
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      const selected = await locationService.getSelectedAddress();
      if (selected && selected.coordinates) {
        setCoordinates(selected.coordinates);
      } else {
        setCoordinates(null);
      }
    };
    fetchCoordinates();
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingFeatured(true);
      try {
        if (!coordinates) {
          setFeaturedRestaurants([]);
          setLoadingFeatured(false);
          return;
        }
        const coords = coordinates;
        if (!coords.latitude || !coords.longitude) {
          setFeaturedRestaurants([]);
          setLoadingFeatured(false);
          return;
        }
        const requestParams = {
          page: 1,
          order: 'desc',
          sort: 'rating',
          condition: { coords: [coords.latitude, coords.longitude] }
        };
        const response = await restaurantService.getRestaurants(requestParams);
        console.log('Response in the mid:', response);
        if (response && response.restaurants) {
          const formattedRestaurants = await Promise.all(response.restaurants.map(async restaurant => {
            let imageUrl = 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
            if (restaurant.image) {
              const downloadedUrl = await fileService.downloadFile(restaurant.image);
              if (downloadedUrl) {
                imageUrl = downloadedUrl;
              }
            }
            const restaurantId = restaurant._id || restaurant.id;
            const safeBranchId = restaurant.nearestBranch?._id || restaurant.nearestBranch?.id || `default-${restaurantId}`;
            const safeBranch = restaurant.nearestBranch || {
              _id: safeBranchId,
              id: safeBranchId,
              name: 'Main Branch',
              address: restaurant.address || 'Main Location',
              restaurantId: restaurantId,
              distance: 0.0,
              isActive: true
            };
            return {
              ...restaurant,
              id: restaurantId,
              _id: restaurantId,
              image: imageUrl,
              nearestBranchId: safeBranchId,
              nearestBranch: safeBranch
            };
          }));
          setFeaturedRestaurants(formattedRestaurants);
          console.log('Featured Restaurants:', formattedRestaurants);
        }
      } catch (error) {
        setFeaturedRestaurants([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchRestaurants();
  }, [coordinates]);

  // Get coordinates from selected delivery address
  const getSearchCoordinates = () => {
    if (selectedDeliveryAddress && selectedDeliveryAddress.coordinates) {
      return selectedDeliveryAddress.coordinates;
    }
    return null;
  };

  // Custom debounce hook for searchValue
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  }

  const debouncedSearchValue = useDebounce(searchValue, 400);

  useEffect(() => {
    if (!debouncedSearchValue.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    (async () => {
      const coords = getSearchCoordinates();
      const results = await searchFoodItems(debouncedSearchValue.trim(), coords);
      setSearchResults(results);
      setSearching(false);
    })();
  }, [debouncedSearchValue]);

  // Add this useEffect at the top of the component, after state declarations
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    };

    // Scroll immediately
    scrollToTop();

    // Also scroll when loading state changes
    if (!loading && !loadingFeatured && !loadingNearbyRestaurants) {
      scrollToTop();
    }
  }, [loading, loadingFeatured, loadingNearbyRestaurants]);

  // Add this after searchResults is updated
  useEffect(() => {
    console.log('Search Results:', searchResults);
  }, [searchResults]);

  const attachObserver = useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (node) {
      observerRef.current = new window.IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loadingMoreNearby && !loadingNearbyRestaurants && visibleNearbyCount < nearbyRestaurants.length) {
            console.log('Sentinel in view!');
            setLoadingMoreNearby(true);
            setTimeout(() => {
              setVisibleNearbyCount(c => Math.min(c + 8, nearbyRestaurants.length));
              setLoadingMoreNearby(false);
            }, 1000);
          }
        },
        { root: null, rootMargin: '0px', threshold: 0.0 }
      );
      console.log('Attaching observer to sentinel', node);
      observerRef.current.observe(node);
    }
  }, [loadingMoreNearby, loadingNearbyRestaurants, visibleNearbyCount, nearbyRestaurants.length]);

  // Add this effect after the definition of visibleNearbyCount and nearbyRestaurants
  useEffect(() => {
    setVisibleNearbyCount(8);
  }, [selectedDeliveryAddress, nearbyRestaurants]);

  console.log('visibleNearbyCount:', visibleNearbyCount, 'nearbyRestaurants.length:', nearbyRestaurants.length);

  const seoTitle = 'Order Food Online Near You | Roll2Bowl';
  const seoDescription = 'Order food online from top restaurants near you. Fast delivery, exclusive offers, and a variety of cuisines—delivered piping hot by Roll2Bowl.';
  const canonicalUrl = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "https://www.roll2bowl.com/";
  const businessStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Roll2Bowl',
    url: canonicalUrl,
    logo: 'https://www.roll2bowl.com/logo.png',
    image: 'https://www.roll2bowl.com/og-image.jpg',
    description: seoDescription,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Your Main Office Address',
      addressLocality: 'Bengaluru',
      addressRegion: 'Karnataka',
      postalCode: '560098',
      addressCountry: 'IN'
    },
    telephone: '+91-XXXXXXXXXX',
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1240'
    },
    sameAs: [
      'https://www.facebook.com/roll2bowl',
      'https://www.instagram.com/roll2bowl',
      'https://twitter.com/roll2bowl'
    ],
    hasMenu: 'https://www.roll2bowl.com/menu',
    aggregateOffer: {
      '@type': 'AggregateOffer',
      lowPrice: '99',
      highPrice: '999',
      priceCurrency: 'INR',
      offerCount: '100+'
    }
  };
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: canonicalUrl
      }
    ]
  };

  if (loading || loadingFeatured || loadingNearbyRestaurants) {
    return (
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background,
        color: theme.colors.primary,
      }}>
        <CircularProgress sx={{ color: theme.colors.primary }} size={64} thickness={4} />
      </Box>
    );
  }
  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph tags */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://www.roll2bowl.com/og-image.jpg" />
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content="https://www.roll2bowl.com/og-image.jpg" />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(businessStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbStructuredData)}</script>
      </Helmet>
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: theme.colors.background,
        color: theme.colors.text,
        boxSizing: 'border-box',
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
      }}>
        {/* Logout Confirmation Modal (Material UI) */}
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
              onClick={async () => { setShowLogoutModal(false); await logout(); }}
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
      
        {/* Delivery Address Modal */}
        <Dialog
          open={showAddressModal}
          onClose={() => { 
            setShowAddressModal(false);
          }}
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
            <IconButton onClick={() => { 
              setShowAddressModal(false);
            }} size="large" sx={{ color: theme.modalCloseIcon.color }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: theme.modal.background }}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.modal.text, textAlign: 'center' }}>Saved Delivery Addresses</Typography>
            {addressLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                <CircularProgress size={32} sx={{ color: theme.colors.primary }} />
              </Box>
            ) : savedAddresses.length === 0 ? (
              <Typography sx={{ color: theme.colors.secondaryText, textAlign: 'center' }}>No saved addresses found.</Typography>
            ) : (
              <List>
                {savedAddresses.map((addr, idx) => {
                  // Compare by coordinates (lat/lng) and address string
                  const isSelected = selectedAddress && addr.coordinates && selectedAddress.coordinates &&
                    addr.coordinates.latitude === selectedAddress.coordinates.latitude &&
                    addr.coordinates.longitude === selectedAddress.coordinates.longitude &&
                    (addr.formattedAddress || addr.address) === (selectedAddress.formattedAddress || selectedAddress.address);
                  return (
                    <ListItem key={idx} sx={{ flexDirection: 'row', alignItems: 'center', mb: 1 }}>
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
        <main style={{
          minHeight: '100vh',
          width: '100%',
          background: theme.colors.background,
          color: theme.colors.text,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `0 ${theme.spacing.sm}px`,
          boxSizing: 'border-box'
        }}>
          <h1 style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>Order Food Online in Bengaluru | Roll2Bowl</h1>
          {/* Crawlable hero paragraph for SEO */}
          <p style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>
            <strong>Order Food Online in Bengaluru</strong>
            <br />
            Discover and order from Bangalore's top restaurants with Roll2Bowl. Enjoy fast delivery, exclusive offers, and a wide variety of cuisines delivered hot to your doorstep.
          </p>
          {/* Header - Material UI */}
          <Box component="header" sx={{ width: '100%', py: `${theme.spacing.md}px`, bgcolor: theme.colors.background, textAlign: 'center' }}>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 20 }}>
              <TextField
                placeholder="Search for restaurants, dishes, or cuisines..."
                variant="outlined"
                fullWidth
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                sx={{
                  maxWidth: 800,
                  mx: 'auto',
                  my: 0,
                  bgcolor: theme.colors.card,
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  '& .MuiOutlinedInput-root': {
                    fontSize: 18,
                    fontWeight: 500,
                    borderRadius: 3,
                    background: theme.colors.card,
                    color: theme.colors.text,
                    '& fieldset': {
                      borderColor: theme.colors.primary,
                      borderWidth: '2px',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.colors.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.colors.primary,
                    },
                  },
                  '& input': {
                    py: 1.2,
                    px: 2,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: theme.colors.primary, fontSize: 28, mr: 2 }} />
                  ),
                }}
              />
              {/* Search Results Dropdown */}
              {(searching || (!searching && filteredSearchResults.length > 0)) && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    maxWidth: 800,
                    mx: 'auto',
                    bgcolor: theme.colors.card,
                    borderRadius: 2,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
                    p: 0,
                    mt: 1,
                    zIndex: 30,
                    maxHeight: 360,
                    overflowY: 'auto',
                    border: `1.5px solid ${theme.colors.border}`,
                  }}
                >
                  {searching ? (
                    <Box sx={{ textAlign: 'center', color: theme.colors.primary, fontWeight: 600, py: 2 }}>Searching...</Box>
                  ) : (
                    filteredSearchResults.map((item, idx) => (
                      <Box
                        key={item._id || idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: idx !== filteredSearchResults.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                          py: 1.5,
                          px: 2,
                          cursor: 'pointer',
                          '&:hover': { background: `${theme.colors.primary}10` }
                        }}
                        onClick={() => {
                          const rawKeyword = item.dishName || item.name || searchValue;
                          const slugKeyword = rawKeyword
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                          navigate(`/search?keyword=${slugKeyword}`);
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{item.dishName}</Typography>
                          <Typography sx={{ color: theme.colors.secondaryText, fontSize: 15 }}>{item.restaurantName || item.branchName}</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: theme.colors.primary, fontSize: 18 }}>₹{!item.price || Number(item.price) === 0 ? 199 : item.price}</Typography>
                      </Box>
                    ))
                  )}
                </Box>
              )}
            </Box>
          </Box>
          <Container
            maxWidth="xl"
            sx={{
              flex: 1,
              width: '100%',
              maxWidth: 1400,
              margin: `${theme.spacing.md}px auto`,
              background: theme.colors.background,
              borderRadius: theme.borderRadius.large,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
              textAlign: 'center',
              color: theme.colors.text,
              boxSizing: 'border-box',
            }}
          >
            {/* Categories Section - Material UI */}
            <Box component="section" sx={{ width: '100%', py: 0, bgcolor: theme.colors.background, textAlign: 'center', borderRadius: theme.borderRadius.large, boxShadow: 'none', mt: 0, mb: 0 }}>
              <h2 style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>Categories</h2>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                <Box sx={{ flex: 1 }} />
                <Typography variant="h5" sx={{ fontSize: theme.typography.fontSize.xl, fontWeight: 700, color: theme.colors.text, textAlign: 'center', flex: 1 }}>Categories</Typography>
                <Button
                  variant="text"
                  sx={{ color: theme.colors.primary, fontWeight: 600, fontSize: 16, textTransform: 'none', flex: 1, display: 'flex', justifyContent: 'flex-end' }}
                  onClick={() => navigate('/categories')}
                >
                  See All
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
                <IconButton
                  onClick={() => scrollCategories('left')}
                  size="small"
                  sx={{
                    minWidth: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: theme.colors.card,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    p: 0,
                    mr: 1,
                    display: { xs: 'flex', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Scroll left"
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <Box
                  ref={categoriesRowRef}
                  sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: 4,
                    pb: 0,
                    mb: 0,
                    mt: 0,
                    flex: 1,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth',
                    justifyContent: 'flex-start',
                    px: 4,
                    pl: 6,
                    '& > *:first-of-type': { ml: 0 },
                    '& > *:last-of-type': { mr: 0 },
                  }}
                >
                  {loading ? (
                    Array.from({ length: 7 }).map((_, idx) => (
                      <Box key={idx} sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: 'transparent', mx: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: 120, height: 120, borderRadius: '50%', boxShadow: '0 4px 24px rgba(0,0,0,0.13)', bgcolor: theme.colors.card }} />
                        <Box sx={{ height: 18 }} />
                      </Box>
                    ))
                  ) : (
                    categories.map(cat => (
                      <Box
                        key={cat._id || cat.name}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          mx: 2,
                          mb: 5,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/categories/${encodeURIComponent(cat.name.toLowerCase())}`, { state: { coordinates, categoryId: cat._id } })}
                      >
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '60px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
                            overflow: 'hidden',
                            bgcolor: theme.colors.card,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'scale(1.07)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                            },
                          }}
                        >
                          {cat.imageUrl ? (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '60px' }}
                              loading="lazy"
                            />
                          ) : (
                            <Box sx={{ width: 120, height: 120, borderRadius: '60px', bgcolor: theme.colors.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography sx={{ color: theme.colors.text, fontSize: 36, fontWeight: 600 }}>🍽️</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 20,
                            color: theme.colors.text,
                            mt: 2,
                            textAlign: 'center',
                            fontWeight: 600,
                            fontFamily: 'Trebuchet MS, Arial, sans-serif',
                            letterSpacing: 0.5,
                            lineHeight: 1.2,
                            textShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          }}
                        >
                          {cat.name}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
                <IconButton
                  onClick={() => scrollCategories('right')}
                  size="small"
                  sx={{
                    minWidth: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: theme.colors.card,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    p: 0,
                    ml: 1,
                    display: { xs: 'flex', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Scroll right"
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            {/* Featured Restaurants Section - Material UI */}
            <Box sx={{ mt: 2, borderRadius: theme.borderRadius.large, boxShadow: 'none', bgcolor: theme.colors.background }}>
              <h2 style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>Featured Restaurants</h2>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                <Box sx={{ flex: 1 }} />
                <Typography variant="h5" sx={{ fontSize: theme.typography.fontSize.xl, fontWeight: 700, color: theme.colors.text, textAlign: 'center', flex: 1 }}>Featured Restaurants</Typography>
                <Button
                  variant="text"
                  sx={{ color: theme.colors.primary, fontWeight: 600, fontSize: 16, textTransform: 'none', flex: 1, display: 'flex', justifyContent: 'flex-end' }}
                  onClick={() => navigate('/restaurants')}
                >
                  See All
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
                <IconButton
                  onClick={() => scrollFeatured('left')}
                  size="small"
                  sx={{
                    minWidth: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: theme.colors.card,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    p: 0,
                    mr: 1,
                    display: { xs: 'flex', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Scroll left"
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <Box
                  ref={featuredRowRef}
                  sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: 4,
                    pb: 0.5,
                    mb: 2,
                    mt: 2,
                    flex: 1,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth',
                    justifyContent: 'flex-start',
                    px: 4,
                    pl: 6,
                    '& > *:first-of-type': { ml: 0 },
                    '& > *:last-of-type': { mr: 0 },
                  }}
                >
                  {loadingFeatured ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <Card key={idx} sx={{ minWidth: 320, maxWidth: 320, borderRadius: theme.borderRadius.medium, p: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', background: theme.colors.card }}>
                        <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 1, borderRadius: 2, bgcolor: theme.colors.card }} />
                        <CardContent sx={{ p: 1 }}>
                          <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: theme.colors.card }} />
                          <Skeleton variant="text" width="40%" height={18} sx={{ bgcolor: theme.colors.card }} />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    featuredRestaurants.map((rest) => (
                      <Card key={rest.id} sx={{
                        background: theme.colors.card,
                        borderRadius: 3,
                        width: 320,
                        minWidth: 320,
                        maxWidth: 320,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        color: theme.colors.text,
                        boxSizing: 'border-box',
                        border: `1.5px solid ${theme.colors.border}`,
                        p: 0,
                        m: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' }
                      }} onClick={() => navigate(`/restaurant/${rest.name.toLowerCase().replace(/\s+/g, '-')}/${rest.nearestBranch?.name?.toLowerCase().replace(/\s+/g, '-') || 'main-branch'}`, { state: { restaurantId: rest.id, branchId: rest.nearestBranchId } })}>
                        {rest.image && (
                          <Box sx={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                            <img src={rest.image} alt={rest.name + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} loading="lazy" />
                          </Box>
                        )}
                        <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.2rem' },
                                color: theme.colors.text,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 260,
                                lineHeight: 1.3,
                                textAlign: 'center',
                                mx: 'auto',
                                mt: 1,
                                mb: 1,
                              }}
                            >
                              {rest.name}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: theme.colors.secondaryText, fontSize: 15, mb: 0.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rest.tags?.join(', ')}</Typography>
                        </Box>
                      </Card>
                    ))
                  )}
                </Box>
                <IconButton
                  onClick={() => scrollFeatured('right')}
                  size="small"
                  sx={{
                    minWidth: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: theme.colors.card,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    p: 0,
                    ml: 1,
                    display: { xs: 'flex', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Scroll right"
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            {/* Nearby Restaurants Section - Material UI */}
            <Box sx={{ mt: 7 }}>
              <h2 style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>Nearby Restaurants</h2>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                <Box sx={{ flex: 1 }} />
                <Typography variant="h5" sx={{ fontSize: theme.typography.fontSize.xl, fontWeight: 700, color: theme.colors.text, textAlign: 'center', flex: 1 }}>Nearby Restaurants</Typography>
                <Button
                  variant="text"
                  sx={{ color: theme.colors.primary, fontWeight: 600, fontSize: 16, textTransform: 'none', flex: 1, display: 'flex', justifyContent: 'flex-end' }}
                  onClick={() => navigate('/nearby-restaurants')}
                >
                  See All
                </Button>
              </Box>
              <Box
                sx={{
                  mt: 4,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 2,
                  justifyItems: 'center',
                  alignItems: 'stretch',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {loadingNearbyRestaurants ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <Card key={idx} sx={{ minWidth: 260, maxWidth: 360, borderRadius: theme.borderRadius.medium, p: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', background: theme.colors.card }}>
                      <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 1, borderRadius: 2, bgcolor: theme.colors.card }} />
                      <CardContent sx={{ p: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: theme.colors.card }} />
                        <Skeleton variant="text" width="40%" height={18} sx={{ bgcolor: theme.colors.card }} />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    {nearbyRestaurants.slice(0, visibleNearbyCount).map((rest) => {
                      const distanceNum = Number(rest.nearestBranch?.distanceInKm);
                      const serviceableDistance = Number(rest.nearestBranch?.serviceableDistance);
                      const notServiceable = !isNaN(distanceNum) && !isNaN(serviceableDistance) && distanceNum > serviceableDistance;
                      return (
                        <Link to={notServiceable ? '#' : `/restaurant/${rest.name.toLowerCase().replace(/\s+/g, '-')}/${rest.nearestBranch?.name?.toLowerCase().replace(/\s+/g, '-') || 'main-branch'}`} style={{ textDecoration: 'none', pointerEvents: notServiceable ? 'none' : 'auto' }} key={rest.id} state={{ restaurantId: rest.id, branchId: rest.nearestBranchId }}>
                          <Card sx={{
                            background: notServiceable ? `${theme.colors.card}80` : theme.colors.card,
                            opacity: notServiceable ? 0.7 : 1,
                            borderRadius: 3,
                            width: 320,
                            minWidth: 320,
                            maxWidth: 320,
                            height: 340,
                            minHeight: 340,
                            maxHeight: 340,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            color: theme.colors.text,
                            boxSizing: 'border-box',
                            border: `1.5px solid ${theme.colors.border}`,
                            p: 0,
                            m: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: notServiceable ? 'not-allowed' : 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            '&:hover': notServiceable ? {} : { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' }
                          }}>
                            {rest.image && (
                              <Box sx={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                                <img src={rest.image} alt={rest.name + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} loading="lazy" />
                              </Box>
                            )}
                            <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.2rem' },
                                    color: theme.colors.text,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 260,
                                    lineHeight: 1.3,
                                    textAlign: 'center',
                                    mx: 'auto',
                                    mt: 1,
                                    mb: 1,
                                  }}
                                >
                                  {rest.nearestBranch?.name || rest.name}
                                </Typography>
                              </Box>
                              <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1 }}>
                                {notServiceable ? 'Not Serviceable' : (rest.distance || rest.nearestBranch?.distanceInKm ? `${rest.nearestBranch?.distanceInKm} km` : '')}
                              </Typography>
                              {rest.address && (
                                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rest.address}</Typography>
                              )}
                              {rest.logoUrl && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                  <img src={rest.logoUrl} alt={rest.name + ' logo'} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: theme.colors.card, border: `1px solid ${theme.colors.border}` }} />
                                </Box>
                              )}
                            </Box>
                          </Card>
                        </Link>
                      );
                    })}
                  </>
                )}
              </Box>
              {visibleNearbyCount < nearbyRestaurants.length && (
                <Box ref={attachObserver} sx={{ width: '100%', height: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                  {loadingMoreNearby && <CircularProgress size={28} sx={{ color: theme.colors.primary }} />}
                </Box>
              )}
            </Box>
          </Container>
          {/* Footer - Material UI */}
          
        </main>
        <Dialog open={showOrdersModal} onClose={() => setShowOrdersModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', bgcolor: theme.colors.card, color: theme.colors.text, minHeight: 0, py: 1 }}>
            <IconButton onClick={() => setShowOrdersModal(false)} size="large" sx={{ color: theme.colors.secondaryText }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: theme.colors.card, minHeight: 400, height: 400, overflowY: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: theme.colors.text, textAlign: 'center' }}>
              My Orders
            </Typography>
            <Suspense fallback={<div style={{ color: theme.colors.text, textAlign: 'center', padding: 32 }}>Loading Orders...</div>}>
              <OrdersPage />
            </Suspense>
          </DialogContent>
        </Dialog>
        <Snackbar
          key={snackbar.key}
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MuiAlert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            elevation={6}
            variant="filled"
            icon={snackbar.severity === 'success' ? <CheckCircleIcon sx={{ fontSize: 28, mr: 1, color: '#fff' }} /> : undefined}
            sx={{
              bgcolor: snackbar.severity === 'success' ? '#219653' : theme.modal.background,
              color: '#fff',
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: 18,
              minWidth: 340,
              px: 3,
              py: 1.5,
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
      </div>
    </>
  );
};

export default HomePage;