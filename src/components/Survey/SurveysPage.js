import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid,
  CircularProgress,
  Container,
  Chip,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuizIcon from '@mui/icons-material/Quiz';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

const SurveyCard = ({ template, onStartSurvey }) => {
  const questionCount = template.questions?.length || 0;
  const sectionCount = template.sections?.length || 0;
  const organizationType = template.version?.organization?.organization_type?.type || 'Unknown Type';
  
  return (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        '&:hover': {
          boxShadow: 6,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
          {template.version?.name || 'Survey Template'}
        </Typography>
        
        <Chip 
          label={organizationType}
          size="small"
          sx={{ 
            backgroundColor: '#f0e6ff',
            color: '#633394',
            mb: 2 
          }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <QuizIcon sx={{ mr: 1, fontSize: 20, color: '#633394' }} />
              {questionCount} Questions
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ViewModuleIcon sx={{ mr: 1, fontSize: 20, color: '#633394' }} />
              {sectionCount} Sections
            </Box>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 'auto' }}>
          <Button 
            variant="contained"
            onClick={() => onStartSurvey(template)}
            fullWidth
            sx={{
              backgroundColor: '#633394',
              '&:hover': {
                backgroundColor: '#7c52a5',
              },
            }}
          >
            Start Survey
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const SurveysPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // First get all template versions
        const versionsResponse = await axios.get('/api/template-versions');
        const versions = versionsResponse.data;

        // Then get templates for each version
        const templatesPromises = versions.map(version =>
          axios.get(`/api/templates?version_id=${version.id}`)
        );
        
        const templatesResponses = await Promise.all(templatesPromises);
        
        // Combine the data
        const combinedTemplates = templatesResponses.flatMap((response, index) => {
          return response.data.map(template => ({
            ...template,
            version: versions[index]
          }));
        });

        setTemplates(combinedTemplates);
        setLoading(false);
      } catch (err) {
        setError('Failed to load survey templates. Please try again later.');
        setLoading(false);
        console.error('Error fetching templates:', err);
      }
    };

    fetchTemplates();
  }, []);

  const handleStartSurvey = async (template) => {
    try {
      // Create a new survey response
      const response = await axios.post(`/api/templates/${template.id}/responses`, {
        user_id: localStorage.getItem('userId'), // Assuming you store user ID in localStorage
        answers: {},
        status: 'pending'
      });

      // Navigate to the survey taking page with the response ID
      navigate(`/survey/${response.data.id}`);
    } catch (error) {
      console.error('Error starting survey:', error);
      // Handle error appropriately
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress sx={{ color: '#633394' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          color: '#633394',
          mb: 4,
          fontWeight: 'bold'
        }}
      >
        Available Surveys
      </Typography>
      
      {templates.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          No survey templates available at the moment.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <SurveyCard 
                template={template} 
                onStartSurvey={handleStartSurvey}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default SurveysPage; 