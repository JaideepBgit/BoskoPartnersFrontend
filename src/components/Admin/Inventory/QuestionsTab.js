import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TemplateUtils from './shared/TemplateUtils';

const QuestionsTab = () => {
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
    const data = await TemplateUtils.fetchTemplateVersions();
    setTemplateVersions(data);
  };

  const fetchTemplates = async () => {
    const data = await TemplateUtils.fetchTemplates();
    setTemplates(data);
  };

  const fetchTemplate = async (id) => {
    const data = await TemplateUtils.fetchTemplate(id);
    setSelectedTemplate(data);
    
    // Update the templates array with the latest data to ensure question count is correct
    setTemplates(prevTemplates => 
      prevTemplates.map(template => 
        template.id === id ? { ...template, questions: data.questions } : template
      )
    );
  };

  const handleAddTemplate = async () => {
    if (!newTemplateData.survey_code || !newTemplateData.version_id) return;
    
    const success = await TemplateUtils.addTemplate(newTemplateData);
    if (success) {
      setNewTemplateData({ survey_code: '', version_id: '', questions: [] });
      fetchTemplates();
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    const success = await TemplateUtils.deleteTemplate(templateId);
    if (success) {
      setSelectedTemplate(null);
      fetchTemplates();
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
    } else if (q.question_type_id === 9) { // dropdown
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
    } else if (questionData.question_type_id === 9) { // dropdown
      config = { options: dropdownOptions };
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
    
    const success = await TemplateUtils.updateTemplateQuestions(selectedTemplate.id, updatedQuestions);
    if (success) {
      // Update local state for immediate UI update
      const updatedTemplate = { ...selectedTemplate, questions: updatedQuestions };
      setSelectedTemplate(updatedTemplate);
      
      // Update templates array to reflect the new question count
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, questions: updatedQuestions } : t
      );
      setTemplates(updatedTemplates);
      
      setOpenQDialog(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedTemplate) return;
    
    const success = await TemplateUtils.deleteTemplateQuestion(selectedTemplate.id, questionId);
    if (success) {
      // Update local state for immediate UI update
      const updatedQuestions = selectedTemplate.questions.filter(q => q.id !== questionId);
      const updatedTemplate = { ...selectedTemplate, questions: updatedQuestions };
      setSelectedTemplate(updatedTemplate);
      
      // Update templates array to reflect the new question count
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, questions: updatedQuestions } : t
      );
      setTemplates(updatedTemplates);
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
    return TemplateUtils.getQuestionTypeName(typeId, questionTypes);
  };

  // Dynamic option handling for question types
  const handleAddOption = () => {
    setChoiceOptions([...choiceOptions, '']);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...choiceOptions];
    newOptions[index] = value;
    setChoiceOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...choiceOptions];
    newOptions.splice(index, 1);
    setChoiceOptions(newOptions);
  };

  const handleAddDropdownOption = () => {
    setDropdownOptions([...dropdownOptions, { value: '', label: '' }]);
  };

  const handleDropdownOptionChange = (index, field, value) => {
    const newOptions = [...dropdownOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setDropdownOptions(newOptions);
  };

  const handleRemoveDropdownOption = (index) => {
    const newOptions = [...dropdownOptions];
    newOptions.splice(index, 1);
    setDropdownOptions(newOptions);
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
              {/* Template selection or creation */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                  Templates for {selectedVersion.name}
                </Typography>
                
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Template Name"
                      fullWidth
                      value={newTemplateData.survey_code}
                      onChange={e => setNewTemplateData(prev => ({ ...prev, survey_code: e.target.value, version_id: selectedVersion.id }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddTemplate}
                      disabled={!newTemplateData.survey_code}
                      fullWidth
                      sx={{ 
                        backgroundColor: '#633394', 
                        '&:hover': { backgroundColor: '#7c52a5' },
                        '&.Mui-disabled': { backgroundColor: '#d1c4e9' }
                      }}
                    >
                      Add Template
                    </Button>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  {templates
                    .filter(t => t.version_id === selectedVersion.id)
                    .map(template => (
                      <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card 
                          sx={{ 
                            backgroundColor: selectedTemplate?.id === template.id ? 'rgba(99, 51, 148, 0.1)' : '#f5f5f5', 
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSelectTemplate(template.id)}
                        >
                          <CardContent>
                            <Typography variant="h6" noWrap sx={{ color: '#633394', fontWeight: 'bold' }}>{template.survey_code}</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Chip label={`${template.questions?.length || 0} Questions`} size="small" color="primary" variant="outlined" sx={{ borderColor: '#633394', color: '#633394' }} />
                              <Typography variant="caption">{new Date(template.created_at).toLocaleDateString()}</Typography>
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}>
                              Delete
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
                
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
                        backgroundColor: '#633394', 
                        '&:hover': { backgroundColor: '#7c52a5' }
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
                                {question.config && (
                                  <Typography variant="body2">
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
          <TextField 
            label="Question Text" 
            fullWidth 
            multiline
            rows={3}
            margin="normal" 
            value={questionData.question_text} 
            onChange={e => setQuestionData(prev => ({ ...prev, question_text: e.target.value }))} 
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Question Type</InputLabel>
            <Select
              value={questionData.question_type_id}
              label="Question Type"
              onChange={e => setQuestionData(prev => ({ ...prev, question_type_id: e.target.value }))}
            >
              {questionTypes.map(type => (
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
                    value={option}
                    onChange={e => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <IconButton color="error" onClick={() => handleRemoveOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleAddOption}
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
                    label="Min"
                    type="number"
                    fullWidth
                    size="small"
                    value={ratingConfig.min}
                    onChange={e => setRatingConfig(prev => ({ ...prev, min: Number(e.target.value) }))}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Max"
                    type="number"
                    fullWidth
                    size="small"
                    value={ratingConfig.max}
                    onChange={e => setRatingConfig(prev => ({ ...prev, max: Number(e.target.value) }))}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Step"
                    type="number"
                    fullWidth
                    size="small"
                    value={ratingConfig.step}
                    onChange={e => setRatingConfig(prev => ({ ...prev, step: Number(e.target.value) }))}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : questionData.question_type_id === 9 ? (
            // Dropdown
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Dropdown Options
              </Typography>
              {dropdownOptions.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                  <TextField
                    size="small"
                    sx={{ mr: 1 }}
                    value={option.value}
                    onChange={e => handleDropdownOptionChange(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    value={option.label}
                    onChange={e => handleDropdownOptionChange(index, 'label', e.target.value)}
                    placeholder="Label"
                  />
                  <IconButton color="error" onClick={() => handleRemoveDropdownOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleAddDropdownOption}
                sx={{ mt: 1 }}
              >
                Add Option
              </Button>
            </Box>
          ) : null}
          
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
            sx={{ mt: 1 }}
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
  );
};

export default QuestionsTab;
