import React, { useState } from 'react';
import {
  Box, Typography, Button, List, ListItem, ListItemText, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddOrganizationDialog from '../AddOrganizationDialog';
import SurveysV2Service from '../../../../services/Admin/SurveysV2Service';

const SurveyDetailOrganizations = ({ surveyId, survey, onRefresh }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const organizations = survey?.organizations || [];

  const handleDetach = async (orgId, orgName) => {
    if (!window.confirm(`Remove "${orgName}" from this survey?`)) return;
    try {
      await SurveysV2Service.detachOrganization(surveyId, orgId);
      onRefresh?.();
    } catch (err) {
      console.error('Error detaching organization:', err);
      alert('Failed to remove organization.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ textTransform: 'none', color: '#633394', borderColor: '#e0e0e0' }}
        >
          Add Organization
        </Button>
      </Box>

      <AddOrganizationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        survey={survey}
        onSaved={() => { setDialogOpen(false); onRefresh?.(); }}
      />

      {organizations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" sx={{ color: '#999' }}>No organizations attached to this survey</Typography>
        </Box>
      ) : (
        <List>
          {organizations.map((org) => (
            <ListItem
              key={org.id}
              sx={{
                borderBottom: '1px solid #eee',
                py: 1.5,
                backgroundColor: 'rgba(255,255,255,0.5)',
                mb: 0.5,
                borderRadius: 1,
              }}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleDetach(org.id, org.name)}
                    sx={{ color: '#999', '&:hover': { color: '#c62828' } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={<Typography variant="body1" sx={{ fontWeight: 500 }}>{org.name}</Typography>}
                secondary="Organization"
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default SurveyDetailOrganizations;
