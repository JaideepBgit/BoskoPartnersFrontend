import React, { useState, useEffect } from 'react';
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
  Radio,
  RadioGroup,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import RadarIcon from '@mui/icons-material/Radar';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BugReportIcon from '@mui/icons-material/BugReport';
import QuestionService from '../../../../services/Admin/Reports/QuestionService';
import ChartTypeRecommender from '../../../../services/Admin/Reports/ChartTypeRecommender';

const ChartSelectorCard = ({ 
  onCreateChart, 
  availableColumns = {},
  surveyType = 'church',
  isExpanded = false,
  onToggleExpand,
  questions = [],
  loadingQuestions = false,
  surveyData = {}, // Survey responses data
  ...otherProps
}) => {
  console.log('🎨🎨🎨 ChartSelectorCard - COMPONENT FUNCTION CALLED');
  console.log('🎨 ChartSelectorCard - Component rendering with props:', { surveyType, isExpanded, questionsCount: questions.length, loadingQuestions });
  console.log('🎨 ChartSelectorCard - onCreateChart type:', typeof onCreateChart);
  console.log('🎨 ChartSelectorCard - onToggleExpand type:', typeof onToggleExpand);
  console.log('🎨 ChartSelectorCard - Other props received:', Object.keys(otherProps));
  
  // React Hooks must be called at the top level - no conditional calls
  const [chartConfig, setChartConfig] = useState({
    type: 'bar',
    title: '',
    selectedQuestion: null, // Changed from array to single question
    selectedColumns: [], // Keep for backward compatibility
    groupBy: '',
    aggregationType: 'average',
    showComparison: false
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByType, setFilterByType] = useState('all');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [debugResponses, setDebugResponses] = useState([]);
  const [debugPage, setDebugPage] = useState(0);
  const [debugRowsPerPage, setDebugRowsPerPage] = useState(10);

  // Track component mount/unmount
  useEffect(() => {
    console.log('✅ ChartSelectorCard - Component MOUNTED with', questions.length, 'questions');
    return () => {
      console.log('❌ ChartSelectorCard - Component UNMOUNTED');
    };
  }, [questions.length]);
  
  const chartTypes = ChartTypeRecommender.getAllChartTypes(true); // Get only implemented charts

  const aggregationTypes = [
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'median', label: 'Median' },
    { value: 'mode', label: 'Mode' }
  ];
  
  // Get filtered questions based on search and type filter
  const getFilteredQuestions = () => {
    let filtered = questions;
    
    // Apply search filter
    if (searchTerm) {
      filtered = QuestionService.searchQuestions(filtered, searchTerm);
    }
    
    // Apply type filter
    if (filterByType === 'numeric') {
      filtered = QuestionService.getNumericQuestions(filtered);
    } else if (filterByType === 'non-numeric') {
      filtered = QuestionService.getNonNumericQuestions(filtered);
    }
    
    return filtered;
  };
  
  const filteredQuestions = getFilteredQuestions();
  const questionStats = QuestionService.getQuestionStatistics(questions);
  const sections = QuestionService.getUniqueSections(questions);

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

  const handleQuestionToggle = (questionId) => {
    // Single selection - replace the selected question
    setChartConfig(prev => ({
      ...prev,
      selectedQuestion: questionId
    }));
  };
  
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    
    // Auto-select recommended chart type if showing recommendations
    if (showRecommendations && question) {
      const recommendation = ChartTypeRecommender.getRecommendation(question);
      if (recommendation && recommendation.primary) {
        setChartConfig(prev => ({
          ...prev,
          type: recommendation.primary
        }));
      }
    }
  };

  // Extract responses for the selected question
  const extractQuestionResponses = (question) => {
    if (!question || !surveyData || !surveyData[surveyType]) {
      return [];
    }

    const responses = [];
    const surveyResponses = surveyData[surveyType] || [];

    console.log('🔍 Extracting responses for question:', question.text);
    console.log('🔍 Question ID:', question.id);
    console.log('🔍 Survey type:', surveyType);
    console.log('🔍 Total survey responses:', surveyResponses.length);

    surveyResponses.forEach((response, index) => {
      // Try to find the answer for this question in the response
      let answerValue = null;
      
      console.log(`\n📋 Processing response ${index + 1}:`, {
        responseId: response.id,
        userId: response.user_id,
        templateId: response.template_id,
        answersType: typeof response.answers,
        answersIsArray: Array.isArray(response.answers),
        answersKeys: response.answers ? Object.keys(response.answers) : 'null'
      });
      
      // Match responses from ALL surveys (target + comparison surveys)
      // No template filtering - we want to see all responses that have this question
      
      // The answers field is a JSON object where keys are numeric question IDs
      if (response.answers) {
        // Parse answers if it's a string
        let answersObj = response.answers;
        if (typeof answersObj === 'string') {
          try {
            answersObj = JSON.parse(answersObj);
          } catch (e) {
            console.error('Failed to parse answers JSON:', e);
          }
        }
        
        console.log('📝 Parsed answers object keys:', Object.keys(answersObj || {}));
        console.log('📝 Looking for question:', {
          id: question.id,
          text: question.text,
          order: question.order
        });
        
        // Matching priority:
        // 1. By question text (most reliable for cross-template matching)
        // 2. By question ID (for questions from Questions table)
        // 3. By order + 1 (fallback for template-generated IDs)
        
        // 1. Try by question text (exact match)
        if (answersObj[question.text]) {
          answerValue = answersObj[question.text];
          console.log('✅ Found by exact question text:', question.text, '=', answerValue);
        }
        // 2. Try by question text (case-insensitive)
        else {
          const questionTextLower = question.text.toLowerCase();
          let foundByText = false;
          for (const key in answersObj) {
            if (key.toLowerCase() === questionTextLower) {
              answerValue = answersObj[key];
              console.log('✅ Found by case-insensitive question text:', key, '=', answerValue);
              foundByText = true;
              break;
            }
          }
          
          // 3. Try by question ID (as number)
          if (!foundByText && answersObj[question.id]) {
            answerValue = answersObj[question.id];
            console.log('✅ Found by question ID (number):', question.id, '=', answerValue);
          }
          // 4. Try by question ID (as string)
          else if (!foundByText && answersObj[String(question.id)]) {
            answerValue = answersObj[String(question.id)];
            console.log('✅ Found by question ID (string):', String(question.id), '=', answerValue);
          }
          // 5. Try by order + 1 (for template-generated IDs or fallback)
          else if (!foundByText && question.order !== undefined && question.order !== null) {
            const orderKey = String(question.order + 1);
            if (answersObj[orderKey]) {
              answerValue = answersObj[orderKey];
              console.log('✅ Found by order + 1:', orderKey, '=', answerValue);
            }
          }
        }
        
        // 6. If answers is an array of objects with question_id
        if (!answerValue && Array.isArray(answersObj)) {
          const answer = answersObj.find(a => 
            a.question_id === question.id || 
            a.question_text === question.text ||
            (a.question && a.question.toLowerCase() === question.text.toLowerCase())
          );
          if (answer) {
            answerValue = answer.answer || answer.value || answer.response;
            console.log('✅ Found in array format:', answerValue);
          }
        }
        
        // Handle complex answer values (objects)
        if (answerValue && typeof answerValue === 'object') {
          // If it's an object, try to extract meaningful value
          if (answerValue['YES/NO']) {
            answerValue = answerValue['YES/NO'];
          } else if (Object.keys(answerValue).length > 0) {
            // Convert object to readable string
            answerValue = JSON.stringify(answerValue, null, 2);
          }
        }
      }

      // Get user identifier
      const userId = response.user_id || response.id || `Response ${index + 1}`;
      const userName = response.user_name || response.name || `User ${userId}`;

      // Get the keys from the answers object for debugging
      let answersKeys = [];
      if (response.answers) {
        let answersObj = response.answers;
        if (typeof answersObj === 'string') {
          try {
            answersObj = JSON.parse(answersObj);
          } catch (e) {
            // ignore
          }
        }
        answersKeys = Object.keys(answersObj || {});
      }

      responses.push({
        userId,
        userName,
        responseId: response.id,
        templateId: response.template_id,
        answer: answerValue || 'No answer',
        answersKeys: answersKeys, // Store the keys for debugging
        country: response.country || 'N/A',
        city: response.city || 'N/A'
      });
    });

    console.log('✅ Extracted', responses.length, 'responses');
    console.log('📊 Sample responses:', responses.slice(0, 3));
    console.log('📊 Responses with answers:', responses.filter(r => r.answer !== 'No answer').length);
    return responses;
  };

  const handleViewResponses = () => {
    if (!selectedQuestion) return;
    
    const responses = extractQuestionResponses(selectedQuestion);
    setDebugResponses(responses);
    setDebugDialogOpen(true);
    setDebugPage(0);
  };

  const handleCloseDebugDialog = () => {
    setDebugDialogOpen(false);
  };

  const handleChangeDebugPage = (event, newPage) => {
    setDebugPage(newPage);
  };

  const handleChangeDebugRowsPerPage = (event) => {
    setDebugRowsPerPage(parseInt(event.target.value, 10));
    setDebugPage(0);
  };

  const handleCreateChart = () => {
    if (!chartConfig.selectedQuestion) {
      alert('Please select a question to visualize');
      return;
    }

    const selectedQuestionObject = questions.find(q => 
      q.id === chartConfig.selectedQuestion
    );
    
    const chartData = {
      ...chartConfig,
      id: Date.now() + Math.random(),
      title: chartConfig.title || selectedQuestionObject.text.substring(0, 50),
      question: selectedQuestionObject, // Single question object
      surveyType: surveyType,
      createdAt: new Date().toISOString()
    };

    console.log('📊 Creating chart:', chartData);
    onCreateChart(chartData);
    
    // Reset form
    setChartConfig({
      type: 'bar',
      title: '',
      selectedQuestion: null,
      selectedColumns: [],
      groupBy: '',
      aggregationType: 'average',
      showComparison: false
    });
    setSelectedQuestion(null);
    setSearchTerm('');
  };

  if (!isExpanded) {
    console.log('🎨 ChartSelectorCard - Rendering COLLAPSED state');
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

  console.log('🎨 ChartSelectorCard - Rendering EXPANDED state');
  return (
    <Card sx={{ 
      width: '100%',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: 3
    }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#633394' }} />
            <Typography variant="h6">
              Custom Chart Builder
            </Typography>
          </Box>
          <IconButton onClick={onToggleExpand} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Loading State */}
        {loadingQuestions && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>Loading questions...</Typography>
          </Box>
        )}

        {/* No Questions State */}
        {!loadingQuestions && questions.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No questions available for this survey type. Questions are loaded automatically in the background.
          </Alert>
        )}

        {/* Main Content */}
        {!loadingQuestions && questions.length > 0 && (
          <>
            {/* Statistics Bar */}
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Total Questions</Typography>
                  <Typography variant="h6">{questionStats.total}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Numeric</Typography>
                  <Typography variant="h6" color="primary">{questionStats.numeric}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Non-Numeric</Typography>
                  <Typography variant="h6" color="secondary">{questionStats.nonNumeric}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Selected</Typography>
                  <Typography variant="h6" sx={{ color: '#633394' }}>
                    {chartConfig.selectedQuestion ? '1' : '0'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={3}>
              {/* Left Column - Question Selection */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon /> Select a Question to Visualize
                </Typography>
                
                {/* Search and Filter */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label="All" 
                      onClick={() => setFilterByType('all')}
                      color={filterByType === 'all' ? 'primary' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={`Numeric (${questionStats.numeric})`}
                      onClick={() => setFilterByType('numeric')}
                      color={filterByType === 'numeric' ? 'primary' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={`Non-Numeric (${questionStats.nonNumeric})`}
                      onClick={() => setFilterByType('non-numeric')}
                      color={filterByType === 'non-numeric' ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Questions List */}
                <Box sx={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                  {filteredQuestions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No questions found matching your criteria
                    </Typography>
                  ) : (
                    filteredQuestions.map((question) => {
                      const recommendation = ChartTypeRecommender.getRecommendation(question);
                      const isSelected = chartConfig.selectedQuestion === question.id;
                      
                      return (
                        <Paper 
                          key={question.id}
                          sx={{ 
                            p: 1.5, 
                            mb: 1, 
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #633394' : '1px solid #e0e0e0',
                            backgroundColor: isSelected ? '#f3e5f5' : 'white',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                          onClick={() => {
                            handleQuestionToggle(question.id);
                            handleQuestionSelect(question);
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Radio
                              checked={isSelected}
                              size="small"
                              sx={{ mt: -0.5 }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                {question.text.length > 100 ? question.text.substring(0, 100) + '...' : question.text}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={question.question_type_display} 
                                  size="small" 
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                {question.is_numeric && (
                                  <Chip 
                                    label="Numeric" 
                                    size="small" 
                                    color="primary"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                                {showRecommendations && (
                                  <Chip 
                                    icon={<AutoAwesomeIcon sx={{ fontSize: '0.8rem' }} />}
                                    label={ChartTypeRecommender.getChartTypeInfo(recommendation.primary)?.name || recommendation.primary}
                                    size="small" 
                                    color="secondary"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                                {question.section && (
                                  <Chip 
                                    label={question.section} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })
                  )}
                </Box>
              </Grid>

              {/* Right Column - Chart Configuration */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Chart Configuration
                </Typography>
                
                {/* Chart Title */}
                <TextField
                  fullWidth
                  size="small"
                  label="Chart Title (optional)"
                  value={chartConfig.title}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                  sx={{ mb: 2 }}
                />

                {/* Chart Type Selection */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Chart Type</InputLabel>
                  <Select
                    value={chartConfig.type}
                    label="Chart Type"
                    onChange={(e) => setChartConfig(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {chartTypes.map((type) => (
                      <MenuItem key={type.type} value={type.type}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BarChartIcon fontSize="small" />
                          {type.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Aggregation Type */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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

                {/* Selected Question Summary */}
                {chartConfig.selectedQuestion && (
                  <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f3e5f5' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Question
                    </Typography>
                    <Box>
                      {(() => {
                        const question = questions.find(q => q.id === chartConfig.selectedQuestion);
                        return question ? (
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {question.text}
                          </Typography>
                        ) : null;
                      })()}
                    </Box>
                  </Paper>
                )}

                {/* Recommendation Info */}
                {selectedQuestion && showRecommendations && (
                  <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Recommended: {ChartTypeRecommender.getChartTypeInfo(ChartTypeRecommender.getRecommendation(selectedQuestion).primary)?.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {ChartTypeRecommender.getRecommendation(selectedQuestion).description}
                    </Typography>
                  </Alert>
                )}

                {/* Debug: View Responses Button */}
                {chartConfig.selectedQuestion && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleViewResponses}
                    startIcon={<BugReportIcon />}
                    size="small"
                    sx={{ 
                      mb: 2,
                      borderColor: '#ff9800',
                      color: '#ff9800',
                      '&:hover': { 
                        borderColor: '#f57c00',
                        backgroundColor: '#fff3e0'
                      }
                    }}
                  >
                    View Responses (Debug)
                  </Button>
                )}

                {/* Create Button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCreateChart}
                  disabled={!chartConfig.selectedQuestion}
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{ 
                    backgroundColor: '#633394',
                    '&:hover': { backgroundColor: '#4a148c' }
                  }}
                >
                  Create Chart
                </Button>

                {!chartConfig.selectedQuestion && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    Select a question to create a chart
                  </Typography>
                )}

                {/* Toggle Recommendations */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showRecommendations}
                      onChange={(e) => setShowRecommendations(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">
                      Show chart recommendations
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>

      {/* Debug Dialog - Show Responses */}
      <Dialog
        open={debugDialogOpen}
        onClose={handleCloseDebugDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#fff3e0' }}>
          <BugReportIcon sx={{ color: '#ff9800' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Debug: Question Responses</Typography>
            {selectedQuestion && (
              <Typography variant="body2" color="text.secondary">
                {selectedQuestion.text}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseDebugDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Total Responses:</strong> {debugResponses.length}
              </Typography>
              <Typography variant="body2">
                <strong>Question ID:</strong> {selectedQuestion?.id || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Question Text:</strong> {selectedQuestion?.text || 'N/A'}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                This shows all responses for the selected question from users in the {surveyType} survey type.
              </Typography>
            </Alert>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>User ID</strong></TableCell>
                  <TableCell><strong>User Name</strong></TableCell>
                  <TableCell><strong>Template ID</strong></TableCell>
                  <TableCell><strong>Answer</strong></TableCell>
                  <TableCell><strong>Available Keys</strong></TableCell>
                  <TableCell><strong>Country</strong></TableCell>
                  <TableCell><strong>City</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {debugResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No responses found for this question
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  debugResponses
                    .slice(debugPage * debugRowsPerPage, debugPage * debugRowsPerPage + debugRowsPerPage)
                    .map((response, index) => (
                      <TableRow 
                        key={response.responseId || index}
                        sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                      >
                        <TableCell>{debugPage * debugRowsPerPage + index + 1}</TableCell>
                        <TableCell>{response.userId}</TableCell>
                        <TableCell>{response.userName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={response.templateId || 'N/A'} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: response.answer === 'No answer' ? 'normal' : 'bold',
                              color: response.answer === 'No answer' ? 'text.secondary' : 'text.primary'
                            }}
                          >
                            {response.answer}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ maxWidth: 300, overflow: 'auto' }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              {response.answersKeys && response.answersKeys.length > 0 
                                ? response.answersKeys.slice(0, 5).join(', ') + (response.answersKeys.length > 5 ? '...' : '')
                                : 'No keys'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{response.country}</TableCell>
                        <TableCell>{response.city}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {debugResponses.length > 0 && (
            <TablePagination
              component="div"
              count={debugResponses.length}
              page={debugPage}
              onPageChange={handleChangeDebugPage}
              rowsPerPage={debugRowsPerPage}
              onRowsPerPageChange={handleChangeDebugRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDebugDialog} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ChartSelectorCard;
