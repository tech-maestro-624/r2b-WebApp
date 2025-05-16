import { apiService } from './apiServices';
import { cartService } from './cartService';
import { fileService } from './fileService';

/**
 * Order service for handling order operations
 * Implements the Order Flow from the API documentation
 */
export const orderService = {
  /**
   * Place a new order
   * 
   * @param {Object} orderData - Order data
   * @param {string} orderData.addressId - Delivery address ID
   * @param {string} orderData.paymentMethod - Payment method ('Online' or 'COD')
   * @param {string} orderData.orderType - Order type ('Delivery' or 'Pickup')
   * @param {string} orderData.couponCode - Optional coupon code
   * @param {number} orderData.deliveryTip - Optional delivery tip amount
   * @returns {Promise<Object>} - Created order and payment details
   */
  placeOrder: async (orderData) => {
    try {
      const cart = await cartService.getCart();
      console.log('cart from order service', cart);

      // Enhanced cart validation
      if (!cart || !cart.items) {
        throw new Error('Invalid cart data');
      }

      if (cart.items.length === 0) {
        throw new Error('Cannot place order with empty cart');
      }

      if (!cart.branchId) {
        throw new Error('No branch selected for order');
      }

      console.log('orderData from order service', orderData);

      // Format address data properly
      let deliveryAddress = null;
      if (orderData.orderType.toLowerCase() === 'delivery') {
        // Check if addressId contains coordinates
        if (orderData.addressId && orderData.addressId.includes(',')) {
          const [latitude, longitude] = orderData.addressId.split(',').map(coord => parseFloat(coord.trim()));
          deliveryAddress = {
            address: 'Delivery location',
            pincode: '10001', // Default pincode
            coordinates: { latitude, longitude },
            city: 'Default City',
            state: 'Default State',
            landmark: ''
          };
        }
      }

      // Prepare order payload
      const payload = {
        items: cart.items.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          variant: item.variant,
          addOns: item.addOns,
          options: item.options
        })),
        branch: cart.branchId,
        orderType: orderData.orderType.charAt(0).toUpperCase() + orderData.orderType.slice(1).toLowerCase(),
        paymentMethod: orderData.paymentMethod,
        couponCode: orderData.couponCode,
        deliveryTip: orderData.deliveryTip || 0,
      };

      // Only include addressId if it's a saved address (not coordinates)
      if (orderData.addressId && !orderData.addressId.includes(',')) {
        payload.addressId = orderData.addressId;
      }

      // If deliveryAddress is present, include it
      if (orderData.deliveryAddress) {
        payload.deliveryAddress = orderData.deliveryAddress;
      }

      console.log('payload from order service', payload);

      // Place order
      const response = await apiService.post('/order/create', payload);
      console.log('response from order service', response);

      // Save order ID for tracking - Only save if response.order and response.order._id exist
      if (response && response.order && response.order._id) {
        localStorage.setItem('lastOrderId', response.order._id);
      } else {
        // Remove lastOrderId if it exists but the response doesn't have order._id
        localStorage.removeItem('lastOrderId');
      }

      return response;
    } catch (error) {
      console.error('Place order error:', error);
      throw error;
    }
  },

  /**
   * Verify Razorpay payment
   * 
   * @param {Object} paymentData - Payment verification data
   * @param {string} paymentData.orderId - Order ID
   * @param {string} paymentData.paymentId - Razorpay payment ID
   * @param {string} paymentData.signature - Razorpay signature
   * @returns {Promise<Object>} - Payment verification result
   */
  verifyPayment: async (paymentData) => {
    try {
      // Convert from frontend parameter names to what backend expects
      const verificationData = {
        razorpayOrderId: paymentData.orderId,
        razorpayPaymentId: paymentData.paymentId,
        razorpaySignature: paymentData.signature
      };

      console.log('Verifying payment with data:', verificationData);

      // Use the correct API endpoint
      return await apiService.post('/payment/verify', verificationData);
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  },

  /**
   * Get order details by ID
   * 
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Order details
   */
  getOrderById: async (orderId) => {
    try {
      const response = await apiService.get(`/order/${orderId}`);

      // Resolve images for food items in the order
      if (response && response.order && response.order.items) {
        // For each item in the order, resolve the food item image
        for (let i = 0; i < response.order.items.length; i++) {
          const item = response.order.items[i];
          if (item.foodItem) {
            // If foodItem is an object with image field
            if (typeof item.foodItem === 'object') {
              response.order.items[i].foodItem = await fileService.resolveFoodItemImages(item.foodItem);
            }
          }
        }
      }

      return response;
    } catch (error) {
      console.error('Get order error:', error);
      throw error;
    }
  },

  /**
   * Get all orders for the current user
   * 
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by order status
   * @returns {Promise<Object>} - Paginated orders
   */
  getUserOrders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);

      const response = await apiService.get(`/orders?${queryParams.toString()}`);

      // Resolve images for food items in the orders list
      if (response && response.orders && Array.isArray(response.orders)) {
        for (const order of response.orders) {
          if (order.items && Array.isArray(order.items)) {
            // For each item in the order, resolve the food item image
            for (let i = 0; i < order.items.length; i++) {
              const item = order.items[i];
              if (item.foodItem) {
                // If foodItem is an object with image field
                if (typeof item.foodItem === 'object') {
                  order.items[i].foodItem = await fileService.resolveFoodItemImages(item.foodItem);
                }
              }
            }
          }
        }
      }

      return response;
    } catch (error) {
      console.error('Get user orders error:', error);
      throw error;
    }
  },

  /**
   * Cancel an order
   * 
   * @param {string} orderId - Order ID to cancel
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancelled order
   */
  cancelOrder: async (orderId, reason) => {
    try {
      return await apiService.post(`/order/${orderId}/cancel`, { reason });
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  },

  /**
   * Submit a review for an order
   * 
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.orderId - Order ID
   * @param {number} reviewData.rating - Rating (0-5)
   * @param {string} reviewData.feedback - Optional feedback text
   * @param {Array} reviewData.images - Optional image URLs
   * @returns {Promise<Object>} - Created review
   */
  submitReview: async (reviewData) => {
    try {
      const response = await apiService.post('/review', reviewData);

      // Resolve review images if present in the response
      if (response && response.review) {
        response.review = await fileService.resolveReviewImages(response.review);
      }

      return response;
    } catch (error) {
      console.error('Submit review error:', error);
      throw error;
    }
  },

  /**
   * Get the last order ID (for tracking the most recent order)
   * 
   * @returns {Promise<string|null>} - Last order ID or null
   */
  getLastOrderId: async () => {
    try {
      return localStorage.getItem('lastOrderId');
    } catch (error) {
      console.error('Get last order ID error:', error);
      return null;
    }
  },

  /**
   * Get all reviews for a branch
   * @param {string} branchId - Branch ID
   * @returns {Promise<Array>} - List of reviews for the branch
   */
  getReviewsByBranch: async (branchId) => {
    try {
      const response = await apiService.get(`/review/branch/${branchId}`);
      console.log('response from getReviewsByBranch', response);
      return response;
    } catch (error) {
      console.error('Get reviews by branch error:', error);
      throw error;
    }
  }
};