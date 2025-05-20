import { apiService } from "./apiServices";
import { getCachedImage } from "../utils/imageCache";

const formatImageSource = (uri) => {
  if (!uri) return null;
  return { uri };
};

export const fileService = {
  /**
   * Download a file by ID and return the cached image URL
   * 
   * @param {string} id - File ID to download
   * @returns {Promise<string|null>} - Cached or direct image URL
   */
  downloadFile: async (id) => {
    try {
      if (!id) return null;
      const response = await apiService.get(`/download/${id}`);
      if (response?.success && response.data) {
        let imageUrl = decodeURIComponent(response.data);
        imageUrl = imageUrl.replace(/%2F/g, '/');
        // BYPASS CACHE: just return the direct URL
        return imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Download file error:', error);
      return null;
    }
  },

  downloadMultipleFiles: async (ids) => {
    try {
      if (!ids || !Array.isArray(ids)) return [];
      const validIds = ids.filter(Boolean);
      const uris = await Promise.all(validIds.map(id => fileService.downloadFile(id)));
      return uris.filter(Boolean);
    } catch (error) {
      console.error('[FileService] Download multiple files error:', error);
      return [];
    }
  },

  resolveRestaurantImages: async (restaurant) => {
    try {
      if (!restaurant) return null;
      const resolvedRestaurant = { ...restaurant };

      if (restaurant.logo) {
        resolvedRestaurant.logoUrl = await fileService.downloadFile(restaurant.logo);
      }
      if (restaurant.coverImage) {
        resolvedRestaurant.coverImageUrl = await fileService.downloadFile(restaurant.coverImage);
      }
      return resolvedRestaurant;
    } catch (error) {
      console.error('[FileService] Resolve restaurant images error:', error);
      return restaurant;
    }
  },

  resolveFoodItemImages: async (foodItem) => {
    try {
      if (!foodItem) return null;
      const resolvedFoodItem = { ...foodItem };

      if (foodItem.image && Array.isArray(foodItem.image)) {
        resolvedFoodItem.imageUrls = await fileService.downloadMultipleFiles(foodItem.image);
        if (resolvedFoodItem.imageUrls?.length > 0) {
          resolvedFoodItem.imageUrl = resolvedFoodItem.imageUrls[0];
        }
      } else if (foodItem.image) {
        resolvedFoodItem.imageUrl = await fileService.downloadFile(foodItem.image);
      }
      return resolvedFoodItem;
    } catch (error) {
      console.error('[FileService] Resolve food item images error:', error);
      return foodItem;
    }
  },

  resolveCategoryImage: async (category) => {
    try {
      if (!category) return null;
      const resolvedCategory = { ...category };

      if (category.image) {
        resolvedCategory.imageUrl = await fileService.downloadFile(category.image);
      }
      return resolvedCategory;
    } catch (error) {
      console.error('[FileService] Resolve category image error:', error);
      return category;
    }
  },

  resolveReviewImages: async (review) => {
    try {
      if (!review) return null;
      const resolvedReview = { ...review };

      if (review.images && Array.isArray(review.images)) {
        resolvedReview.imageUrls = await fileService.downloadMultipleFiles(review.images);
      }
      return resolvedReview;
    } catch (error) {
      console.error('[FileService] Resolve review images error:', error);
      return review;
    }
  },

  resolveImagesForCollection: async (items, type) => {
    try {
      if (!items || !Array.isArray(items)) return [];

      let resolverFunction;
      switch (type?.toLowerCase()) {
        case 'restaurant':
          resolverFunction = fileService.resolveRestaurantImages;
          break;
        case 'fooditem':
          resolverFunction = fileService.resolveFoodItemImages;
          break;
        case 'category':
          resolverFunction = fileService.resolveCategoryImage;
          break;
        case 'review':
          resolverFunction = fileService.resolveReviewImages;
          break;
        default:
          console.error(`[FileService] Unknown item type: ${type}`);
          return items;
      }

      const resolvedItems = await Promise.all(
        items.map(item => resolverFunction(item))
      );

      return resolvedItems.filter(Boolean);
    } catch (error) {
      console.error(`[FileService] Resolve images for ${type} collection error:`, error);
      return items;
    }
  }
};