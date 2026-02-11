import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);

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

      if (survey && survey.template_id) {
        const response = await fetch(`${API_BASE_URL}/templates/${survey.template_id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
        }

        const templateData = await response.json();
        setSurveyData(templateData);

        // Fetch existing responses
        await fetchExistingResponses(survey.id);
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

  const fetchExistingResponses = async (assignmentId) => {
    try {
      const responseRes = await axios.get(`${API_BASE_URL}/responses/${assignmentId}`);
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

  const calculateEstimatedTime = () => {
    if (!surveyData || !surveyData.questions) return 0;
    const questionCount = surveyData.questions.length;
    return Math.ceil(questionCount * 1.5); // 1.5 minutes per question
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
            borderRadius: 3
          }}
        >
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

          {/* Survey Sections */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Survey Sections:
            </Typography>

            <Grid container spacing={1.5}>
              {Object.entries(sections).map(([sectionName, questions]) => {
                const progress = getSectionProgress(questions);
                const isCompleted = progress.percentage === 100;

                return (
                  <Grid item xs={6} sm={4} md={3} key={sectionName}>
                    <Card
                      sx={{
                        height: '100%',
                        border: isCompleted ? '1.5px solid #4caf50' : '1px solid #e0e0e0',
                        backgroundColor: isCompleted ? '#f8fff8' : '#fff',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#333', fontSize: '0.75rem', lineHeight: 1.2 }}>
                            {sectionName}
                          </Typography>
                          {isCompleted && (
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
                          )}
                        </Box>

                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                          {questions.length} questions
                        </Typography>

                        <Chip
                          label={`${progress.percentage}%`}
                          size="small"
                          sx={{
                            height: '18px',
                            fontSize: '0.65rem',
                            backgroundColor: isCompleted ? '#4caf50' : '#633394',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
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
