import React, { useEffect, useState, useContext } from 'react';
import { restaurantService } from '../services/restaurantService';
import { fileService } from '../services/fileService';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

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
        // Process categories to download images
        const processedCategories = await Promise.all((res.categories || []).map(async (category) => {
          let imageUrl = null;
          if (category.image) {
            imageUrl = await fileService.downloadFile(category.image);
          }
          return { ...category, imageUrl };
        }));
        setCategories(processedCategories);
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

  const seoTitle = 'Browse Food Categories | Best Cuisines & Dishes | Roll2Bowl';
  const seoDescription = 'Explore all food categories and cuisines on Roll2Bowl. Find the best restaurants, dishes, and offers in your area. Discover new tastes and order online!';
  const canonicalUrl = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "https://www.roll2bowl.com/categories";
  const itemListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': categories.slice(0, 16).map((cat, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: cat.name,
      url: `${canonicalUrl}/${encodeURIComponent(cat.name?.toLowerCase?.() || '')}`
    }))
  };
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.roll2bowl.com/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: canonicalUrl
      }
    ]
  };

  // Visually hidden class for SEO headings
  const visuallyHidden = {
    position: 'absolute',
    left: '-9999px',
    height: '1px',
    width: '1px',
    overflow: 'hidden',
  };

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
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Preload og-image for performance */}
        <link rel="preload" as="image" href="https://www.roll2bowl.com/og-image.jpg" />
        {/* Open Graph tags */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://www.roll2bowl.com/og-image.jpg" />
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content="https://www.roll2bowl.com/og-image.jpg" />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(itemListStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbStructuredData)}</script>
      </Helmet>
      {/* Visually hidden SEO heading and paragraph */}
      <h1 style={visuallyHidden}>Browse Food Categories | Best Cuisines & Dishes | Roll2Bowl</h1>
      <p style={visuallyHidden}>Explore all food categories and cuisines on Roll2Bowl. Find the best restaurants, dishes, and offers in your area. Discover new tastes and order online!</p>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          bgcolor: theme?.colors?.background,
          color: theme?.colors?.text,
          transition: 'background 0.3s, color 0.3s',
          fontFamily: 'Trebuchet MS, Arial, sans-serif',
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
                    {cat.imageUrl ? (
                      <CardMedia
                        component="img"
                        image={cat.imageUrl}
                        alt={cat.name}
                        sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <CardMedia
                        component="img"
                        image="https://via.placeholder.com/300x180?text=No+Image"
                        alt={cat.name}
                        sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                        loading="lazy"
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
    </>
  );
};

export default Categories;
