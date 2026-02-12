import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
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
  Slide,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Navbar from '../../shared/Navbar/Navbar';
import QuestionsTab from './QuestionsTab';
import TemplatesTab from './TemplatesTab';
import CopyTemplateVersionDialog from './CopyTemplateVersionDialog';

const InventoryPage = () => {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Template versions
  const [templateVersions, setTemplateVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  // Removed global organization filter
  const [editingVersion, setEditingVersion] = useState(null);
  const [openVersionDialog, setOpenVersionDialog] = useState(false);

  // Add Survey Menu State
  const [addSurveyAnchorEl, setAddSurveyAnchorEl] = useState(null);
  const openAddSurveyMenu = Boolean(addSurveyAnchorEl);

  const handleAddSurveyClick = (event) => {
    setAddSurveyAnchorEl(event.currentTarget);
  };

  const handleAddSurveyClose = () => {
    setAddSurveyAnchorEl(null);
  };

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
  const [previewInfo, setPreviewInfo] = useState(null); // { type: 'version' | 'template', data: any }

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

  // const [newTemplateData, setNewTemplateData] = useState({
  //   survey_code: '',
  //   version_id: '',
  //   questions: []
  // });

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

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const data = await InventoryService.getOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error('Error fetching organizations:', err.response || err);
    }
  };

  // Fetch template versions
  const fetchTemplateVersions = async () => {
    try {
      const data = await InventoryService.getTemplateVersions();
      setTemplateVersions(data);
    } catch (err) {
      console.error('Error fetching template versions:', err.response || err);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const data = await InventoryService.getTemplates();
      setTemplates(data);
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

  // Initial data loading (batched to minimize re-renders)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [orgs, versions, tmpls, resps] = await Promise.all([
          InventoryService.getOrganizations().catch(err => { console.error('Error fetching organizations:', err); return []; }),
          InventoryService.getTemplateVersions().catch(err => { console.error('Error fetching template versions:', err); return []; }),
          InventoryService.getTemplates().catch(err => { console.error('Error fetching templates:', err); return []; }),
          InventoryService.getResponses().catch(err => { console.error('Error fetching responses:', err); return []; })
        ]);
        // Batch all state updates together
        setOrganizations(orgs);
        setTemplateVersions(versions);
        setTemplates(tmpls);
        setResponses(resps);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load specific template if ID is provided
  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    }
  }, [templateId]);

  // Handle navigation from OrganizationDetailPage with selected template
  useEffect(() => {
    if (location.state?.selectedTemplate && templateVersions.length > 0) {
      const template = location.state.selectedTemplate;
      console.log('Received template from navigation:', template);

      // If the template has a version_id, select that version (survey group)
      if (template.version_id) {
        const version = templateVersions.find(v => v.id === template.version_id);
        if (version) {
          console.log('Selecting version/survey group:', version);
          setSelectedVersion(version);
        }
      }

      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, templateVersions]);

  // Template version handlers
  const handleAddTemplateVersion = async () => {
    if (!newVersionName || !selectedOrganizationId) {
      alert('Please provide a name and select an organization');
      return;
    }
    try {
      await InventoryService.addTemplateVersion(newVersionName, newVersionDesc, selectedOrganizationId);
      setNewVersionName('');
      setNewVersionDesc('');
      setSelectedOrganizationId('');
      setOpenVersionDialog(false);
      fetchTemplateVersions();
    } catch (err) {
      console.error('Error adding template version:', err.response || err);
      alert('Failed to add template version. Please try again.');
    }
  };

  const handleEditTemplateVersion = (version) => {
    setEditingVersion(version);
    setNewVersionName(version.name);
    setNewVersionDesc(version.description || '');
    setSelectedOrganizationId(version.organization_id || '');
    setOpenVersionDialog(true);
  };

  const handleUpdateTemplateVersion = async () => {
    if (!newVersionName || !editingVersion || !selectedOrganizationId) {
      alert('Please provide a name and select an organization');
      return;
    }
    try {
      await InventoryService.updateTemplateVersion(editingVersion.id, newVersionName, newVersionDesc, selectedOrganizationId);
      setNewVersionName('');
      setNewVersionDesc('');
      setSelectedOrganizationId('');
      setEditingVersion(null);
      setOpenVersionDialog(false);
      fetchTemplateVersions();
    } catch (err) {
      console.error('Error updating template version:', err.response || err);
      alert('Failed to update template version. Please try again.');
    }
  };

  const handleDeleteTemplateVersion = async (versionId) => {
    try {
      await InventoryService.deleteTemplateVersion(versionId);
      setSelectedVersion(null);
      setSelectedTemplate(null);

      // Refresh all data to ensure consistency across tabs
      await Promise.all([
        fetchTemplateVersions(),
        fetchTemplates()
      ]);

      console.log('Template version deleted and all data refreshed');
    } catch (err) {
      console.error('Error deleting template version:', err.response || err);
      alert('Failed to delete template version. Please try again.');
    }
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

  // Bulk delete template versions
  const handleBulkDeleteVersions = async () => {
    setBulkDeleteLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const versionId of selectedVersionIds) {
      try {
        await InventoryService.deleteTemplateVersion(versionId);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to delete version ${versionId}:`, err);
      }
    }
    setBulkDeleteLoading(false);
    setOpenBulkDeleteDialog(false);
    setSelectedVersionIds([]);
    setSelectedVersion(null);
    setSelectedTemplate(null);
    await Promise.all([fetchTemplateVersions(), fetchTemplates()]);
    setSnackbar({
      open: true,
      message: failCount > 0
        ? `Deleted ${successCount} survey group(s). ${failCount} failed.`
        : `Successfully deleted ${successCount} survey group(s).`,
      severity: failCount > 0 ? 'warning' : 'success'
    });
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
    // Refresh data to show the new template version
    fetchTemplateVersions();
    fetchTemplates();
  };

  // Template handlers - commented out unused functions
  // const handleAddTemplate = async () => {
  //   if (!newTemplateData.survey_code || !newTemplateData.version_id) return;
  //   try {
  //     const payload = {
  //       ...newTemplateData,
  //       created_by: 1, // TODO: Get from auth context
  //       questions: newTemplateData.questions || []
  //     };
  //     await InventoryService.addTemplate(payload);
  //     setNewTemplateData({
  //       survey_code: '',
  //       version_id: '',
  //       questions: []
  //     });
  //     fetchTemplates();
  //   } catch (err) {
  //     console.error('Error adding template:', err.response || err);
  //   }
  // };

  // const handleDeleteTemplate = async (templateId) => {
  //   try {
  //     await InventoryService.deleteTemplate(templateId);
  //     setSelectedTemplate(null);
  //     fetchTemplates();
  //   } catch (err) {
  //     console.error('Error deleting template:', err.response || err);
  //   }
  // };

  // const handleSelectTemplate = (templateId) => {
  //   fetchTemplate(templateId);
  // };

  // question dialog - commented out unused functions
  // const handleOpenAdd = () => {
  //   setEditingQuestion(null);
  //   setQuestionData({ 
  //     question_text: '', 
  //     question_type_id: '', 
  //     order: selectedTemplate?.questions?.length || 0, 
  //     is_required: false,
  //     config: null
  //   });
  //   setOpenQDialog(true);
  // };

  // const handleOpenEdit = (q) => {
  //   setEditingQuestion(q);
  //   setQuestionData({
  //     question_text: q.question_text,
  //     question_type_id: q.question_type_id,
  //     order: q.order,
  //     is_required: q.is_required,
  //     config: q.config || null
  //   });
  //   setOpenQDialog(true);
  // };

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

    // Update the questions array in the template
    let updatedQuestions = [...(selectedTemplate.questions || [])];

    if (editingQuestion) {
      // Edit existing question
      const index = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        updatedQuestions[index] = { ...updatedQuestions[index], ...payload };
      }
    } else {
      // Add new question
      const newId = Math.max(0, ...updatedQuestions.map(q => q.id || 0)) + 1;
      updatedQuestions.push({ id: newId, ...payload });
    }

    // Sort by order
    updatedQuestions.sort((a, b) => a.order - b.order);

    // Update the template
    try {
      await InventoryService.updateTemplate(selectedTemplate.id, { questions: updatedQuestions });
      fetchTemplate(selectedTemplate.id);
      setOpenQDialog(false);
    } catch (err) {
      console.error('Error updating questions:', err.response || err);
    }
  };

  // const handleDeleteQuestion = async (questionId) => {
  //   if (!selectedTemplate) return;
  //   
  //   try {
  //     // Filter out the question to delete
  //     const updatedQuestions = selectedTemplate.questions.filter(q => q.id !== questionId);
  //     
  //     // Update the template
  //     await InventoryService.updateTemplate(selectedTemplate.id, { questions: updatedQuestions });
  //     fetchTemplate(selectedTemplate.id);
  //   } catch (err) {
  //     console.error('Error deleting question:', err.response || err);
  //   }
  // };



  const [searchTerm, setSearchTerm] = useState('');

  // Get user role and organization
  const [userRole, setUserRole] = useState(null);
  const [userOrgId, setUserOrgId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(role);
      setUserOrgId(user.organization_id);
    }
  }, []);

  // Filter template versions based on search term and role (memoized for performance)
  const filteredVersions = useMemo(() => {
    return templateVersions.filter(v => {
      // For managers, strictly filter by organization_id
      if (userRole === 'manager') {
        if (v.organization_id !== userOrgId) return false;
      }

      // Then apply search term
      if (!searchTerm) return true;

      const term = searchTerm.toLowerCase();
      return (
        v.name.toLowerCase().includes(term) ||
        (v.description && v.description.toLowerCase().includes(term)) ||
        (v.organization_name && v.organization_name.toLowerCase().includes(term))
      );
    });
  }, [templateVersions, searchTerm, userRole, userOrgId]);

  // Bulk selection computed values (must be after filteredVersions)
  const handleSelectAllVersions = (e) => {
    if (e.target.checked) {
      setSelectedVersionIds(filteredVersions.map(v => v.id));
    } else {
      setSelectedVersionIds([]);
    }
  };

  const isAllSelected = filteredVersions.length > 0 && selectedVersionIds.length === filteredVersions.length;
  const isSomeSelected = selectedVersionIds.length > 0 && !isAllSelected;

  // Stable callback references for child components (prevents unnecessary re-renders)
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
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
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

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setEditingVersion(null);
                setNewVersionName('');
                setNewVersionDesc('');
                setSelectedOrganizationId('');
                setOpenVersionDialog(true);
              }}
              sx={{
                color: '#633394',
                borderColor: '#633394',
                backgroundColor: 'rgba(99, 51, 148, 0.04)',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  borderColor: '#7c52a5',
                  backgroundColor: 'rgba(99, 51, 148, 0.08)'
                }
              }}
            >
              Add Organization Group
            </Button>
            <Button
              variant="contained"
              onClick={handleAddSurveyClick}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                backgroundColor: '#633394',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': { backgroundColor: '#967CB2' }
              }}
            >
              + Add Survey
            </Button>
            <Menu
              anchorEl={addSurveyAnchorEl}
              open={openAddSurveyMenu}
              onClose={handleAddSurveyClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2
                }
              }}
            >
              <MenuItem onClick={() => {
                handleAddSurveyClose();
                navigate('/inventory/blank-survey');
              }} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <NoteAddIcon fontSize="small" sx={{ color: '#633394' }} />
                </ListItemIcon>
                <ListItemText>Blank Survey</ListItemText>
              </MenuItem>

              <MenuItem onClick={() => {
                handleAddSurveyClose();
                navigate('/inventory/use-template');
              }} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" sx={{ color: '#633394' }} />
                </ListItemIcon>
                <ListItemText>Use Template</ListItemText>
              </MenuItem>

              <MenuItem onClick={() => {
                handleAddSurveyClose();
                navigate('/inventory/upload-document');
              }} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <UploadFileIcon fontSize="small" sx={{ color: '#633394' }} />
                </ListItemIcon>
                <ListItemText>Upload Document</ListItemText>
              </MenuItem>
            </Menu>
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
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => setOpenBulkDeleteDialog(true)}
                  color="error"
                >
                  Delete ({selectedVersionIds.length})
                </Button>
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
                    {filteredVersions
                      .map(v => (
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
                                <IconButton
                                  edge="end"
                                  color="primary"
                                  size={isMobile || selectedVersion ? "small" : "medium"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTemplateVersion(v);
                                  }}
                                  sx={{
                                    mr: 0.5,
                                    color: '#633394',
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  color="error"
                                  size={isMobile || selectedVersion ? "small" : "medium"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete version "${v.name}"?`)) {
                                      handleDeleteTemplateVersion(v.id);
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
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
                          {'No template versions available'}
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
            <MenuItem onClick={handleMenuEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" sx={{ color: '#633394' }} />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuDelete}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
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

        {/* Templates Tab (Removed) */}

        {/* Email Templates Tab (Shifted Index) */}


        {/* Legacy Question Dialog - This should be removed and replaced with QuestionDialog component */}

        {/* Template Version Edit Dialog */}
        <Dialog
          open={openVersionDialog}
          onClose={handleCloseVersionDialog}
          fullWidth
          fullScreen={isMobile}
          maxWidth={isMobile ? false : "sm"}
        >
          <DialogTitle sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            {editingVersion ? 'Edit Organization Group' : 'Add Organization Group'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Organization Group"
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
              value={newVersionName}
              onChange={e => setNewVersionName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#633394',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#633394',
                }
              }}
            />
            <FormControl fullWidth margin="normal" size={isMobile ? "small" : "medium"}>
              <InputLabel id="organization-label" sx={{ '&.Mui-focused': { color: '#633394' } }}>
                Organization *
              </InputLabel>
              <Select
                labelId="organization-label"
                value={selectedOrganizationId}
                label="Organization *"
                onChange={e => setSelectedOrganizationId(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    '&.Mui-focused': {
                      borderColor: '#633394',
                    },
                  },
                }}
              >
                {organizations.map(org => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              size={isMobile ? "small" : "medium"}
              value={newVersionDesc}
              onChange={e => setNewVersionDesc(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#633394',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#633394',
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
            <Button
              onClick={handleCloseVersionDialog}
              size={isMobile ? "small" : "medium"}
              sx={{
                color: '#633394',
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={editingVersion ? handleUpdateTemplateVersion : handleAddTemplateVersion}
              disabled={!newVersionName || !selectedOrganizationId}
              size={isMobile ? "small" : "medium"}
              sx={{
                backgroundColor: '#633394',
                '&:hover': { backgroundColor: '#7c52a5' },
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            >
              {editingVersion ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Copy Template Version Dialog */}
        <CopyTemplateVersionDialog
          open={copyVersionDialogOpen}
          onClose={handleCloseCopyVersionDialog}
          templateVersion={versionToCopy}
          organizations={organizations}
          templates={templates}
          onCopySuccess={handleCopyVersionSuccess}
        />

        {/* Bulk Delete Dialog */}
        <Dialog open={openBulkDeleteDialog} onClose={() => !bulkDeleteLoading && setOpenBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
            Delete {selectedVersionIds.length} Survey Group(s)
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              Are you sure you want to delete <strong>{selectedVersionIds.length}</strong> survey group(s)?
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              This will permanently delete the selected organization groups along with all their survey templates, questions, and responses. This action cannot be undone!
            </Alert>
            <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
              {filteredVersions
                .filter(v => selectedVersionIds.includes(v.id))
                .map(v => (
                  <Box key={v.id} sx={{ p: 1, mb: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{v.name}</strong> — {v.organization_name || 'N/A'}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBulkDeleteDialog(false)} disabled={bulkDeleteLoading}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDeleteVersions}
              disabled={bulkDeleteLoading}
              startIcon={bulkDeleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            >
              {bulkDeleteLoading ? 'Deleting...' : 'Yes, Delete All'}
            </Button>
          </DialogActions>
        </Dialog>

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

export default InventoryPage;
