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
  Alert,
  LinearProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Checkbox,
  IconButton,
  FormGroup,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TemplateUtils from './shared/TemplateUtils';
import Slider from '@mui/material/Slider';
import UploadIcon from '@mui/icons-material/Upload';
import AttachmentIcon from '@mui/icons-material/Attachment';

const TemplatesTab = () => {
  const [templateVersions, setTemplateVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [surveyProgress, setSurveyProgress] = useState(0);

  // Add question types definition that matches backend
  const questionTypes = [
    { id: 1, name: 'short_text' },
    { id: 2, name: 'single_choice' },
    { id: 3, name: 'yes_no' },
    { id: 4, name: 'likert5' },
    { id: 5, name: 'multi_select' },
    { id: 6, name: 'paragraph' },
    { id: 7, name: 'numeric' },
    { id: 8, name: 'percentage' },
    { id: 9, name: 'year_matrix' }
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
      case 1: // short_text
        return (
          <TextField
            fullWidth
            label="Your answer"
            variant="outlined"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.config?.placeholder || 'Enter your answer here...'}
            inputProps={{
              maxLength: question.config?.max_length || 255
            }}
            sx={{ mt: 2 }}
            required={question.is_required}
            helperText={question.config?.max_length ? `Maximum ${question.config.max_length} characters` : ''}
          />
        );
      
      case 2: // single_choice
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
            >
              {question.config?.options?.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={typeof option === 'object' ? option.value : option}
                  control={<Radio />}
                  label={typeof option === 'object' ? option.label : option}
                  sx={{ my: 0.5 }}
                />
              ))}
              {question.config?.allow_other && (
                <FormControlLabel
                  value="other"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{question.config?.other_text || 'Other (please specify)'}</span>
                      {responses[question.id] === 'other' && (
                        <TextField
                          size="small"
                          placeholder="Please specify..."
                          value={responses[`${question.id}_other`] || ''}
                          onChange={(e) => handleResponseChange(`${question.id}_other`, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </Box>
                  }
                  sx={{ my: 0.5 }}
                />
              )}
            </RadioGroup>
          </FormControl>
        );
      
      case 3: // yes_no
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              row
            >
              <FormControlLabel
                value="yes"
                control={<Radio />}
                label={question.config?.yes_label || 'Yes'}
                sx={{ mr: 4 }}
              />
              <FormControlLabel
                value="no"
                control={<Radio />}
                label={question.config?.no_label || 'No'}
              />
            </RadioGroup>
          </FormControl>
        );
      
      case 4: // likert5
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                // Use custom labels if available, otherwise fall back to default
                const defaultLabels = {
                  1: 'None',
                  2: 'A little', 
                  3: 'A moderate amount',
                  4: 'A lot',
                  5: 'A great deal'
                };
                
                const labels = question.config?.scale_labels || defaultLabels;
                const displayValue = question.config?.reverse_scale ? (6 - value) : value;
                const labelText = labels[displayValue] || defaultLabels[displayValue] || `Option ${displayValue}`;
                
                return (
                  <FormControlLabel
                    key={value}
                    value={displayValue.toString()}
                    control={<Radio />}
                    label={`${displayValue} - ${labelText}`}
                    sx={{ my: 0.5 }}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        );
      
      case 5: // multi_select
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <FormGroup>
              <FormLabel component="legend">Select all that apply</FormLabel>
              {question.config?.options?.map((option, idx) => {
                const selectedOptions = responses[question.id] || [];
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                
                return (
                  <FormControlLabel
                    key={idx}
                    control={
                      <Checkbox 
                        checked={selectedOptions.includes(optionValue)}
                        onChange={(e) => {
                          const current = responses[question.id] || [];
                          let newValue;
                          if (e.target.checked) {
                            newValue = [...current, optionValue];
                          } else {
                            newValue = current.filter(item => item !== optionValue);
                          }
                          handleResponseChange(question.id, newValue);
                        }}
                      />
                    }
                    label={optionLabel}
                    sx={{ my: 0.5 }}
                  />
                );
              })}
              {question.config?.allow_other && (
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={(responses[question.id] || []).includes('other')}
                      onChange={(e) => {
                        const current = responses[question.id] || [];
                        let newValue;
                        if (e.target.checked) {
                          newValue = [...current, 'other'];
                        } else {
                          newValue = current.filter(item => item !== 'other');
                        }
                        handleResponseChange(question.id, newValue);
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{question.config?.other_text || 'Other (please specify)'}</span>
                      {(responses[question.id] || []).includes('other') && (
                        <TextField
                          size="small"
                          placeholder="Please specify..."
                          value={responses[`${question.id}_other`] || ''}
                          onChange={(e) => handleResponseChange(`${question.id}_other`, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </Box>
                  }
                  sx={{ my: 0.5 }}
                />
              )}
            </FormGroup>
          </FormControl>
        );
      
      case 6: // paragraph
        return (
          <TextField
            fullWidth
            label="Your answer"
            variant="outlined"
            multiline
            rows={4}
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.config?.placeholder || 'Enter your detailed response here...'}
            inputProps={{
              maxLength: question.config?.max_length || 2000,
              minLength: question.config?.min_length || 0
            }}
            sx={{ mt: 2 }}
            required={question.is_required}
            helperText={
              question.config?.character_counter 
                ? `${(responses[question.id] || '').length}/${question.config?.max_length || 2000} characters`
                : question.config?.max_length ? `Maximum ${question.config.max_length} characters` : ''
            }
          />
        );
      
      case 7: // numeric
        return (
          <TextField
            fullWidth
            label="Your answer"
            variant="outlined"
            type="number"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={`Enter a ${question.config?.number_type || 'integer'} value`}
            inputProps={{
              min: question.config?.min_value,
              max: question.config?.max_value,
              step: question.config?.number_type === 'decimal' ? 0.01 : 1
            }}
            sx={{ mt: 2 }}
            required={question.is_required}
            helperText={
              question.config?.min_value !== null && question.config?.max_value !== null
                ? `Range: ${question.config.min_value} to ${question.config.max_value}${question.config?.unit_label ? ` ${question.config.unit_label}` : ''}`
                : question.config?.unit_label ? `Unit: ${question.config.unit_label}` : ''
            }
          />
        );
      
      case 8: // percentage
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Allocate percentages (Total must equal {question.config?.total_percentage || 100}%)
            </Typography>
            {question.config?.items?.map((item, idx) => {
              const itemValue = typeof item === 'object' ? item.value : item;
              const itemLabel = typeof item === 'object' ? item.label : item;
              const currentResponses = responses[question.id] || {};
              
              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                    {itemLabel}
                  </Typography>
                  <TextField
                    type="number"
                    value={currentResponses[itemValue] || ''}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      handleResponseChange(question.id, {
                        ...currentResponses,
                        [itemValue]: newValue
                      });
                    }}
                    inputProps={{
                      min: 0,
                      max: question.config?.total_percentage || 100,
                      step: question.config?.allow_decimals ? 0.1 : 1
                    }}
                    sx={{ width: 100 }}
                    size="small"
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                </Box>
              );
            })}
            {question.config?.show_running_total && (
              <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                Total: {Object.values(responses[question.id] || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)}%
              </Typography>
            )}
          </Box>
        );
      
      case 9: // year_matrix
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
              Complete the information for each year from {question.config?.start_year} to {question.config?.end_year}
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    {(() => {
                      const startYear = question.config?.start_year || new Date().getFullYear();
                      const endYear = question.config?.end_year || new Date().getFullYear() + 5;
                      const years = [];
                      for (let year = startYear; year <= endYear; year++) {
                        years.push(year);
                      }
                      return years.map(year => (
                        <TableCell key={year} align="center">{year}</TableCell>
                      ));
                    })()}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {question.config?.rows?.map((row, rowIdx) => {
                    const rowValue = typeof row === 'object' ? row.value : row;
                    const rowLabel = typeof row === 'object' ? row.label : row;
                    
                    return (
                      <TableRow key={rowIdx}>
                        <TableCell>{rowLabel}</TableCell>
                        {(() => {
                          const startYear = question.config?.start_year || new Date().getFullYear();
                          const endYear = question.config?.end_year || new Date().getFullYear() + 5;
                          const years = [];
                          for (let year = startYear; year <= endYear; year++) {
                            years.push(year);
                          }
                          return years.map(year => {
                            const currentResponses = responses[question.id] || {};
                            const cellKey = `${rowValue}_${year}`;
                            
                            return (
                              <TableCell key={year} align="center">
                                <TextField
                                  size="small"
                                  type={question.config?.input_type === 'numeric' ? 'number' : 'text'}
                                  value={currentResponses[cellKey] || ''}
                                  onChange={(e) => {
                                    handleResponseChange(question.id, {
                                      ...currentResponses,
                                      [cellKey]: e.target.value
                                    });
                                  }}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                            );
                          });
                        })()}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
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
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 180px)' }}>
      {/* Left sidebar - Version selection */}
      <Box 
        sx={{ 
          width: { xs: selectedSection ? 0 : 240, sm: 280 }, 
          backgroundColor: '#f5f5f5', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
          minHeight: '100%',
          display: { xs: selectedSection ? 'none' : 'flex', sm: 'flex' },
          flexDirection: 'column',
          transition: 'width 0.3s ease'
        }}
      >
        <Typography variant="h6" sx={{ p: 2, color: '#633394', fontWeight: 'bold' }}>
          Template Versions
        </Typography>
        
        <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
          {templateVersions.map(version => (
            <Button
              key={version.id}
              fullWidth
              variant={selectedVersion?.id === version.id ? 'contained' : 'outlined'}
              onClick={() => handleSelectVersion(version)}
              sx={{
                mb: 1,
                justifyContent: 'flex-start',
                textTransform: 'none',
                backgroundColor: selectedVersion?.id === version.id ? '#633394' : 'transparent',
                color: selectedVersion?.id === version.id ? 'white' : '#633394',
                borderColor: '#633394',
                fontWeight: selectedVersion?.id === version.id ? 600 : 400,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: selectedVersion?.id === version.id ? '#7c52a5' : 'rgba(99, 51, 148, 0.08)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 3px 5px rgba(99, 51, 148, 0.2)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 1px 3px rgba(99, 51, 148, 0.2)',
                }
              }}
            >
              <Box sx={{ textAlign: 'left', width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: '0.875rem' }}>
                  {version.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8, fontSize: '0.75rem' }}>
                  {version.description || 'No description'}
                </Typography>
              </Box>
            </Button>
          ))}
          {templateVersions.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 2, fontSize: '0.875rem', textAlign: 'center' }}>
              No template versions available
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pl: 2 }}>
        {selectedVersion ? (
          <>
            {/* Template selection - Only when not viewing a section */}
            {!selectedSection && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#633394', 
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  mb: 2
                }}>
                  Templates for {selectedVersion.name}
                </Typography>
                
                <Grid container spacing={2}>
                  {templates
                    .filter(t => t.version_id === selectedVersion.id)
                    .map(template => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                        <Card 
                          sx={{ 
                            backgroundColor: '#fff', 
                            boxShadow: selectedTemplate?.id === template.id 
                              ? '0 0 0 2px #633394, 0 4px 8px rgba(99, 51, 148, 0.2)'
                              : '0 1px 3px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              boxShadow: selectedTemplate?.id === template.id 
                                ? '0 0 0 2px #633394, 0 6px 16px rgba(99, 51, 148, 0.25)'
                                : '0 4px 12px rgba(99, 51, 148, 0.15)',
                              transform: 'translateY(-2px)'
                            },
                            overflow: 'hidden'
                          }}
                          onClick={() => handleSelectTemplate(template.id)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography 
                              variant="subtitle1" 
                              noWrap 
                              sx={{ 
                                color: selectedTemplate?.id === template.id ? '#633394' : '#333', 
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                mb: 1,
                                transition: 'color 0.2s ease-in-out',
                              }}
                            >
                              {template.survey_code}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Chip 
                                label={`${template.questions?.length || 0} Questions`} 
                                size="small" 
                                sx={{ 
                                  height: '22px',
                                  fontSize: '0.75rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(99, 51, 148, 0.08)',
                                  color: '#633394',
                                  fontWeight: 500,
                                  border: '1px solid rgba(99, 51, 148, 0.2)',
                                }} 
                              />
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                {new Date(template.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
                
                {templates.filter(t => t.version_id === selectedVersion.id).length === 0 && (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mt: 2,
                      borderRadius: '4px',
                      '& .MuiAlert-message': { fontSize: '0.875rem' }
                    }}
                  >
                    No templates available for this version.
                  </Alert>
                )}
              </Box>
            )}
            
            {/* Template details or Survey View */}
            {selectedTemplate && !selectedSection && (
              <Paper sx={{ 
                p: 3, 
                backgroundColor: '#f5f5f5', 
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#333', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  mb: 2
                }}>
                  {selectedTemplate.survey_code} - Survey Structure
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                  Review the survey structure below
                </Typography>
                
                <Box sx={{ 
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  mb: 3,
                  p: 2
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                    Survey Overview:
                  </Typography>
                  
                  {/* Calculate survey statistics */}
                  {(() => {
                    const stats = TemplateUtils.calculateSurveyStats(selectedTemplate.questions);
                    
                    return (
                      <Box
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: '4px',
                          mb: 1,
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ListAltIcon sx={{ color: '#633394', fontSize: '1.25rem', mr: 1 }}/>
                          <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                            <strong>{stats.sectionCount}</strong> Sections
                          </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ mx: 2, height: '20px' }} />

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <QuizIcon sx={{ color: '#633394', fontSize: '1.25rem', mr: 1 }}/>
                          <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                            <strong>{stats.questionCount}</strong> Questions
                          </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ mx: 2, height: '20px' }} />

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ color: '#633394', fontSize: '1.25rem', mr: 1 }}/>
                          <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                            <strong>{stats.estimatedTime}</strong> min
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })()}
                </Box>
                
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                    Section Details:
                  </Typography>
                  
                  {/* Display section cards vertically */}
                  {(() => {
                    const sections = TemplateUtils.groupQuestionsBySection(selectedTemplate.questions);
                    
                    return (
                      <Box sx={{ 
                        height: 'auto',
                        overflowY: 'visible',
                        paddingBottom: 2 
                      }}>
                        {Object.entries(sections).map(([sectionName, questions]) => (
                          <Box
                            key={sectionName}
                            sx={{
                              mb: 2,
                              borderRadius: '4px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '1px solid #e0e0e0',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
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
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  p: 0.5, 
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(99, 51, 148, 0.1)'
                                }}>
                                  <AssignmentIcon fontSize="small" sx={{ color: '#633394' }} />
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                                  Section {sectionName}
                                </Typography>
                              </Box>
                              <Chip 
                                label={`${questions.length} questions`}
                                size="small"
                                sx={{ 
                                  height: '24px',
                                  fontSize: '0.75rem',
                                  backgroundColor: 'rgba(99, 51, 148, 0.08)',
                                  color: '#633394',
                                  fontWeight: 500,
                                  borderRadius: '4px'
                                }}
                              />
                            </Box>
                            <Box sx={{ 
                              p: 2, 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'white'
                            }}>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                                {questions.filter(q => q.is_required).length} required questions
                              </Typography>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                color: '#5c68c3',
                                gap: 0.5
                              }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                  Start Section
                                </Typography>
                                <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    );
                  })()}
                </Box>
              </Paper>
            )}
            
            {/* Survey view - Full screen when viewing a section */}
            {selectedSection && (
              <Paper sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}>
                {/* Header - Clean and minimal */}
                <Box sx={{ 
                  px: 3,
                  py: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#fff'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Back button for mobile */}
                    <IconButton 
                      onClick={handleCloseSection} 
                      size="small"
                      sx={{ 
                        display: { xs: 'inline-flex', sm: 'none' },
                        mr: 1,
                        color: '#633394',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 51, 148, 0.08)'
                        }
                      }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.95rem'
                      }}
                    >
                      <Box component="span" sx={{ 
                        display: 'inline-flex',
                        mr: 1.5,
                        color: '#633394',
                        bgcolor: 'rgba(99, 51, 148, 0.1)',
                        p: 0.5,
                        borderRadius: '4px'
                      }}>
                        <AssignmentIcon fontSize="small" />
                      </Box>
                      Section {selectedSection.name}
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={handleCloseSection} 
                    size="small"
                    sx={{ 
                      display: { xs: 'none', sm: 'inline-flex' },
                      color: '#666',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Progress bar - More subtle */}
                <Box sx={{ 
                  px: 3, 
                  py: 1.5, 
                  width: '100%',
                  boxSizing: 'border-box',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                      Question {currentQuestionIndex + 1} of {selectedSection.questions.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                      {Math.round(surveyProgress)}% Complete
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={surveyProgress} 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#633394',
                      },
                      width: '100%'
                    }} 
                  />
                </Box>
                
                {/* Question content - Clean white space */}
                <Box sx={{ 
                  py: 4, 
                  px: 3, 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fff',
                  overflow: 'auto'
                }}>
                  {selectedSection.questions[currentQuestionIndex] && (
                    <>
                      <Box sx={{ mb: 4 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#333', 
                            mb: 0.5, 
                            fontWeight: 500,
                            fontSize: '1.125rem',
                            lineHeight: 1.4
                          }}
                        >
                          {currentQuestionIndex + 1}. {selectedSection.questions[currentQuestionIndex].question_text}
                        </Typography>
                        {selectedSection.questions[currentQuestionIndex].is_required && (
                          <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: '0.75rem' }}>
                            * Required
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ width: '100%', maxWidth: '900px' }}>
                        {renderQuestionContent(selectedSection.questions[currentQuestionIndex])}
                      </Box>
                    </>
                  )}
                </Box>
                
                {/* Footer with navigation - Cleaner buttons */}
                <Box sx={{ 
                  px: 3,
                  py: 2,
                  borderTop: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Button 
                    onClick={handlePreviousQuestion} 
                    disabled={currentQuestionIndex === 0}
                    startIcon={<ArrowBackIcon fontSize="small" />}
                    sx={{ 
                      color: '#633394', 
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      '&.Mui-disabled': {
                        color: 'rgba(0, 0, 0, 0.26)'
                      }
                    }}
                  >
                    Previous
                  </Button>
                  <Box>
                    <Button 
                      onClick={handleCloseSection}
                      sx={{ 
                        mr: 2,
                        color: '#666',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      Save & Exit
                    </Button>
                    <Button 
                      onClick={handleNextQuestion}
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      variant="contained"
                      disableElevation
                      sx={{ 
                        backgroundColor: '#633394', 
                        '&:hover': { backgroundColor: '#7c52a5' },
                        px: 2.5,
                        py: 0.75,
                        borderRadius: '4px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      {currentQuestionIndex < selectedSection.questions.length - 1 ? 'Next' : 'Finish'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        ) : (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            backgroundColor: '#f5f5f5', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
            flex: 1 
          }}>
            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
              Survey Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', fontSize: '0.95rem' }}>
              Select a template version from the left panel to view templates
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default TemplatesTab;
