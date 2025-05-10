import { apiService } from './apiServices';

/**
 * Payment service for handling Razorpay integration using Razorpay Web SDK
 */
export const paymentService = {
  /**
   * Initialize Razorpay payment using Razorpay Web SDK
   * 
   * @param {Object} orderData - Order data from the API
   * @returns {Promise<Object>} - Payment initialization result
   */
  initializeRazorpay: async (orderData) => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.Razorpay) {
          reject(new Error('Razorpay SDK not loaded'));
          return;
        }
        const keyId = orderData.razorpayKeyId || orderData.keyId || 'rzp_test_nRcDdK6FVXwXdB'; // fallback test key
        if (!orderData.razorpayOrderId) {
          return reject(new Error('Missing Razorpay order ID'));
        }
        const options = {
          description: `Order #${orderData.orderId}`,
          currency: 'INR',
          key: keyId,
          amount: orderData.grandTotal, // Amount in paise
          name: 'Roll2Bowl',
          order_id: orderData.razorpayOrderId,
          prefill: {
            email: orderData.customerEmail || '',
            contact: orderData.customerPhone || '',
            name: orderData.customerName || ''
          },
          theme: { color: '#FF5A33' },
          handler: function (response) {
            resolve({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            });
          },
          modal: {
            ondismiss: function () {
              reject(new Error('Payment cancelled by user'));
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Razorpay initialization error:', error);
        reject(error);
      }
    });
  },

  /**
   * Check if Razorpay is available
   * 
   * @returns {boolean} - Whether Razorpay is available
   */
  isRazorpayAvailable: () => {
    return typeof window !== 'undefined' && !!window.Razorpay;
  },

  /**
   * Create a new order and get Razorpay order ID
   * @param {Object} orderData - Order details including items, total, address, etc.
   * @returns {Promise<Object>} - Order details including Razorpay order ID
   */
  createOrder: async (orderData) => {
    try {
      return await apiService.post('/orders/create', orderData);
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  /**
   * Verify Razorpay payment
   * @param {Object} paymentData - Payment verification data from Razorpay
   * @returns {Promise<Object>} - Verification result
   */
  verifyPayment: async (paymentData) => {
    try {
      return await apiService.post('/payment/verify', paymentData);
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  },

  initiatePayment: async(orderId) => {
    try {
      console.log('Initiating payment for order:', orderId);

      if (!orderId) {
        throw new Error('Order ID is required to initiate payment');
      }

      const response = await apiService.post(`/order/${orderId}/pay`);

      console.log('Payment initiation response:', response);

      // Add Razorpay test key if not provided by server
      if (!response.razorpayKeyId && !response.keyId) {
        // Using Razorpay test key if not provided by backend
        response.razorpayKeyId = 'rzp_test_LKwcKdhRp0mq9f'; // Replace with your actual test key
      }

      // Validate the response has the necessary Razorpay details
      if (!response || !response.razorpayOrderId) {
        throw new Error('Failed to get payment details from server');
      }

      return response;
    } catch (error) {
      console.error('Payment initiation error:', error);
      if (error.response?.status === 404) {
        throw new Error('Order not found. Please try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw error;
      }
    }
  },

  /**
   * Get order status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Order status details
   */
  getOrderStatus: async (orderId) => {
    try {
      return await apiService.get(`/orders/${orderId}/status`);
    } catch (error) {
      console.error('Get order status error:', error);
      throw error;
    }
  },
};