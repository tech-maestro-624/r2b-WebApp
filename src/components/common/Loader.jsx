import React from 'react';
import { Box, CircularProgress } from '@mui/material';

// Global loader component
const Loader = ({ fullPage }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: fullPage ? '100vh' : '300px',
    width: fullPage ? '100vw' : '100%',
    position: fullPage ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    bgcolor: fullPage ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: fullPage ? 'none' : 'blur(3px)',
    zIndex: fullPage ? 9999 : 10,
  }}>
    <CircularProgress sx={{ color: '#FF5A33' }} size={fullPage ? 50 : 40} thickness={fullPage ? 5 : 4} />
  </Box>
);

export default Loader; 