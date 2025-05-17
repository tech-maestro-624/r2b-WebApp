import React, { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { CartContext } from '../../context/CartContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';

const FloatingCart = () => {
  const { cartItems, isCartOpen, openCartModal, closeCartModal } = useContext(CartContext);
  const { theme } = useContext(ThemeContext);


  if (!cartItems || cartItems.length === 0) return null;
  console.log('Cart items:', cartItems);

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: theme.colors.primary,
          color: theme.colors.buttonText,
          borderRadius: '50%',
          width: 64,
          height: 64,
          boxShadow: 6,
          justifyContent: 'center',
          transition: 'background 0.2s',
          '&:hover': {
            bgcolor: theme.colors.primaryDark || theme.colors.primary,
          },
        }}
        onClick={openCartModal}
      >
        <ShoppingCartIcon sx={{ fontSize: 36 }} />
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: theme.colors.error,
            color: '#fff',
            borderRadius: '50%',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            boxShadow: 2,
          }}
        >
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        </Box>
      </Box>
    </>
  );
};

export default FloatingCart;
 