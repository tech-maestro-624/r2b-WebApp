import { apiService } from './apiServices';

export const couponService = {
  /**
   * Get all coupons with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Number of coupons per page
   * @returns {Promise<Object>} - Paginated coupons data
   */
  getCoupons: async (params = {}) => {
    try {
      const response = await apiService.get('/coupon', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...params
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }
}; 