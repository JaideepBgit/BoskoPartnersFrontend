import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Badge,
  Tooltip
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const QualitativeAnalysis = ({ 
  surveyType, 
  selectedResponseId,
  selectedResponseLabel = 'Selected Response',
  selectedMapSurveys = [], 
  userColors = {},
  apiUrl = 'http://localhost:5000/api',
  isTestMode = false,
  hideTitle = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Color schemes for different visualizations
  const sentimentColors = {
    positive: '#4caf50',
    neutral: '#ff9800',
    negative: '#f44336'
  };

  const topicColors = [
    '#633394', '#967CB2', '#2196f3', '#4caf50', '#ff9800',
    '#f44336', '#9c27b0', '#607d8b', '#795548', '#e91e63'
  ];

  const clusterColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];

  useEffect(() => {
    if (surveyType && selectedResponseId) {
      loadQualitativeAnalysis();
    }
  }, [surveyType, selectedResponseId, selectedMapSurveys, isTestMode]);

  const loadQualitativeAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      // Build query parameters
      const params = new URLSearchParams({
        survey_type: surveyType,
        response_id: selectedResponseId,
        user_id: userId,
        test_mode: isTestMode.toString()
      });

      // Add selected surveys filtering if any are specified
      if (selectedMapSurveys.length > 0) {
        params.append('selected_surveys', selectedMapSurveys.map(s => s.id).join(','));
      }

      const response = await fetch(`${apiUrl}/reports/analytics/text?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch qualitative analysis: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        processAnalysisData(data.results);
      } else {
        throw new Error('Invalid response format from qualitative analysis API');
      }

    } catch (err) {
      console.error('Error loading qualitative analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processAnalysisData = (rawData) => {
    // Filter data based on selected surveys if any
    let filteredData = rawData;
    
    if (selectedMapSurveys.length > 0) {
      const selectedIds = selectedMapSurveys.map(s => s.id);
      filteredData = rawData.filter(item => selectedIds.includes(item.response_id));
    }

    // Process sentiment distribution
    const sentimentCounts = filteredData.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {});

    const sentimentData = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: count,
      color: sentimentColors[sentiment] || '#gray'
    }));

    // Process topic distribution using meaningful labels
    const topicCounts = filteredData.reduce((acc, item) => {
      const topicKey = item.topic_label || `Topic ${item.topic}`;
      acc[topicKey] = (acc[topicKey] || 0) + 1;
      return acc;
    }, {});

    const topicData = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 topics
      .map(([topic, count], index) => ({
        name: topic,
        value: count,
        color: topicColors[index % topicColors.length]
      }));

    // Process cluster distribution using meaningful labels
    const clusterCounts = filteredData.reduce((acc, item) => {
      const clusterKey = item.cluster_label || `Cluster ${item.cluster}`;
      acc[clusterKey] = (acc[clusterKey] || 0) + 1;
      return acc;
    }, {});

    const clusterData = Object.entries(clusterCounts).map(([cluster, count], index) => ({
      name: cluster,
      value: count,
      color: clusterColors[index % clusterColors.length]
    }));

    // Sample responses by sentiment
    const responsesBySentiment = {
      positive: filteredData.filter(item => item.sentiment === 'positive').slice(0, 3),
      neutral: filteredData.filter(item => item.sentiment === 'neutral').slice(0, 3),
      negative: filteredData.filter(item => item.sentiment === 'negative').slice(0, 3)
    };

    setAnalysisData({
      totalResponses: filteredData.length,
      sentimentData,
      topicData,
      clusterData,
      responsesBySentiment,
      rawData: filteredData
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const refreshParams = new URLSearchParams({
        refresh: 'true',
        test_mode: isTestMode.toString()
      });
      
      await fetch(`${apiUrl}/reports/analytics/text?${refreshParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      await loadQualitativeAnalysis();
    } catch (err) {
      console.error('Error refreshing analysis:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Hide labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading qualitative analysis...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Unable to load qualitative analysis
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData || analysisData.totalResponses === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              No Qualitative Data Available
            </Typography>
            <Typography variant="body2">
              No open-ended survey responses found for analysis. This section shows insights from text responses like comments and feedback.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {!hideTitle && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Qualitative Insights - {selectedResponseLabel}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`Data Source: ${isTestMode ? 'Sample Data' : 'Backend API'}`}
                  color={isTestMode ? 'warning' : 'success'}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      
      <Box sx={hideTitle ? {} : { mt: 2 }}>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Analysis of open-ended survey responses using sentiment analysis, topic modeling, and clustering.
        </Typography>

        <Grid container spacing={3}>
          {/* Sentiment Analysis */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <Typography variant="subtitle1" gutterBottom>
                Sentiment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={analysisData.sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analysisData.sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Topic Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <Typography variant="subtitle1" gutterBottom>
                Topic Distribution
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={analysisData.topicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={10}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={userColors.primary || '#633394'} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Cluster Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <Typography variant="subtitle1" gutterBottom>
                Response Clusters
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={analysisData.clusterData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analysisData.clusterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Sample Responses by Sentiment */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sample Responses by Sentiment
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(analysisData.responsesBySentiment).map(([sentiment, responses]) => (
                  <Grid item xs={12} md={4} key={sentiment}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                          size="small"
                          sx={{ 
                            backgroundColor: sentimentColors[sentiment],
                            color: 'white',
                            mr: 1
                          }}
                        />
                        ({responses.length} responses)
                      </Typography>
                      <List dense>
                        {responses.slice(0, 3).map((response, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={
                                <Tooltip title={response.answer} arrow>
                                  <Typography variant="body2" sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    fontSize: '0.875rem'
                                  }}>
                                    {response.answer}
                                  </Typography>
                                </Tooltip>
                              }
                              secondary={`Response ID: ${response.response_id}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Box>
            {refreshing && <CircularProgress size={16} sx={{ mr: 1 }} />}
            <Typography 
              variant="caption" 
              sx={{ 
                cursor: 'pointer', 
                color: userColors.primary || '#633394',
                textDecoration: 'underline'
              }}
              onClick={handleRefresh}
            >
              Refresh Analysis
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QualitativeAnalysis;
