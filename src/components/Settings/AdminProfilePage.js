import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Divider,
  Button,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InternalHeader from '../shared/Headers/InternalHeader';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const AdminProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  const getDisplayName = () => {
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.name) return user.name;
    if (user.username) return user.username;
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    if (!user.role) return 'Unknown';
    const roleMap = {
      admin: 'Administrator',
      root: 'Root Administrator',
      manager: 'Manager',
      user: 'User',
    };
    return roleMap[user.role] || user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'root': return '#d32f2f';
      case 'admin': return '#633394';
      case 'manager': return '#1565c0';
      default: return '#2e7d32';
    }
  };

  const getDashboardPath = () => {
    return '/dashboard';
  };

  const profileFields = [
    {
      label: 'Full Name',
      value: getDisplayName(),
      icon: <PersonIcon sx={{ color: '#633394' }} />,
    },
    {
      label: 'Username',
      value: user.username || 'Not set',
      icon: <BadgeIcon sx={{ color: '#633394' }} />,
    },
    {
      label: 'Email',
      value: user.email || 'Not set',
      icon: <EmailIcon sx={{ color: '#633394' }} />,
    },
    {
      label: 'Title',
      value: user.title || 'Not set',
      icon: <AdminPanelSettingsIcon sx={{ color: '#633394' }} />,
    },
    {
      label: 'Organization ID',
      value: user.organization_id ? `#${user.organization_id}` : 'Not assigned',
      icon: <BusinessIcon sx={{ color: '#633394' }} />,
    },
  ];

  return (
    <>
      <InternalHeader
        title="My Profile"
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(getDashboardPath())}
          >
            Dashboard
          </Button>
        }
      />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: 2 }}>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4, px: isMobile ? 2 : 3 }}>
        {/* Profile Header Card */}
        <Card
          sx={{
            mb: 3,
            borderRadius: '16px',
            overflow: 'visible',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #633394 0%, #8e5cc5 100%)',
              height: 120,
              borderRadius: '16px 16px 0 0',
              position: 'relative',
            }}
          />
          <CardContent sx={{ pt: 0, px: isMobile ? 2 : 4, pb: 3, position: 'relative' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'center' : 'flex-end',
                gap: 2,
                mt: '-50px',
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: '#e8dff0',
                  color: '#633394',
                  fontSize: '2rem',
                  fontWeight: 700,
                  border: '4px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {getInitials()}
              </Avatar>
              <Box sx={{ flex: 1, textAlign: isMobile ? 'center' : 'left', mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
                  {getDisplayName()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: isMobile ? 'center' : 'flex-start', mt: 0.5 }}>
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                    label={getRoleLabel()}
                    size="small"
                    sx={{
                      bgcolor: getRoleColor(),
                      color: '#fff',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: '#fff' },
                    }}
                  />
                  {user.available_roles && user.available_roles.length > 1 && (
                    <Chip
                      label={`${user.available_roles.length} roles`}
                      size="small"
                      variant="outlined"
                      sx={{ color: '#888', borderColor: '#ccc' }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card
          sx={{
            mb: 3,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: '#333', mb: 2 }}
            >
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {profileFields.map((field, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Box sx={{ mt: 0.3 }}>{field.icon}</Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: '#999', fontWeight: 500, display: 'block' }}
                      >
                        {field.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#333',
                          fontWeight: 500,
                          wordBreak: 'break-word',
                        }}
                      >
                        {field.value}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Available Roles */}
            {user.available_roles && user.available_roles.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#999', fontWeight: 500, mb: 1 }}
                >
                  Available Roles
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {user.available_roles.map((role) => (
                    <Chip
                      key={role}
                      label={role.charAt(0).toUpperCase() + role.slice(1)}
                      size="small"
                      variant={role === user.role ? 'filled' : 'outlined'}
                      sx={{
                        ...(role === user.role
                          ? { bgcolor: '#633394', color: '#fff' }
                          : { color: '#633394', borderColor: '#633394' }),
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>


      </Container>
    </Box>
    </>
  );
};

export default AdminProfilePage;
