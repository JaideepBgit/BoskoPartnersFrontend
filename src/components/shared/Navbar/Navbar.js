import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import EmailIcon from '@mui/icons-material/Email';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [userTabValue, setUserTabValue] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // load user once
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // sync tab value when route or user changes
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'root' || user?.role === 'manager') {
      const p = location.pathname.toLowerCase();
      // Simplified menu matching
      if (p.includes('/dashboard') || p.includes('/manager-dashboard')) setTabValue(1);           // 1. Dashboard
      else if (p.includes('/inventory')) setTabValue(2);      // 2. Surveys
      else if (p.includes('/organization')) setTabValue(3);   // 3. Organizations
      else if (p.includes('/associations')) setTabValue(7);   // 7. Associations
      else if (p.includes('/users')) setTabValue(4);          // 4. Users
      else if (p.includes('/contact-referrals')) setTabValue(8); // 8. Contact Referrals
      else if (p.includes('/email-templates')) setTabValue(9);   // 9. Email Templates
      else if (p.includes('/reports') || p.includes('/user-reports')) setTabValue(5); // 5. Reports
      else if (p.includes('/settings')) setTabValue(6);       // 6. Settings
      else setTabValue(1); // Default to Dashboard
    } else {
      // For regular users
      const p = location.pathname.toLowerCase();
      if (p.includes('/profile') || p.includes('/home')) setUserTabValue(0);
      else if (p.includes('/survey')) setUserTabValue(1); // This covers both /surveys and /survey
      else if (p.includes('/reports')) setUserTabValue(2);
      else setUserTabValue(0);
    }
  }, [location, user]);

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar after navigation
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', borderBottom: '1px solid #e0e0e0' }}>
        <img
          src={logoImage}
          alt="SAURARA Logo"
          style={{ maxWidth: '180px', height: 'auto' }}
        />
      </Box>
      {(user?.role === 'admin' || user?.role === 'root' || user?.role === 'manager') ? (
        <List sx={{ pt: 2 }}>
          {/* 1. Dashboard */}
          <ListItem
            button
            onClick={() => handleNavigation(user?.role === 'manager' ? '/manager-dashboard' : '/dashboard')}
            selected={tabValue === 1}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>

          {/* 2. Surveys */}
          <ListItem
            button
            onClick={() => handleNavigation('/inventory')}
            selected={tabValue === 2}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><AssignmentIcon /></ListItemIcon>
            <ListItemText primary="Surveys" />
          </ListItem>

          {/* 3. Organizations - Only for Admin/Root */}
          {(user?.role === 'admin' || user?.role === 'root') && (
            <ListItem
              button
              onClick={() => handleNavigation('/organization-management')}
              selected={tabValue === 3}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#633394',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '&:hover': {
                    backgroundColor: '#533082',
                  },
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                borderRadius: '8px',
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon><BusinessIcon /></ListItemIcon>
              <ListItemText primary="Organizations" />
            </ListItem>
          )}

          {/* 7. Associations - Only for Admin/Root */}
          {(user?.role === 'admin' || user?.role === 'root') && (
            <ListItem
              button
              onClick={() => handleNavigation('/associations')}
              selected={tabValue === 7}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#633394',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '&:hover': {
                    backgroundColor: '#533082',
                  },
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                borderRadius: '8px',
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon><GroupWorkIcon /></ListItemIcon>
              <ListItemText primary="Associations" />
            </ListItem>
          )}

          {/* 4. Users */}
          <ListItem
            button
            onClick={() => handleNavigation('/users')}
            selected={tabValue === 4}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Users" />
          </ListItem>

          {/* 8. Contact Referrals */}
          <ListItem
            button
            onClick={() => handleNavigation('/contact-referrals')}
            selected={tabValue === 8}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><ContactMailIcon /></ListItemIcon>
            <ListItemText primary="Contact Referrals" />
          </ListItem>

          {/* 9. Email Templates */}
          <ListItem
            button
            onClick={() => handleNavigation('/email-templates')}
            selected={tabValue === 9}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><EmailIcon /></ListItemIcon>
            <ListItemText primary="Email Templates" />
          </ListItem>

          {/* 5. Reports */}
          <ListItem
            button
            onClick={() => handleNavigation('/user-reports')}
            selected={tabValue === 5}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><BarChartIcon /></ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>

          {/* 6. Settings */}
          <ListItem
            button
            onClick={() => handleNavigation('/settings')}
            selected={tabValue === 6}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      ) : (
        <List sx={{ pt: 2 }}>
          <ListItem
            button
            onClick={() => handleNavigation('/profile')}
            selected={userTabValue === 0}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleNavigation('/surveys')}
            selected={userTabValue === 1}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#633394',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: '#533082',
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon><AssignmentIcon /></ListItemIcon>
            <ListItemText primary="Surveys" />
          </ListItem>
        </List>
      )}
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <Divider />
        <List>
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                '& .MuiListItemIcon-root': {
                  color: '#d32f2f',
                },
              },
              borderRadius: '8px',
              mx: 1,
              my: 1,
            }}
          >
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar>
          {/* Hamburger menu button - always visible */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{ mr: 2, color: '#633394' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo in center */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            <img
              src={logoImage}
              alt="SAURARA Logo"
              style={{ maxWidth: isMobile ? '140px' : '200px', height: 'auto', margin: 4 }}
            />
          </Box>

          {/* Empty box to balance the layout */}
          <Box sx={{ width: 48 }} />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={handleSidebarToggle}
        ModalProps={{
          keepMounted: true, // Better open performance
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            height: '100vh',
            position: 'relative'
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Navbar;