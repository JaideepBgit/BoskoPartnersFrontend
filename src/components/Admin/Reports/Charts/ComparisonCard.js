import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Chip,
  LinearProgress 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const ComparisonCard = ({ 
  title, 
  targetResponse, 
  comparisonStats, 
  height = 400 
}) => {
  if (!comparisonStats || !targetResponse) {
    return (
      <Paper sx={{ p: 2, height: height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No comparison data available</Typography>
      </Paper>
    );
  }

  const { 
    betterThanAverage, 
    worseThanAverage, 
    equalToAverage, 
    totalCategories,
    strengthAreas,
    improvementAreas 
  } = comparisonStats;

  const strengthPercentage = totalCategories > 0 ? (betterThanAverage / totalCategories) * 100 : 0;
  const improvementPercentage = totalCategories > 0 ? (worseThanAverage / totalCategories) * 100 : 0;

  return (
    <Paper sx={{ p: 2, height: height }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      {/* Target Response Info */}
      <Card sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            Analyzing: {getResponseDisplayName(targetResponse)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {targetResponse.city}, {targetResponse.country}
          </Typography>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Performance Overview</Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            icon={<TrendingUpIcon />}
            label={`${betterThanAverage} Above Average`}
            color="success"
            size="small"
          />
          <Chip 
            icon={<TrendingDownIcon />}
            label={`${worseThanAverage} Below Average`}
            color="warning"
            size="small"
          />
          <Chip 
            icon={<TrendingFlatIcon />}
            label={`${equalToAverage} At Average`}
            color="default"
            size="small"
          />
        </Box>

        {/* Performance Bar */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" gutterBottom>
            Strength Distribution
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={strengthPercentage} 
            color="success"
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {strengthPercentage.toFixed(1)}% of areas above average
          </Typography>
        </Box>
      </Box>

      {/* Top Strengths */}
      {strengthAreas.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="success.main">
            Top Strengths (vs Average)
          </Typography>
          <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
            {strengthAreas.slice(0, 5).map((area, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 0.5,
                borderBottom: index < strengthAreas.slice(0, 5).length - 1 ? 1 : 0,
                borderColor: 'divider'
              }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formatCategoryName(area.category)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="success.main">
                    +{area.difference.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({area.targetScore.toFixed(1)})
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Areas for Improvement */}
      {improvementAreas.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom color="warning.main">
            Areas for Improvement
          </Typography>
          <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
            {improvementAreas.slice(0, 5).map((area, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 0.5,
                borderBottom: index < improvementAreas.slice(0, 5).length - 1 ? 1 : 0,
                borderColor: 'divider'
              }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formatCategoryName(area.category)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="warning.main">
                    -{area.difference.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({area.targetScore.toFixed(1)})
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

const getResponseDisplayName = (response) => {
  if (response.survey_type === 'church') {
    return response.pastor_name || response.church_name;
  } else if (response.survey_type === 'institution') {
    return response.president_name || response.institution_name;
  } else if (response.survey_type === 'non_formal') {
    return response.leader_name || response.ministry_name;
  }
  return 'Unknown';
};

const formatCategoryName = (category) => {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/And/g, '&');
};

export default ComparisonCard;
