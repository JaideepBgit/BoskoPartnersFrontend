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
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SurveyTaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyData, setSurveyData] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [sectionQuestions, setSectionQuestions] = useState([]);
  const [sections, setSections] = useState([]);

  // Get survey data from navigation state or localStorage
  const survey = location.state?.survey;
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const surveyCode = localStorage.getItem('surveyCode');

  useEffect(() => {
    if (!survey && !surveyCode) {
      setError('No survey data found. Please return to the surveys page.');
      setLoading(false);
      return;
    }

    fetchSurveyData();
  }, [survey, surveyCode]);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      
      // If we have survey data from navigation, use it
      if (survey && survey.survey_code) {
        // Fetch the full survey template
        const response = await fetch(`http://localhost:5000/api/templates/8`); // Using template ID 8 for the church survey
        const templateData = await response.json();
        
        setSurveyData(templateData);
        organizeSurveyData(templateData);
      } else {
        setError('Survey data not available.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching survey data:', err);
      setError('Failed to load survey. Please try again.');
      setLoading(false);
    }
  };

  const organizeSurveyData = (data) => {
    // Group questions by section
    const questionsBySection = {};
    const sectionOrder = data.sections || {};
    
    data.questions.forEach(question => {
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

    // Sort questions within each section by order
    sortedSections.forEach(sectionName => {
      questionsBySection[sectionName].sort((a, b) => a.order - b.order);
    });

    setSections(sortedSections);
    setSectionQuestions(questionsBySection);
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
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

  const getCurrentSectionQuestions = () => {
    if (!sections.length || !sectionQuestions) return [];
    const sectionName = sections[currentSection];
    return sectionQuestions[sectionName] || [];
  };

  const getProgress = () => {
    const totalQuestions = surveyData?.questions?.length || 0;
    const answeredQuestions = Object.keys(responses).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canProceedToNext = () => {
    const currentQuestions = getCurrentSectionQuestions();
    const requiredQuestions = currentQuestions.filter(q => q.is_required);
    
    return requiredQuestions.every(q => responses[q.id] && responses[q.id].toString().trim() !== '');
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Here you would submit the survey responses to the backend
      console.log('Submitting survey responses:', responses);
      
      // For now, just show success and navigate back
      alert('Survey submitted successfully! Thank you for your participation.');
      navigate('/surveys');
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError('Failed to submit survey. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <LinearProgress sx={{ width: 300, mb: 2 }} />
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
            variant="outlined"
            onClick={() => navigate('/surveys')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Surveys
          </Button>
        </Container>
      </>
    );
  }

  const currentQuestions = getCurrentSectionQuestions();
  const isLastSection = currentSection === sections.length - 1;

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
            {surveyData?.version_name || 'Survey'}
          </Typography>
          
          {/* Progress */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(getProgress())}% Complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Section {currentSection + 1} of {sections.length}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getProgress()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#633394',
                }
              }} 
            />
          </Box>

          {/* Section Stepper */}
          <Stepper activeStep={currentSection} sx={{ mt: 3 }}>
            {sections.map((sectionName, index) => (
              <Step key={sectionName}>
                <StepLabel>{sectionName}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Questions */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
            {sections[currentSection]}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />

          {currentQuestions.map((question, index) => (
            <Box key={question.id} sx={{ mb: 4 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                {index + 1}. {question.question_text}
                {question.is_required && (
                  <Typography component="span" sx={{ color: 'red', ml: 1 }}>*</Typography>
                )}
              </Typography>
              
              {renderQuestion(question)}
            </Box>
          ))}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={currentSection === 0}
              startIcon={<ArrowBackIcon />}
              sx={{ 
                borderColor: '#633394', 
                color: '#633394',
                '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.04)' }
              }}
            >
              Previous
            </Button>

            {isLastSection ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!canProceedToNext()}
                startIcon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#388e3c' }
                }}
              >
                Submit Survey
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canProceedToNext()}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  backgroundColor: '#633394',
                  '&:hover': { backgroundColor: '#7c52a5' }
                }}
              >
                Next Section
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default SurveyTaking; 