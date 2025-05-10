import React, { useEffect, useState } from 'react';
import { Container, Card, Box, Grid, Typography, Rating, CardMedia, CardContent, CircularProgress } from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { restaurantService } from '../services/restaurantService';
import { locationService } from '../services/locationService';
import { fileService } from '../services/fileService';
import { ThemeContext } from '../context/ThemeContext.jsx';

const CategoriesList = () => {
  const { categoryName: categoryNameParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCategoryName, setDisplayCategoryName] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const { theme } = React.useContext(ThemeContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get categoryId from location state
        let categoryId = location.state?.categoryId;
        if (!categoryId) {
          // If no categoryId in state, try to find it from the category name
          const allCats = await restaurantService.getAllCategories();
          const matchedCat = allCats.categories.find(cat => 
            cat.name.toLowerCase() === decodeURIComponent(categoryNameParam).toLowerCase()
          );
          if (!matchedCat) {
            setError('Category not found');
            setLoading(false);
            return;
          }
          categoryId = matchedCat._id;
          setDisplayCategoryName(matchedCat.name);
        } else {
          // If we have categoryId, get the display name
          const allCats = await restaurantService.getAllCategories();
          const matchedCat = allCats.categories.find(cat => cat._id === categoryId);
          setDisplayCategoryName(matchedCat?.name || categoryNameParam);
        }

        // 1. Get user location
        let locCoords = location.state?.coordinates || null;
        if (!locCoords) {
          const loc = await locationService.getCurrentLocation();
          locCoords = loc?.coordinates || null;
        }
        setCoordinates(locCoords);

        // 2. Fetch restaurants in this category, passing coordinates
        const params = {
          page: 1,
          limit: 9,
          coordinates: locCoords
        };
        const res = await restaurantService.getRestaurantsByCategory(categoryId, params);
        let restaurants = res.restaurants || [];

        // 3. For each restaurant, fetch full details, find nearest branch, and resolve images
        restaurants = await Promise.all(restaurants.map(async restaurant => {
          // Fetch full restaurant details
          let fullDetails = null;
          try {
            const res = await restaurantService.getRestaurantById(restaurant._id);
            fullDetails = res && res.restaurant ? res.restaurant : null;
          } catch (e) {
            fullDetails = null;
          }
          // Find nearestBranchId
          const nearestBranchId = restaurant.nearestBranch?._id || (restaurant.branches && restaurant.branches[0]?._id);
          let matchedBranch = null;
          if (nearestBranchId) {
            try {
              const branchRes = await restaurantService.getBranchById(nearestBranchId);
              console.log('branchRes', branchRes);
              console.log('branchRes.branch', branchRes.branch);
              if (branchRes) {
                matchedBranch = branchRes;
                // Calculate distance from user to branch
                if (
                  locCoords &&
                  Array.isArray(matchedBranch.location?.coordinates) &&
                  typeof matchedBranch.location.coordinates[1] === 'number' &&
                  typeof matchedBranch.location.coordinates[0] === 'number'
                ) {
                  matchedBranch.distanceInKm =
                    Math.round(
                      getDistanceFromLatLonInKm(
                        locCoords.latitude,
                        locCoords.longitude,
                        matchedBranch.location.coordinates[1],
                        matchedBranch.location.coordinates[0]
                      ) * 100
                    ) / 100;
                }
              }
              console.log('matchedBranch', matchedBranch);
            } catch (e) {
              matchedBranch = null;
            }
          }
          // Optionally resolve images
          let imageUrl = restaurant.coverImageUrl || restaurant.logoUrl || 'https://via.placeholder.com/300x200?text=Image';
          if (!restaurant.coverImageUrl && restaurant.coverImage) {
            imageUrl = await fileService.downloadFile(restaurant.coverImage);
          }
          return {
            ...restaurant,
            image: imageUrl,
            nearestBranch: matchedBranch || restaurant.nearestBranch || (restaurant.branches && restaurant.branches[0]) || null,
          };
        }));

        // Sort restaurants by nearestBranch.distanceInKm (ascending)
        restaurants.sort((a, b) => {
          const distA = a.nearestBranch?.distanceInKm ?? Infinity;
          const distB = b.nearestBranch?.distanceInKm ?? Infinity;
          return distA - distB;
        });
        setRestaurants(restaurants);
        console.log('Fetched restaurants in CategoriesList:', restaurants);
      } catch (err) {
        setError('Failed to load restaurants.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryNameParam]);

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
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        width: '100vw',
        minHeight: '100vh',
        background: theme.colors.background,
        padding: '4px',
        fontFamily: 'Poppins, Arial, sans-serif',
      }}
    >
      {/* Appetizer/Category Heading */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: theme.colors.text,
          letterSpacing: 1,
          textAlign: 'center',
          mt: 3,
          mb: 3,
        }}
      >
        {displayCategoryName || 'Category'}
      </Typography>

      {/* Restaurants Section */}
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1400,
          borderRadius: 4,
          background: theme.colors.background,
          boxShadow: 'none',
          padding: '24px',
          mx: 'auto',
        }}
      >
        {error ? (
          <Typography
            color="error"
            sx={{
              fontWeight: 600,
              fontSize: 18,
              textAlign: 'center',
            }}
          >
            {error}
          </Typography>
        ) : restaurants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ color: theme.colors.secondaryText, fontWeight: 600, mb: 2 }}>
              No restaurants found in this category.
            </Typography>
            <Typography sx={{ color: theme.colors.secondaryText, fontSize: 16 }}>
              Try another category or check back later.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              justifyItems: 'center',
              alignItems: 'stretch',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {restaurants.slice(0, 16).map((rest) => {
              const distanceNum = Number(rest.nearestBranch?.distanceInKm);
              const serviceableDistance = Number(rest.nearestBranch?.serviceableDistance);
              const notServiceable = !isNaN(distanceNum) && !isNaN(serviceableDistance) && distanceNum > serviceableDistance;
              return (
                <Card
                  key={rest._id || rest.id}
                  sx={{
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
                    cursor: notServiceable ? 'not-allowed' : 'pointer',
                    opacity: notServiceable ? 0.5 : 1,
                    pointerEvents: notServiceable ? 'none' : 'auto',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': notServiceable ? {} : { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' }
                  }}
                  onClick={async () => {
                    if (notServiceable) return;
                    try {
                      const response = await restaurantService.getRestaurantById(rest._id || rest.id);
                      if (response && response.restaurant) {
                        navigate(`/restaurant/${rest.name.toLowerCase().replace(/\s+/g, '-')}/${rest.nearestBranch?.name.toLowerCase().replace(/\s+/g, '-')}`, {
                          state: { 
                            restaurantId: rest._id,
                            branchId: rest.nearestBranch?._id,
                            categoryName: displayCategoryName
                          },
                        });
                      } else {
                        navigate(`/restaurant/${rest.name.toLowerCase().replace(/\s+/g, '-')}/${rest.nearestBranch?.name.toLowerCase().replace(/\s+/g, '-')}`, {
                          state: { 
                            restaurantId: rest._id,
                            branchId: rest.nearestBranch?._id,
                            categoryName: displayCategoryName
                          }
                        });
                      }
                    } catch (err) {
                      navigate(`/restaurant/${rest.name.toLowerCase().replace(/\s+/g, '-')}/${rest.nearestBranch?.name.toLowerCase().replace(/\s+/g, '-')}`, {
                        state: { 
                          restaurantId: rest._id,
                          branchId: rest.nearestBranch?._id,
                          categoryName: displayCategoryName
                        }
                      });
                    }
                  }}
                >
                  {rest.image && (
                    <Box sx={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                      <img src={rest.image} alt={rest.name + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                    </Box>
                  )}
                  <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, width: '100%' }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 700, flex: 1, color: theme.colors.text, fontFamily: 'Poppins, Arial, sans-serif', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{rest.name}</Typography>
                      <Box sx={{ ml: 1, px: 1, py: 0.25, bgcolor: theme.colors.success, color: '#fff', borderRadius: 2, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', minWidth: 36, justifyContent: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{rest.rating || 0}</span>
                      </Box>
                    </Box>
                    {rest.nearestBranch?.distanceInKm && (
                      <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1, textAlign: 'center' }}>
                        {rest.nearestBranch.distanceInKm} km
                      </Typography>
                    )}
                    {rest.nearestBranch?.address && (
                      <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{rest.nearestBranch.address}</Typography>
                    )}
                    {notServiceable && (
                      <Typography sx={{ color: theme.colors.error, fontWeight: 700, fontSize: 16, mt: 1 }}>
                        Not Serviceable
                      </Typography>
                    )}
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Card>
    </Container>
  );
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default CategoriesList;
