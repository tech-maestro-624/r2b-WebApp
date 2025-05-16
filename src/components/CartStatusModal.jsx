import React, { useContext, useState, useEffect, useReducer } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Radio from '@mui/material/Radio';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { cartService } from '../services/cartService.js';
import { authService } from '../services/authService.js';
import { apiService } from '../services/apiServices.js';
import {orderService} from '../services/orderService.js'
import { useAuthModal } from '../context/AuthModalContext';
import { paymentService } from '../services/paymentService';
import { loadRazorpayScript } from '../utils/razorpay';
import { CartContext } from '../context/CartContext.jsx';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useLocation, useNavigate } from 'react-router-dom';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GoogleIcon from '@mui/icons-material/Google';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useCoupon } from '../context/CouponContext';
import CircularProgress from '@mui/material/CircularProgress';

function getSavedAddresses() {
  return JSON.parse(localStorage.getItem('savedAddresses') || '[]');
}
function getSelectedAddress() {
  return JSON.parse(localStorage.getItem('selectedDeliveryAddress') || 'null');
}
function setSelectedAddress(address) {
  localStorage.setItem('selectedDeliveryAddress', JSON.stringify(address));
}

function extractAddressFields(address) {
  // Example address: "1, Ravi Hill View Layout, Ittamadu, Dattatreya Nagar, Hosakerehalli, Bengaluru, Karnataka 560085, India"
  let pincode = '';
  let state = '';
  let city = '';

  // Extract pincode (6 digit number at the end)
  const pincodeMatch = address.match(/\b\d{6}\b/);
  if (pincodeMatch) pincode = pincodeMatch[0];

  // Extract state and city by splitting
  // We'll assume the format: "... city, state pincode, country"
  const parts = address.split(',');
  if (parts.length >= 3) {
    // Trim whitespace
    const trimmedParts = parts.map(p => p.trim());
    // State and pincode are usually in the second last part
    const statePincodePart = trimmedParts[trimmedParts.length - 2];
    // City is usually the third last part
    city = trimmedParts[trimmedParts.length - 3] || '';
    // State is the first word in statePincodePart (before pincode)
    const stateMatch = statePincodePart.match(/[A-Za-z ]+/);
    if (stateMatch) state = stateMatch[0].trim();
  }

  return { pincode, state, city };
}

const openRazorpayCheckout = async ({
  razorpayOrderId,
  amount,
  onSuccess,
  onFailure,
  user,
}) => {
  await loadRazorpayScript();

  const options = {
    key: 'rzp_test_LKwcKdhRp0mq9f', // Use your key
    currency: 'INR',
    name: 'Roll2Bowl Technologies Pvt Ltd',
    description: 'Order Payment',
    order_id: razorpayOrderId,
    amount: amount, // in paise
    prefill: {
      email: user?.email || 'test@example.com',
      contact: user?.phone || '9999999999',
      name: user?.name || 'Customer',
    },
    handler: async (response) => {
      try {
        console.log('Verifying payment with:', {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        // Call your backend to verify payment
        const verification = await paymentService.verifyPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (verification) {
          onSuccess && onSuccess(response);
        } else {
          throw new Error('Payment not successful');
        }
      } catch (err) {
        onFailure && onFailure(err);
      }
    },
    modal: {
      ondismiss: () => {
        onFailure && onFailure(new Error('Payment cancelled by user'));
      },
    },
    theme: { color: '#FF5A33' },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

const CartStatusModal = ({ open, onClose, cartItems = [], handleQuantityChange, removeFromCart }) => {
  const { theme } = useContext(ThemeContext);
  const { branchId, handleCloseSnackbar, clearCart } = useContext(CartContext);
  const { isAuthenticated } = useAuthModal();
  const [cartBranch, setCartBranch] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(getSelectedAddress());
  const [savedAddresses, setSavedAddresses] = useState(getSavedAddresses());
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const { openLoginModal } = useAuthModal();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState('');
  const [step, setStep] = useState(0); // 0 = Cart Status, 1 = Cart Summary
  const [cartConflictOpen, setCartConflictOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [cartCalculation, setCartCalculation] = useState({
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    isFreeShipping: false,
    taxBreakdown: [],
    deliveryBreakdown: []
  });
  const [calculatingCart, setCalculatingCart] = useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const { appliedCoupon, applyCoupon, removeCoupon } = useCoupon();
  const [applyCouponLoading, setApplyCouponLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSavedAddresses(getSavedAddresses());
      setSelectedDeliveryAddress(getSelectedAddress());
    }
  }, [open]);

  useEffect(() => {
    console.log('Cart updated:', cartItems);
  }, [cartItems]);

  // Add useEffect to fetch branch details
  useEffect(() => {
    const fetchCartBranch = async () => {
      if (cartItems.length > 0 && branchId) {
        const { restaurantService } = await import('../services/restaurantService');
        const branchRes = await restaurantService.getBranchById(branchId);
        setCartBranch(branchRes || null);
      } else {
        setCartBranch(null);
      }
    };
    fetchCartBranch();
  }, [cartItems, branchId]);

  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  // Advanced cart calculation effect
  useEffect(() => {
    const calculateCartTotals = async () => {
      if (!cartItems.length || !selectedDeliveryAddress || !selectedDeliveryAddress.coordinates) {
        setCartCalculation({
          subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, total: 0, isFreeShipping: false, taxBreakdown: [], deliveryBreakdown: []
        });
        return;
      }
      setCalculatingCart(true);
      try {
        const addressId = selectedDeliveryAddress || selectedDeliveryAddress.id || 'estimate';
        console.log('addressId:', addressId);
        const calculation = await cartService.calculateCart(addressId, appliedCoupon?.code || null);
        console.log('calculation:', calculation);
        // Build breakdowns
        const taxBreakdown = [
          { label: 'Item Tax', value: calculation.totalTax || calculation.tax || 0 },
          { label: 'Platform Fee', value: calculation.platformFee || 0 },
          { label: 'Platform Fee Tax', value: calculation.platformFeeTax || 0 },
          { label: 'Packaging Charges', value: calculation.packagingCharges || 0 },
          { label: 'Packaging Tax', value: calculation.packagingChargesTax || 0 }
        ].filter(item => item.value > 0);
        const deliveryBreakdown = [
          { label: 'Delivery Charge', value: calculation.deliveryCharge || calculation.deliveryFee || 0 },
          { label: 'Delivery Tax', value: calculation.deliveryTax || 0 },
          { label: 'Delivery Tip', value: calculation.deliveryTip || 0 }
        ].filter(item => item.value > 0);
        setCartCalculation({
          subtotal: Number(calculation.subTotal || calculation.subtotal) || 0,
          tax: taxBreakdown.reduce((sum, item) => sum + item.value, 0),
          deliveryFee: deliveryBreakdown.reduce((sum, item) => sum + item.value, 0),
          discount: Number(calculation.discount) || 0,
          total: Number(calculation.grandTotal || calculation.total) || 0,
          isFreeShipping: calculation.isFreeShipping || false,
          taxBreakdown,
          deliveryBreakdown
        });
      } catch (error) {
        // Fallback to client-side calculation
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.1;
        const deliveryFee = subtotal > 0 ? 1.33 : 0;
        setCartCalculation({
          subtotal,
          tax,
          deliveryFee,
          discount: 0,
          total: subtotal + tax + deliveryFee,
          isFreeShipping: false,
          taxBreakdown: [{ label: 'Tax (10%)', value: tax }],
          deliveryBreakdown: [{ label: 'Delivery Fee', value: deliveryFee }]
        });
      } finally {
        setCalculatingCart(false);
      }
    };
    calculateCartTotals();
  }, [cartItems, selectedDeliveryAddress, appliedCoupon, open]);

  const handleAddressSelect = (address) => {
    setSelectedDeliveryAddress(address);
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const handlePlaceOrder = async () => {
    setIsPaying(true);
    setPaymentError('');
    try {
      console.log('Selected delivery address:', selectedDeliveryAddress);

      // Validate address and coordinates
      if (
        !selectedDeliveryAddress ||
        !selectedDeliveryAddress.address ||
        !selectedDeliveryAddress.coordinates ||
        selectedDeliveryAddress.coordinates.latitude == null ||
        selectedDeliveryAddress.coordinates.longitude == null
      ) {
        window.alert('Please select a valid delivery address');
        setIsPaying(false);
        return;
      }

      // 1. Check for authentication
      if (!isAuthenticated) {
        openLoginModal();
        setIsPaying(false);
        return;
      }
console.log('isAuthenticated',isAuthenticated);
console.log('cartBranch',cartBranch);
      // 2. Check for cart conflicts
      if (cartItems.length > 0 && cartBranch?._id !== branchId) {
        console.log('isConflict ??');
        setCartConflictOpen(true);
        setIsPaying(false);
        return;
      }
     console.log('isConflict passed');
      // If authenticated, ensure token is stored
      const token = localStorage.getItem('authToken');
      if (!token && window?.authToken) {
        localStorage.setItem('authToken', window.authToken);
      }
console.log('token',token);
      // 2. Validate token by making a test request
      try {
        await apiService.get?.('/auth/me');
      } catch (authError) {
        localStorage.removeItem('authToken');
        localStorage.setItem('pendingPaymentAddressId', JSON.stringify(selectedDeliveryAddress));
        openLoginModal();
        setIsPaying(false);
        return;
      }

      // Extract fields from address
      const { pincode, state, city } = extractAddressFields(selectedDeliveryAddress.address);

      // Build the deliveryAddress object for the payload
      const deliveryAddress = {
        address: selectedDeliveryAddress.address,
        pincode,
        coordinates: {
          latitude: selectedDeliveryAddress.coordinates.latitude,
          longitude: selectedDeliveryAddress.coordinates.longitude
        },
        city,
        state,
        landmark: selectedDeliveryAddress.landmark || ''
      };

      // Fetch the latest cart from cartService
      const latestCart = await cartService.getCart();
      if (!latestCart || !latestCart.items || latestCart.items.length === 0) {
        setIsPaying(false);
        setPaymentError('Your cart is empty. Please add items before placing an order.');
        return;
      }

      // Build the items array for the payload from the latest cart
      const items = latestCart.items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        variant: item.variant || null,
        addOns: item.addOns || [],
        options: item.options || []
      }));

      // Build the full order payload
      const orderData = {
        items,
        branch: branchId,
        orderType: 'Delivery',
        paymentMethod: 'Online',
        couponId: appliedCoupon?.code || '',
        deliveryTip: 0,
        deliveryAddress
      };

      console.log('Placing order with payload:', orderData);

      // 1. Place order (get order and payment details)
      const orderResponse = await orderService.placeOrder(orderData);
      console.log('orderResponse:', orderResponse);

      let orderId;
      if (typeof orderResponse.order === 'string') {
        orderId = orderResponse.order;
      } else if (orderResponse.order && orderResponse.order._id) {
        orderId = orderResponse.order._id;
      } else {
        throw new Error('Order creation failed');
      }

      // 2. Initiate payment (get Razorpay order details from backend)
      const paymentDetails = await paymentService.initiatePayment(orderId);
      console.log('paymentDetails:', paymentDetails);

      setStep(2);
      // Return details for payment
      return { orderId, paymentDetails, orderResponse };
    } catch (error) {
      console.error('Order placement error:', error, error.response?.data);
      setIsPaying(false);
      setPaymentError(error.message || 'Failed to place your order. Please try again.');
      throw error;
    }
  };

  const handleUpdateCartQuantity = async (itemId, delta, currentQuantity) => {
    try {
      if (currentQuantity + delta <= 0) {
        await removeFromCart(itemId);
      } else {
        await handleQuantityChange(itemId, delta);
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    await handleQuantityChange(itemId, -1);
    // Fetch the latest cart after removal
    const latestCart = await cartService.getCart();
    console.log('Latest cart after removal:', latestCart);
    if (!latestCart || !latestCart.items || latestCart.items.length === 0) {
      onClose();
    }
  };

  // Helper to determine if on restaurant page
  const isOnRestaurantPage = location.pathname.startsWith('/restaurant/');

  // Helper to calculate distance (same as RestaurantPage)
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c);
  }

  // In the cart summary section, filter out unwanted tax/delivery breakdowns
  // For taxBreakdown:
  const filteredTaxBreakdown = cartCalculation.taxBreakdown.filter(item =>
    !['Platform Fee Tax', 'Packaging Tax', 'Delivery Tax'].includes(item.label)
  );
  // For deliveryBreakdown:
  const filteredDeliveryBreakdown = cartCalculation.deliveryBreakdown.filter(item =>
    !['Delivery Tax'].includes(item.label)
  );

  const handleProceedToPayment = async () => {
    if (!selectedPaymentMethod) return;
    setIsPaying(true);
    setPaymentError('');
    try {
      // Call handlePlaceOrder to do all pre-payment logic and get payment details
      const { orderId, paymentDetails, orderResponse } = await handlePlaceOrder();
      // Now open Razorpay checkout
      await openRazorpayCheckout({
        razorpayOrderId: paymentDetails.razorpayOrderId,
        amount: paymentDetails.amount, // in paise
        user: {
          email: orderResponse.order.customer?.email,
          phone: orderResponse.order.customer?.phone,
          name: orderResponse.order.customer?.name,
        },
        onSuccess: async (response) => {
          try {
            // Verify payment with backend
            const verification = await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            console.log('Payment verification response:', verification);
            if (verification) {
              setOrderSuccessOpen(true);
              await cartService.clearCart();
              setIsSummaryOpen(false);
              setIsPaying(false);
              onClose && onClose();
            } else {
              throw new Error('Payment not successful');
            }
          } catch (err) {
            setPaymentError('Payment verification failed. Please try again or contact support.');
            setIsPaying(false);
          }
        },
        onFailure: async (err) => {
          // Do NOT clear the cart here
          setPaymentError(err.message || 'Payment failed or cancelled.');
          setIsPaying(false);
          // Debug: log the cart contents when payment is aborted
          const cart = await cartService.getCart();
          console.log('Cart contents after payment abort:', cart);
        },
      });
    } catch (error) {
      // Error handling is already done in handlePlaceOrder
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95%',
            maxWidth: 600,
            bgcolor: theme.colors.background,
            borderRadius: 6,
            boxShadow: 24,
            p: 0,
            color: theme.colors.text,
            border: `1.5px solid ${theme.colors.border}`,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          }}
        >
          <IconButton
            aria-label="close cart"
            onClick={onClose}
            sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, pt: 3, gap: 2 }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: step === 0 ? theme.colors.primary : theme.colors.text,
                fontSize: 18,
                transition: 'color 0.2s',
              }}
            >
              Cart Status
            </Typography>
            <Typography sx={{ color: theme.colors.text, fontWeight: 700, fontSize: 18 }}>-</Typography>
            <Typography
              sx={{
                fontWeight: 700,
                color: step === 1 ? theme.colors.primary : theme.colors.text,
                fontSize: 18,
                transition: 'color 0.2s',
              }}
            >
              Cart Summary
            </Typography>
            <Typography sx={{ color: theme.colors.text, fontWeight: 700, fontSize: 18 }}>-</Typography>
            <Typography
              sx={{
                fontWeight: 700,
                color: step === 2 ? theme.colors.primary : theme.colors.text,
                fontSize: 18,
                transition: 'color 0.2s',
              }}
            >
              Payment Section
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 4, pb: 4, pt: 0, minHeight: 120 }}>
            {step === 0 && (
              <>
                <Typography variant="h5" sx={{ mb: 1, textAlign: 'center', fontWeight: 700 }}>{cartBranch?.name}</Typography>
                <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: theme.colors.secondaryText }}>{cartBranch?.address}</Typography>
                {cartItems.length === 0 ? (
                  <Typography sx={{ textAlign: 'center' }}>Your cart is empty.</Typography>
                ) : (
                  <>
                    {cartItems.map(item => (
                      <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>
                          <Typography variant="caption">₹{item.price}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            sx={{ color: theme.colors.primary }} 
                            onClick={() => handleUpdateCartQuantity(item._id, -1, item.quantity)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            size="small" 
                            sx={{ color: theme.colors.primary }} 
                            onClick={() => handleUpdateCartQuantity(item._id, 1, item.quantity)}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: theme.colors.error, ml: 1 }} 
                            onClick={() => removeFromCart(item._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'flex-end' }}>
                      <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        style={{ width: 160, padding: '8px', borderRadius: 4, border: `1px solid ${theme.colors.border}` }}
                      />
                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: theme.colors.primary,
                          color: theme.colors.primary,
                          background: 'transparent',
                          fontWeight: 600,
                          '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                        }}
                        onClick={async () => {
                          if (!couponCode.trim()) {
                            setCouponFeedback('Please enter a coupon code.');
                            return;
                          }
                          setApplyCouponLoading(true);
                          setCouponFeedback('');
                          try {
                            // Placeholder: replace with your coupon validation logic
                            await new Promise(res => setTimeout(res, 800)); // Simulate API
                            if (couponCode.trim().toLowerCase() === 'save10') {
                              applyCoupon({ code: 'SAVE10', discountAmount: 10, description: 'Flat ₹10 off' });
                              setCouponFeedback('Coupon applied!');
                            } else {
                              setCouponFeedback('Invalid coupon code.');
                            }
                          } catch (err) {
                            setCouponFeedback('Invalid or expired coupon.');
                          } finally {
                            setApplyCouponLoading(false);
                          }
                        }}
                        disabled={!!appliedCoupon || applyCouponLoading}
                      >
                        {applyCouponLoading ? <CircularProgress size={18} sx={{ color: theme.colors.primary }} /> : 'Apply'}
                      </Button>
                    </Box>
                    {couponFeedback && (
                      <Typography sx={{ color: appliedCoupon ? 'green' : theme.colors.error, mb: 1 }}>
                        {couponFeedback}
                      </Typography>
                    )}
                    {appliedCoupon && (
                      <Typography sx={{ color: 'green', mb: 1 }}>
                        Applied: {appliedCoupon.code} ({appliedCoupon.description || ''})
                      </Typography>
                    )}
                    <Box sx={{ mt: 3, mb: 2 }}>
                      {selectedDeliveryAddress ? (
                        <Box sx={{ bgcolor: theme.colors.background, p: 2, borderRadius: 2, border: `1px solid ${theme.colors.border}` }}>
                          <Typography variant="subtitle2" sx={{ color: theme.colors.primary, mb: 1, fontWeight: 700 }}>
                            Delivery Address
                          </Typography>
                          <Typography variant="body2">
                            {selectedDeliveryAddress.formattedAddress || selectedDeliveryAddress.address}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: theme.colors.error, mb: 1, fontWeight: 500 }}>
                          Please select a delivery address
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
                          {/* Show Go to Restaurant only if not on restaurant page and cartBranch is available */}
                          {!isOnRestaurantPage && cartBranch && (
                            <Button
                              variant="contained"
                              sx={{
                                fontWeight: 700,
                                minWidth: 180,
                                bgcolor: theme.colors.primary,
                                color: theme.colors.buttonText,
                                borderRadius: 2,
                                boxShadow: 'none',
                                border: `1.5px solid ${theme.colors.primary}`,
                                '&:hover': {
                                  bgcolor: theme.colors.primary,
                                  color: theme.colors.buttonText,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                                }
                              }}
                              onClick={async () => {
                                // Use slugs for URL if possible
                                const restaurantName = cartBranch.restaurant?.name || cartBranch.name || 'restaurant';
                                const branchName = cartBranch.branchName || cartBranch.name || 'branch';
                                const slugify = str => str?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
                                // Serviceability check
                                let selectedDeliveryAddress = null;
                                try {
                                  selectedDeliveryAddress = JSON.parse(localStorage.getItem('selectedDeliveryAddress'));
                                } catch {}
                                let isServiceable = true;
                                if (
                                  selectedDeliveryAddress &&
                                  selectedDeliveryAddress.coordinates &&
                                  cartBranch.location &&
                                  cartBranch.serviceableDistance
                                ) {
                                  const [branchLng, branchLat] = cartBranch.location.coordinates;
                                  const userLat = selectedDeliveryAddress.coordinates.latitude;
                                  const userLng = selectedDeliveryAddress.coordinates.longitude;
                                  if (typeof userLat === 'number' && typeof userLng === 'number') {
                                    const distance = getDistanceFromLatLonInKm(userLat, userLng, branchLat, branchLng);
                                    if (distance > parseFloat(cartBranch.serviceableDistance)) {
                                      isServiceable = false;
                                    }
                                  }
                                }
                                if (!isServiceable) {
                                  // Clear the cart before navigating (real-time, via context)
                                  await clearCart();
                                }
                                navigate(`/restaurant/${slugify(restaurantName)}/${slugify(branchName)}`, {
                                  state: {
                                    restaurantId: cartBranch.restaurant?._id || cartBranch.restaurantId,
                                    branchId: cartBranch._id || cartBranch.branchId
                                  }
                                });
                                onClose && onClose();
                              }}
                            >
                              Go to Restaurant
                            </Button>
                          )}
                          {/* Always show Review & Pay button */}
                          <Button
                            variant="outlined"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              minWidth: 180,
                              borderColor: theme.colors.primary,
                              color: theme.colors.primary,
                              background: 'transparent',
                              borderRadius: 2,
                              '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                            }}
                            onClick={async () => {
                              // Serviceability check before moving to summary
                              let isServiceable = true;
                              if (
                                selectedDeliveryAddress &&
                                selectedDeliveryAddress.coordinates &&
                                cartBranch &&
                                cartBranch.location &&
                                cartBranch.serviceableDistance
                              ) {
                                const [branchLng, branchLat] = cartBranch.location.coordinates;
                                const userLat = selectedDeliveryAddress.coordinates.latitude;
                                const userLng = selectedDeliveryAddress.coordinates.longitude;
                                if (typeof userLat === 'number' && typeof userLng === 'number') {
                                  const distance = getDistanceFromLatLonInKm(userLat, userLng, branchLat, branchLng);
                                  if (distance > parseFloat(cartBranch.serviceableDistance)) {
                                    isServiceable = false;
                                  }
                                }
                              }
                              if (!isServiceable) {
                                await clearCart();
                                handleCloseSnackbar && handleCloseSnackbar();
                                setTimeout(() => {
                                  setSnackbar({
                                    open: true,
                                    message: 'This food item is not serviceable to your address. Please select another branch to order.',
                                    severity: 'error',
                                  });
                                }, 100);
                                return;
                              }
                              setStep(1);
                            }}
                            disabled={!selectedDeliveryAddress}
                          >
                            Review & Pay
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                    <Dialog 
                      open={showAddressModal} 
                      onClose={() => setShowAddressModal(false)}
                      maxWidth="xs" 
                      fullWidth
                    >
                      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
                        Select Delivery Address
                        <IconButton onClick={() => setShowAddressModal(false)}>
                          <CloseIcon />
                        </IconButton>
                      </DialogTitle>
                      <DialogContent sx={{ bgcolor: theme.colors.card, color: theme.colors.text }}>
                        <List>
                          {savedAddresses.map((addr, idx) => (
                            <ListItem
                              key={idx}
                              sx={{ flexDirection: 'row', alignItems: 'center', mb: 1 }}
                              secondaryAction={
                                <Radio
                                  checked={selectedDeliveryAddress?.formattedAddress === addr.formattedAddress}
                                  onChange={() => handleAddressSelect(addr)}
                                  value={idx}
                                  name="address-radio"
                                  color="primary"
                                />
                              }
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 600, color: theme.colors.text }}>
                                  {addr.label || 'Address'}
                                </Typography>
                                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14 }}>
                                  {addr.formattedAddress || addr.address}
                                </Typography>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </>
            )}
            {step === 1 && (
              <>
                <Box sx={{ mb: 2 }}>
                  {cartItems.map(item => (
                    <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 500 }}>{item.name} × {item.quantity}</Typography>
                      <Typography sx={{ fontWeight: 500 }}>₹{item.price * item.quantity}</Typography>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>₹{cartCalculation.subtotal.toFixed(2)}</Typography>
                  </Box>
                  {filteredTaxBreakdown.map((item, idx) => (
                    <Box key={item.label + idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{item.label}:</Typography>
                      <Typography>₹{item.value.toFixed(2)}</Typography>
                    </Box>
                  ))}
                  {filteredDeliveryBreakdown.map((item, idx) => (
                    <Box key={item.label + idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{item.label}:</Typography>
                      <Typography>₹{cartCalculation.isFreeShipping && item.label.toLowerCase().includes('delivery') ? 'FREE' : item.value.toFixed(2)}</Typography>
                    </Box>
                  ))}
                  {cartCalculation.discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: 'green' }}>Discount:</Typography>
                      <Typography sx={{ color: 'green' }}>-₹{cartCalculation.discount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      ₹{cartCalculation.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Delivery Address:
                  </Typography>
                  <Typography variant="body2">
                    {selectedDeliveryAddress?.formattedAddress || selectedDeliveryAddress?.address || 'No address selected'}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      minWidth: 120,
                      borderColor: theme.colors.primary,
                      color: theme.colors.primary,
                      bgcolor: 'transparent',
                      '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                    }}
                    onClick={() => setStep(0)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      minWidth: 180,
                      borderColor: theme.colors.primary,
                      color: theme.colors.primary,
                      background: 'transparent',
                      borderRadius: 2,
                      '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                    }}
                    onClick={() => setStep(2)}
                    disabled={!selectedDeliveryAddress}
                  >
                    Place Order
                  </Button>
                </Box>
              </>
            )}
            {step === 2 && (
              <>
                {/* Payment Methods UI */}
                <Box sx={{ minHeight: 320, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 2, mt: 2 }}>
                  {/* Payment Methods List */}
                  {[
                    {
                      key: 'razorpay',
                      label: 'Online Payment',
                      subtitle: 'Pay securely with Razorpay',
                      icon: <Box sx={{ bgcolor: '#FF5A33', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCardIcon sx={{ fontSize: 24 }} /></Box>
                    },
                    {
                      key: 'phonepe',
                      label: 'PhonePe',
                      subtitle: 'Pay securely with PhonePe',
                      icon: <Box sx={{ bgcolor: '#6f42c1', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AccountBalanceWalletIcon sx={{ fontSize: 24 }} /></Box>
                    },
                    {
                      key: 'gpay',
                      label: 'Google Pay',
                      subtitle: 'Pay securely with Google Pay',
                      icon: <Box sx={{ bgcolor: '#4285F4', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GoogleIcon sx={{ fontSize: 24 }} /></Box>
                    },
                    {
                      key: 'paytm',
                      label: 'Paytm',
                      subtitle: 'Pay securely with Paytm',
                      icon: <Box sx={{ bgcolor: '#00baf2', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AccountBalanceWalletIcon sx={{ fontSize: 24 }} /></Box>
                    },
                    {
                      key: 'upi',
                      label: 'UPI Payment',
                      subtitle: 'Pay using any UPI app',
                      icon: <Box sx={{ bgcolor: '#43a047', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PaymentIcon sx={{ fontSize: 24 }} /></Box>
                    },
                    {
                      key: 'netbanking',
                      label: 'Net Banking',
                      subtitle: 'Pay using your bank account',
                      icon: <Box sx={{ bgcolor: '#ff9800', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AccountBalanceIcon sx={{ fontSize: 24 }} /></Box>
                    }
                  ].map((method, idx) => (
                    <Box
                      key={method.key}
                      onClick={() => setSelectedPaymentMethod(method.key)}
                      sx={{
                        width: '100%',
                        maxWidth: 420,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 3,
                        border: selectedPaymentMethod === method.key ? `2px solid ${theme.colors.primary}` : `1.5px solid ${theme.colors.border}`,
                        bgcolor: selectedPaymentMethod === method.key ? `${theme.colors.primary}10` : theme.colors.card,
                        boxShadow: selectedPaymentMethod === method.key ? 3 : 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        mb: 0.5
                      }}
                    >
                      {method.icon}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: theme.colors.text, fontSize: 16 }}>{method.label}</Typography>
                        <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>{method.subtitle}</Typography>
                      </Box>
                      <Radio
                        checked={selectedPaymentMethod === method.key}
                        onChange={() => setSelectedPaymentMethod(method.key)}
                        value={method.key}
                        name="payment-method-radio"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, width: '100%', maxWidth: 420, mt: 2, mb: 1 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        minWidth: 120,
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary,
                        bgcolor: 'transparent',
                        borderRadius: 2,
                        '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                      }}
                      onClick={() => setStep(0)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        minWidth: 180,
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary,
                        bgcolor: 'transparent',
                        borderRadius: 2,
                        '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                      }}
                      disabled={!selectedPaymentMethod || isPaying}
                      onClick={handleProceedToPayment}
                    >
                      {isPaying ? 'Processing...' : 'PROCEED TO PAYMENT'}
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Modal>
      <Modal open={orderSuccessOpen} onClose={() => { setOrderSuccessOpen(false); onClose(); }}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: theme.colors.card || (theme.palette?.mode === 'dark' ? '#222' : '#fff'),
            borderRadius: 4,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: theme.colors.text || (theme.palette?.mode === 'dark' ? '#fff' : '#222'),
            border: `2px solid ${theme.colors.primary}`,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60, color: theme.colors.success || 'green', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: theme.colors.text || (theme.palette?.mode === 'dark' ? '#fff' : '#222') }}>
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: theme.colors.secondaryText || (theme.palette?.mode === 'dark' ? '#ccc' : '#444') }}>
            Thank you for your order. Your payment was successful and your order has been placed.
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: theme.colors.primary,
              color: theme.colors.buttonText,
              '&:hover': {
                bgcolor: theme.colors.primaryDark || theme.colors.primary,
                color: theme.colors.buttonText,
              },
              borderRadius: 2,
              fontWeight: 700,
              minWidth: 120,
              boxShadow: 'none',
            }}
            onClick={() => { setOrderSuccessOpen(false); onClose(); }}
          >
            CLOSE
          </Button>
        </Box>
      </Modal>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircleIcon sx={{ fontSize: 28, mr: 1, color: '#fff' }} /> : undefined}
          sx={{
            width: '100%',
            bgcolor: snackbar.severity === 'success' ? '#219653' : theme.colors.card,
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
            fontFamily: 'Poppins, Arial, sans-serif',
            border: snackbar.severity === 'success' ? 'none' : `2px solid ${theme.colors.primary}`,
            '& .MuiAlert-icon': {
              color: '#fff',
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CartStatusModal;
