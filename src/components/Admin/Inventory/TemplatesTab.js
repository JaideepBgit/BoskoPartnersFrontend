import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Stack,
  CardActions,
  LinearProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Checkbox,
  Container,
  IconButton
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TemplateUtils from './shared/TemplateUtils';

const TemplatesTab = () => {
  const [templateVersions, setTemplateVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [surveyProgress, setSurveyProgress] = useState(0);

  // Add question types definition
  const questionTypes = [
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
  ];

  useEffect(() => {
    fetchTemplateVersions();
    fetchTemplates();

    // Load any saved responses from localStorage
    const savedResponses = localStorage.getItem('surveyResponses');
    if (savedResponses) {
      try {
        setResponses(JSON.parse(savedResponses));
      } catch (e) {
        console.error('Error loading saved responses', e);
      }
    }
  }, []);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      localStorage.setItem('surveyResponses', JSON.stringify(responses));
      
      // Calculate progress
      if (selectedSection && selectedSection.questions) {
        const totalQuestions = selectedSection.questions.length;
        const answeredQuestions = selectedSection.questions.filter(q => 
          responses[q.id] !== undefined
        ).length;
        
        setSurveyProgress((answeredQuestions / totalQuestions) * 100);
      }
    }
  }, [responses, selectedSection]);

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

  const handleSelectTemplate = (templateId) => {
    fetchTemplate(templateId);
    // Reset the selected section if changing templates
    setSelectedSection(null);
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
    // Reset the selected section when changing versions
    setSelectedSection(null);
  };

  const handleOpenSection = (sectionName, questions) => {
    setSelectedSection({
      name: sectionName,
      questions: questions
    });
    setCurrentQuestionIndex(0);
  };

  const handleCloseSection = () => {
    setSelectedSection(null);
    // Save responses to server here
    console.log('Saving responses:', responses);
    // Call API to save responses
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = selectedSection.questions[currentQuestionIndex];
    
    // Check if question is required and has an answer
    if (currentQuestion.is_required && responses[currentQuestion.id] === undefined) {
      alert('This question is required. Please provide an answer.');
      return;
    }
    
    if (currentQuestionIndex < selectedSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of section
      handleCloseSection();
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestionContent = (question) => {
    switch (question.question_type_id) {
      case 1: // text
        return (
          <TextField
            fullWidth
            label="Your answer"
            variant="outlined"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            sx={{ mt: 2 }}
          />
        );
      
      case 2: // textarea
        return (
          <TextField
            fullWidth
            label="Your answer"
            variant="outlined"
            multiline
            rows={4}
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            sx={{ mt: 2 }}
          />
        );
      
      case 3: // single_choice
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <RadioGroup
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
            >
              {question.config?.options?.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{ my: 0.5 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 4: // multi_choice
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <FormLabel component="legend">Select all that apply</FormLabel>
            {question.config?.options?.map((option, idx) => {
              const selectedOptions = responses[question.id] || [];
              return (
                <FormControlLabel
                  key={idx}
                  control={
                    <Checkbox 
                      checked={selectedOptions.includes(option)}
                      onChange={(e) => {
                        const current = responses[question.id] || [];
                        let newValue;
                        if (e.target.checked) {
                          newValue = [...current, option];
                        } else {
                          newValue = current.filter(item => item !== option);
                        }
                        handleResponseChange(question.id, newValue);
                      }}
                    />
                  }
                  label={option}
                  sx={{ my: 0.5 }}
                />
              );
            })}
          </FormControl>
        );
      
      case 8: // boolean
        return (
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              row
              value={responses[question.id] === true ? 'true' : responses[question.id] === false ? 'false' : ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value === 'true')}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        );
      
      default:
        return (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            This question type ({questionTypes.find(t => t.id === question.question_type_id)?.name}) is not yet implemented.
          </Typography>
        );
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left column - Version selection */}
        <Grid item xs={12} sm={2} md={1}>
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
        
        {/* Right column - Template details */}
        <Grid 
          item 
          xs={12} 
          md="auto" 
          sx={{ flexGrow: 1 }}  // ← here
        >
          {selectedVersion ? (
            <>
              {/* Template selection */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                  Templates for {selectedVersion.name}
                </Typography>
                
                <Grid container spacing={2}>
                  {templates
                    .filter(t => t.version_id === selectedVersion.id)
                    .map(template => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
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
                        </Card>
                      </Grid>
                    ))}
                </Grid>
                
                {templates.filter(t => t.version_id === selectedVersion.id).length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>No templates available for this version.</Alert>
                )}
              </Paper>
              
              {/* Template details or Survey View */}
              {selectedTemplate && (
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                  {!selectedSection ? (
                    // Show template overview when no section is selected
                    <Card sx={{ mb: 3, p: 2 }}>
                      <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
                        {selectedTemplate.survey_code} - Survey Structure
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 3 }}>
                        Review the survey structure below
                      </Typography>
                      
                      <Card sx={{ backgroundColor: '#e3f2fd', mb: 3, p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Survey Overview:</Typography>
                        
                        {/* Calculate survey statistics */}
                        {(() => {
                          const stats = TemplateUtils.calculateSurveyStats(selectedTemplate.questions);
                          
                          return (
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: 2,
                                mb: 2,
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <ListAltIcon color="primary" fontSize="small"/>
                                <Typography variant="subtitle2">
                                  <strong>{stats.sectionCount}</strong> Sections
                                </Typography>
                              </Stack>

                              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                              <Stack direction="row" spacing={1} alignItems="center">
                                <QuizIcon color="primary" fontSize="small"/>
                                <Typography variant="subtitle2">
                                  <strong>{stats.questionCount}</strong> Questions
                                </Typography>
                              </Stack>

                              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                              <Stack direction="row" spacing={1} alignItems="center">
                                <AccessTimeIcon color="primary" fontSize="small"/>
                                <Typography variant="subtitle2">
                                  <strong>{stats.estimatedTime}</strong> min
                                </Typography>
                              </Stack>
                            </Paper>
                          );
                        })()}
                      </Card>
                      
                      <Typography variant="h6" sx={{ mb: 2 }}>Section Details:</Typography>
                      
                      {/* Display section cards vertically */}
                      {(() => {
                        const sections = TemplateUtils.groupQuestionsBySection(selectedTemplate.questions);
                        
                        return (
                          <>
                            {Object.entries(sections).map(([sectionName, questions]) => (
                              <Paper
                                key={sectionName}
                                elevation={1}
                                sx={{
                                  mb: 2,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                                  }
                                }}
                                onClick={() => handleOpenSection(sectionName, questions)}
                              >
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 2,
                                  backgroundColor: '#f9f9f9',
                                  borderBottom: '1px solid #eaeaea'
                                }}>
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <AssignmentIcon color="primary" />
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                      Section {sectionName}
                                    </Typography>
                                  </Stack>
                                  <Chip 
                                    icon={<QuizIcon />}
                                    label={`${questions.length} questions`}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>
                                <Box sx={{ 
                                  p: 2, 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  backgroundColor: 'white'
                                }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {questions.filter(q => q.is_required).length} required questions
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'primary.main' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      Start Section
                                    </Typography>
                                    <ArrowForwardIcon fontSize="small" />
                                  </Stack>
                                </Box>
                              </Paper>
                            ))}
                          </>
                        );
                      })()}
                    </Card>
                  ) : (
                    // Show survey view when a section is selected
                    <Card sx={{ p: 0, overflow: 'hidden', minHeight: '75vh' }}>
                      {/* Header */}
                      <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #eaeaea',
                        backgroundColor: '#f9f9f9'
                      }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <AssignmentIcon color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#633394' }}>
                            Section {selectedSection.name}
                          </Typography>
                        </Stack>
                        <IconButton onClick={handleCloseSection} color="primary">
                          <CloseIcon />
                        </IconButton>
                      </Box>

                      {/* Progress bar */}
                      <Box sx={{ 
                        px: { xs: 2, sm: 3 }, 
                        pt: 3, 
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Question {currentQuestionIndex + 1} of {selectedSection.questions.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(surveyProgress)}% Complete
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={surveyProgress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#633394',
                            },
                            width: '100%'
                          }} 
                        />
                      </Box>
                      
                      {/* Question content */}
                      <Box sx={{ 
                        py: 3, 
                        px: { xs: 2, sm: 3 }, 
                        minHeight: '450px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        boxSizing: 'border-box'
                      }}>
                        {selectedSection.questions[currentQuestionIndex] && (
                          <>
                            <Box sx={{ mb: 5 }}>
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  color: '#333', 
                                  mb: 1, 
                                  fontWeight: 500,
                                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } 
                                }}
                              >
                                {currentQuestionIndex + 1}. {selectedSection.questions[currentQuestionIndex].question_text}
                              </Typography>
                              {selectedSection.questions[currentQuestionIndex].is_required && (
                                <Typography variant="body2" color="error">
                                  * Required
                                </Typography>
                              )}
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '800px' }}>
                              {renderQuestionContent(selectedSection.questions[currentQuestionIndex])}
                            </Box>
                          </>
                        )}
                      </Box>
                      
                      {/* Footer with navigation */}
                      <Box sx={{ 
                        p: 3, 
                        borderTop: '1px solid #eaeaea',
                        backgroundColor: '#f9f9f9',
                        display: 'flex',
                        justifyContent: 'space-between' 
                      }}>
                        <Button 
                          onClick={handlePreviousQuestion} 
                          disabled={currentQuestionIndex === 0}
                          startIcon={<ArrowBackIcon />}
                          size="large"
                          sx={{ color: '#633394' }}
                        >
                          Previous
                        </Button>
                        <Box>
                          <Button 
                            onClick={handleCloseSection}
                            size="large"
                            sx={{ 
                              mr: 2,
                              color: '#633394'
                            }}
                          >
                            Save & Exit
                          </Button>
                          <Button 
                            onClick={handleNextQuestion}
                            endIcon={<ArrowForwardIcon />}
                            variant="contained"
                            size="large"
                            sx={{ 
                              backgroundColor: '#633394', 
                              '&:hover': { backgroundColor: '#7c52a5' },
                              px: 3
                            }}
                          >
                            {currentQuestionIndex < selectedSection.questions.length - 1 ? 'Next' : 'Finish'}
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  )}
                </Paper>
              )}
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h6" color="text.secondary">
                Select a template version from the left panel to view templates
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TemplatesTab;
