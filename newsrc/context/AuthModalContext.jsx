import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const AuthModalContext = createContext();

export const useAuthModal = () => useContext(AuthModalContext);

export const AuthModalProvider = ({ children }) => {
  const { login, verifyOtp, isAuthenticated } = useContext(AuthContext);
  const [modalStep, setModalStep] = useState('none'); // 'none' | 'login' | 'otp'
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  // Utility to validate Indian phone number
  const isValidIndianNumber = (number) => /^[6-9]\d{9}$/.test(number);

  // Utility to validate US phone number (example)
  const isValidUSNumber = (number) => /^\d{10}$/.test(number);

  // Add more country validators as needed...

  // Handler for sending OTP
  const handleSendOTP = async () => {
    const phoneNumber = phone.replace(/\D/g, '');
    let isValid = false;
    let errorMsg = '';

    if (countryCode === '+91') {
      isValid = isValidIndianNumber(phoneNumber);
      errorMsg = 'Please enter a valid Indian mobile number (10 digits, starts with 6-9)';
    } else if (countryCode === '+1') {
      isValid = isValidUSNumber(phoneNumber);
      errorMsg = 'Please enter a valid US phone number (10 digits)';
    } else {
      // Default: just check for 6+ digits
      isValid = phoneNumber.length >= 6;
      errorMsg = 'Please enter a valid phone number';
    }

    if (!isValid) {
      setErrorMessage(errorMsg);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await login(phoneNumber);
      setModalStep('otp');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for verifying OTP
  const handleVerifyOtp = async () => {
    if (otp.length === 6) {
      try {
        setIsSubmitting(true);
        setErrorMessage('');
        const phoneNumber = phone.replace(/\D/g, '');
        const response = await verifyOtp(phoneNumber, otp);
        if (!response || !response.token) {
          throw new Error('Authentication failed. Please try again.');
        }
        setModalStep('none');
        setOtp('');
      } catch (err) {
        setErrorMessage(err.message || 'Invalid OTP. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrorMessage('Please enter a valid 6-digit OTP');
    }
  };

  const openLoginModal = () => {
    setModalStep('login');
    setOtp('');
    setErrorMessage('');
  };
  const closeLoginModal = () => {
    setModalStep('none');
    setOtp('');
    setErrorMessage('');
  };

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem('postLoginRedirect');
      if (redirectPath) {
        navigate(redirectPath);
        localStorage.removeItem('postLoginRedirect');
      }
    }
  }, [isAuthenticated, navigate]);

  return (
    <AuthModalContext.Provider
      value={{
        modalStep,
        setModalStep,
        phone,
        setPhone,
        countryCode,
        setCountryCode,
        isSubmitting,
        setIsSubmitting,
        errorMessage,
        setErrorMessage,
        otp,
        setOtp,
        openLoginModal,
        closeLoginModal,
        handleSendOTP,
        handleVerifyOtp,
        isAuthenticated,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
