import React from 'react';
import CartStatusModal from '../modals/CartStatusModal';
import AddressModalManager from '../modals/AddressModalManager';
import SnackbarManager from '../modals/SnackbarManager';
import GlobalAuthModals from '../modals/GlobalAuthModals';

// Modals component to keep them separate from the routing
const Modals = () => {
  return (
    <>
      <GlobalAuthModals />
      <CartStatusModal />
      <AddressModalManager />
      <SnackbarManager />
    </>
  );
};

export default Modals; 