import { apiService } from './apiServices';
import CircularProgress from '@mui/material/CircularProgress';

// Default fallback values used throughout the service
const DEFAULT_COORDINATES = {
  latitude: 37.4220936,
  longitude: -122.083922,
};
const DEFAULT_ADDRESS_STRING = 'Default Location';

// In‑memory caches to reduce repeated localStorage calls
let selectedAddressCache = null;
let savedAddressesCache = null;

// Helper: get address from coordinates using Google Maps Geocoding API
const API_KEY = 'AIzaSyDA5ZUSnr2u0nw7Hu49Sm4ebhPte7AwiTM'; // <-- Replace with your real API key
const getAddressFromCoordinatesWeb = async (latitude, longitude) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return DEFAULT_ADDRESS_STRING;
  } catch (error) {
    console.error('getAddressFromCoordinates error:', error);
    return DEFAULT_ADDRESS_STRING;
  }
};

/**
 * Location service for handling user location and addresses.
 * All functions handle errors internally and always return a valid, fallback result.
 */
export const locationService = {
  /**
   * Store the selected delivery address.
   * @param {Object} addressData - Address data with coordinates and details.
   * @returns {Promise<Object|null>} Stored address data or null if storing fails.
   */
  storeSelectedAddress: async (addressData) => {
    try {
      if (!addressData || !addressData.coordinates) {
        console.warn('storeSelectedAddress: Invalid address data provided.');
        return null;
      }
      const jsonData = JSON.stringify(addressData);
      localStorage.setItem('selectedDeliveryAddress', jsonData);
      selectedAddressCache = addressData;
      return addressData;
    } catch (error) {
      console.error('storeSelectedAddress error:', error);
      return null;
    }
  },

  /**
   * Get the currently selected delivery address.
   * @returns {Promise<Object|null>} Selected address or null if none is stored.
   */
  getSelectedAddress: async () => {
    try {
      if (selectedAddressCache) {
        return selectedAddressCache;
      }
      const addressData = localStorage.getItem('selectedDeliveryAddress');
      if (addressData) {
        const parsed = JSON.parse(addressData);
        selectedAddressCache = parsed;
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('getSelectedAddress error:', error);
      return null;
    }
  },

  /**
   * Get address details from coordinates using reverse geocoding.
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<string>} Formatted address string or a default address.
   */
  getAddressFromCoordinates: getAddressFromCoordinatesWeb,

  /**
   * Reverse geocode coordinates to get full address information
   * @param {Object} coordinates - Object with latitude and longitude
   * @returns {Promise<Object>} Object containing address information
   */
  reverseGeocode: async (coordinates) => {
    try {
      if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        throw new Error('Invalid coordinates');
      }
      
      const { latitude, longitude } = coordinates;
      const formattedAddress = await getAddressFromCoordinatesWeb(latitude, longitude);
      
      return {
        formattedAddress,
        address: formattedAddress,
        coordinates: {
          latitude,
          longitude
        }
      };
    } catch (error) {
      console.error('reverseGeocode error:', error);
      return {
        formattedAddress: DEFAULT_ADDRESS_STRING,
        address: DEFAULT_ADDRESS_STRING,
        coordinates: coordinates || DEFAULT_COORDINATES,
        error: error.message
      };
    }
  },

  /**
   * Get the current location of the device
   * @returns {Promise<Object>} Location object with coordinates and address
   */
  getCurrentLocation: async () => {
    try {
      // Check if we have a cached location
      const cachedLocation = await locationService.getSelectedAddress();
      if (cachedLocation) {
        return cachedLocation;
      }
      // Use browser Geolocation API
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          resolve({
            coordinates: DEFAULT_COORDINATES,
            address: DEFAULT_ADDRESS_STRING,
            isDefault: true
          });
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const address = await getAddressFromCoordinatesWeb(latitude, longitude);
            const location = {
              coordinates: { latitude, longitude },
              address,
              timestamp: Date.now()
            };
            await locationService.storeSelectedAddress(location);
            resolve(location);
            console.log('Current location:', location);
          },
          (error) => {
            console.error('Geolocation error:', error);
            resolve({
              coordinates: DEFAULT_COORDINATES,
              address: DEFAULT_ADDRESS_STRING,
              isDefault: true
            });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    } catch (error) {
      console.error('LocationService: Get location error:', error);
      return {
        coordinates: DEFAULT_COORDINATES,
        address: DEFAULT_ADDRESS_STRING,
        isDefault: true
      };
    }
  },

  /**
   * Save a new address to localStorage only (no backend call).
   * @param {Object} addressData - Address data including coordinates.
   * @returns {Promise<Object|null>} The saved address or null if saving fails.
   */
  saveAddress: async (addressData) => {
    try {
      if (!addressData || !addressData.coordinates) {
        console.warn('saveAddress: Invalid address data provided.');
        return null;
      }
      // Retrieve or initialize the saved addresses list
      let addresses = [];
      if (savedAddressesCache) {
        addresses = savedAddressesCache;
      } else {
        const savedAddresses = localStorage.getItem('savedAddresses');
        addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
      }
      addresses.push(addressData);
      savedAddressesCache = addresses;
      localStorage.setItem('savedAddresses', JSON.stringify(addresses));
      return addressData;
    } catch (error) {
      console.error('saveAddress error:', error);
      return null;
    }
  },

  /**
   * Get all saved addresses from localStorage only (no backend call).
   * @returns {Promise<Array>} An array of saved addresses (empty array if an error occurs).
   */
  getSavedAddresses: async () => {
    try {
      if (savedAddressesCache) {
        return savedAddressesCache;
      }
      const savedAddresses = localStorage.getItem('savedAddresses');
      if (savedAddresses) {
        const addresses = JSON.parse(savedAddresses);
        savedAddressesCache = addresses;
        return addresses;
      }
      return [];
    } catch (error) {
      console.error('getSavedAddresses error:', error);
      return [];
    }
  },

  /**
   * Set an address as the default address in localStorage only (no backend call).
   * @param {string} addressId - The ID of the address to set as default.
   * @returns {Promise<Object|null>} The updated address or null if updating fails.
   */
  setDefaultAddress: async (addressId) => {
    try {
      let addresses = [];
      const savedAddresses = localStorage.getItem('savedAddresses');
      addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
      addresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId,
      }));
      savedAddressesCache = addresses;
      localStorage.setItem('savedAddresses', JSON.stringify(addresses));
      // Return the address set as default
      return addresses.find(addr => addr._id === addressId) || null;
    } catch (error) {
      console.error('setDefaultAddress error:', error);
      return null;
    }
  },

  /**
   * Delete a saved address from localStorage only (no backend call).
   * @param {string} addressId - The ID of the address to delete.
   * @returns {Promise<boolean>} True if deletion is successful; false otherwise.
   */
  deleteAddress: async (addressId) => {
    try {
      const savedAddresses = localStorage.getItem('savedAddresses');
      const addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
      const updatedAddresses = addresses.filter(addr => addr._id !== addressId);
      savedAddressesCache = updatedAddresses;
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      return true;
    } catch (error) {
      console.error('deleteAddress error:', error);
      return false;
    }
  },

  /**
   * Check if the provided coordinates are within the delivery range of a branch.
   * @param {Object} coordinates - The latitude and longitude to check.
   * @param {string} branchId - The branch ID.
   * @returns {Promise<boolean>} True if within range; false otherwise.
   */
  isWithinDeliveryRange: async (coordinates, branchId) => {
    try {
      const response = await apiService.post('/branches/check-delivery', { coordinates, branchId });
      return response && response.isWithinRange;
    } catch (error) {
      console.error('isWithinDeliveryRange error:', error);
      return false;
    }
  },

  /**
   * Search for places based on a query string.
   * Uses the Google Places API or a similar service.
   * @param {string} query - The search query
   * @returns {Promise<Array>} Array of search results
   */
  searchPlaces: async (query) => {
    try {
      if (!query || query.trim() === '') {
        return [];
      }
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${API_KEY}&types=geocode`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.predictions.length > 0) {
        return data.predictions.map(pred => ({
          id: pred.place_id,
          mainText: pred.structured_formatting.main_text,
          secondaryText: pred.structured_formatting.secondary_text,
          description: pred.description
        }));
      }
      return [];
    } catch (error) {
      console.error('searchPlaces error:', error);
      return [];
    }
  },
  
  /**
   * Get detailed information about a place by its ID.
   * Uses the Google Places API or a similar service.
   * @param {string} placeId - The place ID to get details for
   * @returns {Promise<Object|null>} Place details or null if failed
   */
  getPlaceDetails: async (placeId) => {
    try {
      if (!placeId) {
        return null;
      }
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          id: placeId,
          name: result.name,
          coordinates: result.geometry && result.geometry.location
            ? {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng
              }
            : undefined,
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
        };
      }
      return null;
    } catch (error) {
      console.error('getPlaceDetails error:', error);
      return null;
    }
  },
};
