import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SurveyIntro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyData, setSurveyData] = useState(null);
  const [responses, setResponses] = useState({});

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

  const fetchSurveyData = async () => {
    try {
      setLoading(true);

      if (survey && survey.survey_id) {
        // V2 survey flow (from QR code / share link join)
        const response = await fetch(`${API_BASE_URL}/v2/surveys/${survey.survey_id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch survey: ${response.status} ${response.statusText}`);
        }

        const v2Data = await response.json();
        setSurveyData(v2Data);

        // Fetch existing V2 responses
        await fetchExistingResponses(survey.id, true);
      } else if (survey && survey.template_id) {
        // Legacy template flow
        const response = await fetch(`${API_BASE_URL}/templates/${survey.template_id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
        }

        const templateData = await response.json();
        setSurveyData(templateData);

        // Fetch existing responses
        await fetchExistingResponses(survey.id, false);
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

  const fetchExistingResponses = async (assignmentId, isV2 = false) => {
    try {
      const url = isV2
        ? `${API_BASE_URL}/v2/responses/${assignmentId}`
        : `${API_BASE_URL}/responses/${assignmentId}`;
      const responseRes = await axios.get(url);
      const answers = responseRes.data?.answers || {};
      setResponses(answers);
    } catch (err) {
      console.log('No existing responses found');
      setResponses({});
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
      questionsBySection[sectionName].sort((a, b) => a.order - b.order);
      orderedSections[sectionName] = questionsBySection[sectionName];
    });

    return orderedSections;
  };

  const getSectionProgress = (questions) => {
    const answered = questions.filter(q => responses[q.id]).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percentage };
  };

  const handleGetStarted = () => {
    // Find the first incomplete section or the first section
    const sectionsArray = Object.entries(sections);
    
    let targetSection = null;
    let targetQuestionIndex = 0;

    // Try to find where user left off
    for (const [sectionName, questions] of sectionsArray) {
      const progress = getSectionProgress(questions);
      
      if (progress.percentage < 100) {
        // Found an incomplete section
        targetSection = { name: sectionName, questions };
        
        // Find the first unanswered question in this section
        const unansweredIndex = questions.findIndex(q => !responses[q.id]);
        targetQuestionIndex = unansweredIndex >= 0 ? unansweredIndex : 0;
        
        break;
      }
    }

    // If all sections are complete or no sections exist, use first section
    if (!targetSection && sectionsArray.length > 0) {
      const [firstSectionName, firstQuestions] = sectionsArray[0];
      targetSection = { name: firstSectionName, questions: firstQuestions };
      targetQuestionIndex = 0;
    }

    // Navigate to survey overview page (second screen), carrying resume info
    navigate('/survey/overview', {
      state: {
        survey: survey,
        surveyData: surveyData,
        autoOpenSection: targetSection,
        startQuestionIndex: targetQuestionIndex
      }
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#633394' }} />
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

  return (
    <>
      <Navbar />
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: 4, 
          mb: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => navigate('/surveys')}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: '#999',
              '&:hover': { color: '#333', backgroundColor: '#f0f0f0' }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Survey Icon */}
            <Box sx={{ mb: 2 }}>
              <AssignmentIcon sx={{ fontSize: '3rem', color: '#633394' }} />
            </Box>

            {/* Survey Title */}
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                color: '#333',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              {survey?.survey_code || surveyData?.survey_code || 'Survey'}
            </Typography>

            {/* Who it's from */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <PersonIcon sx={{ color: '#633394', mr: 1 }} />
              <Typography variant="h6" sx={{ color: '#666' }}>
                From: {survey?.organization_type || 'Research Team'}
              </Typography>
            </Box>
          </Box>

          {/* Info Section */}
          <Box sx={{ mb: 4 }}>
            <Box 
              sx={{ 
                p: 3, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <InfoIcon sx={{ color: '#633394', mr: 1.5, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                    Why This Survey Matters
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.6 }}>
                    Your insights help us understand and improve community services and programs. 
                    This research contributes to better policies and support for communities like yours.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Get Started Button */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                backgroundColor: '#633394',
                color: 'white',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#7c52a5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(99, 51, 148, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Get Started
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default SurveyIntro;
