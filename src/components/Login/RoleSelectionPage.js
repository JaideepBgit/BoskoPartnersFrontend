// src/components/Login/RoleSelectionPage.js

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  SupervisorAccount as ManagerIcon,
  Security as RootIcon,
  Badge as OtherIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import UserService from '../../services/Login/UserService';

const RoleSelectionPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from location state (passed from login)
  const pendingUserData = location.state?.userData;
  const availableRoles = location.state?.availableRoles || [];
  const availableRolesContext = location.state?.availableRolesContext || [];

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  useEffect(() => {
    // Redirect to login if no user data
    if (!pendingUserData) {
      navigate('/login');
    }
  }, [pendingUserData, navigate]);

  // Role icon mapping
  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <AdminIcon sx={{ fontSize: 48, color: '#633394' }} />;
      case 'root':
        return <RootIcon sx={{ fontSize: 48, color: '#d32f2f' }} />;
      case 'manager':
        return <ManagerIcon sx={{ fontSize: 48, color: '#633394' }} />;
      case 'user':
        return <UserIcon sx={{ fontSize: 48, color: '#2e7d32' }} />;
      default:
        return <OtherIcon sx={{ fontSize: 48, color: '#757575' }} />;
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

  const handleRoleSelect = async (roleObj) => {
    const roleName = typeof roleObj === 'string' ? roleObj : roleObj.role;
    const orgId = typeof roleObj === 'object' ? roleObj.org_id : null;
    const selectionKey = orgId ? `${roleName}-${orgId}` : roleName;

    setSelectedRole(selectionKey);
    setLoading(true);
    setError('');

    try {
      const response = await UserService.selectRole(pendingUserData.id, roleName, orgId);
      const userData = response.data || response;

      console.log('Role selected successfully:', userData);

      completeLogin(userData);
    } catch (err) {
      console.error('Role selection error:', err);
      setError(err.response?.data?.error || 'Failed to select role');
      setLoading(false);
      setSelectedRole(null);
    }
  };

  const completeLogin = (userData) => {
    setLoading(false);

    // Preserve the original available roles from login
    const enrichedUserData = {
      ...userData,
      available_roles: availableRoles.map(r => typeof r === 'string' ? r : r.role),
      available_roles_context: availableRolesContext.length > 0 ? availableRolesContext : availableRoles
    };

    // Store authentication data
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(enrichedUserData));

    if (enrichedUserData.id) localStorage.setItem('userId', enrichedUserData.id);
    if (enrichedUserData.role) localStorage.setItem('userRole', enrichedUserData.role);
    if (enrichedUserData.available_roles) {
      localStorage.setItem('availableRoles', JSON.stringify(enrichedUserData.available_roles));
    }
    if (enrichedUserData.available_roles_context) {
      localStorage.setItem('availableRolesContext', JSON.stringify(enrichedUserData.available_roles_context));
    }
    if (enrichedUserData.organization_id) localStorage.setItem('organizationId', enrichedUserData.organization_id);
    if (enrichedUserData.survey_code) localStorage.setItem('surveyCode', enrichedUserData.survey_code);

    // Notify parent
    if (onLogin) onLogin();

    // Navigate based on role
    switch (userData.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'root':
        navigate('/root-dashboard');
        break;
      case 'user':
        navigate('/user');
        break;
      case 'manager':
        navigate('/manager-dashboard');
        break;
      case 'association':
        navigate('/association-dashboard');
        break;
      default:
        navigate('/');
    }
  };

  if (!pendingUserData) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Logo and Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img src={logoImage} alt="Saurara Logo" style={{ maxWidth: '200px', height: 'auto', marginBottom: '16px' }} />
          <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold', mb: 1 }}>
            Welcome, {pendingUserData?.firstname || pendingUserData?.username}!
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            You have multiple roles. Please select how you want to continue:
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Role Cards */}
        <Grid container spacing={3}>
          {(availableRolesContext.length > 0 ? availableRolesContext : availableRoles.map(r => ({ role: r }))).map((roleObj) => {
            const roleName = typeof roleObj === 'string' ? roleObj : roleObj.role;
            const orgName = roleObj.org_name;
            const orgId = roleObj.org_id;
            const uniqueKey = orgId ? `${roleName}-${orgId}` : roleName;
            const isSelected = selectedRole === uniqueKey;
            const isLoading = loading && isSelected;

            return (
              <Grid item xs={12} sm={6} key={uniqueKey}>
                <Card
                  sx={{
                    height: '100%',
                    border: '2px solid',
                    borderColor: isSelected ? '#633394' : 'transparent',
                    backgroundColor: isSelected ? 'rgba(99, 51, 148, 0.08)' : 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#633394',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(99, 51, 148, 0.2)',
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => !loading && handleRoleSelect(roleObj)}
                    disabled={loading}
                    sx={{ height: '100%' }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      {/* Icon */}
                      <Box sx={{ mb: 2 }}>
                        {getRoleIcon(roleName)}
                      </Box>

                      {/* Role Name */}
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textTransform: 'capitalize' }}>
                        {roleName.replace('_', ' ')}
                      </Typography>

                      {/* Role Badge */}
                      <Chip
                        label={roleName.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: '#633394',
                          color: 'white',
                          fontSize: '0.7rem',
                          mb: 2
                        }}
                      />

                      {/* Organization Name */}
                      {orgName && (
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#633394', mb: 1 }}>
                          at {orgName}
                        </Typography>
                      )}

                      {/* Description */}
                      <Typography variant="body2" color="text.secondary">
                        {getRoleDescription(roleName)}
                      </Typography>

                      {/* Loading Indicator */}
                      {isLoading && (
                        <Box sx={{ mt: 2 }}>
                          <CircularProgress size={24} sx={{ color: '#633394' }} />
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default RoleSelectionPage;
