import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const SurveysPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // { [assignmentId]: number }
  const navigate = useNavigate();

  // Get user data from localStorage
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const surveyCode = localStorage.getItem('surveyCode');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/survey-assignments`);
      const data = response.data || {};
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      // Compute progress for each assignment
      await loadProgressForAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching survey assignments:', err);
      setError('Failed to load your surveys. Please try again later.');
      setLoading(false);
    }
  };

  const loadProgressForAssignments = async (list) => {
    if (!Array.isArray(list) || list.length === 0) {
      setProgressMap({});
      return;
    }
    try {
      const results = await Promise.all(
        list.map(async (a) => {
          try {
            const [templateRes, responseRes] = await Promise.all([
              axios.get(`/api/templates/${a.template_id}`),
              axios.get(`/api/responses/${a.id}`)
            ]);
            const questions = templateRes.data?.questions || [];
            const answers = responseRes.data?.answers || {};
            const total = Array.isArray(questions) ? questions.length : 0;
            const answered = answers && typeof answers === 'object' ? Object.keys(answers).length : 0;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            return { id: a.id, pct };
          } catch (inner) {
            console.warn('Failed to compute progress for assignment', a.id, inner);
            return { id: a.id, pct: 0 };
          }
        })
      );
      const map = results.reduce((acc, r) => { acc[r.id] = r.pct; return acc; }, {});
      setProgressMap(map);
    } catch (e) {
      console.error('Error loading progress for assignments:', e);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAssignments();
    } else {
      setError('User not logged in.');
      setLoading(false);
    }
  }, [userId]);

  const handleOpenSurvey = async (assignment) => {
    try {
      // Navigate to survey intro page (first screen)
      navigate('/survey/intro', {
        state: {
          survey: {
            id: assignment.id,
            template_id: assignment.template_id,
            survey_code: assignment.survey_code,
            template_name: assignment.template_name,
            organization_type: assignment.organization_type || 'Survey',
            user_id: userId,
            username: user.username,
            email: user.email,
            organization_id: user.organization_id,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Error opening survey:', error);
      setError('Failed to open survey. Please try again.');
    }
  };

  const handleInitializeSurveyData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/initialize-survey-data');

      if (response.status === 200 || response.status === 201) {
        // Refresh assignments after initialization
        await fetchAssignments();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing survey data:', error);
      setError('Failed to initialize survey data. Please try again.');
      setLoading(false);
    }
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  // Check if survey is completed (100%)
  const isCompleted = (assignmentId) => {
    return (progressMap[assignmentId] ?? 0) === 100;
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

  // Format the survey name and organization type from backend data
  const getAssignmentTitle = (a) => {
    const name = a.survey_code; //a.template_name || 'Survey';
    const code = a.survey_code ? ` - ${a.survey_code}` : '';
    return `${name}`;
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            color: '#212121',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          My Surveys
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {assignments && assignments.length > 0 ? (
            assignments.map((a) => (
              <Card
                key={a.id}
                onClick={() => handleOpenSurvey(a)}
                sx={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      gutterBottom
                      sx={{
                        color: '#333',
                        fontWeight: 600,
                        mb: 1,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'normal',
                        maxWidth: '100%'
                      }}
                    >
                      {getAssignmentTitle(a)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Status: ${a.status || 'pending'}`}
                        size="small"
                        sx={{
                          backgroundColor: '#f3e5f5',
                          color: '#633394',
                          fontWeight: 500
                        }}
                      />
                      <Chip
                        label={`Progress: ${progressMap[a.id] ?? 0}%`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#633394',
                          color: '#633394'
                        }}
                      />
                      <Chip
                        label={`Assigned: ${a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#633394',
                          color: '#633394'
                        }}
                      />
                      {isCompleted(a.id) && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ color: '#4caf50 !important', fontSize: 16 }} />}
                          label="Complete"
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#4caf50',
                            color: '#4caf50',
                            fontWeight: 500
                          }}
                        />
                      )}
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Completion
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {progressMap[a.id] ?? 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progressMap[a.id] ?? 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: isCompleted(a.id) ? '#4caf50' : '#633394'
                          }
                        }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      onClick={(e) => { e.stopPropagation(); handleOpenSurvey(a); }}
                      sx={{
                        backgroundColor: '#633394',
                        '&:hover': { backgroundColor: '#7c52a5' },
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                    >
                      {a.status === 'in_progress' ? 'Resume Survey' : a.status === 'completed' ? 'View Survey' : 'Start Survey'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card sx={{ textAlign: 'center', p: 4 }}>
              <CardContent>
                <Box sx={{ fontSize: '4rem', mb: 2 }}></Box>
                <Typography variant="h6" gutterBottom>
                  No Surveys Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You don't have any surveys assigned at the moment. Please contact your administrator if you believe this is an error.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleInitializeSurveyData}
                  disabled={loading}
                  sx={{
                    borderColor: '#633394',
                    color: '#633394',
                    '&:hover': {
                      borderColor: '#7c52a5',
                      backgroundColor: '#f3e5f5'
                    }
                  }}
                >
                  Initialize Sample Survey Data
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </>
  );
};

export default SurveysPage; 