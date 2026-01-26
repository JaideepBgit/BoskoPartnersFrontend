import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import TopicIcon from '@mui/icons-material/Topic';
import GroupWorkIcon from '@mui/icons-material/GroupWork';

/**
 * Display text analytics results from text_analytics.py module
 * Shows sentiment analysis, topic modeling, and clustering results
 */
const TextAnalyticsDisplay = ({ textAnalytics, adminColors }) => {
  if (!textAnalytics || textAnalytics.error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Text Analytics
        </Typography>
        <Typography color="text.secondary">
          {textAnalytics?.error || 'No text analytics data available'}
        </Typography>
      </Paper>
    );
  }

  const { target, comparison_group } = textAnalytics;

  if (!target || target.total_text_responses === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Text Analytics
        </Typography>
        <Typography color="text.secondary">
          No text responses found in this survey
        </Typography>
      </Paper>
    );
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentSatisfiedAltIcon sx={{ color: '#4caf50' }} />;
      case 'negative':
        return <SentimentDissatisfiedIcon sx={{ color: '#f44336' }} />;
      default:
        return <SentimentNeutralIcon sx={{ color: '#ff9800' }} />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return '#4caf50';
      case 'negative':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const calculatePercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: adminColors?.primary || '#633394', fontWeight: 'bold' }}>
        Text Analytics (AI-Powered Analysis)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Sentiment analysis, topic modeling, and clustering of open-ended text responses using NLP and machine learning.
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Stats */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Response Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: adminColors?.primary || '#633394' }}>
                      {target.total_text_responses}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your Text Responses
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#2196f3' }}>
                      {comparison_group?.total_text_responses || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Group Text Responses
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sentiment Analysis */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SentimentSatisfiedAltIcon sx={{ color: adminColors?.primary || '#633394' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Sentiment Analysis
                </Typography>
              </Box>

              {/* Your Sentiment */}
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                Your Responses:
              </Typography>
              {Object.entries(target.sentiment_distribution).map(([sentiment, count]) => (
                <Box key={sentiment} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSentimentIcon(sentiment)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {sentiment}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {count} ({calculatePercentage(count, target.total_text_responses)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(calculatePercentage(count, target.total_text_responses))}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getSentimentColor(sentiment)
                      }
                    }}
                  />
                </Box>
              ))}

              {/* Group Sentiment */}
              {comparison_group && comparison_group.total_text_responses > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mt: 2 }}>
                    Group Average:
                  </Typography>
                  {Object.entries(comparison_group.sentiment_distribution).map(([sentiment, count]) => (
                    <Box key={sentiment} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSentimentIcon(sentiment)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {sentiment}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {count} ({calculatePercentage(count, comparison_group.total_text_responses)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(calculatePercentage(count, comparison_group.total_text_responses))}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          backgroundColor: '#e0e0e0',
                          opacity: 0.7,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getSentimentColor(sentiment)
                          }
                        }}
                      />
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Topic Distribution - Only show if available */}
        {target.topic_distribution && Object.keys(target.topic_distribution).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TopicIcon sx={{ color: adminColors?.primary || '#633394' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Topic Distribution
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" paragraph>
                  AI-identified topics from your text responses using BERTopic
                </Typography>

                {Object.entries(target.topic_distribution).slice(0, 5).map(([topic, count]) => (
                  <Box key={topic} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        Topic {topic}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {count} responses
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(calculatePercentage(count, target.total_text_responses))}
                      sx={{
                        height: 6,
                        borderRadius: 1,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: adminColors?.primary || '#633394'
                        }
                      }}
                    />
                  </Box>
                ))}

                {Object.keys(target.topic_distribution).length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    + {Object.keys(target.topic_distribution).length - 5} more topics
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Individual Responses */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupWorkIcon sx={{ color: adminColors?.primary || '#633394' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Individual Text Responses ({target.responses?.length || 0})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {target.responses && target.responses.map((response, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {response.question_text || `Question ${response.question_id}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            icon={getSentimentIcon(response.sentiment)}
                            label={response.sentiment}
                            size="small"
                            sx={{
                              backgroundColor: `${getSentimentColor(response.sentiment)}20`,
                              color: getSentimentColor(response.sentiment),
                              textTransform: 'capitalize'
                            }}
                          />
                          {response.topic !== undefined && (
                            <Chip
                              label={`Topic ${response.topic}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {response.cluster !== undefined && (
                            <Chip
                              label={`Cluster ${response.cluster}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {response.answer}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TextAnalyticsDisplay;
