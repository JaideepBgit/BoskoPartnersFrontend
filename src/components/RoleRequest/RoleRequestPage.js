import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  SupervisorAccount as ManagerIcon,
  Security as RootIcon,
  Groups as AssociationIcon,
  Badge as OtherIcon,
  CheckCircle as SuccessIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import RoleRequestService from '../../services/RoleRequestService';

const RoleRequestPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [myPendingRequests, setMyPendingRequests] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, orgsData, pendingData] = await Promise.all([
        RoleRequestService.getAllRoles(),
        RoleRequestService.getAllOrganizations(),
        RoleRequestService.getRoleRequests({ user_id: user.id, status: 'pending' }),
      ]);
      setRoles(rolesData);
      setOrganizations(Array.isArray(orgsData) ? orgsData : orgsData.organizations || []);
      setMyPendingRequests(pendingData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return <AdminIcon sx={{ fontSize: 40, color: '#633394' }} />;
      case 'root':
        return <RootIcon sx={{ fontSize: 40, color: '#d32f2f' }} />;
      case 'manager':
        return <ManagerIcon sx={{ fontSize: 40, color: '#633394' }} />;
      case 'user':
        return <UserIcon sx={{ fontSize: 40, color: '#2e7d32' }} />;
      case 'association':
        return <AssociationIcon sx={{ fontSize: 40, color: '#1565c0' }} />;
      default:
        return <OtherIcon sx={{ fontSize: 40, color: '#757575' }} />;
    }
  };

  const getRoleDescription = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return 'Full administrative access to manage organizations, users, and surveys';
      case 'root':
        return 'Super administrator with complete system access';
      case 'manager':
        return 'Manage team members and view reports';
      case 'user':
        return 'Access assigned surveys and complete responses';
      case 'association':
        return 'Manage association organizations and users';
      case 'primary_contact':
        return 'Primary point of contact for the organization';
      case 'secondary_contact':
        return 'Secondary point of contact for the organization';
      default:
        return 'Access based on assigned permissions';
    }
  };

  const isAlreadyPending = (roleId, orgId) => {
    return myPendingRequests.some(
      (r) => r.requested_role_id === roleId && r.organization_id === orgId
    );
  };

  const handleSubmit = async () => {
    if (!selectedRole || !selectedOrg) {
      setError('Please select both a role and an organization');
      return;
    }

    if (isAlreadyPending(selectedRole.id, selectedOrg.id)) {
      setError('You already have a pending request for this role in this organization');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await RoleRequestService.createRoleRequest(
        user.id,
        selectedRole.id,
        selectedOrg.id,
        reason
      );
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit request';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <SuccessIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
              Request Submitted!
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
              Your request for the <strong>{selectedRole?.name}</strong> role
              {selectedOrg && <> at <strong>{selectedOrg.name}</strong></>} has been submitted.
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mb: 4 }}>
              An administrator will review your request shortly.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(-1)}
              sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#533082' } }}
            >
              Go Back
            </Button>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2, color: '#633394' }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
            Request a New Role
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Select the role you'd like to request access to. An administrator will review and approve your request.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Pending Requests */}
        {myPendingRequests.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have {myPendingRequests.length} pending request(s):
            {myPendingRequests.map((r) => (
              <Chip
                key={r.id}
                label={`${r.requested_role_name} @ ${r.organization_name}`}
                size="small"
                sx={{ ml: 1, mt: 0.5, backgroundColor: '#e8dff0', color: '#633394' }}
              />
            ))}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#633394' }} />
          </Box>
        ) : (
          <>
            {/* Step 1: Select Role */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
              1. Select a Role
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <Grid item xs={12} sm={6} md={4} key={role.id}>
                    <Card
                      sx={{
                        border: '2px solid',
                        borderColor: isSelected ? '#633394' : 'transparent',
                        backgroundColor: isSelected ? 'rgba(99, 51, 148, 0.08)' : 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#633394',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(99, 51, 148, 0.15)',
                        },
                      }}
                    >
                      <CardActionArea onClick={() => setSelectedRole(role)}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                          {getRoleIcon(role.name)}
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mt: 1, textTransform: 'capitalize' }}
                          >
                            {role.name.replace('_', ' ')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {getRoleDescription(role.name)}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Step 2: Select Organization */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
              2. Select an Organization
            </Typography>
            <Autocomplete
              options={organizations}
              getOptionLabel={(option) => option.name || ''}
              value={selectedOrg}
              onChange={(_, newValue) => setSelectedOrg(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Organization"
                  placeholder="Search organizations..."
                  variant="outlined"
                />
              )}
              sx={{ mb: 4 }}
            />

            {/* Step 3: Reason (optional) */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
              3. Reason (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Why do you need this role? (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              variant="outlined"
              sx={{ mb: 4 }}
            />

            {/* Submit */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                disabled={!selectedRole || !selectedOrg || submitting}
                onClick={handleSubmit}
                sx={{
                  backgroundColor: '#633394',
                  px: 4,
                  '&:hover': { backgroundColor: '#533082' },
                  '&.Mui-disabled': { backgroundColor: '#ccc' },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Submit Request'
                )}
              </Button>
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default RoleRequestPage;
