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
  List,
  ListItem,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
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
  const [existingSections, setExistingSections] = useState([]);

  // Initialize component state
  useEffect(() => {
    if (editingQuestion) {
      const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === editingQuestion.question_type_id);
      if (questionType) {
        setQuestionConfig(editingQuestion.config || {});
      }
    } else {
      setQuestionConfig({});
    }
    
    // Load existing sections from the template
    if (selectedTemplate && open) {
      const sectionOrder = selectedTemplate.sections || {};
      const sections = TemplateUtils.getExistingSections(selectedTemplate.questions, sectionOrder);
      setExistingSections(sections);
    }
  }, [editingQuestion, open, selectedTemplate]);

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
  };

  const handleSave = () => {
    const finalQuestionData = {
      ...questionData,
      config: questionConfig
    };
    onSave(finalQuestionData);
  };

  const renderConfigFields = () => {
    const questionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === questionData.question_type_id);
    if (!questionType) return null;

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
        return null;
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

    const removeOption = (index) => {
      const newOptions = options.filter((_, i) => i !== index);
      handleConfigChange('options', newOptions);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Single Choice Configuration</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Options:</Typography>
        
        <List>
          {options.map((option, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={option.value || ''}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={option.label || ''}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={() => removeOption(index)} size="small">
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

  const renderLikertConfig = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Five-Point Likert Scale Configuration</Typography>
      <Typography variant="body2" color="text.secondary">
        Standard scale: 1 - None, 2 - A little, 3 - A moderate amount, 4 - A lot, 5 - A great deal
      </Typography>
    </Box>
  );

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

    const removeOption = (index) => {
      const newOptions = options.filter((_, i) => i !== index);
      handleConfigChange('options', newOptions);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Multiple Select Configuration</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Options:</Typography>
        
        <List>
          {options.map((option, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={option.value || ''}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={option.label || ''}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={() => removeOption(index)} size="small">
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
      </Box>
    );
  };

  const renderParagraphConfig = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Paragraph Configuration</Typography>
      <TextField
        fullWidth
        type="number"
        label="Maximum Length"
        value={questionConfig.max_length || 2000}
        onChange={(e) => handleConfigChange('max_length', parseInt(e.target.value) || 2000)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Placeholder Text"
        value={questionConfig.placeholder || ''}
        onChange={(e) => handleConfigChange('placeholder', e.target.value)}
        margin="normal"
      />
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

    const removeItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      handleConfigChange('items', newItems);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Percentage Configuration</Typography>
        <TextField
          fullWidth
          type="number"
          label="Total Percentage"
          value={questionConfig.total_percentage || 100}
          onChange={(e) => handleConfigChange('total_percentage', parseInt(e.target.value) || 100)}
          margin="normal"
        />
        
        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Items:</Typography>
        <List>
          {items.map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={item.value || ''}
                    onChange={(e) => updateItem(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={item.label || ''}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={() => removeItem(index)} size="small">
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

    const removeRow = (index) => {
      const newRows = rows.filter((_, i) => i !== index);
      handleConfigChange('rows', newRows);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Year Matrix Configuration</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Start Year"
              value={questionConfig.start_year || 2024}
              onChange={(e) => handleConfigChange('start_year', parseInt(e.target.value) || 2024)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="End Year"
              value={questionConfig.end_year || 2029}
              onChange={(e) => handleConfigChange('end_year', parseInt(e.target.value) || 2029)}
            />
          </Grid>
        </Grid>
        
        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Rows:</Typography>
        <List>
          {rows.map((row, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={row.value || ''}
                    onChange={(e) => updateRow(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label"
                    value={row.label || ''}
                    onChange={(e) => updateRow(index, 'label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={() => removeRow(index)} size="small">
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
      </Box>
    );
  };

  // const selectedQuestionType = Object.values(QUESTION_TYPE_MAP).find(type => type.id === questionData.question_type_id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingQuestion ? 'Edit Question' : 'Add New Question'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Question Text"
          fullWidth
          variant="outlined"
          value={questionData.question_text}
          onChange={(e) => setQuestionData(prev => ({ ...prev, question_text: e.target.value }))}
          multiline
          rows={3}
        />

        <Autocomplete
          fullWidth
          freeSolo
          options={existingSections}
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

        <TextField
          margin="normal"
          label="Order"
          type="number"
          fullWidth
          variant="outlined"
          value={questionData.order}
          onChange={(e) => setQuestionData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={questionData.is_required}
              onChange={(e) => setQuestionData(prev => ({ ...prev, is_required: e.target.checked }))}
            />
          }
          label="Required"
          sx={{ mt: 2 }}
        />

        {/* Configuration Fields */}
        {questionData.question_type_id && renderConfigFields()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {editingQuestion ? 'Update' : 'Add'} Question
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionDialog; 