import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
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
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Navbar from '../../shared/Navbar/Navbar';
import QuestionsTab from './QuestionsTab';
import TemplatesTab from './TemplatesTab';

const InventoryPage = () => {
  const { templateId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  
  // Template versions
  const [templateVersions, setTemplateVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  
  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplateData, setNewTemplateData] = useState({
    survey_code: '',
    version_id: '',
    questions: []
  });
  
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
  const [selectedResponse, setSelectedResponse] = useState(null);

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
      console.error('Error fetching templates:', err.response || err);
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
    fetchTemplateVersions();
    fetchTemplates();
    fetchResponses();
  }, []);

  // Load specific template if ID is provided
  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    }
  }, [templateId]);

  // Template version handlers
  const handleAddTemplateVersion = async () => {
    if (!newVersionName) return;
    try {
      await InventoryService.addTemplateVersion(newVersionName, newVersionDesc);
      setNewVersionName('');
      setNewVersionDesc('');
      fetchTemplateVersions();
    } catch (err) {
      console.error('Error adding template version:', err.response || err);
    }
  };

  const handleDeleteTemplateVersion = async (versionId) => {
    try {
      await InventoryService.deleteTemplateVersion(versionId);
      setSelectedVersion(null);
      fetchTemplateVersions();
    } catch (err) {
      console.error('Error deleting template version:', err.response || err);
    }
  };
  
  // Template handlers
  const handleAddTemplate = async () => {
    if (!newTemplateData.survey_code || !newTemplateData.version_id) return;
    try {
      const payload = {
        ...newTemplateData,
        created_by: 1, // TODO: Get from auth context
        questions: newTemplateData.questions || []
      };
      await InventoryService.addTemplate(payload);
      setNewTemplateData({
        survey_code: '',
        version_id: '',
        questions: []
      });
      fetchTemplates();
    } catch (err) {
      console.error('Error adding template:', err.response || err);
    }
  };
  
  const handleDeleteTemplate = async (templateId) => {
    try {
      await InventoryService.deleteTemplate(templateId);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err.response || err);
    }
  };
  
  const handleSelectTemplate = (templateId) => {
    fetchTemplate(templateId);
  };

  // question dialog
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setQuestionData({ 
      question_text: '', 
      question_type_id: '', 
      order: selectedTemplate?.questions?.length || 0, 
      is_required: false,
      config: null
    });
    setOpenQDialog(true);
  };
  
  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setQuestionData({
      question_text: q.question_text,
      question_type_id: q.question_type_id,
      order: q.order,
      is_required: q.is_required,
      config: q.config || null
    });
    setOpenQDialog(true);
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

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedTemplate) return;
    
    try {
      // Filter out the question to delete
      const updatedQuestions = selectedTemplate.questions.filter(q => q.id !== questionId);
      
      // Update the template
      await InventoryService.updateTemplate(selectedTemplate.id, { questions: updatedQuestions });
      fetchTemplate(selectedTemplate.id);
    } catch (err) {
      console.error('Error deleting question:', err.response || err);
    }
  };
  
  // Tab handling
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Navbar />
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>Survey Management</Typography>
        
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                color: '#633394',
                fontWeight: 500,
                '&.Mui-selected': { fontWeight: 700 },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#633394',
              }, 
            }}
          >
            <Tab label="Template Versions" />
            <Tab label="Questions Inventory" />
            <Tab label="Preview Templates" />
          </Tabs>
        </Paper>
      
        {/* Template Versions Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>Template Versions</Typography>
            
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Version Name"
                    fullWidth
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
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Description"
                    fullWidth
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
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddTemplateVersion}
                    disabled={!newVersionName}
                    fullWidth
                    sx={{ 
                      backgroundColor: '#633394', 
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        backgroundColor: '#7c52a5',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(99, 51, 148, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                        boxShadow: '0 2px 4px rgba(99, 51, 148, 0.3)',
                      },
                      '&.Mui-disabled': { backgroundColor: '#d1c4e9' }
                    }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <Box 
                sx={{ 
                  bgcolor: 'white',
                  borderRadius: 1,
                  p: 1,
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <List>
                  {templateVersions.map(v => (
                    <ListItem 
                      key={v.id} 
                      button 
                      selected={selectedVersion?.id === v.id}
                      onClick={() => setSelectedVersion(v)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        transition: 'all 0.2s ease-in-out',
                        '&.Mui-selected': { 
                          backgroundColor: 'rgba(99, 51, 148, 0.15)',
                          borderColor: '#633394',
                          '&:hover': {
                            backgroundColor: 'rgba(99, 51, 148, 0.2)',
                          }
                        },
                        '&:hover': {
                          backgroundColor: selectedVersion?.id === v.id ? 'rgba(99, 51, 148, 0.2)' : 'rgba(99, 51, 148, 0.05)',
                          boxShadow: '0 2px 8px rgba(99, 51, 148, 0.15)',
                          transform: 'translateX(2px)',
                        }
                      }}
                    >
                      <ListItemText
                        primary={v.name}
                        secondary={v.description || 'No description'}
                        primaryTypographyProps={{
                          fontWeight: selectedVersion?.id === v.id ? 600 : 400,
                          color: selectedVersion?.id === v.id ? '#633394' : '#333',
                          transition: 'color 0.2s ease-in-out',
                        }}
                        secondaryTypographyProps={{
                          color: 'text.secondary'
                        }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          color="error" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete version "${v.name}"?`)) {
                              handleDeleteTemplateVersion(v.id);
                            }
                          }}
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: 'rgba(211, 47, 47, 0.08)',
                              transform: 'scale(1.1)',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {templateVersions.length === 0 && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography color="text.secondary" sx={{ py: 2 }}>No template versions available</Typography>
                    </Box>
                  )}
                </List>
              </Box>
            </Paper>
          </Box>
        )}
      
        {/* Questions Tab */}
        {activeTab === 1 && (
          <QuestionsTab />
        )}
      
        {/* Templates Tab */}
        {activeTab === 2 && (
          <TemplatesTab />
        )}
      
        {/* Question Dialog */}
        <Dialog open={openQDialog} onClose={handleCloseDialog} fullWidth>
          <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Question Text"
              fullWidth
              multiline
              margin="normal"
              value={questionData.question_text}
              onChange={e => setQuestionData(prev => ({ ...prev, question_text: e.target.value }))}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={questionData.question_type_id}
                label="Type"
                onChange={e => setQuestionData(prev => ({ ...prev, question_type_id: e.target.value }))}
              >
                {/* Note: This dialog should be replaced with QuestionDialog for consistency */}
                <MenuItem value={1}>Text / Graphic</MenuItem>
                <MenuItem value={2}>Multiple Choice</MenuItem>
                <MenuItem value={3}>Matrix Table</MenuItem>
                <MenuItem value={4}>Text Entry</MenuItem>
                <MenuItem value={5}>Form Field</MenuItem>
                <MenuItem value={6}>Slider</MenuItem>
                <MenuItem value={7}>Rank Order</MenuItem>
                <MenuItem value={8}>Side by Side</MenuItem>
                <MenuItem value={9}>Autocomplete</MenuItem>
                <MenuItem value={10}>Constant Sum</MenuItem>
                <MenuItem value={11}>Pick, Group & Rank</MenuItem>
                <MenuItem value={12}>Hot Spot</MenuItem>
                <MenuItem value={13}>Heat Map</MenuItem>
                <MenuItem value={14}>Graphic Slider</MenuItem>
                <MenuItem value={15}>Drill Down</MenuItem>
                <MenuItem value={16}>Net Promoter Score</MenuItem>
                <MenuItem value={17}>Highlight</MenuItem>
                <MenuItem value={18}>Signature</MenuItem>
                <MenuItem value={19}>Video Response</MenuItem>
                <MenuItem value={20}>User Testing</MenuItem>
                <MenuItem value={21}>Tree Testing</MenuItem>
                <MenuItem value={22}>Timing</MenuItem>
                <MenuItem value={23}>Meta Info</MenuItem>
                <MenuItem value={24}>File Upload</MenuItem>
                <MenuItem value={25}>Captcha Verification</MenuItem>
                <MenuItem value={26}>Location Selector</MenuItem>
                <MenuItem value={27}>ArcGIS Map</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Order"
              type="number"
              fullWidth
              margin="normal"
              value={questionData.order}
              onChange={e => setQuestionData(prev => ({ ...prev, order: Number(e.target.value) }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={questionData.is_required}
                  onChange={e => setQuestionData(prev => ({ ...prev, is_required: e.target.checked }))}
                />
              }
              label="Required"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ color: '#633394' }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveQuestion} 
              sx={{ 
                backgroundColor: '#633394', 
                '&:hover': { backgroundColor: '#7c52a5' }
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      </>
  );
};

export default InventoryPage;
