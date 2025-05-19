import React, { createContext, useState, useContext, useEffect } from 'react';

const LocationContext = createContext();

// Helper: get address from coordinates using Google Maps Geocoding API
const getAddressFromCoordinatesWeb = async (latitude, longitude) => {
  try {
    // You need to provide your own Google Maps Geocoding API key
    const API_KEY = 'AIzaSyDA5ZUSnr2u0nw7Hu49Sm4ebhPte7AwiTM';
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
  const [coordinates, setCoordinates] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const handleError = (error, message) => {
    console.error(message, error);
    setError(message);
    setLoading(false);
  };

  const updateCurrentLocation = async (locationData) => {
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
  };

  const checkLocationPermission = async () => {
    // The browser will prompt for permission when geolocation is used
    // We can only check if permission was granted/denied after a request
    if (!navigator.permissions) return null;
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermissionStatus(result.state);
      return result.state === 'granted';
    } catch (error) {
      setError('Failed to check location permission');
      return false;
    }
  };

  const requestLocationPermission = async () => {
    // The browser will prompt for permission when geolocation is used
    // We can only check if permission was granted/denied after a request
    return checkLocationPermission();
  };

  const refreshLocation = async () => {
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
  };

  const manuallySetLocation = async (coordinates, newAddress) => {
    try {
      setLoading(true);
      setError(null);
      await updateCurrentLocation({ coordinates, address: newAddress });
      setLoading(false);
    } catch (error) {
      setError('Failed to set location');
      setLoading(false);
    }
  };

  const addSavedAddress = async (newAddress) => {
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
  };

  const updateSavedAddress = async (index, updatedAddress) => {
    try {
      const updatedAddresses = [...savedAddresses];
      updatedAddresses[index] = updatedAddress;
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    } catch (error) {
      setError('Failed to update address');
    }
  };

  const deleteSavedAddress = async (index) => {
    try {
      const updatedAddresses = savedAddresses.filter((_, i) => i !== index);
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    } catch (error) {
      setError('Failed to delete address');
    }
  };

  const selectSavedAddress = async (index) => {
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
  };

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
        setLoading(false);
      } catch (error) {
        setError('Failed to load saved data');
        setLoading(false);
      }
    };
    loadSavedData();
  }, []);

  return (
    <LocationContext.Provider
      value={{
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
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export {LocationContext};