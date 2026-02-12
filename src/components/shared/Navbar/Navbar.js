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
  useTheme,
  Avatar,
  Typography,
  Popover,
  Paper,
  Dialog,
  DialogContent,
  Snackbar,
  Alert
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
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { generateReferralLink } from '../../../services/UserManagement/ContactReferralService';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [userTabValue, setUserTabValue] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountAnchorEl, setAccountAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Invite modal state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSnackbar, setInviteSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const accountMenuOpen = Boolean(accountAnchorEl);

  const handleInviteClick = async () => {
    if (!user?.id) return;

    setInviteDialogOpen(true);
    setInviteLoading(true);

    try {
      const result = await generateReferralLink(user.id);
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/contact-referral/${result.referral_code}`);
    } catch (error) {
      console.error('Error generating invite link:', error);
      setInviteSnackbar({
        open: true,
        message: 'Error generating invite link. Please try again.',
        severity: 'error'
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteSnackbar({
        open: true,
        message: 'Invite link copied to clipboard!',
        severity: 'success'
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setInviteSnackbar({
        open: true,
        message: 'Invite link copied to clipboard!',
        severity: 'success'
      });
    }
  };

  const handleAccountClick = (event) => {
    setAccountAnchorEl(event.currentTarget);
  };

  const handleAccountClose = () => {
    setAccountAnchorEl(null);
  };

  // Get user display name and initials
  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email;
    return 'User';
  };

  // Get the correct profile route based on user role
  const getProfileRoute = () => {
    if (!user?.role) return '/profile';
    if (user.role === 'admin' || user.role === 'root' || user.role === 'manager') {
      return '/admin-profile';
    }
    return '/profile';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    if (!user?.role) return 'Personal';
    const roleMap = {
      admin: 'Admin',
      root: 'Root Admin',
      manager: 'Manager',
      user: 'Personal',
    };
    return roleMap[user.role] || user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

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
            <ListItemText primary="Referrals" />
          </ListItem>

          {/* 9. Email Templates */}
          <ListItem
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
            <ListItemText primary="Templates" />
          </ListItem>

          {/* 5. Reports */}
          <ListItem
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
        </List>
      ) : (
        <List sx={{ pt: 2 }}>
          <ListItem
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

          {/* Invite button - visible for admin, root, manager */}
          {user && (user.role === 'admin' || user.role === 'root' || user.role === 'manager') && (
            <Button
              variant="outlined"
              startIcon={<MailOutlineIcon />}
              onClick={handleInviteClick}
              sx={{
                borderColor: '#633394',
                color: '#633394',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '8px',
                px: 2,
                py: 0.5,
                mr: 2,
                '&:hover': {
                  borderColor: '#4a2570',
                  backgroundColor: 'rgba(99, 51, 148, 0.04)',
                },
              }}
            >
              Invite
            </Button>
          )}

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

          {/* Account dropdown trigger */}
          {user ? (
            <Box
              onClick={handleAccountClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '24px',
                '&:hover': { backgroundColor: '#f5f0fa' },
              }}
            >
              {!isMobile && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#333', lineHeight: 1.2 }}
                  >
                    {getUserDisplayName()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#888', lineHeight: 1 }}
                  >
                    {getRoleLabel()}
                  </Typography>
                </Box>
              )}
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#e8dff0',
                  color: '#633394',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {getUserInitials()}
              </Avatar>
            </Box>
          ) : (
            <Box sx={{ width: 48 }} />
          )}
        </Toolbar>
      </AppBar>

      {/* Account dropdown menu */}
      <Popover
        open={accountMenuOpen}
        anchorEl={accountAnchorEl}
        onClose={handleAccountClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minWidth: 240,
              overflow: 'visible',
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* ACCOUNT header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: '#999', letterSpacing: '0.5px' }}
            >
              ACCOUNT
            </Typography>
            <IconButton size="small" sx={{ color: '#bbb', p: 0.5 }}>
              <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Current account card */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: '12px',
              backgroundColor: '#fafafa',
              mb: 1,
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: '#e8dff0',
                color: '#633394',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {getRoleLabel()}
              </Typography>
            </Box>
            <CheckIcon sx={{ fontSize: 18, color: '#633394' }} />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Profile */}
          <Box
            onClick={() => {
              handleAccountClose();
              navigate(getProfileRoute());
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            <PersonOutlineIcon sx={{ fontSize: 20, color: '#555' }} />
            <Typography variant="body2" sx={{ color: '#333' }}>
              Profile
            </Typography>
          </Box>

          {/* Settings */}
          <Box
            onClick={() => {
              handleAccountClose();
              navigate('/settings');
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            <SettingsIcon sx={{ fontSize: 20, color: '#555' }} />
            <Typography variant="body2" sx={{ color: '#333' }}>
              Settings
            </Typography>
          </Box>

          {/* Log Out */}
          <Box
            onClick={() => {
              handleAccountClose();
              handleLogout();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#ffebee' },
            }}
          >
            <LogoutIcon sx={{ fontSize: 20, color: '#555' }} />
            <Typography variant="body2" sx={{ color: '#333' }}>
              Log Out
            </Typography>
          </Box>
        </Box>
      </Popover>

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

      {/* Invite a Friend Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2,
            textAlign: 'center',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            onClick={() => setInviteDialogOpen(false)}
            size="small"
            sx={{ color: '#666' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <MailOutlineIcon sx={{ fontSize: 48, color: '#633394' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
              Invite a Friend
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Invited users can view and respond to surveys using this link.
            </Typography>
            {inviteLoading ? (
              <Typography variant="body2" sx={{ color: '#999' }}>
                Generating link...
              </Typography>
            ) : inviteLink ? (
              <>
                <Box
                  sx={{
                    width: '100%',
                    p: 1.5,
                    backgroundColor: '#f5f0fa',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#633394', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {inviteLink}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  endIcon={<ContentCopyIcon />}
                  onClick={handleCopyInviteLink}
                  sx={{
                    backgroundColor: '#633394',
                    '&:hover': { backgroundColor: '#4a2570' },
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    px: 4,
                    py: 1,
                  }}
                >
                  Copy Invite Link
                </Button>
              </>
            ) : null}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Invite Snackbar */}
      <Snackbar
        open={inviteSnackbar.open}
        autoHideDuration={3000}
        onClose={() => setInviteSnackbar({ ...inviteSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setInviteSnackbar({ ...inviteSnackbar, open: false })}
          severity={inviteSnackbar.severity}
          sx={{ width: '100%' }}
        >
          {inviteSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(Navbar);