// src/components/Admin/Inventory/EmailTemplatesTab.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

/**
 * A simple CRUD interface for managing email templates from the admin inventory page.
 * Focus is on MVP functionality: list, add, edit & delete templates.
 * More advanced features (preview, placeholders, rich-text editor) can be added later.
 */
const EmailTemplatesTab = ({ emailTemplates = [], onRefreshData, organizationId = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_body: '',
    text_body: '',
  });

  const openAddDialog = () => {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', html_body: '', text_body: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await InventoryService.updateEmailTemplate(editingTemplate.id, formData);
      } else {
        await InventoryService.addEmailTemplate({ ...formData, organization_id: organizationId });
      }
      closeDialog();
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to save email template:', err.response || err);
      alert('Unable to save template. Please try again.');
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await InventoryService.deleteEmailTemplate(templateId);
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to delete email template:', err.response || err);
      alert('Unable to delete template. Please try again.');
    }
  };

  return (
    <Box>
      <Typography
        variant={isMobile ? 'subtitle1' : 'h6'}
        gutterBottom
        sx={{ color: '#633394', fontWeight: 'bold', fontSize: isMobile ? '1.1rem' : '1.25rem' }}
      >
        Email Templates
      </Typography>

      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size={isMobile ? 'small' : 'medium'}
          onClick={openAddDialog}
          sx={{
            backgroundColor: '#633394',
            transition: 'all 0.2s ease-in-out',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            '&:hover': {
              backgroundColor: '#7c52a5',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(99, 51, 148, 0.3)',
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 2px 4px rgba(99, 51, 148, 0.3)',
            },
          }}
        >
          Add New Template
        </Button>
      </Paper>

      <Paper sx={{ p: isMobile ? 1.5 : 2 }}>
        <List>
          {emailTemplates.map((tpl) => (
            <ListItem key={tpl.id} divider>
              <ListItemText primary={tpl.name} secondary={tpl.subject} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => openEditDialog(tpl)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" sx={{ ml: 1 }} onClick={() => handleDelete(tpl.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle>{editingTemplate ? 'Edit Email Template' : 'Add Email Template'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Template Name"
            fullWidth
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <TextField
            label="HTML Body"
            fullWidth
            multiline
            rows={6}
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.html_body}
            onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
          />
          <TextField
            label="Text Body (optional)"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.text_body}
            onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#633394' }}>
            {editingTemplate ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplatesTab;
