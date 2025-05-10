import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Link, 
  IconButton, 
  Divider,
  useTheme as useMuiTheme,
  useMediaQuery
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import { ThemeContext } from '../context/ThemeContext';

const Footer = () => {
  const { theme } = React.useContext(ThemeContext);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.colors.background,
        color: theme.colors.text,
        py: 6,
        mt: 'auto',
        borderTop: `1px solid ${theme.colors.border}`,
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: `0px -2px 10px ${theme.colors.shadow}`,
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          mx: 'auto', 
          px: { xs: 2, sm: 3, md: 4, lg: 5 } 
        }}
      >
        {/* Main footer content */}
        <Grid container spacing={4} justifyContent="space-between">
          {/* Logo and copyright */}
          <Grid item xs={12} md={3}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.colors.primary, mb: 1 }}>
                Roll2Bowl
              </Typography>
              <Typography variant="body2" sx={{ color: theme.colors.secondaryText, mb: 2 }}>
                © {new Date().getFullYear()} Roll2Bowl Limited
              </Typography>
            </Box>
          </Grid>

          {/* Company */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: theme.colors.text,
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '30px',
                height: '2px',
                backgroundColor: theme.colors.primary,
              }
            }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['About Us', 'Careers', 'Roll2Bowl Blog', 'Roll2Bowl One', 'Roll2Bowl Instamart', 'Roll2Bowl Genie'].map((item) => (
                <Link
                  href="#"
                  key={item}
                  underline="none"
                  sx={{ 
                    color: theme.colors.secondaryText,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      color: theme.colors.primary,
                      transform: 'translateX(3px)',
                      display: 'inline-block'
                    }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Contact us */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: theme.colors.text,
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '30px',
                height: '2px',
                backgroundColor: theme.colors.primary,
              }
            }}>
              Contact us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['Help & Support', 'Partner with us', 'Ride with us'].map((item) => (
                <Link
                  href="#"
                  key={item}
                  underline="none"
                  sx={{ 
                    color: theme.colors.secondaryText,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      color: theme.colors.primary,
                      transform: 'translateX(3px)',
                      display: 'inline-block'
                    }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Available in */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: theme.colors.text,
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '30px',
                height: '2px',
                backgroundColor: theme.colors.primary,
              }
            }}>
              Available in
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['Bangalore', 'Delhi', 'Hyderabad', 'Mumbai', 'Pune'].map((city) => (
                <Link
                  href="#"
                  key={city}
                  underline="none"
                  sx={{ 
                    color: theme.colors.secondaryText,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      color: theme.colors.primary,
                      transform: 'translateX(3px)',
                      display: 'inline-block'
                    }
                  }}
                >
                  {city}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Life at Roll2Bowl */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: theme.colors.text,
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '30px',
                height: '2px',
                backgroundColor: theme.colors.primary,
              }
            }}>
              Life at Roll2Bowl
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['Order with Roll2Bowl', 'Roll2Bowl Team', 'SnackQuizzes'].map((item) => (
                <Link
                  href="#"
                  key={item}
                  underline="none"
                  sx={{ 
                    color: theme.colors.secondaryText,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      color: theme.colors.primary,
                      transform: 'translateX(3px)',
                      display: 'inline-block'
                    }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 600, 
            mb: 2,
            color: theme.colors.text,
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: '30px',
              height: '2px',
              backgroundColor: theme.colors.primary,
            }
          }}>
            Legal
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {['Terms & Conditions', 'Cookie Policy', 'Privacy Policy', 'Investor Relations'].map((item) => (
              <Link
                href="#"
                key={item}
                underline="none"
                sx={{ 
                  color: theme.colors.secondaryText,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    color: theme.colors.primary
                  }
                }}
              >
                {item}
              </Link>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: theme.colors.divider }} />

        {/* Social Links */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          flexDirection: {xs: 'column', sm: 'row'}, 
          gap: 2,
          alignItems: {xs: 'center', sm: 'center'}
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.colors.text }}>
            Social Links
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[
              { icon: <InstagramIcon />, color: '#C13584' },
              { icon: <FacebookIcon />, color: '#3b5998' },
              { icon: <TwitterIcon />, color: '#1DA1F2' },
              { icon: <YouTubeIcon />, color: '#FF0000' },
              { icon: <LinkedInIcon />, color: '#0077B5' }
            ].map((social, index) => (
              <IconButton 
                key={index}
                sx={{ 
                  color: theme.colors.secondaryText,
                  '&:hover': { 
                    color: social.color, 
                    transform: 'translateY(-3px)',
                    transition: 'all 0.3s ease'
                  } 
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;