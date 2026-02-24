import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SurveyOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [responses, setResponses] = useState({});
  const [loadingResponses, setLoadingResponses] = useState(true);

  // Get survey data from navigation state
  const survey = location.state?.survey;
  const surveyData = location.state?.surveyData;
  const autoOpenSection = location.state?.autoOpenSection;
  const startQuestionIndex = location.state?.startQuestionIndex || 0;

  useEffect(() => {
    if (survey?.id) {
      fetchExistingResponses(survey.id);
    } else {
      setLoadingResponses(false);
    }
  }, [survey]);

  const fetchExistingResponses = async (assignmentId) => {
    try {
      const responseRes = await axios.get(`${API_BASE_URL}/responses/${assignmentId}`);
      const answers = responseRes.data?.answers || {};
      setResponses(answers);
    } catch (err) {
      console.log('No existing responses found');
      setResponses({});
    } finally {
      setLoadingResponses(false);
    }
  };

  if (!survey || !surveyData) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4 }}>
          <Typography variant="h6" color="error">
            No survey data found. Please return to the surveys page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/surveys')}
            sx={{ mt: 2, backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
          >
            Back to Surveys
          </Button>
        </Container>
      </>
    );
  }

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

  const handleContinue = () => {
    navigate('/survey/taking', {
      state: {
        survey: survey,
        surveyData: surveyData,
        autoOpenSection,
        startQuestionIndex
      }
    });
  };

  const sections = groupQuestionsBySection();

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
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

          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                color: '#633394',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              {survey.survey_code || surveyData.survey_code}
            </Typography>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 400 }}>
              {survey.organization_type} Survey
            </Typography>
          </Box>

          {/* Welcome Message */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 2, color: '#555', lineHeight: 1.6 }}>
              Thank you for participating in this important research initiative. Your insights and experiences are valuable
              in helping us understand and improve our community services and programs.
            </Typography>

            <Typography variant="body1" sx={{ color: '#633394', lineHeight: 1.6, fontWeight: 500 }}>
              Review the survey sections below, then click Continue to begin.
              You can save your progress at any time and return later.
            </Typography>
          </Box>

          {/* Section Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Survey Sections
            </Typography>

            {loadingResponses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#633394' }} />
              </Box>
            ) : (
              Object.entries(sections).map(([sectionName, questions]) => {
                const progress = getSectionProgress(questions);
                const isComplete = progress.percentage === 100;

                return (
                  <Box
                    key={sectionName}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: isComplete ? '2px solid #4caf50' : '1px solid #e0e0e0',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isComplete && (
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                        )}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                          {sectionName}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${questions.length} questions`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(99, 51, 148, 0.1)',
                          color: '#633394',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666', mt: 1, ml: isComplete ? 3.5 : 0 }}>
                      {questions.filter(q => q.is_required).length} required questions
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>

          {/* Continue Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
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
              Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default SurveyOverview;
