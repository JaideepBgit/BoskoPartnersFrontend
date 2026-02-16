import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import InventoryService from '../../services/Admin/Inventory/InventoryService';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Menu,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Checkbox,
  Paper,
  useMediaQuery,
  useTheme,
  ListItemIcon,
  Container,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Navbar from '../shared/Navbar/Navbar';
import QuestionsTab from '../Admin/Inventory/QuestionsTab';
import TemplatesTab from '../Admin/Inventory/TemplatesTab';
import CopyTemplateVersionDialog from '../Admin/Inventory/CopyTemplateVersionDialog';

const AssociationSurveysPage = ({ onLogout }) => {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Association-specific state
  const [linkedOrganizations, setLinkedOrganizations] = useState([]);
  const [associationData, setAssociationData] = useState(null);

  // Template versions
  const [templateVersions, setTemplateVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [editingVersion, setEditingVersion] = useState(null);
  const [openVersionDialog, setOpenVersionDialog] = useState(false);

  // Actions Menu State
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [actionMenuVersion, setActionMenuVersion] = useState(null);

  const handleOpenActionMenu = (event, version) => {
    event.stopPropagation();
    setActionMenuAnchorEl(event.currentTarget);
    setActionMenuVersion(version);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchorEl(null);
    setActionMenuVersion(null);
  };

  const handleMenuCopy = () => {
    if (actionMenuVersion) {
      handleCopyTemplateVersion(actionMenuVersion);
    }
    handleCloseActionMenu();
  };

  const handleMenuPreview = () => {
    if (actionMenuVersion) {
      handlePreviewVersion(actionMenuVersion);
    }
    handleCloseActionMenu();
  };

  const handleMenuEdit = () => {
    if (actionMenuVersion) {
      handleEditTemplateVersion(actionMenuVersion);
    }
    handleCloseActionMenu();
  };

  const handleMenuDelete = () => {
    if (actionMenuVersion) {
      if (window.confirm(`Delete version "${actionMenuVersion.name}"?`)) {
        handleDeleteTemplateVersion(actionMenuVersion.id);
      }
    }
    handleCloseActionMenu();
  };

  // Organizations
  const [organizations, setOrganizations] = useState([]);

  // Copy template version state
  const [copyVersionDialogOpen, setCopyVersionDialogOpen] = useState(false);
  const [versionToCopy, setVersionToCopy] = useState(null);
  const [previewInfo, setPreviewInfo] = useState(null);

  // Bulk selection state
  const [selectedVersionIds, setSelectedVersionIds] = useState([]);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handlePreviewVersion = (version) => {
    setPreviewInfo({ type: 'version', data: version });
  };

  // Questions
  const [openQDialog, setOpenQDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionData, setQuestionData] = useState({
    question_text: '',
    question_type_id: '',
    order: 0,
    is_required: false,
    config: null
  });

  // Responses
  const [responses, setResponses] = useState([]);

  // Fetch association data and linked organizations
  const fetchAssociationData = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        navigate('/login');
        return;
      }

      const currentUser = JSON.parse(userString);
      const userRole = localStorage.getItem('userRole');
      
      if (userRole !== 'association') {
        navigate('/dashboard');
        return;
      }

      const associationId = currentUser.organization_id;
      if (!associationId) {
        console.error('No association organization found');
        return;
      }

      // Fetch association details
      const orgResponse = await InventoryService.getOrganizations();
      const association = orgResponse.find(org => org.id === associationId);
      setAssociationData(association);

      // Find organizations linked to this association
      const linkedOrgs = orgResponse.filter(org => {
        if (org.id === associationId) return false;
        return (
          org.denomination_affiliation === association.name ||
          org.accreditation_status_or_body === association.name ||
          org.affiliation_validation === association.name ||
          org.umbrella_association_membership === association.name
        );
      });

      setLinkedOrganizations(linkedOrgs);
      // Only set organizations that are linked for the dropdown
      setOrganizations(linkedOrgs);
    } catch (err) {
      console.error('Error fetching association data:', err);
    }
  };

  // Fetch template versions (filtered for association)
  const fetchTemplateVersions = async () => {
    try {
      const data = await InventoryService.getTemplateVersions();
      // Filter to only show versions from linked organizations
      const linkedOrgIds = linkedOrganizations.map(o => o.id);
      const filteredData = data.filter(v => linkedOrgIds.includes(v.organization_id));
      setTemplateVersions(filteredData);
    } catch (err) {
      console.error('Error fetching template versions:', err.response || err);
    }
  };

  // Fetch templates (filtered for association)
  const fetchTemplates = async () => {
    try {
      const data = await InventoryService.getTemplates();
      // Filter to only show templates from linked organization versions
      const linkedVersionIds = templateVersions.map(v => v.id);
      const filteredData = data.filter(t => linkedVersionIds.includes(t.version_id));
      setTemplates(filteredData);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  // Fetch a specific template
  const fetchTemplate = async (id) => {
    try {
      const data = await InventoryService.getTemplate(id);
      setSelectedTemplate(data);
    } catch (err) {
      console.error('Error fetching template:', err.response || err);
    }
  };

  // Fetch responses
  const fetchResponses = async () => {
    try {
      const data = await InventoryService.getResponses();
      setResponses(data);
    } catch (err) {
      console.error('Error fetching responses:', err.response || err);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchAssociationData();
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load versions and templates after linked organizations are loaded
  useEffect(() => {
    if (linkedOrganizations.length > 0) {
      const loadData = async () => {
        await fetchTemplateVersions();
      };
      loadData();
    }
  }, [linkedOrganizations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load templates after versions are loaded
  useEffect(() => {
    if (templateVersions.length > 0) {
      fetchTemplates();
      fetchResponses();
    }
  }, [templateVersions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load specific template if ID is provided
  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    }
  }, [templateId]);

  // Handle navigation from other pages with selected template
  useEffect(() => {
    if (location.state?.selectedTemplate && templateVersions.length > 0) {
      const template = location.state.selectedTemplate;
      if (template.version_id) {
        const version = templateVersions.find(v => v.id === template.version_id);
        if (version) {
          setSelectedVersion(version);
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, templateVersions]);

  // Template version handlers (read-only for associations - no add/edit/delete)
  const handleEditTemplateVersion = (version) => {
    // Read-only for associations
    setSnackbar({
      open: true,
      message: 'Association users cannot edit organization groups',
      severity: 'info'
    });
  };

  const handleDeleteTemplateVersion = async (versionId) => {
    // Read-only for associations
    setSnackbar({
      open: true,
      message: 'Association users cannot delete organization groups',
      severity: 'info'
    });
  };

  const handleCloseVersionDialog = () => {
    setOpenVersionDialog(false);
    setEditingVersion(null);
    setNewVersionName('');
    setNewVersionDesc('');
    setSelectedOrganizationId('');
  };

  // Bulk selection handlers
  const handleToggleVersionSelection = (e, versionId) => {
    e.stopPropagation();
    setSelectedVersionIds(prev =>
      prev.includes(versionId) ? prev.filter(id => id !== versionId) : [...prev, versionId]
    );
  };

  // Bulk delete (disabled for associations)
  const handleBulkDeleteVersions = async () => {
    setSnackbar({
      open: true,
      message: 'Association users cannot delete organization groups',
      severity: 'info'
    });
    setOpenBulkDeleteDialog(false);
  };

  // Copy template version handlers
  const handleCopyTemplateVersion = (version) => {
    setVersionToCopy(version);
    setCopyVersionDialogOpen(true);
  };

  const handleCloseCopyVersionDialog = () => {
    setCopyVersionDialogOpen(false);
    setVersionToCopy(null);
  };

  const handleCopyVersionSuccess = (result) => {
    console.log('Template version copied successfully:', result);
    fetchTemplateVersions();
    fetchTemplates();
  };

  const handleCloseDialog = () => {
    setOpenQDialog(false);
  };

  const handleSaveQuestion = async () => {
    if (!selectedTemplate) return;

    const payload = {
      question_text: questionData.question_text,
      question_type_id: questionData.question_type_id,
      order: questionData.order,
      is_required: questionData.is_required,
      config: questionData.config
    };

    let updatedQuestions = [...(selectedTemplate.questions || [])];

    if (editingQuestion) {
      const index = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        updatedQuestions[index] = { ...updatedQuestions[index], ...payload };
      }
    } else {
      const newId = Math.max(0, ...updatedQuestions.map(q => q.id || 0)) + 1;
      updatedQuestions.push({ id: newId, ...payload });
    }

    updatedQuestions.sort((a, b) => a.order - b.order);

    try {
      await InventoryService.updateTemplate(selectedTemplate.id, { questions: updatedQuestions });
      fetchTemplate(selectedTemplate.id);
      setOpenQDialog(false);
    } catch (err) {
      console.error('Error updating questions:', err.response || err);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  // Filter template versions based on search term
  const filteredVersions = useMemo(() => {
    return templateVersions.filter(v => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        v.name.toLowerCase().includes(term) ||
        (v.description && v.description.toLowerCase().includes(term)) ||
        (v.organization_name && v.organization_name.toLowerCase().includes(term))
      );
    });
  }, [templateVersions, searchTerm]);

  // Bulk selection computed values
  const handleSelectAllVersions = (e) => {
    if (e.target.checked) {
      setSelectedVersionIds(filteredVersions.map(v => v.id));
    } else {
      setSelectedVersionIds([]);
    }
  };

  const isAllSelected = filteredVersions.length > 0 && selectedVersionIds.length === filteredVersions.length;
  const isSomeSelected = selectedVersionIds.length > 0 && !isAllSelected;

  // Stable callback references for child components
  const handleRefreshData = useCallback(() => {
    fetchTemplateVersions();
    fetchTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClosePreview = useCallback(() => {
    setPreviewInfo(null);
  }, []);

  const handleCloseVersion = useCallback(() => {
    setSelectedVersion(null);
  }, []);

  const handlePreviewTemplate = useCallback((template) => {
    setPreviewInfo({ type: 'template', data: template });
  }, []);

  return (
    <>
      <Navbar onLogout={onLogout} />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              sx={{
                color: '#212121',
                fontWeight: 'bold',
                fontSize: isMobile ? '1.5rem' : '2.125rem'
              }}
            >
              Surveys ({filteredVersions.length})
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {associationData?.name || 'Association'} - View Only
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${linkedOrganizations.length} Linked Organizations`}
              sx={{ backgroundColor: '#f3e5f5', color: '#633394', fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Search & Filter Bar */}
        <Box sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Search by survey name, description, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        </Box>

        {/* Organization Survey Groups (Master-Detail View) */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
          {/* Left Panel: Version List */}
          <Box
            sx={{
              width: (selectedVersion || previewInfo) && !isMobile ? '300px' : '100%',
              transition: 'width 0.3s ease-in-out',
              flexShrink: 0
            }}
          >
            {/* Bulk Actions Bar */}
            {selectedVersionIds.length > 0 && (
              <Box sx={{
                mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                backgroundColor: '#f3e5f5', borderRadius: 2, border: '1px solid rgba(99, 51, 148, 0.25)',
                flexWrap: 'wrap'
              }}>
                <Chip label={`${selectedVersionIds.length} selected`} color="primary" sx={{ backgroundColor: '#633394' }} />
                <Button variant="outlined" size="small" onClick={() => setSelectedVersionIds([])}
                  sx={{ ml: 'auto', borderColor: '#967CB2', color: '#967CB2' }}>
                  Clear
                </Button>
              </Box>
            )}

            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
              <Box sx={{ p: 2, pb: 0, display: (selectedVersion || previewInfo) && !isMobile ? 'none' : 'block' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    gutterBottom
                    sx={{
                      color: '#633394',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '1.1rem' : '1.25rem'
                    }}
                  >
                    Organization Groups
                  </Typography>
                  {filteredVersions.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: -1, mb: 0.5 }}>
                      <Checkbox
                        indeterminate={isSomeSelected}
                        checked={isAllSelected}
                        onChange={handleSelectAllVersions}
                        size="small"
                        sx={{
                          color: '#633394',
                          '&.Mui-checked': { color: '#633394' },
                          '&.MuiCheckbox-indeterminate': { color: '#633394' },
                        }}
                        title="Select All"
                      />
                      <Typography variant="caption" sx={{ color: '#633394', fontWeight: 600 }}>
                        Select all
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ p: isMobile ? 1.5 : 2 }}>
                <Box
                  sx={{
                    p: isMobile ? 0.5 : 1,
                    maxHeight: 'calc(100vh - 300px)',
                    overflowY: 'auto'
                  }}
                >
                  <List dense={isMobile || !!selectedVersion || !!previewInfo}>
                    {filteredVersions.map(v => (
                      <ListItem
                        key={v.id}
                        selected={selectedVersion?.id === v.id || previewInfo?.data?.id === v.id || previewInfo?.data?.version_id === v.id}
                        onClick={() => {
                          setPreviewInfo(null);
                          setSelectedVersion(v);
                        }}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          py: isMobile || selectedVersion || previewInfo ? 1 : 1.5,
                          transition: 'all 0.2s ease-in-out',
                          borderLeft: selectedVersion?.id === v.id ? '4px solid #633394' : '4px solid transparent',
                          backgroundColor: selectedVersionIds.includes(v.id) ? 'rgba(99, 51, 148, 0.08)' : undefined,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(99, 51, 148, 0.15)',
                            '&:hover': {
                              backgroundColor: 'rgba(99, 51, 148, 0.2)',
                            }
                          },
                          '&:hover': {
                            backgroundColor: selectedVersion?.id === v.id ? 'rgba(99, 51, 148, 0.2)' : '#f5f5f5',
                            boxShadow: '0 2px 8px rgba(99, 51, 148, 0.15)',
                            transform: 'translateX(2px)',
                          }
                        }}
                      >
                        {/* Selection Checkbox */}
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox
                            edge="start"
                            checked={selectedVersionIds.includes(v.id)}
                            onChange={(e) => handleToggleVersionSelection(e, v.id)}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            color="primary"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={v.name}
                          secondary={
                            <Box component="span" sx={{ display: 'block' }}>
                              <Typography
                                variant="body2"
                                component="span"
                                color="text.secondary"
                                noWrap={!!selectedVersion || !!previewInfo}
                                sx={{
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  display: 'block'
                                }}
                              >
                                {v.description || 'No description'}
                              </Typography>
                              {!selectedVersion && !previewInfo && (
                                <Typography variant="caption" component="span" color="primary" sx={{ fontWeight: 500, fontSize: isMobile ? '0.7rem' : '0.75rem', display: 'block' }}>
                                  Organization: {v.organization_name || 'N/A'}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                          primaryTypographyProps={{
                            fontWeight: selectedVersion?.id === v.id ? 600 : 400,
                            color: selectedVersion?.id === v.id ? '#633394' : '#333',
                            transition: 'color 0.2s ease-in-out',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            sx: { wordBreak: 'break-word', whiteSpace: 'normal' }
                          }}
                        />
                        <ListItemSecondaryAction>
                          {(selectedVersion || previewInfo) ? (
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => handleOpenActionMenu(e, v)}
                              sx={{ color: '#633394' }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Box sx={{ display: 'flex' }}>
                              <IconButton
                                edge="end"
                                color="primary"
                                size={isMobile || selectedVersion ? "small" : "medium"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewVersion(v);
                                }}
                                sx={{
                                  mr: 0.5,
                                  color: '#633394',
                                }}
                                title="Preview"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                color="primary"
                                size={isMobile || selectedVersion ? "small" : "medium"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyTemplateVersion(v);
                                }}
                                sx={{
                                  mr: 0.5,
                                  color: '#633394',
                                }}
                                title="Copy"
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {filteredVersions.length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography
                          color="text.secondary"
                          sx={{
                            py: 2,
                            fontSize: isMobile ? '0.875rem' : '1rem'
                          }}
                        >
                          No survey groups found in linked organizations
                        </Typography>
                      </Box>
                    )}
                  </List>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Actions Menu */}
          <Menu
            anchorEl={actionMenuAnchorEl}
            open={Boolean(actionMenuAnchorEl)}
            onClose={handleCloseActionMenu}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handleMenuPreview}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" sx={{ color: '#633394' }} />
              </ListItemIcon>
              <ListItemText>Preview</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuCopy}>
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" sx={{ color: '#633394' }} />
              </ListItemIcon>
              <ListItemText>Copy</ListItemText>
            </MenuItem>
          </Menu>

          {/* Right Panel: Detail View (QuestionsTab Content or Preview) */}
          {(selectedVersion || previewInfo) && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {previewInfo ? (
                <TemplatesTab
                  templateVersions={templateVersions}
                  templates={templates}
                  onRefreshData={handleRefreshData}
                  previewMode={true}
                  initialVersion={previewInfo.type === 'version' ? previewInfo.data : null}
                  initialTemplate={previewInfo.type === 'template' ? previewInfo.data : null}
                  onClose={handleClosePreview}
                  hideSidebar={true}
                />
              ) : (
                <QuestionsTab
                  templateVersions={templateVersions}
                  templates={templates}
                  onRefreshData={handleRefreshData}
                  currentVersion={selectedVersion}
                  hideSidebar={true}
                  onClose={handleCloseVersion}
                  onPreview={handlePreviewTemplate}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Copy Template Version Dialog */}
        <CopyTemplateVersionDialog
          open={copyVersionDialogOpen}
          onClose={handleCloseCopyVersionDialog}
          templateVersion={versionToCopy}
          organizations={organizations}
          templates={templates}
          onCopySuccess={handleCopyVersionSuccess}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Container>
    </>
  );
};

export default AssociationSurveysPage;
