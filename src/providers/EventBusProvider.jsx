import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';

// Create EventBus context
const EventBusContext = createContext(null);

// Custom hook for using EventBus
export const useEventBus = () => useContext(EventBusContext);

// Event bus implementation
export const EventBusProvider = ({ children }) => {
  const listenersRef = useRef({});
  
  const subscribe = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    
    listenersRef.current[event].push(callback);
    
    return () => {
      if (listenersRef.current[event]) {
        listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
      }
    };
  }, []);
  
  const publish = useCallback((event, data) => {
    if (listenersRef.current[event]) {
      listenersRef.current[event].forEach(callback => callback(data));
    }
  }, []);
  
  const value = useMemo(() => ({
    subscribe,
    publish
  }), [subscribe, publish]);
  
  return (
    <EventBusContext.Provider value={value}>
      {children}
    </EventBusContext.Provider>
  );
}; 