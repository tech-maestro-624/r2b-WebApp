import React, { createContext, useState, useEffect } from 'react';
import { getTheme } from '../theme/theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Detect system dark mode using matchMedia
  const getSystemDarkMode = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return getSystemDarkMode();
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const savedTheme = localStorage.getItem('themePreference');
      if (savedTheme === null) {
        setIsDarkMode(mediaQuery.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save theme preference when it changes
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
  };

  const theme = getTheme(isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};