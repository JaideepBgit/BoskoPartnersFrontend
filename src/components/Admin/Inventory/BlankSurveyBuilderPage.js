import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InternalHeader from '../../shared/Headers/InternalHeader';
import CreateQuestionnaireWizard from './CreateQuestionnaireWizard';

function BlankSurveyBuilderPage() {
  const navigate = useNavigate();

  return (
    <>
      <InternalHeader
        title="Blank Survey"
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inventory')}
          >
            Surveys
          </Button>
        }
      />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <CreateQuestionnaireWizard
            variant="page"
            mode="blank"
            onClose={() => navigate('/inventory')}
            onComplete={() => navigate('/inventory')}
          />
        </Box>
      </Container>
    </>
  );
}

export default BlankSurveyBuilderPage;

