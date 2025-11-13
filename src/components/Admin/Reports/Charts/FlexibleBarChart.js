import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import SurveyDataAnalyzer from '../../../../services/Admin/Reports/SurveyDataAnalyzer';

/**
 * Flexible bar chart that adapts to whatever numeric data is available
 * Works with any survey structure
 */
const FlexibleBarChart = ({ 
  title, 
  targetResponse,
  comparisonResponses,
  maxValue = null,
  height = 400,
  showComparison = true,
  fieldFilter = null // Optional: array of field keys to display
}) => {
  if (!targetResponse) {
    return (
      <Paper sx={{ p: 2, height: height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  // Analyze the target response and comparison group
  const comparison = showComparison && comparisonResponses && comparisonResponses.length > 0
    ? SurveyDataAnalyzer.compareWithSimilar(targetResponse, comparisonResponses)
    : null;

  const targetAnalysis = SurveyDataAnalyzer.analyzeSurveyResponse(targetResponse);
  
  // Get numeric fields to display
  let numericData = targetAnalysis.numeric;
  
  // Apply field filter if provided
  if (fieldFilter && Array.isArray(fieldFilter)) {
    numericData = Object.fromEntries(
      Object.entries(numericData).filter(([key]) => fieldFilter.includes(key))
    );
  }

  // If no numeric data, show message
  if (Object.keys(numericData).length === 0) {
    return (
      <Paper sx={{ p: 2, height: height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">
          No numeric data found in this survey response.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This survey may contain primarily text responses or structured data.
        </Typography>
      </Paper>
    );
  }

  // Calculate max value if not provided
  const calculatedMaxValue = maxValue || Math.max(
    ...Object.values(numericData),
    ...(comparison ? Object.values(comparison.group.statistics).map(s => s.max) : [])
  );

  const barHeight = 24;
  const labelWidth = 200;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Chip 
          label={`${Object.keys(numericData).length} numeric fields`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1.5,
        maxHeight: height - 120,
        overflowY: 'auto',
        pr: 1
      }}>
        {Object.entries(numericData).map(([key, value]) => {
          const comparisonData = comparison?.comparisons[key];
          const percentage = (value / calculatedMaxValue) * 100;
          const avgPercentage = comparisonData 
            ? (comparisonData.groupMean / calculatedMaxValue) * 100 
            : 0;
          
          return (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Label */}
              <Box sx={{ width: labelWidth, pr: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {SurveyDataAnalyzer.getFieldLabel(key)}
                </Typography>
              </Box>
              
              {/* Chart Area */}
              <Box sx={{ flex: 1, position: 'relative' }}>
                {/* Background bar */}
                <Box sx={{
                  width: '100%',
                  height: barHeight,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0'
                }}>
                  {/* Average bar (if comparison mode) */}
                  {showComparison && comparisonData && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${avgPercentage}%`,
                      height: '100%',
                      backgroundColor: '#90caf9',
                      opacity: 0.4,
                      borderRadius: 1
                    }} />
                  )}
                  
                  {/* Target value bar */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: comparisonData 
                      ? (comparisonData.isAboveAverage ? '#4caf50' : comparisonData.isBelowAverage ? '#ff9800' : '#2196f3')
                      : '#2196f3',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 1,
                    minWidth: '30px'
                  }}>
                    <Typography variant="caption" color="white" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {value.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Comparison info */}
                {showComparison && comparisonData && (
                  <Box sx={{ 
                    position: 'absolute', 
                    right: -80, 
                    top: 0, 
                    height: barHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minWidth: '75px'
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        color: comparisonData.isAboveAverage ? 'success.main' : comparisonData.isBelowAverage ? 'warning.main' : 'text.secondary',
                        fontWeight: 'bold'
                      }}
                    >
                      {comparisonData.isAboveAverage ? '↑' : comparisonData.isBelowAverage ? '↓' : '='} 
                      {Math.abs(comparisonData.difference).toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      avg: {comparisonData.groupMean.toFixed(1)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      
      {/* Legend */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
          {showComparison && comparison && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 12, backgroundColor: '#90caf9', opacity: 0.4, borderRadius: 1 }} />
                <Typography variant="caption">Group Average</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 12, backgroundColor: '#4caf50', borderRadius: 1 }} />
                <Typography variant="caption">Above Average</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 12, backgroundColor: '#ff9800', borderRadius: 1 }} />
                <Typography variant="caption">Below Average</Typography>
              </Box>
            </>
          )}
          {!showComparison && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 12, backgroundColor: '#2196f3', borderRadius: 1 }} />
              <Typography variant="caption">Response Value</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Summary statistics */}
      {showComparison && comparison && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            <strong>Summary:</strong> {comparison.strengths.length} fields above average, {comparison.improvements.length} below average
          </Typography>
          {comparison.strengths.length > 0 && (
            <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
              <strong>Top Strength:</strong> {SurveyDataAnalyzer.getFieldLabel(comparison.strengths[0].field)} 
              (+{comparison.strengths[0].difference.toFixed(1)})
            </Typography>
          )}
          {comparison.improvements.length > 0 && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
              <strong>Top Improvement Area:</strong> {SurveyDataAnalyzer.getFieldLabel(comparison.improvements[0].field)} 
              (-{comparison.improvements[0].difference.toFixed(1)})
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default FlexibleBarChart;
