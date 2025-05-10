import React, { useState, useEffect, useContext } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { orderService } from '../services/orderService';
import { ThemeContext } from '../context/ThemeContext.jsx';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { cartService } from '../services/cartService';
import { DialogActions } from '@mui/material';
import { useAuthModal } from '../context/AuthModalContext';
import StarIcon from '@mui/icons-material/Star';
import TextField from '@mui/material/TextField';

const OrdersPage = () => {
  const [tab, setTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [cartConflictOpen, setCartConflictOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [pendingRestaurantId, setPendingRestaurantId] = useState(null);
  const [pendingBranchId, setPendingBranchId] = useState(null);
  const { isAuthenticated, openLoginModal } = useAuthModal();
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [orderToRate, setOrderToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setSnackbar({
          open: true,
          message: 'Please login to view your orders',
          severity: 'warning'
        });
        openLoginModal();
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await orderService.getUserOrders();
        setOrders(res.orders || []);
      } catch (err) {
        setError('Failed to load orders.');
      }
      setLoading(false);
    };
    fetchOrders();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchAndLogOrders = async () => {
      try {
        const res = await orderService.getUserOrders();
        console.log('Customer Orders:', res.orders);
      } catch (err) {
        console.error('Failed to fetch customer orders:', err);
      }
    };
    fetchAndLogOrders();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleCardClick = (order) => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please login to view order details',
        severity: 'warning'
      });
      openLoginModal();
      return;
    }
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const handleReOrder = async (order) => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please login to reorder items',
        severity: 'warning'
      });
      openLoginModal();
      return;
    }

    try {
      // Format items properly for cart
      const formattedItems = order.items.map(item => ({
        _id: item.foodItem?._id || item._id,
        name: item.foodItem?.name || item.name,
        price: item.foodItem?.price || item.price,
        quantity: item.quantity || 1,
        image: item.foodItem?.image || item.image,
        description: item.foodItem?.description || item.description,
        variant: item.variant || null,
        addOns: item.addOns || [],
        options: item.options || []
      }));

      // Get restaurant and branch IDs
      const restaurantId = order.branch?.restaurant || order.restaurant?._id || order.restaurantId;
      const branchId = order.branch?._id || order.branchId;

      if (!restaurantId || !branchId) {
        throw new Error('Missing restaurant or branch ID');
      }

      // Get current cart to check for conflicts
      const currentCart = await cartService.getCart();
      
      // Check for conflicts before adding any items
      if (currentCart.restaurantId && 
          (currentCart.restaurantId !== restaurantId || 
           (currentCart.branchId && currentCart.branchId !== branchId))) {
        // Store pending items and IDs for cart conflict resolution
        setPendingCartItem(formattedItems);
        setPendingRestaurantId(restaurantId);
        setPendingBranchId(branchId);
        setCartConflictOpen(true);
        return;
      }

      // If no conflict, add all items
      for (const item of formattedItems) {
        await addToCart(
          item,
          restaurantId,
          branchId
        );

        // Show snackbar for each item added
        setSnackbar({
          open: true,
          message: `${item.name} x${item.quantity} added to your cart!`,
          severity: 'success'
        });
      }

      // Show final success message
      setSnackbar({
        open: true,
        message: 'All items added to cart successfully!',
        severity: 'success'
      });

      // Navigate to restaurant page with correct URL format
      navigate(`/restaurant/${restaurantId}/${branchId}`);
    } catch (error) {
      console.error('Error reordering:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add items to cart. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCartConflictResolution = async (clearCart) => {
    try {
      if (clearCart) {
        // Clear current cart and add new items
        await cartService.clearCart();
        
        // Add all pending items
        for (const item of pendingCartItem) {
          await addToCart(
            item,
            pendingRestaurantId,
            pendingBranchId
          );

          // Show snackbar for each item added
          setSnackbar({
            open: true,
            message: `${item.name} x${item.quantity} added to your cart!`,
            severity: 'success'
          });
        }

        // Show final success message
        setSnackbar({
          open: true,
          message: 'All items added to cart successfully!',
          severity: 'success'
        });

        // Navigate to restaurant page
        navigate(`/restaurant/${pendingRestaurantId}/${pendingBranchId}`);
      }
      
      // Close the conflict modal
      setCartConflictOpen(false);
      setPendingCartItem(null);
      setPendingRestaurantId(null);
      setPendingBranchId(null);
    } catch (error) {
      console.error('Error resolving cart conflict:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add items to cart. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenRateModal = (order) => {
    setOrderToRate(order);
    setRating(0);
    setReview('');
    setRateModalOpen(true);
  };

  const handleCloseRateModal = () => {
    setRateModalOpen(false);
    setOrderToRate(null);
  };

  const userDataStr = localStorage.getItem('userData');
  const currentUserId = userDataStr ? JSON.parse(userDataStr)._id : null;

  const handleSubmitReview = async () => {
    if (!orderToRate || rating === 0 || !review.trim()) return;
    try {
      await orderService.submitReview({
        orderId: orderToRate._id || orderToRate.orderId,
        branchId: orderToRate.branch?._id || orderToRate.branchId,
        user: currentUserId,
        rating,
        feedback: review
      });
      setSnackbar({ open: true, message: 'Thank you for your review!', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to submit review. Please try again.', severity: 'error' });
    }
    setRateModalOpen(false);
    setOrderToRate(null);
    setRating(0);
    setReview('');
  };

  // Split orders into upcoming and history
  const upcomingOrders = orders.filter(order => !['delivered', 'cancelled'].includes((order.status || '').toLowerCase()));
  const historyOrders = orders.filter(order => ['delivered', 'cancelled'].includes((order.status || '').toLowerCase()));

  const renderOrderCard = (order, idx) => {
    const isDelivered = (order.status || '').toLowerCase() === 'delivered';
    const showActions = tab === 1 && isDelivered; // Only show in History tab for delivered orders
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
    <Card
      key={order._id || idx}
      sx={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.07)', 
        borderRadius: 2, 
        p: 1, 
        cursor: 'pointer', 
        transition: 'all 0.2s ease-in-out', 
        '&:hover': { 
          boxShadow: theme.isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.13)',
          transform: 'translateY(-2px)'
        }, 
        minHeight: 180, 
        height: 180, 
        background: theme.colors.card, 
        color: theme.colors.text, 
        border: `1.5px solid ${theme.colors.border}` 
      }}
      onClick={() => handleCardClick(order)}
    >
      <CardMedia
        component="img"
        image={order.restaurantImage || order.restaurant?.image || order.items?.[0]?.foodItem?.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80'}
        alt={order.restaurantName || order.restaurant?.name || 'Restaurant'}
        sx={{ height: '100%', width: 180, minWidth: 180, borderRadius: 2, objectFit: 'cover', mr: 2 }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', p: 1, flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: theme.colors.text, fontSize: 18 }}>{order.branch?.name || order.restaurantName || order.restaurant?.name || 'Restaurant'}</Typography>
        <Typography sx={{ color: theme.colors.secondaryText, fontWeight: 600, fontSize: 14, mb: 0.5 }}>
          Order ID: {order.orderId}
        </Typography>
        <Box sx={{ color: theme.colors.secondaryText, fontSize: 13, mb: 0.5, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          {order.items && order.items.length > 0
            ? order.items.map((item, i) => (
                <span key={i}>{item.foodItem?.name || item.name} x {item.quantity}</span>
              ))
            : null}
        </Box>
        <Typography sx={{ color: theme.colors.primary, fontWeight: 700, fontSize: 15, mb: 0.5 }}>
          ₹{order.grandTotal ? Math.round(order.grandTotal) : (order.total || order.amount || 0)}
        </Typography>
        <Typography sx={{ 
          color: (order.status || '').toLowerCase() === 'delivered' ? theme.colors.success : theme.colors.primary, 
          fontWeight: 500, 
          fontSize: 13 
        }}>
          {order.status}
        </Typography>
      </CardContent>
    </Card>
        {showActions && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                color: theme.colors.primary,
                borderColor: theme.colors.primary,
                '&:hover': {
                  borderColor: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}10`,
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRateModal(order);
              }}
            >
              Rate
            </Button>
            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: theme.colors.primary,
                '&:hover': {
                  backgroundColor: theme.colors.primary,
                  opacity: 0.9,
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleReOrder(order);
              }}
            >
              ReOrder
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  // Instead of mapping order cards in a column, use a grid layout
  const renderOrderCardsGrid = (ordersArr) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 3,
        mt: 2,
      }}
    >
      {ordersArr.map(renderOrderCard)}
    </Box>
  );

  const renderOrderDetailsModal = () => (
    <Dialog 
      open={showOrderModal} 
      onClose={handleCloseModal} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.colors.card,
          color: theme.colors.text,
          borderRadius: theme.modal?.borderRadius,
          boxShadow: theme.modal?.boxShadow
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        bgcolor: theme.colors.card, 
        color: theme.colors.text, 
        minHeight: 0, 
        py: 1 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.colors.text }}>Order Details</Typography>
        <IconButton onClick={handleCloseModal} size="large" sx={{ color: theme.colors.secondaryText }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: theme.colors.card, p: { xs: 2, sm: 3 } }}>
        {selectedOrder && (
          <>
            <Card sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: 'center', 
              minHeight: 180, 
              height: { sm: 180 }, 
              boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.07)', 
              borderRadius: 2, 
              p: 1, 
              mb: 3, 
              background: theme.colors.card, 
              color: theme.colors.text, 
              border: `1.5px solid ${theme.colors.border}` 
            }}>
              <CardMedia
                component="img"
                image={selectedOrder.restaurantImage || selectedOrder.restaurant?.image || selectedOrder.items?.[0]?.foodItem?.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80'}
                alt={selectedOrder.restaurantName || selectedOrder.restaurant?.name || 'Restaurant'}
                sx={{ height: { xs: 180, sm: '100%' }, width: { xs: '100%', sm: 180 }, minWidth: { sm: 180 }, borderRadius: 2, objectFit: 'cover', mr: { sm: 2 }, mb: { xs: 2, sm: 0 } }}
              />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', p: 1, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: theme.colors.text, fontSize: 18 }}>{selectedOrder.branch?.name || selectedOrder.restaurantName || selectedOrder.restaurant?.name || 'Restaurant'}</Typography>
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13, mb: 0.5 }}>
                  Order ID: {selectedOrder.orderId || selectedOrder.id || selectedOrder._id}
                </Typography>
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13, mb: 0.5 }}>{selectedOrder.status}</Typography>
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 12 }}>Ordered on: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ''}</Typography>
              </CardContent>
            </Card>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, minWidth: 140, color: theme.colors.text, fontSize: 15 }}>Delivery Address</Typography>
              <Box sx={{ textAlign: 'right' }}>
                {selectedOrder.customer && (
                  <>
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13, mt: 1 }}>
                      {selectedOrder.customer.name || selectedOrder.customer.phoneNumber || 'N/A'}
                    </Typography>
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>
                      Phone: {selectedOrder.customer.phoneNumber || 'N/A'}
                    </Typography>
                  </>
                )}
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>
                  {selectedOrder.deliveryAddress?.address || selectedOrder.address || 'N/A'}
                </Typography>
                {selectedOrder.deliveryAddress?.pincode && (
                  <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>
                    Pincode: {selectedOrder.deliveryAddress.pincode}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.colors.text, fontSize: 15 }}>Order Items</Typography>
              <List>
                {selectedOrder.items?.map((item, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={item.foodItem?.imageUrl || item.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80'} alt={item.foodItem?.name || item.name} sx={{ width: 56, height: 56, mr: 2 }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography sx={{ fontWeight: 500, flex: 1, color: theme.colors.text, fontSize: 14 }}>{item.foodItem?.name || item.name}</Typography>
                          <Typography sx={{ color: theme.colors.secondaryText, fontSize: 12, textAlign: 'center', flex: 1 }}>Qty: {item.quantity}</Typography>
                          <Typography sx={{ color: theme.colors.primary, fontSize: 13, minWidth: 60, textAlign: 'right', flex: 1 }}>₹{item.price}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Divider sx={{ my: 2, bgcolor: theme.colors.border }} />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 1, width: '100%' }}>
              <Box sx={{ minWidth: 260, maxWidth: 340, flex: 1.5, pr: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.colors.text, fontSize: 16 }}>Status Timeline</Typography>
                {selectedOrder.statusTimeline || selectedOrder.statusUpdates ? (
                  <Box>
                    {(selectedOrder.statusTimeline || selectedOrder.statusUpdates).map((status, idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <Typography sx={{ 
                          fontWeight: 700, 
                          color: idx === (selectedOrder.statusTimeline || selectedOrder.statusUpdates).length - 1 ? theme.colors.success : theme.colors.text, 
                          fontSize: 14, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }}>
                          • {status.status || status.title}
                          {(status.timestamp || status.updatedAt) && (
                            <Typography component="span" sx={{ color: theme.colors.secondaryText, fontWeight: 400, fontSize: 12, ml: 1, opacity: 0.8 }}>
                              {new Date(status.timestamp || status.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Typography>
                          )}
                        </Typography>
                        {status.message && (
                          <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>{status.message}</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>No status updates available.</Typography>
                )}
              </Box>
              <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 220, maxWidth: 300, pl: 1 }}>
                <Box sx={{ width: '100%', maxWidth: 320 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography sx={{ color: theme.colors.text, fontSize: 14 }}>Subtotal</Typography>
                      <Typography sx={{ color: theme.colors.primary, fontWeight: 500, fontSize: 14 }}>{selectedOrder.subTotal !== undefined ? Number(selectedOrder.subTotal).toFixed(2) : '0.00'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography sx={{ color: theme.colors.text, fontSize: 14 }}>Delivery Fee</Typography>
                      <Typography sx={{ color: theme.colors.primary, fontWeight: 500, fontSize: 14 }}>{selectedOrder.deliveryCharge !== undefined ? Number(selectedOrder.deliveryCharge).toFixed(2) : '0.00'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography sx={{ color: theme.colors.text, fontSize: 14 }}>Packaging Charges</Typography>
                      <Typography sx={{ color: theme.colors.primary, fontWeight: 500, fontSize: 14 }}>{selectedOrder.packagingCharges !== undefined ? Number(selectedOrder.packagingCharges).toFixed(2) : '0.00'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography sx={{ color: theme.colors.text, fontSize: 14 }}>Platform Fee</Typography>
                      <Typography sx={{ color: theme.colors.primary, fontWeight: 500, fontSize: 14 }}>{selectedOrder.platformFee !== undefined ? Number(selectedOrder.platformFee).toFixed(2) : '0.00'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography sx={{ color: theme.colors.text, fontSize: 14 }}>GST</Typography>
                      <Typography sx={{ color: theme.colors.primary, fontWeight: 500, fontSize: 14 }}>
                        ₹{selectedOrder.taxDetails && Array.isArray(selectedOrder.taxDetails)
                          ? Number(selectedOrder.taxDetails.reduce((sum, t) => sum + (t.amount || 0), 0)).toFixed(2)
                          : '0.00'}
                      </Typography>
                    </Box>
                    <Divider sx={{ width: '100%', my: 2, bgcolor: theme.colors.border }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 15, color: theme.colors.text }}>Total</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: 15, color: theme.colors.primary }}>₹{selectedOrder.grandTotal !== undefined ? Number(selectedOrder.grandTotal).toFixed(2) : '0.00'}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ width: '100%', my: 2, bgcolor: theme.colors.border }} />
                  <Typography sx={{ color: theme.colors.text, fontSize: 13, textAlign: 'right' }}>
                    Payment Method: <b style={{ color: theme.colors.primary }}>{selectedOrder.paymentMethod || 'N/A'}</b>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading) {
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
    <Box sx={{ minHeight: '100vh', bgcolor: theme.colors.background, color: theme.colors.text }}>
      <Box sx={{ width: '100%' }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          centered
          sx={{
            '& .MuiTab-root': {
              color: theme.colors.secondaryText,
              '&.Mui-selected': {
                color: theme.colors.primary,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.colors.primary,
            },
          }}
        >
          <Tab label="Upcoming" />
          <Tab label="History" />
        </Tabs>
        <Box sx={{ mt: 1 }}>
          {error ? (
            <Typography sx={{ textAlign: 'center', mt: 4, color: theme.colors.error }}>{error}</Typography>
          ) : tab === 0 ? (
            upcomingOrders.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: theme.colors.secondaryText, mt: 4 }}>No upcoming orders.</Typography>
            ) : (
              renderOrderCardsGrid(upcomingOrders)
            )
          ) : (
            historyOrders.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: theme.colors.secondaryText, mt: 4 }}>No order history.</Typography>
            ) : (
              renderOrderCardsGrid(historyOrders)
            )
          )}
        </Box>
        {renderOrderDetailsModal()}
      </Box>
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
        open={cartConflictOpen} 
        onClose={() => setCartConflictOpen(false)}
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
          Cart Conflict
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background, pt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            You already have items from a different restaurant in your cart. Would you like to clear your current cart and add these items instead?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: theme.modal.background,
          borderTop: `1px solid ${theme.colors.border}`,
          p: 2
        }}>
          <Button 
            onClick={() => handleCartConflictResolution(false)}
            sx={{ 
              color: theme.colors.secondaryText,
              '&:hover': { bgcolor: `${theme.colors.secondaryText}10` }
            }}
          >
            Keep Current Cart
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCartConflictResolution(true)}
            sx={{ 
              bgcolor: theme.colors.primary,
              color: theme.colors.buttonText,
              '&:hover': { bgcolor: theme.colors.primaryDark || theme.colors.primary }
            }}
          >
            Clear Cart & Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={rateModalOpen} onClose={handleCloseRateModal} maxWidth="xs" fullWidth>
        <DialogTitle>Please rate this order</DialogTitle>
        <DialogContent>
          {orderToRate && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>
                {orderToRate.branch?.name || orderToRate.restaurantName || orderToRate.restaurant?.name || 'Restaurant'}
              </Typography>
              <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13, mb: 1 }}>
                {orderToRate.branch?.address || orderToRate.restaurant?.address || orderToRate.deliveryAddress?.address || orderToRate.address || 'N/A'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {orderToRate.items?.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>
                      {item.foodItem?.name || item.name} x{item.quantity}
                    </Typography>
                    <Typography sx={{ color: theme.colors.primary, fontWeight: 600, fontSize: 13 }}>
                      ₹{item.price}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    onClick={() => setRating(star)}
                    sx={{
                      cursor: 'pointer',
                      color: star <= rating ? theme.colors.primary : theme.colors.secondaryText,
                      fontSize: 36,
                      transition: 'color 0.2s',
                    }}
                  />
                ))}
              </Box>
              <Typography sx={{ textAlign: 'center', color: theme.colors.secondaryText, fontSize: 13 }}>
                {rating === 0 ? 'Click a star to rate' : `You rated this order ${rating} star${rating > 1 ? 's' : ''}`}
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Write your review..."
                sx={{ mt: 2, bgcolor: theme.colors.background, borderRadius: 2, fontSize: 13 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRateModal} color="primary">Close</Button>
          <Button
            onClick={handleSubmitReview}
            color="primary"
            variant="contained"
            disabled={rating === 0 || review.trim() === ''}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersPage;
