import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Paper, Tabs, Tab, Breadcrumbs,
  Link, Chip, CircularProgress, Alert, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Navbar from '../../shared/Navbar/Navbar';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';
import EditSurveyDrawer from './EditSurveyDrawer';
import DuplicateSurveyDialog from './DuplicateSurveyDialog';
import SurveyDetailResponses from './tabs/SurveyDetailResponses';
import SurveyDetailInvitations from './tabs/SurveyDetailInvitations';
import SurveyDetailQuestions from './tabs/SurveyDetailQuestions';
import SurveyDetailOrganizations from './tabs/SurveyDetailOrganizations';
import SurveyDetailSettings from './tabs/SurveyDetailSettings';

const colors = {
  primary: '#633394',
  secondary: '#967CB2',
  background: '#f5f5f5',
  cardBg: '#ffffff',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

const TAB_LABELS = ['Responses', 'Invitations', 'Questions', 'Organizations', 'Settings'];

const SurveyDetailPage = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Drawers / Dialogs
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const loadSurvey = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SurveysV2Service.getSurvey(surveyId);
      setSurvey(data);
    } catch (err) {
      console.error('Error loading survey:', err);
      setError('Failed to load survey details.');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  const kpis = [
    { label: 'Invitations', value: survey?.invitation_count || 0 },
    { label: 'Responses', value: survey?.response_count || 0 },
    {
      label: 'Completion Rate',
      value: survey?.invitation_count
        ? `${Math.round((survey.response_count || 0) / survey.invitation_count * 100)}%`
        : '0%'
    },
    { label: 'Reminders Sent', value: survey?.reminder_count || 0 },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: colors.background }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: colors.background }}>
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          <Button onClick={() => navigate('/surveys-v2')} sx={{ mt: 2, color: colors.primary }}>
            Back to Surveys
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3, minHeight: '100vh', backgroundColor: colors.background }}>
        {/* Top Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/surveys-v2')}
            sx={{ color: colors.primary, borderColor: '#e0e0e0', textTransform: 'none' }}
          >
            Surveys
          </Button>

          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.textPrimary, flex: 1, textAlign: 'center' }}>
            {survey?.name || survey?.survey_code || 'Survey'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => setDuplicateDialogOpen(true)}
              sx={{ textTransform: 'none', color: colors.primary, borderColor: '#e0e0e0' }}
            >
              Duplicate
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => navigate(`/surveys-v2/${surveyId}/invite`)}
              sx={{
                textTransform: 'none',
                backgroundColor: colors.primary,
                '&:hover': { backgroundColor: colors.secondary }
              }}
            >
              Invite
            </Button>
          </Box>
        </Box>

        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/surveys-v2')}>
            Surveys
          </Link>
          {survey?.organization_name && (
            <Typography color="text.secondary">{survey.organization_name}</Typography>
          )}
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            {survey?.name || survey?.survey_code}
          </Typography>
        </Breadcrumbs>

        {/* Survey Details + KPIs */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          {/* Survey Details Card */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, flex: '0 0 280px', position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.textPrimary }}>
                Survey Details
              </Typography>
              <Link
                component="button"
                variant="body2"
                onClick={() => setEditDrawerOpen(true)}
                sx={{ color: colors.primary, fontWeight: 600, cursor: 'pointer' }}
              >
                Edit
              </Link>
            </Box>
            <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2, minHeight: 40 }}>
              {survey?.description || 'No description provided.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>STARTS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {survey?.start_date ? new Date(survey.start_date.replace(' ', 'T')).toLocaleDateString('en-GB') : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>ENDS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {survey?.end_date ? new Date(survey.end_date.replace(' ', 'T')).toLocaleDateString('en-GB') : '-'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Survey Performance KPIs */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, flex: 1, minWidth: 300 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.textPrimary, mb: 2 }}>
              Survey Performance
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              {kpis.map((kpi) => (
                <Box key={kpi.label}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    {kpi.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.9rem' },
              '& .Mui-selected': { color: colors.primary, fontWeight: 600 },
              '& .MuiTabs-indicator': { backgroundColor: colors.primary },
            }}
          >
            {TAB_LABELS.map(label => <Tab key={label} label={label} />)}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Paper elevation={1} sx={{ borderRadius: 2, p: 3, minHeight: 400, backgroundColor: '#f3eef8' }}>
          {activeTab === 0 && <SurveyDetailResponses surveyId={surveyId} />}
          {activeTab === 1 && <SurveyDetailInvitations surveyId={surveyId} />}
          {activeTab === 2 && <SurveyDetailQuestions surveyId={surveyId} survey={survey} onRefresh={loadSurvey} />}
          {activeTab === 3 && <SurveyDetailOrganizations surveyId={surveyId} survey={survey} onRefresh={loadSurvey} />}
          {activeTab === 4 && <SurveyDetailSettings surveyId={surveyId} survey={survey} />}
        </Paper>
      </Container>

      {/* Edit Survey Drawer */}
      <EditSurveyDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        survey={survey}
        onSaved={() => { setEditDrawerOpen(false); loadSurvey(); }}
      />

      {/* Duplicate Survey Dialog */}
      <DuplicateSurveyDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        survey={survey}
      />
    </>
  );
};

export default SurveyDetailPage;
