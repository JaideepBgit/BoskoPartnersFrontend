import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  Tabs, 
  Tab, 
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
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [userTabValue, setUserTabValue] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
      else if (p.includes('/settings'))  setTabValue(5);
      else                                setTabValue(0);
    } else {
      // For regular users
      const p = location.pathname.toLowerCase();
      if (p.includes('/home') || p.includes('/dashboard'))    setUserTabValue(0);
      else if (p.includes('/surveys')) setUserTabValue(1);
      else if (p.includes('/reports')) setUserTabValue(2);
      else                             setUserTabValue(0);
    }
  }, [location, user]);

  const handleTabChange = (_, v) => {
    setTabValue(v);
    switch (v) {
      case 0: navigate('/home'); break; // Navigate to home page
      case 1: navigate('/dashboard'); break; // Navigate to dashboard
      case 2: navigate('/inventory'); break;
      case 3: navigate('/users');     break;
      case 4: navigate('/reports');   break;
      case 5: navigate('/settings');  break;
      default: navigate('/home');
    }
  };

  const handleUserTabChange = (_, v) => {
    setUserTabValue(v);
    switch (v) {
      case 0: navigate('/home'); break; // Navigate to home for regular users
      case 1: navigate('/surveys');   break;
      case 2: navigate('/reports');   break;
      default: navigate('/home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Mobile drawer content
  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <img
          src={logoImage}
          alt="SAURARA Logo"
          style={{ maxWidth: '150px', height: 'auto' }}
        />
      </Box>
      <Divider />
      {user?.role === 'admin' ? (
        <List>
          <ListItem button onClick={() => navigate('/home')} selected={tabValue === 0}>
            <ListItemIcon><HomeIcon color={tabValue === 0 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button onClick={() => navigate('/dashboard')} selected={tabValue === 1}>
            <ListItemIcon><DashboardIcon color={tabValue === 1 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => navigate('/inventory')} selected={tabValue === 2}>
            <ListItemIcon><Inventory2Icon color={tabValue === 2 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Inventory Page" />
          </ListItem>
          <ListItem button onClick={() => navigate('/users')} selected={tabValue === 3}>
            <ListItemIcon><PeopleIcon color={tabValue === 3 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Users Management" />
          </ListItem>
          <ListItem button onClick={() => navigate('/reports')} selected={tabValue === 4}>
            <ListItemIcon><BarChartIcon color={tabValue === 4 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Reports Page" />
          </ListItem>
          <ListItem button onClick={() => navigate('/settings')} selected={tabValue === 5}>
            <ListItemIcon><SettingsIcon color={tabValue === 5 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem button onClick={() => navigate('/home')} selected={userTabValue === 0}>
            <ListItemIcon><HomeIcon color={userTabValue === 0 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button onClick={() => navigate('/surveys')} selected={userTabValue === 1}>
            <ListItemIcon><AssignmentIcon color={userTabValue === 1 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Surveys" />
          </ListItem>
          <ListItem button onClick={() => navigate('/reports')} selected={userTabValue === 2}>
            <ListItemIcon><BarChartIcon color={userTabValue === 2 ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>
        </List>
      )}
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ backgroundColor: '#f5f5f5' }}>
      <Toolbar>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: '#633394' }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo on left */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', mr: 2, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img
            src={logoImage}
            alt="SAURARA Logo"
            style={{ maxWidth: isMobile ? '120px' : '180px', height: 'auto', margin: 4 }}
          />
        </Box>

        {/* Desktop navigation */}
        {!isMobile && (
          <>
            {/* Admin-only tabs */}
            {user?.role === 'admin' && (
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: '#633394',
                    fontWeight: 500,
                    '&.Mui-selected': { fontWeight: 700 },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#633394',
                  },
                }}
              >
                <Tab icon={<HomeIcon />} label="Home" iconPosition="start" />
                <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
                <Tab icon={<Inventory2Icon />} label="Inventory Page" iconPosition="start" />
                <Tab icon={<PeopleIcon />} label="Users Management" iconPosition="start" />
                <Tab icon={<BarChartIcon />} label="Reports Page" iconPosition="start" />
                <Tab icon={<SettingsIcon />} label="Settings" iconPosition="start" />
              </Tabs>
            )}

            {/* User tabs */}
            {(!user || user?.role === 'user') && (
              <Tabs
                value={userTabValue}
                onChange={handleUserTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: '#633394',
                    fontWeight: 500,
                    '&.Mui-selected': { fontWeight: 700 },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#633394',
                  },
                }}
              >
                <Tab icon={<HomeIcon />} label="Home" iconPosition="start" />
                <Tab icon={<AssignmentIcon />} label="Surveys" iconPosition="start" />
                <Tab icon={<BarChartIcon />} label="Reports" iconPosition="start" />
              </Tabs>
            )}
          </>
        )}

        {/* <-- Spacer pushes Logout to the right --> */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Logout always on the right - only show on desktop */}
        {!isMobile && (
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              color: '#633394',
              fontWeight: 700,
              '&:hover': { color: '#967CB2' },
            }}
          >
            Logout
          </Button>
        )}
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
