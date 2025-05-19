import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import RestaurantPage from '../pages/RestaurantPage';
import Categories from '../pages/Categories';
import Restaurants from '../pages/Restaurants';
import OrdersPage from '../pages/OrdersPage';
import TicketManager from '../pages/TicketManager';
import TicketDetails from '../pages/TicketDetails';
import NearbyRestaurants from '../pages/NearbyRestaurants';
import SearchItems from '../pages/SearchItems';
import CategoriesList from '../pages/CategoriesList.jsx';
const AppNavigator = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<HomePage key={location.pathname} />} />
      <Route path="/restaurant/:restaurantId/:nearestBranchId" element={<RestaurantPage key={location.pathname} />} />
      <Route path="/categories/:categoryName" element={<CategoriesList key={location.pathname} />} />
      <Route path="/orders" element={<OrdersPage key={location.pathname} />} />
      <Route path="/categories" element={<Categories key={location.pathname} />} />
      <Route path="/restaurants" element={<Restaurants key={location.pathname} />} />
      <Route path="/tickets" element={<TicketManager key={location.pathname} />} />
      <Route path="/ticket/:ticketId" element={<TicketDetails key={location.pathname} />} />
      <Route path="/nearby-restaurants" element={<NearbyRestaurants key={location.pathname} />} />
      <Route path="/search" element={<SearchItems key={location.pathname} />} />
    </Routes>
  );
};

export default AppNavigator;
