import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Autocomplete
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { QUESTION_TYPE_MAP } from '../../../config/questionTypes';
import QuestionTypeSelector from './QuestionTypeSelector';
import ConstantSumInput from '../../shared/ConstantSumInput';

/**
 * QuestionForm Component
 * 
 * Form for creating and editing questions with the nine validated question types.
 * Dynamically renders configuration options based on selected question type.
 * 
 * @param {Object} props
 * @param {Object} props.questionData - Current question data
 * @param {function} props.onChange - Callback when question data changes
 * @param {boolean} props.isEditing - Whether in edit mode
 * @param {Array} props.existingSections - Existing section names for autocomplete
 */
const QuestionForm = ({ 
  questionData = {}, 
  onChange, 
  isEditing = false,
  existingSections = []
}) => {
  const [localConfig, setLocalConfig] = useState(questionData.config || {});

  useEffect(() => {
    setLocalConfig(questionData.config || {});
  }, [questionData.config]);

  const handleBasicChange = (field, value) => {
    onChange({
      ...questionData,
      [field]: value
    });
  };

  const handleConfigChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onChange({
      ...questionData,
      config: newConfig
    });
  };

  const renderConfigForm = () => {
    const questionType = QUESTION_TYPE_MAP[questionData.type];
    if (!questionType) {
      console.log('No question type found for:', questionData.type);
      return null;
    }

    console.log('Rendering config for type:', questionData.type);

    switch (questionData.type) {
      case 'short_text':
        return renderShortTextConfig();
      case 'single_choice':
        return renderSingleChoiceConfig();
      case 'yes_no':
        return renderYesNoConfig();
      case 'likert5':
        return renderLikertConfig();
      case 'multi_select':
        return renderMultiSelectConfig();
      case 'paragraph':
        return renderParagraphConfig();
      case 'numeric':
        return renderNumericConfig();
      case 'percentage':
        return renderPercentageConfig();
      case 'flexible_input':
        console.log('Rendering flexible input config');
        return renderFlexibleInputConfig();
      case 'year_matrix':
        return renderYearMatrixConfig();
      default:
        console.log('Unknown question type:', questionData.type);
        return null;
    }
  };

  const renderShortTextConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Length"
          value={localConfig.max_length || 255}
          onChange={(e) => handleConfigChange('max_length', parseInt(e.target.value) || 255)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Placeholder Text"
          value={localConfig.placeholder || ''}
          onChange={(e) => handleConfigChange('placeholder', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Validation</InputLabel>
          <Select
            value={localConfig.validation || ''}
            onChange={(e) => handleConfigChange('validation', e.target.value)}
            label="Validation"
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="url">URL</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderSingleChoiceConfig = () => {
    const options = localConfig.options || [];

    const addOption = () => {
      const newOptions = [...options, { value: `option_${options.length + 1}`, label: '' }];
      handleConfigChange('options', newOptions);
    };

    const updateOption = (index, field, value) => {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      handleConfigChange('options', newOptions);
    };

    const deleteOption = (index) => {
      const newOptions = options.filter((_, i) => i !== index);
      handleConfigChange('options', newOptions);
    };

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>Options</Typography>
        <List>
          {options.map((option, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={option.value}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteOption(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button startIcon={<AddIcon />} onClick={addOption}>
          Add Option
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localConfig.allow_other || false}
                  onChange={(e) => handleConfigChange('allow_other', e.target.checked)}
                />
              }
              label="Allow 'Other' option"
            />
          </Grid>
          {localConfig.allow_other && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Other option text"
                value={localConfig.other_text || 'Other (please specify)'}
                onChange={(e) => handleConfigChange('other_text', e.target.value)}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  const renderYesNoConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Yes Label"
          value={localConfig.yes_label || 'Yes'}
          onChange={(e) => handleConfigChange('yes_label', e.target.value)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="No Label"
          value={localConfig.no_label || 'No'}
          onChange={(e) => handleConfigChange('no_label', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderLikertConfig = () => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>Scale Labels</Typography>
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Grid item xs={12} key={num}>
            <TextField
              fullWidth
              size="small"
              label={`Point ${num}`}
              value={localConfig.scale_labels?.[num] || ''}
              onChange={(e) => handleConfigChange('scale_labels', {
                ...localConfig.scale_labels,
                [num]: e.target.value
              })}
            />
          </Grid>
        ))}
      </Grid>
      <FormControlLabel
        control={
          <Checkbox
            checked={localConfig.reverse_scale || false}
            onChange={(e) => handleConfigChange('reverse_scale', e.target.checked)}
          />
        }
        label="Reverse scale (5 to 1)"
        sx={{ mt: 2 }}
      />
    </Box>
  );

  const renderMultiSelectConfig = () => {
    const options = localConfig.options || [];

    const addOption = () => {
      const newOptions = [...options, { value: `option_${options.length + 1}`, label: '' }];
      handleConfigChange('options', newOptions);
    };

    const updateOption = (index, field, value) => {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      handleConfigChange('options', newOptions);
    };

    const deleteOption = (index) => {
      const newOptions = options.filter((_, i) => i !== index);
      handleConfigChange('options', newOptions);
    };

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>Options</Typography>
        <List>
          {options.map((option, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={option.value}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteOption(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button startIcon={<AddIcon />} onClick={addOption}>
          Add Option
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Selections"
              value={localConfig.min_selections || ''}
              onChange={(e) => handleConfigChange('min_selections', e.target.value ? parseInt(e.target.value) : null)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Selections"
              value={localConfig.max_selections || ''}
              onChange={(e) => handleConfigChange('max_selections', e.target.value ? parseInt(e.target.value) : null)}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderParagraphConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Minimum Length"
          value={localConfig.min_length || ''}
          onChange={(e) => handleConfigChange('min_length', e.target.value ? parseInt(e.target.value) : null)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Length"
          value={localConfig.max_length || 2000}
          onChange={(e) => handleConfigChange('max_length', parseInt(e.target.value) || 2000)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Placeholder Text"
          value={localConfig.placeholder || ''}
          onChange={(e) => handleConfigChange('placeholder', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={localConfig.character_counter !== false}
              onChange={(e) => handleConfigChange('character_counter', e.target.checked)}
            />
          }
          label="Show character counter"
        />
      </Grid>
    </Grid>
  );

  const renderNumericConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Number Type</InputLabel>
          <Select
            value={localConfig.number_type || 'integer'}
            onChange={(e) => handleConfigChange('number_type', e.target.value)}
            label="Number Type"
          >
            <MenuItem value="integer">Integer</MenuItem>
            <MenuItem value="decimal">Decimal</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Minimum Value"
          value={localConfig.min_value || ''}
          onChange={(e) => handleConfigChange('min_value', e.target.value ? parseFloat(e.target.value) : null)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Value"
          value={localConfig.max_value || ''}
          onChange={(e) => handleConfigChange('max_value', e.target.value ? parseFloat(e.target.value) : null)}
        />
      </Grid>
      {localConfig.number_type === 'decimal' && (
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="number"
            label="Decimal Places"
            value={localConfig.decimal_places || 2}
            onChange={(e) => handleConfigChange('decimal_places', parseInt(e.target.value) || 2)}
          />
        </Grid>
      )}
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Unit Label (e.g., kg, $, %)"
          value={localConfig.unit_label || ''}
          onChange={(e) => handleConfigChange('unit_label', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderPercentageConfig = () => {
    const items = localConfig.items || [];

    const addItem = () => {
      const newItems = [...items, { value: `item_${items.length + 1}`, label: '' }];
      handleConfigChange('items', newItems);
    };

    const updateItem = (index, field, value) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      handleConfigChange('items', newItems);
    };

    const deleteItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      handleConfigChange('items', newItems);
    };

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>Items to Allocate</Typography>
        <List>
          {items.map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={item.value}
                    onChange={(e) => updateItem(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteItem(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button startIcon={<AddIcon />} onClick={addItem}>
          Add Item
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Total Percentage"
              value={localConfig.total_percentage || 100}
              onChange={(e) => handleConfigChange('total_percentage', parseInt(e.target.value) || 100)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localConfig.allow_decimals || false}
                  onChange={(e) => handleConfigChange('allow_decimals', e.target.checked)}
                />
              }
              label="Allow decimals"
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderFlexibleInputConfig = () => {
    console.log('renderFlexibleInputConfig called with localConfig:', localConfig);
    const items = localConfig.items || [];
    console.log('Items:', items);

    const addItem = () => {
      const newItems = [...items, { value: `item_${items.length + 1}`, label: '' }];
      console.log('Adding item, new items:', newItems);
      handleConfigChange('items', newItems);
    };

    const updateItem = (index, field, value) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      handleConfigChange('items', newItems);
    };

    const deleteItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      handleConfigChange('items', newItems);
    };

    // Sample values for preview
    const sampleValues = {};
    items.forEach((item, index) => {
      sampleValues[item.value] = `Sample response ${index + 1}`;
    });

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>Categories to Allocate Points</Typography>
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
            No categories added yet. Click "Add Category" to create categories for point allocation.
          </Typography>
        )}
        <List>
          {items.map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={item.value}
                    onChange={(e) => updateItem(index, 'value', e.target.value)}
                    placeholder="category_1"
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    placeholder="Category Name"
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteItem(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button 
          startIcon={<AddIcon />} 
          onClick={addItem}
          variant="outlined"
          sx={{ mt: 1, mb: 2 }}
        >
          Add Category
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              value={localConfig.instructions || ''}
              onChange={(e) => handleConfigChange('instructions', e.target.value)}
              placeholder="e.g., 'Please provide your response for each item below'"
              helperText="Instructions for respondents"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Placeholder Text"
              value={localConfig.placeholder || ''}
              onChange={(e) => handleConfigChange('placeholder', e.target.value)}
              placeholder="e.g., 'Enter your response'"
              helperText="Placeholder text shown in input fields"
            />
          </Grid>
        </Grid>

        {/* Preview Section */}
        {items.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#633394', fontWeight: 600 }}>
              Preview:
            </Typography>
            {ConstantSumInput ? (
              <ConstantSumInput
                categories={items}
                values={sampleValues}
                onChange={() => {}} // Read-only preview
                instructions={localConfig.instructions}
                placeholder={localConfig.placeholder || 'Enter your response'}
                disabled={true}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Preview not available - FlexibleInput component not found
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderYearMatrixConfig = () => {
    const rows = localConfig.rows || [];

    const addRow = () => {
      const newRows = [...rows, { value: `row_${rows.length + 1}`, label: '' }];
      handleConfigChange('rows', newRows);
    };

    const updateRow = (index, field, value) => {
      const newRows = [...rows];
      newRows[index] = { ...newRows[index], [field]: value };
      handleConfigChange('rows', newRows);
    };

    const deleteRow = (index) => {
      const newRows = rows.filter((_, i) => i !== index);
      handleConfigChange('rows', newRows);
    };

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>Matrix Rows</Typography>
        <List>
          {rows.map((row, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={row.value}
                    onChange={(e) => updateRow(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={row.label}
                    onChange={(e) => updateRow(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteRow(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button startIcon={<AddIcon />} onClick={addRow}>
          Add Row
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Start Year"
              value={localConfig.start_year || new Date().getFullYear()}
              onChange={(e) => handleConfigChange('start_year', parseInt(e.target.value) || new Date().getFullYear())}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="End Year"
              value={localConfig.end_year || new Date().getFullYear() + 5}
              onChange={(e) => handleConfigChange('end_year', parseInt(e.target.value) || new Date().getFullYear() + 5)}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Input Type</InputLabel>
              <Select
                value={localConfig.input_type || 'numeric'}
                onChange={(e) => handleConfigChange('input_type', e.target.value)}
                label="Input Type"
              >
                <MenuItem value="numeric">Numeric</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="dropdown">Dropdown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Basic Question Fields */}
      <TextField
        fullWidth
        label="Question Text"
        multiline
        rows={3}
        value={questionData.text || ''}
        onChange={(e) => handleBasicChange('text', e.target.value)}
        margin="normal"
        required
      />

      <Autocomplete
        fullWidth
        freeSolo
        options={existingSections}
        value={questionData.section || ''}
        onChange={(event, newValue) => {
          handleBasicChange('section', newValue || '');
        }}
        onInputChange={(event, newInputValue) => {
          handleBasicChange('section', newInputValue || '');
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Section"
            margin="normal"
            placeholder="Enter section name or select existing"
            helperText="Type a new section name or select from existing sections"
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography variant="body2">{option}</Typography>
              <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                Existing section
              </Typography>
            </Box>
          </Box>
        )}
        sx={{ mt: 1 }}
      />

      <QuestionTypeSelector
        value={questionData.type || ''}
        onChange={(type) => handleBasicChange('type', type)}
        required
      />

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="number"
            label="Order"
            value={questionData.order || 0}
            onChange={(e) => handleBasicChange('order', parseInt(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={questionData.required || false}
                onChange={(e) => handleBasicChange('required', e.target.checked)}
              />
            }
            label="Required"
            sx={{ mt: 2 }}
          />
        </Grid>
      </Grid>

      {/* Type-specific Configuration */}
      {questionData.type && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Configuration Options</Typography>
          {renderConfigForm()}
        </Box>
      )}
    </Box>
  );
};

export default QuestionForm; 