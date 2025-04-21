import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user, setUser]       = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [userTabValue, setUserTabValue] = useState(0);

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  // load user once
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // sync tab value when route or user changes
  useEffect(() => {
    if (user?.role === 'admin') {
      const p = location.pathname.toLowerCase();
      if (p.includes('/dashboard'))    setTabValue(0);
      else if (p.includes('/inventory')) setTabValue(1);
      else if (p.includes('/users'))     setTabValue(2);
      else if (p.includes('/reports'))   setTabValue(3);
      else if (p.includes('/settings'))  setTabValue(4);
      else                                setTabValue(0);
    } else {
      // For regular users
      const p = location.pathname.toLowerCase();
      if (p.includes('/dashboard'))    setUserTabValue(0);
      else if (p.includes('/surveys')) setUserTabValue(1);
      else if (p.includes('/reports')) setUserTabValue(2);
      else                             setUserTabValue(0);
    }
  }, [location, user]);

  const handleTabChange = (_, v) => {
    setTabValue(v);
    switch (v) {
      case 0: navigate('/dashboard'); break;
      case 1: navigate('/inventory'); break;
      case 2: navigate('/users');     break;
      case 3: navigate('/reports');   break;
      case 4: navigate('/settings');  break;
      default: navigate('/dashboard');
    }
  };

  const handleUserTabChange = (_, v) => {
    setUserTabValue(v);
    switch (v) {
      case 0: navigate('/dashboard'); break;
      case 1: navigate('/surveys');   break;
      case 2: navigate('/reports');   break;
      default: navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#f5f5f5' }}>
      <Toolbar>
        {/* Logo on left */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', mr: 2, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img
            src={logoImage}
            alt="SAURARA Logo"
            style={{ maxWidth: '180px', height: 'auto', margin: 4 }}
          />
        </Box>

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
            <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
            <Tab icon={<AssignmentIcon />} label="Surveys" iconPosition="start" />
            <Tab icon={<BarChartIcon />} label="Reports" iconPosition="start" />
          </Tabs>
        )}

        {/* <-- Spacer pushes Logout to the right --> */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Logout always on the right */}
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
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
