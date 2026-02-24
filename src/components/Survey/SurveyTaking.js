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
  FormLabel,
  Alert,
  Paper,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ConstantSumInput from '../shared/ConstantSumInput';
import SurveyCompletionGuidance from '../shared/SurveyCompletionGuidance/SurveyCompletionGuidance';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import InternalHeader from '../shared/Headers/InternalHeader';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SurveyTaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyData, setSurveyData] = useState(location.state?.surveyData || null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [surveyProgress, setSurveyProgress] = useState(0);
  const [surveyResponseId, setSurveyResponseId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCompletionGuidance, setShowCompletionGuidance] = useState(false);
  const [showSectionCompletion, setShowSectionCompletion] = useState(false);
  const [completedSectionName, setCompletedSectionName] = useState('');

  // Get survey data from navigation state
  console.log('SurveyTaking location.state:', location);
  const survey = location.state?.survey;

  useEffect(() => {
    if (!survey) {
      setError('No survey data found. Please return to the surveys page.');
      setLoading(false);
      return;
    }

    // If surveyData was already passed from overview, use it
    if (location.state?.surveyData) {
      setSurveyData(location.state.surveyData);
      if (!isInitialized) {
        getOrCreateSurveyResponse();
        setIsInitialized(true);
      }
      setLoading(false);
    } else {
      fetchSurveyData();
    }
  }, [survey]);

  // Auto-open section if specified
  useEffect(() => {
    if (location.state?.autoOpenSection && surveyData && !selectedSection) {
      const sectionToOpen = location.state.autoOpenSection;
      const startIndex = location.state.startQuestionIndex || 0;
      
      setSelectedSection(sectionToOpen);
      setCurrentQuestionIndex(startIndex);
    }
  }, [location.state?.autoOpenSection, surveyData]);

  // Update progress whenever responses change
  useEffect(() => {
    if (surveyData && surveyData.questions) {
      const totalQuestions = surveyData.questions.length;
      const answeredQuestions = Object.keys(responses).length;
      setSurveyProgress(totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0);
    }
  }, [responses, surveyData]);

  const isV2 = Boolean(survey?.survey_id);

  const fetchSurveyData = async () => {
    console.log('🔄 fetchSurveyData called, isInitialized:', isInitialized);
    try {
      setLoading(true);

      if (isV2) {
        // V2 survey flow
        const response = await fetch(`${API_BASE_URL}/v2/surveys/${survey.survey_id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch survey: ${response.status} ${response.statusText}`);
        }

        const v2Data = await response.json();
        setSurveyData(v2Data);

        if (!isInitialized) {
          await getOrCreateSurveyResponse();
          setIsInitialized(true);
        }
      } else if (survey && survey.template_id) {
        const response = await fetch(`${API_BASE_URL}/templates/${survey.template_id}`);

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
        setError('Survey data not available.');
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

  const getQuestionTypeName = (typeId) => {
    const typeMap = {
      1: 'Short Text',
      2: 'Single Choice',
      3: 'Yes/No',
      4: 'Likert Scale',
      5: 'Multiple Choice',
      6: 'Long Text',
      8: 'Percentage',
      9: 'Flexible Input'
    };
    return typeMap[typeId] || 'Other';
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
    setShowSectionCompletion(false);
  };

  const handleContinueToNextSection = () => {
    const sectionsObj = groupQuestionsBySection();
    const sectionEntries = Object.entries(sectionsObj); // [[name, questions], ...]
    const completedIndex = sectionEntries.findIndex(([name]) => name === completedSectionName);

    // Dismiss the completion overlay first
    setShowSectionCompletion(false);
    setCompletedSectionName('');

    // Try to find the next section (by order) that still has unanswered questions
    const findNext = (startIdx) => {
      for (let i = startIdx; i < sectionEntries.length; i++) {
        const [name, qs] = sectionEntries[i];
        if (name === completedSectionName) continue; // skip the one we just finished
        const firstUnanswered = qs.findIndex((q) => !responses[q.id]);
        if (firstUnanswered >= 0) {
          return { name, questions: qs, questionIndex: firstUnanswered };
        }
      }
      return null;
    };

    // 1) Look after the completed section
    let next = findNext(completedIndex + 1);
    // 2) Wrap around and look before
    if (!next) next = findNext(0);

    if (next) {
      // Use a short timeout so React has time to tear down the overlay
      setTimeout(() => {
        setSelectedSection({ name: next.name, questions: next.questions });
        setCurrentQuestionIndex(next.questionIndex);
      }, 50);
    } else {
      // Everything is answered — go back to section overview so user can submit
      setSelectedSection(null);
    }
  };

  const handleExitSurvey = () => {
    setShowSectionCompletion(false);
    navigate('/survey/intro', {
      state: {
        survey: survey,
        surveyData: surveyData
      }
    });
  };

  const handleCloseSurvey = () => {
    navigate('/survey/intro', {
      state: {
        survey: survey,
        surveyData: surveyData
      }
    });
  };

  const handleCloseGuidance = () => {
    setShowCompletionGuidance(false);
    navigate('/surveys');
  };

  const handleNavigateToProfile = () => {
    setShowCompletionGuidance(false);
    navigate('/profile', { state: { fromSurveyCompletion: true } });
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = async () => {
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

    // Auto-save after each question
    await handleSaveDraft(true); // silent save

    if (currentQuestionIndex < selectedSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of section - show completion screen
      setCompletedSectionName(selectedSection.name);
      setShowSectionCompletion(true);
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

      if (isV2) {
        // V2 flow — the join endpoint already created the response
        // Just look it up by the response id we already have
        console.log(`V2: Looking up existing response ${survey.id}`);
        const existingResponse = await fetch(`${API_BASE_URL}/v2/responses/${survey.id}`);

        if (existingResponse.ok) {
          const responseData = await existingResponse.json();
          setSurveyResponseId(responseData.id);
          setResponses(responseData.answers || {});
          console.log('✅ Found V2 survey response:', responseData.id);
        } else {
          throw new Error('Could not load survey response.');
        }
        return;
      }

      console.log(`Checking for existing response for user ${userId} and template ${survey.template_id}`);

      // First, try to find existing survey response for this user and template
      const existingResponseUrl = `${API_BASE_URL}/users/${userId}/templates/${survey.template_id}/response`;

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
      const createResponse = await fetch(`${API_BASE_URL}/templates/${survey.template_id}/responses`, {
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

  const handleSaveDraft = async (silent = false) => {
    try {
      if (!surveyResponseId) {
        if (!silent) {
          setError('No survey response ID available. Please refresh and try again.');
        }
        return;
      }

      console.log('Saving draft for response ID:', surveyResponseId);
      console.log('Current responses:', responses);

      const saveUrl = isV2
        ? `${API_BASE_URL}/v2/responses/${surveyResponseId}`
        : `${API_BASE_URL}/responses/${surveyResponseId}`;

      const response = await fetch(saveUrl, {
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
        if (!silent) {
          alert('Draft saved successfully!');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to save draft:', errorData);
        throw new Error(`Failed to save draft: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      if (!silent) {
        setError('Failed to save draft. Please try again.');
      }
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
      const submitUrl = isV2
        ? `${API_BASE_URL}/v2/responses/${surveyResponseId}`
        : `${API_BASE_URL}/responses/${surveyResponseId}`;
      const response = await fetch(submitUrl, {
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
        // Show completion guidance instead of alert and immediate navigation
        setShowCompletionGuidance(true);
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
                  value={typeof option === 'object' ? option.value : option}
                  control={<Radio />}
                  label={typeof option === 'object' ? option.label : option}
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

      case 4: // Likert Scale
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup
              value={currentValue}
              onChange={(e) => handleResponseChange(questionId, e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const defaultLabels = {
                  1: 'None',
                  2: 'A little',
                  3: 'A moderate amount',
                  4: 'A lot',
                  5: 'A great deal'
                };

                const labels = question.config?.scale_labels || defaultLabels;
                const labelText = labels[value] || defaultLabels[value] || `Option ${value}`;

                return (
                  <FormControlLabel
                    key={value}
                    value={value.toString()}
                    control={<Radio />}
                    label={`${value} - ${labelText}`}
                    sx={{ my: 0.5 }}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        );

      case 5: // Multiple choice
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <FormGroup>
              <FormLabel component="legend">Select all that apply</FormLabel>
              {question.config?.options?.map((option, idx) => {
                const selectedOptions = currentValue || [];
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;

                return (
                  <FormControlLabel
                    key={idx}
                    control={
                      <Checkbox
                        checked={selectedOptions.includes(optionValue)}
                        onChange={(e) => {
                          const current = currentValue || [];
                          let newValue;
                          if (e.target.checked) {
                            newValue = [...current, optionValue];
                          } else {
                            newValue = current.filter(item => item !== optionValue);
                          }
                          handleResponseChange(questionId, newValue);
                        }}
                      />
                    }
                    label={optionLabel}
                    sx={{ my: 0.5 }}
                  />
                );
              })}
            </FormGroup>
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
            {question.config?.instructions && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {question.config.instructions}
              </Typography>
            )}
            {question.config?.items?.map((item, idx) => {
              // Create unique keys for each item - use multiple fallbacks
              const itemValue = typeof item === 'object'
                ? (item.value || item.id || item.text || `item_${idx}`)
                : (item || `item_${idx}`);
              const itemLabel = typeof item === 'object'
                ? (item.label || item.text || item.value || `Item ${idx + 1}`)
                : (item || `Item ${idx + 1}`);
              const currentResponses = currentValue || {};

              console.log(`Flexible Input - Item ${idx}:`, { item, itemValue, itemLabel, currentValue: currentResponses[itemValue] });

              return (
                <Box key={`${questionId}_${itemValue}_${idx}`} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {itemLabel}
                  </Typography>
                  <TextField
                    fullWidth
                    value={currentResponses[itemValue] || ''}
                    onChange={(e) => {
                      const newResponses = {
                        ...currentResponses,
                        [itemValue]: e.target.value
                      };
                      console.log(`Updating flexible input for ${itemValue}:`, newResponses);
                      handleResponseChange(questionId, newResponses);
                    }}
                    placeholder={question.config?.placeholder || 'Enter your response'}
                    size="small"
                    required={question.is_required}
                  />
                </Box>
              );
            })}
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
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2, color: '#633394' }} />
          <Typography>Loading survey...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        p: 4
      }}>
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
      </Box>
    );
  }

  const sections = groupQuestionsBySection();
  const stats = calculateSurveyStats();

  // Calculate current question number across all sections
  const getCurrentQuestionNumber = () => {
    if (!selectedSection) return 0;
    const sections = groupQuestionsBySection();
    const sectionKeys = Object.keys(sections);
    const currentSectionIndex = sectionKeys.indexOf(selectedSection.name);
    
    let questionNumber = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      questionNumber += sections[sectionKeys[i]].length;
    }
    questionNumber += currentQuestionIndex + 1;
    
    return questionNumber;
  };

  const getTotalQuestions = () => {
    return surveyData?.questions?.length || 0;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5'
    }}>
      {/* Add CSS animation for pulse effect */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
        `}
      </style>

      {/* Survey Completion Guidance Modal */}
      <SurveyCompletionGuidance
        open={showCompletionGuidance}
        onClose={handleCloseGuidance}
        surveyTitle={survey?.template_name || surveyData?.survey_code || "Survey"}
        onNavigateToProfile={handleNavigateToProfile}
      />

      {/* Section Completion Screen */}
      {showSectionCompletion && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Paper sx={{
            p: 6,
            maxWidth: 500,
            textAlign: 'center',
            borderRadius: 3
          }}>
            {/* Big Green Checkmark */}
            <Box sx={{ mb: 3 }}>
              <CheckCircleIcon sx={{ 
                fontSize: '6rem', 
                color: '#4caf50',
                animation: 'pulse 1.5s ease-in-out'
              }} />
            </Box>

            <Typography variant="h4" sx={{ mb: 2, color: '#333', fontWeight: 'bold' }}>
              Great Job!
            </Typography>

            <Typography variant="h6" sx={{ mb: 4, color: '#666' }}>
              You've completed the "{completedSectionName}" section
            </Typography>

            {/* Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinueToNextSection}
                sx={{
                  backgroundColor: '#633394',
                  color: 'white',
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: '#7c52a5'
                  }
                }}
              >
                Continue to Next Section
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleExitSurvey}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: '#7c52a5',
                    backgroundColor: 'rgba(99, 51, 148, 0.08)'
                  }
                }}
              >
                Exit Survey
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Internal Header - Only show when in a section */}
      {selectedSection && (
        <InternalHeader
          title={`${selectedSection.name} — Question ${getCurrentQuestionNumber()} of ${getTotalQuestions()}`}
          leftActions={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleCloseSurvey}
                sx={{
                  color: '#633394',
                  '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.08)' }
                }}
                aria-label="Exit survey"
                title="Exit Survey"
              >
                <CloseIcon />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseSection}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#7c52a5',
                    backgroundColor: 'rgba(99, 51, 148, 0.08)'
                  }
                }}
              >
                Sections
              </Button>
            </Box>
          }
          rightActions={
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => handleSaveDraft(false)}
              disabled={Object.keys(responses).length === 0}
              sx={{
                borderColor: '#633394',
                color: '#633394',
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
          }
        />
      )}

      {/* Section Selection Overview - When no section is selected */}
      {!selectedSection && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            p: 4,
            borderRadius: 2
          }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#633394', fontWeight: 'bold' }}>
                Select a Section to Begin
              </Typography>
              <IconButton
                onClick={handleCloseSurvey}
                sx={{
                  color: '#633394',
                  '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.08)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

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

            {/* Section List */}
            <Box sx={{ mb: 4 }}>
              {Object.entries(sections).map(([sectionName, questions]) => {
                const sectionProgress = questions.filter(q => responses[q.id]).length;
                const totalQuestions = questions.length;
                const isCompleted = sectionProgress === totalQuestions;

                return (
                  <Box
                    key={sectionName}
                    onClick={() => handleOpenSection(sectionName, questions)}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
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
                          borderRadius: 1,
                          backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(99, 51, 148, 0.1)'
                        }}>
                          {isCompleted ? (
                            <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />
                          ) : (
                            <AssignmentIcon fontSize="small" sx={{ color: '#633394' }} />
                          )}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                          {sectionName}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${sectionProgress}/${totalQuestions} completed`}
                        size="small"
                        sx={{
                          backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(99, 51, 148, 0.08)',
                          color: isCompleted ? '#4caf50' : '#633394',
                          fontWeight: 500
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
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {questions.filter(q => q.is_required).length} required questions
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: '#633394', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {isCompleted ? 'Review Section' : 'Start Section'}
                        </Typography>
                        <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => handleSaveDraft(false)}
                disabled={Object.keys(responses).length === 0}
                startIcon={<SaveIcon />}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  px: 3,
                  py: 1.5,
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
        </Container>
      )}

      {/* Section View - When a section is selected */}
      {selectedSection && (
        <Container maxWidth="lg" sx={{ py: 0, px: 0 }}>
          <Box sx={{
            backgroundColor: '#fff',
            minHeight: 'calc(100vh - 100px)'
          }}>
            {/* Question Content */}
            <Box sx={{ px: 3, py: 6, display: 'flex', justifyContent: 'center' }}>
              {selectedSection.questions[currentQuestionIndex] && (
                <Card sx={{ maxWidth: 800, width: '100%', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
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
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.08)' },
                  '&:disabled': {
                    borderColor: '#ccc',
                    color: '#999'
                  }
                }}
              >
                Previous
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
          </Box>
        </Container>
      )}
    </Box>
  );
};

export default SurveyTaking; 