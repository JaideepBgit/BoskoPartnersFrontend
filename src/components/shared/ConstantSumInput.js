import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';

/**
 * FlexibleInput Component
 * 
 * A reusable input component that allows users to provide responses
 * across multiple categories with flexible input types.
 * 
 * @param {Object} props
 * @param {Array} props.categories - Array of category objects with {value, label}
 * @param {Object} props.values - Current input values {categoryValue: string}
 * @param {function} props.onChange - Callback when values change
 * @param {string} props.instructions - Optional instructions text
 * @param {boolean} props.disabled - Whether inputs are disabled
 * @param {boolean} props.required - Whether the question is required
 * @param {string} props.placeholder - Placeholder text for inputs
 */
const ConstantSumInput = ({
  categories = [],
  values = {},
  onChange,
  instructions = '',
  disabled = false,
  required = false,
  placeholder = 'Enter your response'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleValueChange = (categoryValue, inputValue) => {
    // Update the values object with the text input
    const newValues = {
      ...values,
      [categoryValue]: inputValue
    };
    
    onChange(newValues);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Instructions */}
      {instructions && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {instructions}
        </Typography>
      )}

      {/* Input Grid */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: isMobile ? 2 : 3, 
          mb: 2,
          backgroundColor: '#fafafa'
        }}
      >
        <Grid container spacing={2}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={4} key={category.value}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                >
                  {category.label}
                  {required && <span style={{ color: theme.palette.error.main }}>*</span>}
                </Typography>
                <TextField
                  type="text"
                  size="small"
                  value={values[category.value] || ''}
                  onChange={(e) => handleValueChange(category.value, e.target.value)}
                  disabled={disabled}
                  placeholder={placeholder}
                  inputProps={{
                    style: { 
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      }
                    }
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ConstantSumInput;