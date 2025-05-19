import React, { Suspense } from 'react';
import './App.css';
import AppProviders from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';
import Loader from './components/common/Loader';
import ThemeGlobalStyles from './components/ThemeGlobalStyles';

// Main App component
export default function App() {
  return (
    <AppProviders>
      <ThemeGlobalStyles />
      <Suspense fallback={<Loader fullPage={true} />}>
        <AppRoutes />
      </Suspense>
    </AppProviders>
  );
}
