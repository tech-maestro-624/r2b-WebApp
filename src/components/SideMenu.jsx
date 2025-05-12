import React, { useContext } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SupportIcon from '@mui/icons-material/Support';
import { ThemeContext } from '../context/ThemeContext.jsx';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import OrdersPage from '../pages/OrdersPage';
import { locationService } from '../services/locationService';
import Button from '@mui/material/Button';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import Switch from '@mui/material/Switch';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DialogActions from '@mui/material/DialogActions';
import { AuthContext } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext';
import LogoutIcon from '@mui/icons-material/Logout';
import { couponService } from '../services/couponService';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAddress } from '../context/DeliveryAddressContext';

const FAQData = [
  {
    category: 'Order Related',
    items: [
      {
        question: 'How do I track my order?',
        answer: 'You can track your order in real-time by clicking on the "My Orders" section. There you\'ll see your active order with its current status and location on the map.'
      },
      {
        question: 'How can I cancel my order?',
        answer: 'You can cancel your order within 5 minutes of placing it by going to "My Orders" and selecting "Cancel Order". After 5 minutes, please contact our support team for assistance.'
      },
      {
        question: 'What if I receive the wrong order?',
        answer: 'If you receive an incorrect order, please contact our support team immediately through the app or call our helpline. We\'ll ensure you receive the correct order or process a refund.'
      }
    ]
  },
  {
    category: 'Payment & Refunds',
    items: [
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept credit/debit cards, UPI, net banking, and cash on delivery. All online payments are processed through secure payment gateways.'
      },
      {
        question: 'How long does it take to process a refund?',
        answer: 'Refunds typically take 5-7 business days to reflect in your account, depending on your bank\'s processing time.'
      },
      {
        question: 'Can I change my payment method after placing an order?',
        answer: 'Payment method can only be changed before confirming the order. Once an order is placed, the payment method cannot be modified.'
      }
    ]
  },
  {
    category: 'Account & Profile',
    items: [
      {
        question: 'How do I update my delivery address?',
        answer: 'Go to Profile > Addresses to add, edit, or remove delivery addresses. You can also save multiple addresses for quick selection during checkout.'
      },
      {
        question: 'How can I change my phone number?',
        answer: 'To update your phone number, go to Profile > Edit Profile. You\'ll need to verify the new number through OTP verification.'
      }
    ]
  },
  {
    category: 'Delivery',
    items: [
      {
        question: 'What are the delivery hours?',
        answer: 'Our delivery hours vary by restaurant. Most restaurants deliver from 10 AM to 10 PM. Check individual restaurant pages for specific timing.'
      },
      {
        question: 'How is the delivery fee calculated?',
        answer: 'Delivery fees are calculated based on distance, order value, and current demand. The exact fee will be shown before you confirm your order.'
      }
    ]
  }
];

const SideMenu = ({
  open,
  onClose,
  user,
  isAuthenticated,
  openLoginModal,
  showSnackbar,
  showOrdersModal,
  setShowOrdersModal,
  handleOpenAddressModal,
  openAddressModal
}) => {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);  
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [orderUpdatesEnabled, setOrderUpdatesEnabled] = React.useState(true);
  const [specialOffersEnabled, setSpecialOffersEnabled] = React.useState(true);
  const { logout } = useContext(AuthContext);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [showCouponsModal, setShowCouponsModal] = React.useState(false);
  const [coupons, setCoupons] = React.useState([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');
  const [copiedCode, setCopiedCode] = React.useState('');
  const [showCopySnackbar, setShowCopySnackbar] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [expandedCategory, setExpandedCategory] = React.useState(false);
  const [faqSearch, setFaqSearch] = React.useState('');
  const [expandedQuestion, setExpandedQuestion] = React.useState({});
  const { savedAddresses, setSavedAddresses, selectedDeliveryAddress, setSelectedDeliveryAddress } = useDeliveryAddress();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'warning' });
  const [showAddressModal, setShowAddressModal] = React.useState(false);

  React.useEffect(() => {
    if (showSettingsModal) {
      (async () => {
        const addresses = await locationService.getSavedAddresses();
        setSavedAddresses(addresses || []);
      })();
    }
  }, [showSettingsModal]);

  React.useEffect(() => {
    if (showCouponsModal) {
      setLoadingCoupons(true);
      setCouponError('');
      couponService.getCoupons()
        .then(res => {
          setCoupons(res?.coupons || res?.data || []);
          setLoadingCoupons(false);
        })
        .catch(err => {
          setCouponError('Failed to load coupons.');
          setLoadingCoupons(false);
        });
    }
  }, [showCouponsModal]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setShowCopySnackbar(true);
    setTimeout(() => setShowCopySnackbar(false), 1500);
  };

  function getDaysLeft(validTo) {
    const now = new Date();
    const end = new Date(validTo);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleMyOrdersClick = () => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please login to view Orders',
        severity: 'warning'
      });
      return;
    }
    navigate('/orders');
  };

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            bgcolor: theme.colors.sidebarBackground,
            color: theme.colors.sidebarText,
            borderRight: `1.5px solid ${theme.colors.sidebarBorder}`,
          },
        }}
      >
        <Box
          sx={{
            width: 260,
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.colors.sidebarBackground,
            color: theme.colors.sidebarText,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={onClose} sx={{ color: theme.colors.sidebarIcon }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="h6" sx={{ mt: 2, mb: 1, color: theme.colors.sidebarText }}>
            Hello {user && user.name ? user.name : 'Guest'}
          </Typography>
          <List sx={{ mt: 2 }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onClose();
                  handleMyOrdersClick();
                }}
                sx={{ color: theme.colors.sidebarText }}
              >
                <ListItemIcon sx={{ color: theme.colors.sidebarIcon }}>
                  <ShoppingBagIcon />
                </ListItemIcon>
                <ListItemText primary="My Orders" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setShowAddressModal(true)}
                sx={{ color: theme.colors.sidebarText }}
              >
                <ListItemIcon sx={{ color: theme.colors.sidebarIcon }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Delivery Address" />
              </ListItemButton>
            </ListItem>
            {/* Add Raise a Ticket menu item */}
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => {
                  onClose();
                  if (!isAuthenticated) {
                    localStorage.setItem('postLoginRedirect', '/tickets');
                    setSnackbar({
                      open: true,
                      message: 'Please login to raise a ticket',
                      severity: 'warning'
                    });
                    openLoginModal();
                  } else {
                    navigate('/tickets');
                  }
                }} 
                sx={{ color: theme.colors.sidebarText }}
              >
                <ListItemIcon sx={{ color: theme.colors.sidebarIcon }}>
                  <SupportIcon />
                </ListItemIcon>
                <ListItemText primary="Raise a Ticket" />
              </ListItemButton>
            </ListItem>
            {/* Coupons */}
            <ListItem disablePadding>
              <ListItemButton sx={{ color: theme.colors.sidebarText }} onClick={() => {
                onClose();
                setShowCouponsModal(true);
              }}>
                <ListItemIcon sx={{ color: theme.colors.sidebarIcon }}>
                  <LocalOfferIcon />
                </ListItemIcon>
                <ListItemText primary="Coupons" />
              </ListItemButton>
            </ListItem>
            {/* Settings */}
            <ListItem disablePadding>
              <ListItemButton sx={{ color: theme.colors.sidebarText }} onClick={() => {
                onClose();
                setShowSettingsModal(true);
              }}>
                <ListItemIcon sx={{ color: theme.colors.sidebarIcon }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
            {/* Help and FAQ */}
            <ListItem disablePadding>
              <ListItemButton sx={{ color: theme.colors.sidebarText }} onClick={() => {
                onClose();
                setShowHelpModal(true);
              }}>
                <ListItemIcon sx={{ color: theme.colors.sidebarIcon }}>
                  <HelpOutlineIcon />
                </ListItemIcon>
                <ListItemText primary="Help and FAQ" />
              </ListItemButton>
            </ListItem>
            {/* Login (as its own menu item if not authenticated) */}
            {!isAuthenticated && (
              <ListItem disablePadding>
                <ListItemButton
                  sx={{ color: theme.colors.primary }}
                  onClick={() => {
                    onClose();
                    openLoginModal();
                  }}
                >
                  <ListItemIcon sx={{ color: theme.colors.primary }}>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItemButton>
              </ListItem>
            )}
            {/* Logout (as its own menu item) */}
            {isAuthenticated && (
              <ListItem disablePadding>
                <ListItemButton
                  sx={{ color: theme.colors.error }}
                  onClick={() => {
                    onClose();
                    setShowLogoutModal(true);
                  }}
                >
                  <ListItemIcon sx={{ color: theme.colors.error }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onClose={() => setShowSettingsModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
          Settings
          <IconButton onClick={() => setShowSettingsModal(false)} size="large" sx={{ color: theme.colors.secondaryText }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.colors.card }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
            <Typography sx={{ color: theme.colors.text, fontWeight: 500, fontSize: 16 }}>
              Order Updates
            </Typography>
            <Switch
              checked={orderUpdatesEnabled}
              onChange={e => setOrderUpdatesEnabled(e.target.checked)}
              color="primary"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
            <Typography sx={{ color: theme.colors.text, fontWeight: 500, fontSize: 16 }}>
              Special Offers
            </Typography>
            <Switch
              checked={specialOffersEnabled}
              onChange={e => setSpecialOffersEnabled(e.target.checked)}
              color="primary"
            />
          </Box>
          {/* Dark/Light Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
            <Typography sx={{ color: theme.colors.text, fontWeight: 500, fontSize: 16 }}>
              Dark Mode
            </Typography>
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              color="primary"
            />
          </Box>
          {/* Saved Addresses Menu */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, cursor: 'pointer' }}
            onClick={() => openAddressModal()}
          >
            <Typography sx={{ color: theme.colors.text, fontWeight: 500, fontSize: 16 }}>
              Saved Addresses
            </Typography>
            <ChevronRightIcon sx={{ color: theme.colors.secondaryText }} />
          </Box>
        </DialogContent>
      </Dialog>
      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onClose={() => setShowLogoutModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
          Logout
          <IconButton onClick={() => setShowLogoutModal(false)} size="large" sx={{ color: theme.colors.secondaryText }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.colors.card, textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: 22, mb: 3, color: theme.colors.text }}>Do you want to logout?</Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.colors.card, pb: 3, px: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            sx={{ bgcolor: theme.colors.primary, color: '#fff', fontWeight: 600, fontSize: 18, borderRadius: 2, px: 4, py: 1, boxShadow: 'none', '&:hover': { bgcolor: theme.colors.primary }, mr: 2 }}
            onClick={async () => { setShowLogoutModal(false); await logout(); }}
          >
            Logout
          </Button>
          <Button
            variant="outlined"
            sx={{ color: theme.colors.text, borderColor: theme.colors.border, fontWeight: 600, fontSize: 18, borderRadius: 2, px: 4, py: 1, boxShadow: 'none', '&:hover': { borderColor: theme.colors.primary } }}
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      {/* Coupons Modal */}
      <Dialog open={showCouponsModal} onClose={() => setShowCouponsModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
          Available Coupons
          <IconButton onClick={() => setShowCouponsModal(false)} size="large" sx={{ color: theme.colors.secondaryText }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.colors.card }}>
          {loadingCoupons ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress sx={{ color: theme.colors.primary }} />
            </Box>
          ) : couponError ? (
            <Typography sx={{ color: theme.colors.error, fontSize: 16, textAlign: 'center', mt: 2 }}>{couponError}</Typography>
          ) : coupons.length === 0 ? (
            <Typography sx={{ color: theme.colors.secondaryText, fontSize: 16, textAlign: 'center', mt: 2 }}>
              No coupons available yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {coupons.map((coupon, idx) => (
                <Card key={idx} sx={{ 
                  mb: 2, 
                  borderRadius: 3, 
                  boxShadow: theme.isDarkMode ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.06)', 
                  border: `1px solid ${theme.colors.border}`,
                  bgcolor: theme.colors.card,
                  '&:hover': {
                    boxShadow: theme.isDarkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ color: theme.colors.primary, fontWeight: 700, fontSize: 18 }}>% OFF</Typography>
                      <Typography sx={{ color: theme.isDarkMode ? '#4caf50' : '#2ecc40', fontWeight: 500, fontSize: 15 }}>
                        {getDaysLeft(coupon.validTo)} days left
                      </Typography>
                    </Box>
                    <Typography sx={{ color: theme.colors.text, fontSize: 15, mb: 1 }}>
                      {coupon.description || coupon.title || ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Box sx={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        bgcolor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : theme.colors.background, 
                        borderRadius: 2, 
                        p: 1, 
                        border: `1px solid ${theme.colors.border}` 
                      }}>
                        <Typography sx={{ color: theme.colors.secondaryText, fontSize: 12 }}>Valid From</Typography>
                        <Typography sx={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{formatDate(coupon.validFrom)}</Typography>
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        bgcolor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : theme.colors.background, 
                        borderRadius: 2, 
                        p: 1, 
                        border: `1px solid ${theme.colors.border}` 
                      }}>
                        <Typography sx={{ color: theme.colors.secondaryText, fontSize: 12 }}>Valid To</Typography>
                        <Typography sx={{ color: theme.colors.text, fontWeight: 600, fontSize: 14 }}>{formatDate(coupon.validTo)}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ 
                        flex: 1, 
                        bgcolor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fafafa', 
                        borderRadius: 2, 
                        p: 1, 
                        fontWeight: 700, 
                        fontSize: 18, 
                        color: theme.colors.primary, 
                        border: `1px solid ${theme.colors.border}`, 
                        textAlign: 'center', 
                        letterSpacing: 1 
                      }}>
                        {coupon.code}
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ 
                          ml: 2, 
                          bgcolor: theme.colors.primary, 
                          color: '#fff', 
                          fontWeight: 600, 
                          borderRadius: 2, 
                          px: 2, 
                          py: 1, 
                          minWidth: 60, 
                          boxShadow: 'none', 
                          '&:hover': { 
                            bgcolor: theme.colors.primary,
                            transform: 'scale(1.05)',
                            transition: 'transform 0.2s ease-in-out'
                          } 
                        }}
                        onClick={() => handleCopy(coupon.code)}
                      >
                        {copiedCode === coupon.code ? 'COPIED' : <><ContentCopyIcon sx={{ fontSize: 18, mr: 0.5 }} />COPY</>}
                      </Button>
                    </Box>
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 12, mt: 1 }}>* Terms and conditions apply</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* Coupon Copy Snackbar */}
      <Snackbar
        open={showCopySnackbar}
        autoHideDuration={1500}
        onClose={() => setShowCopySnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setShowCopySnackbar(false)}
          severity="success"
          elevation={6}
          variant="filled"
          sx={{ borderRadius: 2, fontSize: 16, fontWeight: 600, minWidth: 180, alignItems: 'center' }}
        >
          {copiedCode} copied!
        </MuiAlert>
      </Snackbar>
      {/* Help and FAQ Modal */}
      <Dialog open={showHelpModal} onClose={() => setShowHelpModal(false)} maxWidth="sm" fullWidth
        PaperProps={{
          sx: { minWidth: 420, bgcolor: theme.colors.card, color: theme.colors.text, borderRadius: theme.modal?.borderRadius, boxShadow: theme.modal?.boxShadow }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', bgcolor: theme.colors.card, color: theme.colors.text }}>
          Help and FAQ
          <IconButton onClick={() => setShowHelpModal(false)} size="large" sx={{ position: 'absolute', right: 16, top: 12, color: theme.colors.secondaryText }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.colors.card }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search help topics..."
            sx={{ mb: 2, mt: 1, bgcolor: theme.colors.background, borderRadius: 2 }}
            variant="outlined"
            value={faqSearch}
            onChange={e => setFaqSearch(e.target.value)}
          />
          {(() => {
            const keyword = faqSearch.trim().toLowerCase();
            const filtered = !keyword
              ? FAQData
              : FAQData.map(section => ({
                  ...section,
                  items: section.items.filter(item =>
                    item.question.toLowerCase().includes(keyword) ||
                    item.answer.toLowerCase().includes(keyword)
                  )
                })).filter(section => section.items.length > 0);
            // Auto-expand the only question if only one result in a section
            React.useEffect(() => {
              if (keyword) {
                const newExpanded = {};
                filtered.forEach(section => {
                  if (section.items.length === 1) {
                    newExpanded[section.category] = section.items[0].question;
                  } else {
                    newExpanded[section.category] = false;
                  }
                });
                setExpandedQuestion(newExpanded);
              } else {
                setExpandedQuestion({});
              }
            }, [faqSearch]);
            if (filtered.length === 0) {
              return <Typography sx={{ color: theme.colors.secondaryText, textAlign: 'center', mt: 2 }}>No results found.</Typography>;
            }
            return filtered.map((section, idx) => (
              <Accordion
                key={section.category}
                expanded={expandedCategory === section.category}
                onChange={() => setExpandedCategory(expandedCategory === section.category ? false : section.category)}
                sx={{ mb: 2, bgcolor: theme.colors.background, borderRadius: 2, boxShadow: 'none', border: `1px solid ${theme.colors.border}` }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.colors.primary }} />}>
                  <Typography sx={{ fontWeight: 700, color: theme.colors.primary, fontSize: 16 }}>{section.category}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {section.items.map((item, qidx) => (
                    <Accordion
                      key={item.question}
                      expanded={expandedQuestion[section.category] === item.question}
                      onChange={() => setExpandedQuestion(prev => ({ ...prev, [section.category]: prev[section.category] === item.question ? false : item.question }))}
                      sx={{ mb: 1, bgcolor: theme.colors.background, borderRadius: 2, boxShadow: 'none', border: `1px solid ${theme.colors.border}` }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.colors.primary }} />}>
                        <Typography sx={{ fontWeight: 600, color: theme.colors.text }}>{item.question}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography sx={{ color: theme.colors.secondaryText }}>{item.answer}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ));
          })()}
        </DialogContent>
      </Dialog>
      {/* Address Selection Modal (copied logic from Navbar) */}
      <Dialog
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.colors.card,
            color: theme.colors.text,
            borderRadius: 2,
            boxShadow: 1,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.colors.card, color: theme.colors.text }}>
          Select Delivery Address
          <IconButton onClick={() => setShowAddressModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.colors.card, color: theme.colors.text }}>
          {savedAddresses.length === 0 ? (
            <Typography>No saved addresses found.</Typography>
          ) : (
            savedAddresses.map((addr, idx) => (
              <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{addr.label || addr.type || 'Address'}</Typography>
                <Typography sx={{ fontSize: 14 }}>{addr.formattedAddress || addr.address}</Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: theme.colors.primary,
                    color: theme.colors.buttonText || '#fff',
                    borderRadius: 2,
                    fontWeight: 500,
                    fontSize: 14,
                    py: 0.5,
                    px: 2,
                    minWidth: 70,
                    boxShadow: 'none',
                    mt: 1,
                    '&:hover': { bgcolor: theme.colors.primary }
                  }}
                  onClick={async () => {
                    // Same logic as Navbar modal
                    const addressToStore = {
                      ...addr,
                      coordinates: {
                        latitude: addr.latitude || (addr.coordinates && addr.coordinates.latitude),
                        longitude: addr.longitude || (addr.coordinates && addr.coordinates.longitude)
                      }
                    };
                    await setSelectedDeliveryAddress(addressToStore);
                    setShowAddressModal(false);
                    if (onClose) onClose();
                    setSnackbar({ open: true, message: 'Delivery address selected!', severity: 'success' });
                  }}
                >
                  Deliver Here
                </Button>
              </Box>
            ))
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          sx={{
            fontSize: 18,
            fontWeight: 600,
            minWidth: 320,
            boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
            alignItems: 'center',
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default SideMenu; 