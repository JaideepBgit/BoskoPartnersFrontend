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
  useMediaQuery,
  useTheme,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import { getUserDetailsStatus } from '../../services/UserDetails/UserDetailsService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import axios from 'axios';

const HomeComponent = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user details (for first name) and survey assignments in parallel
        const [detailsRes, assignmentsRes] = await Promise.all([
          getUserDetailsStatus(userId).catch(() => null),
          axios.get(`/api/users/${userId}/survey-assignments`).catch(() => ({ data: {} }))
        ]);

        if (detailsRes) setUserDetails(detailsRes);

        const assignmentList = Array.isArray(assignmentsRes.data?.assignments)
          ? assignmentsRes.data.assignments
          : [];
        setAssignments(assignmentList);

        await loadProgressForAssignments(assignmentList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your surveys. Please try again later.');
        setLoading(false);
      }
    };

    if (userId > 0) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleOpenSurvey = (assignment) => {
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
  };

  const isCompleted = (assignmentId) => {
    return (progressMap[assignmentId] ?? 0) === 100;
  };

  const getAssignmentTitle = (a) => {
    return a.survey_code || 'Survey';
  };

  // Get first name from user details form data
  const getFirstName = () => {
    if (userDetails?.form_data?.personal?.firstName) {
      return userDetails.form_data.personal.firstName;
    }
    // Fallback to user object from localStorage
    if (user.firstname) return user.firstname;
    if (user.firstName) return user.firstName;
    if (user.first_name) return user.first_name;
    return null;
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

  const firstName = getFirstName();

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 2 : 4, px: isMobile ? 2 : 3 }}>
        {/* Personalized Header */}
        <Box sx={{ mb: isMobile ? 3 : 4 }}>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}
          >
            {firstName ? `Hi ${firstName}` : 'Hi there'}
          </Typography>
          <Typography
            variant={isMobile ? "body1" : "h6"}
            sx={{ color: 'text.secondary', fontWeight: 400 }}
          >
            Here are your available surveys.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Survey List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {assignments.length > 0 ? (
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
                <CardContent sx={{ p: isMobile ? 2 : 4 }}>
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
            /* Empty state - no surveys available */
            <Card sx={{
              textAlign: 'center',
              p: isMobile ? 3 : 5,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: 2
            }}>
              <CardContent>
                <HourglassEmptyIcon sx={{ fontSize: 48, color: '#999', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                  You don't have access to any surveys yet.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We've sent your request to join for approval.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </>
  );
};

const UserDashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  if (!userRole) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Typography variant="h6">Loading...</Typography>
        </Container>
      </>
    );
  }

  return <HomeComponent />;
};

export default UserDashboard;
