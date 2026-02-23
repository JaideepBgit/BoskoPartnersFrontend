import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Navbar from '../../shared/Navbar/Navbar';
import RoleRequestService from '../../../services/RoleRequestService';

const ApprovalsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    request: null,
    action: null, // 'approve' or 'deny'
  });
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const statusFilters = ['pending', 'approved', 'denied'];

  useEffect(() => {
    loadRequests();
  }, [tabValue]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const status = statusFilters[tabValue];
      const data = await RoleRequestService.getRoleRequests({ status });
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load role requests');
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request, action) => {
    setReviewDialog({ open: true, request, action });
    setReviewNote('');
  };

  const closeReviewDialog = () => {
    setReviewDialog({ open: false, request: null, action: null });
    setReviewNote('');
  };

  const handleReview = async () => {
    const { request, action } = reviewDialog;
    if (!request || !action) return;

    setReviewing(true);
    try {
      await RoleRequestService.reviewRoleRequest(
        request.id,
        action,
        user.id,
        reviewNote
      );
      setSuccessMsg(
        `Request ${action === 'approve' ? 'approved' : 'denied'} successfully`
      );
      closeReviewDialog();
      loadRequests();
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${action} request`;
      setError(msg);
    } finally {
      setReviewing(false);
    }
  };

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      denied: { color: 'error', label: 'Denied' },
    };
    const c = config[status] || { color: 'default', label: status };
    return <Chip label={c.label} color={c.color} size="small" />;
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
          Role Request Approvals
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
          Review and manage role access requests from users.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#633394' },
            '& .MuiTabs-indicator': { backgroundColor: '#633394' },
          }}
        >
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Denied" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#633394' }} />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#999' }}>
              No {statusFilters[tabValue]} requests
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f6fc' }}>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Requested Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Organization</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {tabValue !== 0 && <TableCell sx={{ fontWeight: 700 }}>Reviewed By</TableCell>}
                  {tabValue === 0 && <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {req.user_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          {req.user_email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.requested_role_name}
                        size="small"
                        sx={{
                          backgroundColor: '#e8dff0',
                          color: '#633394',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>{req.organization_name}</TableCell>
                    <TableCell>
                      {req.reason ? (
                        <Tooltip title={req.reason}>
                          <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.reason}
                          </Box>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#ccc' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{formatDate(req.created_at)}</Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(req.status)}</TableCell>
                    {tabValue !== 0 && (
                      <TableCell>
                        <Box>
                          <Typography variant="caption">{req.reviewer_name || '-'}</Typography>
                          {req.reviewed_at && (
                            <Typography variant="caption" display="block" sx={{ color: '#888' }}>
                              {formatDate(req.reviewed_at)}
                            </Typography>
                          )}
                          {req.review_note && (
                            <Tooltip title={req.review_note}>
                              <InfoIcon sx={{ fontSize: 14, color: '#999', ml: 0.5, cursor: 'pointer' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                    {tabValue === 0 && (
                      <TableCell align="center">
                        <Tooltip title="Approve">
                          <IconButton
                            onClick={() => openReviewDialog(req, 'approve')}
                            sx={{ color: '#4caf50' }}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deny">
                          <IconButton
                            onClick={() => openReviewDialog(req, 'deny')}
                            sx={{ color: '#f44336' }}
                          >
                            <DenyIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Review Confirmation Dialog */}
        <Dialog
          open={reviewDialog.open}
          onClose={closeReviewDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: '16px' } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            {reviewDialog.action === 'approve' ? 'Approve' : 'Deny'} Role Request
          </DialogTitle>
          <DialogContent>
            {reviewDialog.request && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>User:</strong> {reviewDialog.request.user_name} ({reviewDialog.request.user_email})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Requested Role:</strong>{' '}
                  <Chip
                    label={reviewDialog.request.requested_role_name}
                    size="small"
                    sx={{ backgroundColor: '#e8dff0', color: '#633394', textTransform: 'capitalize' }}
                  />
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Organization:</strong> {reviewDialog.request.organization_name}
                </Typography>
                {reviewDialog.request.reason && (
                  <Typography variant="body2">
                    <strong>Reason:</strong> {reviewDialog.request.reason}
                  </Typography>
                )}
              </Box>
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Note (optional)"
              placeholder={
                reviewDialog.action === 'approve'
                  ? 'Add a note for the approval...'
                  : 'Reason for denial...'
              }
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeReviewDialog} disabled={reviewing}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleReview}
              disabled={reviewing}
              sx={{
                backgroundColor: reviewDialog.action === 'approve' ? '#4caf50' : '#f44336',
                '&:hover': {
                  backgroundColor: reviewDialog.action === 'approve' ? '#388e3c' : '#d32f2f',
                },
              }}
            >
              {reviewing ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : reviewDialog.action === 'approve' ? (
                'Approve'
              ) : (
                'Deny'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ApprovalsPage;
