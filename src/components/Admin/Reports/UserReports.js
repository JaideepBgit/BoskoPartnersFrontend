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
  Button,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import Navbar from '../../shared/Navbar/Navbar';
import SampleDataService from '../../../services/Admin/Reports/SampleDataService';
import BackendDataService from '../../../services/Admin/Reports/BackendDataService';
import SimpleBarChart from './Charts/SimpleBarChart';
import GeographicChart from './Charts/GeographicChart';
import ComparisonCard from './Charts/ComparisonCard';
import ChartSelectorCard from './Charts/ChartSelectorCard';
import CustomChart from './Charts/CustomChart';
import ChartEditDialog from './Charts/ChartEditDialog';
import SurveyMapCard from './Charts/SurveyMapCard';
import QualitativeAnalysis from './Charts/QualitativeAnalysis';

const UserReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyData, setSurveyData] = useState({});
  const [selectedSurveyType, setSelectedSurveyType] = useState('church');
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    education_level: '',
    age_group: ''
  });
  const [customCharts, setCustomCharts] = useState([]);
  const [chartBuilderExpanded, setChartBuilderExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [isTestMode, setIsTestMode] = useState(true); // Default to test mode
  const [dataSource, setDataSource] = useState('sample'); // 'sample' or 'backend'
  const [selectedMapSurveys, setSelectedMapSurveys] = useState([]);
  const [selectedMapArea, setSelectedMapArea] = useState([]);

  // Helper functions for robust type comparison
  const normType = (t) => (t || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  const isSameType = (s) => normType(s.survey_type || s.surveyType) === normType(selectedSurveyType);

  // Load data on component mount and when mode changes
  useEffect(() => {
    loadData();
  }, [dataSource]);

  // Handle mode change
  useEffect(() => {
    setDataSource(isTestMode ? 'sample' : 'backend');
  }, [isTestMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      let data;
      
      if (dataSource === 'sample') {
        data = await SampleDataService.loadSampleData();
      } else {
        data = await BackendDataService.loadSurveyResponses();
      }
      
      setSurveyData(data);
      
      // Set default selected response
      if (data[selectedSurveyType] && data[selectedSurveyType].length > 0) {
        setSelectedResponseId(String(data[selectedSurveyType][0].id));
      } else {
        setSelectedResponseId(null);
      }
      
    } catch (err) {
      const errorMessage = dataSource === 'sample' 
        ? 'Failed to load sample data. Please check the console for details.'
        : 'Failed to load data from backend. Please check your connection and try again.';
      setError(errorMessage);
      console.error(`Error loading ${dataSource} data:`, err);
      
      // Keep existing data if switching modes fails
      // This prevents complete data loss on mode switch errors
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = (event) => {
    setIsTestMode(event.target.checked);
    // Clear any existing data and reset selections
    setSurveyData({});
    setSelectedResponseId(null);
    setComparisonData(null);
    setCustomCharts([]);
  };

  // Update comparison data when survey type or selected response changes
  useEffect(() => {
    if (surveyData[selectedSurveyType] && selectedResponseId) {
      generateComparisonData();
    }
  }, [surveyData, selectedSurveyType, selectedResponseId]);

  // Regenerate graphs when selected surveys change
  useEffect(() => {
    console.log('🔄 Selected surveys changed:', selectedMapSurveys.length);
    if (surveyData[selectedSurveyType] && selectedResponseId) {
      console.log('🔄 Triggering graph regeneration...');
      generateComparisonData();
    } else {
      console.log('🔄 Not regenerating - missing surveyData or selectedResponseId');
      console.log('🔄 surveyData[selectedSurveyType]:', !!surveyData[selectedSurveyType]);
      console.log('🔄 selectedResponseId:', selectedResponseId);
    }
  }, [selectedMapSurveys, surveyData, selectedSurveyType, selectedResponseId]);

  const generateComparisonData = () => {
    try {
      // Use selected surveys if available, otherwise use all responses
      let responses = surveyData[selectedSurveyType];
      console.log('📊 Starting generateComparisonData');
      console.log('📊 Original responses count:', responses?.length || 0);
      console.log('📊 Selected surveys count:', selectedMapSurveys.length);
      console.log('📊 Current survey type:', selectedSurveyType);
      
      // If surveys are selected from the map, use those plus ensure target is included
      if (selectedMapSurveys.length > 0) {
        const filteredSelected = selectedMapSurveys.filter(isSameType);
        console.log('📊 Filtered selected surveys:', filteredSelected.length);
        console.log('📊 Survey types in selection:', selectedMapSurveys.map(s => s.survey_type || s.surveyType));
        
        // Always ensure the target response is included in the comparison set
        const originalTarget = surveyData[selectedSurveyType]?.find(r => String(r.id) === String(selectedResponseId));
        if (originalTarget && !filteredSelected.find(r => String(r.id) === String(selectedResponseId))) {
          console.log('📊 Adding target survey to selected surveys for comparison');
          responses = [originalTarget, ...filteredSelected];
        } else {
          responses = filteredSelected;
        }
        console.log('📊 Final response set size:', responses.length);
      }
      
      const targetResponse = responses.find(r => String(r.id) === String(selectedResponseId));
      console.log('📊 Target response found:', !!targetResponse);
      console.log('📊 Looking for response ID:', selectedResponseId);
      if (responses?.length > 0) {
        console.log('📊 Available response IDs:', responses.map(r => r.id));
      }
      
      if (targetResponse) {
        let comparison;
        
        if (selectedMapSurveys.length > 0) {
          // Use only selected surveys for comparison
          console.log('📊 Using selected surveys for comparison');
          comparison = SampleDataService.compareWithSimilar(
            targetResponse, 
            selectedSurveyType,
            responses // Pass filtered responses for comparison
          );
        } else {
          // Use all responses as before
          console.log('📊 Using all responses for comparison');
          comparison = SampleDataService.compareWithSimilar(
            targetResponse, 
            selectedSurveyType
          );
        }
        
        const stats = SampleDataService.calculateComparisonStats(
          comparison.targetScores,
          comparison.averages
        );
        
        console.log('📊 Setting new comparison data');
        setComparisonData({
          ...comparison,
          stats
        });
      } else {
        console.log('📊 No target response found - trying to auto-select from filtered responses');
        // If the current selected response is not in the filtered set, try to select the first available one
        if (responses && responses.length > 0) {
          const newSelectedResponseId = String(responses[0].id);
          console.log('📊 Auto-selecting first response:', newSelectedResponseId);
          setSelectedResponseId(newSelectedResponseId);
          // The effect will trigger again with the new selectedResponseId
        } else {
          console.log('📊 No responses available - clearing comparison data');
          setComparisonData(null);
        }
      }
    } catch (err) {
      console.error('Error generating comparison data:', err);
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

  const getFilteredResponses = () => {
    if (!surveyData[selectedSurveyType]) return [];
    
    // Start with all responses or selected surveys
    let baseResponses = surveyData[selectedSurveyType];
    
    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      baseResponses = selectedMapSurveys.filter(isSameType);
    }
    
    if (dataSource === 'sample') {
      // Apply filters to the base responses
      return SampleDataService.filterResponsesWithBase(baseResponses, filters);
    } else {
      return BackendDataService.filterResponses(baseResponses, filters);
    }
  };

  const getGeographicData = () => {
    if (!surveyData[selectedSurveyType]) return {};
    
    // Use selected surveys if available, otherwise use all responses
    let responses = surveyData[selectedSurveyType];
    
    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      responses = selectedMapSurveys.filter(isSameType);
    }
    
    if (dataSource === 'sample') {
      return SampleDataService.getGeographicDistributionWithBase(responses);
    } else {
      return BackendDataService.getGeographicDistribution(responses);
    }
  };

  const getUniqueValues = (fieldName) => {
    if (!surveyData[selectedSurveyType]) return [];
    
    // Use selected surveys if available, otherwise use all responses
    let responses = surveyData[selectedSurveyType];
    
    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      responses = selectedMapSurveys.filter(isSameType);
    }
    
    if (dataSource === 'sample') {
      return SampleDataService.getUniqueValuesWithBase(responses, fieldName);
    } else {
      return BackendDataService.getUniqueValues(responses, fieldName);
    }
  };

  const handleCreateCustomChart = (chartConfig) => {
    const newChart = {
      ...chartConfig,
      id: Date.now() + Math.random(), // Ensure unique ID
      surveyType: selectedSurveyType
    };
    setCustomCharts(prev => [...prev, newChart]);
    setChartBuilderExpanded(false); // Collapse after creating
  };

  const handleRemoveCustomChart = (chartId) => {
    setCustomCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const handleEditChart = (chartConfig) => {
    setEditingChart(chartConfig);
    setEditDialogOpen(true);
  };

  const handleUpdateChart = (updatedChart) => {
    setCustomCharts(prev => 
      prev.map(chart => 
        chart.id === updatedChart.id ? updatedChart : chart
      )
    );
    setEditDialogOpen(false);
    setEditingChart(null);
  };

  const handleDuplicateChart = (chartConfig) => {
    setCustomCharts(prev => [...prev, chartConfig]);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingChart(null);
  };

  const handleMapSurveySelection = (surveys) => {
    console.log('🔍 Survey selection received:', surveys);
    console.log('🔍 Number of surveys:', surveys.length);
    if (surveys.length > 0) {
      console.log('🔍 First survey structure:', surveys[0]);
      console.log('🔍 Survey types found:', surveys.map(s => s.survey_type || s.surveyType));
    }
    setSelectedMapSurveys(surveys);
  };

  const handleMapAreaSelection = (markersInArea) => {
    setSelectedMapArea(markersInArea);
    const surveysInArea = markersInArea.map(marker => marker.surveyData);
    console.log('🌍 Area selection - surveys in area:', surveysInArea.length);
    
    // Treat area selection the same as survey selection for graph regeneration
    setSelectedMapSurveys(surveysInArea);
    console.log('🌍 Updated selectedMapSurveys from area selection');
  };

  // Admin colors for consistent styling
  const adminColors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    text: '#212121',
    headerBg: '#ede7f6',
    borderColor: '#e0e0e0',
    highlightBg: '#f3e5f5'
  };

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading sample data...
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                User Reports - Survey Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Compare individual survey responses with group averages and analyze trends.
              </Typography>
            </Box>
            
            {/* Data Mode Toggle - Always Visible */}
            <Card sx={{ p: 2, minWidth: 200 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Data Source
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTestMode}
                      onChange={handleModeToggle}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {isTestMode ? 'Test Mode' : 'Normal Mode'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isTestMode ? 'Using sample data' : 'Using backend data'}
                      </Typography>
                    </Box>
                  }
                  labelPlacement="bottom"
                />
              </Box>
            </Card>
          </Box>

          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Failed to load data
            </Typography>
            <Typography variant="body2" paragraph>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isTestMode 
                ? "Try switching to Normal Mode or check if sample data files are available."
                : "Try switching to Test Mode to use sample data, or check your backend connection."
              }
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={loadData}>
              Retry Loading Data
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setIsTestMode(!isTestMode)}
            >
              Switch to {isTestMode ? 'Normal' : 'Test'} Mode
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  const filteredResponses = getFilteredResponses();
  const geographicData = getGeographicData();
  const availableResponses = surveyData[selectedSurveyType] || [];

  return (
    <Box>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              User Reports - Survey Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compare individual survey responses with group averages and analyze trends.
            </Typography>
          </Box>
          
          {/* Data Mode Toggle */}
          <Card sx={{ p: 2, minWidth: 200 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                Data Source
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTestMode}
                    onChange={handleModeToggle}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {isTestMode ? 'Test Mode' : 'Normal Mode'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isTestMode ? 'Using sample data' : 'Using backend data'}
                    </Typography>
                  </Box>
                }
                labelPlacement="bottom"
              />
            </Box>
          </Card>
        </Box>

        {/* Non-blocking Error Alert */}
        {error && Object.keys(surveyData).length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Data Loading Issue
            </Typography>
            <Typography variant="body2" paragraph>
              {error}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button size="small" variant="outlined" onClick={loadData}>
                Retry
              </Button>
              <Button 
                size="small" 
                variant="text" 
                onClick={() => setIsTestMode(!isTestMode)}
              >
                Switch to {isTestMode ? 'Normal' : 'Test'} Mode
              </Button>
            </Box>
          </Alert>
        )}

        {/* Control Panel */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {/* Data Source Status */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`Data Source: ${isTestMode ? 'Sample Data' : 'Backend API'}`}
                color={isTestMode ? 'warning' : 'success'}
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${availableResponses.length} ${selectedSurveyType} responses`}
                color="info"
                size="small"
              />
              {selectedMapSurveys.length > 0 && (
                <Chip 
                  label={`Using ${selectedMapSurveys.filter(isSameType).length} of ${selectedMapSurveys.length} selected surveys`}
                  color="warning"
                  size="small"
                  variant="outlined"
                  onDelete={() => setSelectedMapSurveys([])}
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
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
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Select Response to Analyze</InputLabel>
                  <Select
                    value={selectedResponseId || ''}
                    label="Select Response to Analyze"
                    onChange={(e) => setSelectedResponseId(String(e.target.value))}
                  >
                    {availableResponses.map((response) => (
                      <MenuItem key={response.id} value={String(response.id)}>
                        {SampleDataService.getResponseDisplayName ? 
                          SampleDataService.getResponseDisplayName(response) : 
                          `Response ${response.id}`} - {response.city}, {response.country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={filters.country}
                    label="Country"
                    onChange={(e) => setFilters({...filters, country: e.target.value})}
                  >
                    <MenuItem value="">All Countries</MenuItem>
                    {getUniqueValues('country').map((country) => (
                      <MenuItem key={country} value={country}>{country}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" pt={1}>
                  <Chip 
                    label={`${filteredResponses.length} Filtered Results`} 
                    color="secondary" 
                    size="small" 
                  />
                  {filters.country && (
                    <Chip 
                      label={`Country: ${filters.country}`} 
                      color="default" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Survey Map Card */}
        <Box sx={{ mb: 3 }}>
          <SurveyMapCard
            surveyData={surveyData}
            targetSurveyId={selectedResponseId}
            onSurveySelection={handleMapSurveySelection}
            onAreaSelection={handleMapAreaSelection}
            adminColors={adminColors}
          />
        </Box>

        {/* Chart Builder Card */}
        <Box sx={{ mb: 3 }}>
          <ChartSelectorCard
            onCreateChart={handleCreateCustomChart}
            surveyType={selectedSurveyType}
            isExpanded={chartBuilderExpanded}
            onToggleExpand={() => setChartBuilderExpanded(!chartBuilderExpanded)}
          />
        </Box>

        {/* Analytics Dashboard */}
        {comparisonData && (
          <Grid container spacing={3}>
            {/* Comparison Overview */}
            <Grid item xs={12} md={4}>
              <ComparisonCard
                title="Individual vs Group Comparison"
                targetResponse={comparisonData.target}
                comparisonStats={comparisonData.stats}
              />
            </Grid>

            {/* Score Comparison Chart */}
            <Grid item xs={12} md={8}>
              <SimpleBarChart
                title="Training Scores: Individual vs Average"
                data={comparisonData.averages}
                targetData={comparisonData.targetScores}
                showComparison={true}
                maxValue={5}
              />
            </Grid>

            {/* Geographic Distribution */}
            <Grid item xs={12} md={6}>
              <GeographicChart
                title="Geographic Distribution of Responses"
                data={geographicData}
              />
            </Grid>

            {/* Group Averages */}
            <Grid item xs={12} md={6}>
              <SimpleBarChart
                title="Overall Group Averages"
                data={comparisonData.averages}
                maxValue={5}
              />
            </Grid>

            {/* Qualitative Insights */}
            <Grid item xs={12}>
              <QualitativeAnalysis
                surveyType={selectedSurveyType}
                selectedResponseId={selectedResponseId}
                selectedMapSurveys={selectedMapSurveys}
                userColors={adminColors}
                apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                isTestMode={isTestMode}
              />
            </Grid>
          </Grid>
        )}

        {/* Custom Charts Section */}
        {customCharts.length > 0 && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Custom Charts
            </Typography>
            <Grid container spacing={3}>
              {customCharts.map((chart) => (
                <Grid item xs={12} md={6} lg={4} key={chart.id}>
                  <CustomChart
                    chartConfig={chart}
                    data={surveyData[chart.surveyType] || []}
                    onRemove={() => handleRemoveCustomChart(chart.id)}
                    onEdit={handleEditChart}
                    onDuplicate={handleDuplicateChart}
                    height={350}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Instructions */}
        <Card sx={{ mt: 3, backgroundColor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How to Use This Analytics Dashboard
            </Typography>
            <Typography variant="body2" paragraph>
              1. <strong>Choose Data Mode:</strong> Toggle between Test Mode (sample data) and Normal Mode (backend data)
            </Typography>
            <Typography variant="body2" paragraph>
              2. <strong>Select Survey Type:</strong> Choose between Church, Institution, or Non-Formal surveys
            </Typography>
            <Typography variant="body2" paragraph>
              3. <strong>Select Individual Response:</strong> Pick a specific response to analyze and compare
            </Typography>
            <Typography variant="body2" paragraph>
              4. <strong>Apply Filters:</strong> Filter the comparison group by country, education level, or other criteria
            </Typography>
            <Typography variant="body2" paragraph>
              5. <strong>Analyze Results:</strong> View how the individual performs compared to the group average across different training areas
            </Typography>
            <Typography variant="body2" paragraph>
              6. <strong>Select Surveys on Map:</strong> Click on map markers to select specific surveys. When surveys are selected, all graphs will be recomputed using only the selected data
            </Typography>
            <Typography variant="body2" paragraph>
              7. <strong>Qualitative Insights:</strong> View AI-powered analysis of open-ended responses including sentiment analysis, topic modeling, and response clustering
            </Typography>
            <Typography variant="body2" paragraph>
              8. <strong>Create Custom Charts:</strong> Use the Chart Builder to create custom visualizations
            </Typography>
            <Typography variant="body2">
              9. <strong>Edit Charts:</strong> Click the menu (⋮) on any chart to edit, duplicate, or delete it
            </Typography>
          </CardContent>
        </Card>

        {/* Chart Edit Dialog */}
        <ChartEditDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          chartConfig={editingChart}
          onSave={handleUpdateChart}
          surveyType={selectedSurveyType}
        />
      </Container>
    </Box>
  );
};

export default UserReports;
