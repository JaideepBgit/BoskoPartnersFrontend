import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  LinearProgress,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Checkbox,
  FormGroup,
  Alert,
  Paper,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import ConstantSumInput from '../shared/ConstantSumInput';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const SurveyTaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyData, setSurveyData] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [surveyProgress, setSurveyProgress] = useState(0);
  const [surveyResponseId, setSurveyResponseId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get survey data from navigation state
  const survey = location.state?.survey;

  useEffect(() => {
    if (!survey) {
      setError('No survey data found. Please return to the surveys page.');
      setLoading(false);
      return;
    }

    fetchSurveyData();
  }, [survey]);

  // Update progress whenever responses change
  useEffect(() => {
    if (surveyData && surveyData.questions) {
      const totalQuestions = surveyData.questions.length;
      const answeredQuestions = Object.keys(responses).length;
      setSurveyProgress(totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0);
    }
  }, [responses, surveyData]);

  const fetchSurveyData = async () => {
    console.log('🔄 fetchSurveyData called, isInitialized:', isInitialized);
    try {
      setLoading(true);
      
      if (survey && survey.template_id) {
        const response = await fetch(`http://localhost:5000/api/templates/${survey.template_id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
        }
        
        const templateData = await response.json();
        setSurveyData(templateData);
        
        // Get or create survey response for this user and template (only once)
        if (!isInitialized) {
          await getOrCreateSurveyResponse();
          setIsInitialized(true);
        }
      } else {
        setError('Survey template ID not available.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching survey data:', err);
      setError(`Failed to load survey: ${err.message}. Please try again.`);
      setLoading(false);
    }
  };

  const groupQuestionsBySection = () => {
    if (!surveyData || !surveyData.questions) return {};
    
    const questionsBySection = {};
    const sectionOrder = surveyData.sections || {};
    
    surveyData.questions.forEach(question => {
      const sectionName = question.section || 'General';
      if (!questionsBySection[sectionName]) {
        questionsBySection[sectionName] = [];
      }
      questionsBySection[sectionName].push(question);
    });

    // Sort sections by their order
    const sortedSections = Object.keys(questionsBySection).sort((a, b) => {
      return (sectionOrder[a] || 0) - (sectionOrder[b] || 0);
    });

    // Create ordered sections object
    const orderedSections = {};
    sortedSections.forEach(sectionName => {
      // Sort questions within each section by order
      questionsBySection[sectionName].sort((a, b) => a.order - b.order);
      orderedSections[sectionName] = questionsBySection[sectionName];
    });

    return orderedSections;
  };

  const calculateSurveyStats = () => {
    if (!surveyData || !surveyData.questions) return { sectionCount: 0, questionCount: 0, estimatedTime: 0 };
    
    const sections = groupQuestionsBySection();
    const sectionCount = Object.keys(sections).length;
    const questionCount = surveyData.questions.length;
    const estimatedTime = Math.ceil(questionCount * 1.5); // Rough estimate: 1.5 minutes per question
    
    return { sectionCount, questionCount, estimatedTime };
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
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = selectedSection.questions[currentQuestionIndex];
    
    // Check if question is required and has a valid answer
    if (currentQuestion.is_required) {
      const response = responses[currentQuestion.id];
      
      // Handle constant-sum questions
      if (currentQuestion.question_type_id === 8) {
        if (!response || typeof response !== 'object') {
          alert('This question is required. Please provide responses for all items.');
          return;
        }
        
        // Check if all items have responses (not empty)
        const items = currentQuestion.config?.items || [];
        const hasAllResponses = items.every(item => {
          const itemId = item.id || item.text;
          return response[itemId] && response[itemId].toString().trim() !== '';
        });
        
        if (!hasAllResponses) {
          alert('Please provide responses for all items.');
          return;
        }
      } else {
        // Handle other question types
        if (!response || response.toString().trim() === '') {
          alert('This question is required. Please provide an answer.');
          return;
        }
      }
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

  const getOrCreateSurveyResponse = async () => {
    try {
      // Get the logged-in user ID from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User not logged in. Please log in again.');
        return;
      }

      console.log(`Checking for existing response for user ${userId} and template ${survey.template_id}`);

      // First, try to find existing survey response for this user and template
      const existingResponseUrl = `http://localhost:5000/api/users/${userId}/templates/${survey.template_id}/response`;
      
      try {
        const existingResponse = await fetch(existingResponseUrl);
        
        if (existingResponse.ok) {
          // Found existing response, use it
          const responseData = await existingResponse.json();
          setSurveyResponseId(responseData.id);
          setResponses(responseData.answers || {});
          console.log('✅ Found existing survey response:', responseData.id, 'with answers:', responseData.answers);
          return; // Important: exit here, don't create a new one
        } else if (existingResponse.status === 404) {
          console.log('⚠️ No existing response found (404), will create new one');
        } else {
          console.error('❌ Unexpected response status:', existingResponse.status);
          const errorText = await existingResponse.text();
          console.error('Error details:', errorText);
          throw new Error(`Unexpected response status: ${existingResponse.status}`);
        }
      } catch (fetchError) {
        if (fetchError.message.includes('fetch')) {
          console.error('❌ Network error checking for existing response:', fetchError);
          throw new Error('Network error checking for existing response');
        }
        throw fetchError;
      }

      // Only reach here if no existing response was found (404)
      console.log('🔄 Creating new survey response...');
      const createResponse = await fetch(`http://localhost:5000/api/templates/${survey.template_id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          answers: {},
          status: 'pending',
          start_date: new Date().toISOString()
        })
      });

      if (createResponse.ok) {
        const responseData = await createResponse.json();
        setSurveyResponseId(responseData.id);
        console.log('✅ Created new survey response:', responseData.id);
      } else {
        const errorData = await createResponse.json();
        console.error('❌ Failed to create survey response:', errorData);
        throw new Error(`Failed to create survey response: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Error in getOrCreateSurveyResponse:', err);
      setError(`Failed to initialize survey: ${err.message}. Please refresh and try again.`);
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!surveyResponseId) {
        setError('No survey response ID available. Please refresh and try again.');
        return;
      }

      console.log('Saving draft for response ID:', surveyResponseId);
      console.log('Current responses:', responses);

      const response = await fetch(`http://localhost:5000/api/responses/${surveyResponseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: responses,
          status: 'in_progress'
        })
      });

      if (response.ok) {
        console.log('Draft saved successfully for response ID:', surveyResponseId);
        alert('Draft saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to save draft:', errorData);
        throw new Error(`Failed to save draft: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    }
  };

  const handleSubmitSurvey = async () => {
    try {
      // Check if all required questions are answered
      if (!isAllRequiredQuestionsAnswered()) {
        alert('Please answer all required questions before submitting.');
        return;
      }

      if (!surveyResponseId) {
        setError('No survey response ID available. Please refresh and try again.');
        return;
      }

      // Submit all responses to the backend
      const response = await fetch(`http://localhost:5000/api/responses/${surveyResponseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: responses,
          status: 'completed',
          end_date: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Survey submitted successfully! Thank you for your participation.');
        navigate('/surveys');
      } else {
        throw new Error('Failed to submit survey');
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError('Failed to submit survey. Please try again.');
    }
  };

  const isAllRequiredQuestionsAnswered = () => {
    if (!surveyData || !surveyData.questions) return false;
    
    const requiredQuestions = surveyData.questions.filter(q => q.is_required);
    return requiredQuestions.every(q => {
      const response = responses[q.id];
      
      // Handle constant-sum questions
      if (q.question_type_id === 8) {
        if (!response || typeof response !== 'object') return false;
        
        // Check if all items have responses (not empty)
        const items = q.config?.items || [];
        return items.every(item => {
          const itemId = item.id || item.text;
          return response[itemId] && response[itemId].toString().trim() !== '';
        });
      }
      
      // Handle other question types
      return response && response.toString().trim() !== '';
    });
  };

  const getTotalRequiredQuestions = () => {
    if (!surveyData || !surveyData.questions) return 0;
    return surveyData.questions.filter(q => q.is_required).length;
  };

  const getAnsweredRequiredQuestions = () => {
    if (!surveyData || !surveyData.questions) return 0;
    const requiredQuestions = surveyData.questions.filter(q => q.is_required);
    return requiredQuestions.filter(q => {
      const response = responses[q.id];
      
      // Handle constant-sum questions
      if (q.question_type_id === 8) {
        if (!response || typeof response !== 'object') return false;
        
        // Check if all items have responses (not empty)
        const items = q.config?.items || [];
        return items.every(item => {
          const itemId = item.id || item.text;
          return response[itemId] && response[itemId].toString().trim() !== '';
        });
      }
      
      // Handle other question types
      return response && response.toString().trim() !== '';
    }).length;
  };

  const renderQuestion = (question) => {
    const questionId = question.id;
    const currentValue = responses[questionId] || '';

    switch (question.question_type_id) {
      case 1: // Short text
        return (
          <TextField
            fullWidth
            variant="outlined"
            value={currentValue}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            placeholder={question.config?.placeholder || 'Enter your answer'}
            required={question.is_required}
            sx={{ mt: 2 }}
          />
        );

      case 2: // Single choice
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup
              value={currentValue}
              onChange={(e) => handleResponseChange(questionId, e.target.value)}
            >
              {question.config?.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  sx={{ my: 0.5 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 3: // Yes/No
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup
              value={currentValue}
              onChange={(e) => handleResponseChange(questionId, e.target.value)}
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

      case 6: // Long text/paragraph
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={currentValue}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            placeholder={question.config?.placeholder || 'Enter your detailed answer'}
            required={question.is_required}
            sx={{ mt: 2 }}
          />
        );

      case 8: // Percentage
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Allocate percentages (Total must equal {question.config?.total_percentage || 100}%)
            </Typography>
            {question.config?.items?.map((item, idx) => {
              const itemValue = typeof item === 'object' ? item.value : item;
              const itemLabel = typeof item === 'object' ? item.label : item;
              const currentResponses = currentValue || {};
              
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
                      handleResponseChange(questionId, {
                        ...currentResponses,
                        [itemValue]: newValue
                      });
                    }}
                    inputProps={{
                      min: 0,
                      max: question.config?.total_percentage || 100,
                      step: 1
                    }}
                    sx={{ width: 100 }}
                    size="small"
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                </Box>
              );
            })}
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              Total: {Object.values(currentValue || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)}%
            </Typography>
          </Box>
        );

      case 9: // Flexible Input
        return (
          <Box sx={{ mt: 2 }}>
            <ConstantSumInput
              categories={(question.config?.items || []).map(item => ({
                value: item.value || item.id || item.text,
                label: item.label || item.text
              }))}
              values={currentValue || {}}
              onChange={(values) => handleResponseChange(questionId, values)}
              instructions={question.config?.instructions || question.config?.labels?.instruction}
              placeholder={question.config?.placeholder || 'Enter your response'}
              required={question.is_required}
            />
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            variant="outlined"
            value={currentValue}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            placeholder="Enter your answer"
            required={question.is_required}
            sx={{ mt: 2 }}
          />
        );
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2, color: '#633394' }} />
            <Typography>Loading survey...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/surveys')}
            sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
          >
            Back to Surveys
          </Button>
        </Container>
      </>
    );
  }

  const sections = groupQuestionsBySection();
  const stats = calculateSurveyStats();

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, minHeight: 'calc(100vh - 200px)' }}>
        
        {/* Survey Intro Card - When no section is selected */}
        {!selectedSection && (
          <Paper sx={{ 
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            p: 3,
            minHeight: 'calc(100vh - 250px)'
          }}>
            <Typography variant="h4" sx={{ 
              color: '#633394', 
              fontWeight: 'bold',
              mb: 1
            }}>
              {survey.template_name || surveyData.survey_code}
            </Typography>
            
            <Typography variant="h6" sx={{ 
              color: '#666', 
              mb: 3,
              fontWeight: 400
            }}>
              {survey.organization_type} Survey
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.6 }}>
              Welcome to the survey. Please review the overview below and click on any section to begin answering questions.
            </Typography>

            {/* Progress Bar */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Overall Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(surveyProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={surveyProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#f0f0f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#633394'
                  }
                }}
              />
            </Box>

            {/* Survey Overview */}
            <Box sx={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              mb: 3,
              p: 2
            }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Survey Overview:
              </Typography>
              
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
            </Box>

            {/* Section Details */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Section Details:
              </Typography>
              
              <Box sx={{ 
                paddingBottom: 2 
              }}>
                {Object.entries(sections).map(([sectionName, questions]) => {
                  const sectionProgress = questions.filter(q => responses[q.id]).length;
                  const totalQuestions = questions.length;
                  const isCompleted = sectionProgress === totalQuestions;
                  
                  return (
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
                            backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(99, 51, 148, 0.1)'
                          }}>
                            {isCompleted ? (
                              <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />
                            ) : (
                              <AssignmentIcon fontSize="small" sx={{ color: '#633394' }} />
                            )}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                            {sectionName}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${sectionProgress}/${totalQuestions} completed`}
                          size="small"
                          sx={{ 
                            height: '24px',
                            fontSize: '0.75rem',
                            backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(99, 51, 148, 0.08)',
                            color: isCompleted ? '#4caf50' : '#633394',
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
                          color: '#633394',
                          gap: 0.5
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                            {isCompleted ? 'Review Section' : 'Start Section'}
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Save Draft Button */}
              <Button
                variant="outlined"
                size="large"
                onClick={handleSaveDraft}
                disabled={Object.keys(responses).length === 0}
                startIcon={<SaveIcon />}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': { 
                    borderColor: '#7c52a5',
                    backgroundColor: 'rgba(99, 51, 148, 0.08)'
                  },
                  '&:disabled': {
                    borderColor: '#ccc',
                    color: '#999'
                  }
                }}
              >
                Save Draft
              </Button>

              {/* Submit Survey Button */}
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitSurvey}
                disabled={!isAllRequiredQuestionsAnswered()}
                startIcon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: isAllRequiredQuestionsAnswered() ? '#4caf50' : '#ccc',
                  color: isAllRequiredQuestionsAnswered() ? '#fff' : '#999',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': { 
                    backgroundColor: isAllRequiredQuestionsAnswered() ? '#45a049' : '#ccc'
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                    color: '#999'
                  }
                }}
              >
                Submit Survey
              </Button>
            </Box>

            {/* Progress Information */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Required Questions: {getAnsweredRequiredQuestions()} of {getTotalRequiredQuestions()} completed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isAllRequiredQuestionsAnswered() 
                  ? "All required questions answered! You can now submit the survey." 
                  : "Please complete all required questions to enable submission."}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Section View - When a section is selected */}
        {selectedSection && (
          <Paper sx={{ 
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            minHeight: 'calc(100vh - 250px)'
          }}>
            {/* Header */}
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
                <IconButton 
                  onClick={handleCloseSection} 
                  size="small"
                  sx={{ 
                    mr: 2,
                    color: '#633394',
                    '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.08)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
                  {selectedSection.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Question {currentQuestionIndex + 1} of {selectedSection.questions.length}
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ px: 3, py: 2, backgroundColor: '#f9f9f9' }}>
              <LinearProgress 
                variant="determinate" 
                value={((currentQuestionIndex + 1) / selectedSection.questions.length) * 100} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#633394'
                  }
                }}
              />
            </Box>

            {/* Question Content */}
            <Box sx={{ px: 3, py: 4, flexGrow: 1 }}>
              {selectedSection.questions[currentQuestionIndex] && (
                <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#333', fontWeight: 600 }}>
                      {selectedSection.questions[currentQuestionIndex].question_text}
                      {selectedSection.questions[currentQuestionIndex].is_required && (
                        <Typography component="span" sx={{ color: '#f44336', ml: 1 }}>*</Typography>
                      )}
                    </Typography>
                    
                    {renderQuestion(selectedSection.questions[currentQuestionIndex])}
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ 
              p: 3, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#f9f9f9'
            }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.08)' }
                }}
              >
                Previous
              </Button>
              
              {/* Save Draft Button in Section View */}
              <Button
                variant="text"
                onClick={handleSaveDraft}
                disabled={Object.keys(responses).length === 0}
                startIcon={<SaveIcon fontSize="small" />}
                sx={{
                  color: '#633394',
                  fontSize: '0.875rem',
                  '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.08)' },
                  '&:disabled': { color: '#ccc' }
                }}
              >
                Save Draft
              </Button>
              
              <Button
                variant="contained"
                endIcon={currentQuestionIndex === selectedSection.questions.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                onClick={handleNextQuestion}
                sx={{
                  backgroundColor: '#633394',
                  '&:hover': { backgroundColor: '#7c52a5' }
                }}
              >
                {currentQuestionIndex === selectedSection.questions.length - 1 ? 'Complete Section' : 'Next'}
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default SurveyTaking; 