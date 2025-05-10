import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { restaurantService } from '../services/restaurantService';
import { cartService } from '../services/cartService';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { fileService } from '../services/fileService';
import { ThemeContext } from '../context/ThemeContext.jsx';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Snackbar from '@mui/material/Snackbar';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { CartContext } from '../context/CartContext.jsx';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import CloseIcon from '@mui/icons-material/Close';
import { useAuthModal } from '../context/AuthModalContext';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import OutlinedInput from '@mui/material/OutlinedInput';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Distance in km, 1 decimal
}

const RestaurantPage = () => {
  const { theme } = useContext(ThemeContext);
  const { restaurantName, branchName } = useParams();
  const location = useLocation();
  const restaurantId = location.state?.restaurantId;
  const branchId = location.state?.branchId;
  const { openCartModal, closeCartModal, isCartOpen, cartItems, addToCart, removeFromCart, restaurantId: cartRestaurantId, branchId: cartBranchId, changeCartItemQuantity } = useContext(CartContext);
  const { isAuthenticated, openLoginModal } = useAuthModal();
  const [restaurant, setRestaurant] = useState(null);
  const [branch, setBranch] = useState(null);
  const [menuRes, setMenuRes] = useState({}); // raw menu object
  const [menu, setMenu] = useState([]); // categories array (for legacy rendering)
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemQuantities, setItemQuantities] = useState({});
  const [branchRestaurantImage, setBranchRestaurantImage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [cartWarning, setCartWarning] = useState('');
  const [recentlyAddedItem, setRecentlyAddedItem] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(null);
  const [cartEmptySnackbarOpen, setCartEmptySnackbarOpen] = useState(false);
  const [cartConflictOpen, setCartConflictOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [cartLocked, setCartLocked] = useState(false);
  const [cartBranch, setCartBranch] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantItem, setVariantItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const categoryFromNavigation = location.state?.categoryName;
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [branchDetails, setBranchDetails] = useState([]);

  // Get user coordinates from localStorage
  let userCoords = null;
  try {
    const addr = JSON.parse(localStorage.getItem('selectedDeliveryAddress'));
    if (addr && addr.coordinates && addr.coordinates.latitude && addr.coordinates.longitude) {
      userCoords = {
        latitude: addr.coordinates.latitude,
        longitude: addr.coordinates.longitude
      };
    }
  } catch (e) {
    userCoords = null;
  }

  const handleQuantityChange = async (itemId, delta) => {
    try {
      const result = await changeCartItemQuantity(itemId, delta, menuRes, restaurantId, branchId);
      if (result && result.conflict) {
        setPendingCartItem(menuRes[itemId]);
        setCartConflictOpen(true);
      }
    } catch (error) {
      console.error('Error changing quantity:', error);
    }
  };

  const handleAddToCartClick = async (item) => {
    if (item.hasVariants && Array.isArray(item.variants) && item.variants.length > 0) {
      setVariantItem(item);
      setShowVariantModal(true);
      return;
    }

    // Check for cart conflict before adding
    if (cartItems.length > 0 && cartRestaurantId !== restaurantId) {
      setPendingCartItem(item);
      setCartConflictOpen(true);
      return;
    }

    // If no conflict, proceed with adding to cart
    setShowAlert(false);
    const result = await addToCart({ ...item, quantity: 1 }, restaurantId, branchId);
    if (result && result.conflict) {
      setPendingCartItem(item);
      setCartConflictOpen(true);
      return;
    }
    setShowAlert(true);
  };

  const calculateCartTotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateDeliveryFee = () =>
    restaurant?.deliveryFee ? parseFloat(restaurant.deliveryFee) : 0;

  const calculateTaxes = (subtotal) =>
    Math.round(subtotal * 0.05); // assuming 5% tax

  const handleAddressSelect = (address) => {
    setSelectedDeliveryAddress(address);
  };

  const handlePlaceOrder = async () => {
    try {
      // Calculate final cart totals
      const cartCalculation = await cartService.calculateCart(
        selectedDeliveryAddress?._id, 
        null // couponCode if you have one
      );

      console.log('Placing final order...', {
        items: cartItems,
        deliveryAddress: selectedDeliveryAddress,
        totals: cartCalculation
      });

      // Clear cart after successful order
      await cartService.clearCart();
      
      // You can add navigation to order confirmation page here
      
    } catch (error) {
      setCartWarning('Failed to place order. Please try again.');
      setTimeout(() => setCartWarning(''), 3000);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch restaurant details using restaurantId from state
        if (!restaurantId) {
          setError('Restaurant not found');
          setLoading(false);
          return;
        }

        const restRes = await restaurantService.getRestaurantById(restaurantId);
        console.log('restRes', restRes);
        const restaurantData = restRes?.restaurant || restRes || null;
        setRestaurant(restaurantData);
        
        // Set initial selected outlet to branch from state
        if (branchId) {
          setSelectedOutlet(branchId);
        } else if (restaurantData?.nearestBranchId) {
          setSelectedOutlet(restaurantData.nearestBranchId);
        }

        // Fetch branch details if restaurant has multiple branches
        if (restaurantData?.branches?.length > 1) {
          try {
            const branchPromises = restaurantData.branches.map(branchId => {
              // Ensure branchId is a string
              const id = typeof branchId === 'object' ? branchId._id : branchId;
              return restaurantService.getBranchById(id);
            });
            const branches = await Promise.all(branchPromises);
            setBranchDetails(branches);
          } catch (error) {
            console.error('Error fetching branch details:', error);
          }
        }

        // Fetch current branch details
        const branchRes = await restaurantService.getBranchById(branchId || restaurantData?.nearestBranchId);
        console.log('branchRes', branchRes);
        setBranch(branchRes || null);

        // Fetch menu for the branch
        const menuResRaw = await restaurantService.getFoodItems(branchId || restaurantData?.nearestBranchId);
        console.log('menuRes', menuResRaw);
        // If menuResRaw is an object with category keys, use it
        if (menuResRaw && typeof menuResRaw === 'object' && !Array.isArray(menuResRaw)) {
          setMenuRes(menuResRaw);
          // Set the selected category based on navigation state
          if (categoryFromNavigation && menuResRaw[categoryFromNavigation]) {
            setSelectedCategory(categoryFromNavigation);
          } else {
            setSelectedCategory('All');
          }
        } else {
          setMenuRes({});
          setSelectedCategory('All');
        }
        // For legacy rendering
        setMenu(menuResRaw?.categories || []);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to load restaurant, branch, or menu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId, branchId, categoryFromNavigation]);

  useEffect(() => {
    const fetchImage = async () => {
      if (branch && branch.restaurant && branch.restaurant.image) {
        // If it's already a URL, use it; otherwise, resolve
        if (branch.restaurant.image.startsWith('http')) {
          setBranchRestaurantImage(branch.restaurant.image);
    } else {
          const url = await fileService.downloadFile(branch.restaurant.image);
          setBranchRestaurantImage(url);
        }
    } else {
        setBranchRestaurantImage(null);
      }
    };
    fetchImage();
  }, [branch]);

  useEffect(() => {
    console.log('Current cart:', cartItems);
  }, [cartItems]);

  useEffect(() => {
    const fetchCartBranch = async () => {
      if (cartItems.length > 0 && cartService) {
        const cart = await cartService.getCurrentCart();
        if (cart.branchId) {
          const branchRes = await restaurantService.getBranchById(cart.branchId);
          setCartBranch(branchRes || null);
        }
      } else {
        setCartBranch(null);
      }
    };
    fetchCartBranch();
  }, [cartItems]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (restaurant?.branches && restaurant.branches.length > 1) {
        try {
          const branchPromises = restaurant.branches.map(branchId => 
            restaurantService.getBranchById(branchId)
          );
          const branches = await Promise.all(branchPromises);
          setBranchDetails(branches);
          // Set initial selected outlet to nearest branch
          setSelectedOutlet(restaurant.nearestBranchId);
        } catch (error) {
          console.error('Error fetching branch details:', error);
        }
      }
    };
    fetchBranchDetails();
  }, [restaurant]);

  const handleOutletChange = async (event) => {
    const newBranchId = event.target.value;
    setSelectedOutlet(newBranchId);
    setLoading(true); // Show loading state while changing outlet

    try {
      // Fetch new branch details
      const branchRes = await restaurantService.getBranchById(newBranchId);
      setBranch(branchRes);

      // Fetch new menu for the selected branch
      const menuResRaw = await restaurantService.getFoodItems(newBranchId);
      if (menuResRaw && typeof menuResRaw === 'object' && !Array.isArray(menuResRaw)) {
        setMenuRes(menuResRaw);
        setMenu(menuResRaw?.categories || []);
        setSelectedCategory('All');
      }

      // Update cart if needed
      if (cartItems.length > 0) {
        setCartConflictOpen(true);
        setPendingCartItem(null);
      }

      // Show success message
      setSnackbar({
        open: true,
        message: 'Outlet changed successfully',
        severity: 'success'
      });

      // Scroll to top of menu
      window.scrollTo(0, 0);

    } catch (error) {
      console.error('Error updating branch details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to switch outlet. Please try again.',
        severity: 'error'
      });
      // Revert to previous outlet if there's an error
      setSelectedOutlet(branchId || restaurant?.nearestBranchId);
    } finally {
      setLoading(false);
    }
  };

  // Update the cart conflict modal to handle outlet changes
  const handleCartConflict = async (clearCart) => {
    if (clearCart) {
      try {
        await cartService.clearCart();
        setCartLocked(false);
        setPendingCartItem(null);
        setSnackbar({
          open: true,
          message: 'Cart cleared. You can now add items from the new outlet.',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error clearing cart:', error);
        setSnackbar({
          open: true,
          message: 'Failed to clear cart. Please try again.',
          severity: 'error'
        });
      }
    }
    setCartConflictOpen(false);
  };

  const calculateDistance = (branchLocation) => {
    if (!userCoords || !branchLocation || !branchLocation.coordinates) return null;
    const [branchLng, branchLat] = branchLocation.coordinates;
    return getDistanceFromLatLonInKm(
      userCoords.latitude,
      userCoords.longitude,
      branchLat,
      branchLng
    );
  };

  if (loading) return (
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
  if (error) return <Typography color="error">{error}</Typography>;
console.log('branch',branch);

  // Get category names from menuRes
  const categoryNames = ['All', ...Object.keys(menuRes)];
  const itemsForSelectedCategory = selectedCategory === 'All' 
    ? Object.values(menuRes).flat() 
    : (selectedCategory && menuRes[selectedCategory] ? menuRes[selectedCategory] : []);

  const sortedItems = [...itemsForSelectedCategory].sort((a, b) => {
    // Helper to check if item is serviceable
    const isServiceable = (item) => {
      if (!branch || !branch.location || !branch.serviceableDistance) return true;
      const distance = calculateDistance(branch.location);
      return !(distance && parseFloat(distance) > parseFloat(branch.serviceableDistance));
    };
    // First: available and serviceable
    const aAvailable = a.isAvailable === true && isServiceable(a);
    const bAvailable = b.isAvailable === true && isServiceable(b);
    if (aAvailable === bAvailable) return 0;
    return aAvailable ? -1 : 1;
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        bgcolor: theme.colors.background,
        color: theme.colors.text,
        transition: 'background 0.3s, color 0.3s',
        fontFamily: 'Poppins, Arial, sans-serif',
        py: 2,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1500, mx: 'auto', my: 2 }}>
        {/* Restaurant Details Card */}
        <Card sx={{ width: 1400, mx: 'auto', p: 2, boxShadow: 1, background: theme.colors.card, color: theme.colors.text }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
              {/* Left: Details */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold, fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.7rem', lg: '2rem' } }}>
                    {branch ? `${branch.name} (${calculateDistance(branch.location)} km)` : 'Branch'}
                </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1, color: theme.colors.secondaryText }}>
                  {branch ? branch.address : 'No address available'}
                </Typography>
                {branch && branch.city && (
                  <Typography variant="body2" sx={{ mb: 1, color: theme.colors.secondaryText }}>
                    {branch.city}
                  </Typography>
                )}
                {/* Tags */}
                {Array.isArray(restaurant?.tags) && restaurant.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {restaurant.tags.map((tag, idx) => (
                      <Box key={idx} sx={{ bgcolor: theme.colors.inputBackground, borderRadius: theme.borderRadius.small, px: 1.5, py: 0.5, mr: 1, mb: 1 }}>
                        <Typography variant="caption" sx={{ color: theme.colors.secondaryText }}>{tag}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {/* Delivery Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.colors.secondaryText }}>
                    :motor_scooter: {restaurant?.deliveryFee ? `₹${restaurant.deliveryFee}` : 'Free Delivery'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.colors.secondaryText }}>
                    :stopwatch: {restaurant?.deliveryTime || '30-45 mins'}
                  </Typography>
                </Box>
                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.colors.secondaryText }}>:star:</Typography>
                  <Typography variant="body2" sx={{ color: theme.colors.secondaryText }}>
                    {restaurant?.rating || 4.0} ({restaurant?.reviewCount || 0}+)
                  </Typography>
                </Box>
                {Array.isArray(restaurant?.branches) && restaurant.branches.length > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, width: '100%' }}>
                    <FormControl
                      size="small"
                      variant="outlined"
                      sx={{
                        minWidth: 220,
                        background: theme.colors.inputBackground,
                      }}
                    >
                      <Select
                        value={selectedOutlet || ''}
                        onChange={handleOutletChange}
                        displayEmpty
                        input={<OutlinedInput notched label="" />}
                        sx={{
                          bgcolor: 'transparent',
                          color: theme.colors.text,
                          height: 40,
                          boxShadow: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1.5px solid #FF5A33',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: '1.5px solid #FF5A33',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: '1.5px solid #FF5A33',
                          },
                          '& .MuiSelect-icon': {
                            color: theme.colors.primary,
                          },
                          '& .MuiSelect-select': {
                            fontFamily: theme.typography.fontFamily.medium,
                            fontSize: '0.95rem',
                            padding: '8px 14px',
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: theme.colors.card,
                              color: theme.colors.text,
                              mt: 1,
                              boxShadow: theme.modal.boxShadow,
                              '& .MuiMenuItem-root': {
                                fontFamily: theme.typography.fontFamily.regular,
                                fontSize: '0.95rem',
                                padding: '10px 16px',
                                '&:hover': {
                                  bgcolor: `${theme.colors.primary}10`,
                                },
                                '&.Mui-selected': {
                                  bgcolor: `${theme.colors.primary}20`,
                                  '&:hover': {
                                    bgcolor: `${theme.colors.primary}30`,
                                  },
                                },
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Select an Outlet</em>
                        </MenuItem>
                        {branchDetails.map((branch) => {
                          const distance = calculateDistance(branch.location);
                          const isNonServiceable =
                            distance && branch.serviceableDistance && parseFloat(distance) > parseFloat(branch.serviceableDistance);

                          return (
                            <MenuItem
                              key={branch._id}
                              value={branch._id}
                              disabled={isNonServiceable}
                              sx={{
                                opacity: isNonServiceable ? 0.5 : 1,
                                pointerEvents: isNonServiceable ? 'none' : 'auto',
                                color: isNonServiceable ? theme.colors.secondaryText : theme.colors.text,
                                '&:hover': {
                                  bgcolor: isNonServiceable ? 'transparent' : `${theme.colors.primary}10`,
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Typography sx={{ 
                                  fontFamily: theme.typography.fontFamily.medium,
                                  fontSize: '0.95rem',
                                }}>
                                  {branch.name}
                                </Typography>
                                <Typography sx={{ 
                                  color: isNonServiceable ? theme.colors.error : theme.colors.secondaryText,
                                  fontSize: '0.85rem',
                                  ml: 2,
                                  fontFamily: theme.typography.fontFamily.regular,
                                }}>
                                  {distance ? `${distance} km` : ''}
                                  {isNonServiceable && ' (Not Serviceable)'}
                                </Typography>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
              {/* Right: Restaurant Image from branch.restaurant.image */}
              {branchRestaurantImage && (
                <CardMedia
                  component="img"
                  image={branchRestaurantImage}
                  alt={branch.restaurant?.name || 'Restaurant'}
                  sx={{ width: 320, height: 220, objectFit: 'cover', ml: 2 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Food Menu Card */}
        <Card sx={{ width: 1400, mx: 'auto', p: 2, boxShadow: 'none', background: theme.colors.background, color: theme.colors.text }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, textAlign: 'center', color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }}>Menu</Typography>

            {/* Dynamic Category Tabs from menuRes */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Tabs
                value={categoryNames.indexOf(selectedCategory)}
                onChange={(_, newValue) => setSelectedCategory(categoryNames[newValue])}
                aria-label="food category tabs"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mx: 'auto' }}
              >
                {categoryNames.map((cat, idx) => (
                  <Tab 
                    key={cat} 
                    label={cat} 
                    sx={{ 
                      px: 4, 
                      color: theme.colors.text, 
                      fontFamily: theme.typography.fontFamily.medium,
                      '&.Mui-selected': {
                        color: theme.colors.primary,
                        fontWeight: 600
                      }
                    }} 
                  />
                ))}
              </Tabs>
            </Box>

            {/* Dynamic Menu Grid for selected category */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 2,
              mb: 2
            }}>
              {sortedItems.slice(0, 9).map((item, idx) => {
                console.log('Food item:', item);
                // If item has variants, set price to first variant's price
                let displayItem = { ...item };
                if (displayItem.hasVariants && Array.isArray(displayItem.variants) && displayItem.variants.length > 0) {
                  displayItem.price = displayItem.variants[0].price;
                }
                // Find quantity in cart
                const cartItem = cartItems.find(ci => ci._id === displayItem._id);
                const quantity = cartItem ? cartItem.quantity : 0;
                // Check if branch is non-serviceable
                let isNonServiceable = false;
                if (branch && branch.location && branch.serviceableDistance) {
                  const distance = calculateDistance(branch.location);
                  if (distance && parseFloat(distance) > parseFloat(branch.serviceableDistance)) {
                    isNonServiceable = true;
                  }
                }
                return (
                  <Card
                    key={displayItem._id || idx}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'stretch',
                      boxShadow: 2,
                      background: !displayItem.isAvailable ? `${theme.colors.card}80` : theme.colors.card,
                      color: theme.colors.text,
                      minWidth: 420,
                      mb: 1,
                      opacity: !displayItem.isAvailable ? 0.7 : 1,
                      pointerEvents: !displayItem.isAvailable ? 'none' : 'auto',
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={displayItem.image || 'https://via.placeholder.com/120'}
                      alt={displayItem.name}
                      sx={{ 
                        width: 135,
                        height: 135,
                        objectFit: 'cover', 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2, 
                        mr: 2, 
                        alignSelf: 'center' 
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <CardContent sx={{ p: 0, pb: 1, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: 16,
                              color: theme.colors.text,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 180,
                              lineHeight: 1,
                            }}
                            noWrap
                          >
                            {displayItem.name}
                          </Typography>
                          {/* Veg/Non-Veg Icon at end of title */}
                          {displayItem.dishType && (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                border: '2px solid',
                                borderColor: displayItem.dishType === 'veg' ? '#43a047' : '#e53935',
                                borderRadius: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fff',
                                boxSizing: 'border-box',
                                ml: 1
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: displayItem.dishType === 'veg' ? '#43a047' : '#e53935',
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                        <Typography
                          sx={{
                            color: theme.colors.secondaryText,
                            fontSize: 14,
                            mb: 1,
                            whiteSpace: 'normal',
                            overflow: 'visible',
                            textOverflow: 'unset',
                          }}
                        >
                          {displayItem.description || 'No description.'}
                        </Typography>
                        <Typography sx={{ color: theme.colors.primary, fontWeight: 600, fontSize: 15, mb: 0.5, mt: 1 }}>₹{displayItem.price}</Typography>
                      </CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, mt: 0 }}>
                        {quantity > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <IconButton 
                              size="small" 
                              sx={{ color: theme.colors.primary }} 
                              onClick={() => handleQuantityChange(displayItem._id, -1)}
                              disabled={isNonServiceable}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600, color: theme.colors.text }}>
                              {quantity}
                            </Typography>
                            <IconButton 
                              size="small" 
                              sx={{ color: theme.colors.primary }} 
                              onClick={() => handleQuantityChange(displayItem._id, 1)}
                              disabled={isNonServiceable}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <button
                            style={{
                              background: isNonServiceable ? theme.colors.secondaryText : (!displayItem.isAvailable ? theme.colors.secondaryText : theme.colors.primary),
                              color: theme.colors.buttonText,
                              border: 'none',
                              borderRadius: theme.borderRadius.small,
                              padding: '6px 18px',
                              fontWeight: 600,
                              cursor: isNonServiceable || !displayItem.isAvailable ? 'not-allowed' : 'pointer',
                              marginTop: 0,
                              opacity: isNonServiceable ? 0.7 : 1
                            }}
                            onClick={() => {
                              if (!isNonServiceable && displayItem.isAvailable) handleAddToCartClick(displayItem);
                            }}
                            disabled={isNonServiceable || !displayItem.isAvailable}
                          >
                            {isNonServiceable ? 'Not Serviceable' : (displayItem.isAvailable ? 'Add to Cart' : 'Out Of Stock')}
                          </button>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>
            {cartWarning && (
              <Box sx={{
                position: 'fixed',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: theme.colors.card,
                color: theme.colors.error,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: 4,
                zIndex: 2001
              }}>
                <Typography>{cartWarning}</Typography>
              </Box>
            )}
            <Modal open={cartConflictOpen} onClose={() => setCartConflictOpen(false)}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 350,
                  bgcolor: theme.modal.background,
                  color: theme.modal.text,
                  borderRadius: theme.modal.borderRadius,
                  boxShadow: theme.modal.boxShadow,
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography id="cart-conflict-title" variant="h6" sx={{ mb: 2, textAlign: 'center', color: theme.modal.text }}>
                  You have items in your cart from another outlet.
                </Typography>
                <Typography id="cart-conflict-description" sx={{ mb: 3, textAlign: 'center', color: theme.modal.text }}>
                  Would you like to clear your cart and add items from this outlet?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: theme.modalButton.primary, color: theme.modalButton.primaryText, borderRadius: theme.modalButton.borderRadius, fontWeight: 600 }}
                    onClick={() => handleCartConflict(true)}
                  >
                    Clear Cart & Continue
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ color: theme.modalButton.secondaryText, borderColor: theme.modalButton.border, borderRadius: theme.modalButton.borderRadius, fontWeight: 600 }}
                    onClick={() => handleCartConflict(false)}
                  >
                    Keep Current Cart
                  </Button>
                </Box>
              </Box>
            </Modal>
            {cartItems.length > 0 && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 32,
                  right: 32,
                  zIndex: 3000,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: theme.colors.primary,
                  color: theme.colors.buttonText,
                  borderRadius: '50%',
                  width: 64,
                  height: 64,
                  boxShadow: 6,
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  '&:hover': {
                    bgcolor: theme.colors.primaryDark || theme.colors.primary,
                  },
                }}
                onClick={() => setShowAlert(true)}
              >
                <ShoppingCartIcon sx={{ fontSize: 36 }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: theme.colors.error,
                    color: '#fff',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: 2,
                  }}
                >
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
        <Snackbar
          open={cartEmptySnackbarOpen}
          autoHideDuration={3000}
          onClose={() => setCartEmptySnackbarOpen(false)}
          message={null}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Box
            sx={{
              bgcolor: theme.modal.background,
              color: theme.modal.text,
              boxShadow: theme.modal.boxShadow,
              border: `2px solid ${theme.colors.primary}`,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: 18,
              fontWeight: 600,
              minWidth: 320,
              px: 3,
              py: 2,
              textAlign: 'center',
            }}
          >
            Your cart is empty.
          </Box>
        </Snackbar>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              bgcolor: theme.colors.card,
              color: theme.colors.text,
              '& .MuiAlert-icon': {
                color: snackbar.severity === 'success' ? theme.colors.success : theme.colors.error
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Dialog 
          open={showVariantModal} 
          onClose={() => setShowVariantModal(false)}
          PaperProps={{
            sx: {
              bgcolor: theme.modal.background,
              color: theme.modal.text,
              borderRadius: theme.modal.borderRadius,
              boxShadow: theme.modal.boxShadow,
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: theme.modal.background,
            color: theme.modal.text,
            borderBottom: `1px solid ${theme.colors.border}`
          }}>
            Select a Variant
            <IconButton onClick={() => setShowVariantModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: theme.modal.background, pt: 2 }}>
            {variantItem && variantItem.variants.map((variant) => (
              <Box 
                key={variant._id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid ${selectedVariant?._id === variant._id ? theme.colors.primary : theme.colors.border}`,
                  bgcolor: selectedVariant?._id === variant._id ? `${theme.colors.primary}10` : 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: theme.colors.primary,
                    bgcolor: `${theme.colors.primary}10`
                  }
                }}
                onClick={() => setSelectedVariant(variant)}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600, color: theme.modal.text }}>{variant.label}</Typography>
                  <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14 }}>₹{variant.price}</Typography>
                </Box>
                <Radio
                  checked={selectedVariant?._id === variant._id}
                  onChange={() => setSelectedVariant(variant)}
                  sx={{ color: theme.colors.primary }}
                />
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ 
            bgcolor: theme.modal.background,
            borderTop: `1px solid ${theme.colors.border}`,
            p: 2
          }}>
            <Button 
              onClick={() => setShowVariantModal(false)}
              sx={{ 
                color: theme.colors.secondaryText,
                '&:hover': { bgcolor: `${theme.colors.secondaryText}10` }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!selectedVariant) {
                  // Show error or alert that variant must be selected
                  return;
                }
                const newItem = {
                  ...variantItem,
                  price: selectedVariant.price,
                  variant: selectedVariant,
                  quantity: 1,
                  restaurantId,
                  branchId: branchId || restaurant?.nearestBranchId,
                };
                try {
                  const result = await addToCart(newItem, restaurantId, branchId || restaurant?.nearestBranchId);
                  if (result && result.conflict) {
                    setPendingCartItem(newItem);
                    setCartConflictOpen(true);
                  } else {
                    setRecentlyAddedItem(newItem);
                    setShowAlert(true);
                  }
                  setShowVariantModal(false);
                  setSelectedVariant(null);
                } catch (error) {
                  setCartWarning(error.message || 'Failed to add item to cart');
                  setTimeout(() => setCartWarning(''), 3000);
                }
                setShowVariantModal(false);
              }}
              sx={{ 
                bgcolor: theme.colors.primary,
                color: theme.colors.buttonText,
                '&:hover': { bgcolor: theme.colors.primaryDark || theme.colors.primary }
              }}
            >
              Add to Cart
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default RestaurantPage;
