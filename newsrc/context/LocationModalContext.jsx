import React, { createContext, useContext, useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { locationService } from '../services/locationService.js';
import { LocationContext, useLocation } from './LocationContext.jsx';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Snackbar from '@mui/material/Snackbar';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDA5ZUSnr2u0nw7Hu49Sm4ebhPte7AwiTM';

const LocationModalContext = createContext();

export const useLocationModal = () => useContext(LocationModalContext);

export const LocationModalProvider = ({ children }) => {
  const [openDetectModal, setOpenDetectModal] = useState(false);
  const { theme } = useContext(ThemeContext);
  const { coordinates: contextCoordinates, address: contextAddress, refreshLocation } = useContext(LocationContext);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [openContinueModal, setOpenContinueModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addSavedAddress } = useLocation();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Helper to fetch and set current location
  const fetchAndSetCurrentLocation = async () => {
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
  };

  // When modal opens, use context location if available, else fetch
  useEffect(() => {
    if (openDetectModal) {
      if (contextCoordinates && contextCoordinates.latitude && contextCoordinates.longitude) {
        const coords = { lat: contextCoordinates.latitude, lng: contextCoordinates.longitude };
        setPosition(coords);
        setAddress(contextAddress || '');
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
  }, [openDetectModal, contextCoordinates, contextAddress]);

  // If position changes (e.g. after Detect Current Location), fetch address
  useEffect(() => {
    if (position && (!address || address === 'Unable to fetch address')) {
      setAddressLoading(true);
      locationService.getAddressFromCoordinates(position.lat, position.lng)
        .then(addr => setAddress(addr))
        .catch(() => setAddress('Unable to fetch address'))
        .finally(() => setAddressLoading(false));
    }
  }, [position]);

  return (
    <LocationModalContext.Provider value={{
      openDetectModal,
      setOpenDetectModal,
    }}>
      {/* Removed Detect Current Location Modal and Continue Modal */}
      {children}
    </LocationModalContext.Provider>
  );
};
