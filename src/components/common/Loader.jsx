import React, { useContext } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeContext } from '../../context/ThemeContext';

const Loader = ({ fullPage = false, size = 64, thickness = 4 }) => {
  const { theme } = useContext(ThemeContext);
 
  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: theme.colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s',
        }}
      >
        <CircularProgress
          sx={{ color: theme.colors.primary }}
          size={size}
          thickness={thickness}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress
        sx={{ color: theme.colors.primary }}
        size={size}
        thickness={thickness}
      />
    </div>
  );
};

export default Loader; 