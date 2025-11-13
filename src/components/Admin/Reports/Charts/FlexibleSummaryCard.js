import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DataObjectIcon from '@mui/icons-material/DataObject';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SurveyDataAnalyzer from '../../../../services/Admin/Reports/SurveyDataAnalyzer';

/**
 * Summary card showing overview of survey response data
 */
const FlexibleSummaryCard = ({ 
  targetResponse,
  comparisonResponses = null,
  showComparison = false
}) => {
  if (!targetResponse) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Survey Summary</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const analysis = SurveyDataAnalyzer.analyzeSurveyResponse(targetResponse);
  const comparison = showComparison && comparisonResponses && comparisonResponses.length > 0
    ? SurveyDataAnalyzer.compareWithSimilar(targetResponse, comparisonResponses)
    : null;

  const StatBox = ({ icon, label, value, color = 'primary', subtitle = null }) => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      p: 2,
      backgroundColor: '#f5f5f5',
      borderRadius: 2,
      border: '1px solid #e0e0e0'
    }}>
      <Box sx={{ color: `${color}.main`, mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Survey Response Summary
      </Typography>

      {/* Basic Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatBox
            icon={<AssessmentIcon fontSize="large" />}
            label="Numeric Fields"
            value={analysis.metadata.numericCount}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBox
            icon={<TextFieldsIcon fontSize="large" />}
            label="Text Responses"
            value={analysis.metadata.textCount}
            color="secondary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBox
            icon={<DataObjectIcon fontSize="large" />}
            label="Structured Data"
            value={analysis.metadata.objectCount}
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBox
            icon={<AssessmentIcon fontSize="large" />}
            label="Total Fields"
            value={analysis.metadata.totalFields}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Comparison Statistics */}
      {showComparison && comparison && (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
            Comparison with {comparisonResponses.length} Similar Surveys
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#e8f5e9', 
                borderRadius: 2,
                border: '1px solid #4caf50'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUpIcon sx={{ color: 'success.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    Strengths
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                  {comparison.strengths.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fields above group average
                </Typography>
                {comparison.strengths.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`Top: ${SurveyDataAnalyzer.getFieldLabel(comparison.strengths[0].field)}`}
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#fff3e0', 
                borderRadius: 2,
                border: '1px solid #ff9800'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingDownIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    Improvement Areas
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                  {comparison.improvements.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fields below group average
                </Typography>
                {comparison.improvements.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`Focus: ${SurveyDataAnalyzer.getFieldLabel(comparison.improvements[0].field)}`}
                      size="small"
                      color="warning"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      )}

      {/* Response Info */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Response ID:</strong> {targetResponse.id} | 
          <strong> Date:</strong> {targetResponse.response_date ? new Date(targetResponse.response_date).toLocaleDateString() : 'N/A'}
          {targetResponse.survey_type && (
            <> | <strong> Type:</strong> {targetResponse.survey_type}</>
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default FlexibleSummaryCard;
