// Icon utility file for standardized icons across the app
import React from 'react';
// Material UI Icons
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HelpIcon from '@mui/icons-material/Help';
import WorkIcon from '@mui/icons-material/Work';
import PlaceIcon from '@mui/icons-material/Place';

// Standard icon sizes
export const ICON_SIZES = {
  tiny: 12,
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 40
};

// Icon mapping for the app
// This replaces emoji icons with standardized vector icons
export const AppIcons = {
  // Navigation icons
  home: (props) => <HomeIcon {...props} />,
  search: (props) => <SearchIcon {...props} />,
  cart: (props) => <ShoppingCartIcon {...props} />,
  favorites: (props) => <StarIcon {...props} />,
  profile: (props) => <PersonIcon {...props} />,
  back: (props) => <ChevronLeftIcon {...props} />,
  menu: (props) => <MenuIcon {...props} />,
  close: (props) => <CloseIcon {...props} />,
  filter: (props) => <FilterListIcon {...props} />,
  down: (props) => <ExpandMoreIcon {...props} />,
  
  // Category icons
  burger: (props) => <FastfoodIcon {...props} />,
  donut: (props) => <DonutSmallIcon {...props} />,
  pizza: (props) => <LocalPizzaIcon {...props} />,
  mexican: (props) => <RestaurantMenuIcon {...props} />,
  asian: (props) => <RamenDiningIcon {...props} />,
  
  // Action icons
  add: (props) => <AddIcon {...props} />,
  remove: (props) => <RemoveIcon {...props} />,
  edit: (props) => <EditIcon {...props} />,
  delete: (props) => <DeleteIcon {...props} />,
  
  // Misc icons
  delivery: (props) => <LocalShippingIcon {...props} />,
  time: (props) => <AccessTimeIcon {...props} />,
  location: (props) => <LocationOnIcon {...props} />,
  verified: (props) => <VerifiedUserIcon {...props} />,
  rating: (props) => <StarIcon {...props} />,
  notification: (props) => <NotificationsIcon {...props} />,
  settings: (props) => <SettingsIcon {...props} />,
  logout: (props) => <LogoutIcon {...props} />,
  camera: (props) => <CameraAltIcon {...props} />,
  microphone: (props) => <MicIcon {...props} />,
  theme: (props) => props.isDark ? <Brightness7Icon {...props} /> : <Brightness4Icon {...props} />,
  
  // Payment icons
  creditCard: (props) => <CreditCardIcon {...props} />,
  
  // Contact icons
  email: (props) => <EmailIcon {...props} />,
  phone: (props) => <PhoneIcon {...props} />,
  help: (props) => <HelpIcon {...props} />,
  
  // Location icons
  work: (props) => <WorkIcon {...props} />,
  pin: (props) => <PlaceIcon {...props} />,
};