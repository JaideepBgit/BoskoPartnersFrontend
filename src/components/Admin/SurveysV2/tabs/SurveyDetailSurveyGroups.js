import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText,
  InputAdornment, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryService from '../../../../services/Admin/Inventory/InventoryService';

const SurveyDetailSurveyGroups = ({ surveyId, survey }) => {
  const [surveyGroups, setSurveyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      try {
        const versions = await InventoryService.getTemplateVersions();
        // Find groups that contain this survey's version
        const relatedGroups = versions.filter(v => v.id === survey?.version_id);
        // Also include all groups for display
        setSurveyGroups(versions);
      } catch (err) {
        console.error('Error loading survey groups:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, [surveyId, survey]);

  const filtered = surveyGroups.filter(g => {
    if (!searchTerm) return true;
    return g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: '#633394' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Search by associations name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            minWidth: 280,
            '& .MuiOutlinedInput-root': { backgroundColor: 'white', borderRadius: 2 }
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          }}
        />
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ textTransform: 'none', color: '#633394', borderColor: '#e5e5e5', '&:hover': { borderColor: '#e5e5e5' } }}
        >
          Edit
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" sx={{ color: '#999' }}>No survey groups found</Typography>
        </Box>
      ) : (
        <List>
          {filtered.map(g => {
            const isMember = g.id === survey?.version_id;
            return (
              <ListItem
                key={g.id}
                sx={{
                  borderBottom: '1px solid #eee',
                  py: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  mb: 0.5,
                  borderRadius: 1,
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: 500 }}>{g.name}</Typography>}
                  secondary={g.description || 'No description'}
                />
                {isMember && (
                  <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                )}
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default SurveyDetailSurveyGroups;
