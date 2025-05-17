import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchFoodItems } from '../services/foodService';
import { locationService } from '../services/locationService';
import { restaurantService } from '../services/restaurantService';
import { CartContext } from '../context/CartContext.jsx';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { Helmet } from 'react-helmet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const slugify = str => str?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

const SearchItems = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const keyword = params.get('keyword') || '';
  const [filter, setFilter] = useState('dishes'); // 'dishes' or 'restaurants'
  const [dishes, setDishes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  // Cart logic
  const { cartItems, addToCart, changeCartItemQuantity, cartRestaurantId, branchId: cartBranchId, clearCart } = useContext(CartContext);
  const [cartConflictOpen, setCartConflictOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  // Static data
  const staticDishes = [
    { id: 1, name: 'Paneer Butter Masala', price: 220, restaurant: 'Classic Fusion', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80' },
    { id: 2, name: 'Margherita Pizza', price: 180, restaurant: 'Pizza Palace', image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=80&q=80' },
    { id: 3, name: 'Veg Biryani', price: 150, restaurant: 'Spice Hub', image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=80&q=80' },
  ];
  const staticRestaurants = [
    { id: 1, name: 'Classic Fusion', address: 'Banashankari, Bangalore', rating: 4.5, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80' },
    { id: 2, name: 'Pizza Palace', address: 'Jayanagar, Bangalore', rating: 4.2, image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=120&q=80' },
    { id: 3, name: 'Spice Hub', address: 'Koramangala, Bangalore', rating: 4.0, image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=120&q=80' },
  ];

  useEffect(() => {
    const fetchResults = async () => {
      if (!keyword) return;
      setLoading(true);
      let coords = null;
      try {
        const selected = await locationService.getSelectedAddress();
        coords = selected?.coordinates || null;
      } catch {}
      const searchTerm = keyword.replace(/-/g, ' ');
      const items = await searchFoodItems(searchTerm, coords);
      // Separate dishes and restaurants
      let foundDishes = items.filter(item => item.type === 'dish' || item.dishName);
      console.log('Found dishes from search API:', foundDishes);
      // Extract unique branch IDs from foundDishes
      const branchIds = [...new Set(foundDishes.map(dish => dish.branchId).filter(Boolean))];
      console.log('Branch IDs:', branchIds);
      // For each branchId, call getBranchById and log the result
      const branchResults = [];
      for (const branchId of branchIds) {
        const branchRes = await restaurantService.getBranchById(branchId);
        console.log('Branch API result for', branchId, branchRes);
        console.log('Branch details:', {
          id: branchRes?._id,
          name: branchRes?.branchName,
          address: branchRes?.address,
          restaurant: branchRes?.restaurant,
          location: branchRes?.location,
          serviceableDistance: branchRes?.serviceableDistance
        });
        if (branchRes) {
          branchResults.push(branchRes);
        }
      }
      console.log('Branch results:', branchResults);
      // Calculate distance from user to each branch and add distanceInKm
      if (coords && coords.latitude && coords.longitude) {
        for (const branch of branchResults) {
          const branchLat = branch.location?.coordinates[1];
          const branchLon = branch.location?.coordinates[0];
          if (typeof branchLat === 'number' && typeof branchLon === 'number') {
            branch.distanceInKm = getDistanceFromLatLonInKm(coords.latitude, coords.longitude, branchLat, branchLon);
            console.log('Distance for branch', branch._id, ':', branch.distanceInKm);
          } else {
            branch.distanceInKm = null;
          }
        }
      }
      
      console.log('Branch results with distance:', branchResults);
      setRestaurants(branchResults.length ? branchResults : staticRestaurants);
      console.log('Restaurants:', branchResults);
      // Fetch full food item details for each dish
      const foodItemIds = foundDishes.map(d => d._id || d.id).filter(Boolean);
      const enrichedDishes = await Promise.all(foodItemIds.map(async (id, idx) => {
        try {
          const res = await restaurantService.getFoodItemById(id);
          if (res && res.item) {
            let enriched = {
              ...foundDishes[idx],
              ...res.item,
              image: res.item.imageUrl || foundDishes[idx].image,
              name: res.item.name || foundDishes[idx].name,
              description: res.item.description || foundDishes[idx].description,
              category: res.item.category || foundDishes[idx].category,
              dishType: res.item.dishType || foundDishes[idx].dishType,
              variants: res.item.variants || foundDishes[idx].variants,
            };
            if (res.item.hasVariants && Array.isArray(res.item.variants) && res.item.variants.length > 0) {
              enriched.price = res.item.variants[0].price;
            } else {
              enriched.price = typeof res.item.price === 'number' ? res.item.price : foundDishes[idx].price;
            }
            if (!enriched.price || Number(enriched.price) === 0) enriched.price = 199;
            return enriched;
          }
        } catch (e) {}
        return foundDishes[idx];
      }));
      setDishes(enrichedDishes);
      setLoading(false);
    };
    fetchResults();
  }, [keyword]);

  // Add to Cart logic
  const handleAddToCartClick = async (dish) => {
    const restaurantId = dish.restaurantId || dish.restaurant?._id;
    const branchId = dish.branchId || dish.branch?._id;
    const cartItem = cartItems.find(ci => ci._id === dish._id);
    // 1. If item is already in cart, do nothing (show quantity controls)
    if (cartItem) return;
    // 2. If cart is not empty and restaurant/branch does not match, show conflict modal
    if (cartItems.length > 0) {
      const cartRestId = cartRestaurantId;
      const cartBrId = cartBranchId;
      if (cartRestId !== restaurantId || cartBrId !== branchId) {
        setPendingCartItem({ ...dish, restaurantId, branchId });
        setCartConflictOpen(true);
        return;
      }
    }
    // 7. If item is unavailable, do nothing (button is disabled in UI)
    if (dish.isAvailable === false) return;
    // Add to cart and navigate
    try {
      await addToCart({ ...dish, quantity: 1 }, restaurantId, branchId);
      setSnackbar({ open: true, message: 'Added to cart', severity: 'success' });
      if (restaurantId && branchId) {
        const restaurantName = dish.restaurant?.name || dish.restaurant?._id;
        const branchName = dish.branch?.branchName || dish.branch?._id;
        navigate(
          `/restaurant/${slugify(restaurantName)}/${slugify(branchName)}`,
          { state: { restaurantId, branchId } }
        );
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to add to cart', severity: 'error' });
    }
  };
  const handleQuantityChange = async (dish, delta) => {
    const cartItem = cartItems.find(ci => ci._id === dish._id);
    if (!cartItem) return;
    try {
      await changeCartItemQuantity(cartItem._id, delta);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to update cart', severity: 'error' });
    }
  };
  const handleCartConflict = async (clear) => {
    if (clear) {
      await clearCart();
      if (pendingCartItem) {
        await addToCart({ ...pendingCartItem, quantity: 1 }, pendingCartItem.restaurantId, pendingCartItem.branchId);
        setSnackbar({ open: true, message: 'Cart cleared and item added', severity: 'success' });
        // Navigate to the restaurant page for this item
        if (pendingCartItem.restaurantId && pendingCartItem.branchId) {
          const restaurantName = pendingCartItem.restaurant?.name || pendingCartItem.restaurant?._id;
          const branchName = pendingCartItem.branch?.branchName || pendingCartItem.branch?._id;
          navigate(
            `/restaurant/${slugify(restaurantName)}/${slugify(branchName)}`,
            { state: { restaurantId: pendingCartItem.restaurantId, branchId: pendingCartItem.branchId } }
          );
        }
      }
    }
    setCartConflictOpen(false);
    setPendingCartItem(null);
  };
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

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

  const seoTitle = keyword ? `Search results for "${keyword}" | Roll2Bowl` : 'Search Results | Roll2Bowl';
  const seoDescription = keyword ? `Find the best restaurants and dishes for "${keyword}" on Roll2Bowl. Discover top-rated food, exclusive offers, and fast delivery near you.` : 'Find the best restaurants and dishes on Roll2Bowl. Discover top-rated food, exclusive offers, and fast delivery near you.';
  const canonicalUrl = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname + (keyword ? `?keyword=${encodeURIComponent(keyword)}` : '')
    : "https://www.roll2bowl.com/search";
  const searchStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    'name': seoTitle,
    'description': seoDescription,
    'mainEntity': [
      ...dishes.slice(0, 10).map((dish, idx) => ({
        '@type': 'MenuItem',
        'position': idx + 1,
        'name': dish.name,
        'offers': {
          '@type': 'Offer',
          'price': dish.price,
          'priceCurrency': 'INR',
          'availability': dish.isAvailable === false ? 'OutOfStock' : 'InStock'
        }
      })),
      ...restaurants.slice(0, 10).map((rest, idx) => ({
        '@type': 'Restaurant',
        'name': rest.restaurant?.name || rest.name || rest.branchName,
        'address': rest.address || '',
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': rest.rating || 4.0,
          'reviewCount': rest.reviewCount || 0
        }
      }))
    ]
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
        name: 'Search',
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
        <script type="application/ld+json">{JSON.stringify(searchStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbStructuredData)}</script>
        {keyword && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": `Where can I order ${keyword} online?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `You can order ${keyword} from top-rated restaurants on Roll2Bowl with fast delivery and exclusive offers.`
                  }
                },
                {
                  "@type": "Question",
                  "name": `Which restaurants serve the best ${keyword}?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Browse our list of restaurants serving delicious ${keyword} near you, complete with ratings and reviews.`
                  }
                }
              ]
            })}
          </script>
        )}
      </Helmet>
      {/* Visually hidden SEO heading and paragraph */}
      <h1 style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>
        {keyword ? `Search results for "${keyword.replace(/-/g, ' ')}"` : 'Search Results'}
      </h1>
      {keyword && (
        <p style={{position:'absolute',left:'-9999px',height:'1px',width:'1px',overflow:'hidden'}}>
          Discover the best places to order {keyword} online in your city. See top-rated restaurants, prices, and delivery options for {keyword} on Roll2Bowl.
        </p>
      )}
      <div style={{ minHeight: '100vh', background: theme.colors.background, color: theme.colors.text, fontFamily: 'Trebuchet MS, Arial, sans-serif' }}>
        <Box sx={{ width: '100%', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: 1600, mx: 'auto', px: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.colors.text, mb: 3 }}>
            {keyword ? `Search results for "${keyword.replace(/-/g, ' ')}"` : 'Search Results'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant={filter === 'dishes' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setFilter('dishes')}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                bgcolor: filter === 'dishes' ? theme.colors.primary : theme.colors.card,
                color: filter === 'dishes' ? '#fff' : theme.colors.primary,
                borderColor: theme.colors.primary,
                '&:hover': {
                  bgcolor: theme.colors.primary,
                  color: '#fff',
                },
              }}
            >
              Dishes
            </Button>
            <Button
              variant={filter === 'restaurants' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setFilter('restaurants')}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                bgcolor: filter === 'restaurants' ? theme.colors.primary : theme.colors.card,
                color: filter === 'restaurants' ? '#fff' : theme.colors.primary,
                borderColor: theme.colors.primary,
                '&:hover': {
                  bgcolor: theme.colors.primary,
                  color: '#fff',
                },
              }}
            >
              Restaurants
            </Button>
          </Box>
          {/* Dishes Cards */}
          {filter === 'dishes' ? (
            <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '12px', rowGap: '12px', justifyItems: 'center' }}>
              {dishes.length ? dishes.map(dish => {
                const cartItem = cartItems.find(ci => ci._id === dish._id);
                const quantity = cartItem ? cartItem.quantity : 0;
                const restaurantId = dish.restaurantId || dish.restaurant?._id;
                const branchId = dish.branchId || dish.branch?._id;
                // Set displayPrice: if price is zero, missing, or falsy, use 199
                let displayPrice = dish.price;
                if (dish.hasVariants && Array.isArray(dish.variants) && dish.variants.length > 0) {
                  displayPrice = dish.variants[0].price;
                }
                if (!displayPrice || Number(displayPrice) === 0) displayPrice = 199;

                // Find the branch details for this dish
                const branchDetails = restaurants.find(r => r._id === branchId);
                const notServiceable = branchDetails && 
                  typeof branchDetails.distanceInKm === 'number' && 
                  typeof branchDetails.serviceableDistance === 'number' && 
                  branchDetails.distanceInKm > branchDetails.serviceableDistance;

                return (
                  <Card
                    key={dish._id || dish.id}
                    sx={{
                      bgcolor: (dish.isAvailable === false || notServiceable) ? theme.colors.card + '80' : theme.colors.card,
                      color: (dish.isAvailable === false || notServiceable) ? theme.colors.text : theme.colors.text,
                      borderRadius: 3,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      p: 0,
                      m: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'stretch',
                      minHeight: 170,
                      maxWidth: 440,
                      width: '100%',
                      opacity: (dish.isAvailable === false || notServiceable) ? 0.6 : 1,
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px) scale(1.03)' },
                      cursor: (dish.isAvailable === false || notServiceable) ? 'not-allowed' : 'pointer',
                      pointerEvents: (dish.isAvailable === false || notServiceable) ? 'none' : 'auto',
                    }}
                    onClick={() => {
                      if (dish.isAvailable === false || notServiceable) return;
                      if (restaurantId && branchId) {
                        const restaurantName = dish.restaurant?.name || branchDetails?.restaurant?.name;
                        const branchName = branchDetails?.branchName;
                        navigate(
                          `/restaurant/${slugify(restaurantName)}/${slugify(branchName)}`,
                          { state: { restaurantId, branchId } }
                        );
                      }
                    }}
                  >
                    {/* Dish Image */}
                    <Box sx={{ width: 140, height: 150, borderRadius: 2, overflow: 'hidden', border: '1.5px solid #bdbdbd', m: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme.colors.card }}>
                      <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    </Box>
                    {/* Dish Details */}
                    <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography
                          sx={{ fontWeight: 700, fontSize: 20, color: (dish.isAvailable === false || notServiceable) ? theme.colors.text : theme.colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, lineHeight: 1 }}
                          noWrap
                        >
                          {dish.name}
                        </Typography>
                        {/* Veg/Non-Veg Icon at end of title */}
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            border: '2px solid',
                            borderColor: dish.dishType === 'veg' ? '#43a047' : '#e53935',
                            borderRadius: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fff',
                            boxSizing: 'border-box',
                            ml: 1
                          }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: dish.dishType === 'veg' ? '#43a047' : '#e53935',
                            }}
                          />
                        </Box>
                      </Box>
                      {dish.restaurantName || dish.restaurant ? (
                        <Typography sx={{ color: (dish.isAvailable === false || notServiceable) ? theme.colors.text : theme.colors.secondaryText, fontSize: 14, mb: 0.5 }}>
                          {dish.restaurantName || dish.restaurant}
                        </Typography>
                      ) : null}
                      <Typography sx={{ color: (dish.isAvailable === false || notServiceable) ? theme.colors.text : theme.colors.secondaryText, fontSize: 15, mb: 1 }}>
                        {dish.description}
                      </Typography>
                      <Typography sx={{ color: (dish.isAvailable === false || notServiceable) ? theme.colors.text : theme.colors.text, fontSize: 16, mb: 1, fontWeight: 500 }}>
                        {dish.category && dish.category.name ? dish.category.name : ''}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: theme.colors.primary, fontSize: 18, mb: 1 }}>
                        ₹{displayPrice}
                      </Typography>
                      {notServiceable && (
                        <Typography sx={{ color: 'red', fontSize: 14, mb: 1, fontWeight: 500 }}>
                          Not Serviceable
                        </Typography>
                      )}
                      {quantity > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Button size="small" onClick={e => { e.stopPropagation(); handleQuantityChange(dish, -1); }}>-</Button>
                          <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600, color: theme.colors.text }}>{quantity}</Typography>
                          <Button size="small" onClick={e => { e.stopPropagation(); handleQuantityChange(dish, 1); }}>+</Button>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          color={(dish.isAvailable === false || notServiceable) ? 'error' : 'warning'}
                          sx={{ fontWeight: 600, borderRadius: 2, width: 140, mt: 'auto', opacity: (dish.isAvailable === false || notServiceable) ? 0.95 : 1 }}
                          onClick={e => { e.stopPropagation(); handleAddToCartClick(dish); }}
                          disabled={dish.isAvailable === false || notServiceable}
                        >
                          {(dish.isAvailable === false || notServiceable) ? (notServiceable ? 'Not Serviceable' : 'Out of Stock') : 'Add to Cart'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              }) : (
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 18, mt: 4 }}>
                  No dishes found for "{keyword}".
                      </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: '12px', rowGap: '12px', justifyItems: 'center' }}>
              {restaurants.length ? restaurants.map(rest => {
                const notServiceable = typeof rest.distanceInKm === 'number' && typeof rest.serviceableDistance === 'number' && rest.distanceInKm > rest.serviceableDistance;
                const restaurantId = rest.restaurant?._id;
                const branchId = rest._id;
                const restaurantName = (rest.restaurant?.name || rest.branchName || rest.name || '').toLowerCase().replace(/\s+/g, '-');
                const branchName = (rest.branchName || rest.name || '').toLowerCase().replace(/\s+/g, '-');
                return (
                  <Card
                    key={rest.id}
                    sx={{
                      background: notServiceable ? theme.colors.card + '80' : theme.colors.card,
                      opacity: notServiceable ? 0.7 : 1,
                      borderRadius: 3,
                      width: 320,
                      minWidth: 320,
                      maxWidth: 320,
                      minHeight: 230,
                      height: 'auto',
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
                    }}
                    onClick={() => {
                      if (notServiceable) return;
                      if (restaurantId && branchId) {
                        navigate(
                          `/restaurant/${slugify(restaurantName)}/${slugify(branchName)}`,
                          { state: { restaurantId, branchId } }
                        );
                      }
                    }}
                  >
                    {((rest.restaurant && rest.restaurant.image) || rest.image) && (
                      <Box sx={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                        <img src={rest.restaurant?.image || rest.image} alt={(rest.name || rest.branchName) + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} loading="lazy" />
                      </Box>
                    )}
                    <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0.5, alignItems: 'center', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center', width: '100%' }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 700, flex: 1, color: theme.colors.text, fontFamily: 'Trebuchet MS, Arial, sans-serif', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{rest.branchName || rest.name}</Typography>
                        <Box sx={{ ml: 1, px: 1, py: 0.25, bgcolor: theme.colors.success, color: '#fff', borderRadius: 2, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', minWidth: 36, justifyContent: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{rest.rating || 4.0}</span>
                        </Box>
                      </Box>
                      <Typography sx={{ color: theme.colors.secondaryText, fontSize: 14, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                        {rest.address}
                      </Typography>
                      {typeof rest.distanceInKm === 'number' && (
                        <Typography sx={{ color: notServiceable ? 'red' : theme.colors.secondaryText, fontSize: 14, mb: 0.5, fontWeight: notServiceable ? 700 : 400, textAlign: 'center' }}>
                          {notServiceable ? 'Not Serviceable' : `${rest.distanceInKm.toFixed(2)} km`}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                );
              }) : (
                <Typography sx={{ color: theme.colors.secondaryText, fontSize: 18, mt: 4 }}>
                  No restaurants found for "{keyword}".
                </Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Cart Conflict Dialog */}
        <Dialog open={cartConflictOpen} onClose={() => setCartConflictOpen(false)}>
          <DialogTitle>Cart Conflict</DialogTitle>
          <DialogContent>
            <Typography>You already have an item in your cart. Would you like to clear your cart and add this item instead?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleCartConflict(true)} color="primary" variant="contained">Clear Cart & Add</Button>
            <Button onClick={() => handleCartConflict(false)} color="secondary" variant="outlined">Cancel</Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            icon={snackbar.severity === 'success' ? <CheckCircleIcon sx={{ fontSize: 28, mr: 1, color: '#fff' }} /> : undefined}
            sx={{
              width: '100%',
              bgcolor: snackbar.severity === 'success' ? '#219653' : theme.colors.card,
              color: snackbar.severity === 'success' ? '#fff' : theme.colors.text,
              borderRadius: 2.5,
              fontWeight: 400,
              fontSize: 16,
              minWidth: 280,
              px: 2,
              py: 1,
              boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'Trebuchet MS, Arial, sans-serif',
              border: snackbar.severity === 'success' ? 'none' : `2px solid ${theme.colors.primary}`,
              '& .MuiAlert-icon': {
                color: '#fff',
              },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </>
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

export default SearchItems; 