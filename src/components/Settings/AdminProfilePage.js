import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InternalHeader from '../shared/Headers/InternalHeader';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SaveIcon from '@mui/icons-material/Save';
import UserService from '../../services/Login/UserService';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SERVER_URL = BASE_URL.replace(/\/api$/, '');

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ firstname: '', lastname: '', title: '' });
  const [originalData, setOriginalData] = useState({ firstname: '', lastname: '', title: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isAdminRole = user?.role === 'admin' || user?.role === 'root' || user?.role === 'manager';
  const backRoute = isAdminRole ? '/dashboard' : '/surveys';
  const backLabel = isAdminRole ? 'Dashboard' : 'Surveys';

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    initForm(parsed);

    // Fetch fresh user data from API
    UserService.fetchUser(parsed.id || parsed.user_id).then((fresh) => {
      setUser((prev) => ({ ...prev, ...fresh }));
      initForm(fresh);
      if (fresh.avatar_url) {
        setAvatarPreview(`${SERVER_URL}${fresh.avatar_url}`);
      }
    }).catch(() => {
      // Use localStorage data as fallback
    });

    // Fetch organizations from user_roles
    const userId = parsed.id || parsed.user_id;
    UserService.fetchUserOrganizations(userId).then((orgs) => {
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    }).catch(() => {
      setOrganizations([]);
    });
  }, [navigate]);

  const initForm = (userData) => {
    const data = {
      firstname: userData.firstname || userData.firstName || userData.first_name || '',
      lastname: userData.lastname || userData.lastName || userData.last_name || '',
      title: userData.title || '',
    };
    setFormData(data);
    setOriginalData(data);
  };

  const isDirty =
    formData.firstname !== originalData.firstname ||
    formData.lastname !== originalData.lastname ||
    formData.title !== originalData.title ||
    avatarFile !== null;

  const getInitials = () => {
    const first = formData.firstname || '';
    const last = formData.lastname || '';
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first) return first.substring(0, 2).toUpperCase();
    if (user?.username) return user.username.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (formData.firstname && formData.lastname) return `${formData.firstname} ${formData.lastname}`;
    if (user?.username) return user.username;
    return 'User';
  };

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Please select a PNG, JPG, GIF, or WebP image.', severity: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image must be smaller than 5MB.', severity: 'error' });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const userId = user.id || user.user_id;

    try {
      // Upload avatar if changed
      let newAvatarUrl = user.avatar_url;
      if (avatarFile) {
        const avatarRes = await UserService.uploadAvatar(userId, avatarFile);
        newAvatarUrl = avatarRes.avatar_url;
      }

      // Update profile fields
      await UserService.updateProfile(userId, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        title: formData.title,
      });

      // Update localStorage
      const updatedUser = {
        ...user,
        firstname: formData.firstname,
        lastname: formData.lastname,
        title: formData.title,
        avatar_url: newAvatarUrl,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setOriginalData({ ...formData });
      setAvatarFile(null);
      if (newAvatarUrl) {
        setAvatarPreview(`${SERVER_URL}${newAvatarUrl}`);
      }

      setSnackbar({ open: true, message: 'Profile updated successfully.', severity: 'success' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update profile.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <InternalHeader
        title="Profile"
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(backRoute)}
          >
            {backLabel}
          </Button>
        }
        rightActions={
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            Save
          </Button>
        }
      />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: 2 }}>
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4, px: isMobile ? 2 : 3 }}>

          {/* Account Information Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 4 }}>
              {/* Centered Avatar */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', mb: 1.5 }}>
                  <Avatar
                    src={avatarPreview || undefined}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#e8dff0',
                      color: '#633394',
                      fontSize: '2rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '3px solid #e8dff0',
                    }}
                    onClick={handleAvatarClick}
                  >
                    {!avatarPreview && getInitials()}
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={handleAvatarClick}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: '#633394',
                      color: '#fff',
                      width: 30,
                      height: 30,
                      '&:hover': { bgcolor: '#7b4db5' },
                    }}
                  >
                    <CameraAltIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    style={{ display: 'none' }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                  {getDisplayName()}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Editable Fields */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    value={formData.firstname}
                    onChange={handleFieldChange('firstname')}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    value={formData.lastname}
                    onChange={handleFieldChange('lastname')}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Title"
                    value={formData.title}
                    onChange={handleFieldChange('title')}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    value={user.email || ''}
                    fullWidth
                    variant="outlined"
                    size="small"
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
                Organizations
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {organizations.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 2 }}>
                  No organization affiliations
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {organizations.map((org) => (
                    <Box
                      key={org.organization_id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: '10px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                          {org.organization_name || `Organization #${org.organization_id}`}
                        </Typography>
                        {org.roles && org.roles.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {org.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

        </Container>
      </Box>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminProfilePage;
