import React from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InteractiveBarChart from './InteractiveBarChart';
import InteractivePieChart from './InteractivePieChart';
import InteractiveLineChart from './InteractiveLineChart';
import InteractiveRadarChart from './InteractiveRadarChart';
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

  // Extract answer for a specific question from a response
  const extractAnswerFromResponse = (response, question) => {
    if (!response.answers) return null;

    let answersObj = response.answers;
    if (typeof answersObj === 'string') {
      try {
        answersObj = JSON.parse(answersObj);
      } catch (e) {
        return null;
      }
    }

    let answerValue = null;

    // Matching priority (same as ChartSelectorCard):
    // 1. By question text (exact match)
    if (answersObj[question.text]) {
      answerValue = answersObj[question.text];
    }
    // 2. By question text (case-insensitive)
    else {
      const questionTextLower = question.text.toLowerCase();
      for (const key in answersObj) {
        if (key.toLowerCase() === questionTextLower) {
          answerValue = answersObj[key];
          break;
        }
      }

      // 3. Try by question ID (as number)
      if (!answerValue && answersObj[question.id]) {
        answerValue = answersObj[question.id];
      }
      // 4. Try by question ID (as string)
      else if (!answerValue && answersObj[String(question.id)]) {
        answerValue = answersObj[String(question.id)];
      }
      // 5. Try by order + 1 (for template-generated IDs or fallback)
      else if (!answerValue && question.order !== undefined && question.order !== null) {
        const orderKey = String(question.order + 1);
        if (answersObj[orderKey]) {
          answerValue = answersObj[orderKey];
        }
      }
    }

    // Handle complex answer values (objects)
    if (answerValue && typeof answerValue === 'object') {
      if (answerValue['YES/NO']) {
        answerValue = answerValue['YES/NO'];
      } else if (Object.keys(answerValue).length > 0) {
        answerValue = JSON.stringify(answerValue);
      }
    }

    return answerValue;
  };

  const processDataForChart = () => {
    console.log('📊 CustomChart - Processing data for chart:', chartConfig);
    console.log('📊 CustomChart - Data length:', data?.length);
    console.log('📊 CustomChart - Question:', chartConfig.question);

    // NEW: Handle question-based charts
    if (chartConfig.question) {
      const question = chartConfig.question;
      const responses = [];

      // Extract answers from all survey responses
      data.forEach((response) => {
        const answer = extractAnswerFromResponse(response, question);
        if (answer !== null && answer !== undefined && answer !== 'No answer') {
          responses.push(answer);
        }
      });

      console.log('📊 CustomChart - Extracted responses:', responses);

      // Count occurrences of each answer (for categorical data)
      const answerCounts = {};
      responses.forEach(answer => {
        const answerStr = String(answer);
        answerCounts[answerStr] = (answerCounts[answerStr] || 0) + 1;
      });

      console.log('📊 CustomChart - Answer counts:', answerCounts);
      return answerCounts;
    }

    // OLD: Handle column-based charts (backward compatibility)
    const { selectedColumns, groupBy, aggregationType } = chartConfig;

    if (!selectedColumns || selectedColumns.length === 0) {
      return {};
    }

    // If no grouping, return simple aggregated data
    if (!groupBy) {
      const result = {};
      selectedColumns.forEach(columnId => {
        const values = data.map(item => {
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
        return <InteractiveBarChart {...commonProps} />;
      case 'pie':
        return <InteractivePieChart {...commonProps} />;
      case 'line':
        return <InteractiveLineChart {...commonProps} />;
      case 'radar':
        return <InteractiveRadarChart {...commonProps} />;
      default:
        return <InteractiveBarChart {...commonProps} />;
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
