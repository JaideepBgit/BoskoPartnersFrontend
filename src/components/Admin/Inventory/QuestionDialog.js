import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid,
  IconButton,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Autocomplete,
  List,
  ListItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { QUESTION_TYPE_MAP, getQuestionTypeOptions } from '../../../config/questionTypes';
import TemplateUtils from './shared/TemplateUtils';

const QuestionDialog = ({ 
  open, 
  onClose, 
  onSave, 
  editingQuestion = null, 
  questionData, 
  setQuestionData,
  selectedTemplate 
}) => {
  const [availableQuestionTypes] = useState(getQuestionTypeOptions());
  const [questionConfig, setQuestionConfig] = useState({});
  const [configErrors, setConfigErrors] = useState({});

  // Initialize component state
  useEffect(() => {
    if (editingQuestion) {
      // Find the question type to get its configuration
      const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === editingQuestion.question_type_id);
      if (questionType) {
        setQuestionConfig(editingQuestion.config || {});
      }
    } else {
      // Reset for new question
      setQuestionConfig({});
    }
    setConfigErrors({});
  }, [editingQuestion, open]);

  // Initialize config when question type changes
  useEffect(() => {
    if (questionData.question_type_id && !editingQuestion) {
      const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === questionData.question_type_id);
      if (questionType) {
        setQuestionConfig({ ...questionType.config_schema });
      }
    }
  }, [questionData.question_type_id, editingQuestion]);

  const handleQuestionTypeChange = (typeId) => {
    setQuestionData(prev => ({ ...prev, question_type_id: typeId }));
    const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === typeId);
    if (questionType && !editingQuestion) {
      setQuestionConfig({ ...questionType.config_schema });
    }
  };

  const handleConfigChange = (key, value) => {
    setQuestionConfig(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear any errors for this field
    if (configErrors[key]) {
      setConfigErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateConfig = () => {
    const errors = {};
    const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === questionData.question_type_id);
    
    if (!questionType) return true;

    // Validate based on question type - updated for nine validated types
    switch (questionType.name) {
      case 'single_choice':
      case 'multi_select':
        if (!questionConfig.options || questionConfig.options.length === 0) {
          errors.options = 'At least one option is required';
        }
        break;
      case 'percentage':
        if (!questionConfig.items || questionConfig.items.length === 0) {
          errors.items = 'At least one item is required for percentage allocation';
        }
        break;
      case 'year_matrix':
        if (!questionConfig.rows || questionConfig.rows.length === 0) {
          errors.rows = 'At least one row is required for the matrix';
        }
        break;
      case 'numeric':
        if (questionConfig.min_value !== null && questionConfig.max_value !== null && 
            questionConfig.min_value >= questionConfig.max_value) {
          errors.range = 'Maximum value must be greater than minimum value';
        }
        break;
      default:
        break;
    }

    setConfigErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateConfig()) {
      return;
    }

    const finalQuestionData = {
      ...questionData,
      config: questionConfig
    };

    onSave(finalQuestionData);
  };

  const renderConfigFields = () => {
    const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === questionData.question_type_id);
    if (!questionType) return null;

    // Use the QuestionForm component logic instead of custom renderers
    // Import and use the configuration forms from QuestionForm component
    switch (questionType.name) {
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
      case 'year_matrix':
        return renderYearMatrixConfig();
      default:
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            Configuration options for {questionType.display_name} will be available in a future update.
          </Alert>
        );
    }
  };

  const renderShortTextConfig = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Short Text Configuration</Typography>
      <TextField
        fullWidth
        type="number"
        label="Maximum Length"
        value={questionConfig.max_length || 255}
        onChange={(e) => handleConfigChange('max_length', parseInt(e.target.value) || 255)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Placeholder Text"
        value={questionConfig.placeholder || ''}
        onChange={(e) => handleConfigChange('placeholder', e.target.value)}
        margin="normal"
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Validation</InputLabel>
        <Select
          value={questionConfig.validation || ''}
          onChange={(e) => handleConfigChange('validation', e.target.value)}
          label="Validation"
        >
          <MenuItem value="">None</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="number">Number</MenuItem>
          <MenuItem value="url">URL</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );

  const renderSingleChoiceConfig = () => {
    const options = questionConfig.options || [];

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
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Single Choice Configuration</Typography>
        
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Options</Typography>
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
        <Button 
          startIcon={<AddIcon />} 
          onClick={addOption}
          sx={{ mb: 2 }}
        >
          Add Option
        </Button>
        
        <FormControl fullWidth margin="normal">
          <FormControlLabel
            control={
              <Checkbox
                checked={questionConfig.allow_other || false}
                onChange={(e) => handleConfigChange('allow_other', e.target.checked)}
              />
            }
            label="Allow 'Other' option"
          />
        </FormControl>
        
        {questionConfig.allow_other && (
          <TextField
            fullWidth
            label="Other option text"
            value={questionConfig.other_text || 'Other (please specify)'}
            onChange={(e) => handleConfigChange('other_text', e.target.value)}
            margin="normal"
          />
        )}
      </Box>
    );
  };

  const renderYesNoConfig = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Yes/No Configuration</Typography>
      <TextField
        fullWidth
        label="Yes Label"
        value={questionConfig.yes_label || 'Yes'}
        onChange={(e) => handleConfigChange('yes_label', e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="No Label"
        value={questionConfig.no_label || 'No'}
        onChange={(e) => handleConfigChange('no_label', e.target.value)}
        margin="normal"
      />
    </Box>
  );

  const renderLikertConfig = () => {
    // Initialize default scale labels if not present
    const defaultLabels = {
      1: 'None',
      2: 'A little', 
      3: 'A moderate amount',
      4: 'A lot',
      5: 'A great deal'
    };
    
    const scaleLabels = questionConfig.scale_labels || defaultLabels;
    const useCustomLabels = questionConfig.use_custom_labels || false;

    const handleLabelChange = (point, value) => {
      const newLabels = {
        ...scaleLabels,
        [point]: value
      };
      handleConfigChange('scale_labels', newLabels);
    };

    const toggleCustomLabels = (enabled) => {
      handleConfigChange('use_custom_labels', enabled);
      if (!enabled) {
        // Reset to default labels when switching back to template
        handleConfigChange('scale_labels', defaultLabels);
      }
    };

    const resetToDefaults = () => {
      handleConfigChange('scale_labels', defaultLabels);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Likert Scale Configuration</Typography>
        
        <FormControl fullWidth margin="normal">
          <FormControlLabel
            control={
              <Checkbox
                checked={useCustomLabels}
                onChange={(e) => toggleCustomLabels(e.target.checked)}
              />
            }
            label="Use custom scale labels"
          />
        </FormControl>

        {!useCustomLabels && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Using template labels: "None" → "A little" → "A moderate amount" → "A lot" → "A great deal"
          </Alert>
        )}

        {useCustomLabels && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Custom Scale Labels</Typography>
              <Button 
                size="small" 
                onClick={resetToDefaults}
                sx={{ textTransform: 'none' }}
              >
                Reset to Template
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5].map((point) => (
                <Grid item xs={12} sm={6} md={4} key={point}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Scale Point ${point}`}
                    value={scaleLabels[point] || ''}
                    onChange={(e) => handleLabelChange(point, e.target.value)}
                    placeholder={defaultLabels[point]}
                    helperText={`Default: "${defaultLabels[point]}"`}
                  />
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Preview: 1 - {scaleLabels[1]} | 2 - {scaleLabels[2]} | 3 - {scaleLabels[3]} | 4 - {scaleLabels[4]} | 5 - {scaleLabels[5]}
            </Typography>
          </Box>
        )}

        <FormControl fullWidth margin="normal">
          <FormControlLabel
            control={
              <Checkbox
                checked={questionConfig.reverse_scale || false}
                onChange={(e) => handleConfigChange('reverse_scale', e.target.checked)}
              />
            }
            label="Reverse scale (5 to 1 instead of 1 to 5)"
          />
        </FormControl>

        {questionConfig.reverse_scale && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            With reverse scale enabled, the highest value (5) will be shown first and the lowest (1) last.
          </Alert>
        )}
      </Box>
    );
  };

  const renderMultiSelectConfig = () => {
    const options = questionConfig.options || [];

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
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Multiple Select Configuration</Typography>
        
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Options</Typography>
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
        <Button 
          startIcon={<AddIcon />} 
          onClick={addOption}
          sx={{ mb: 2 }}
        >
          Add Option
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Selections"
              value={questionConfig.min_selections || ''}
              onChange={(e) => handleConfigChange('min_selections', e.target.value ? parseInt(e.target.value) : null)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Selections"
              value={questionConfig.max_selections || ''}
              onChange={(e) => handleConfigChange('max_selections', e.target.value ? parseInt(e.target.value) : null)}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderParagraphConfig = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Paragraph Configuration</Typography>
      <TextField
        fullWidth
        type="number"
        label="Minimum Length"
        value={questionConfig.min_length || ''}
        onChange={(e) => handleConfigChange('min_length', e.target.value ? parseInt(e.target.value) : null)}
        margin="normal"
      />
      <TextField
        fullWidth
        type="number"
        label="Maximum Length"
        value={questionConfig.max_length || 2000}
        onChange={(e) => handleConfigChange('max_length', parseInt(e.target.value) || 2000)}
        margin="normal"
      />
      <FormControl fullWidth margin="normal">
        <FormControlLabel
          control={
            <Checkbox
              checked={questionConfig.character_counter !== false}
              onChange={(e) => handleConfigChange('character_counter', e.target.checked)}
            />
          }
          label="Show character counter"
        />
      </FormControl>
    </Box>
  );

  const renderNumericConfig = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Numeric Configuration</Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Number Type</InputLabel>
        <Select
          value={questionConfig.number_type || 'integer'}
          onChange={(e) => handleConfigChange('number_type', e.target.value)}
          label="Number Type"
        >
          <MenuItem value="integer">Integer</MenuItem>
          <MenuItem value="decimal">Decimal</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        type="number"
        label="Minimum Value"
        value={questionConfig.min_value || ''}
        onChange={(e) => handleConfigChange('min_value', e.target.value ? parseFloat(e.target.value) : null)}
        margin="normal"
      />
      <TextField
        fullWidth
        type="number"
        label="Maximum Value"
        value={questionConfig.max_value || ''}
        onChange={(e) => handleConfigChange('max_value', e.target.value ? parseFloat(e.target.value) : null)}
        margin="normal"
      />
    </Box>
  );

  const renderPercentageConfig = () => {
    const items = questionConfig.items || [];

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
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Percentage Allocation Configuration</Typography>
        
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Items to Allocate</Typography>
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
        <Button 
          startIcon={<AddIcon />} 
          onClick={addItem}
          sx={{ mb: 2 }}
        >
          Add Item
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Total Percentage"
              value={questionConfig.total_percentage || 100}
              onChange={(e) => handleConfigChange('total_percentage', parseInt(e.target.value) || 100)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={questionConfig.allow_decimals || false}
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

  const renderYearMatrixConfig = () => {
    const rows = questionConfig.rows || [];

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
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Year Matrix Configuration</Typography>
        
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Matrix Rows</Typography>
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
        <Button 
          startIcon={<AddIcon />} 
          onClick={addRow}
          sx={{ mb: 2 }}
        >
          Add Row
        </Button>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Start Year"
              value={questionConfig.start_year || new Date().getFullYear()}
              onChange={(e) => handleConfigChange('start_year', parseInt(e.target.value) || new Date().getFullYear())}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="End Year"
              value={questionConfig.end_year || new Date().getFullYear() + 5}
              onChange={(e) => handleConfigChange('end_year', parseInt(e.target.value) || new Date().getFullYear() + 5)}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Input Type</InputLabel>
              <Select
                value={questionConfig.input_type || 'numeric'}
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

  const selectedQuestionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === questionData.question_type_id);

  // Get existing sections from the current template
  const getExistingSections = () => {
    if (!selectedTemplate?.questions) return [];
    
    const sections = TemplateUtils.groupQuestionsBySection(selectedTemplate.questions);
    return Object.keys(sections).filter(section => section !== 'Uncategorized');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {editingQuestion ? 'Edit Question' : 'Add Question'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Question Text"
            multiline
            rows={3}
            value={questionData.question_text}
            onChange={(e) => setQuestionData(prev => ({ ...prev, question_text: e.target.value }))}
            margin="normal"
          />
          
          <Autocomplete
            fullWidth
            freeSolo
            options={getExistingSections()}
            value={questionData.section || ''}
            onChange={(event, newValue) => {
              setQuestionData(prev => ({ ...prev, section: newValue || '' }));
            }}
            onInputChange={(event, newInputValue) => {
              setQuestionData(prev => ({ ...prev, section: newInputValue || '' }));
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
                    ({selectedTemplate?.questions?.filter(q => q.section === option).length || 0} questions)
                  </Typography>
                </Box>
              </Box>
            )}
            sx={{ mt: 1 }}
          />

          {/* Question Type Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Question Type</InputLabel>
            <Select
              value={questionData.question_type_id}
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
              label="Question Type"
            >
              {availableQuestionTypes.map((type) => {
                const questionType = QUESTION_TYPE_MAP[type.value];
                return (
                  <MenuItem key={type.value} value={questionType.id}>
                    <Box>
                      <Typography variant="body1">{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Question Type Description */}
          {selectedQuestionType && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{selectedQuestionType.display_name}:</strong> {selectedQuestionType.description}
              </Typography>
            </Alert>
          )}

          {/* Dynamic Configuration Fields */}
          {questionData.question_type_id && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Configuration Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderConfigFields()}
              </AccordionDetails>
            </Accordion>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Order"
                value={questionData.order}
                onChange={(e) => setQuestionData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={questionData.is_required}
                    onChange={(e) => setQuestionData(prev => ({ ...prev, is_required: e.target.checked }))}
                  />
                }
                label="Required"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={!questionData.question_text || !questionData.question_type_id}
          sx={{ 
            backgroundColor: '#633394', 
            '&:hover': { backgroundColor: '#7c52a5' }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionDialog; 