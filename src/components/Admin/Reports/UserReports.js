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
import QualitativeComparisonAnalysis from './Charts/QualitativeComparisonAnalysis';

const UserReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyData, setSurveyData] = useState({});
  const [selectedSurveyType, setSelectedSurveyType] = useState('all');
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    education_level: '',
    age_group: '',
    survey_type: ''
  });
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [customCharts, setCustomCharts] = useState([]);
  const [chartBuilderExpanded, setChartBuilderExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false); // Default to normal mode
  const [dataSource, setDataSource] = useState('backend'); // 'sample' or 'backend'
  const [selectedMapSurveys, setSelectedMapSurveys] = useState([]);
  const [selectedMapArea, setSelectedMapArea] = useState([]);

  // Helper functions for robust type comparison
  const normType = (t) => (t || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  const isSameType = (s) => {
    if (selectedSurveyType === 'all') return true; // All types match when "all" is selected
    return normType(s.survey_type || s.surveyType) === normType(selectedSurveyType);
  };

  // Helper function to get enhanced response display name with geographic info
  const getEnhancedResponseDisplayName = (response) => {
    let displayName = '';
    
    // Get the primary name based on survey type
    if (dataSource === 'sample' && SampleDataService.getResponseDisplayName) {
      displayName = SampleDataService.getResponseDisplayName(response);
    } else {
      // For backend data, use the survey-type specific names from the geo-enabled API
      if (response.survey_type === 'church') {
        displayName = response.pastor_name || response.church_name || response.user_name || `Response ${response.id}`;
      } else if (response.survey_type === 'institution') {
        displayName = response.president_name || response.institution_name || response.user_name || `Response ${response.id}`;
      } else if (response.survey_type === 'nonFormal' || response.survey_type === 'non_formal') {
        displayName = response.leader_name || response.ministry_name || response.user_name || `Response ${response.id}`;
      } else {
        displayName = response.user_name || `Response ${response.id}`;
      }
    }
    
    // Add enhanced geographic information from geo-enabled API
    const locationParts = [];
    if (response.city) locationParts.push(response.city);
    if (response.state && response.state !== response.city) locationParts.push(response.state);
    if (response.country) locationParts.push(response.country);
    
    const locationString = locationParts.join(', ');
    return locationString ? `${displayName} - ${locationString}` : displayName;
  };

  // Load data on component mount and when mode changes
  useEffect(() => {
    loadData();
  }, [dataSource]);

  // Handle mode change
  useEffect(() => {
    const newDataSource = isTestMode ? 'sample' : 'backend';
    console.log('🔄 Mode change useEffect triggered');
    console.log('🔄 isTestMode:', isTestMode);
    console.log('🔄 Previous dataSource:', dataSource);
    console.log('🔄 New dataSource:', newDataSource);
    setDataSource(newDataSource);
  }, [isTestMode]);

  // Reload data when survey type filter changes (only for backend data)
  useEffect(() => {
    if (dataSource === 'backend' && filters.survey_type !== '') {
      loadData();
    }
  }, [filters.survey_type]);

  const loadData = async () => {
    try {
      console.log('🔄 UserReports.loadData called');
      console.log('🔄 Data source:', dataSource);
      console.log('🔄 Current filters:', filters);
      
      setLoading(true);
      setError(null); // Clear previous errors
      let data;
      
      if (dataSource === 'sample') {
        console.log('🔄 Loading sample data...');
        data = await SampleDataService.loadSampleData();
        console.log('🔄 Sample data loaded:', data);
      } else {
        console.log('🔄 Loading backend data...');
        
        // Load survey types first if using backend data
        if (surveyTypes.length === 0) {
          try {
            console.log('🔄 Loading survey types...');
            const types = BackendDataService.getSurveyTypes();
            setSurveyTypes(types);
            console.log('🔄 Survey types loaded:', types);
          } catch (typeError) {
            console.warn('Failed to load survey types:', typeError);
          }
        }
        
        // Load survey responses with optional survey type filter
        const surveyTypeFilter = filters.survey_type || null;
        console.log('🔄 Loading survey responses with filter:', surveyTypeFilter);
        data = await BackendDataService.loadSurveyResponses(surveyTypeFilter);
        console.log('🔄 Backend data loaded:', data);
      }
      
      console.log('🔄 Setting survey data:', {
        church: data.church?.length || 0,
        institution: data.institution?.length || 0,
        nonFormal: data.nonFormal?.length || 0
      });
      setSurveyData(data);
      
      // Set default selected response
      if (selectedSurveyType === 'all') {
        // For "all" types, find the first available response from any survey type
        const allResponses = Object.values(data).flat();
        if (allResponses.length > 0) {
          const newSelectedId = String(allResponses[0].id);
          console.log('🔄 Setting selected response ID for all types:', newSelectedId);
          setSelectedResponseId(newSelectedId);
        } else {
          console.log('🔄 No responses found for all types');
          setSelectedResponseId(null);
        }
      } else if (data[selectedSurveyType] && data[selectedSurveyType].length > 0) {
        const newSelectedId = String(data[selectedSurveyType][0].id);
        console.log('🔄 Setting selected response ID:', newSelectedId);
        setSelectedResponseId(newSelectedId);
      } else {
        console.log('🔄 No responses found for survey type:', selectedSurveyType);
        setSelectedResponseId(null);
      }
      
    } catch (err) {
      const errorMessage = dataSource === 'sample' 
        ? 'Failed to load sample data. Please check the console for details.'
        : 'Failed to load data from backend. Please check your connection and try again.';
      console.error('❌ Error in loadData:', err);
      console.error('❌ Error message:', errorMessage);
      setError(errorMessage);
      
      // Keep existing data if switching modes fails
      // This prevents complete data loss on mode switch errors
    } finally {
      setLoading(false);
      console.log('🔄 loadData completed, loading set to false');
    }
  };

  const handleModeToggle = (event) => {
    const newTestMode = event.target.checked;
    console.log('🔄 Mode toggle clicked');
    console.log('🔄 Previous test mode:', isTestMode);
    console.log('🔄 New test mode:', newTestMode);
    console.log('🔄 New data source will be:', newTestMode ? 'sample' : 'backend');
    
    setIsTestMode(newTestMode);
    // Clear any existing data and reset selections
    setSurveyData({});
    setSelectedResponseId(null);
    setComparisonData(null);
    setCustomCharts([]);
    
    console.log('🔄 Data cleared, mode toggle complete');
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
    if (newType === 'all') {
      // For "all" types, find the first available response from any survey type
      const allResponses = Object.values(surveyData).flat();
      if (allResponses.length > 0) {
        setSelectedResponseId(String(allResponses[0].id));
      }
    } else if (surveyData[newType] && surveyData[newType].length > 0) {
      setSelectedResponseId(String(surveyData[newType][0].id));
    }
  };

  const getFilteredResponses = () => {
    // Handle "all" survey types
    if (selectedSurveyType === 'all') {
      const allResponses = Object.values(surveyData).flat();
      
      // If surveys are selected from the map, use only those
      if (selectedMapSurveys.length > 0) {
        return selectedMapSurveys;
      }
      
      if (dataSource === 'sample') {
        return SampleDataService.filterResponsesWithBase(allResponses, filters);
      } else {
        return BackendDataService.filterResponses(allResponses, filters);
      }
    }
    
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
    // Handle "all" survey types
    if (selectedSurveyType === 'all') {
      const allResponses = Object.values(surveyData).flat();
      
      // If surveys are selected from the map, use only those
      if (selectedMapSurveys.length > 0) {
        if (dataSource === 'sample') {
          return SampleDataService.getGeographicDistributionWithBase(selectedMapSurveys);
        } else {
          return BackendDataService.getGeographicDistribution(selectedMapSurveys);
        }
      }
      
      if (dataSource === 'sample') {
        return SampleDataService.getGeographicDistributionWithBase(allResponses);
      } else {
        return BackendDataService.getGeographicDistribution(allResponses);
      }
    }
    
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
    // Handle "all" survey types
    if (selectedSurveyType === 'all') {
      const allResponses = Object.values(surveyData).flat();
      
      // If surveys are selected from the map, use only those
      if (selectedMapSurveys.length > 0) {
        if (dataSource === 'sample') {
          return SampleDataService.getUniqueValuesWithBase(selectedMapSurveys, fieldName);
        } else {
          return BackendDataService.getUniqueValues(selectedMapSurveys, fieldName);
        }
      }
      
      if (dataSource === 'sample') {
        return SampleDataService.getUniqueValuesWithBase(allResponses, fieldName);
      } else {
        return BackendDataService.getUniqueValues(allResponses, fieldName);
      }
    }
    
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
    highlightBg: '#f3e5f5',
    cardBg: '#ffffff',
    lightPurple: '#f3e5f5',
    darkPurple: '#4a148c'
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
            <Card sx={{ p: 2, minWidth: 200, backgroundColor: adminColors.cardBg, border: `1px solid ${adminColors.borderColor}` }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Data Source
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTestMode}
                      onChange={handleModeToggle}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: adminColors.primary,
                          '&:hover': { backgroundColor: `${adminColors.primary}20` }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: adminColors.primary
                        }
                      }}
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
  const availableResponses = selectedSurveyType === 'all' 
    ? Object.values(surveyData).flat() 
    : (surveyData[selectedSurveyType] || []);

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
            <Card sx={{ p: 2, minWidth: 200, backgroundColor: adminColors.cardBg, border: `1px solid ${adminColors.borderColor}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                Data Source
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTestMode}
                    onChange={handleModeToggle}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: adminColors.primary,
                        '&:hover': { backgroundColor: `${adminColors.primary}20` }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: adminColors.primary
                      }
                    }}
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
        <Card sx={{ mb: 3, backgroundColor: adminColors.cardBg, border: `1px solid ${adminColors.borderColor}` }}>
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
                label={`${availableResponses.length} ${selectedSurveyType === 'all' ? 'total' : selectedSurveyType} responses`}
                sx={{ backgroundColor: adminColors.secondary, color: 'white' }}
                size="small"
              />
              {selectedMapSurveys.length > 0 && (
                <Chip 
                  label={`Using ${selectedMapSurveys.filter(isSameType).length} of ${selectedMapSurveys.length} selected surveys`}
                  sx={{ backgroundColor: adminColors.highlightBg, color: adminColors.primary, border: `1px solid ${adminColors.primary}` }}
                  size="small"
                  variant="outlined"
                  onDelete={() => setSelectedMapSurveys([])}
                />
              )}
            </Box>
            <Divider sx={{ mb: 2, borderColor: adminColors.borderColor }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: adminColors.text }}>Survey Type</InputLabel>
                  <Select
                    value={selectedSurveyType}
                    label="Survey Type"
                    onChange={handleSurveyTypeChange}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: adminColors.borderColor },
                        '&:hover fieldset': { borderColor: adminColors.primary },
                        '&.Mui-focused fieldset': { borderColor: adminColors.primary }
                      }
                    }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="church">Church Survey</MenuItem>
                    <MenuItem value="institution">Institution Survey</MenuItem>
                    <MenuItem value="nonFormal">Non-Formal Survey</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: adminColors.text }}>Select Response to Analyze</InputLabel>
                  <Select
                    value={selectedResponseId || ''}
                    label="Select Response to Analyze"
                    onChange={(e) => setSelectedResponseId(String(e.target.value))}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: adminColors.borderColor },
                        '&:hover fieldset': { borderColor: adminColors.primary },
                        '&.Mui-focused fieldset': { borderColor: adminColors.primary }
                      }
                    }}
                  >
                    {availableResponses.map((response) => (
                      <MenuItem key={response.id} value={String(response.id)}>
                        {getEnhancedResponseDisplayName(response)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>


              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: adminColors.text }}>Country</InputLabel>
                  <Select
                    value={filters.country}
                    label="Country"
                    onChange={(e) => setFilters({...filters, country: e.target.value})}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: adminColors.borderColor },
                        '&:hover fieldset': { borderColor: adminColors.primary },
                        '&.Mui-focused fieldset': { borderColor: adminColors.primary }
                      }
                    }}
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
                    sx={{ backgroundColor: adminColors.primary, color: 'white' }}
                    size="small" 
                  />
                  {filters.survey_type && (
                    <Chip 
                      label={`Survey Type: ${surveyTypes.find(t => t.value === filters.survey_type)?.label || filters.survey_type}`} 
                      sx={{ backgroundColor: adminColors.lightPurple, color: adminColors.primary, border: `1px solid ${adminColors.primary}` }}
                      size="small" 
                      variant="outlined"
                      onDelete={() => setFilters({...filters, survey_type: ''})}
                    />
                  )}
                  {filters.country && (
                    <Chip 
                      label={`Country: ${filters.country}`} 
                      sx={{ backgroundColor: adminColors.lightPurple, color: adminColors.primary, border: `1px solid ${adminColors.primary}` }}
                      size="small" 
                      variant="outlined"
                      onDelete={() => setFilters({...filters, country: ''})}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Survey Map Card */}
        <Card sx={{ mb: 3, p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
          <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
            Survey Response Map
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Interactive map showing survey response locations. Click markers to select specific surveys for comparison.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <SurveyMapCard
              surveyData={surveyData}
              targetSurveyId={selectedResponseId}
              selectedSurveyType={selectedSurveyType}
              onSurveySelection={handleMapSurveySelection}
              onAreaSelection={handleMapAreaSelection}
              onSurveyTypeChange={setSelectedSurveyType}
              adminColors={adminColors}
              hideTitle={true}
            />
          </Box>
        </Card>

        {/* Chart Builder Card */}
        <Card sx={{ mb: 3, p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
          <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
            Custom Chart Builder
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create custom visualizations from your survey data. Choose chart types, data fields, and filters.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <ChartSelectorCard
              onCreateChart={handleCreateCustomChart}
              surveyType={selectedSurveyType}
              isExpanded={chartBuilderExpanded}
              onToggleExpand={() => setChartBuilderExpanded(!chartBuilderExpanded)}
              adminColors={adminColors}
              hideTitle={true}
            />
          </Box>
        </Card>

        {/* Analytics Dashboard */}
        {comparisonData && (
          <Grid container spacing={3}>
            {/* Comparison Overview */}
            <Grid item xs={12} md={4}>
              <ComparisonCard
                title="Individual vs Group Comparison"
                targetResponse={comparisonData.target}
                comparisonStats={comparisonData.stats}
                adminColors={adminColors}
              />
            </Grid>

            {/* Score Comparison Chart */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Training Scores: Individual vs Average
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <SimpleBarChart
                    title=""
                    data={comparisonData.averages}
                    targetData={comparisonData.targetScores}
                    showComparison={true}
                    maxValue={5}
                    adminColors={adminColors}
                  />
                </Box>
              </Card>
            </Grid>

            {/* Geographic Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Geographic Distribution of Responses
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <GeographicChart
                    title=""
                    data={geographicData}
                    adminColors={adminColors}
                  />
                </Box>
              </Card>
            </Grid>

            {/* Group Averages */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Overall Group Averages
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <SimpleBarChart
                    title=""
                    data={comparisonData.averages}
                    maxValue={5}
                    adminColors={adminColors}
                  />
                </Box>
              </Card>
            </Grid>

            {/* Qualitative Insights */}
            <Grid item xs={12}>
              <Card sx={{ p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Qualitative Insights
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <QualitativeAnalysis
                    surveyType={selectedSurveyType}
                    selectedResponseId={selectedResponseId}
                    selectedResponseLabel={availableResponses.find(r => String(r.id) === String(selectedResponseId)) 
                      ? getEnhancedResponseDisplayName(availableResponses.find(r => String(r.id) === String(selectedResponseId)))
                      : 'Selected Response'}
                    selectedMapSurveys={selectedMapSurveys}
                    userColors={adminColors}
                    apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                    isTestMode={isTestMode}
                    hideTitle={true}
                  />
                </Box>
              </Card>
            </Grid>

            {/* Qualitative Insights Comparison */}
            <Grid item xs={12}>
              <Card sx={{ p: 3, backgroundColor: adminColors.headerBg }}>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Qualitative Insights Comparison
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Compare the selected response against all other responses in the dataset
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <QualitativeComparisonAnalysis
                    surveyType={selectedSurveyType}
                    selectedResponseId={selectedResponseId}
                    selectedResponseLabel={availableResponses.find(r => String(r.id) === String(selectedResponseId)) 
                      ? getEnhancedResponseDisplayName(availableResponses.find(r => String(r.id) === String(selectedResponseId)))
                      : 'Selected Response'}
                    surveyData={surveyData}
                    adminColors={adminColors}
                    apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                    isTestMode={isTestMode}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Custom Charts Section */}
        {customCharts.length > 0 && (
          <Card sx={{ mt: 4, p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
            <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
              Custom Charts
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your custom visualizations created from survey data.
            </Typography>
            <Box sx={{ mt: 2 }}>
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
                      adminColors={adminColors}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Card>
        )}

        {/* Instructions */}
        <Card sx={{ mt: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
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
