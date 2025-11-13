import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import Navbar from '../../shared/Navbar/Navbar';
import BackendDataService from '../../../services/Admin/Reports/BackendDataService';
import SurveyDataAnalyzer from '../../../services/Admin/Reports/SurveyDataAnalyzer';
import FlexibleBarChart from './Charts/FlexibleBarChart';
import FlexibleTextDisplay from './Charts/FlexibleTextDisplay';
import FlexibleSummaryCard from './Charts/FlexibleSummaryCard';

/**
 * Example component showing how to use the flexible reporting system
 * This works with ANY survey structure - numeric, text, or mixed
 */
const FlexibleReportsExample = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyData, setSurveyData] = useState({});
  const [selectedSurveyType, setSelectedSurveyType] = useState('church');
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await BackendDataService.loadSurveyResponses();
      console.log('Loaded survey data:', data);
      
      setSurveyData(data);
      
      // Set default selected response
      if (data[selectedSurveyType] && data[selectedSurveyType].length > 0) {
        setSelectedResponseId(String(data[selectedSurveyType][0].id));
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load survey data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyTypeChange = (event) => {
    const newType = event.target.value;
    setSelectedSurveyType(newType);
    
    // Reset selected response for new survey type
    if (surveyData[newType] && surveyData[newType].length > 0) {
      setSelectedResponseId(String(surveyData[newType][0].id));
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading survey data...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Flexible Survey Reports
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  const availableResponses = surveyData[selectedSurveyType] || [];
  const selectedResponse = availableResponses.find(r => String(r.id) === String(selectedResponseId));
  const comparisonResponses = availableResponses.filter(r => String(r.id) !== String(selectedResponseId));

  return (
    <Box>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Flexible Survey Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Automatically analyzes any survey structure - numeric, text, or mixed data types
          </Typography>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>How it works:</strong>
          </Typography>
          <Typography variant="body2">
            This reporting system automatically detects numeric fields, text responses, and structured data in your surveys.
            It doesn't require predefined field names - it adapts to whatever data structure your surveys use.
          </Typography>
        </Alert>

        {/* Control Panel */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Survey Type</InputLabel>
                  <Select
                    value={selectedSurveyType}
                    label="Survey Type"
                    onChange={handleSurveyTypeChange}
                  >
                    <MenuItem value="church">Church Survey</MenuItem>
                    <MenuItem value="institution">Institution Survey</MenuItem>
                    <MenuItem value="nonFormal">Non-Formal Survey</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel>Select Response to Analyze</InputLabel>
                  <Select
                    value={selectedResponseId || ''}
                    label="Select Response to Analyze"
                    onChange={(e) => setSelectedResponseId(String(e.target.value))}
                  >
                    {availableResponses.map((response) => (
                      <MenuItem key={response.id} value={String(response.id)}>
                        Response {response.id} - {response.organization_name || 'Unknown'} 
                        {response.city && ` (${response.city}, ${response.country})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Numeric Analysis" />
            <Tab label="Text Responses" />
            <Tab label="Raw Data" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {selectedResponse && (
          <>
            {/* Overview Tab */}
            {currentTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FlexibleSummaryCard
                    targetResponse={selectedResponse}
                    comparisonResponses={comparisonResponses}
                    showComparison={true}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FlexibleBarChart
                    title="Numeric Fields Comparison"
                    targetResponse={selectedResponse}
                    comparisonResponses={comparisonResponses}
                    showComparison={true}
                    height={500}
                  />
                </Grid>
              </Grid>
            )}

            {/* Numeric Analysis Tab */}
            {currentTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FlexibleBarChart
                    title="All Numeric Fields"
                    targetResponse={selectedResponse}
                    comparisonResponses={comparisonResponses}
                    showComparison={true}
                    height={600}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Numeric Data Summary
                      </Typography>
                      {(() => {
                        const analysis = SurveyDataAnalyzer.analyzeSurveyResponse(selectedResponse);
                        const groupAnalysis = SurveyDataAnalyzer.analyzeMultipleResponses(comparisonResponses);
                        
                        return (
                          <Box>
                            <Typography variant="body2" paragraph>
                              <strong>Your Response:</strong> {analysis.metadata.numericCount} numeric fields detected
                            </Typography>
                            <Typography variant="body2" paragraph>
                              <strong>Group Average:</strong> Based on {comparisonResponses.length} similar responses
                            </Typography>
                            <Typography variant="body2">
                              <strong>Common Fields:</strong> {groupAnalysis.commonFields.length} fields appear in at least 50% of responses
                            </Typography>
                          </Box>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Text Responses Tab */}
            {currentTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FlexibleTextDisplay
                    title="Text and Qualitative Responses"
                    targetResponse={selectedResponse}
                    showAllFields={false}
                    minTextLength={20}
                  />
                </Grid>
              </Grid>
            )}

            {/* Raw Data Tab */}
            {currentTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Raw Survey Data
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: '#f5f5f5', 
                        p: 2, 
                        borderRadius: 1,
                        maxHeight: 600,
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                          {JSON.stringify(selectedResponse, null, 2)}
                        </pre>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}

        {/* No Data Message */}
        {!selectedResponse && (
          <Alert severity="warning">
            No survey response selected. Please select a response from the dropdown above.
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default FlexibleReportsExample;
