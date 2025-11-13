import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SurveyDataAnalyzer from '../../../../services/Admin/Reports/SurveyDataAnalyzer';

/**
 * Display text/qualitative responses from surveys
 */
const FlexibleTextDisplay = ({ 
  title = "Text Responses",
  targetResponse,
  showAllFields = false,
  minTextLength = 20,
  maxPreviewLength = 150
}) => {
  const [expandedFields, setExpandedFields] = useState(new Set());

  if (!targetResponse) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const analysis = SurveyDataAnalyzer.analyzeSurveyResponse(targetResponse);
  
  // Filter text fields by length if needed
  const textFields = Object.entries(analysis.text).filter(([_, value]) => {
    if (!showAllFields && typeof value === 'string') {
      return value.length >= minTextLength;
    }
    return true;
  });

  // Also include objects for display
  const objectFields = Object.entries(analysis.objects);

  if (textFields.length === 0 && objectFields.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">
          No text responses found in this survey.
        </Typography>
      </Paper>
    );
  }

  const toggleExpanded = (key) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedFields(newExpanded);
  };

  const renderTextValue = (key, value) => {
    if (typeof value !== 'string') return null;

    const isLong = value.length > maxPreviewLength;
    const isExpanded = expandedFields.has(key);
    const displayText = isLong && !isExpanded 
      ? value.substring(0, maxPreviewLength) + '...' 
      : value;

    return (
      <Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {displayText}
        </Typography>
        {isLong && (
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', mt: 1, display: 'block', fontWeight: 'bold' }}
            onClick={() => toggleExpanded(key)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Typography>
        )}
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Chip 
            label={`${value.length} characters`} 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label={`${value.split(/\s+/).length} words`} 
            size="small" 
            variant="outlined"
          />
        </Box>
      </Box>
    );
  };

  const renderObjectValue = (obj) => {
    return (
      <Box sx={{ pl: 2 }}>
        {Object.entries(obj).map(([subKey, subValue]) => (
          <Box key={subKey} sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              {SurveyDataAnalyzer.getFieldLabel(subKey)}:
            </Typography>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {typeof subValue === 'object' ? JSON.stringify(subValue, null, 2) : String(subValue)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Chip 
          label={`${textFields.length + objectFields.length} fields`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Text Fields */}
        {textFields.map(([key, value]) => (
          <Card key={key} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                {SurveyDataAnalyzer.getFieldLabel(key)}
              </Typography>
              {renderTextValue(key, value)}
            </CardContent>
          </Card>
        ))}

        {/* Object Fields */}
        {objectFields.map(([key, value]) => (
          <Accordion key={key}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {SurveyDataAnalyzer.getFieldLabel(key)}
                </Typography>
                <Chip 
                  label={`${Object.keys(value).length} items`} 
                  size="small" 
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {renderObjectValue(value)}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Summary */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Summary:</strong> {textFields.length} text responses, {objectFields.length} structured responses
        </Typography>
      </Box>
    </Paper>
  );
};

export default FlexibleTextDisplay;
