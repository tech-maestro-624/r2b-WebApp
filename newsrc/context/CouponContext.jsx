import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
export const CouponContext = createContext();

export const CouponProvider = ({ children }) => {
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, description }
  const [availableCoupons, setAvailableCoupons] = useState([]); // List of coupons
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Optionally, fetch available coupons from API on mount
  useEffect(() => {
    // Example: fetch('/api/coupons').then(...)
    // setAvailableCoupons([...]);
  }, []);

  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CouponContext.Provider
      value={{
        appliedCoupon,
        setAppliedCoupon,
        availableCoupons,
        setAvailableCoupons,
        loading,
        setLoading,
        error,
        setError,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};

// Custom hook for easy access
export const useCoupon = () => useContext(CouponContext); 