import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService.js';

// Create consolidated context
const LocationContext = createContext();

// Google Maps API key - moved from LocationModalContext
const GOOGLE_MAPS_API_KEY = 'AIzaSyDA5ZUSnr2u0nw7Hu49Sm4ebhPte7AwiTM';

// Helper: get address from coordinates using Google Maps Geocoding API
const getAddressFromCoordinatesWeb = async (latitude, longitude) => {
  try {
    const API_KEY = GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return '';
  } catch (error) {
    console.error('getAddressFromCoordinates error:', error);
    return '';
  }
};

export const LocationProvider = ({ children }) => {
  // ----- Core Location State (from LocationContext) -----
  const [coordinates, setCoordinates] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  // ----- UI Modal State (from LocationModalContext) -----
  const [openDetectModal, setOpenDetectModal] = useState(false);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [openContinueModal, setOpenContinueModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ----- Delivery Address State (from DeliveryAddressContext) -----
  const [selectedDeliveryAddress, setSelectedDeliveryAddressState] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // ----- Event Handlers and Helper Methods -----

  const handleError = useCallback((error, message) => {
    console.error(message, error);
    setError(message);
    setLoading(false);
  }, []);

  const updateCurrentLocation = useCallback(async (locationData) => {
    try {
      const newCoordinates = locationData.coordinates || locationData;
      const newAddress = locationData.address || locationData.addressDetails || '';
      setCoordinates(newCoordinates);
      setAddress(newAddress);
      localStorage.setItem('lastKnownLocation', JSON.stringify({
        coordinates: newCoordinates,
        address: newAddress,
      }));
    } catch (error) {
      handleError(error, 'Failed to update location');
    }
  }, [handleError]);

  // ----- Location Permission Methods -----

  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions) return null;
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermissionStatus(result.state);
      return result.state === 'granted';
    } catch (error) {
      setError('Failed to check location permission');
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    return checkLocationPermission();
  }, [checkLocationPermission]);

  // ----- Address Management Methods -----

  const refreshLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!navigator.geolocation) {
        return handleError(new Error('Geolocation not supported'), 'Geolocation not supported');
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const formattedAddress = await getAddressFromCoordinatesWeb(latitude, longitude);
          const coords = { latitude, longitude };
          await updateCurrentLocation({ coordinates: coords, address: formattedAddress });
          setLoading(false);
        },
        (error) => {
          handleError(error, 'Failed to get location');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      handleError(error, 'Failed to get location');
    }
  }, [handleError, updateCurrentLocation]);

  const manuallySetLocation = useCallback(async (coordinates, newAddress) => {
    try {
      setLoading(true);
      setError(null);
      await updateCurrentLocation({ coordinates, address: newAddress });
      setLoading(false);
    } catch (error) {
      setError('Failed to set location');
      setLoading(false);
    }
  }, [updateCurrentLocation]);

  const addSavedAddress = useCallback(async (newAddress) => {
    try {
      const formattedAddress = {
        type: newAddress.label?.toLowerCase() || 'other',
        label: newAddress.label || 'Other',
        address: newAddress.address || '',
        formattedAddress: newAddress.formattedAddress || newAddress.address || '',
        flatNumber: newAddress.flatNumber || '',
        landmark: newAddress.landmark || '',
        pincode: newAddress.pincode || '',
        additionalDirections: newAddress.additionalDirections || '',
        latitude: newAddress.latitude || newAddress.coordinates?.latitude,
        longitude: newAddress.longitude || newAddress.coordinates?.longitude,
        timestamp: newAddress.timestamp || Date.now()
      };
      const updatedAddresses = [...savedAddresses, formattedAddress];
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      if (formattedAddress.latitude && formattedAddress.longitude) {
        const coords = {
          latitude: formattedAddress.latitude,
          longitude: formattedAddress.longitude
        };
        await updateCurrentLocation({ 
          coordinates: coords, 
          address: formattedAddress.formattedAddress || formattedAddress.address 
        });
      }
      return formattedAddress;
    } catch (error) {
      setError('Failed to add address');
      return null;
    }
  }, [savedAddresses, updateCurrentLocation]);

  const updateSavedAddress = useCallback(async (index, updatedAddress) => {
    try {
      const updatedAddresses = [...savedAddresses];
      updatedAddresses[index] = updatedAddress;
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    } catch (error) {
      setError('Failed to update address');
    }
  }, [savedAddresses]);

  const deleteSavedAddress = useCallback(async (index) => {
    try {
      const updatedAddresses = savedAddresses.filter((_, i) => i !== index);
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    } catch (error) {
      setError('Failed to delete address');
    }
  }, [savedAddresses]);

  const selectSavedAddress = useCallback(async (index) => {
    try {
      const selectedAddress = savedAddresses[index];
      if (selectedAddress) {
        const coordinates = {
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude
        };
        await manuallySetLocation(coordinates, selectedAddress.address);
      }
    } catch (error) {
      setError('Failed to select address');
    }
  }, [savedAddresses, manuallySetLocation]);

  // ----- Current Location Detection (from LocationModalContext) -----

  const fetchAndSetCurrentLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError('');
    setAddress('');
    setAddressLoading(false);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);
        setGeoLoading(false);
        setAddressLoading(true);
        try {
          const addr = await locationService.getAddressFromCoordinates(coords.lat, coords.lng);
          setAddress(addr);
        } catch (e) {
          setAddress('Unable to fetch address');
        }
        setAddressLoading(false);
      },
      (err) => {
        setGeoError('Could not get your location');
        setGeoLoading(false);
      }
    );
  }, []);

  // ----- Delivery Address Management Methods (from DeliveryAddressContext) -----

  const updateSelectedDeliveryAddress = useCallback(async (address) => {
    console.log('Context: updating selected delivery address to', address);
    await locationService.storeSelectedAddress(address);
    setSelectedDeliveryAddressState(address);
    window.dispatchEvent(new Event('addressChanged'));
  }, []);

  const updateSavedAddresses = useCallback(async (addresses) => {
    localStorage.setItem('savedAddresses', JSON.stringify(addresses));
    setSavedAddresses(addresses);
    window.dispatchEvent(new Event('addressChanged'));
  }, []);

  const refreshAddresses = useCallback(async () => {
    const selected = await locationService.getSelectedAddress();
    setSelectedDeliveryAddressState(selected);
    const addresses = await locationService.getSavedAddresses();
    setSavedAddresses(addresses || []);
  }, []);

  // ----- Initial Data Loading -----

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load saved addresses
        const savedAddressesData = localStorage.getItem('savedAddresses');
        if (savedAddressesData) {
          setSavedAddresses(JSON.parse(savedAddressesData));
        }
        // Load last known location
        const lastKnownLocation = localStorage.getItem('lastKnownLocation');
        if (lastKnownLocation) {
          const { coordinates: savedCoordinates, address: savedAddress } = JSON.parse(lastKnownLocation);
          setCoordinates(savedCoordinates);
          setAddress(savedAddress);
        }

        // Load selected delivery address
        const selected = await locationService.getSelectedAddress();
        setSelectedDeliveryAddressState(selected);
        
        setLoading(false);
      } catch (error) {
        setError('Failed to load saved data');
        setLoading(false);
      }
    };
    loadSavedData();
  }, []);

  // When modal opens, use context location if available, else fetch
  useEffect(() => {
    if (openDetectModal) {
      if (coordinates && coordinates.latitude && coordinates.longitude) {
        const coords = { lat: coordinates.latitude, lng: coordinates.longitude };
        setPosition(coords);
        setAddress(address || '');
      } else {
        fetchAndSetCurrentLocation();
      }
    } else {
      setPosition(null);
      setGeoError('');
      setGeoLoading(false);
      setAddress('');
      setAddressLoading(false);
    }
  }, [openDetectModal, coordinates, address, fetchAndSetCurrentLocation]);

  // If position changes (e.g. after Detect Current Location), fetch address
  useEffect(() => {
    if (position && (!address || address === 'Unable to fetch address')) {
      setAddressLoading(true);
      locationService.getAddressFromCoordinates(position.lat, position.lng)
        .then(addr => setAddress(addr))
        .catch(() => setAddress('Unable to fetch address'))
        .finally(() => setAddressLoading(false));
    }
  }, [position, address]);

  // Listen for addressChanged event (for cross-tab sync)
  useEffect(() => {
    const handleAddressChanged = async () => {
      const selected = await locationService.getSelectedAddress();
      setSelectedDeliveryAddressState(selected);
      const addresses = await locationService.getSavedAddresses();
      setSavedAddresses(addresses || []);
    };
    window.addEventListener('addressChanged', handleAddressChanged);
    return () => window.removeEventListener('addressChanged', handleAddressChanged);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        // Core location state and methods (from LocationContext)
        coordinates,
        address,
        loading,
        error,
        locationPermissionStatus,
        savedAddresses,
        updateCurrentLocation,
        refreshLocation,
        manuallySetLocation,
        addSavedAddress,
        updateSavedAddress,
        deleteSavedAddress,
        selectSavedAddress,
        checkLocationPermission,
        requestLocationPermission,
        
        // Location modal state and methods (from LocationModalContext)
        openDetectModal,
        setOpenDetectModal,
        position,
        geoError,
        geoLoading,
        addressLoading,
        fetchAndSetCurrentLocation,
        
        // Delivery address state and methods (from DeliveryAddressContext)
        selectedDeliveryAddress,
        setSelectedDeliveryAddress: updateSelectedDeliveryAddress,
        setSavedAddresses: updateSavedAddresses,
        refreshAddresses,
        isAddressModalOpen,
        openAddressModal: () => setIsAddressModalOpen(true),
        closeAddressModal: () => setIsAddressModalOpen(false)
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

// Custom hooks for accessing the context from components
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

// Legacy access (same functionality as useLocation, for backward compatibility)
export const useLocationModal = useLocation;
export const useDeliveryAddress = useLocation;

export { LocationContext };