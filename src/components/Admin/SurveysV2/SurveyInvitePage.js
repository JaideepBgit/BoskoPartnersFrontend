import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Paper,
  TextField, InputAdornment, Checkbox, Chip, CircularProgress,
  Alert, Snackbar, MenuItem, Select, FormControl, InputLabel,
  Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import InternalHeader from '../../shared/Headers/InternalHeader';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';
import { fetchUsersWithRoleUser } from '../../../services/UserManagement/UserManagementService';
import AudienceService from '../../../services/Admin/AudienceService';

const colors = {
  primary: '#633394',
  secondary: '#967CB2',
  background: '#f5f5f5',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

const SurveyInvitePage = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [users, setUsers] = useState([]);
  const [existingInvites, setExistingInvites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Audiences
  const [audiences, setAudiences] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [loadingAudienceMembers, setLoadingAudienceMembers] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState('');

  // Invite state
  const [inviting, setInviting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load survey + users + existing invitations + audiences in parallel
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [surveyData, usersData, responsesData, audiencesData] = await Promise.all([
        SurveysV2Service.getSurvey(surveyId),
        fetchUsersWithRoleUser(),
        SurveysV2Service.getResponses(surveyId),
        AudienceService.getAllAudiences().catch(() => []),
      ]);
      setSurvey(surveyData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setExistingInvites(new Set(responsesData.map(r => r.user_id)));
      setAudiences(Array.isArray(audiencesData) ? audiencesData : []);
    } catch (err) {
      console.error('Error loading invite page data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // When an audience is selected, fetch its members and auto-select them
  const handleAudienceSelect = async (audience) => {
    setSelectedAudience(audience);
    if (!audience) return;

    setLoadingAudienceMembers(true);
    try {
      const data = await AudienceService.getAudienceMembers(audience.id);
      const members = data.members || data || [];
      // Auto-select audience members that are in our user list and not already invited
      const memberIds = new Set(members.map(m => m.id));
      const toSelect = new Set();
      users.forEach(u => {
        if (memberIds.has(u.id) && !existingInvites.has(u.id)) {
          toSelect.add(u.id);
        }
      });
      setSelectedIds(toSelect);

      const matched = toSelect.size;
      const alreadyInvited = members.filter(m => existingInvites.has(m.id)).length;
      setSnackbar({
        open: true,
        message: `Selected ${matched} users from "${audience.name}"${alreadyInvited > 0 ? ` (${alreadyInvited} already invited)` : ''}`,
        severity: 'info',
      });
    } catch (err) {
      console.error('Error loading audience members:', err);
      setSnackbar({ open: true, message: 'Failed to load audience members.', severity: 'error' });
    } finally {
      setLoadingAudienceMembers(false);
    }
  };

  // Derive unique organizations for filter dropdown
  const organizations = useMemo(() => {
    const orgs = new Map();
    users.forEach(u => {
      if (u.organization_name) orgs.set(u.organization_name, true);
    });
    return Array.from(orgs.keys()).sort();
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (filterOrg && u.organization_name !== filterOrg) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const name = `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [users, searchTerm, filterOrg]);

  // Selectable = not already invited
  const selectableUsers = useMemo(
    () => filteredUsers.filter(u => !existingInvites.has(u.id)),
    [filteredUsers, existingInvites],
  );

  // Toggle selection
  const toggleUser = (userId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === selectableUsers.length && selectableUsers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map(u => u.id)));
    }
  };

  // Send invitations
  const handleInvite = async () => {
    if (selectedIds.size === 0) return;
    setInviting(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const result = await SurveysV2Service.inviteUsers(
        surveyId,
        Array.from(selectedIds),
        currentUser.id,
      );
      setSnackbar({
        open: true,
        message: result.message || `Successfully invited ${result.results?.invited || 0} users.`,
        severity: 'success',
      });
      setSelectedIds(new Set());
      setSelectedAudience(null);
      await loadData();
    } catch (err) {
      console.error('Error sending invitations:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to send invitations.',
        severity: 'error',
      });
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <>
        <InternalHeader title="Invite Users" leftActions={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/surveys-v2/${surveyId}`)}>
            Survey
          </Button>
        } />
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: colors.background }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <InternalHeader title="Invite Users" leftActions={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/surveys-v2/${surveyId}`)}>
            Survey
          </Button>
        } />
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: colors.background }}>
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <InternalHeader
        title={`Invite Users — ${survey?.name || 'Survey'}`}
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/surveys-v2/${surveyId}`)}
          >
            Survey
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 3, minHeight: '100vh', backgroundColor: colors.background }}>
        {/* Survey info + audience selector row */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 3, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.textSecondary }}>SURVEY</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{survey?.name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.textSecondary }}>STATUS</Typography>
            <Chip label={survey?.status || 'draft'} size="small" sx={{ textTransform: 'capitalize', fontWeight: 500 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.textSecondary }}>ALREADY INVITED</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{existingInvites.size}</Typography>
          </Box>

          {/* Audience group picker */}
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Autocomplete
              options={audiences}
              getOptionLabel={(option) => option.name || ''}
              value={selectedAudience}
              onChange={(_, newValue) => handleAudienceSelect(newValue)}
              loading={loadingAudienceMembers}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select from Audience Group"
                  placeholder="Choose an audience to auto-select its members..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><GroupIcon color="action" /></InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                    {option.description && (
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />
          </Box>
        </Paper>

        {/* Search & filter row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              minWidth: 280, flex: 1,
              '& .MuiOutlinedInput-root': { backgroundColor: 'white', borderRadius: 2 },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Organization</InputLabel>
            <Select
              value={filterOrg}
              label="Organization"
              onChange={(e) => setFilterOrg(e.target.value)}
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All Organizations</MenuItem>
              {organizations.map(org => (
                <MenuItem key={org} value={org}>{org}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={inviting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            disabled={selectedIds.size === 0 || inviting}
            onClick={handleInvite}
            sx={{
              textTransform: 'none',
              backgroundColor: colors.primary,
              '&:hover': { backgroundColor: colors.secondary },
              height: 40,
            }}
          >
            {inviting ? 'Sending...' : `Send Invitations (${selectedIds.size})`}
          </Button>
        </Box>

        {/* User table */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Header row */}
          <Box sx={{
            display: 'flex', alignItems: 'center', py: 1.5, px: 2,
            backgroundColor: '#f3eef8', borderBottom: '1px solid #e0e0e0',
          }}>
            <Checkbox
              checked={selectableUsers.length > 0 && selectedIds.size === selectableUsers.length}
              indeterminate={selectedIds.size > 0 && selectedIds.size < selectableUsers.length}
              onChange={toggleAll}
              sx={{ mr: 1, color: colors.primary, '&.Mui-checked': { color: colors.primary } }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, minWidth: 150, color: colors.textSecondary }}>
              NAME
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, minWidth: 180, color: colors.textSecondary }}>
              EMAIL
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 0.8, minWidth: 150, color: colors.textSecondary }}>
              ORGANIZATION
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 100, color: colors.textSecondary, textAlign: 'right' }}>
              STATUS
            </Typography>
          </Box>

          {/* Rows */}
          {filteredUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" sx={{ color: '#999' }}>No users found</Typography>
            </Box>
          ) : (
            filteredUsers.map(user => {
              const alreadyInvited = existingInvites.has(user.id);
              const isSelected = selectedIds.has(user.id);
              const displayName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username;

              return (
                <Box
                  key={user.id}
                  onClick={() => !alreadyInvited && toggleUser(user.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', py: 1.5, px: 2,
                    backgroundColor: alreadyInvited
                      ? 'rgba(0,0,0,0.03)'
                      : isSelected
                        ? 'rgba(99, 51, 148, 0.06)'
                        : 'white',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: alreadyInvited ? 'default' : 'pointer',
                    opacity: alreadyInvited ? 0.6 : 1,
                    '&:hover': alreadyInvited ? {} : { backgroundColor: 'rgba(99, 51, 148, 0.04)' },
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={alreadyInvited}
                    onChange={() => toggleUser(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ mr: 1, color: colors.primary, '&.Mui-checked': { color: colors.primary } }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 150 }}>
                    {displayName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, flex: 1, minWidth: 180 }}>
                    {user.email || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, flex: 0.8, minWidth: 150 }}>
                    {user.organization_name || '-'}
                  </Typography>
                  <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                    {alreadyInvited ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label="Invited"
                        size="small"
                        sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 500, fontSize: '0.75rem' }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#999' }}>—</Typography>
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Paper>

        {/* Footer count */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            Showing {filteredUsers.length} users &bull; {selectableUsers.length} available &bull; {existingInvites.size} already invited
          </Typography>
          {selectedIds.size > 0 && (
            <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 600 }}>
              {selectedIds.size} selected
            </Typography>
          )}
        </Box>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SurveyInvitePage;
