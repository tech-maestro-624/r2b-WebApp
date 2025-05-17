import React, { createContext, useState, useEffect, useContext } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

// Main Cart Context
export const CartContext = createContext();

// Legacy FloatingCartModalContext for backward compatibility
export const FloatingCartModalContext = createContext({ openCartModal: () => {} });

// Export custom hook for using the cart context
export const useCart = () => useContext(CartContext);

// Export custom hook for using coupon functionality (for backward compatibility)
export const useCoupon = () => {
  const context = useContext(CartContext);
  return {
    appliedCoupon: context.appliedCoupon,
    setAppliedCoupon: context.setAppliedCoupon,
    availableCoupons: context.availableCoupons,
    setAvailableCoupons: context.setAvailableCoupons,
    loading: context.couponLoading,
    setLoading: context.setCouponLoading,
    error: context.couponError,
    setError: context.setCouponError,
    applyCoupon: context.applyCoupon,
    removeCoupon: context.removeCoupon
  };
};

export const CartProvider = ({ children }) => {
  // Original Cart State
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated, openLoginModal } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

  // Coupon State (from CouponContext)
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, description }
  const [availableCoupons, setAvailableCoupons] = useState([]); // List of coupons
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // Load cart data from cartService and subscribe to updates
  useEffect(() => {
    const loadCartData = async () => {
      try {
        setIsLoading(true);
        const cart = await cartService.getCart();
        updateCartState(cart);
      } catch (error) {
        console.error('Failed to load cart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to cart updates
    const unsubscribe = cartService.subscribeToCartUpdates(async () => {
      try {
        const cart = await cartService.getCart();
        updateCartState(cart);
      } catch (error) {
        console.error('Failed to update cart data:', error);
      }
    });

    loadCartData();
    return () => unsubscribe();
  }, []);

  // Helper function to update all cart state
  const updateCartState = (cart) => {
    const items = cart.items || [];
    setCartItems(items);
    setRestaurantId(cart.restaurantId);
    setBranchId(cart.branchId);
    calculateTotal(items);
  };

  // Calculate cart total and count
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartTotal(total);
    setCartCount(count);
  };

  // Add item to cart
  const addToCart = async (item, restaurantId, branchId) => {
    try {
      const result = await cartService.addItem(item, restaurantId, branchId);
      if (result.conflict) {
        return result;
      }
      updateCartState(result.cart);
      return { conflict: false };
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    // Optimistically update cartItems
    setCartItems(prev => {
      if (quantity <= 0) {
        return prev.filter(ci => ci._id !== itemId);
      }
      return prev.map(ci =>
        ci._id === itemId ? { ...ci, quantity } : ci
      );
    });
    try {
      const result = await cartService.updateItemQuantity(itemId, quantity);
      updateCartState(result);
    } catch (error) {
      console.error('Update quantity error:', error);
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    // Optimistically update cartItems
    setCartItems(prev => prev.filter(ci => ci._id !== itemId));
    try {
      const result = await cartService.removeItem(itemId);
      await cartService.notifySubscribers();
      updateCartState(result);
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  };
  
  // Cart Modal functions (from FloatingCartModalContext)
  const openCartModal = () => setIsCartOpen(true);
  const closeCartModal = () => setIsCartOpen(false);
  
  // Clear cart
  const clearCart = async (message = 'Your cart has been cleared.', severity = 'warning') => {
    try {
      await cartService.clearCart();
      updateCartState({ items: [], restaurantId: null, branchId: null });
      closeCartModal();
      setSnackbar({ open: true, message, severity });
    } catch (error) {
      console.error('Clear cart error:', error);
      setSnackbar({ open: true, message: 'Failed to clear cart. Please try again.', severity: 'error' });
      throw error;
    }
  };

  const changeCartItemQuantity = async (itemId, delta, menuRes, restaurantId, branchId) => {
    try {
      const cartItem = cartItems.find(ci => ci._id === itemId);
      
      // If item doesn't exist in cart and we're trying to add
      if (!cartItem && delta > 0) {
        // Find item in menuRes
        let item = null;
        for (const catItems of Object.values(menuRes || {})) {
          const found = catItems.find(i => i._id === itemId);
          if (found) {
            item = found;
            break;
          }
        }
        if (!item) return null;

        // Check for restaurant conflict
        if (restaurantId && restaurantId !== this.restaurantId) {
          return { conflict: true };
        }

        // Add new item
        const result = await addToCart({ ...item, quantity: 1 }, restaurantId, branchId);
        return result;
      } 
      // If item exists in cart
      else if (cartItem) {
        const newQty = cartItem.quantity + delta;
        
        if (newQty <= 0) {
          // Remove item if quantity would be 0 or negative
          await removeFromCart(itemId);
          return { success: true };
        } else {
          // Update quantity
          const result = await updateQuantity(itemId, newQty);
          return result;
        }
      }
    } catch (error) {
      console.error('Error changing cart item quantity:', error);
      throw error;
    }
  };

  // Coupon functions (from CouponContext)
  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Combined provider value with all cart, modal, and coupon functionality
  const contextValue = {
    // Original Cart Context values
    cartItems,
    cartTotal,
    cartCount,
    isLoading,
    restaurantId,
    branchId,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCartItems,
    setCartTotal,
    setCartCount,
    isCartOpen,
    openCartModal,
    closeCartModal,
    changeCartItemQuantity,
    snackbar,
    handleCloseSnackbar,
    
    // Coupon Context values
    appliedCoupon,
    setAppliedCoupon,
    availableCoupons,
    setAvailableCoupons,
    couponLoading,
    setCouponLoading,
    couponError,
    setCouponError,
    applyCoupon,
    removeCoupon
  };

  return (
    <CartContext.Provider value={contextValue}>
      <FloatingCartModalContext.Provider value={{ openCartModal }}>
        {children}
      </FloatingCartModalContext.Provider>
    </CartContext.Provider>
  );
};