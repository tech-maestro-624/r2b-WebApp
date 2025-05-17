import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, List, ListItem, Button, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { locationService } from '../../services/locationService';
import { useEventBus } from '../../providers/EventBusProvider';

// Address Modal Manager - handles address-related functionality
const AddressModalManager = () => {
  const { theme } = useContext(ThemeContext);
  const eventBus = useEventBus();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressState, setAddressState] = useState({
    savedAddresses: [],
    selectedAddress: null,
    selectedDeliveryAddress: null,
    locationAddress: '',
    isLoading: false,
    loadingAddressId: null,
    hasLoadedAddresses: false
  });
  
  // Event listener for opening address modal from other components
  useEffect(() => {
    if (!eventBus) return;
    
    const unsubscribe = eventBus.subscribe('openAddressModal', () => {
      setShowAddressModal(true);
    });
    
    return unsubscribe;
  }, [eventBus]);
  
  // Load addresses when modal opens (with caching optimization)
  useEffect(() => {
    if (showAddressModal && !addressState.hasLoadedAddresses) {
      const fetchAddresses = async () => {
        try {
          setAddressState(prev => ({ ...prev, isLoading: true }));
          
          const selected = await locationService.getSelectedAddress();
          const addresses = await locationService.getSavedAddresses();
          
          setAddressState(prev => ({
            ...prev,
            savedAddresses: addresses || [],
            selectedDeliveryAddress: selected,
            locationAddress: selected?.formattedAddress || selected?.address || '',
            hasLoadedAddresses: true,
            isLoading: false
          }));
        } catch (error) {
          console.error('Error loading addresses:', error);
          setAddressState(prev => ({ ...prev, isLoading: false }));
        }
      };
      
      fetchAddresses();
    }
  }, [showAddressModal, addressState.hasLoadedAddresses]);
  
  const handleAddressSelection = useCallback(async (addr) => {
    if (!eventBus) return;
    
    // Validate address
    if (!addr || (!addr.coordinates && !addr.latitude && !addr.longitude)) {
      eventBus.publish('showSnackbar', { 
        message: 'Invalid address selection. Missing coordinates.',
        severity: 'error'
      });
      return;
    }
    
    // Set loading state for the specific address
    setAddressState(prev => ({ 
      ...prev, 
      isLoading: true,
      loadingAddressId: addr._id || JSON.stringify(addr.coordinates || {})
    }));
    
    try {
      const addressToStore = {
        ...addr,
        coordinates: {
          latitude: addr.latitude || (addr.coordinates && addr.coordinates.latitude),
          longitude: addr.longitude || (addr.coordinates && addr.coordinates.longitude)
        }
      };
      
      await locationService.storeSelectedAddress(addressToStore);
      
      setAddressState(prev => ({ 
        ...prev, 
        selectedAddress: addr,
        selectedDeliveryAddress: addressToStore,
        locationAddress: addressToStore.formattedAddress || addressToStore.address,
        isLoading: false,
        loadingAddressId: null
      }));
      
      setShowAddressModal(false);
      
      // Notify other components about address selection
      eventBus.publish('showSnackbar', { 
        message: 'Delivery address selected!', 
        severity: 'success' 
      });
      
      // Notify about address selection (for sidebar closing)
      eventBus.publish('addressSelected');
    } catch (error) {
      console.error('Error selecting address:', error);
      setAddressState(prev => ({ 
        ...prev, 
        isLoading: false,
        loadingAddressId: null
      }));
      
      eventBus.publish('showSnackbar', { 
        message: 'Failed to set delivery address', 
        severity: 'error' 
      });
    }
  }, [eventBus]);
  
  const { savedAddresses, isLoading, loadingAddressId } = addressState;
  
  return (
    <Dialog
      open={showAddressModal}
      onClose={() => !isLoading && setShowAddressModal(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.modal.background,
          color: theme.modal.text,
          borderRadius: theme.modal.borderRadius,
          boxShadow: theme.modal.boxShadow,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        bgcolor: theme.modal.background, 
        color: theme.modal.text, 
        minHeight: 0, 
        py: 1, 
        borderRadius: `${theme.modal.borderRadius}px ${theme.modal.borderRadius}px 0 0` 
      }}>
        <IconButton 
          onClick={() => !isLoading && setShowAddressModal(false)} 
          size="large"
          disabled={isLoading}
          sx={{ color: theme.modalCloseIcon.color }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: theme.modal.background }}>
        <Typography variant="h6" sx={{ mb: 2, color: theme.modal.text, textAlign: 'center' }}>
          Saved Delivery Addresses
        </Typography>
        {isLoading && !loadingAddressId && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={40} sx={{ color: theme.colors.primary }} />
          </Box>
        )}
        {!isLoading && savedAddresses.length === 0 ? (
          <Typography sx={{ color: theme.colors.secondaryText, textAlign: 'center' }}>
            No saved addresses found.
          </Typography>
        ) : (
          <List>
            {savedAddresses.map((addr, idx) => {
              const isAddressLoading = loadingAddressId === (addr._id || JSON.stringify(addr.coordinates || {}));
              const hasCoordinates = addr.coordinates || (addr.latitude && addr.longitude);
              
              return (
                <ListItem 
                  key={idx} 
                  sx={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    mb: 1,
                    opacity: !hasCoordinates ? 0.6 : 1
                  }}
                  secondaryAction={
                    isAddressLoading ? (
                      <CircularProgress size={24} sx={{ color: theme.colors.primary, mr: 2 }} />
                    ) : (
                      <Button
                        variant="contained"
                        disabled={!hasCoordinates || isLoading}
                        sx={{
                          bgcolor: theme.modalButton.primary,
                          color: theme.modalButton.primaryText,
                          borderRadius: theme.modalButton.borderRadius,
                          fontWeight: 500,
                          fontSize: 14,
                          py: 0.5,
                          px: 2,
                          minWidth: 70,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: theme.modalButton.primary },
                          '&.Mui-disabled': {
                            bgcolor: '#cccccc',
                            color: '#666666'
                          }
                        }}
                        onClick={() => handleAddressSelection(addr)}
                      >
                        Deliver Here
                      </Button>
                    )
                  }
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: theme.modal.text }}>
                      {addr.label || addr.type || 'Address'}
                    </Typography>
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14 }}>
                      {addr.formattedAddress || addr.address}
                    </Typography>
                    {addr.pincode && (
                      <Typography sx={{ color: theme.colors.secondaryText, fontSize: 13 }}>
                        Pincode: {addr.pincode}
                      </Typography>
                    )}
                    {!hasCoordinates && (
                      <Typography sx={{ color: theme.colors.error, fontSize: 12, mt: 1 }}>
                        Invalid address: Missing coordinates
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddressModalManager; 