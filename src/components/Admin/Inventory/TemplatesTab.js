import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Stack
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TemplateUtils from './shared/TemplateUtils';

const TemplatesTab = () => {
  const [templateVersions, setTemplateVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplateVersions();
    fetchTemplates();
  }, []);

  const fetchTemplateVersions = async () => {
    const data = await TemplateUtils.fetchTemplateVersions();
    setTemplateVersions(data);
  };

  const fetchTemplates = async () => {
    const data = await TemplateUtils.fetchTemplates();
    setTemplates(data);
  };

  const fetchTemplate = async (id) => {
    const data = await TemplateUtils.fetchTemplate(id);
    setSelectedTemplate(data);
    
    // Update the templates array with the latest data to ensure question count is correct
    setTemplates(prevTemplates => 
      prevTemplates.map(template => 
        template.id === id ? { ...template, questions: data.questions } : template
      )
    );
  };

  const handleSelectTemplate = (templateId) => {
    fetchTemplate(templateId);
  };

  const handleSelectVersion = (version) => {
    setSelectedVersion(version);
    // Filter templates for this version
    const versionTemplates = templates.filter(t => t.version_id === version.id);
    if (versionTemplates.length > 0) {
      handleSelectTemplate(versionTemplates[0].id);
    } else {
      setSelectedTemplate(null);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>Templates</Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Version selection */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>Template Versions</Typography>
            <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              {templateVersions.map(version => (
                <ListItem 
                  key={version.id} 
                  button 
                  selected={selectedVersion?.id === version.id}
                  onClick={() => handleSelectVersion(version)}
                  sx={{ '&.Mui-selected': { backgroundColor: 'rgba(99, 51, 148, 0.1)' } }}
                >
                  <ListItemText 
                    primary={version.name} 
                    secondary={version.description || 'No description'} 
                  />
                </ListItem>
              ))}
              {templateVersions.length === 0 && (
                <Typography color="text.secondary" sx={{ py: 2 }}>No template versions available</Typography>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Right column - Template details */}
        <Grid item xs={12} md={9}>
          {selectedVersion ? (
            <>
              {/* Template selection */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                  Templates for {selectedVersion.name}
                </Typography>
                
                <Grid container spacing={2}>
                  {templates
                    .filter(t => t.version_id === selectedVersion.id)
                    .map(template => (
                      <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card 
                          sx={{ 
                            backgroundColor: selectedTemplate?.id === template.id ? 'rgba(99, 51, 148, 0.1)' : '#f5f5f5', 
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSelectTemplate(template.id)}
                        >
                          <CardContent>
                            <Typography variant="h6" noWrap sx={{ color: '#633394', fontWeight: 'bold' }}>{template.survey_code}</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Chip label={`${template.questions?.length || 0} Questions`} size="small" color="primary" variant="outlined" sx={{ borderColor: '#633394', color: '#633394' }} />
                              <Typography variant="caption">{new Date(template.created_at).toLocaleDateString()}</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
                
                {templates.filter(t => t.version_id === selectedVersion.id).length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>No templates available for this version.</Alert>
                )}
              </Paper>
              
              {/* Template details */}
              {selectedTemplate && (
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                  <Card sx={{ mb: 3, p: 2 }}>
                    <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
                      {selectedTemplate.survey_code} - Church/School Survey
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Please review the survey structure before beginning
                    </Typography>
                    
                    <Card sx={{ backgroundColor: '#e3f2fd', mb: 3, p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Survey Structure:</Typography>
                      
                      {/* Calculate survey statistics */}
                      {(() => {
                        const stats = TemplateUtils.calculateSurveyStats(selectedTemplate.questions);
                        
                        return (
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: 2,
                              mb: 2,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <ListAltIcon color="primary" fontSize="small"/>
                              <Typography variant="subtitle2">
                                <strong>{stats.sectionCount}</strong> Sections
                              </Typography>
                            </Stack>

                            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                            <Stack direction="row" spacing={1} alignItems="center">
                              <QuizIcon color="primary" fontSize="small"/>
                              <Typography variant="subtitle2">
                                <strong>{stats.questionCount}</strong> Questions
                              </Typography>
                            </Stack>

                            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                            <Stack direction="row" spacing={1} alignItems="center">
                              <AccessTimeIcon color="primary" fontSize="small"/>
                              <Typography variant="subtitle2">
                                <strong>{stats.estimatedTime}</strong> min
                              </Typography>
                            </Stack>
                          </Paper>
                        );
                      })()}
                    </Card>
                    
                    <Typography variant="h6" sx={{ mb: 2 }}>Section Details:</Typography>
                    
                    {/* Display section cards */}
                    {(() => {
                      const sections = TemplateUtils.groupQuestionsBySection(selectedTemplate.questions);
                      
                      return Object.entries(sections).map(([sectionId, questions]) => (
                        <Paper
                          key={sectionId}
                          elevation={1}
                          sx={{
                            mb: 2,
                            borderRadius: 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                            }
                          }}
                          onClick={() => {
                            // Handle section click - could navigate to edit section or expand to show questions
                            console.log(`Section ${sectionId} clicked`);
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            p: 2,
                            backgroundColor: '#f9f9f9',
                            borderBottom: '1px solid #eaeaea'
                          }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <AssignmentIcon color="primary" />
                              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Section {sectionId}
                              </Typography>
                            </Stack>
                            <Chip 
                              icon={<QuizIcon />}
                              label={`${questions.length} questions`}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                          <Box sx={{ 
                            p: 2, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white'
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              {questions.length === 1 ? '1 question' : `${questions.length} questions`} in this section
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'primary.main' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                View details
                              </Typography>
                              <ArrowForwardIcon fontSize="small" />
                            </Stack>
                          </Box>
                        </Paper>
                      ));
                    })()}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button 
                        variant="contained" 
                        sx={{ 
                          mr: 2,
                          backgroundColor: '#633394', 
                          '&:hover': { backgroundColor: '#7c52a5' }
                        }}
                      >
                        Save & Cont
                      </Button>
                      <Button 
                        variant="outlined" 
                        sx={{ 
                          borderColor: '#633394', 
                          color: '#633394',
                          '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.05)' }
                        }}
                      >
                        Save for Later
                      </Button>
                    </Box>
                  </Card>
                </Paper>
              )}
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h6" color="text.secondary">
                Select a template version from the left panel to view templates
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TemplatesTab;
