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
import SampleDataService from '../../../../services/SampleDataService';

const QualitativeComparisonAnalysis = ({ 
  surveyType, 
  selectedResponseId,
  selectedResponseLabel = 'Selected Response',
  surveyData,
  adminColors = {},
  apiUrl = 'http://localhost:5000/api',
  isTestMode = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  // Color schemes for different visualizations
  const sentimentColors = {
    positive: '#4caf50',
    neutral: '#ff9800',
    negative: '#f44336'
  };

  const comparisonColors = {
    selected: adminColors.primary || '#633394',
    others: adminColors.secondary || '#967CB2'
  };

  useEffect(() => {
    if (surveyType && selectedResponseId && surveyData[surveyType]) {
      generateComparisonAnalysis();
    }
  }, [surveyType, selectedResponseId, surveyData]);

  const generateComparisonAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const allResponses = surveyData[surveyType] || [];
      const selectedResponse = allResponses.find(r => String(r.id) === String(selectedResponseId));
      const otherResponses = allResponses.filter(r => String(r.id) !== String(selectedResponseId));

      if (!selectedResponse) {
        throw new Error('Selected response not found');
      }

      // Get qualitative data for both selected and other responses
      let selectedQualitativeData = null;
      let othersQualitativeData = null;

      if (isTestMode) {
        // For test mode, simulate qualitative analysis
        selectedQualitativeData = simulateQualitativeData([selectedResponse], 'selected');
        othersQualitativeData = simulateQualitativeData(otherResponses, 'others');
      } else {
        // For backend mode, fetch actual qualitative analysis
        try {
          selectedQualitativeData = await fetchQualitativeData([selectedResponse.id]);
          othersQualitativeData = await fetchQualitativeData(otherResponses.map(r => r.id));
        } catch (err) {
          console.warn('Backend qualitative analysis failed, using simulation:', err);
          selectedQualitativeData = simulateQualitativeData([selectedResponse], 'selected');
          othersQualitativeData = simulateQualitativeData(otherResponses, 'others');
        }
      }

      // Process comparison data
      const comparison = processComparisonData(selectedQualitativeData, othersQualitativeData);
      setComparisonData(comparison);

    } catch (err) {
      console.error('Error generating comparison analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQualitativeData = async (responseIds) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    const params = new URLSearchParams({
      survey_type: surveyType,
      response_ids: responseIds.join(','),
      user_id: userId,
      test_mode: isTestMode.toString()
    });

    const response = await fetch(`${apiUrl}/reports/analytics/text?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch qualitative data: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.results : [];
  };

  const simulateQualitativeData = (responses, type) => {
    // Simulate qualitative analysis for demonstration
    const sentiments = ['positive', 'neutral', 'negative'];
    const topics = ['Training Quality', 'Resource Availability', 'Community Impact', 'Program Effectiveness', 'Support Systems'];
    const clusters = ['Highly Satisfied', 'Moderately Satisfied', 'Needs Improvement', 'Critical Issues'];

    return responses.flatMap(response => {
      // Generate 1-3 qualitative entries per response
      const numEntries = Math.floor(Math.random() * 3) + 1;
      return Array.from({ length: numEntries }, (_, i) => ({
        response_id: response.id,
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        topic: Math.floor(Math.random() * topics.length),
        topic_label: topics[Math.floor(Math.random() * topics.length)],
        cluster: Math.floor(Math.random() * clusters.length),
        cluster_label: clusters[Math.floor(Math.random() * clusters.length)],
        answer: `Sample qualitative response ${i + 1} for ${type} analysis`,
        confidence: Math.random() * 0.3 + 0.7 // 0.7 to 1.0
      }));
    });
  };

  const processComparisonData = (selectedData, othersData) => {
    // Process sentiment comparison
    const selectedSentiment = processGroupSentiment(selectedData, 'Selected Response');
    const othersSentiment = processGroupSentiment(othersData, 'Other Responses');

    // Process topic comparison
    const selectedTopics = processGroupTopics(selectedData, 'Selected');
    const othersTopics = processGroupTopics(othersData, 'Others');

    // Process cluster comparison
    const selectedClusters = processGroupClusters(selectedData, 'Selected');
    const othersClusters = processGroupClusters(othersData, 'Others');

    // Create side-by-side comparison data
    const sentimentComparison = createSideBySideData(selectedSentiment, othersSentiment, 'sentiment');
    const topicComparison = createTopicComparisonData(selectedTopics, othersTopics);

    return {
      selectedCount: selectedData.length,
      othersCount: othersData.length,
      sentimentComparison,
      topicComparison,
      selectedClusters,
      othersClusters,
      insights: generateComparisonInsights(selectedSentiment, othersSentiment, selectedTopics, othersTopics)
    };
  };

  const processGroupSentiment = (data, groupName) => {
    const sentimentCounts = data.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: count,
      percentage: data.length > 0 ? (count / data.length * 100).toFixed(1) : 0,
      color: sentimentColors[sentiment] || '#gray',
      group: groupName === 'Selected Response' ? selectedResponseLabel : groupName
    }));
  };

  const processGroupTopics = (data, groupName) => {
    const topicCounts = data.reduce((acc, item) => {
      const topicKey = item.topic_label || `Topic ${item.topic}`;
      acc[topicKey] = (acc[topicKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({
        name: topic,
        value: count,
        percentage: data.length > 0 ? (count / data.length * 100).toFixed(1) : 0,
        group: groupName === 'Selected' ? selectedResponseLabel : groupName
      }));
  };

  const processGroupClusters = (data, groupName) => {
    const clusterCounts = data.reduce((acc, item) => {
      const clusterKey = item.cluster_label || `Cluster ${item.cluster}`;
      acc[clusterKey] = (acc[clusterKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(clusterCounts).map(([cluster, count]) => ({
      name: cluster,
      value: count,
      percentage: data.length > 0 ? (count / data.length * 100).toFixed(1) : 0,
      color: groupName === 'Selected' ? comparisonColors.selected : comparisonColors.others
    }));
  };

  const createSideBySideData = (selectedData, othersData, type) => {
    const allSentiments = ['Positive', 'Neutral', 'Negative'];
    
    return allSentiments.map(sentiment => {
      const selectedItem = selectedData.find(item => item.name === sentiment);
      const othersItem = othersData.find(item => item.name === sentiment);
      
      return {
        name: sentiment,
        Selected: selectedItem ? selectedItem.value : 0,
        Others: othersItem ? othersItem.value : 0,
        selectedPercentage: selectedItem ? selectedItem.percentage : 0,
        othersPercentage: othersItem ? othersItem.percentage : 0
      };
    });
  };

  const createTopicComparisonData = (selectedTopics, othersTopics) => {
    // Get all unique topics from both groups
    const allTopics = new Set([
      ...selectedTopics.map(t => t.name),
      ...othersTopics.map(t => t.name)
    ]);

    return Array.from(allTopics).map(topic => {
      const selectedItem = selectedTopics.find(t => t.name === topic);
      const othersItem = othersTopics.find(t => t.name === topic);

      return {
        name: topic,
        Selected: selectedItem ? selectedItem.value : 0,
        Others: othersItem ? othersItem.value : 0,
        selectedPercentage: selectedItem ? selectedItem.percentage : 0,
        othersPercentage: othersItem ? othersItem.percentage : 0
      };
    }).sort((a, b) => (b.Selected + b.Others) - (a.Selected + a.Others)).slice(0, 8);
  };

  const generateComparisonInsights = (selectedSentiment, othersSentiment, selectedTopics, othersTopics) => {
    const insights = [];

    // Sentiment insights
    const selectedPositive = selectedSentiment.find(s => s.name === 'Positive');
    const othersPositive = othersSentiment.find(s => s.name === 'Positive');
    
    if (selectedPositive && othersPositive) {
      const diff = parseFloat(selectedPositive.percentage) - parseFloat(othersPositive.percentage);
      if (Math.abs(diff) > 10) {
        insights.push({
          type: 'sentiment',
          message: diff > 0 
            ? `Selected response is ${diff.toFixed(1)}% more positive than others`
            : `Selected response is ${Math.abs(diff).toFixed(1)}% less positive than others`,
          severity: diff > 0 ? 'success' : 'warning'
        });
      }
    }

    // Topic insights
    const topSelectedTopic = selectedTopics[0];
    const topOthersTopic = othersTopics[0];
    
    if (topSelectedTopic && topOthersTopic && topSelectedTopic.name !== topOthersTopic.name) {
      insights.push({
        type: 'topic',
        message: `Selected response focuses on "${topSelectedTopic.name}" while others focus on "${topOthersTopic.name}"`,
        severity: 'info'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Generating comparison analysis...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="h6" gutterBottom>
          Unable to generate comparison analysis
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Alert>
    );
  }

  if (!comparisonData) {
    return (
      <Alert severity="info">
        <Typography variant="h6" gutterBottom>
          No Comparison Data Available
        </Typography>
        <Typography variant="body2">
          Unable to generate qualitative comparison analysis.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>

      {/* Insights */}
      {comparisonData.insights.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Key Insights
          </Typography>
          {comparisonData.insights.map((insight, index) => (
            <Alert key={index} severity={insight.severity} sx={{ mb: 1 }}>
              {insight.message}
            </Alert>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Sentiment Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '350px' }}>
            <Typography variant="subtitle1" gutterBottom>
              Sentiment Comparison
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={comparisonData.sentimentComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    `${value} responses`,
                    name === 'Selected' ? selectedResponseLabel : 'Other Responses'
                  ]}
                />
                <Legend />
                <Bar dataKey="Selected" fill={comparisonColors.selected} name={selectedResponseLabel} />
                <Bar dataKey="Others" fill={comparisonColors.others} name="Other Responses" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Topic Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '350px' }}>
            <Typography variant="subtitle1" gutterBottom>
              Topic Focus Comparison
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={comparisonData.topicComparison} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    `${value} responses`,
                    name === 'Selected' ? selectedResponseLabel : 'Other Responses'
                  ]}
                />
                <Legend />
                <Bar dataKey="Selected" fill={comparisonColors.selected} name={selectedResponseLabel} />
                <Bar dataKey="Others" fill={comparisonColors.others} name="Other Responses" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Cluster Comparison */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Response Cluster Comparison
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {selectedResponseLabel} Clusters
                </Typography>
                <List dense>
                  {comparisonData.selectedClusters.map((cluster, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={cluster.name}
                              size="small"
                              sx={{ backgroundColor: cluster.color, color: 'white' }}
                            />
                            <Typography variant="body2">
                              {cluster.value} responses ({cluster.percentage}%)
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Other Responses Clusters
                </Typography>
                <List dense>
                  {comparisonData.othersClusters.map((cluster, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={cluster.name}
                              size="small"
                              sx={{ backgroundColor: cluster.color, color: 'white' }}
                            />
                            <Typography variant="body2">
                              {cluster.value} responses ({cluster.percentage}%)
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QualitativeComparisonAnalysis;
