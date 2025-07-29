import React, { useState, useEffect } from 'react';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Autocomplete
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const TemplatesQuestionsTab = () => {
  const [templateVersions, setTemplateVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplateData, setNewTemplateData] = useState({
    survey_code: '',
    version_id: '',
    questions: []
  });
  const [questionTypes, setQuestionTypes] = useState([
    { id: 1, name: 'text' },
    { id: 2, name: 'textarea' },
    { id: 3, name: 'single_choice' },
    { id: 4, name: 'multi_choice' },
    { id: 5, name: 'rating' },
    { id: 6, name: 'date' },
    { id: 7, name: 'numeric' },
    { id: 8, name: 'boolean' },
    { id: 9, name: 'dropdown' },
    { id: 10, name: 'slider' },
    { id: 11, name: 'file_upload' },
    { id: 12, name: 'matrix' },
    { id: 13, name: 'ranking' }
  ]);

  const [openQDialog, setOpenQDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionData, setQuestionData] = useState({
    question_text: '',
    question_type_id: '',
    section: '',
    order: 0,
    is_required: false,
    config: null
  });

  // Add state for dynamic options for choice-based questions
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [ratingConfig, setRatingConfig] = useState({ min: 1, max: 5, step: 1 });
  const [dropdownOptions, setDropdownOptions] = useState([]);

  useEffect(() => {
    fetchTemplateVersions();
    fetchTemplates();
  }, []);

  const fetchTemplateVersions = async () => {
    try {
      const data = await InventoryService.getTemplateVersions();
      setTemplateVersions(data);
    } catch (err) {
      console.error('Error fetching template versions:', err.response || err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await InventoryService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err.response || err);
    }
  };

  const fetchTemplate = async (id) => {
    try {
      const data = await InventoryService.getTemplate(id);
      setSelectedTemplate(data);
      
      // Update the templates array with the latest data to ensure question count is correct
      setTemplates(prevTemplates => 
        prevTemplates.map(template => 
          template.id === id ? { ...template, questions: data.questions } : template
        )
      );
    } catch (err) {
      console.error('Error fetching template:', err.response || err);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplateData.version_id) return;
    try {
      const payload = {
        ...newTemplateData,
        created_by: 1,
        questions: newTemplateData.questions || []
      };
      const response = await InventoryService.addTemplate(payload);
      setNewTemplateData({ survey_code: '', version_id: '', questions: [] });
      fetchTemplates();
      // Show success message with the generated survey code
      if (response && response.survey_code) {
        alert(`Template created successfully with survey code: ${response.survey_code}`);
      }
    } catch (err) {
      console.error('Error adding template:', err.response || err);
      alert('Error creating template. Please try again.');
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

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setQuestionData({
      question_text: '',
      question_type_id: '',
      section: '',
      order: selectedTemplate?.questions?.length || 0,
      is_required: false,
      config: null
    });
    // Reset dynamic field states
    setChoiceOptions([]);
    setRatingConfig({ min: 1, max: 5, step: 1 });
    setDropdownOptions([]);
    setOpenQDialog(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setQuestionData({
      question_text: q.question_text,
      question_type_id: q.question_type_id,
      section: q.section || '',
      order: q.order,
      is_required: q.is_required,
      config: q.config || null
    });
    
    // Initialize dynamic field states based on question type and config
    if (q.question_type_id === 3 || q.question_type_id === 4) { // single_choice or multi_choice
      setChoiceOptions(q.config?.options || []);
    } else if (q.question_type_id === 5) { // rating
      setRatingConfig({
        min: q.config?.min || 1,
        max: q.config?.max || 5,
        step: q.config?.step || 1
      });
            } else if (q.question_type_id === 8) { // constant sum
      setDropdownOptions(q.config?.options || []);
    } else {
      // Reset dynamic field states for other types
      setChoiceOptions([]);
      setRatingConfig({ min: 1, max: 5, step: 1 });
      setDropdownOptions([]);
    }
    
    setOpenQDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenQDialog(false);
  };

  const handleSaveQuestion = async () => {
    if (!selectedTemplate) return;
    
    // Prepare config based on question type
    let config = null;
    
    if (questionData.question_type_id === 3 || questionData.question_type_id === 4) { // single_choice or multi_choice
      config = { options: choiceOptions };
    } else if (questionData.question_type_id === 5) { // rating
      config = ratingConfig;
            } else if (questionData.question_type_id === 9) { // flexible input
      config = { 
        items: dropdownOptions.map(opt => ({ value: opt.value, label: opt.label })),
        instructions: '',
        placeholder: 'Enter your response'
      };
    } else if (questionData.question_type_id === 6) { // date
      config = { format: "YYYY-MM-DD" };
    } else if (questionData.question_type_id === 12) { // matrix
      config = { rows: [], columns: [] };
    } else if (questionData.question_type_id === 13) { // ranking
      config = { items: [] };
    }
    
    const payload = {
      question_text: questionData.question_text,
      question_type_id: questionData.question_type_id,
      section: questionData.section,
      order: questionData.order,
      is_required: questionData.is_required,
      config: config
    };
    
    let updatedQuestions = [...(selectedTemplate.questions || [])];
    if (editingQuestion) {
      const index = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) updatedQuestions[index] = { ...updatedQuestions[index], ...payload };
    } else {
      const newId = Math.max(0, ...updatedQuestions.map(q => q.id || 0)) + 1;
      updatedQuestions.push({ id: newId, ...payload });
    }
    updatedQuestions.sort((a, b) => a.order - b.order);
    
    try {
      await InventoryService.updateTemplate(selectedTemplate.id, { questions: updatedQuestions });
      
      // Update local state for immediate UI update
      const updatedTemplate = { ...selectedTemplate, questions: updatedQuestions };
      setSelectedTemplate(updatedTemplate);
      
      // Update templates array to reflect the new question count
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, questions: updatedQuestions } : t
      );
      setTemplates(updatedTemplates);
      
      setOpenQDialog(false);
    } catch (err) {
      console.error('Error updating questions:', err.response || err);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedTemplate) return;
    try {
      await InventoryService.deleteTemplateQuestion(selectedTemplate.id, questionId);
      
      // Update local state for immediate UI update
      const updatedQuestions = selectedTemplate.questions.filter(q => q.id !== questionId);
      const updatedTemplate = { ...selectedTemplate, questions: updatedQuestions };
      setSelectedTemplate(updatedTemplate);
      
      // Update templates array to reflect the new question count
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, questions: updatedQuestions } : t
      );
      setTemplates(updatedTemplates);
      
    } catch (err) {
      console.error('Error deleting question:', err.response || err);
    }
  };

  const handleSelectVersion = (version) => {
    setSelectedVersion(version);
    // Filter templates for this version
    const versionTemplates = templates.filter(t => t.version_id === version.id);
    if (versionTemplates.length > 0) {
      handleSelectTemplate(versionTemplates[0].id);
    } else {
      setSelectedTemplate(null);
    }
  };

  const getQuestionTypeName = (typeId) => {
    const type = questionTypes.find(t => t.id === typeId);
    return type ? type.name : 'Unknown';
  };

  // Get existing sections from the current template
  const getExistingSections = () => {
    if (!selectedTemplate?.questions) return [];
    
    const sectionsMap = selectedTemplate.questions.reduce((acc, question) => {
      const section = question.section || 'Uncategorized';
      if (section !== 'Uncategorized') {
        acc[section] = (acc[section] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.keys(sectionsMap);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left column - Version selection */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>Template Versions</Typography>
            <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              {templateVersions.map(version => (
                <ListItem 
                  key={version.id} 
                  button 
                  selected={selectedVersion?.id === version.id}
                  onClick={() => handleSelectVersion(version)}
                  sx={{ '&.Mui-selected': { backgroundColor: 'rgba(99, 51, 148, 0.1)' } }}
                >
                  <ListItemText 
                    primary={version.name} 
                    secondary={version.description || 'No description'} 
                  />
                </ListItem>
              ))}
              {templateVersions.length === 0 && (
                <Typography color="text.secondary" sx={{ py: 2 }}>No template versions available</Typography>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Right column - Template and Questions */}
        <Grid item xs={12} md={9}>
          {selectedVersion ? (
            <>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                  Templates for {selectedVersion.name}
                </Typography>
                
                {/* Add new template form */}
                <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Add New Template</Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Survey Code (Optional)"
                        value={newTemplateData.survey_code}
                        onChange={(e) => setNewTemplateData({ ...newTemplateData, survey_code: e.target.value, version_id: selectedVersion.id })}
                        placeholder="Leave empty for auto-generated code"
                        helperText="A unique identifier for this template. If left empty, one will be generated automatically."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button 
                        variant="contained" 
                        onClick={handleAddTemplate}
                        sx={{ 
                          backgroundColor: '#633394', 
                          '&:hover': { backgroundColor: '#7c52a5' }
                        }}
                      >
                        Add Template
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                {/* Templates list */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {templates
                    .filter(t => t.version_id === selectedVersion.id)
                    .map(template => (
                      <Card 
                        key={template.id}
                        sx={{ 
                          minWidth: 250, 
                          cursor: 'pointer',
                          border: selectedTemplate?.id === template.id ? '2px solid #633394' : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }
                        }}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ color: '#633394' }}>{template.survey_code}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.questions?.length || 0} questions
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(template.created_at).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <IconButton size="small" color="error" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    ))}
                </Box>
                
                {templates.filter(t => t.version_id === selectedVersion.id).length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>No templates available for this version. Create one to add questions.</Alert>
                )}
              </Paper>
              
              {/* Questions section */}
              {selectedTemplate && (
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                      Questions for {selectedTemplate.survey_code}
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleOpenAdd}
                      sx={{ 
                        backgroundColor: '#633394 !important', 
                        color: 'white !important',
                        '&:hover': { backgroundColor: '#7c52a5 !important' }
                      }}
                    >
                      Add Question
                    </Button>
                  </Box>
                  
                  {selectedTemplate.questions?.length > 0 ? (
                    <List>
                      {selectedTemplate.questions.map((question, index) => (
                        <Accordion key={question.id} sx={{ mb: 1, backgroundColor: '#fff' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ width: '70%', flexShrink: 0 }}>
                              {index + 1}. {question.question_text}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary' }}>
                              Type: {getQuestionTypeName(question.question_type_id)}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2">
                                  Required: {question.is_required ? 'Yes' : 'No'}
                                </Typography>
                                <Typography variant="body2">
                                  Order: {question.order}
                                </Typography>
                                {question.section && (
                                  <Typography variant="body2">
                                    Section: {question.section}
                                  </Typography>
                                )}
                                {question.config && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    Config: {JSON.stringify(question.config)}
                                  </Typography>
                                )}
                              </Box>
                              <Box>
                                <IconButton color="primary" onClick={() => handleOpenEdit(question)}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton color="error" onClick={() => handleDeleteQuestion(question.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">No questions added yet. Click "Add Question" to create one.</Alert>
                  )}
                </Paper>
              )}
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h6" color="text.secondary">
                Select a template version from the left panel to manage questions
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Question Dialog */}
      <Dialog open={openQDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Question Text"
              value={questionData.question_text}
              onChange={(e) => setQuestionData({ ...questionData, question_text: e.target.value })}
              margin="normal"
            />
            <Autocomplete
              fullWidth
              freeSolo
              options={getExistingSections()}
              value={questionData.section}
              onChange={(event, newValue) => {
                setQuestionData({ ...questionData, section: newValue || '' });
              }}
              onInputChange={(event, newInputValue) => {
                setQuestionData({ ...questionData, section: newInputValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Section"
                  margin="normal"
                  placeholder="Enter section name or select existing"
                  helperText="Type a new section name or select from existing sections"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="body2">{option}</Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                      ({selectedTemplate?.questions?.filter(q => q.section === option).length || 0} questions)
                    </Typography>
                  </Box>
                </Box>
              )}
              sx={{ mt: 1 }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Question Type</InputLabel>
              <Select
                value={questionData.question_type_id}
                onChange={(e) => setQuestionData({ ...questionData, question_type_id: e.target.value })}
                label="Question Type"
              >
                {questionTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Dynamic fields based on question type */}
            {questionData.question_type_id === 3 || questionData.question_type_id === 4 ? (
              // Single choice or Multi choice
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Options
                </Typography>
                {choiceOptions.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...choiceOptions];
                        newOptions[index] = e.target.value;
                        setChoiceOptions(newOptions);
                      }}
                    />
                    <IconButton 
                      color="error" 
                      onClick={() => setChoiceOptions(choiceOptions.filter((_, i) => i !== index))}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setChoiceOptions([...choiceOptions, ''])}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>
              </Box>
            ) : questionData.question_type_id === 5 ? (
              // Rating
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Rating Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min"
                      value={ratingConfig.min}
                      onChange={(e) => setRatingConfig({ ...ratingConfig, min: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max"
                      value={ratingConfig.max}
                      onChange={(e) => setRatingConfig({ ...ratingConfig, max: parseInt(e.target.value) || 5 })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Step"
                      value={ratingConfig.step}
                      onChange={(e) => setRatingConfig({ ...ratingConfig, step: parseInt(e.target.value) || 1 })}
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : questionData.question_type_id === 6 ? (
              // Date
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Date Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Users will be presented with a date picker
                </Typography>
              </Box>
            ) : questionData.question_type_id === 8 ? (
              // Dropdown
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dropdown Options
                </Typography>
                {dropdownOptions.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...dropdownOptions];
                        newOptions[index] = e.target.value;
                        setDropdownOptions(newOptions);
                      }}
                    />
                    <IconButton 
                      color="error" 
                      onClick={() => setDropdownOptions(dropdownOptions.filter((_, i) => i !== index))}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setDropdownOptions([...dropdownOptions, ''])}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>
              </Box>
            ) : null}
            
            <TextField
              fullWidth
              type="number"
              label="Order"
              value={questionData.order}
              onChange={(e) => setQuestionData({ ...questionData, order: parseInt(e.target.value) || 0 })}
              margin="normal"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={questionData.is_required}
                  onChange={(e) => setQuestionData({ ...questionData, is_required: e.target.checked })}
                />
              }
              label="Required"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveQuestion}
            disabled={!questionData.question_text || !questionData.question_type_id}
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
  );
};

export default TemplatesQuestionsTab;
