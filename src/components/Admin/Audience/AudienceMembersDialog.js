// ============================================================================
// AUDIENCE MEMBERS DIALOG
// ============================================================================
// Dialog for viewing all members of an audience
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Box,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import AudienceService from '../../../services/Admin/AudienceService';

const AudienceMembersDialog = ({ open, onClose, audience }) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open && audience) {
      loadMembers();
    }
  }, [open, audience]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member =>
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.firstname && member.firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.lastname && member.lastname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.organization_name && member.organization_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AudienceService.getAudienceMembers(audience.id);
      setMembers(data.members || []);
      setFilteredMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      direct: 'primary',
      organization: 'secondary',
      association: 'success'
    };
    return colors[source] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Audience Members: {audience?.name}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Summary */}
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Total Members: {filteredMembers.length}
              {searchTerm && ` (filtered from ${members.length})`}
            </Typography>
            
            {/* Members Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Survey Code</TableCell>
                    <TableCell>Source</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          {searchTerm ? 'No members match your search' : 'No members found'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={`${member.id}-${member.source}`} hover>
                        <TableCell>{member.username}</TableCell>
                        <TableCell>
                          {member.firstname} {member.lastname}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.organization_name || 'N/A'}</TableCell>
                        <TableCell>{member.survey_code || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.source}
                            color={getSourceColor(member.source)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudienceMembersDialog;
