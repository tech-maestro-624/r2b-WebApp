import axios from 'axios';
// import { apiService } from '../apiServices`';
import { apiService } from './apiServices';


// // BACKEND API URL - Your specific backend URL
// const API_URL = 'http://192.168.1.101:8080';

// // The actual path for tickets API - modify this to match your backend
// const TICKETS_PATH = '/api/ticket/'; // Changed from /api/tickets to /support/tickets

// // Set to false to use real backend API instead of mock data
const useMockData = false;

// // API error handling helper
// const handleApiError = (error) => {
//   if (error.response) {
//     // Server responded with an error status code (4xx, 5xx)
//     console.error('API Error response:', error.response.data);
//     return {
//       status: error.response.status,
//       message: error.response.data.message || 'Server error occurred',
//       data: error.response.data
//     };
//   } else if (error.request) {
//     // Request was made but no response was received
//     console.error('API No response:', error.request);
//     return {
//       status: 0,
//       message: 'No response from server. Check your connection.',
//       data: null
//     };
//   } else {
//     // Something else happened while setting up the request
//     console.error('API Error:', error.message);
//     return {
//       status: 0,
//       message: 'Error setting up request: ' + error.message,
//       data: null
//     };
//   }
// };

// // Configure axios with common headers
// axios.defaults.headers.common['Content-Type'] = 'application/json';
// axios.defaults.timeout = 15000; // 15 second timeout

// // Add a request interceptor for authentication
// axios.interceptors.request.use(
//   async (config) => {
//     // For debugging: Log outgoing requests
//     console.log('API Request to:', config.url);
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add a response interceptor for global error handling
// axios.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     // Handle global errors here if needed
//     // For example, redirect to login on 401 unauthorized
//     if (error.response && error.response.status === 401) {
//       // Handle unauthorized error
//       // navigation.navigate('Login');
//     }
//     return Promise.reject(error);
//   }
// );

// Mock data for development - only used if useMockData is true
const mockTickets = [
  {
    _id: 'ticket123456',
    title: 'Order not delivered',
    description: 'My order #12345 has not been delivered yet.',
    category: 'order',
    status: 'Open',
    priority: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  }
];

export const ticketService = {
  // Get all tickets for the current user
  getTickets: async (page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
    if (useMockData) {
      return { tickets: mockTickets, pagination: { total: mockTickets.length, pages: 1 } };
    }
    try {
      const response = await apiService.get('/ticket/my-tickets', {
        params: { page, limit, sortBy, sortOrder }
      });
      if (!response) return { tickets: [], pagination: { total: 0, pages: 0 } };
      if (response.tickets && Array.isArray(response.tickets)) return response;
      if (response.data && response.data.tickets) return response.data;
      return { tickets: [], pagination: { total: 0, pages: 0 } };
    } catch (error) {
      console.error('Error fetching tickets:', error.message || error);
      return { tickets: [], pagination: { total: 0, pages: 0 } };
    }
  },

  // Get ticket by ID
  getTicketById: async (ticketId) => {
    if (useMockData) {
      const ticket = mockTickets.find(ticket => ticket._id === ticketId);
      return ticket || null;
    }
    try {
      const response = await apiService.get(`/ticket/${ticketId}`);
      return response || null;
    } catch (error) {
      console.error(`Error fetching ticket ${ticketId}:`, error.message || error);
      return null;
    }
  },

  // Create a new ticket
  createTicket: async (ticketData) => {
    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      category: ticketData.category,
      priority: ticketData.priority || 'Medium'
    };
    try {
      const ticket = await apiService.post('/ticket/', payload);
      return ticket;
    } catch (error) {
      console.error('Failed to create ticket:', error.message || error);
      throw error;
    }
  },
  
  // Add a message to a ticket
  addMessage: async (ticketId, content) => {
    try {
      // Get user data from localStorage
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) {
        throw new Error('User not authenticated');
      }

      const userData = JSON.parse(userDataStr);
      const userId = userData._id;

      console.log('User Data:', userData);
      console.log('User ID:', userId);
      console.log('Sending message with data:', {
        ticketId,
        userId,
        content
      });

      // Updated endpoint to match backend
      const response = await apiService.post(`/ticket/${ticketId}/messages`, {
        userId,
        content: {
          message: content,
          attachments: []
        }
      });
      
      console.log('Message API Response:', response);

      if (response.success) {
        return response.ticket;
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error adding message:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },
  
  // Close ticket with rating
  closeTicket: async (ticketId, rating, feedback) => {
    try {
      const response = await apiService.patch(`/ticket/${ticketId}/close`, { 
        rating,
        feedback 
      });
      return response.data;
    } catch (error) {
      console.error('Error closing ticket:', error.message || error);
      throw error;
    }
  },
  
  // Search tickets
  searchTickets: async (query, page = 1, limit = 10) => {
    if (useMockData) {
      const results = mockTickets.filter(
        ticket => ticket.title.toLowerCase().includes(query.toLowerCase()) ||
                 ticket.description.toLowerCase().includes(query.toLowerCase())
      );
      return { tickets: results, pagination: { total: results.length, pages: 1 } };
    }
    try {
      const response = await apiService.get(`/ticket/search`, {
        params: { query, page, limit }
      });
      if (response.tickets) return response.tickets;
      if (Array.isArray(response)) return response;
      if (response.data) return response.data;
      return [];
    } catch (error) {
      console.error('Error searching tickets:', error.message || error);
      return [];
    }
  }
};

//   // Add a message to a ticket
//   addMessage: async (ticketId, content) => {
//     if (useMockData) {
//       // Mock implementation...
//     }
    
//     try {
//       const response = await axios.post(`${API_URL}${TICKETS_PATH}/${ticketId}/messages`, { content });
//       return response.data;
//     } catch (error) {
//       const errorInfo = handleApiError(error);
//       console.error('Error adding message:', errorInfo);
//       Alert.alert(
//         'Error Sending Message',
//         errorInfo.message || 'Failed to send message. Please try again.'
//       );
//       return null;
//     }
//   },

//   // Add an attachment to a ticket
//   addAttachment: async (ticketId, attachmentData) => {
//     if (useMockData) {
//       // Mock implementation...
//     }
    
//     try {
//       // Use FormData for file upload
//       const formData = new FormData();
//       formData.append('attachment', {
//         uri: attachmentData.uri,
//         type: attachmentData.type || 'image/jpeg',
//         name: attachmentData.name || 'attachment.jpg',
//       });
      
//       const response = await axios.post(`${API_URL}${TICKETS_PATH}/${ticketId}/attachments`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error adding attachment:', error);
//       throw error;
//     }
//   },

//   // Update ticket status
//   updateTicketStatus: async (ticketId, status) => {
//     if (useMockData) {
//       // Update mock ticket
//       const ticket = mockTickets.find(t => t._id === ticketId);
//       if (!ticket) throw new Error('Ticket not found');
      
//       ticket.status = status;
//       ticket.updatedAt = new Date().toISOString();
      
//       return ticket;
//     }
    
//     try {
//       const response = await axios.patch(`