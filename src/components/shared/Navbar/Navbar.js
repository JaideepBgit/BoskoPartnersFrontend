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
    if (user?.role === 'admin') {
      const p = location.pathname.toLowerCase();
      if (p.includes('/home'))         setTabValue(0); // Home tab
      else if (p.includes('/dashboard')) setTabValue(1); // Dashboard tab
      else if (p.includes('/inventory')) setTabValue(2);
      else if (p.includes('/users'))     setTabValue(3);
      else if (p.includes('/reports'))   setTabValue(4);
      else if (p.includes('/visual-builder')) setTabValue(5);
      else if (p.includes('/user-reports')) setTabValue(6);
      else if (p.includes('/settings'))  setTabValue(7);
      else                                setTabValue(0);
    } else {
      // For regular users
      const p = location.pathname.toLowerCase();
      if (p.includes('/profile') || p.includes('/home'))    setUserTabValue(0);
      else if (p.includes('/survey')) setUserTabValue(1); // This covers both /surveys and /survey
      else if (p.includes('/reports')) setUserTabValue(2);
      else                             setUserTabValue(0);
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
      {user?.role === 'admin' ? (
        <List sx={{ pt: 2 }}>
          <ListItem 
            button 
            onClick={() => handleNavigation('/home')} 
            selected={tabValue === 0}
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
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => handleNavigation('/dashboard')} 
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
            <ListItemIcon><Inventory2Icon /></ListItemIcon>
            <ListItemText primary="Inventory Page" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => handleNavigation('/users')} 
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
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Users Management" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => handleNavigation('/reports')} 
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
            <ListItemIcon><BarChartIcon /></ListItemIcon>
            <ListItemText primary="Reports Page" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => handleNavigation('/visual-builder')} 
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
            <ListItemText primary="Visual Builder" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => handleNavigation('/user-reports')} 
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
            <ListItemIcon><AssessmentIcon /></ListItemIcon>
            <ListItemText primary="User Reports" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => handleNavigation('/settings')} 
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
      <AppBar position="static" sx={{ backgroundColor: '#f5f5f5', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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