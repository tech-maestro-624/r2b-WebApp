import React, { useContext, useState, useEffect } from 'react';
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
        await paymentService.verifyPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        onSuccess && onSuccess(response);
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
  const { branchId, snackbar, handleCloseSnackbar } = useContext(CartContext);
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
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [step, setStep] = useState(0); // 0 = Cart Status, 1 = Cart Summary
  const [cartConflictOpen, setCartConflictOpen] = useState(false);

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

  const calculateCartTotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculateDeliveryFee = () =>
    cartBranch?.restaurant?.deliveryFee ? parseFloat(cartBranch.restaurant.deliveryFee) : 0;
  const calculateTaxes = (subtotal) =>
    Math.round(subtotal * 0.05); // 5% tax

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
        return;
      }

      // 1. Check for authentication
      if (!isAuthenticated) {
        openLoginModal();
        return;
      }

      // 2. Check for cart conflicts
      if (cartItems.length > 0 && cartBranch?.restaurant?._id !== branchId) {
        setCartConflictOpen(true);
        return;
      }

      // If authenticated, ensure token is stored
      const token = localStorage.getItem('authToken');
      if (!token && window?.authToken) {
        // If you have a global token variable, store it
        localStorage.setItem('authToken', window.authToken);
      }

      // 2. Validate token by making a test request
      try {
        await apiService.get?.('/auth/me');
      } catch (authError) {
        localStorage.removeItem('authToken');
        localStorage.setItem('pendingPaymentAddressId', JSON.stringify(selectedDeliveryAddress));
        openLoginModal();
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
        branch: branchId, // or nearestBranchId, as appropriate
        orderType: 'Delivery',
        paymentMethod: 'Online',
        couponCode: '',
        deliveryTip: 0,
        deliveryAddress
      };

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

      // 3. Open Razorpay checkout
      await openRazorpayCheckout({
        razorpayOrderId: paymentDetails.razorpayOrderId,
        amount: paymentDetails.amount, // in paise
        user: {
          email: orderResponse.order.customer?.email,
          phone: orderResponse.order.customer?.phone,
          name: orderResponse.order.customer?.name,
        },
      
        onSuccess: async () => {
          setOrderSuccessOpen(true);
          await cartService.clearCart();
          setIsSummaryOpen(false);
        },
        onFailure: (err) => {
          console.log('payment failed', err);
          setPaymentError(err.message || 'Payment failed or cancelled.');
        },
      });
      setIsPaying(false);
    } catch (error) {
      console.error('Order placement error:', error, error.response?.data);
      setIsPaying(false);
      setPaymentError(error.message || 'Failed to place your order. Please try again.');
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

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 500,
            bgcolor: theme.colors.background,
            borderRadius: 6,
            boxShadow: 24,
            p: 4,
            color: theme.colors.text,
            border: `1.5px solid ${theme.colors.border}`,
          }}
        >
          <IconButton
            aria-label="close cart"
            onClick={onClose}
            sx={{ position: 'absolute', top: 16, right: 16 }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ fontWeight: 700, color: step === 0 ? theme.colors.primary : theme.colors.secondaryText }}>Cart Status</Box>
              <Box sx={{ width: 32, height: 2, bgcolor: theme.colors.border, mx: 1 }} />
              <Box sx={{ fontWeight: 700, color: step === 1 ? theme.colors.primary : theme.colors.secondaryText }}>Cart Summary</Box>
            </Box>
          </Box>
          {step === 0 ? (
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
                        try {
                          // Placeholder: replace with your coupon validation logic
                          if (couponCode.trim().toLowerCase() === 'save10') {
                            setAppliedCoupon({ code: 'SAVE10', discountAmount: 10, description: 'Flat ₹10 off' });
                            setCouponFeedback('Coupon applied!');
                          } else {
                            setCouponFeedback('Invalid coupon code.');
                          }
                        } catch (err) {
                          setCouponFeedback('Invalid or expired coupon.');
                        }
                      }}
                      disabled={!!appliedCoupon}
                    >
                      Apply
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Button
                        variant="outlined"
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: theme.colors.primary,
                          color: theme.colors.primary,
                          background: 'transparent',
                          '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                        }}
                        onClick={() => setShowAddressModal(true)}
                      >
                        {selectedDeliveryAddress ? 'Change Selected Address' : 'Choose Delivery Address @@'}
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          minWidth: 200,
                          ml: 2,
                          borderColor: theme.colors.primary,
                          color: theme.colors.primary,
                          background: 'transparent',
                          '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                        }}
                        onClick={() => setStep(1)}
                        disabled={!selectedDeliveryAddress}
                      >
                   Review & Pay
                      </Button>
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
          ) : (
            <>
              {cartItems.map(item => (
                <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontWeight: 500 }}>{item.name} × {item.quantity}</Typography>
                  <Typography sx={{ fontWeight: 500 }}>₹{item.price * item.quantity}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{calculateCartTotal()}</Typography>
              </Box>
              {appliedCoupon && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Coupon Discount:</Typography>
                  <Typography sx={{ color: 'green' }}>-₹{appliedCoupon.discountAmount || 0}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Delivery:</Typography>
                <Typography>₹{calculateDeliveryFee()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Tax (5%):</Typography>
                <Typography>₹{calculateTaxes(calculateCartTotal())}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Total:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ₹{calculateCartTotal() + calculateDeliveryFee() + calculateTaxes(calculateCartTotal()) - (appliedCoupon?.discountAmount || 0)}
                </Typography>
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
                  sx={{ textTransform: 'none', fontWeight: 700, minWidth: 120 }}
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
                    minWidth: 200,
                    bgcolor: 'transparent',
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                    '&:hover': { borderColor: theme.colors.primary, bgcolor: theme.colors.card }
                  }}
                  onClick={handlePlaceOrder}
                  disabled={!selectedDeliveryAddress}
                >
                  Place Order Now
                </Button>
              </Box>
              {isPaying && <div>Processing payment, please wait...</div>}
              {paymentError && <div style={{ color: theme.colors.error }}>{paymentError}</div>}
            </>
          )}
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
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60, color: 'green' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Order Placed Successfully!</Typography>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
            Thank you for your order. Your payment was successful and your order has been placed.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => { setOrderSuccessOpen(false); onClose(); }}>
            Close
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
          sx={{ 
            width: '100%',
            bgcolor: theme.colors.card,
            color: theme.colors.text,
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? theme.colors.success : theme.colors.warning
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CartStatusModal;
