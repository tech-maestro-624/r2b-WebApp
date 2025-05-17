import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaletteIcon from '@mui/icons-material/Palette';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SearchIcon from '@mui/icons-material/Search';
import { ticketService } from '../services/ticketService';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';

const TicketManager = () => {
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated  } = useAuth();
  const navigate = useNavigate();
  const [openNewModal, setOpenNewModal] = useState(false);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const galleryInputRef = React.useRef();
  const cameraInputRef = React.useRef();
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState('');

  const userDataStr = localStorage.getItem('userData');
  const currentUserId = userDataStr ? JSON.parse(userDataStr)._id : null;

  const handleOpenNewModal = () => {
    setOpenNewModal(true);
  };

  const handleCloseNewModal = () => {
    setOpenNewModal(false);
  };

  const ticketTypes = [
    'Order Issue',
    'Payment Problem',
    'Delivery Problem',
    'Food Quality',
    'App Issue',
    'Other'
  ];

  const categoryOptions = [
    { key: 'Technical', label: 'Technical', icon: <BuildIcon fontSize="medium" /> },
    { key: 'Billing', label: 'Billing', icon: <CreditCardIcon fontSize="medium" /> },
    { key: 'Design Feedback', label: 'Design Feedback', icon: <PaletteIcon fontSize="medium" /> },
    { key: 'Other', label: 'Other', icon: <HelpOutlineIcon fontSize="medium" /> },
  ];

  const handleCategorySelect = (key) => setCategory(key);
  const handleSubjectChange = (e) => setSubject(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);

  const handleGalleryAttach = () => {
    if (galleryInputRef.current) galleryInputRef.current.click();
  };

  const handleCameraAttach = () => {
    if (cameraInputRef.current) cameraInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAttachments(prev => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!category || !subject.trim() || !description.trim()) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      await ticketService.createTicket({
        title: subject,
        description,
        category,
        // attachments: [] // Add if backend supports
      });
      setSuccess('Support request submitted!');
      setOpenNewModal(false);
      setCategory('');
      setSubject('');
      setDescription('');
      setAttachments([]);
    } catch (e) {
      setError('Failed to submit request.');
    }
    setLoading(false);
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/ticket/${ticketId}`);
  };

  React.useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      setTicketsError('');
      try {
        const res = await ticketService.getTickets();
        setTickets(res.tickets || []);
      } catch (err) {
        setTicketsError('Failed to load tickets.');
      }
      setLoadingTickets(false);
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (ticket.title && ticket.title.toLowerCase().includes(q)) ||
      (ticket.description && ticket.description.toLowerCase().includes(q)) ||
      (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(q)) ||
      (ticket.category && ticket.category.toLowerCase().includes(q)) ||
      (ticket.status && ticket.status.toLowerCase().includes(q))
    );
  });

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.colors.background,
      color: theme.colors.text,
      p: { xs: 2, sm: 3, md: 4 },
      position: 'relative'
    }}>
      {/* Heading */}
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4, 
          fontWeight: 700,
          color: theme.colors.text,
          textAlign: 'center'
        }}
      >
        Raise a Support Ticket
      </Typography>
      {/* Search Bar */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tickets..."
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: theme.colors.secondaryText, mr: 1 }} />, 
            style: {
              background: theme.isDarkMode ? '#23232b' : theme.colors.background,
              borderRadius: 8,
              color: theme.colors.text,
              fontSize: 16
            }
          }}
          sx={{
            maxWidth: 420,
            width: '100%',
            bgcolor: theme.isDarkMode ? '#23232b' : theme.colors.background,
            borderRadius: 2,
            input: { color: theme.colors.text },
            boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)'
          }}
        />
      </Box>
      {/* User Tickets from API */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 4,
        mb: 4,
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        {loadingTickets ? (
          <Typography sx={{ gridColumn: '1/-1', textAlign: 'center', color: theme.colors.secondaryText, mt: 4 }}>Loading tickets...</Typography>
        ) : ticketsError ? (
          <Typography sx={{ gridColumn: '1/-1', textAlign: 'center', color: theme.colors.error, mt: 4 }}>{ticketsError}</Typography>
        ) : filteredTickets.length === 0 ? (
          <Typography sx={{ gridColumn: '1/-1', textAlign: 'center', color: theme.colors.secondaryText, mt: 4 }}>No tickets found.</Typography>
        ) : filteredTickets.map(ticket => {
          const latestAdminMessage = ticket.messages
            ?.slice()
            .reverse()
            .find(msg => msg.sender && msg.sender._id !== currentUserId && msg.sender.roles?.some(r => r.name === 'admin'));

          const showUpdateFromR2B =
            latestAdminMessage ||
            (
              ticket.status &&
              ticket.status.toLowerCase() !== 'open' &&
              !(userDataStr && JSON.parse(userDataStr).roles?.some(r => r.name === 'admin'))
            );

          return (
            <Box key={ticket._id} sx={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 340 }}>
              <Card
                onClick={() => handleTicketClick(ticket._id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 220,
                  height: 220,
                  width: '100%',
                  boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
                  borderRadius: 2,
                  p: 2,
                  bgcolor: theme.colors.card,
                  color: theme.colors.text,
                  border: `1.5px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <Box
                  component="img"
                  src={ticket.attachments && ticket.attachments.length > 0 ? ticket.attachments[0].url : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ticket.title || 'T')}
                  alt={ticket.title}
                  sx={{
                    width: 140,
                    height: 220,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mr: 3,
                    background: theme.colors.background,
                  }}
                />
                <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ fontWeight: 700, fontSize: 18, color: theme.colors.text, mb: 0.5 }}>{ticket.title}</Box>
                  <Box sx={{ color: theme.colors.secondaryText, fontWeight: 600, fontSize: 16, mb: 0.5 }}>
                    Ticket No: {ticket.ticketNumber}
                  </Box>
                  <Box sx={{ color: theme.colors.secondaryText, fontSize: 15, mb: 0.5 }}>{ticket.description}</Box>
                  <Box sx={{ color: theme.colors.primary, fontWeight: 600, fontSize: 15, mb: 0.5 }}>{ticket.category}</Box>
                  <Box sx={{ color: ticket.status === 'Closed' ? theme.colors.error : ticket.status === 'In Progress' ? theme.colors.primary : theme.colors.success, fontWeight: 600, fontSize: 15 }}>
                    {ticket.status}
                  </Box>
                  <Box sx={{ color: theme.colors.secondaryText, fontSize: 13, mt: 0.5 }}>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </Box>
                </CardContent>
              </Card>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                {showUpdateFromR2B && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle update from R2B
                    }}
                    sx={{
                      color: theme.colors.primary,
                      borderColor: theme.colors.primary,
                      '&:hover': {
                        borderColor: theme.colors.primary,
                        backgroundColor: `${theme.colors.primary}10`,
                      },
                    }}
                  >
                    Update from R2B
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Card sx={{ 
        maxWidth: 800, 
        mx: 'auto',
        bgcolor: theme.colors.card,
        color: theme.colors.text,
        borderRadius: 2,
        boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
        border: `1.5px solid ${theme.colors.border}`
      }}>
        {/* ... rest of the existing card content ... */}
      </Card>

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpenNewModal}
        sx={{
          position: 'fixed',
          bottom: '100px',
          right: '100px',
          bgcolor: theme.colors.primary,
          '&:hover': {
            bgcolor: theme.colors.primaryDark || theme.colors.primary,
          },
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={openNewModal}
        onClose={handleCloseNewModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: 650,
            bgcolor: theme.colors.card,
            color: theme.colors.text,
            borderRadius: theme.modal?.borderRadius,
            boxShadow: theme.modal?.boxShadow,
            '& .MuiDialogContent-root': {
              border: 'none',
              padding: 0
            },
            '& .MuiDialogActions-root': {
              border: 'none',
              padding: 2
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          bgcolor: theme.colors.card,
          color: theme.colors.text,
          borderBottom: 'none',
          fontWeight: 700,
          fontSize: 26,
          px: 4,
          pt: 3,
          pb: 1
        }}>
          New Ticket
          <IconButton 
            onClick={handleCloseNewModal} 
            size="large" 
            sx={{ 
              color: theme.colors.secondaryText,
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          bgcolor: theme.colors.card, 
          pt: 0,
          px: 4,
          pb: 2,
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* Category selection */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            {categoryOptions.map(opt => (
              <Box
                key={opt.key}
                onClick={() => handleCategorySelect(opt.key)}
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                  color: category === opt.key ? theme.colors.primary : theme.colors.secondaryText,
                  p: 1,
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: '50%',
                    bgcolor: category === opt.key ? `${theme.colors.primary}22` : theme.isDarkMode ? '#23232b' : theme.colors.background,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: category === opt.key ? `3px solid ${theme.colors.primary}` : `2px solid ${theme.colors.border}`,
                    transition: 'all 0.2s',
                    boxShadow: category === opt.key ? `0 0 0 4px ${theme.colors.primary}33` : 'none',
                    '&:hover': {
                      borderColor: theme.colors.primary,
                      boxShadow: `0 0 0 4px ${theme.colors.primary}22`
                    }
                  }}
                >
                  {opt.icon}
                </Box>
                <Typography sx={{ fontSize: 14, mt: 0.5, fontWeight: 500 }}>{opt.label}</Typography>
              </Box>
            ))}
          </Box>
          {/* Subject */}
          <Typography sx={{ fontWeight: 600, mb: 0.1, fontSize: 16, textAlign: 'center' }}>Subject</Typography>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TextField
              fullWidth
              placeholder="Enter a subject for your request"
              value={subject}
              onChange={handleSubjectChange}
              sx={{ maxWidth: 420, mb: 1, bgcolor: theme.isDarkMode ? '#23232b' : theme.colors.background, borderRadius: 2, input: { color: theme.colors.text, fontSize: 16, fontWeight: 500 }, }}
              InputProps={{ style: { background: theme.isDarkMode ? '#23232b' : theme.colors.background, borderRadius: 8 } }}
            />
          </Box>
          {/* Description */}
          <Typography sx={{ fontWeight: 600, mb: 0.1, fontSize: 16, textAlign: 'center' }}>Description</Typography>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Please describe your issue in detail"
              value={description}
              onChange={handleDescriptionChange}
              sx={{ maxWidth: 420, mb: 1, bgcolor: theme.isDarkMode ? '#23232b' : theme.colors.background, borderRadius: 2, textarea: { color: theme.colors.text, fontSize: 16, fontWeight: 500 }, }}
              InputProps={{ style: { background: theme.isDarkMode ? '#23232b' : theme.colors.background, borderRadius: 8 } }}
            />
          </Box>
          {/* Attachments */}
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 16, textAlign: 'center' }}>Attachments</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<PhotoLibraryIcon sx={{ color: theme.colors.primary }} />}
              sx={{ bgcolor: `${theme.colors.primary}10`, color: theme.colors.primary, borderRadius: 2, fontWeight: 700, border: 'none', px: 3, py: 1, fontSize: 15, letterSpacing: 1 }}
              onClick={handleGalleryAttach}
            >
              GALLERY
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCameraIcon sx={{ color: theme.colors.primary }} />}
              sx={{ bgcolor: `${theme.colors.primary}10`, color: theme.colors.primary, borderRadius: 2, fontWeight: 700, border: 'none', px: 3, py: 1, fontSize: 15, letterSpacing: 1 }}
              onClick={handleCameraAttach}
            >
              CAMERA
            </Button>
          </Box>
          {/* Hidden file inputs for Gallery and Camera */}
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            ref={galleryInputRef}
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            ref={cameraInputRef}
            onChange={handleFileChange}
          />
          {/* Show image previews */}
          {attachments.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {attachments.map((file, idx) => (
                <Box key={idx} sx={{ width: 64, height: 64, borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.colors.border}` }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`attachment-${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ))}
            </Box>
          )}
          {error && <Typography sx={{ color: theme.colors.error, mb: 1 }}>{error}</Typography>}
          {success && <Typography sx={{ color: theme.colors.success, mb: 1 }}>{success}</Typography>}
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.colors.card, p: 0, pt: 1, px: 0, pb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                maxWidth: 220,
                bgcolor: '#FF5A1F', // Orange
                color: '#fff',
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 16,
                py: 1,
                boxShadow: 'none',
                m: 0,
                letterSpacing: 1,
                '&:hover': { bgcolor: '#FF5A1F', opacity: 0.9 }
              }}
            >
              SUBMIT REQUEST
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketManager;
