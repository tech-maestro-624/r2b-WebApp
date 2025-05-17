import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { restaurantService } from '../services/restaurantService';
import { fileService } from '../services/fileService';
import { locationService } from '../services/locationService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Link } from 'react-router-dom';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';

const NearbyRestaurants = () => {
  const { theme } = useContext(ThemeContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState(null);
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

  const fetchNearbyRestaurants = async (address) => {
    setLoading(true);
    try {
      if (!address || !address.coordinates || !address.coordinates.latitude || !address.coordinates.longitude) {
        setRestaurants([]);
        setLoading(false);
        return;
      }

      const params = {
        page: 1,
        limit: 100,
        order: 'asc',
        condition: { 
          coords: [address.coordinates.latitude, address.coordinates.longitude] 
        }
      };

      // Add sorting based on tab selection
      if (tabValue === 1) { // Rating
        params.sort = 'rating';
        params.order = 'desc';
      } else if (tabValue === 2) { // Delivery Time
        params.sort = 'deliveryTime';
        params.order = 'asc';
      }

      let res = await restaurantService.getRestaurants(params);
      let restaurants = res.restaurants || [];
      
      if (restaurants.length > 0) {
        // Sort by distance if that's the selected option
        if (tabValue === 0) {
          restaurants = restaurants.sort((a, b) => {
            const distA = Number(a.nearestBranch?.distanceInKm) || Infinity;
            const distB = Number(b.nearestBranch?.distanceInKm) || Infinity;
            return distA - distB;
          });
        }

        restaurants = await Promise.all(restaurants.map(async restaurant => {
          let imageUrl = restaurant.coverImageUrl || restaurant.logoUrl || 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
          if (!restaurant.coverImageUrl && restaurant.coverImage) {
            imageUrl = await fileService.downloadFile(restaurant.coverImage);
          }
          return {
            id: restaurant._id,
            name: restaurant.nearestBranch?.name || restaurant.name,
            image: imageUrl,
            rating: restaurant.rating || 4.0,
            reviewCount: restaurant.reviewCount || 0,
            deliveryFee: restaurant.deliveryFee === 0 ? 'free delivery' : `₹${restaurant.deliveryFee}`,
            deliveryTime: restaurant.deliveryTime || '30-45 mins',
            distance: restaurant.nearestBranch?.distanceInKm ? `${restaurant.nearestBranch.distanceInKm} km` : 'Nearby',
            tags: restaurant.cuisineTypes || ['FAST FOOD'],
            verified: restaurant.verified || false,
            nearestBranchId: restaurant.nearestBranch?._id || null,
            nearestBranch: restaurant.nearestBranch || null,
            address: restaurant.nearestBranch?.address || '',
            ...restaurant,
          };
        }));
      }
      setRestaurants(restaurants);
      console.log('Nearby restaurants from API:', restaurants);
    } catch (error) {
      setRestaurants([]);
      console.error('Error fetching nearby restaurants:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (coordinates) {
      fetchNearbyRestaurants({ coordinates });
    }
  }, [coordinates, tabValue]);

  if (loading) {
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
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: theme.colors.background,
      color: theme.colors.text,
      transition: 'background 0.3s, color 0.3s',
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      padding: '32px 0',
    }}>
      <Container maxWidth="xl" sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: theme.colors.text }}>
          Nearby Restaurants
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => {
              setTabValue(newValue);
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 4,
            justifyItems: 'center',
            alignItems: 'stretch',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {restaurants.map((rest) => {
            const distanceNum = Number(rest.nearestBranch?.distanceInKm);
            const serviceableDistance = Number(rest.nearestBranch?.serviceableDistance);
            const notServiceable = !isNaN(distanceNum) && !isNaN(serviceableDistance) && distanceNum > serviceableDistance;

            return (
              <Link 
                to={notServiceable ? '#' : `/restaurant/${rest.id}/${rest.nearestBranchId}`} 
                style={{ textDecoration: 'none', pointerEvents: notServiceable ? 'none' : 'auto' }} 
                key={rest.id}
              >
                <Card sx={{
                  background: notServiceable ? `${theme.colors.card}80` : theme.colors.card,
                  opacity: notServiceable ? 0.7 : 1,
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
                  cursor: notServiceable ? 'not-allowed' : 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': notServiceable ? {} : { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' }
                }}>
                  {rest.image && (
                    <Box sx={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                      <img src={rest.image} alt={rest.name + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                    </Box>
                  )}
                  <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 700, flex: 1, color: theme.colors.text, fontFamily: 'Trebuchet MS, Arial, sans-serif', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rest.nearestBranch?.name || rest.name}
                      </Typography>
                      <Box sx={{ ml: 1, px: 1, py: 0.25, bgcolor: theme.colors.success, color: '#fff', borderRadius: 2, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', minWidth: 36, justifyContent: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{rest.rating}</span>
                      </Box>
                    </Box>
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 15, mb: 0.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rest.tags?.join(', ')}
                    </Typography>
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1 }}>
                      {notServiceable ? 'Not Serviceable' : (rest.distance || rest.nearestBranch?.distanceInKm ? `${rest.nearestBranch?.distanceInKm} km` : '')}
                    </Typography>
                    {rest.address && (
                      <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rest.address}
                      </Typography>
                    )}
                    <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1 }}>
                      {rest.deliveryTime} • {rest.deliveryFee}
                    </Typography>
                  </Box>
                </Card>
              </Link>
            );
          })}
        </Box>
      </Container>
    </div>
  );
};

export default NearbyRestaurants; 