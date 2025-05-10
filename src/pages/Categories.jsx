import React, { useEffect, useState, useContext } from 'react';
import { restaurantService } from '../services/restaurantService';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantCounts, setRestaurantCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await restaurantService.getAllCategories();
        setCategories(res.categories || []);
      } catch (err) {
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!categories.length) return;
      setCountsLoading(true);
      try {
        const counts = {};
        await Promise.all(
          categories.slice(0, 16).map(async (cat) => {
            try {
              const res = await restaurantService.getRestaurantsByCategory(cat._id);
              counts[cat._id] = Array.isArray(res.restaurants) ? res.restaurants.length : (res.restaurantsCount || 0);
            } catch {
              counts[cat._id] = 0;
            }
          })
        );
        setRestaurantCounts(counts);
      } finally {
        setCountsLoading(false);
      }
    };
    fetchCounts();
  }, [categories]);

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme?.colors?.background,
        color: theme?.colors?.primary,
      }}>
        <CircularProgress sx={{ color: theme?.colors?.primary }} size={64} thickness={4} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        bgcolor: theme?.colors?.background,
        color: theme?.colors?.text,
        transition: 'background 0.3s, color 0.3s',
        fontFamily: 'Poppins, Arial, sans-serif',
        py: 6,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: theme?.colors?.text || '#222' }}>
          Browse All Categories
        </Typography>
        {error ? (
          <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {categories.slice(0, 16).map((cat) => (
              <Grid item xs={12} sm={6} md={3} lg={3} key={cat._id || cat.name}>
                <Card
                  sx={{ borderRadius: 3, boxShadow: 3, background: theme?.colors?.card, color: theme?.colors?.text, p: 0, m: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 260, maxWidth: 320, width: '100%', transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' } }}
                  onClick={() => navigate(`/categories/${encodeURIComponent(cat.name.toLowerCase())}`, { state: { categoryId: cat._id } })}
                >
                  {cat.imageUrl && (
                    <CardMedia
                      component="img"
                      image={cat.imageUrl}
                      alt={cat.name}
                      sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme?.colors?.text }}>{cat.name}</Typography>
                    <Typography sx={{ color: theme?.colors?.secondaryText, fontSize: 15, mb: 1 }}>
                      {countsLoading && typeof restaurantCounts[cat._id] === 'undefined' ? <CircularProgress size={18} /> : `${restaurantCounts[cat._id] || 0} restaurants`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Categories;
