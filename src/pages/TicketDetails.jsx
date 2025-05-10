import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { ticketService } from '../services/ticketService';

const TicketDetails = () => {
  const { theme } = useContext(ThemeContext);
  const { ticketId } = useParams();
  const [message, setMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messageError, setMessageError] = useState('');

  // Get current user ID on component mount
  useEffect(() => {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      setCurrentUserId(userData._id);
    }
  }, []);

  // Fetch ticket data
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketData = await ticketService.getTicketById(ticketId);
        if (ticketData) {
          setTicket(ticketData);
        } else {
          setError('Ticket not found');
        }
      } catch (err) {
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // Timer effect
  useEffect(() => {
    if (!ticket?.dueDate) return;

    const updateTimer = () => {
      const now = new Date();
      const dueDate = new Date(ticket.dueDate);
      const secondsRemaining = differenceInSeconds(dueDate, now);
      
      if (secondsRemaining <= 0) {
        setTimeRemaining('Time expired');
        return;
      }

      const days = Math.floor(secondsRemaining / (24 * 60 * 60));
      const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
      const seconds = secondsRemaining % 60;

      setTimeRemaining(
        `${days}d ${hours}h ${minutes}m ${seconds}s remaining`
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [ticket?.dueDate]);

  const handleSendMessage = async () => {
    if (!message.trim() || !ticket) return;

    setSendingMessage(true);
    setMessageError('');

    try {
      await ticketService.addMessage(ticketId, message);
      setMessage('');         // Clear input immediately after sending
      setMessageError('');    // Clear error immediately after sending

      // Try to fetch the updated ticket, but don't block UI if it fails
      try {
        const updatedTicket = await ticketService.getTicketById(ticketId);
        if (updatedTicket) {
          setTicket(updatedTicket);
        }
      } catch (fetchErr) {
        // Only show a warning if you want, but do NOT setMessageError
        console.warn('Message sent, but failed to refresh ticket:', fetchErr);
      }
    } catch (err) {
      setMessageError(err.response?.data?.message || err.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.secondaryText;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'closed':
        return theme.colors.error;
      case 'in progress':
        return theme.colors.primary;
      case 'open':
        return theme.colors.success;
      default:
        return theme.colors.secondaryText;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading ticket details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Ticket not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.colors.background,
      color: theme.colors.text,
      p: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Ticket Details
        </Typography>
      </Box>

      {/* Ticket Info Card */}
      <Card sx={{
        bgcolor: theme.colors.card,
        borderRadius: 2,
        p: 3,
        mb: 3,
        boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
        border: `1.5px solid ${theme.colors.border}`
      }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {ticket.title}
          </Typography>
          <Typography sx={{ color: theme.colors.secondaryText, mb: 2 }}>
            Ticket #{ticket.ticketNumber}
          </Typography>
          
          {/* Status and Priority Chips */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip
              label={ticket.status}
              sx={{
                bgcolor: `${getStatusColor(ticket.status)}22`,
                color: getStatusColor(ticket.status),
                fontWeight: 600
              }}
            />
            <Chip
              label={ticket.priority}
              sx={{
                bgcolor: `${getPriorityColor(ticket.priority)}22`,
                color: getPriorityColor(ticket.priority),
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Category</Typography>
          <Typography sx={{ color: theme.colors.secondaryText }}>
            {ticket.category}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Description</Typography>
          <Typography sx={{ color: theme.colors.secondaryText, whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          color: theme.colors.secondaryText,
          bgcolor: `${theme.colors.primary}10`,
          p: 2,
          borderRadius: 1
        }}>
          <AccessTimeIcon />
          <Typography sx={{ fontWeight: 600 }}>
            {timeRemaining}
          </Typography>
        </Box>
      </Card>

      {/* Messages Section */}
      <Card sx={{
        bgcolor: theme.colors.card,
        borderRadius: 2,
        p: 3,
        mb: 3,
        boxShadow: theme.isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
        border: `1.5px solid ${theme.colors.border}`
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Messages</Typography>
        
        {messageError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {messageError}
          </Typography>
        )}
        
        {/* Messages List */}
        <Box sx={{ mb: 3, maxHeight: 400, overflowY: 'auto' }}>
          {ticket.messages?.map((msg) => (
            <Box
              key={msg._id}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: msg.sender._id === currentUserId 
                  ? `${theme.colors.primary}10` 
                  : theme.colors.background,
                borderRadius: 2,
                maxWidth: '80%',
                ml: msg.sender._id === currentUserId ? 'auto' : 0
              }}
            >
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                {msg.sender.name}
              </Typography>
              <Typography sx={{ mb: 1 }}>{msg.content}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: theme.colors.secondaryText }}>
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleString()
                  : msg.createdAt
                    ? new Date(msg.createdAt).toLocaleString()
                    : ''}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setMessageError('');
            }}
            disabled={sendingMessage}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.colors.background,
                '& fieldset': {
                  borderColor: theme.colors.border,
                },
                '&:hover fieldset': {
                  borderColor: theme.colors.primary,
                },
              },
            }}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!message.trim() || sendingMessage}
            sx={{
              bgcolor: theme.colors.primary,
              '&:hover': {
                bgcolor: theme.colors.primaryDark || theme.colors.primary,
              },
              height: 56,
              alignSelf: 'flex-end'
            }}
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default TicketDetails; 