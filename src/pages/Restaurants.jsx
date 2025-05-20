import React, { useContext, useEffect, useState } from 'react'
import { ThemeContext } from '../context/ThemeContext.jsx'
import { restaurantService } from '../services/restaurantService'
import { fileService } from '../services/fileService'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import { useNavigate } from 'react-router-dom'
import { locationService } from '../services/locationService'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CircularProgress from '@mui/material/CircularProgress'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

const getCachedImage = async (url) => url; // Stub for caching, replace with real cache if needed

const Restaurants = () => {
  const { theme } = useContext(ThemeContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [coordinates, setCoordinates] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [type, setType] = useState('all'); // 'all', 'featured', 'popular'
  const [sortOption, setSortOption] = useState('distance'); // 'distance', 'rating', 'deliveryTime'
  const [hasMore, setHasMore] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchCoordinates = async () => {
      const selected = await locationService.getSelectedAddress();
      if (selected && selected.coordinates) {
        setCoordinates(selected.coordinates);
      } else {
        setCoordinates(null);
      }
    };
    fetchCoordinates();
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoadingRestaurants(true);
        console.log("Fetching restaurants with coordinates:", coordinates);
        if (!coordinates) {
          console.log("Missing coordinates data for restaurants");
          setRestaurants([]);
          setLoadingRestaurants(false);
          return;
        }
        const coords = coordinates;
        if (!coords.latitude || !coords.longitude) {
          console.error("Invalid coordinates structure", coords);
          setRestaurants([]);
          setLoadingRestaurants(false);
          return;
        }
        const params = {
          page: 1,
          limit: 20,
          condition: {
            coords: [coords.latitude, coords.longitude]
          }
        };
        if (type === 'featured') {
          params.condition.featured = true;
        } else if (type === 'popular') {
          params.condition.popular = true;
        }
        if (sortOption === 'rating') {
          params.sort = { rating: -1 };
        } else if (sortOption === 'deliveryTime') {
          params.sort = { deliveryTime: 1 };
        }
        const response = await restaurantService.getRestaurants(params);
        if (response && response.restaurants) {
          const formattedRestaurants = await Promise.all(response.restaurants.map(async restaurant => {
            let imageUrl = null;
            if (restaurant.image) {
              imageUrl = await fileService.downloadFile(restaurant.image);
            }
            
            let cuisineTypes = [];
            if (restaurant.cuisineTypes && Array.isArray(restaurant.cuisineTypes)) {
              cuisineTypes = restaurant.cuisineTypes.filter(type => typeof type === 'string' && type.length > 0);
            }
            if (cuisineTypes.length === 0) {
              cuisineTypes = ['Restaurant'];
            }
            return {
              id: restaurant._id,
              name: restaurant.name || 'Restaurant',
              image: imageUrl,
              rating: typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : '4.0',
              reviewCount: typeof restaurant.reviewCount === 'number' ? restaurant.reviewCount : 0,
              deliveryTime: restaurant.deliveryTime || '30-45 mins',
              distance: restaurant.nearestBranch?.distanceInKm
                ? `${restaurant.nearestBranch.distanceInKm} km`
                : 'Nearby',
              tags: cuisineTypes,
              verified: restaurant.verified || false,
              nearestBranchId: restaurant.nearestBranch?._id || null,
              nearestBranch: restaurant.nearestBranch || null,
              address: restaurant.nearestBranch?.address || ''
            };
          }));
          if (sortOption === 'distance') {
            formattedRestaurants.sort((a, b) => {
              const distA = parseFloat(a.distance?.toString().replace(/[^\d.]/g, '')) || Infinity;
              const distB = parseFloat(b.distance?.toString().replace(/[^\d.]/g, '')) || Infinity;
              return distA - distB;
            });
          }
          setRestaurants(formattedRestaurants);
          setHasMore(formattedRestaurants.length >= 20);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurants([]);
      } finally {
        setLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, [coordinates, type, sortOption]);

  if (loadingRestaurants) {
    return (
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background,
        color: theme.colors.primary,
      }}>
        <CircularProgress sx={{ color: theme.colors.primary }} size={64} thickness={4} />
      </Box>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: theme.colors.background,
        color: theme.colors.text,
        transition: 'background 0.3s, color 0.3s',
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        padding: '32px 0',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: theme.colors.text }}>
          All Featured Restaurants
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => {
              setTabValue(newValue);
              if (newValue === 0) setSortOption('distance');
              else if (newValue === 1) setSortOption('rating');
              else if (newValue === 2) setSortOption('deliveryTime');
            }}
            textColor="primary"
            indicatorColor="primary"
            aria-label="sort tabs"
          >
            <Tab label="Nearest" />
            <Tab label="Ratings" />
            <Tab label="Delivery Time" />
          </Tabs>
        </Box>
        <Box
          sx={{
            mt: 4,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 4,
            justifyItems: 'center',
            alignItems: 'stretch',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {restaurants.map((rest) => (
            <Card key={rest.id} sx={{
              background: theme.colors.card,
              borderRadius: 3,
              width: 320,
              minWidth: 320,
              maxWidth: 320,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              color: theme.colors.text,
              boxSizing: 'border-box',
              border: `1.5px solid ${theme.colors.border}`,
              p: 0,
              m: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' }
            }} onClick={() => {
              const restaurantSlug = slugify(rest.name);
              const branchSlug = slugify(rest.nearestBranch?.name || 'branch');
              navigate(`/restaurant/${restaurantSlug}/${branchSlug}`, {
                state: {
                  restaurantId: rest.id,
                  branchId: rest.nearestBranchId,
                  // You can add more state if needed
                }
              });
            }}>
              <Box sx={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <img 
                  src={rest.imageUrl || 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'} 
                  alt={rest.name + ' cover'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} 
                />
              </Box>
              <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, flex: 1, color: theme.colors.text, fontFamily: 'Trebuchet MS, Arial, sans-serif', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rest.name}</Typography>
                  <Box sx={{ ml: 1, px: 1, py: 0.25, bgcolor: theme.colors.success, color: '#fff', borderRadius: 2, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', minWidth: 36, justifyContent: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{rest.rating || 4.0}</span>
                  </Box>
                </Box>
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 15, mb: 0.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rest.tags?.join(', ')}</Typography>
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1 }}>{rest.address || rest.nearestBranch?.address}</Typography>
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1 }}>{rest.deliveryTime || '30-45 mins'} • {rest.deliveryFee || '₹30'}</Typography>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>
    </div>
  )
}

export default Restaurants
