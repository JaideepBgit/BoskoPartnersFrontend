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
  Divider,
  Autocomplete,
  TextField
} from '@mui/material';
import Navbar from '../shared/Navbar/Navbar';
import SimpleBarChart from '../Admin/Reports/Charts/SimpleBarChart';
import GeographicChart from '../Admin/Reports/Charts/GeographicChart';
import ComparisonCard from '../Admin/Reports/Charts/ComparisonCard';
import SurveyMapCard from '../Admin/Reports/Charts/SurveyMapCard';

const UserReports = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSurveyData, setUserSurveyData] = useState({});
  const [selectedSurveyType, setSelectedSurveyType] = useState('church');
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    education_level: '',
    age_group: ''
  });
  const [selectedMapSurveys, setSelectedMapSurveys] = useState([]);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);

  // Helper functions for robust type comparison
  const normType = (t) => (t || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  const isSameType = (s) => normType(s.survey_type || s.surveyType) === normType(selectedSurveyType);

  // Load user's survey responses and organizations on component mount
  useEffect(() => {
    loadUserSurveyResponses();
    loadUserOrganizations();
  }, []);

  const loadUserSurveyResponses = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      // Try to fetch user's survey responses directly from survey_responses table
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/survey-responses/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);

        // If it's a 404 or the user has no responses, don't treat it as an error
        if (response.status === 404 || errorText.includes('no responses')) {
          setUserSurveyData({
            church: [],
            institution: [],
            nonFormal: []
          });
          return;
        }

        throw new Error(`Failed to fetch user survey responses: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Received user survey data:', data);

      // Group responses by survey type
      const groupedData = {
        church: [],
        institution: [],
        nonFormal: []
      };

      if (data.responses && Array.isArray(data.responses)) {
        data.responses.forEach(response => {
          const surveyType = response.survey_type || response.template_type || 'church';
          const normalizedType = normType(surveyType);

          // Ensure response has latitude and longitude properties
          const formattedResponse = {
            ...response,
            latitude: response.latitude || (response.geo_location && response.geo_location.latitude) || null,
            longitude: response.longitude || (response.geo_location && response.geo_location.longitude) || null,
            survey_type: surveyType // Ensure survey_type is set
          };

          if (normalizedType.includes('church')) {
            groupedData.church.push(formattedResponse);
          } else if (normalizedType.includes('institution')) {
            groupedData.institution.push(formattedResponse);
          } else if (normalizedType.includes('nonformal') || normalizedType.includes('non-formal')) {
            groupedData.nonFormal.push(formattedResponse);
          } else {
            // Default to church if type is unclear
            groupedData.church.push(formattedResponse);
          }
        });
      }

      setUserSurveyData(groupedData);

      // Set default selected response
      const availableTypes = Object.keys(groupedData).filter(type => groupedData[type].length > 0);
      if (availableTypes.length > 0) {
        const firstType = availableTypes[0];
        setSelectedSurveyType(firstType);
        if (groupedData[firstType].length > 0) {
          setSelectedResponseId(String(groupedData[firstType][0].id));
        }
      }

    } catch (err) {
      console.error('Error loading user survey responses:', err);

      // If it's an authentication error, show specific message
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        setError('Authentication required. Please log in again.');
      } else {
        setError('Failed to load your survey responses. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId) {
        console.log('No user ID found for loading organizations');
        return;
      }

      // Get user data to fetch their primary organization
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const userData = await response.json();

        // If user has an organization_id, fetch that organization
        if (userData.organization_id) {
          const orgResponse = await fetch(`${apiUrl}/organizations/${userData.organization_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });

          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            const userOrg = {
              id: orgData.id,
              name: orgData.name,
              organization_type: {
                type: orgData.organization_type?.type || null
              },
              geo_location: {
                city: orgData.geo_location?.city || null,
                country: orgData.geo_location?.country || null
              },
              is_primary: true
            };

            setUserOrganizations([userOrg]);
            setSelectedOrganization(userOrg);
          }
        } else {
          // User has no organization
          setUserOrganizations([]);
          setSelectedOrganization(null);
        }
      } else {
        console.error('Failed to load user data');
      }
    } catch (err) {
      console.error('Error loading user organizations:', err);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // Update comparison data when survey type or selected response changes
  useEffect(() => {
    if (userSurveyData[selectedSurveyType] && selectedResponseId) {
      generateComparisonData();
    }
  }, [userSurveyData, selectedSurveyType, selectedResponseId]);

  // Regenerate graphs when selected surveys change
  useEffect(() => {
    if (userSurveyData[selectedSurveyType] && selectedResponseId) {
      generateComparisonData();
    }
  }, [selectedMapSurveys, userSurveyData, selectedSurveyType, selectedResponseId]);

  const generateComparisonData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        console.log('No authentication data available for comparison');
        return;
      }

      // Get similar survey responses for comparison
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/survey-responses/similar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          response_id: selectedResponseId,
          survey_type: selectedSurveyType,
          selected_surveys: selectedMapSurveys.length > 0 ? selectedMapSurveys.map(s => s.id) : null
        })
      });

      if (response.ok) {
        const comparisonResult = await response.json();
        setComparisonData(comparisonResult);
      } else {
        console.error('Failed to generate comparison data');
      }

    } catch (err) {
      console.error('Error generating comparison data:', err);
    }
  };

  const handleSurveyTypeChange = (event) => {
    const newType = event.target.value;
    setSelectedSurveyType(newType);

    // Reset selected response for new survey type
    if (userSurveyData[newType] && userSurveyData[newType].length > 0) {
      setSelectedResponseId(String(userSurveyData[newType][0].id));
    }
  };

  const handleOrganizationChange = (event) => {
    const orgId = event.target.value;
    const organization = userOrganizations.find(org => org.id === orgId);
    setSelectedOrganization(organization);
  };

  const getFilteredResponses = () => {
    if (!userSurveyData[selectedSurveyType]) return [];

    let baseResponses = userSurveyData[selectedSurveyType];

    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      baseResponses = selectedMapSurveys.filter(isSameType);
    }

    // Apply filters
    return baseResponses.filter(response => {
      if (filters.country && response.country !== filters.country) return false;
      if (filters.education_level && response.education_level !== filters.education_level) return false;
      if (filters.age_group && response.age_group !== filters.age_group) return false;
      return true;
    });
  };

  const getGeographicData = () => {
    if (!userSurveyData[selectedSurveyType]) return {};

    let responses = userSurveyData[selectedSurveyType];

    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      responses = selectedMapSurveys.filter(isSameType);
    }

    // Group by country
    const countryData = {};
    responses.forEach(response => {
      const country = response.country || 'Unknown';
      countryData[country] = (countryData[country] || 0) + 1;
    });

    return countryData;
  };

  const getUniqueValues = (fieldName) => {
    if (!userSurveyData[selectedSurveyType]) return [];

    let responses = userSurveyData[selectedSurveyType];

    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      responses = selectedMapSurveys.filter(isSameType);
    }

    const uniqueValues = [...new Set(responses.map(r => r[fieldName]).filter(Boolean))];
    return uniqueValues.sort();
  };

  const handleMapSurveySelection = (surveys) => {
    setSelectedMapSurveys(surveys);
  };

  const handleMapAreaSelection = (markersInArea) => {
    const surveysInArea = markersInArea.map(marker => marker.surveyData);
    setSelectedMapSurveys(surveysInArea);
  };

  // User colors for consistent styling
  const userColors = {
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
              Loading your survey responses...
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
            Your Survey Reports
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            View and analyze your completed survey responses.
          </Typography>

          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Unable to load your survey data
            </Typography>
            <Typography variant="body2" paragraph>
              {error}
            </Typography>
          </Alert>

          <Button variant="contained" onClick={loadUserSurveyResponses}>
            Retry Loading Data
          </Button>
        </Container>
      </Box>
    );
  }

  const filteredResponses = getFilteredResponses();
  const geographicData = getGeographicData();
  const availableResponses = userSurveyData[selectedSurveyType] || [];
  const totalResponses = Object.values(userSurveyData).reduce((sum, responses) => sum + responses.length, 0);

  return (
    <Box>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: userColors.text, fontWeight: 'bold' }}>
              Your Survey Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and analyze your completed survey responses and compare with similar surveys.
            </Typography>
          </Box>

          {/* Summary Card */}
          <Card sx={{ p: 2, minWidth: 200 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                Your Surveys
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: userColors.text }}>
                {totalResponses}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Completed
              </Typography>
            </Box>
          </Card>
        </Box>

        {userOrganizations.length === 0 && !loadingOrganizations ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              No Organizations Found
            </Typography>
            <Typography variant="body2">
              You are not associated with any organizations. Please contact your administrator to be assigned to an organization before you can view reports.
            </Typography>
          </Alert>
        ) : totalResponses === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              No Survey Responses Found
            </Typography>
            <Typography variant="body2">
              You haven't completed any surveys yet. Once you complete surveys, your results will appear here for analysis.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Control Panel */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                {/* Status */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {selectedOrganization && (
                    <Chip
                      label={`Organization: ${selectedOrganization.name}${selectedOrganization.is_primary ? ' (Primary)' : ''}`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    label={`${availableResponses.length} ${selectedSurveyType} responses`}
                    color="info"
                    size="small"
                  />
                  {selectedMapSurveys.length > 0 && (
                    <Chip
                      label={`Using ${selectedMapSurveys.filter(isSameType).length} selected surveys`}
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
                    <TextField
                      fullWidth
                      label="Your Organization"
                      value={selectedOrganization ? selectedOrganization.name : (loadingOrganizations ? 'Loading...' : 'No organization assigned')}
                      InputProps={{
                        readOnly: true,
                      }}
                      size="medium"
                      sx={{
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: userColors.primary,
                          },
                        }
                      }}
                    />
                  </Grid>

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

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Select Response to Analyze</InputLabel>
                      <Select
                        value={selectedResponseId || ''}
                        label="Select Response to Analyze"
                        onChange={(e) => setSelectedResponseId(String(e.target.value))}
                      >
                        {availableResponses.map((response) => (
                          <MenuItem key={response.id} value={String(response.id)}>
                            Survey {response.id} - {response.city || 'Unknown'}, {response.country || 'Unknown'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={filters.country}
                        label="Country"
                        onChange={(e) => setFilters({ ...filters, country: e.target.value })}
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
                surveyData={userSurveyData}
                targetSurveyId={selectedResponseId}
                onSurveySelection={handleMapSurveySelection}
                onAreaSelection={handleMapAreaSelection}
                adminColors={userColors}
              />
            </Box>

            {/* Analytics Dashboard */}
            {comparisonData && (
              <Grid container spacing={3}>
                {/* Comparison Overview */}
                <Grid item xs={12} md={4}>
                  <ComparisonCard
                    title="Your Response vs Similar Surveys"
                    targetResponse={comparisonData.target}
                    comparisonStats={comparisonData.stats}
                  />
                </Grid>

                {/* Score Comparison Chart */}
                <Grid item xs={12} md={8}>
                  <SimpleBarChart
                    title="Your Scores vs Average"
                    data={comparisonData.averages}
                    targetData={comparisonData.targetScores}
                    showComparison={true}
                    maxValue={5}
                  />
                </Grid>

                {/* Geographic Distribution */}
                <Grid item xs={12} md={6}>
                  <GeographicChart
                    title="Geographic Distribution"
                    data={geographicData}
                  />
                </Grid>

                {/* Group Averages */}
                <Grid item xs={12} md={6}>
                  <SimpleBarChart
                    title="Similar Survey Averages"
                    data={comparisonData.averages}
                    maxValue={5}
                  />
                </Grid>
              </Grid>
            )}

            {/* Instructions */}
            <Card sx={{ mt: 3, backgroundColor: '#f8f9fa' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  How to Use Your Survey Reports
                </Typography>
                <Typography variant="body2" paragraph>
                  1. <strong>Select Organization:</strong> Choose from your associated organizations (only organizations you belong to are shown)
                </Typography>
                <Typography variant="body2" paragraph>
                  2. <strong>Select Survey Type:</strong> Choose between Church, Institution, or Non-Formal surveys
                </Typography>
                <Typography variant="body2" paragraph>
                  3. <strong>Select Your Response:</strong> Pick one of your completed surveys to analyze
                </Typography>
                <Typography variant="body2" paragraph>
                  4. <strong>Apply Filters:</strong> Filter comparison data by country or other criteria
                </Typography>
                <Typography variant="body2" paragraph>
                  5. <strong>View Comparisons:</strong> See how your responses compare to similar surveys
                </Typography>
                <Typography variant="body2" paragraph>
                  6. <strong>Select on Map:</strong> Click on map markers to focus on specific geographic areas
                </Typography>
                <Typography variant="body2">
                  7. <strong>Analyze Results:</strong> Use the charts to understand your survey results in context
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default UserReports;
