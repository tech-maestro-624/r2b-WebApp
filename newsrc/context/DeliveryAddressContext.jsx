import React, { createContext, useContext, useEffect, useState } from 'react';
import { locationService } from '../services/locationService';

const DeliveryAddressContext = createContext();

export const useDeliveryAddress = () => useContext(DeliveryAddressContext);

export const DeliveryAddressProvider = ({ children }) => {
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  // Modal state for Saved Delivery Address Modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    (async () => {
      const selected = await locationService.getSelectedAddress();
      setSelectedDeliveryAddress(selected);
      const addresses = await locationService.getSavedAddresses();
      setSavedAddresses(addresses || []);
    })();
  }, []);

  // Listen for addressChanged event (for cross-tab sync)
  useEffect(() => {
    const handleAddressChanged = async () => {
      const selected = await locationService.getSelectedAddress();
      setSelectedDeliveryAddress(selected);
      const addresses = await locationService.getSavedAddresses();
      setSavedAddresses(addresses || []);
    };
    window.addEventListener('addressChanged', handleAddressChanged);
    return () => window.removeEventListener('addressChanged', handleAddressChanged);
  }, []);

  // Helper to update selected address and fire event
  const updateSelectedAddress = async (address) => {
    console.log('Context: updating selected address to', address);
    await locationService.storeSelectedAddress(address);
    setSelectedDeliveryAddress(address);
    window.dispatchEvent(new Event('addressChanged'));
  };

  // Helper to update saved addresses and fire event
  const updateSavedAddresses = async (addresses) => {
    localStorage.setItem('savedAddresses', JSON.stringify(addresses));
    setSavedAddresses(addresses);
    window.dispatchEvent(new Event('addressChanged'));
  };

  return (
    <DeliveryAddressContext.Provider value={{
      selectedDeliveryAddress,
      savedAddresses,
      setSelectedDeliveryAddress: updateSelectedAddress,
      setSavedAddresses: updateSavedAddresses,
      refreshAddresses: async () => {
        const selected = await locationService.getSelectedAddress();
        setSelectedDeliveryAddress(selected);
        const addresses = await locationService.getSavedAddresses();
        setSavedAddresses(addresses || []);
      },
      // Modal state and handlers
      isAddressModalOpen,
      openAddressModal: () => setIsAddressModalOpen(true),
      closeAddressModal: () => setIsAddressModalOpen(false)
    }}>
      {children}
    </DeliveryAddressContext.Provider>
  );
};
