import React, { createContext, useState, useEffect, useContext } from 'react';
import { cartService } from '../services/cartService';
import { useAuthModal } from './AuthModalContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated, openLoginModal } = useAuthModal();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

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
    console.log('updateCartState called with:', cart);
    console.log('Setting cartItems to:', items);
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
    // Optimistically update cartItems
    setCartItems(prev => {
      // If item already exists, increase quantity
      const existing = prev.find(ci => ci._id === item._id);
      if (existing) {
        return prev.map(ci =>
          ci._id === item._id ? { ...ci, quantity: ci.quantity + (item.quantity || 1) } : ci
        );
      }
      // Otherwise, add new item
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });

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
  const openCartModal = () => setIsCartOpen(true);
  const closeCartModal = () => setIsCartOpen(false);
  // Clear cart
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      updateCartState({ items: [], restaurantId: null, branchId: null });
      closeCartModal();
    } catch (error) {
      console.error('Clear cart error:', error);
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

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <CartContext.Provider
      value={{
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
        handleCloseSnackbar
      }}
    >
      {children}
    </CartContext.Provider>
  );
};