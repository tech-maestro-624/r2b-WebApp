import { apiService } from './apiServices';

// Accept coordinates as an optional parameter if needed
export const searchFoodItems = async (keyword, coordinates) => {
  try {
    const params = new URLSearchParams();
    params.append('keyword', keyword);
    if (coordinates) {
      if (coordinates.latitude) params.append('latitude', coordinates.latitude);
      if (coordinates.longitude) params.append('longitude', coordinates.longitude);
    }
    const res = await apiService.get(`/food-item/search?${params.toString()}`);
    
    // Flatten the instances and attach parent dishName
    const flattenedItems = res.foodItems?.flatMap(item => 
      item.instances.map(instance => ({
        ...instance,
        dishName: item.dishName
      }))
    ) || [];

    return flattenedItems;
  } catch (error) {
    console.error('Search food API failed:', error.message);
    return [];
  }
};


