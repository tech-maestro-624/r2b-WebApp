import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Modals from '../components/common/Modals';

// Lazy-loaded pages (these should be imported from App.jsx)
import { lazy } from 'react';
const HomePage = lazy(() => import('../pages/HomePage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const TicketDetails = lazy(() => import('../pages/TicketDetails'));
const SearchItems = lazy(() => import('../pages/SearchItems'));
const RestaurantPage = lazy(() => import('../pages/RestaurantPage'));
const Categories = lazy(() => import('../pages/Categories'));
const CategoriesList = lazy(() => import('../pages/CategoriesList.jsx'));
const Restaurants = lazy(() => import('../pages/Restaurants'));
const TicketManager = lazy(() => import('../pages/TicketManager'));
const NearbyRestaurants = lazy(() => import('../pages/NearbyRestaurants'));

// Main content with routes
const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <>
      <Routes location={location}>
        <Route path="/" element={<Layout Component={HomePage} componentKey="home" />} />
        <Route path="/orders" element={<Layout Component={OrdersPage} componentKey="orders" />} />
        <Route path="/restaurant/:restaurantId/:nearestBranchId" element={<Layout Component={RestaurantPage} componentKey="restaurant" />} />
        <Route path="/categories/:categoryName" element={<Layout Component={CategoriesList} componentKey="category-list" />} />
        <Route path="/categories" element={<Layout Component={Categories} componentKey="categories" />} />
        <Route path="/restaurants" element={<Layout Component={Restaurants} componentKey="restaurants" />} />
        <Route path="/tickets" element={<Layout Component={TicketManager} componentKey="tickets" />} />
        <Route path="/ticket/:ticketId" element={<Layout Component={TicketDetails} componentKey="ticket-details" />} />
        <Route path="/nearby-restaurants" element={<Layout Component={NearbyRestaurants} componentKey="nearby" />} />
        <Route path="/search" element={<Layout Component={SearchItems} componentKey="search" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Modals />
    </>
  );
};

export default AppRoutes; 