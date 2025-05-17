import React, { useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext';

// Country selection options
const COUNTRY_OPTIONS = [
  { value: '+91', flag: '🇮🇳' },
  { value: '+1', flag: '🇺🇸' },
  { value: '+44', flag: '🇬🇧' },
  { value: '+61', flag: '🇦🇺' },
  { value: '+81', flag: '🇯🇵' },
  { value: '+49', flag: '🇩🇪' },
  { value: '+971', flag: '🇦🇪' },
  { value: '+92', flag: '🇵🇰' },
  { value: '+880', flag: '🇧🇩' },
  { value: '+86', flag: '🇨🇳' }
];

const GlobalAuthModals = () => {
  const { theme } = useContext(ThemeContext);
  const {
    modalStep,
    phone,
    setPhone,
    countryCode,
    setCountryCode,
    isSubmitting,
    errorMessage,
    otp,
    setOtp,
    closeLoginModal,
    handleSendOTP,
    handleVerifyOtp,
  } = useAuth();

  // Common dialog paper props
  const dialogPaperProps = {
    sx: {
      bgcolor: theme.modal.background,
      color: theme.modal.text,
      borderRadius: theme.modal.borderRadius,
      boxShadow: theme.modal.boxShadow,
    }
  };

  // Common dialog title styles
  const titleStyles = {
    position: 'relative',
    bgcolor: theme.modal.background,
    color: theme.modal.text,
    minHeight: 0,
    py: 2,
    textAlign: 'center',
  };

  // Common close button styles
  const closeButtonStyles = {
    color: theme.modalCloseIcon.color,
    position: 'absolute',
    right: 8,
    top: 8,
  };

  // Common submit button styles
  const submitButtonStyles = {
    fontWeight: 600,
    fontSize: 20,
    borderRadius: theme.modalButton.borderRadius,
    py: 1.5,
    boxShadow: 'none',
    bgcolor: theme.modalButton.primary,
    color: theme.modalButton.primaryText,
    '&:hover': { bgcolor: theme.modalButton.primary }
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog 
        open={modalStep === 'login'} 
        onClose={closeLoginModal} 
        maxWidth="xs" 
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogTitle sx={titleStyles}>
          <Box sx={{ fontWeight: 700, fontSize: 24, width: '100%' }}>
            Login
          </Box>
          <IconButton
            onClick={closeLoginModal}
            size="large"
            sx={closeButtonStyles}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background }}>
          <Box sx={{ display: 'flex', width: '100%', mb: 3, gap: 1 }}>
            <TextField
              select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              variant="outlined"
              sx={{
                minWidth: 90,
                bgcolor: theme.colors?.inputBackground || theme.modal.background,
                textAlign: 'center',
                fontSize: 24,
                fontFamily: `'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif`
              }}
            >
              {COUNTRY_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.flag}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ bgcolor: theme.colors?.inputBackground || theme.modal.background }}
              inputProps={{ maxLength: 15 }}
            />
          </Box>
          {errorMessage && (
            <Typography sx={{ color: theme.colors?.error || 'red', mb: 2 }}>
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.modal.background, pb: 3, px: 3 }}>
          <Button
            variant="contained"
            fullWidth
            sx={submitButtonStyles}
            onClick={handleSendOTP}
            disabled={isSubmitting}
          >
            Send OTP
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Modal */}
      <Dialog 
        open={modalStep === 'otp'} 
        onClose={closeLoginModal} 
        maxWidth="xs" 
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogTitle sx={titleStyles}>
          <Box sx={{ fontWeight: 700, fontSize: 24, width: '100%' }}>
            Enter OTP
          </Box>
          <IconButton
            onClick={closeLoginModal}
            size="large"
            sx={closeButtonStyles}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.modal.background }}>
          <TextField
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            variant="outlined"
            fullWidth
            sx={{ 
              bgcolor: theme.colors?.inputBackground || theme.modal.background, 
              mb: 3, 
              letterSpacing: 4, 
              textAlign: 'center' 
            }}
            inputProps={{ 
              maxLength: 6, 
              style: { 
                textAlign: 'center', 
                letterSpacing: 4, 
                fontSize: 20 
              } 
            }}
          />
          {errorMessage && (
            <Typography sx={{ color: theme.colors?.error || 'red', mb: 2 }}>
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.modal.background, pb: 3, px: 3 }}>
          <Button
            variant="contained"
            fullWidth
            sx={submitButtonStyles}
            onClick={handleVerifyOtp}
            disabled={isSubmitting}
          >
            Verify OTP
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GlobalAuthModals; 