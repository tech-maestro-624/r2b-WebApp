import { apiService } from './apiServices';
import { authService } from './authService';

// Store subscribers
let subscribers = [];

/**
 * Cart service for managing cart items and operations
 * Handles the requirement that a customer can only order from one restaurant at a time
 */
export const cartService = {
  /**
   * Subscribe to cart updates
   * @param {Function} callback - Function to call when cart updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToCartUpdates: (callback) => {
    subscribers.push(callback);
    return () => {
      subscribers = subscribers.filter(sub => sub !== callback);
    };
  },

  /**
   * Notify all subscribers of cart updates
   */
  notifySubscribers: async () => {
    const cart = await cartService.getCart();
    subscribers.forEach(callback => callback(cart));
  },

  /**
   * Get the number of items in the cart
   * @returns {Promise<number>} - Number of items in the cart
   */
  getCartItemCount: async () => {
    try {
      const cart = await cartService.getCart();
      return cart.items.reduce((total, item) => total + (item.quantity || 1), 0);
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  },

  /**
   * Get current cart items
   * 
   * @returns {Promise<Object>} - Cart data including items, restaurant, and branch
   */
  getCart: async () => {
    try {
      // Get cart data from localStorage
      const cartData = localStorage.getItem('cartData');
      return cartData ? JSON.parse(cartData) : { items: [], restaurantId: null, branchId: null };
    } catch (error) {
      const cartData = localStorage.getItem('cartData');
      return cartData ? JSON.parse(cartData) : { items: [], restaurantId: null, branchId: null };
    }
  },

  /**
   * Get current cart with total calculation
   * @returns {Promise<Object>} - Cart data with total
   */
  getCurrentCart: async () => {
    try {
      const cart = await cartService.getCart();
      const total = cart.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      return { ...cart, total };
    } catch (error) {
      console.error('Error getting current cart:', error);
      return { items: [], restaurantId: null, branchId: null, total: 0 };
    }
  },

  /**
   * Add an item to the cart
   * If item is from a different restaurant, prompts user to clear cart first
   * 
   * @param {Object} item - Food item to add
   * @param {string} restaurantId - Restaurant ID
   * @param {string} branchId - Branch ID
   * @returns {Promise<Object>} - Updated cart data and conflict status
   */
  addItem: async (item, restaurantId, branchId) => {
    try {
      if (!item || !item._id) throw new Error('Invalid item data');
      if (!restaurantId) throw new Error('Restaurant ID is required');
      if (!branchId) throw new Error('Branch ID is required');
      const cart = await cartService.getCart();
      if (cart.restaurantId && cart.restaurantId !== restaurantId) {
        return {
          cart,
          conflict: true,
          message: 'You already have items from a different restaurant. Adding this item will clear your current cart. Would you like to proceed?',
          newRestaurantId: restaurantId,
          newBranchId: branchId
        };
      }
      const normalizedItem = {
        _id: item._id,
        name: item.name || 'Unknown Item',
        price: typeof item.price === 'number' ? item.price : 0,
        quantity: item.quantity || 1,
        variant: item.variant || null,
        addOns: Array.isArray(item.addOns) ? item.addOns : [],
        options: Array.isArray(item.options) ? item.options : [],
        originalImageId: item.originalImageId || null,
        image: item.image || null
      };
      const existingItemIndex = cart.items.findIndex(cartItem => 
        cartItem._id === normalizedItem._id && 
        JSON.stringify(cartItem.variant) === JSON.stringify(normalizedItem.variant) &&
        JSON.stringify(cartItem.addOns) === JSON.stringify(normalizedItem.addOns) &&
        JSON.stringify(cartItem.options) === JSON.stringify(normalizedItem.options)
      );
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity = normalizedItem.quantity;
      } else {
        cart.items.push(normalizedItem);
      }
      cart.restaurantId = restaurantId;
      cart.branchId = branchId;
      localStorage.setItem('cartData', JSON.stringify(cart));
      await cartService.notifySubscribers();
      return {
        cart,
        conflict: false
      };
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  },

  /**
   * Update item quantity in cart
   * 
   * @param {string} itemId - Item ID to update
   * @param {number} quantity - New quantity
   * @param {Object} options - Additional identifiers (variant, addOns, options)
   * @returns {Promise<Object>} - Updated cart data
   */
  updateItemQuantity: async (itemId, quantity, options = {}) => {
    try {
      const cart = await cartService.getCart();
      const itemIndex = cart.items.findIndex(item => {
        if (item._id !== itemId) return false;
        if (options.variant && JSON.stringify(item.variant) !== JSON.stringify(options.variant)) return false;
        if (options.addOns && JSON.stringify(item.addOns) !== JSON.stringify(options.addOns)) return false;
        if (options.options && JSON.stringify(item.options) !== JSON.stringify(options.options)) return false;
        return true;
      });
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        if (cart.items.length === 0) {
          cart.restaurantId = null;
          cart.branchId = null;
        }
        localStorage.setItem('cartData', JSON.stringify(cart));
      }
      return cart;
    } catch (error) {
      console.error('Update cart item error:', error);
      throw error;
    }
  },

  /**
   * Remove an item from the cart
   * 
   * @param {string} itemId - Item ID to remove
   * @param {Object} options - Additional identifiers (variant, addOns, options)
   * @returns {Promise<Object>} - Updated cart data
   */
  removeItem: async (itemId, options = {}) => {
    try {
      const cart = await cartService.getCart();
      const itemIndex = cart.items.findIndex(item => {
        if (item._id !== itemId) return false;
        if (options.variant && JSON.stringify(item.variant) !== JSON.stringify(options.variant)) return false;
        if (options.addOns && JSON.stringify(item.addOns) !== JSON.stringify(options.addOns)) return false;
        if (options.options && JSON.stringify(item.options) !== JSON.stringify(options.options)) return false;
        return true;
      });
      if (itemIndex >= 0) {
        cart.items.splice(itemIndex, 1);
        if (cart.items.length === 0) {
          cart.restaurantId = null;
          cart.branchId = null;
        }
        localStorage.setItem('cartData', JSON.stringify(cart));
      }
      return cart;
    } catch (error) {
      console.error('Remove cart item error:', error);
      throw error;
    }
  },

  /**
   * Clear all items from cart
   * 
   * @returns {Promise<Object>} - Empty cart data
   */
  clearCart: async () => {
    try {
      const emptyCart = { items: [], restaurantId: null, branchId: null };
      localStorage.setItem('cartData', JSON.stringify(emptyCart));
      await cartService.notifySubscribers();
      return emptyCart;
    } catch (error) {
      console.warn('Error in clearCart:', error.message);
      const emptyCart = { items: [], restaurantId: null, branchId: null };
      localStorage.setItem('cartData', JSON.stringify(emptyCart));
      await cartService.notifySubscribers();
      return emptyCart;
    }
  },

  /**
   * Calculate cart totals using the API
   * 
   * @param {string} addressId - Delivery address ID
   * @param {string} couponId - Optional coupon ID
   * @param {string} orderType - Order type (delivery or pickup)
   * @param {number} deliveryTip - Optional delivery tip
   * @returns {Promise<Object>} - Cart calculation results
   */
  calculateCart: async (addressId, couponId = null, orderType = 'delivery', deliveryTip = 0) => {
    try {
      const cart = await cartService.getCart();
      if (!cart || !cart.items || cart.items.length === 0) {
        return {
          subtotal: 0,
          tax: 0,
          deliveryFee: 0,
          discount: 0,
          total: 0
        };
      }
      if (!cart.branchId) {
        throw new Error('Invalid branch selected');
      }
      // Get selected address from localStorage
      let selectedDeliveryAddress = null;
      try {
        selectedDeliveryAddress = JSON.parse(localStorage.getItem('selectedDeliveryAddress'));
      } catch (e) {
        selectedDeliveryAddress = null;
      }
      let deliveryAddress = null;
      if (selectedDeliveryAddress && selectedDeliveryAddress.coordinates) {
        deliveryAddress = {
          address: selectedDeliveryAddress.address || selectedDeliveryAddress.formattedAddress || 'Unknown location',
          coordinates: selectedDeliveryAddress.coordinates,
          pincode: selectedDeliveryAddress.pincode || '000000',
          city: selectedDeliveryAddress.city || '',
          state: selectedDeliveryAddress.state || '',
          landmark: selectedDeliveryAddress.landmark || ''
        };
      } else {
        // fallback to last known location
        try {
          const lastKnownLocation = localStorage.getItem('lastKnownLocation');
          if (lastKnownLocation) {
            const { coordinates, address } = JSON.parse(lastKnownLocation);
            deliveryAddress = {
              address: address || 'Unknown location',
              coordinates: coordinates || { latitude: 0, longitude: 0 },
              pincode: '000000'
            };
          }
        } catch (locationError) {
          console.warn('Error getting location for cart calculation:', locationError);
        }
      }
      const payload = {
        items: cart.items.map(item => ({
          _id: item._id,
          quantity: item.quantity || 1,
          variant: item.variant || null,
          addOns: Array.isArray(item.addOns) ? item.addOns : [],
          options: Array.isArray(item.options) ? item.options : []
        })),
        branchId: cart.branchId,
        addressId: addressId,
        couponId: couponId || null,
        orderType: orderType || 'Delivery',
        deliveryTip: deliveryTip || 0,
        deliveryAddress: deliveryAddress
      };
      console.log('Cart calculation payload:', JSON.stringify(payload, null, 2));
      try {
        const calculate = await apiService.post('/order/calculate', payload);
        console.log('Cart calculation response:', calculate);
        return calculate;
      } catch (apiError) {
        console.error('API Error in calculateCart:', apiError);
        // Fallback to client-side calculation
        const subtotal = cart.items.reduce((total, item) => {
          return total + (item.price * (item.quantity || 1));
        }, 0);
        const tax = subtotal * 0.1;
        const deliveryFee = subtotal > 0 ? 1.33 : 0;
        const discount = 0;
        const total = subtotal + tax + deliveryFee - discount;
        return {
          subtotal,
          tax,
          deliveryFee,
          discount,
          total,
          deliveryTip: deliveryTip || 0
        };
      }
    } catch (error) {
      console.error('Calculate cart error:', error);
      throw error;
    }
  },

  /**
   * Get the number of items in the cart
   * 
   * @returns {Promise<number>} - Cart item count
   */
  getCartCount: async () => {
    try {
      const cart = await cartService.getCart();
      return cart.items.length;
    } catch (error) {
      console.error('Get cart count error:', error);
      return 0;
    }
  },

  /**
   * Place an order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Order response
   */
  placeOrder: async (orderData) => {
    try {
      console.log('orderData:', orderData);
      const orderResponse = await apiService.post('/order/create', orderData);
      console.log('orderResponse:', orderResponse);
      return orderResponse;
    } catch (error) {
      console.error('Order placement error:', error, error.response?.data);
      throw error;
    }
  }
};