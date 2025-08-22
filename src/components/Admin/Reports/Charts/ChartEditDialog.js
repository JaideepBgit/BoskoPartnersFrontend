import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import RadarIcon from '@mui/icons-material/Radar';

const ChartEditDialog = ({ 
  open, 
  onClose, 
  chartConfig, 
  onSave,
  surveyType = 'church' 
}) => {
  const [editConfig, setEditConfig] = useState({
    type: 'bar',
    title: '',
    selectedColumns: [],
    groupBy: '',
    aggregationType: 'average',
    showComparison: false
  });

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: <BarChartIcon /> },
    { value: 'line', label: 'Line Chart', icon: <TimelineIcon /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon /> },
    { value: 'radar', label: 'Radar Chart', icon: <RadarIcon /> }
  ];

  const aggregationTypes = [
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];

  // Initialize form with existing chart config
  useEffect(() => {
    if (chartConfig && open) {
      setEditConfig({
        type: chartConfig.type || 'bar',
        title: chartConfig.title || '',
        selectedColumns: chartConfig.selectedColumns || [],
        groupBy: chartConfig.groupBy || '',
        aggregationType: chartConfig.aggregationType || 'average',
        showComparison: chartConfig.showComparison || false
      });
    }
  }, [chartConfig, open]);

  // Get available columns based on survey type
  const getColumnsForSurveyType = () => {
    const baseColumns = [
      { id: 'country', label: 'Country', type: 'categorical' },
      { id: 'city', label: 'City', type: 'categorical' },
      { id: 'age_group', label: 'Age Group', type: 'categorical' },
      { id: 'education_level', label: 'Education Level', type: 'categorical' }
    ];

    const surveySpecificColumns = {
      church: [
        { id: 'years_as_pastor', label: 'Years as Pastor', type: 'categorical' },
        { id: 'training_institution', label: 'Training Institution', type: 'categorical' },
        { id: 'actea_accredited', label: 'ACTEA Accredited', type: 'categorical' },
        { id: 'preaching', label: 'Preaching Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'teaching', label: 'Teaching Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'evangelism', label: 'Evangelism Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'pastoral_care', label: 'Pastoral Care Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'counseling', label: 'Counseling Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'leadership_development', label: 'Leadership Development Score', type: 'numeric', parent: 'ministry_training_scores' }
      ],
      institution: [
        { id: 'years_as_president', label: 'Years as President', type: 'categorical' },
        { id: 'academic_qualification', label: 'Academic Qualification', type: 'categorical' },
        { id: 'establishment_year', label: 'Establishment Year', type: 'categorical' },
        { id: 'organizational_leadership_training', label: 'Organizational Leadership', type: 'numeric', parent: 'leadership_assessment' },
        { id: 'strategic_planning', label: 'Strategic Planning', type: 'numeric', parent: 'leadership_assessment' },
        { id: 'financial_management', label: 'Financial Management', type: 'numeric', parent: 'leadership_assessment' }
      ],
      nonFormal: [
        { id: 'years_in_ministry', label: 'Years in Ministry', type: 'categorical' },
        { id: 'primary_education_source', label: 'Primary Education Source', type: 'categorical' },
        { id: 'preaching', label: 'Preaching Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'teaching', label: 'Teaching Score', type: 'numeric', parent: 'ministry_training_scores' },
        { id: 'pastoral_care', label: 'Pastoral Care Score', type: 'numeric', parent: 'ministry_training_scores' }
      ]
    };

    return [...baseColumns, ...(surveySpecificColumns[surveyType] || [])];
  };

  const availableColumnsForType = getColumnsForSurveyType();
  const numericColumns = availableColumnsForType.filter(col => col.type === 'numeric');
  const categoricalColumns = availableColumnsForType.filter(col => col.type === 'categorical');

  const handleColumnToggle = (columnId) => {
    setEditConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnId)
        ? prev.selectedColumns.filter(id => id !== columnId)
        : [...prev.selectedColumns, columnId]
    }));
  };

  const handleSave = () => {
    const updatedChart = {
      ...chartConfig,
      ...editConfig,
      title: editConfig.title || `${editConfig.type.charAt(0).toUpperCase() + editConfig.type.slice(1)} Chart`,
      columns: availableColumnsForType.filter(col => 
        editConfig.selectedColumns.includes(col.id)
      )
    };
    
    onSave(updatedChart);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!chartConfig) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Chart Configuration</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Left Column - Basic Configuration */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Chart Settings
            </Typography>
            
            {/* Chart Type Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={editConfig.type}
                label="Chart Type"
                onChange={(e) => setEditConfig(prev => ({ ...prev, type: e.target.value }))}
              >
                {chartTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Chart Title */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <input
                type="text"
                placeholder="Chart Title"
                value={editConfig.title}
                onChange={(e) => setEditConfig(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </FormControl>

            {/* Group By Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Group By (optional)</InputLabel>
              <Select
                value={editConfig.groupBy}
                label="Group By (optional)"
                onChange={(e) => setEditConfig(prev => ({ ...prev, groupBy: e.target.value }))}
              >
                <MenuItem value="">No Grouping</MenuItem>
                {categoricalColumns.map((column) => (
                  <MenuItem key={column.id} value={column.id}>
                    {column.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Aggregation Type */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Aggregation</InputLabel>
              <Select
                value={editConfig.aggregationType}
                label="Aggregation"
                onChange={(e) => setEditConfig(prev => ({ ...prev, aggregationType: e.target.value }))}
              >
                {aggregationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Options */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editConfig.showComparison}
                    onChange={(e) => setEditConfig(prev => ({ 
                      ...prev, 
                      showComparison: e.target.checked 
                    }))}
                  />
                }
                label="Show Comparison"
              />
            </FormGroup>
          </Grid>

          {/* Right Column - Data Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Data Columns
            </Typography>
            
            {/* Numeric Columns Selection */}
            <Typography variant="subtitle2" gutterBottom>
              Select columns to analyze:
            </Typography>
            <FormGroup sx={{ 
              mb: 2, 
              maxHeight: 250, 
              overflowY: 'auto', 
              border: '1px solid #e0e0e0', 
              borderRadius: 1, 
              p: 1 
            }}>
              {numericColumns.map((column) => (
                <FormControlLabel
                  key={column.id}
                  control={
                    <Checkbox
                      checked={editConfig.selectedColumns.includes(column.id)}
                      onChange={() => handleColumnToggle(column.id)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {column.label}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>

            {/* Selected Columns Summary */}
            {editConfig.selectedColumns.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Selected ({editConfig.selectedColumns.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {editConfig.selectedColumns.map((columnId) => {
                    const column = availableColumnsForType.find(col => col.id === columnId);
                    return (
                      <Chip
                        key={columnId}
                        label={column?.label || columnId}
                        size="small"
                        onDelete={() => handleColumnToggle(columnId)}
                        deleteIcon={<CloseIcon />}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={<SaveIcon />}
          disabled={editConfig.selectedColumns.length === 0}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChartEditDialog;
