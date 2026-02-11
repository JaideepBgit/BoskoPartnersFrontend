import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';

const SurveyOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get survey data from navigation state
  const survey = location.state?.survey;
  const surveyData = location.state?.surveyData;
  const autoOpenSection = location.state?.autoOpenSection;
  const startQuestionIndex = location.state?.startQuestionIndex || 0;

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

  const calculateSurveyStats = () => {
    if (!surveyData || !surveyData.questions) return { sectionCount: 0, questionCount: 0, estimatedTime: 0 };

    const sections = groupQuestionsBySection();
    const sectionCount = Object.keys(sections).length;
    const questionCount = surveyData.questions.length;
    const estimatedTime = Math.ceil(questionCount * 1.5);

    return { sectionCount, questionCount, estimatedTime };
  };

  const getTotalRequiredQuestions = () => {
    if (!surveyData || !surveyData.questions) return 0;
    return surveyData.questions.filter(q => q.is_required).length;
  };

  const handleContinue = () => {
    // Navigate to the actual survey taking page
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
  const stats = calculateSurveyStats();

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2
          }}
        >
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
            <Typography variant="body1" sx={{ mb: 2, color: '#333', lineHeight: 1.7, fontWeight: 500 }}>
              Welcome to Your Survey Experience!
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, color: '#555', lineHeight: 1.6 }}>
              Thank you for participating in this important research initiative. Your insights and experiences are valuable
              in helping us understand and improve our community services and programs.
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, color: '#555', lineHeight: 1.6 }}>
              <strong>What to expect:</strong> This survey is designed to gather meaningful data about your organization,
              community involvement, and experiences. Your responses will contribute to research that helps shape better
              policies and programs for communities like yours.
            </Typography>

            <Typography variant="body1" sx={{ color: '#633394', lineHeight: 1.6, fontWeight: 500 }}>
              <strong>How to proceed:</strong> Review the survey overview below, then click Continue to begin.
              You can save your progress at any time and return later.
            </Typography>
          </Box>

          {/* Section Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Survey Sections:
            </Typography>

            {Object.entries(sections).map(([sectionName, questions]) => (
              <Box
                key={sectionName}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                    {sectionName}
                  </Typography>
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
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  {questions.filter(q => q.is_required).length} required questions
                </Typography>
              </Box>
            ))}
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
