import React from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SimpleBarChart from './SimpleBarChart';
import SimplePieChart from './SimplePieChart';
import SimpleLineChart from './SimpleLineChart';
import SimpleRadarChart from './SimpleRadarChart';

const CustomChart = ({ 
  chartConfig, 
  data, 
  onRemove,
  onEdit,
  onDuplicate,
  height = 350 
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(chartConfig);
    handleMenuClose();
  };

  const handleDuplicate = () => {
    const duplicatedChart = {
      ...chartConfig,
      id: Date.now() + Math.random(),
      title: `${chartConfig.title} (Copy)`
    };
    onDuplicate(duplicatedChart);
    handleMenuClose();
  };

  const handleDelete = () => {
    onRemove(chartConfig.id);
    handleMenuClose();
  };
  if (!chartConfig || !data) {
    return (
      <Paper sx={{ p: 2, height }}>
        <Typography color="text.secondary">
          No chart data available
        </Typography>
      </Paper>
    );
  }

  const processDataForChart = () => {
    // Process data based on chart configuration
    const { selectedColumns, groupBy, aggregationType } = chartConfig;
    
    if (!selectedColumns || selectedColumns.length === 0) {
      return {};
    }

    // If no grouping, return simple aggregated data
    if (!groupBy) {
      const result = {};
      selectedColumns.forEach(columnId => {
        const values = data.map(item => {
          // Handle nested properties (like ministry_training_scores.preaching)
          const column = chartConfig.columns.find(col => col.id === columnId);
          if (column && column.parent) {
            return item[column.parent] ? item[column.parent][columnId] : null;
          }
          return item[columnId];
        }).filter(val => val !== null && val !== undefined);

        if (values.length > 0) {
          switch (aggregationType) {
            case 'average':
              result[columnId] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
              break;
            case 'sum':
              result[columnId] = values.reduce((sum, val) => sum + Number(val), 0);
              break;
            case 'count':
              result[columnId] = values.length;
              break;
            case 'min':
              result[columnId] = Math.min(...values.map(Number));
              break;
            case 'max':
              result[columnId] = Math.max(...values.map(Number));
              break;
            default:
              result[columnId] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
          }
        }
      });
      return result;
    }

    // Group by specified column
    const grouped = {};
    data.forEach(item => {
      const groupValue = item[groupBy];
      if (!grouped[groupValue]) {
        grouped[groupValue] = [];
      }
      grouped[groupValue].push(item);
    });

    // Process each group
    const result = {};
    Object.keys(grouped).forEach(groupValue => {
      const groupData = grouped[groupValue];
      result[groupValue] = {};
      
      selectedColumns.forEach(columnId => {
        const values = groupData.map(item => {
          const column = chartConfig.columns.find(col => col.id === columnId);
          if (column && column.parent) {
            return item[column.parent] ? item[column.parent][columnId] : null;
          }
          return item[columnId];
        }).filter(val => val !== null && val !== undefined);

        if (values.length > 0) {
          switch (aggregationType) {
            case 'average':
              result[groupValue][columnId] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
              break;
            case 'sum':
              result[groupValue][columnId] = values.reduce((sum, val) => sum + Number(val), 0);
              break;
            case 'count':
              result[groupValue][columnId] = values.length;
              break;
            case 'min':
              result[groupValue][columnId] = Math.min(...values.map(Number));
              break;
            case 'max':
              result[groupValue][columnId] = Math.max(...values.map(Number));
              break;
            default:
              result[groupValue][columnId] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
          }
        }
      });
    });

    return result;
  };

  const processedData = processDataForChart();

  const renderChart = () => {
    const commonProps = {
      title: chartConfig.title,
      data: processedData,
      height: height - 60, // Account for header
      maxValue: 5 // Assuming 1-5 scale for most survey data
    };

    switch (chartConfig.type) {
      case 'bar':
        return <SimpleBarChart {...commonProps} />;
      case 'pie':
        return <SimplePieChart {...commonProps} />;
      case 'line':
        return <SimpleLineChart {...commonProps} />;
      case 'radar':
        return <SimpleRadarChart {...commonProps} />;
      default:
        return <SimpleBarChart {...commonProps} />;
    }
  };

  return (
    <Paper sx={{ position: 'relative', height }}>
      {/* Actions menu button */}
      <IconButton
        onClick={handleMenuClick}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          backgroundColor: 'background.paper',
          boxShadow: 1,
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      {/* Actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'chart-actions-button',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Chart
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ContentCopyIcon sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Chart content */}
      <Box sx={{ p: 0, height: '100%' }}>
        {renderChart()}
      </Box>
    </Paper>
  );
};

export default CustomChart;
