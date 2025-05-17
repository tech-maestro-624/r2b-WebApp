import React, { useState, useEffect, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useEventBus } from '../../providers/EventBusProvider';

// Snackbar Manager - handles notifications
const SnackbarManager = () => {
  const eventBus = useEventBus();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Listen for snackbar events from other components
  useEffect(() => {
    if (!eventBus) return;
    
    const unsubscribe = eventBus.subscribe('showSnackbar', (data) => {
      setSnackbar({ 
        open: true, 
        message: data.message, 
        severity: data.severity 
      });
    });
    
    return unsubscribe;
  }, [eventBus]);
  
  const handleClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);
  
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <MuiAlert
        elevation={6}
        variant="filled"
        onClose={handleClose}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </MuiAlert>
    </Snackbar>
  );
};

export default SnackbarManager; 