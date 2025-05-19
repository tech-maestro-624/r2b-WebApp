import { useContext } from 'react';
import { GlobalStyles } from '@mui/material';
import { ThemeContext } from '../context/ThemeContext';

export default function ThemeGlobalStyles() {
  const { theme } = useContext(ThemeContext);
  return (
    <GlobalStyles styles={{
      body: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        transition: 'background 0.3s, color 0.3s',
      },
      '#root': {
        minHeight: '100vh',
      }
    }} />
  );
} 