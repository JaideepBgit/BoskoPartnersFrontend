import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { QUESTION_TYPE_MAP, getQuestionTypeOptions } from '../../../config/questionTypes';

/**
 * QuestionTypeSelector Component
 * 
 * Renders a dropdown selector for the nine validated question types.
 * Each option shows the display name and description.
 * 
 * @param {Object} props
 * @param {string} props.value - Currently selected question type
 * @param {function} props.onChange - Callback when selection changes
 * @param {boolean} props.required - Whether selection is required
 * @param {string} props.label - Custom label for the selector
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {boolean} props.showDescription - Whether to show type descriptions
 */
const QuestionTypeSelector = ({ 
  value = '', 
  onChange, 
  required = false, 
  label = 'Question Type',
  disabled = false,
  showDescription = true 
}) => {
  const questionTypeOptions = getQuestionTypeOptions();
  const selectedType = QUESTION_TYPE_MAP[value];

  const handleChange = (event) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <Box>
      <FormControl fullWidth margin="normal" required={required}>
        <InputLabel id="question-type-selector-label">{label}</InputLabel>
        <Select
          labelId="question-type-selector-label"
          value={value}
          label={label}
          onChange={handleChange}
          disabled={disabled}
        >
          {questionTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {option.label}
                </Typography>
                {showDescription && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {option.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {selectedType && (
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={`Core Questions`} 
            size="small" 
            sx={{ 
              backgroundColor: '#e3f2fd', 
              color: '#1976d2',
              fontSize: '0.75rem'
            }} 
          />
          {showDescription && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedType.description}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default QuestionTypeSelector; 