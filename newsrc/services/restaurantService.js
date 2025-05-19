import axiosInstance, { apiService } from './apiServices';
import { fileService } from './fileService';
import { locationService } from './locationService';

/**
 * Restaurant service for fetching restaurant data, categories, and menu items
 * Implements the Restaurant Flow and Menu Flow from the API documentation
 */
export const restaurantService = {
  /**
   * Fetch all restaurants with pagination and filtering
   * 
   * @param {Object} params - Query parameters for filtering and pagination
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.sort - Sort field (default: 'createdAt')
   * @param {string} params.order - Sort order ('asc' or 'desc', default: 'desc')
   * @param {string} params.cuisine - Filter by cuisine type
   * @param {number} params.rating - Filter by minimum rating
   * @param {Object} params.coordinates - User coordinates for finding nearby restaurants
   * @returns {Promise<Object>} - Paginated restaurant results
   */
  getRestaurants: async (params = {}) => {
    try {
      console.log("Params received:", params);
      
      // Ensure we're passing parameters exactly as needed by the backend
      // Don't create a new object, pass the exact structure required
      const response = await axiosInstance.get('/restaurants', {params : params});
      console.log('RestaurantService: Got response:', response ? 'success' : 'null');
      
      // Resolve images for each restaurant if response contains restaurants
      if (response && response.restaurants && Array.isArray(response.restaurants)) {
        response.restaurants = await Promise.all(response.restaurants.map(async restaurant => {
          return await fileService.resolveRestaurantImages(restaurant);
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Get restaurants error:', error);
      // Return empty array instead of throwing
      return { restaurants: [] };
    }
  },

  /**
   * Fetch restaurants by category
   * 
   * @param {string} categoryId - Category ID to filter by
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} - Restaurants in the specified category
   */
  getRestaurantsByCategory: async (categoryId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const endpoint = `/restaurant-by-category/${categoryId}?${queryParams.toString()}`;
      return await apiService.get(endpoint);
    } catch (error) {
      console.error('Get restaurants by category error:', error);
      throw error;
    }
  },

  /**
   * Fetch a specific restaurant by ID
   * 
   * @param {string} restaurantId - Restaurant ID
   * @returns {Promise<Object>} - Restaurant details
   */
  getRestaurantById: async (restaurantId) => {
    try {
      const response = await apiService.get(`/restaurant/${restaurantId}`);
      
      // Resolve restaurant images if response contains restaurant data
      if (response && response.restaurant) {
        response.restaurant = await fileService.resolveRestaurantImages(response.restaurant);
      }
      
      return response;
    } catch (error) {
      console.error('Get restaurant by ID error:', error);
      throw error;
    }
  },

  /**
   * Fetch all food items for a specific branch
   * 
   * @param {string} branchId - Branch ID
   * @param {boolean} includeUnavailable - Whether to include unavailable items
   * @returns {Promise<Object>} - Food items grouped by category
   */
  getFoodItems: async (branchId, includeUnavailable = false) => {
    try {

      const queryParams = new URLSearchParams();
      queryParams.append('includeUnavailable', includeUnavailable);
      
      const response = await apiService.get(`/food-items/${branchId}?${queryParams.toString()}`);
      
      // Process the response based on its structure
      let formattedResponse = {};
      
      // If the response already has categories with items
      if (response && response.categories) {
        // Map each category to a new object with resolved images
        formattedResponse.categories = await Promise.all(response.categories.map(async (category) => {
          // Resolve category image
           const resolvedCategory = await fileService.resolveCategoryImage(category);
          
          // Resolve food item images
          if (resolvedCategory.items && Array.isArray(resolvedCategory.items)) {
            resolvedCategory.items = await fileService.resolveImagesForCollection(resolvedCategory.items, 'foodItem');
          } 
          
          return resolvedCategory;
        }));
      } 
      // If the response has a flat list of items (as per backend code in prompt)
      else if (response && response.items) {
        console.log('[DEBUG-SERVICE] Response contains direct items array with length:', response.items.length);
        
        // Group items by category as shown in the backend code
        const groupedItems = {};
        
        // Process and group items by category
        for (const item of response.items) {
          const categoryName = item.category ? item.category.name : 'Uncategorized';
          if (!groupedItems[categoryName]) {
            groupedItems[categoryName] = [];
          }
          // Resolve images for the item
          const resolvedItem = await fileService.resolveFoodItemImages(item);
          groupedItems[categoryName].push(resolvedItem);
        }
        
        // Sort categories alphabetically
        const sortedCategories = Object.keys(groupedItems).sort();
        
        // Create categories array in the expected format
        formattedResponse.categories = sortedCategories.map(categoryName => ({
          name: categoryName,
          items: groupedItems[categoryName]
        }));
        
        console.log('[DEBUG-SERVICE] Grouped items into', formattedResponse.categories.length, 'categories');
      } else {
        console.log('[DEBUG-SERVICE] Response does not contain expected data structure:', JSON.stringify(response, null, 2));
        formattedResponse = response; // Return original response if structure is unknown
      }
      
      return formattedResponse;
    } catch (error) {
      console.error('[DEBUG-SERVICE] Error in getFoodItems:', error);
      throw error;
    }
  },

  /**
   * Fetch a specific food item by ID
   * 
   * @param {string} itemId - Food item ID
   * @returns {Promise<Object>} - Food item details
   */
  getFoodItemById: async (itemId) => {
    try {
      const response = await apiService.get(`/food-item-id/${itemId}`);
      
      // Resolve food item images if response contains item data
      if (response && response.item) {
        response.item = await fileService.resolveFoodItemImages(response.item);
      }
      
      return response;
    } catch (error) {
      console.error('Get food item by ID error:', error);
      throw error;
    }
  },

  /**
   * Search for food items by keyword
   * 
   * @param {string} keyword - Search keyword
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} - Search results
   */
  searchFoodItems: async (keyword, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('keyword', keyword);
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add coordinates for nearby search
      if (params.coordinates) {
        queryParams.append('latitude', params.coordinates.latitude);
        queryParams.append('longitude', params.coordinates.longitude);
      }
      
      return await apiService.get(`/food-item/search?${queryParams.toString()}`);
    } catch (error) {
      console.error('Search food items error:', error);
      throw error;
    }
  },

  /**
   * Fetch all categories for a specific branch
   * 
   * @param {string} branchId - Branch ID
   * @returns {Promise<Object>} - Categories for the branch
   */
  getCategories: async (branchId) => {
    try {
      const response = await apiService.get(`/categories/${branchId}`);
      
      // Resolve category images if response contains categories
      if (response && response.categories && Array.isArray(response.categories)) {
        response.categories = await fileService.resolveImagesForCollection(response.categories, 'category');
      }
      
      return response;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },
  getAllCategories: async () => {
    try {
      const response = await apiService.get(`/categories`);
      
      // Resolve category images if response contains categories
      if (response && response.categories && Array.isArray(response.categories)) {
        response.categories = await fileService.resolveImagesForCollection(response.categories, 'category');
      }
      
      return response;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },
  getAllRestaurants: async (params = {}) => {
    // Alias for getRestaurants for backward compatibility
    return restaurantService.getRestaurants(params);
  },
  /**
   * Fetch a specific branch by ID
   * @param {string} branchId - Branch ID
   * @returns {Promise<Object>} - Branch details
   */
  getBranchById: async (branchId) => {
    try {
      const response = await apiService.get(`/branch/${branchId}`);
      // Optionally resolve images if your branch has images
      if (response && response.branch && response.branch.image) {
        response.branch.image = await fileService.downloadFile(response.branch.image);
      }
      return response;
    } catch (error) {
      console.error('Get branch by ID error:', error);
      throw error;
    }
  },
};