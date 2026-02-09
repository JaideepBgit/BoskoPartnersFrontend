// src/pages/Login/LoginPage.js

import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  SupervisorAccount as ManagerIcon,
  Security as RootIcon,
  Badge as OtherIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/Login/UserService';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Role selection state
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const navigate = useNavigate();

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  // Role icon mapping
  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <AdminIcon sx={{ color: '#633394' }} />;
      case 'root':
        return <RootIcon sx={{ color: '#d32f2f' }} />;
      case 'manager':
        return <ManagerIcon sx={{ color: '#633394' }} />;
      case 'user':
        return <UserIcon sx={{ color: '#2e7d32' }} />;
      default:
        return <OtherIcon sx={{ color: '#757575' }} />;
    }
  };

  // Role description mapping
  const getRoleDescription = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Full administrative access to manage organizations, users, and surveys';
      case 'root':
        return 'Super administrator with complete system access';
      case 'manager':
        return 'Manage team members and view reports';
      case 'user':
        return 'Access assigned surveys and complete responses';
      case 'primary_contact':
        return 'Primary point of contact for the organization';
      case 'secondary_contact':
        return 'Secondary point of contact for the organization';
      default:
        return 'Access based on assigned permissions';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const response = await UserService.loginUser(email, password);
      const userData = response.data || response;

      console.log('Login Successful - userData:', userData);
      console.log('Available roles:', userData.available_roles);
      console.log('Requires role selection:', response.requires_role_selection);

      // Check if user has multiple roles
      if (response.requires_role_selection && userData.available_roles && userData.available_roles.length > 1) {
        // Show role selection dialog
        setAvailableRoles(userData.available_roles);
        setPendingUserData(userData);
        setShowRoleSelection(true);
        setLoading(false);
        return;
      }

      // Single role - proceed with login
      completeLogin(userData);

    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    setError('');

    try {
      // Call select-role endpoint to validate and get updated user data
      const response = await UserService.selectRole(pendingUserData.id, role);
      const userData = response.data || response;

      console.log('Role selected successfully:', userData);

      // Close dialog and complete login
      setShowRoleSelection(false);
      completeLogin(userData);

    } catch (err) {
      console.error('Role selection error:', err);
      setError(err.response?.data?.error || 'Failed to select role');
      setLoading(false);
    }
  };

  const completeLogin = (userData) => {
    setSuccess('Login Successful');
    setLoading(false);

    // 1️⃣ mark as authenticated
    localStorage.setItem('isAuthenticated', 'true');

    // 2️⃣ store entire user object
    localStorage.setItem('user', JSON.stringify(userData));

    // 3️⃣ store user ID and role separately for easy access
    if (userData.id) {
      localStorage.setItem('userId', userData.id);
    }
    if (userData.role) {
      localStorage.setItem('userRole', userData.role);
    }
    if (userData.available_roles) {
      localStorage.setItem('availableRoles', JSON.stringify(userData.available_roles));
    }
    if (userData.organization_id) {
      localStorage.setItem('organizationId', userData.organization_id);
    }
    if (userData.survey_code) {
      localStorage.setItem('surveyCode', userData.survey_code);
    }

    // notify parent (so Navbar can re-check user)
    if (onLogin) onLogin();

    // 4️⃣ navigate based on role
    switch (userData.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'root':
        navigate('/root-dashboard');
        break;
      case 'user':
        // Always redirect users to survey code validation page
        navigate('/user');
        break;
      case 'manager':
        navigate('/manager-dashboard'); // Managers go to their specific dashboard
        break;
      default:
        console.warn('Unknown role, defaulting to /');
        navigate('/');
    }
  };

  const handleCloseRoleSelection = () => {
    setShowRoleSelection(false);
    setPendingUserData(null);
    setAvailableRoles([]);
    setSelectedRole(null);
  };

  return (
    <>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #3B1C55 0%, #633394 25%, #61328E 50%, #967CB2 75%, #FBFAFA 100%)',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top left, rgba(59, 28, 85, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(150, 124, 178, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Container maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              p: 4,
              boxShadow: '0 20px 40px rgba(59, 28, 85, 0.15)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              zIndex: 1
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <img src={logoImage} alt="Saurara Logo" style={{ maxWidth: '180px', height: 'auto' }} />
            </Box>

            <Typography variant="h5" align="center" gutterBottom sx={{ color: '#212121', fontWeight: 'bold' }}>
              Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <TextField
              label="Username or Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 2,
                backgroundColor: '#633394',
                '&:hover': { backgroundColor: '#967CB2' },
                py: 1.25,
                fontSize: '1rem',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Forgot your password?{' '}
              <Link href="/forgot-password" underline="hover">
                Click here
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Role Selection Dialog */}
      <Dialog
        open={showRoleSelection}
        onClose={handleCloseRoleSelection}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f6fc 100%)',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #633394 0%, #967CB2 100%)',
          color: 'white',
          textAlign: 'center',
          py: 3
        }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Welcome, {pendingUserData?.firstname || pendingUserData?.username}!
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            You have multiple roles. Please select how you want to log in:
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <List sx={{ pt: 0 }}>
            {availableRoles.map((role) => (
              <ListItem
                key={role}
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={() => handleRoleSelect(role)}
                  disabled={loading && selectedRole === role}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: selectedRole === role ? '#633394' : 'rgba(0,0,0,0.12)',
                    backgroundColor: selectedRole === role ? 'rgba(99, 51, 148, 0.08)' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 51, 148, 0.12)',
                      borderColor: '#633394',
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <ListItemIcon>
                    {getRoleIcon(role)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {role.replace('_', ' ')}
                        </Typography>
                        <Chip
                          label={role.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: '#633394',
                            color: 'white',
                            fontSize: '0.65rem',
                            height: 20
                          }}
                        />
                      </Box>
                    }
                    secondary={getRoleDescription(role)}
                  />
                  {loading && selectedRole === role && (
                    <CircularProgress size={24} sx={{ ml: 2 }} />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
          <Button
            onClick={handleCloseRoleSelection}
            variant="outlined"
            sx={{
              borderColor: '#633394',
              color: '#633394',
              '&:hover': {
                borderColor: '#967CB2',
                backgroundColor: 'rgba(99, 51, 148, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LoginPage;
