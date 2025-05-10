// Theme configuration for light and dark modes

export const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#FF5A33', // Orange primary color from mockups
    background: '#FFFFFF',
    card: '#F8F8F8',
    text: '#333333',
    secondaryText: '#666666',
    border: '#EEEEEE',
    notification: '#FF3B30',
    inputBackground: '#F2F2F2',
    placeholder: '#999999',
    icon: '#666666',
    statusBar: 'dark',
    categoryBackground: '#FF5A33',
    categoryBackgroundInactive: '#F2F2F2',
    categoryText: '#FFFFFF',
    categoryTextInactive: '#666666',
    shadow: 'rgba(0, 0, 0, 0.1)',
    success: '#4CD964',
    error: '#FF3B30',
    warning: '#FFCC00',
    info: '#34AADC',
    divider: '#EEEEEE',
    buttonText: '#FFFFFF',
    ratingStars: '#FFD700',
    // Sidebar/Drawer
    sidebarBackground: '#FFFFFF',
    sidebarText: '#333333',
    sidebarBorder: '#EEEEEE',
    sidebarIcon: '#666666',
    // Order Card
    orderCardBackground: '#F8F8F8',
    orderCardText: '#333333',
    orderCardBorder: '#EEEEEE',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    pill: 50,
  },
  typography: {
    fontFamily: {
      regular: 'Poppins, Arial, sans-serif',
      medium: 'Poppins, Arial, sans-serif',
      bold: 'Poppins, Arial, sans-serif',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
  },
  modal: {
    background: '#fff', // or your preferred color
    text: '#333',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalButton: {
    primary: '#FF5A33',
    primaryText: '#fff',
    secondary: 'transparent',
    secondaryText: '#FF5A33',
    border: '#FF5A33',
  },
  modalCloseIcon: {
    color: '#333',
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#FF5A33', // Keep the same primary color for brand consistency
    background: '#2D2D3A', // Midnight blue base color
    card: '#35354A', // Slightly lighter variant for cards
    text: '#FFFFFF',
    secondaryText: '#AAAAAA',
    border: '#25252F', // Darker variant for borders
    notification: '#FF453A',
    inputBackground: '#35354A', // Same as card for consistency
    placeholder: '#777777',
    icon: '#AAAAAA',
    statusBar: 'light',
    categoryBackground: '#FF5A33',
    categoryBackgroundInactive: '#35354A', // Same as card for consistency
    categoryText: '#FFFFFF',
    categoryTextInactive: '#AAAAAA',
    shadow: 'rgba(45, 45, 58, 0.3)', // Shadow using base color
    success: '#32D74B',
    error: '#FF453A',
    warning: '#FFD60A',
    info: '#0A84FF',
    divider: '#161630', // Same as border for consistency
    buttonText: '#FFFFFF',
    ratingStars: '#FFD700',
    // Sidebar/Drawer
    sidebarBackground: '#35354A',
    sidebarText: '#FFFFFF',
    sidebarBorder: '#25252F',
    sidebarIcon: '#AAAAAA',
    // Order Card
    orderCardBackground: '#35354A',
    orderCardText: '#FFFFFF',
    orderCardBorder: '#25252F',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    pill: 50,
  },
  typography: {
    fontFamily: {
      regular: 'Poppins, Arial, sans-serif',
      medium: 'Poppins, Arial, sans-serif',
      bold: 'Poppins, Arial, sans-serif',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
  },
  modal: {
    background: '#39384a', // or theme.colors.card or another dark color
    text: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalButton: {
    primary: '#FF5A33',
    primaryText: '#fff',
    secondary: 'transparent',
    secondaryText: '#FF5A33',
    border: '#FF5A33',
  },
  modalCloseIcon: {
    color: '#fff',
  },
};

// Helper function to get the current theme based on dark mode state
export const getTheme = (isDarkMode) => {
  return isDarkMode ? darkTheme : lightTheme;
};