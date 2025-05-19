import React from 'react';
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
import { useTheme } from '@mui/material/styles';
import { useAuthModal } from '../context/AuthModalContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import MenuItem from '@mui/material/MenuItem';

const GlobalAuthModals = () => {
  // Use ThemeContext for modal theming
  const { theme } = React.useContext(ThemeContext);
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
  } = useAuthModal();

  const modalTheme = theme;

  return (
    <>
      {/* Login Modal */}
      <Dialog open={modalStep === 'login'} onClose={closeLoginModal} maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            bgcolor: modalTheme.modal.background,
            color: modalTheme.modal.text,
            borderRadius: modalTheme.modal.borderRadius,
            boxShadow: modalTheme.modal.boxShadow,
          }
        }}
      >
        <DialogTitle
          sx={{
            position: 'relative',
            bgcolor: modalTheme.modal.background,
            color: modalTheme.modal.text,
            minHeight: 0,
            py: 2,
            textAlign: 'center',
          }}
        >
          <Box sx={{ fontWeight: 700, fontSize: 24, width: '100%' }}>
            Login
          </Box>
          <IconButton
            onClick={closeLoginModal}
            size="large"
            sx={{
              color: modalTheme.modalCloseIcon.color,
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: modalTheme.modal.background }}>
          <Box sx={{ display: 'flex', width: '100%', mb: 3, gap: 1 }}>
            <TextField
              select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              variant="outlined"
              sx={{
                minWidth: 90,
                bgcolor: modalTheme.colors?.inputBackground || modalTheme.modal.background,
                textAlign: 'center',
                fontSize: 24,
                fontFamily: `'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif`
              }}
            >
              <MenuItem value="+91">🇮🇳</MenuItem>
              <MenuItem value="+1">🇺🇸</MenuItem>
              <MenuItem value="+44">🇬🇧</MenuItem>
              <MenuItem value="+61">🇦🇺</MenuItem>
              <MenuItem value="+81">🇯🇵</MenuItem>
              <MenuItem value="+49">🇩🇪</MenuItem>
              <MenuItem value="+971">🇦🇪</MenuItem>
              <MenuItem value="+92">🇵🇰</MenuItem>
              <MenuItem value="+880">🇧🇩</MenuItem>
              <MenuItem value="+86">🇨🇳</MenuItem>
            </TextField>
            <TextField
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ bgcolor: modalTheme.colors?.inputBackground || modalTheme.modal.background }}
              inputProps={{ maxLength: 15 }}
            />
          </Box>
          {errorMessage && <Typography sx={{ color: modalTheme.colors?.error || 'red', mb: 2 }}>{errorMessage}</Typography>}
        </DialogContent>
        <DialogActions sx={{ bgcolor: modalTheme.modal.background, pb: 3, px: 3 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              fontWeight: 600,
              fontSize: 20,
              borderRadius: modalTheme.modalButton.borderRadius,
              py: 1.5,
              boxShadow: 'none',
              bgcolor: modalTheme.modalButton.primary,
              color: modalTheme.modalButton.primaryText,
              '&:hover': { bgcolor: modalTheme.modalButton.primary }
            }}
            onClick={handleSendOTP}
            disabled={isSubmitting}
          >
            Send OTP
          </Button>
        </DialogActions>
      </Dialog>
      {/* OTP Modal */}
      <Dialog open={modalStep === 'otp'} onClose={closeLoginModal} maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            bgcolor: modalTheme.modal.background,
            color: modalTheme.modal.text,
            borderRadius: modalTheme.modal.borderRadius,
            boxShadow: modalTheme.modal.boxShadow,
          }
        }}
      >
        <DialogTitle
          sx={{
            position: 'relative',
            bgcolor: modalTheme.modal.background,
            color: modalTheme.modal.text,
            minHeight: 0,
            py: 2,
            textAlign: 'center',
          }}
        >
          <Box sx={{ fontWeight: 700, fontSize: 24, width: '100%' }}>
            Enter OTP
          </Box>
          <IconButton
            onClick={closeLoginModal}
            size="large"
            sx={{
              color: modalTheme.modalCloseIcon.color,
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: modalTheme.modal.background }}>
          <TextField
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            variant="outlined"
            fullWidth
            sx={{ bgcolor: modalTheme.colors?.inputBackground || modalTheme.modal.background, mb: 3, letterSpacing: 4, textAlign: 'center' }}
            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4, fontSize: 20 } }}
          />
          {errorMessage && <Typography sx={{ color: modalTheme.colors?.error || 'red', mb: 2 }}>{errorMessage}</Typography>}
        </DialogContent>
        <DialogActions sx={{ bgcolor: modalTheme.modal.background, pb: 3, px: 3 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              fontWeight: 600,
              fontSize: 20,
              borderRadius: modalTheme.modalButton.borderRadius,
              py: 1.5,
              boxShadow: 'none',
              bgcolor: modalTheme.modalButton.primary,
              color: modalTheme.modalButton.primaryText,
              '&:hover': { bgcolor: modalTheme.modalButton.primary }
            }}
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