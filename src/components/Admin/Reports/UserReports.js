import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PersonIcon from '@mui/icons-material/Person'; // Added PersonIcon
import Navbar from '../../shared/Navbar/Navbar';
import SampleDataService from '../../../services/Admin/Reports/SampleDataService';
import BackendDataService from '../../../services/Admin/Reports/BackendDataService';
import QuestionService from '../../../services/Admin/Reports/QuestionService';
import SimpleBarChart from './Charts/SimpleBarChart';
import InteractiveBarChart from './Charts/InteractiveBarChart';
import InteractivePieChart from './Charts/InteractivePieChart';
import InteractiveRadarChart from './Charts/InteractiveRadarChart';
import GeographicChart from './Charts/GeographicChart';

import ComparisonCard from './Charts/ComparisonCard';
import ChartSelectorCard from './Charts/ChartSelectorCard';
import CustomChart from './Charts/CustomChart';
import ChartEditDialog from './Charts/ChartEditDialog';
import SurveyMapCard from './Charts/SurveyMapCard';
import QualitativeAnalysis from './Charts/QualitativeAnalysis';
import QualitativeComparisonAnalysis from './Charts/QualitativeComparisonAnalysis';
import TextAnalyticsDisplay from './Charts/TextAnalyticsDisplay';
import AIChatInterface from './AIChatInterface';
import ReportDocumentEditor from './ReportDocumentEditor';
import ReportLibrary from './ReportLibrary';

const UserReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyData, setSurveyData] = useState({});
  const [selectedSurveyType, setSelectedSurveyType] = useState('institution'); // Default to institution
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    education_level: '',
    age_group: '',
    survey_type: ''
  });
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [customCharts, setCustomCharts] = useState([]);
  const [chartBuilderExpanded, setChartBuilderExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false); // Default to normal mode
  const [dataSource, setDataSource] = useState('backend'); // 'sample' or 'backend'
  const [selectedMapSurveys, setSelectedMapSurveys] = useState([]);
  const [selectedMapArea, setSelectedMapArea] = useState([]);
  const [chartBuilderQuestions, setChartBuilderQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // New state for tabs and dialogs
  const [activeMainTab, setActiveMainTab] = useState(0); // 0: Analytics, 1: AI Assistant, 2: Report Creator, 3: Report Library
  const [reportCreatorOpen, setReportCreatorOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedReportDocument, setSelectedReportDocument] = useState(null); // For loading saved reports

  // Helper functions for robust type comparison
  const normType = (t) => (t || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  const isSameType = (s) => {
    if (selectedSurveyType === 'all') return true; // All types match when "all" is selected
    return normType(s.survey_type || s.surveyType) === normType(selectedSurveyType);
  };

  // Helper function to get enhanced response display name with geographic info
  const getEnhancedResponseDisplayName = (response) => {
    let displayName = '';

    // Get the primary name based on survey type
    if (dataSource === 'sample' && SampleDataService.getResponseDisplayName) {
      displayName = SampleDataService.getResponseDisplayName(response);
    } else {
      // For backend data, use the survey-type specific names from the geo-enabled API
      if (response.survey_type === 'church') {
        displayName = response.pastor_name || response.church_name || response.user_name || `Response ${response.id}`;
      } else if (response.survey_type === 'institution') {
        displayName = response.president_name || response.institution_name || response.user_name || `Response ${response.id}`;
      } else if (response.survey_type === 'nonFormal' || response.survey_type === 'non_formal') {
        displayName = response.leader_name || response.ministry_name || response.user_name || `Response ${response.id}`;
      } else {
        displayName = response.user_name || `Response ${response.id}`;
      }
    }

    // Add enhanced geographic information from geo-enabled API
    const locationParts = [];
    if (response.city) locationParts.push(response.city);
    if (response.state && response.state !== response.city) locationParts.push(response.state);
    if (response.country) locationParts.push(response.country);

    const locationString = locationParts.join(', ');
    return locationString ? `${displayName} - ${locationString}` : displayName;
  };

  /**
   * Categorize comparison data into meaningful chart groups based on data scale and semantic category.
   * This creates separate datasets for different types of metrics to enable proper chart scaling.
   * 
   * Categories:
   * - ratings: Likert scale questions (1-5 range)
   * - counts: Number of staff, students, leaders, etc. (typically 0-100)
   * - years: Year-related questions (e.g., establishment year, start year)
   * - financial: Budget and monetary values (can be in thousands/millions)
   * - percentages: Percentage values (0-100)
   * - demographics: Age, years of experience, etc.
   * - other: Anything that doesn't fit above categories
   */
  const categorizeComparisonData = (averages, targetScores, questionLabels, questionMeta) => {
    if (!averages || Object.keys(averages).length === 0) {
      return { categories: [], hasData: false };
    }

    const categories = {
      ratings: {
        title: 'Performance Ratings (1-5 Scale)',
        icon: '⭐',
        data: {},
        targetData: {},
        maxValue: 5,
        description: 'Self-assessment and evaluation metrics on a 1-5 scale',
        chartType: 'bar',
        priority: 1
      },
      counts: {
        title: 'Staff & Resource Counts',
        icon: '👥',
        data: {},
        targetData: {},
        maxValue: 100,
        description: 'Number of staff, faculty, students, and other personnel',
        chartType: 'bar',
        priority: 2
      },
      demographics: {
        title: 'Demographics (Age)',
        icon: '👤',
        data: {},
        targetData: {},
        maxValue: 100,
        description: 'Age profiles and personal demographics',
        chartType: 'bar',
        priority: 3
      },
      experience: {
        title: 'Experience & Tenure',
        icon: '⏳',
        data: {},
        targetData: {},
        maxValue: 50,
        description: 'Years of experience, tenure in role, and duration metrics',
        chartType: 'bar',
        priority: 4
      },
      years: {
        title: 'Timeline & Key Dates',
        icon: '📅',
        data: {},
        targetData: {},
        maxValue: 2030,
        minValue: 1950,
        description: 'Establishment years and key dates (calendar years)',
        chartType: 'bar',
        priority: 4
      },
      financial: {
        title: 'Financial Overview',
        icon: '💰',
        data: {},
        targetData: {},
        maxValue: 1000000,
        description: 'Budget and funding comparison - your organization vs. group average',
        chartType: 'comparison', // Special chart type for side-by-side comparison
        priority: 5,
        formatCurrency: true, // Format values as currency
        comparisonMode: 'sideBySide', // Show clear side-by-side bars
        valuePrefix: '$',
        specialRender: true // Needs special rendering logic
      },
      percentages: {
        title: 'Percentages & Ratios',
        icon: '📈',
        data: {},
        targetData: {},
        maxValue: 100,
        description: 'Percentage-based metrics and allocations',
        chartType: 'bar',
        priority: 6
      },
      other: {
        title: 'Other Metrics',
        icon: '📋',
        data: {},
        targetData: {},
        maxValue: 100,
        description: 'Miscellaneous survey metrics',
        chartType: 'bar',
        priority: 7
      }
    };

    // Keywords for categorization
    const categoryPatterns = {
      ratings: [
        /extent/i, /rating/i, /satisfaction/i, /effectiveness/i, /quality/i,
        /leadership.*extent/i, /support.*extent/i, /training/i, /agree/i,
        /board.*express/i, /institution.*extent/i
      ],
      counts: [
        /number\s*of/i, /^number/i, /count/i, /total\s*(staff|faculty|student|leader)/i,
        /^staff/i, /^faculty/i, /^student/i, /^leader/i, /administrative/i,
        /full.*time/i, /part.*time/i, /enrollment/i
      ],
      years: [
        /year\s*(start|establish|found|complet|last|first)/i, /start.*year/i,
        /establish.*year/i, /^year\s+\w+/i, /when.*start/i, /founded/i,
        /institution.*start/i, /last.*formal/i, /date/i
      ],
      experience: [
        /years?\s*(as|in|of)/i, /experience/i, /tenure/i, /duration/i,
        /how\s*long/i, /^years$/i, /serve/i
      ],
      demographics: [
        /^age$/i, /your\s*age/i, /age.*group/i
      ],
      financial: [
        /budget/i, /dollar/i, /funding/i, /revenue/i, /income/i, /expense/i,
        /cost/i, /salary/i, /current\s*year/i, /annual/i, /financial/i
      ],
      percentages: [
        /percent/i, /%/i, /ratio/i, /proportion/i, /allocation/i
      ]
    };

    // Categorize each question
    Object.entries(averages).forEach(([key, avgValue]) => {
      const label = (questionLabels && questionLabels[key]) || key;
      const targetValue = targetScores ? targetScores[key] : undefined;
      const meta = questionMeta ? questionMeta[key] : {};

      // Skip non-numeric values
      if (typeof avgValue !== 'number' || isNaN(avgValue)) return;

      let assignedCategory = 'other';

      // First, try to categorize by label patterns
      for (const [category, patterns] of Object.entries(categoryPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(label)) {
            assignedCategory = category;
            break;
          }
        }
        if (assignedCategory !== 'other') break;
      }

      // If still 'other', use value-based heuristics
      if (assignedCategory === 'other') {
        const maxVal = Math.max(avgValue, targetValue || 0);
        const minVal = Math.min(avgValue, targetValue || avgValue);

        if (maxVal <= 5 && minVal >= 1) {
          // Likely a 1-5 rating scale
          assignedCategory = 'ratings';
        } else if (maxVal > 1900 && maxVal < 2100) {
          // Likely a year
          assignedCategory = 'years';
        } else if (maxVal > 10000) {
          // Likely financial
          assignedCategory = 'financial';
        } else if (maxVal <= 100 && label.toLowerCase().includes('number')) {
          // Likely a count
          assignedCategory = 'counts';
        } else if (maxVal <= 100) {
          // Could be age, count, or percentage
          if (/age/i.test(label)) {
            assignedCategory = 'demographics';
          } else {
            assignedCategory = 'counts';
          }
        }
      }

      // Add to the appropriate category
      categories[assignedCategory].data[key] = avgValue;
      if (targetValue !== undefined) {
        categories[assignedCategory].targetData[key] = targetValue;
      }
    });

    // Post-categorization sanity check
    ['demographics', 'experience'].forEach(catName => {
      Object.keys(categories[catName].data).forEach(key => {
        const val = categories[catName].data[key];
        const label = (questionLabels && questionLabels[key]) || key;

        // Move to years if value looks like a calendar year
        if (val > 1800 && val < 2100) {
          categories.years.data[key] = val;
          delete categories[catName].data[key];
          if (categories[catName].targetData[key]) {
            categories.years.targetData[key] = categories[catName].targetData[key];
            delete categories[catName].targetData[key];
          }
        }
        // Move to experience if label says "years" but value is small (duration) and it's in demographics (Age)
        else if (catName === 'demographics' && (/year/i.test(label) || /experience/i.test(label)) && val < 100) {
          categories.experience.data[key] = val;
          delete categories.demographics.data[key];
          if (categories.demographics.targetData[key]) {
            categories.experience.targetData[key] = categories.demographics.targetData[key];
            delete categories.demographics.targetData[key];
          }
        }
      });
    });

    // Also check targetData directly
    ['demographics', 'experience'].forEach(catName => {
      Object.keys(categories[catName].targetData).forEach(key => {
        const val = categories[catName].targetData[key];
        if (val > 1800 && val < 2100) {
          if (!categories.years.targetData[key]) {
            categories.years.targetData[key] = val;
            delete categories[catName].targetData[key];
            if (categories[catName].data[key]) {
              categories.years.data[key] = categories[catName].data[key];
              delete categories[catName].data[key];
            }
          }
        }
      });
    });

    // Calculate appropriate maxValue for each category based on actual data
    Object.values(categories).forEach(cat => {
      if (Object.keys(cat.data).length > 0) {
        const allValues = [
          ...Object.values(cat.data),
          ...Object.values(cat.targetData)
        ].filter(v => typeof v === 'number' && !isNaN(v));

        if (allValues.length > 0) {
          const maxDataValue = Math.max(...allValues);
          const minDataValue = Math.min(...allValues);

          // Special handling for years
          if (cat.title.includes('Timeline')) {
            cat.minValue = Math.floor(minDataValue / 10) * 10;
            cat.maxValue = Math.ceil(maxDataValue / 10) * 10;
          } else {
            // Add 20% padding to max value for visual clarity
            cat.maxValue = Math.ceil(maxDataValue * 1.2);
          }
        }
      }
    });

    // Filter out empty categories and sort by priority
    const nonEmptyCategories = Object.entries(categories)
      .filter(([_, cat]) => Object.keys(cat.data).length > 0)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([key, cat]) => ({
        key,
        ...cat,
        questionCount: Object.keys(cat.data).length
      }));

    return {
      categories: nonEmptyCategories,
      hasData: nonEmptyCategories.length > 0,
      totalQuestions: Object.keys(averages).length
    };
  };

  // Load questions for chart builder
  const loadChartBuilderQuestions = React.useCallback(async () => {
    try {
      setLoadingQuestions(true);
      console.log('📊 UserReports - Loading chart builder questions for survey type:', selectedSurveyType);

      const templates = await QuestionService.fetchQuestionsWithTypes(selectedSurveyType);
      console.log('📊 UserReports - Received templates:', templates);

      if (templates && templates.length > 0) {
        // Flatten all questions from all templates
        const allQuestions = templates.flatMap(t => t.questions || []);
        console.log(`📊 UserReports - Total questions before deduplication: ${allQuestions.length} from ${templates.length} templates`);

        // Deduplicate questions based on question text and type
        // This handles cases where the same question appears in multiple templates
        const uniqueQuestionsMap = new Map();

        allQuestions.forEach(question => {
          // Create a unique key based on question text and type
          const key = `${question.text.trim().toLowerCase()}_${question.question_type_id}`;

          // Only add if not already present, or if this one has a real ID (not template-based)
          if (!uniqueQuestionsMap.has(key)) {
            uniqueQuestionsMap.set(key, question);
          } else {
            // If we already have this question, prefer the one with a numeric ID over template-based ID
            const existing = uniqueQuestionsMap.get(key);
            const existingIsTemplateId = typeof existing.id === 'string' && existing.id.includes('_q_');
            const currentIsTemplateId = typeof question.id === 'string' && question.id.includes('_q_');

            // Prefer real database IDs over template-generated IDs
            if (existingIsTemplateId && !currentIsTemplateId) {
              uniqueQuestionsMap.set(key, question);
            }
          }
        });

        const uniqueQuestions = Array.from(uniqueQuestionsMap.values());
        console.log(`✅ UserReports - Deduplicated to ${uniqueQuestions.length} unique questions (removed ${allQuestions.length - uniqueQuestions.length} duplicates)`);
        setChartBuilderQuestions(uniqueQuestions);
      } else {
        console.log('⚠️ UserReports - No templates returned or empty templates array');
        setChartBuilderQuestions([]);
      }
    } catch (err) {
      console.error('❌ UserReports - Error loading chart builder questions:', err);
      setChartBuilderQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedSurveyType]);

  // Load data on component mount and when mode changes
  useEffect(() => {
    loadData();
  }, [dataSource]);

  // Load questions for chart builder when survey type changes
  useEffect(() => {
    console.log('📊 UserReports - useEffect triggered for loading questions, selectedSurveyType:', selectedSurveyType);
    loadChartBuilderQuestions();
  }, [selectedSurveyType, loadChartBuilderQuestions]);

  // Load templates for report creator
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseURL}/survey-templates/available`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (err) {
        console.warn('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Handle mode change
  useEffect(() => {
    const newDataSource = isTestMode ? 'sample' : 'backend';
    console.log('🔄 Mode change useEffect triggered');
    console.log('🔄 isTestMode:', isTestMode);
    console.log('🔄 Previous dataSource:', dataSource);
    console.log('🔄 New dataSource:', newDataSource);
    setDataSource(newDataSource);
  }, [isTestMode]);

  // Reload data when survey type filter changes (only for backend data)
  useEffect(() => {
    if (dataSource === 'backend' && filters.survey_type !== '') {
      loadData();
    }
  }, [filters.survey_type]);

  const loadData = async () => {
    try {
      console.log('🔄 UserReports.loadData called');
      console.log('🔄 Data source:', dataSource);
      console.log('🔄 Current filters:', filters);

      setLoading(true);
      setError(null); // Clear previous errors
      let data;

      if (dataSource === 'sample') {
        console.log('🔄 Loading sample data...');
        data = await SampleDataService.loadSampleData();
        console.log('🔄 Sample data loaded:', data);
      } else {
        console.log('🔄 Loading backend data...');

        // Load survey types first if using backend data
        if (surveyTypes.length === 0) {
          try {
            console.log('🔄 Loading survey types...');
            const types = BackendDataService.getSurveyTypes();
            setSurveyTypes(types);
            console.log('🔄 Survey types loaded:', types);
          } catch (typeError) {
            console.warn('Failed to load survey types:', typeError);
          }
        }

        // Load survey responses with optional survey type filter
        const surveyTypeFilter = filters.survey_type || null;
        console.log('🔄 Loading survey responses with filter:', surveyTypeFilter);
        data = await BackendDataService.loadSurveyResponses(surveyTypeFilter);
        console.log('🔄 Backend data loaded:', data);
      }

      console.log('🔄 Setting survey data:', {
        church: data.church?.length || 0,
        institution: data.institution?.length || 0,
        nonFormal: data.nonFormal?.length || 0
      });

      // Filter for manager
      const userRole = localStorage.getItem('userRole');
      const userStr = localStorage.getItem('user');

      if (userRole === 'manager' && userStr) {
        const currentUser = JSON.parse(userStr);
        if (currentUser && currentUser.organization_id) {
          const orgId = currentUser.organization_id;
          console.log('🔄 Filtering for Manager Org ID:', orgId);

          // Filter each category in data
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              // Assume response has organization_id. If not, this might filter everything out.
              // We check loose equality just in case of string vs int
              data[key] = data[key].filter(r => r.organization_id == orgId);
            }
          });
        }
      }

      setSurveyData(data);

      setSurveyData(data);

      let effectiveSurveyType = selectedSurveyType;

      // For managers, if the current type has no data, try to find one that does
      if (userRole === 'manager') {
        const types = ['institution', 'church', 'nonFormal', 'non_formal', 'other'];
        // If current type is empty in the filtered data
        if (!data[effectiveSurveyType] || data[effectiveSurveyType].length === 0) {
          for (const t of types) {
            if (data[t] && data[t].length > 0) {
              effectiveSurveyType = t;
              console.log('🔄 Auto-switching manager to survey type:', t);
              setSelectedSurveyType(t);
              break;
            }
          }
        }
      }

      // Set default selected response based on effective type
      if (effectiveSurveyType === 'all') {
        // For "all" types, find the first available response from any survey type
        const allResponses = Object.values(data).flat();
        if (allResponses.length > 0) {
          const newSelectedId = String(allResponses[0].id);
          console.log('🔄 Setting selected response ID for all types:', newSelectedId);
          setSelectedResponseId(newSelectedId);
        } else {
          console.log('🔄 No responses found for all types');
          setSelectedResponseId(null);
        }
      } else if (data[effectiveSurveyType] && data[effectiveSurveyType].length > 0) {
        const newSelectedId = String(data[effectiveSurveyType][0].id);
        console.log('🔄 Setting selected response ID:', newSelectedId);
        setSelectedResponseId(newSelectedId);
      } else {
        console.log('🔄 No responses found for survey type:', effectiveSurveyType);
        setSelectedResponseId(null);
      }

    } catch (err) {
      const errorMessage = dataSource === 'sample'
        ? 'Failed to load sample data. Please check the console for details.'
        : 'Failed to load data from backend. Please check your connection and try again.';
      console.error('❌ Error in loadData:', err);
      console.error('❌ Error message:', errorMessage);
      setError(errorMessage);

      // Keep existing data if switching modes fails
      // This prevents complete data loss on mode switch errors
    } finally {
      setLoading(false);
      console.log('🔄 loadData completed, loading set to false');
    }
  };

  const handleModeToggle = (event) => {
    const newTestMode = event.target.checked;
    console.log('🔄 Mode toggle clicked');
    console.log('🔄 Previous test mode:', isTestMode);
    console.log('🔄 New test mode:', newTestMode);
    console.log('🔄 New data source will be:', newTestMode ? 'sample' : 'backend');

    setIsTestMode(newTestMode);
    // Clear any existing data and reset selections
    setSurveyData({});
    setSelectedResponseId(null);
    setComparisonData(null);
    setCustomCharts([]);

    console.log('🔄 Data cleared, mode toggle complete');
  };

  // Update comparison data when survey type or selected response changes
  useEffect(() => {
    if (surveyData[selectedSurveyType] && selectedResponseId) {
      generateComparisonData();
    }
  }, [surveyData, selectedSurveyType, selectedResponseId]);

  // Regenerate graphs when selected surveys change
  useEffect(() => {
    console.log('🔄 Selected surveys changed:', selectedMapSurveys.length);
    if (surveyData[selectedSurveyType] && selectedResponseId) {
      console.log('🔄 Triggering graph regeneration...');
      generateComparisonData();
    } else {
      console.log('🔄 Not regenerating - missing surveyData or selectedResponseId');
      console.log('🔄 surveyData[selectedSurveyType]:', !!surveyData[selectedSurveyType]);
      console.log('🔄 selectedResponseId:', selectedResponseId);
    }
  }, [selectedMapSurveys, surveyData, selectedSurveyType, selectedResponseId]);

  const generateComparisonData = async () => {
    try {
      if (!selectedResponseId || !selectedSurveyType) {
        console.log('📊 Missing selectedResponseId or selectedSurveyType');
        return;
      }

      console.log('📊 Starting generateComparisonData (template-based)');
      console.log('📊 Target response ID:', selectedResponseId);
      console.log('📊 Survey type:', selectedSurveyType);

      // Use the new template-based comparison from backend
      if (!isTestMode) {
        try {
          const comparisonResult = await BackendDataService.compareByTemplate(
            selectedResponseId,
            selectedSurveyType
          );

          console.log('📊 Template comparison result:', comparisonResult);

          // Check if template is empty
          if (comparisonResult.error === 'empty_template') {
            console.warn('📊 Empty template detected:', comparisonResult.message);
            setComparisonData({
              ...comparisonResult,
              isEmpty: true,
              errorMessage: comparisonResult.message
            });
            return;
          }

          // Include text_analytics in comparison data
          const qLabels = comparisonResult.question_labels || {};
          const qDetails = comparisonResult.question_details || {};
          const backendMeta = comparisonResult.question_meta || {};
          const avgKeys = Object.keys(comparisonResult.averages || {});
          const tgtKeys = Object.keys(comparisonResult.targetScores || {});
          const allKeys = Array.from(new Set([...avgKeys, ...tgtKeys]));
          const question_meta = { ...backendMeta };
          const numeric_keys = [];

          const formatKey = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          allKeys.forEach((k) => {
            const label = qLabels[k] || (qDetails[k]?.label) || (qDetails[k]?.full_text) || formatKey(k);
            const avgVal = (comparisonResult.averages || {})[k];
            const tgtVal = (comparisonResult.targetScores || {})[k];
            // Prefer backend numeric flag when present; fallback to value-based inference
            const backendFlag = backendMeta[k]?.is_numeric;
            const inferredNumeric = (typeof avgVal === 'number' && !Number.isNaN(avgVal)) || (typeof tgtVal === 'number' && !Number.isNaN(tgtVal));
            const is_numeric = typeof backendFlag === 'boolean' ? backendFlag : inferredNumeric;
            question_meta[k] = { ...(question_meta[k] || {}), label, is_numeric };
            if (is_numeric) numeric_keys.push(k);
          });

          const newComparisonData = {
            target: comparisonResult.target,
            targetScores: comparisonResult.targetScores,
            averages: comparisonResult.averages,
            stats: comparisonResult.stats,
            question_labels: qLabels,
            question_details: qDetails,
            question_meta,
            numeric_keys
          };

          // Add text analytics if available
          if (comparisonResult.text_analytics) {
            console.log('📊 Text analytics data received:', comparisonResult.text_analytics);
            newComparisonData.text_analytics = comparisonResult.text_analytics;
          } else {
            console.log('📊 No text analytics data in response');
          }

          setComparisonData(newComparisonData);
          console.log('📊 New comparison data:', newComparisonData);
          return;
        } catch (error) {
          console.error('📊 Error with template comparison, falling back to old method:', error);
          // Fall through to old method if template comparison fails
        }
      }

      // Fallback to old method for test mode or if template comparison fails
      let responses = surveyData[selectedSurveyType];
      console.log('📊 Using fallback comparison method');
      console.log('📊 Original responses count:', responses?.length || 0);

      const targetResponse = responses?.find(r => String(r.id) === String(selectedResponseId));

      if (targetResponse) {
        const comparison = SampleDataService.compareWithSimilar(
          targetResponse,
          selectedSurveyType,
          responses
        );

        const stats = SampleDataService.calculateComparisonStats(
          comparison.targetScores,
          comparison.averages
        );
        // Build minimal labels/meta for sample path
        const qLabels = {};
        const qDetails = {};
        const avgKeys = Object.keys(comparison.averages || {});
        const tgtKeys = Object.keys(comparison.targetScores || {});
        const allKeys = Array.from(new Set([...avgKeys, ...tgtKeys]));
        const question_meta = {};
        const numeric_keys = [];
        const formatKey = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        allKeys.forEach((k) => {
          const label = formatKey(k);
          qLabels[k] = label;
          qDetails[k] = { label, full_text: label };
          const avgVal = (comparison.averages || {})[k];
          const tgtVal = (comparison.targetScores || {})[k];
          const is_numeric = (typeof avgVal === 'number' && !Number.isNaN(avgVal)) || (typeof tgtVal === 'number' && !Number.isNaN(tgtVal));
          question_meta[k] = { label, is_numeric };
          if (is_numeric) numeric_keys.push(k);
        });

        console.log('📊 Setting comparison data from fallback method');
        setComparisonData({
          ...comparison,
          stats,
          question_labels: qLabels,
          question_details: qDetails,
          question_meta,
          numeric_keys
        });
        console.log('📊 New comparison data:', comparisonData);
      } else {
        console.log('📊 No target response found');
        setComparisonData(null);
      }
    } catch (err) {
      console.error('Error generating comparison data:', err);
      setComparisonData(null);
    }
  };

  const handleSurveyTypeChange = (event) => {
    const newType = event.target.value;
    setSelectedSurveyType(newType);

    // Reset selected response for new survey type
    if (newType === 'all') {
      // For "all" types, find the first available response from any survey type
      const allResponses = Object.values(surveyData).flat();
      if (allResponses.length > 0) {
        setSelectedResponseId(String(allResponses[0].id));
      }
    } else if (surveyData[newType] && surveyData[newType].length > 0) {
      setSelectedResponseId(String(surveyData[newType][0].id));
    }
  };

  const getFilteredResponses = () => {
    // Handle "all" survey types
    if (selectedSurveyType === 'all') {
      const allResponses = Object.values(surveyData).flat();

      // If surveys are selected from the map, use only those
      if (selectedMapSurveys.length > 0) {
        return selectedMapSurveys;
      }

      if (dataSource === 'sample') {
        return SampleDataService.filterResponsesWithBase(allResponses, filters);
      } else {
        return BackendDataService.filterResponses(allResponses, filters);
      }
    }

    if (!surveyData[selectedSurveyType]) return [];

    // Start with all responses or selected surveys
    let baseResponses = surveyData[selectedSurveyType];

    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      baseResponses = selectedMapSurveys.filter(isSameType);
    }

    if (dataSource === 'sample') {
      // Apply filters to the base responses
      return SampleDataService.filterResponsesWithBase(baseResponses, filters);
    } else {
      return BackendDataService.filterResponses(baseResponses, filters);
    }
  };

  const getGeographicData = () => {
    // Handle "all" survey types
    if (selectedSurveyType === 'all') {
      const allResponses = Object.values(surveyData).flat();

      // If surveys are selected from the map, use only those
      if (selectedMapSurveys.length > 0) {
        if (dataSource === 'sample') {
          return SampleDataService.getGeographicDistributionWithBase(selectedMapSurveys);
        } else {
          return BackendDataService.getGeographicDistribution(selectedMapSurveys);
        }
      }

      if (dataSource === 'sample') {
        return SampleDataService.getGeographicDistributionWithBase(allResponses);
      } else {
        return BackendDataService.getGeographicDistribution(allResponses);
      }
    }

    if (!surveyData[selectedSurveyType]) return {};

    // Use selected surveys if available, otherwise use all responses
    let responses = surveyData[selectedSurveyType];

    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      responses = selectedMapSurveys.filter(isSameType);
    }

    if (dataSource === 'sample') {
      return SampleDataService.getGeographicDistributionWithBase(responses);
    } else {
      return BackendDataService.getGeographicDistribution(responses);
    }
  };

  const getUniqueValues = (fieldName) => {
    // Handle "all" survey types
    if (selectedSurveyType === 'all') {
      const allResponses = Object.values(surveyData).flat();

      // If surveys are selected from the map, use only those
      if (selectedMapSurveys.length > 0) {
        if (dataSource === 'sample') {
          return SampleDataService.getUniqueValuesWithBase(selectedMapSurveys, fieldName);
        } else {
          return BackendDataService.getUniqueValues(selectedMapSurveys, fieldName);
        }
      }

      if (dataSource === 'sample') {
        return SampleDataService.getUniqueValuesWithBase(allResponses, fieldName);
      } else {
        return BackendDataService.getUniqueValues(allResponses, fieldName);
      }
    }

    if (!surveyData[selectedSurveyType]) return [];

    // Use selected surveys if available, otherwise use all responses
    let responses = surveyData[selectedSurveyType];

    // If surveys are selected from the map, use only those
    if (selectedMapSurveys.length > 0) {
      responses = selectedMapSurveys.filter(isSameType);
    }

    if (dataSource === 'sample') {
      return SampleDataService.getUniqueValuesWithBase(responses, fieldName);
    } else {
      return BackendDataService.getUniqueValues(responses, fieldName);
    }
  };

  const handleExportData = () => {
    const dataToExport = getFilteredResponses();
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    // Flatten data for CSV
    const flattenedData = dataToExport.map(response => {
      const flat = {
        id: response.id,
        survey_type: response.survey_type,
        date: response.response_date,
        user: response.user_name || 'N/A',
        organization: response.organization_name || 'N/A',
        country: response.country || '',
        city: response.city || '',
        education: response.education_level || '',
        age_group: response.age_group || '',
        // Add other metadata fields as needed
      };

      // Add answers
      if (response.answers && typeof response.answers === 'object') {
        Object.entries(response.answers).forEach(([key, value]) => {
          // Stata/NVivo friendly keys: alphanumeric + underscore
          // Remove q_ prefix if it exists to avoid double prefixing, then add it back consistently
          // Or just sanitize the key. 
          const cleanKey = 'q_' + key.replace(/[^a-zA-Z0-9_]/g, '_');

          let cleanValue = value;
          // Handle object values (e.g. multiple choice or complex objects)
          if (typeof value === 'object' && value !== null) {
            cleanValue = JSON.stringify(value);
          }
          // Note: strict string escaping happens during row generation
          flat[cleanKey] = cleanValue;
        });
      }
      return flat;
    });

    // Get all unique keys
    const allKeys = new Set();
    flattenedData.forEach(obj => Object.keys(obj).forEach(k => allKeys.add(k)));
    const columns = Array.from(allKeys).sort();

    // Create CSV content
    // Header
    const header = columns.join(',');

    // Rows
    const rows = flattenedData.map(obj => {
      return columns.map(col => {
        let val = obj[col];
        if (val === undefined || val === null) return '';

        // Convert to string and escape quotes
        let strVal = String(val);
        if (strVal.includes('"') || strVal.includes(',') || strVal.includes('\n')) {
          strVal = `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(',');
    });

    const csvContent = [header, ...rows].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `survey_export_${selectedSurveyType}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCustomChart = (chartConfig) => {
    const newChart = {
      ...chartConfig,
      id: Date.now() + Math.random(), // Ensure unique ID
      surveyType: selectedSurveyType
    };
    setCustomCharts(prev => [...prev, newChart]);
    setChartBuilderExpanded(false); // Collapse after creating
  };

  const handleRemoveCustomChart = (chartId) => {
    setCustomCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const handleEditChart = (chartConfig) => {
    setEditingChart(chartConfig);
    setEditDialogOpen(true);
  };

  const handleUpdateChart = (updatedChart) => {
    setCustomCharts(prev =>
      prev.map(chart =>
        chart.id === updatedChart.id ? updatedChart : chart
      )
    );
    setEditDialogOpen(false);
    setEditingChart(null);
  };

  const handleDuplicateChart = (chartConfig) => {
    setCustomCharts(prev => [...prev, chartConfig]);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingChart(null);
  };

  const handleMapSurveySelection = (surveys) => {
    console.log(' Survey selection received:', surveys);
    console.log(' Number of surveys:', surveys.length);
    if (surveys.length > 0) {
      console.log(' First survey structure:', surveys[0]);
      console.log(' Survey types found:', surveys.map(s => s.survey_type || s.surveyType));
    }
    setSelectedMapSurveys(surveys);
  };

  const handleMapAreaSelection = (markersInArea) => {
    setSelectedMapArea(markersInArea);
    const surveysInArea = markersInArea.map(marker => marker.surveyData);
    console.log('🌍 Area selection - surveys in area:', surveysInArea.length);

    // Treat area selection the same as survey selection for graph regeneration
    setSelectedMapSurveys(surveysInArea);
    console.log('🌍 Updated selectedMapSurveys from area selection');
  };

  // Admin colors for consistent styling
  const adminColors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    text: '#212121',
    headerBg: '#ede7f6',
    borderColor: '#e0e0e0',
    highlightBg: '#f3e5f5',
    cardBg: '#ffffff',
    lightPurple: '#f3e5f5',
    darkPurple: '#4a148c'
  };

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading sample data...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                User Reports - Survey Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Compare individual survey responses with group averages and analyze trends.
              </Typography>
            </Box>

            {/* Data Mode Toggle - Always Visible */}
            <Card sx={{ p: 2, minWidth: 200, backgroundColor: adminColors.cardBg, border: `1px solid ${adminColors.borderColor}` }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Data Source
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTestMode}
                      onChange={handleModeToggle}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: adminColors.primary,
                          '&:hover': { backgroundColor: `${adminColors.primary}20` }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: adminColors.primary
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {isTestMode ? 'Test Mode' : 'Normal Mode'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isTestMode ? 'Using sample data' : 'Using backend data'}
                      </Typography>
                    </Box>
                  }
                  labelPlacement="bottom"
                />
              </Box>
            </Card>
          </Box>

          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Failed to load data
            </Typography>
            <Typography variant="body2" paragraph>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isTestMode
                ? "Try switching to Normal Mode or check if sample data files are available."
                : "Try switching to Test Mode to use sample data, or check your backend connection."
              }
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={loadData}>
              Retry Loading Data
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsTestMode(!isTestMode)}
            >
              Switch to {isTestMode ? 'Normal' : 'Test'} Mode
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  const filteredResponses = getFilteredResponses();
  const geographicData = getGeographicData();
  // Fix: Handle 'all' type properly to avoid undefined responses
  const availableResponses = selectedSurveyType === 'all'
    ? Object.values(surveyData).flat().filter(r => r && r.id)
    : (surveyData[selectedSurveyType] || []);

  return (
    <Box>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              User Reports - Survey Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compare individual survey responses with group averages and analyze trends.
            </Typography>
          </Box>

          {/* Data Mode Toggle */}
          <Card sx={{ p: 2, minWidth: 200, backgroundColor: adminColors.cardBg, border: `1px solid ${adminColors.borderColor}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                Data Source
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTestMode}
                    onChange={handleModeToggle}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: adminColors.primary,
                        '&:hover': { backgroundColor: `${adminColors.primary}20` }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: adminColors.primary
                      }
                    }}
                  />
                }
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {isTestMode ? 'Test Mode' : 'Normal Mode'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isTestMode ? 'Using sample data' : 'Using backend data'}
                    </Typography>
                  </Box>
                }
                labelPlacement="bottom"
              />
            </Box>
          </Card>
        </Box>

        {/* Non-blocking Error Alert */}
        {error && Object.keys(surveyData).length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Data Loading Issue
            </Typography>
            <Typography variant="body2" paragraph>
              {error}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button size="small" variant="outlined" onClick={loadData}>
                Retry
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setIsTestMode(!isTestMode)}
              >
                Switch to {isTestMode ? 'Normal' : 'Test'} Mode
              </Button>
            </Box>
          </Alert>
        )}

        {/* Main Tab Navigation */}
        <Card sx={{ mb: 3, border: `1px solid ${adminColors.borderColor}` }}>
          <Tabs
            value={activeMainTab}
            onChange={(e, newVal) => setActiveMainTab(newVal)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${adminColors.borderColor}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 64,
              },
              '& .Mui-selected': { color: adminColors.primary },
              '& .MuiTabs-indicator': { backgroundColor: adminColors.primary, height: 3 }
            }}
          >
            <Tab
              icon={<BarChartIcon />}
              iconPosition="start"
              label="Survey Analytics"
            />
            <Tab
              icon={<AutoAwesomeIcon />}
              iconPosition="start"
              label="AI Assistant"
            />
            <Tab
              icon={<AssessmentIcon />}
              iconPosition="start"
              label="Report Creator"
            />
            <Tab
              icon={<DescriptionIcon />}
              iconPosition="start"
              label="Report Library"
            />
          </Tabs>
        </Card>

        {/* Tab Content: AI Assistant */}
        {activeMainTab === 1 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Box sx={{ height: 600 }}>
                <AIChatInterface
                  surveyData={surveyData}
                  comparisonData={comparisonData}
                  selectedSurveyType={selectedSurveyType}
                  onGenerateReport={(action) => {
                    if (action === 'openReportCreator') {
                      setActiveMainTab(2);
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Tab Content: Report Creator - Now uses Document Editor */}
        {activeMainTab === 2 && (
          <Box sx={{ height: 'calc(100vh - 220px)', minHeight: 600 }}>
            <ReportDocumentEditor
              initialDocument={selectedReportDocument}
              availableCharts={customCharts.map(chart => ({
                id: chart.id,
                title: chart.title || chart.name || 'Custom Chart',
                chartType: chart.chartType || 'bar',
                data: chart.data || [],
                description: 'Custom chart from Chart Builder',
              }))}
              surveyData={surveyData}
              comparisonData={comparisonData}
              chartBuilderQuestions={chartBuilderQuestions}
              selectedSurveyType={selectedSurveyType}
              targetOrganizationId={comparisonData?.target?.organization_id || null}
              targetOrganizationName={comparisonData?.target?.organization_name || null}
              targetUserName={comparisonData?.target?.user_name || null}
              onSave={(document) => {
                console.log('Document saved:', document);
                setSelectedReportDocument(null); // Clear after save
              }}
              onClose={() => {
                setSelectedReportDocument(null);
                setActiveMainTab(0);
              }}
            />
          </Box>
        )}

        {/* Tab Content: Report Library */}
        {activeMainTab === 3 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Box sx={{ minHeight: 600 }}>
                <ReportLibrary
                  onOpenReport={async (report) => {
                    console.log('Opening report:', report);
                    try {
                      // If content is missing (list view optimization), fetch full details
                      let content = report.content;
                      if (!content) {
                        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                        const res = await fetch(`${baseURL}/reports/${report.id}`);
                        if (res.ok) {
                          const detailedReport = await res.json();
                          content = detailedReport.content;
                        }
                      }

                      if (content) {
                        // Important: Inject the database ID into the document structure
                        // so the editor knows it's an existing report (not a new one)
                        const documentWithId = {
                          ...content,
                          id: report.id // Use the real database ID
                        };
                        setSelectedReportDocument(documentWithId);
                        setActiveMainTab(2); // Switch to Report Creator tab
                      } else {
                        console.warn('Report has no content to display');
                        alert('This report has no content to display');
                      }
                    } catch (e) {
                      console.error('Error opening report:', e);
                      alert('Failed to open report');
                    }
                  }}
                  onCreateNew={() => {
                    setSelectedReportDocument(null); // Start fresh
                    setActiveMainTab(2);
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Tab Content: Survey Analytics (original content) - Only show when tab 0 is selected */}
        {activeMainTab === 0 && (
          <>
            {/* Control Panel */}
            <Card sx={{ mb: 3, backgroundColor: adminColors.cardBg, border: `1px solid ${adminColors.borderColor}` }}>
              <CardContent>
                {/* Data Source Status */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={`Data Source: ${isTestMode ? 'Sample Data' : 'Backend API'}`}
                    color={isTestMode ? 'warning' : 'success'}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`${availableResponses.length} ${selectedSurveyType === 'all' ? 'total' : selectedSurveyType} responses`}
                    sx={{ backgroundColor: adminColors.secondary, color: 'white' }}
                    size="small"
                  />
                  {selectedMapSurveys.length > 0 && (
                    <Chip
                      label={`Using ${selectedMapSurveys.filter(isSameType).length} of ${selectedMapSurveys.length} selected surveys`}
                      sx={{ backgroundColor: adminColors.highlightBg, color: adminColors.primary, border: `1px solid ${adminColors.primary}` }}
                      size="small"
                      variant="outlined"
                      onDelete={() => setSelectedMapSurveys([])}
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportData}
                    size="small"
                    sx={{ borderColor: adminColors.primary, color: adminColors.primary }}
                  >
                    Export for Stata/NVivo
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: adminColors.borderColor }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: adminColors.text }}>Survey Type</InputLabel>
                      <Select
                        value={selectedSurveyType}
                        label="Survey Type"
                        onChange={handleSurveyTypeChange}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: adminColors.borderColor },
                            '&:hover fieldset': { borderColor: adminColors.primary },
                            '&.Mui-focused fieldset': { borderColor: adminColors.primary }
                          }
                        }}
                      >
                        <MenuItem value="church">Church Survey</MenuItem>
                        <MenuItem value="institution">Institution Survey</MenuItem>
                        <MenuItem value="nonFormal">Non-Formal Survey</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: adminColors.text }}>Select Response to Analyze</InputLabel>
                      <Select
                        value={selectedResponseId || ''}
                        label="Select Response to Analyze"
                        onChange={(e) => setSelectedResponseId(String(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: adminColors.borderColor },
                            '&:hover fieldset': { borderColor: adminColors.primary },
                            '&.Mui-focused fieldset': { borderColor: adminColors.primary }
                          }
                        }}
                      >
                        {availableResponses.map((response) => (
                          <MenuItem key={response.id} value={String(response.id)}>
                            {getEnhancedResponseDisplayName(response)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>


                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: adminColors.text }}>Country</InputLabel>
                      <Select
                        value={filters.country}
                        label="Country"
                        onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: adminColors.borderColor },
                            '&:hover fieldset': { borderColor: adminColors.primary },
                            '&.Mui-focused fieldset': { borderColor: adminColors.primary }
                          }
                        }}
                      >
                        <MenuItem value="">All Countries</MenuItem>
                        {getUniqueValues('country').map((country) => (
                          <MenuItem key={country} value={country}>{country}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" pt={1}>
                      <Chip
                        label={`${filteredResponses.length} Filtered Results`}
                        sx={{ backgroundColor: adminColors.primary, color: 'white' }}
                        size="small"
                      />
                      {filters.survey_type && (
                        <Chip
                          label={`Survey Type: ${surveyTypes.find(t => t.value === filters.survey_type)?.label || filters.survey_type}`}
                          sx={{ backgroundColor: adminColors.lightPurple, color: adminColors.primary, border: `1px solid ${adminColors.primary}` }}
                          size="small"
                          variant="outlined"
                          onDelete={() => setFilters({ ...filters, survey_type: '' })}
                        />
                      )}
                      {filters.country && (
                        <Chip
                          label={`Country: ${filters.country}`}
                          sx={{ backgroundColor: adminColors.lightPurple, color: adminColors.primary, border: `1px solid ${adminColors.primary}` }}
                          size="small"
                          variant="outlined"
                          onDelete={() => setFilters({ ...filters, country: '' })}
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Currently Analyzing - Person and Organization Info */}
            {comparisonData?.target && (
              <Card sx={{
                mb: 3,
                p: 2,
                backgroundColor: adminColors.lightPurple,
                border: `2px solid ${adminColors.primary}`,
                borderRadius: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: adminColors.primary }}>
                    Currently Analyzing:
                  </Typography>
                  {comparisonData.target.user_name && (
                    <Chip
                      icon={<PersonIcon sx={{ ml: 1, fontSize: '1.2rem !important' }} />}
                      label={comparisonData.target.user_name}
                      sx={{
                        bgcolor: 'white',
                        color: adminColors.text,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        border: `1px solid ${adminColors.primary}`,
                        '& .MuiChip-label': { px: 1.5 }
                      }}
                    />
                  )}
                  {comparisonData.target.organization_name && (
                    <Chip
                      label={comparisonData.target.organization_name}
                      sx={{
                        bgcolor: adminColors.primary,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        '& .MuiChip-label': { px: 1.5 }
                      }}
                    />
                  )}
                  {comparisonData.target.organization_type && (
                    <Chip
                      label={comparisonData.target.organization_type}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: adminColors.secondary,
                        color: adminColors.secondary,
                        fontWeight: 500
                      }}
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Template: {comparisonData.target.template_code}
                  </Typography>
                </Box>
              </Card>
            )}

            {/* Survey Map Card */}
            <Card sx={{ mb: 3, p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
              <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                Survey Response Map
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Interactive map showing survey response locations. Click markers to select specific surveys for comparison.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <SurveyMapCard
                  surveyData={surveyData}
                  targetSurveyId={selectedResponseId}
                  selectedSurveyType={selectedSurveyType}
                  onSurveySelection={handleMapSurveySelection}
                  onAreaSelection={handleMapAreaSelection}
                  onSurveyTypeChange={setSelectedSurveyType}
                  adminColors={adminColors}
                  hideTitle={true}
                />
              </Box>
            </Card>

            {/* Chart Builder Card */}
            <Card sx={{ mb: 3, p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
              <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                Custom Chart Builder
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create custom visualizations from your survey data. Choose chart types, data fields, and filters.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <ChartSelectorCard
                  onCreateChart={handleCreateCustomChart}
                  surveyType={selectedSurveyType}
                  isExpanded={chartBuilderExpanded}
                  onToggleExpand={() => setChartBuilderExpanded(!chartBuilderExpanded)}
                  questions={chartBuilderQuestions}
                  loadingQuestions={loadingQuestions}
                  surveyData={surveyData}
                  adminColors={adminColors}
                  hideTitle={true}
                />
              </Box>
            </Card>

            {/* Info Alert about Template-Based Comparison */}
            {!isTestMode && comparisonData && (
              <>
                {comparisonData.isEmpty ? (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>⚠️ Empty Survey Template</strong>
                    </Typography>
                    <Typography variant="body2">
                      {comparisonData.errorMessage || 'This survey template has no questions defined.'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Template:</strong> {comparisonData.target?.template_code}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Please contact an administrator to fix this template or reassign this survey to a valid template.
                    </Typography>
                  </Alert>
                ) : comparisonData.stats?.total_comparisons > 0 ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>Question-Based Comparison</strong>
                    </Typography>
                    <Typography variant="body2">
                      Comparing this survey with <strong>{comparisonData.stats.total_comparisons}</strong> other surveys that have the same questions within the <strong>{selectedSurveyType}</strong> organization type.
                      Surveys from different templates are compared as long as they contain matching questions.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Your template: {comparisonData.target?.template_code} • {comparisonData.stats?.questions_compared || 0} questions compared
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>No Matching Surveys Found</strong>
                    </Typography>
                    <Typography variant="body2">
                      This survey uses template <strong>{comparisonData.target?.template_code}</strong> with {comparisonData.target?.template_questions_count || 0} questions.
                      No other completed surveys from <strong>{selectedSurveyType}</strong> organizations have matching questions.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Note:</strong> The system compares surveys based on question content, not just template ID.
                      Other surveys may use different templates but can still be compared if they have the same questions.
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            {/* Analytics Dashboard */}
            {comparisonData && (
              <Grid container spacing={3}>
                {/* Comparison Overview */}
                <Grid item xs={12} md={4}>
                  <ComparisonCard
                    title="Individual vs Group Comparison"
                    targetResponse={comparisonData.target}
                    comparisonStats={comparisonData.stats}
                    adminColors={adminColors}
                  />
                </Grid>

                {/* Score Comparison Charts - Categorized by Data Type */}
                {(() => {
                  const categorizedData = categorizeComparisonData(
                    comparisonData.averages,
                    comparisonData.targetScores,
                    comparisonData.question_labels,
                    comparisonData.question_meta
                  );

                  if (!categorizedData.hasData) {
                    return (
                      <Grid item xs={12}>
                        <Alert severity="info">No numeric data available for chart visualization.</Alert>
                      </Grid>
                    );
                  }

                  return (
                    <>
                      {/* Category summary */}
                      <Grid item xs={12}>
                        <Box sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1,
                          mb: 2,
                          p: 2,
                          bgcolor: adminColors.headerBg,
                          borderRadius: 2,
                          border: `1px solid ${adminColors.borderColor}`
                        }}>
                          <Typography variant="subtitle2" sx={{ width: '100%', mb: 1, color: adminColors.primary, fontWeight: 'bold' }}>
                            Data Categories ({categorizedData.totalQuestions} questions organized into {categorizedData.categories.length} groups)
                          </Typography>
                          {categorizedData.categories.map(cat => (
                            <Chip
                              key={cat.key}
                              label={`${cat.title} (${cat.questionCount})`}
                              size="small"
                              sx={{
                                bgcolor: adminColors.lightPurple,
                                color: adminColors.primary,
                                border: `1px solid ${adminColors.primary}`,
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      </Grid>

                      {/* Render each category as a separate chart */}
                      {categorizedData.categories.map((category, index) => {
                        const isRatingsCategory = category.key === 'ratings';
                        const isFinancialCategory = category.key === 'financial';
                        const showRadar = isRatingsCategory && Object.keys(category.data).length >= 3;

                        // For noAggregate categories (years, demographics), only show individual values
                        const isNoAggregate = category.noAggregate === true;
                        const hasTargetData = Object.keys(category.targetData).length > 0;

                        // Standard chart rendering for all categories (including financial)
                        return (
                          <React.Fragment key={category.key}>
                            {/* Bar Chart for this category */}
                            <Grid item xs={12} lg={showRadar ? 8 : 12}>
                              <Card sx={{
                                p: 2,
                                backgroundColor: adminColors.cardBg,
                                border: `1px solid ${adminColors.borderColor}`,
                                borderRadius: 2,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="h6" sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                                    {category.title}
                                  </Typography>
                                  <Chip
                                    label={`${category.questionCount} metrics`}
                                    size="small"
                                    sx={{ bgcolor: adminColors.secondary, color: 'white' }}
                                  />
                                  {isNoAggregate && (
                                    <Chip
                                      label="Individual Values Only"
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        borderColor: '#ff9800',
                                        color: '#ff9800',
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}
                                  {!isNoAggregate && hasTargetData && (
                                    <Chip
                                      label="Comparison View"
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        borderColor: '#4caf50',
                                        color: '#4caf50',
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {category.description}
                                </Typography>
                                <InteractiveBarChart
                                  title=""
                                  data={isNoAggregate ? category.targetData : category.data}
                                  targetData={isNoAggregate ? null : (hasTargetData ? category.targetData : null)}
                                  showComparison={!isNoAggregate && hasTargetData}
                                  maxValue={category.maxValue}
                                  minValue={category.minValue || 0}
                                  adminColors={adminColors}
                                  questionLabels={comparisonData.question_labels}
                                  height={Math.max(200, Object.keys(category.data).length * 45)}
                                  formatCurrency={category.formatCurrency}
                                />
                              </Card>
                            </Grid>

                            {/* Radar Chart - only for ratings category with enough data points */}
                            {showRadar && (
                              <Grid item xs={12} lg={4}>
                                <Card sx={{
                                  p: 2,
                                  backgroundColor: adminColors.cardBg,
                                  border: `1px solid ${adminColors.borderColor}`,
                                  borderRadius: 2,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                  <Typography variant="h6" sx={{ color: adminColors.primary, fontWeight: 'bold', mb: 1 }}>
                                    Performance Profile
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Radar view of rating metrics
                                  </Typography>
                                  <InteractiveRadarChart
                                    title=""
                                    data={category.data}
                                    targetData={Object.keys(category.targetData).length > 0 ? category.targetData : null}
                                    showComparison={Object.keys(category.targetData).length > 0}
                                    maxValue={category.maxValue}
                                    adminColors={adminColors}
                                    questionLabels={comparisonData.question_labels}
                                    height={350}
                                  />
                                </Card>
                              </Grid>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                })()}

                {/* Geographic Distribution */}
                <Grid item xs={12} md={6}>
                  <Card sx={{
                    p: 2,
                    backgroundColor: adminColors.cardBg,
                    border: `1px solid ${adminColors.borderColor}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" sx={{ color: adminColors.primary, fontWeight: 'bold', mb: 1 }}>
                      Geographic Distribution
                    </Typography>
                    <InteractiveBarChart
                      title=""
                      data={Object.fromEntries(Object.entries(geographicData).map(([k, v]) => [k, v.count]))}
                      maxValue={Math.max(...Object.values(geographicData).map(v => v.count), 1)}
                      adminColors={adminColors}
                      height={300}
                    />
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{
                    p: 2,
                    backgroundColor: adminColors.cardBg,
                    border: `1px solid ${adminColors.borderColor}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" sx={{ color: adminColors.primary, fontWeight: 'bold', mb: 1 }}>
                      Response Distribution by Country
                    </Typography>
                    <InteractivePieChart
                      title=""
                      data={Object.fromEntries(
                        Object.entries(geographicData)
                          .map(([k, v]) => [k, v.count])
                          .sort((a, b) => b[1] - a[1])
                      )}
                      adminColors={adminColors}
                      height={300}
                    />
                  </Card>
                </Grid>

                {/* Text Analytics from text_analytics.py */}
                {comparisonData?.text_analytics && (
                  <Grid item xs={12}>
                    <TextAnalyticsDisplay
                      textAnalytics={comparisonData.text_analytics}
                      adminColors={adminColors}
                    />
                  </Grid>
                )}

                {/* Fallback: Old Qualitative Analysis (for test mode or if text analytics not available) */}
                {(!comparisonData?.text_analytics || isTestMode) && (
                  <>
                    <Grid item xs={12}>
                      <Card sx={{ p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
                        <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                          Qualitative Insights
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <QualitativeAnalysis
                            surveyType={selectedSurveyType}
                            selectedResponseId={selectedResponseId}
                            selectedResponseLabel={availableResponses.find(r => String(r.id) === String(selectedResponseId))
                              ? getEnhancedResponseDisplayName(availableResponses.find(r => String(r.id) === String(selectedResponseId)))
                              : 'Selected Response'}
                            selectedMapSurveys={selectedMapSurveys}
                            userColors={adminColors}
                            apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            isTestMode={isTestMode}
                            hideTitle={true}
                          />
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <Card sx={{ p: 3, backgroundColor: adminColors.headerBg }}>
                        <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                          Qualitative Insights Comparison
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Compare the selected response against all other responses in the dataset
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                          <QualitativeComparisonAnalysis
                            surveyType={selectedSurveyType}
                            selectedResponseId={selectedResponseId}
                            selectedResponseLabel={availableResponses.find(r => String(r.id) === String(selectedResponseId))
                              ? getEnhancedResponseDisplayName(availableResponses.find(r => String(r.id) === String(selectedResponseId)))
                              : 'Selected Response'}
                            surveyData={surveyData}
                            adminColors={adminColors}
                            apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            isTestMode={isTestMode}
                          />
                        </Box>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {/* Custom Charts Section */}
            {customCharts.length > 0 && (
              <Card sx={{ mt: 4, p: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  Custom Charts
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your custom visualizations created from survey data.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={3}>
                    {customCharts.map((chart) => (
                      <Grid item xs={12} md={6} lg={4} key={chart.id}>
                        <CustomChart
                          chartConfig={chart}
                          data={surveyData[chart.surveyType] || []}
                          onRemove={() => handleRemoveCustomChart(chart.id)}
                          onEdit={handleEditChart}
                          onDuplicate={handleDuplicateChart}
                          height={350}
                          adminColors={adminColors}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Card>
            )}

            {/* Instructions */}
            <Card sx={{ mt: 3, backgroundColor: adminColors.headerBg, border: `1px solid ${adminColors.borderColor}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                  How to Use This Analytics Dashboard
                </Typography>
                <Typography variant="body2" paragraph>
                  1. <strong>Choose Data Mode:</strong> Toggle between Test Mode (sample data) and Normal Mode (backend data)
                </Typography>
                <Typography variant="body2" paragraph>
                  2. <strong>Select Survey Type:</strong> Choose between Church, Institution, or Non-Formal surveys
                </Typography>
                <Typography variant="body2" paragraph>
                  3. <strong>Select Individual Response:</strong> Pick a specific response to analyze and compare
                </Typography>
                <Typography variant="body2" paragraph>
                  4. <strong>Apply Filters:</strong> Filter the comparison group by country, education level, or other criteria
                </Typography>
                <Typography variant="body2" paragraph>
                  5. <strong>Analyze Results:</strong> View how the individual performs compared to the group average across different training areas
                </Typography>
                <Typography variant="body2" paragraph>
                  6. <strong>Select Surveys on Map:</strong> Click on map markers to select specific surveys. When surveys are selected, all graphs will be recomputed using only the selected data
                </Typography>
                <Typography variant="body2" paragraph>
                  7. <strong>Qualitative Insights:</strong> View AI-powered analysis of open-ended responses including sentiment analysis, topic modeling, and response clustering
                </Typography>
                <Typography variant="body2" paragraph>
                  8. <strong>Create Custom Charts:</strong> Use the Chart Builder to create custom visualizations
                </Typography>
                <Typography variant="body2">
                  9. <strong>Edit Charts:</strong> Click the menu (⋮) on any chart to edit, duplicate, or delete it
                </Typography>
              </CardContent>
            </Card>

            {/* Chart Edit Dialog */}
            <ChartEditDialog
              open={editDialogOpen}
              onClose={handleCloseEditDialog}
              chartConfig={editingChart}
              onSave={handleUpdateChart}
              surveyType={selectedSurveyType}
            />
          </>
        )}
      </Container>
    </Box >
  );
};

export default UserReports;
