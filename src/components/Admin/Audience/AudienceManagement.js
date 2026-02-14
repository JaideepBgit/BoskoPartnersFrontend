// ============================================================================
// AUDIENCE MANAGEMENT COMPONENT
// ============================================================================
// Main component for creating and managing audiences for targeted communications
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Container,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import Navbar from '../../shared/Navbar/Navbar';
import DataTable from '../../shared/DataTable/DataTable';
import AudienceService from '../../../services/Admin/AudienceService';
import CreateAudienceDialog from './CreateAudienceDialog';
import AudienceMembersDialog from './AudienceMembersDialog';
import SendRemindersDialog from './SendRemindersDialog';

const AudienceManagement = () => {
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state
  const [selectedAudienceIds, setSelectedAudienceIds] = useState([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [remindersDialogOpen, setRemindersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  const [selectedAudience, setSelectedAudience] = useState(null);

  useEffect(() => {
    loadAudiences();
  }, []);

  const loadAudiences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AudienceService.getAllAudiences();
      setAudiences(data.audiences || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter audiences based on search query
  const filteredAudiences = useMemo(() => {
    if (!searchQuery) return audiences;
    
    const term = searchQuery.toLowerCase();
    return audiences.filter(audience => 
      audience.name.toLowerCase().includes(term) ||
      (audience.description && audience.description.toLowerCase().includes(term)) ||
      (audience.audience_type && audience.audience_type.toLowerCase().includes(term)) ||
      (audience.created_by_name && audience.created_by_name.toLowerCase().includes(term))
    );
  }, [audiences, searchQuery]);

  const handleCreateAudience = () => {
    setSelectedAudience(null);
    setCreateDialogOpen(true);
  };

  const handleEditAudience = (audience) => {
    setSelectedAudience(audience);
    setEditDialogOpen(true);
  };

  const handleViewMembers = (audience) => {
    setSelectedAudience(audience);
    setMembersDialogOpen(true);
  };

  const handleSendReminders = (audience) => {
    setSelectedAudience(audience);
    setRemindersDialogOpen(true);
  };

  const handleDeleteAudience = (audience) => {
    setSelectedAudience(audience);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await AudienceService.deleteAudience(selectedAudience.id);
      setSuccess(`Audience "${selectedAudience.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedAudience(null);
      loadAudiences();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      let successCount = 0;
      let failCount = 0;

      for (const audienceId of selectedAudienceIds) {
        try {
          await AudienceService.deleteAudience(audienceId);
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Failed to delete audience ${audienceId}:`, err);
        }
      }

      setBulkDeleteDialogOpen(false);
      setSelectedAudienceIds([]);
      
      if (failCount > 0) {
        setSuccess(`Deleted ${successCount} audience(s). ${failCount} failed.`);
      } else {
        setSuccess(`Successfully deleted ${successCount} audience(s).`);
      }
      
      loadAudiences();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAudienceSaved = () => {
    setSuccess('Audience saved successfully');
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    loadAudiences();
  };

  const handleRemindersSent = (result) => {
    setSuccess(`Reminders sent: ${result.results.successful_sends} successful, ${result.results.failed_sends} failed`);
    setRemindersDialogOpen(false);
  };

  const getAudienceTypeColor = (type) => {
    const colors = {
      users: 'primary',
      organizations: 'secondary',
      associations: 'success',
      mixed: 'warning'
    };
    return colors[type] || 'default';
  };

  // Column definitions for DataTable
  const audienceColumns = useMemo(() => [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (audience) => (
        <Typography variant="body1" fontWeight="medium">
          {audience.name}
        </Typography>
      )
    },
    {
      id: 'description',
      label: 'Description',
      render: (audience) => (
        <Typography variant="body2" color="textSecondary">
          {audience.description || 'No description'}
        </Typography>
      )
    },
    {
      id: 'audience_type',
      label: 'Type',
      sortable: true,
      render: (audience) => (
        <Chip
          label={audience.audience_type}
          color={getAudienceTypeColor(audience.audience_type)}
          size="small"
        />
      )
    },
    {
      id: 'created_by_name',
      label: 'Created By',
      sortable: true,
      render: (audience) => (
        <Typography variant="body2">
          {audience.created_by_name}
        </Typography>
      )
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (audience) => (
        <Typography variant="body2">
          {new Date(audience.created_at).toLocaleDateString()}
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (audience) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View Members">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleViewMembers(audience);
              }}
            >
              <PeopleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send Reminders">
            <IconButton
              size="small"
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleSendReminders(audience);
              }}
            >
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditAudience(audience);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAudience(audience);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], []);

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ color: '#212121', fontWeight: 'bold' }}>
            Audience Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAudience}
            sx={{
              backgroundColor: '#633394',
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              '&:hover': { backgroundColor: '#967CB2' }
            }}
          >
            Create Audience
          </Button>
        </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search Bar and Bulk Actions */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, description, type, or creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            minWidth: 250,
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: 2
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Bulk Actions */}
        {selectedAudienceIds.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${selectedAudienceIds.length} selected`}
              color="primary"
              sx={{ backgroundColor: '#633394' }}
            />
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setBulkDeleteDialogOpen(true)}
              size="small"
            >
              Delete ({selectedAudienceIds.length})
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedAudienceIds([])}
              sx={{ borderColor: '#967CB2', color: '#967CB2' }}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {/* Audiences Table */}
      <DataTable
        columns={audienceColumns}
        data={filteredAudiences}
        selectable
        selectedIds={selectedAudienceIds}
        onSelectionChange={setSelectedAudienceIds}
        getRowId={(audience) => audience.id}
        defaultSortColumn="created_at"
        defaultSortDirection="desc"
        pagination
        defaultRowsPerPage={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No audiences found. Create your first audience to get started."
        paperSx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      />

      {/* Create/Edit Audience Dialog */}
      {createDialogOpen && (
        <CreateAudienceDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSave={handleAudienceSaved}
        />
      )}

      {editDialogOpen && selectedAudience && (
        <CreateAudienceDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleAudienceSaved}
          audience={selectedAudience}
          isEdit={true}
        />
      )}

      {/* View Members Dialog */}
      {membersDialogOpen && selectedAudience && (
        <AudienceMembersDialog
          open={membersDialogOpen}
          onClose={() => setMembersDialogOpen(false)}
          audience={selectedAudience}
        />
      )}

      {/* Send Reminders Dialog */}
      {remindersDialogOpen && selectedAudience && (
        <SendRemindersDialog
          open={remindersDialogOpen}
          onClose={() => setRemindersDialogOpen(false)}
          audience={selectedAudience}
          onSuccess={handleRemindersSent}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the audience "{selectedAudience?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedAudienceIds.length} audience(s)?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Delete {selectedAudienceIds.length} Audience(s)
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </>
  );
};

export default AudienceManagement;
