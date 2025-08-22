import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import RadarIcon from '@mui/icons-material/Radar';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const ChartSelectorCard = ({ 
  onCreateChart, 
  availableColumns = {},
  surveyType = 'church',
  isExpanded = false,
  onToggleExpand
}) => {
  const [chartConfig, setChartConfig] = useState({
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
    setChartConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnId)
        ? prev.selectedColumns.filter(id => id !== columnId)
        : [...prev.selectedColumns, columnId]
    }));
  };

  const handleCreateChart = () => {
    if (chartConfig.selectedColumns.length === 0) {
      alert('Please select at least one column to analyze');
      return;
    }

    const chartData = {
      ...chartConfig,
      id: Date.now(), // Simple ID generation
      title: chartConfig.title || `${chartConfig.type.charAt(0).toUpperCase() + chartConfig.type.slice(1)} Chart`,
      columns: availableColumnsForType.filter(col => 
        chartConfig.selectedColumns.includes(col.id)
      )
    };

    onCreateChart(chartData);
    
    // Reset form
    setChartConfig({
      type: 'bar',
      title: '',
      selectedColumns: [],
      groupBy: '',
      aggregationType: 'average',
      showComparison: false
    });
  };

  if (!isExpanded) {
    return (
      <Card sx={{ 
        width: '100%',
        boxShadow: 2
      }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                Chart Builder
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create custom charts with your data
              </Typography>
            </Box>
            <Tooltip title="Create Custom Chart">
              <IconButton onClick={onToggleExpand} color="primary" size="large">
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      width: '100%',
      maxHeight: '70vh',
      overflowY: 'auto',
      boxShadow: 2
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Chart Builder Configuration
          </Typography>
          <IconButton onClick={onToggleExpand} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Basic Configuration */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Chart Configuration
            </Typography>
            
            {/* Chart Type Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartConfig.type}
                label="Chart Type"
                onChange={(e) => setChartConfig(prev => ({ ...prev, type: e.target.value }))}
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
                placeholder="Chart Title (optional)"
                value={chartConfig.title}
                onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
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
                value={chartConfig.groupBy}
                label="Group By (optional)"
                onChange={(e) => setChartConfig(prev => ({ ...prev, groupBy: e.target.value }))}
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
                value={chartConfig.aggregationType}
                label="Aggregation"
                onChange={(e) => setChartConfig(prev => ({ ...prev, aggregationType: e.target.value }))}
              >
                {aggregationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Options */}
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={chartConfig.showComparison}
                    onChange={(e) => setChartConfig(prev => ({ 
                      ...prev, 
                      showComparison: e.target.checked 
                    }))}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Show Comparison
                  </Typography>
                }
              />
            </FormGroup>
          </Grid>

          {/* Middle Column - Data Selection */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Data Columns Selection
            </Typography>
            
            {/* Numeric Columns Selection */}
            <Typography variant="subtitle2" gutterBottom>
              Numeric Columns (Select data to analyze):
            </Typography>
            <FormGroup sx={{ mb: 2, maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
              {numericColumns.map((column) => (
                <FormControlLabel
                  key={column.id}
                  control={
                    <Checkbox
                      checked={chartConfig.selectedColumns.includes(column.id)}
                      onChange={() => handleColumnToggle(column.id)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {column.label}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Grid>

          {/* Right Column - Preview & Action */}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Summary & Actions
            </Typography>
            
            {/* Selected Columns Summary */}
            {chartConfig.selectedColumns.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Selected Columns ({chartConfig.selectedColumns.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, maxHeight: 120, overflowY: 'auto' }}>
                  {chartConfig.selectedColumns.map((columnId) => {
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

            {/* Create Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleCreateChart}
              disabled={chartConfig.selectedColumns.length === 0}
              startIcon={<AddIcon />}
              size="large"
            >
              Create Chart
            </Button>

            {chartConfig.selectedColumns.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Select at least one data column to create a chart
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ChartSelectorCard;
