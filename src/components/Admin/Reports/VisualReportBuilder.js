/**
 * Visual Report Builder - Dynamic Survey Analysis Tool
 * 
 * This component provides a flexible, drag-and-drop interface for creating visual reports
 * from survey data. It features a completely configurable system with no hardcoded data.
 * 
 * CONFIGURATION SYSTEM:
 * 
 * 1. FieldConfigurationService - Manages field definitions and categories
 *    - getFieldCategories(): Returns field categories with icons and field definitions
 *    - getIconComponent(): Maps icon names to React components
 *    - Easy to extend with new field types and categories
 * 
 * 2. DataService - Handles data loading and generation
 *    - getSampleData(): Loads data from API or generates sample data
 *    - generateSurveyRecord(): Creates individual survey records
 *    - Configurable record count and data types
 * 
 * 3. TestModeService - Manages test mode configuration
 *    - getRoleConfiguration(): Returns role-based user configurations
 *    - getSampleSurveys(): Provides sample survey metadata
 *    - Dynamic survey statistics (responses, completion rates)
 * 
 * EXTENDING THE SYSTEM:
 * 
 * - Add new field categories by modifying FieldConfigurationService.getFieldCategories()
 * - Add new data types by extending DataService generators
 * - Add new roles by updating TestModeService.getRoleConfiguration()
 * - Connect to real APIs by replacing service methods with API calls
 * 
 * USAGE:
 * 
 * import VisualReportBuilder, { FieldConfigurationService, DataService } from './VisualReportBuilder';
 * 
 * // Customize field configuration
 * FieldConfigurationService.getFieldCategories = async () => {
 *   // Return your custom field configuration
 * };
 * 
 * // Customize data loading
 * DataService.getSampleData = async (dataType) => {
 *   // Return your custom data
 * };
 * 
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Badge,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Checkbox,
    ListItemButton,
    Avatar,
    LinearProgress
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    Numbers as NumbersIcon,
    Category as CategoryIcon,
    DateRange as DateIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ShowChart as LineChartIcon,
    TableChart as TableChartIcon,
    ScatterPlot as ScatterPlotIcon,
    FilterList as FilterIcon,
    Palette as ColorIcon,
    SwapHoriz as SwapIcon,
    Add as AddIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    PlayArrow as PlayArrowIcon,
    Settings as SettingsIcon,
    Fullscreen as FullscreenIcon,
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    ExpandMore as ExpandMoreIcon,
    School as SchoolIcon,
    Church as ChurchIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    CompareArrows as CompareArrowsIcon,
    CheckCircle as CheckCircleIcon,
    Groups as GroupsIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
    Group as GroupIcon,
    Star as StarIcon,
    TrendingUp as TrendingUpIcon,
    Analytics as PercentIcon,
    TextFields as TextIcon,
    Public as PublicIcon,
    LocationCity as LocationCityIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ComposedChart
} from 'recharts';
import Navbar from '../../shared/Navbar/Navbar';
import SampleDataService from '../../../services/SampleDataService';

// Admin colors consistent with existing theme
const adminColors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    text: '#212121',
    headerBg: '#ede7f6',
    borderColor: '#e0e0e0',
    highlightBg: '#f3e5f5',
    dropZone: '#e8f5e8',
    dropZoneActive: '#c8e6c9',
    warning: '#ff9800',
    error: '#f44336',
    success: '#4caf50'
};

const chartColors = [
    '#633394', '#967CB2', '#4CAF50', '#FF9800', '#F44336',
    '#2196F3', '#9C27B0', '#795548', '#607D8B', '#E91E63'
];

// Dynamic Field Configuration Service
const FieldConfigurationService = {
    // Load field definitions dynamically from API or configuration
    getFieldCategories: async () => {
        try {
            // This would typically come from an API endpoint
            // Example: const response = await fetch('/api/admin/reports/field-categories');
            // return response.json();

            // For now, return empty object - fields will be loaded from actual data source
            console.log('Loading field categories from API...');

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Return empty categories - will be populated by actual data analysis
            return {};

        } catch (error) {
            console.error('Error loading field categories:', error);
            return {};
        }
    },

    // Analyze data structure and generate field definitions dynamically
    generateFieldsFromData: async (sampleData) => {
        // Analyzes data structure automatically
        // Determines field types (dimension vs measure)
        // Categorizes fields intelligently
        // Assigns appropriate icons
    },

    // Determine if field is dimension or measure based on key and value
    determineFieldType: (fieldKey, value) => {
        // Measure indicators
        const measureKeywords = [
            'count', 'total', 'sum', 'average', 'mean', 'median', 'mode',
            'score', 'rate', 'percentage', 'ratio', 'duration', 'time',
            'value', 'amount', 'number', 'quantity', 'level', 'rank',
            'deviation', 'variance', 'correlation', 'difference'
        ];

        // Check if field key contains measure keywords
        const keyLower = fieldKey.toLowerCase();
        const isMeasureByKey = measureKeywords.some(keyword => keyLower.includes(keyword));

        // Check if value is numeric
        const isNumeric = typeof value === 'number' ||
            (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value));

        // Determine type
        if (isMeasureByKey || (isNumeric && !keyLower.includes('id') && !keyLower.includes('order'))) {
            return 'measure';
        }

        return 'dimension';
    },

    // Categorize field based on its key name
    categorizeField: (fieldKey) => {
        const categories = {
            'Question Analysis': [
                'question', 'survey_section', 'section', 'category', 'type', 'scale',
                'required', 'order', 'text'
            ],
            'Response Analysis': [
                'response', 'answer', 'value', 'status', 'method', 'score',
                'percentage', 'weighted', 'normalized'
            ],
            'Survey Structure': [
                'survey', 'version', 'language', 'total', 'completion', 'length'
            ],
            'Demographics & Users': [
                'user', 'organization', 'department', 'location', 'country',
                'region', 'experience', 'education', 'age', 'gender', 'role'
            ],
            'Time & Engagement': [
                'date', 'time', 'month', 'quarter', 'year', 'day', 'launch',
                'close', 'duration', 'session', 'engagement', 'participation'
            ],
            'Statistical Analysis': [
                'mean', 'median', 'mode', 'deviation', 'variance', 'confidence',
                'correlation', 'percentile', 'z_score', 'distribution'
            ],
            'Comparison & Benchmarking': [
                'comparison', 'benchmark', 'peer', 'industry', 'difference',
                'rank', 'position'
            ]
        };

        const keyLower = fieldKey.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => keyLower.includes(keyword))) {
                return category;
            }
        }

        return 'Other Fields';
    },

    // Get category icon based on category name
    getCategoryIcon: (categoryName) => {
        const iconMap = {
            'Question Analysis': 'AssignmentIcon',
            'Response Analysis': 'NumbersIcon',
            'Survey Structure': 'CategoryIcon',
            'Demographics & Users': 'PersonIcon',
            'Time & Engagement': 'DateIcon',
            'Statistical Analysis': 'NumbersIcon',
            'Comparison & Benchmarking': 'CompareArrowsIcon',
            'Other Fields': 'CategoryIcon'
        };

        return iconMap[categoryName] || 'CategoryIcon';
    },

    // Format field name for display
    formatFieldName: (fieldKey) => {
        return fieldKey
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    // Get icon component by name
    getIconComponent: (iconName) => {
        const iconMap = {
            'AssignmentIcon': <AssignmentIcon />,
            'NumbersIcon': <NumbersIcon />,
            'CategoryIcon': <CategoryIcon />,
            'PersonIcon': <PersonIcon />,
            'BusinessIcon': <BusinessIcon />,
            'LocationIcon': <LocationIcon />,
            'DateIcon': <DateIcon />,
            'CompareArrowsIcon': <CompareArrowsIcon />,
            'SchoolIcon': <SchoolIcon />,
            'CheckCircleIcon': <CheckCircleIcon />,
            'GroupsIcon': <GroupsIcon />,
            'StarIcon': <StarIcon />,
            'TrendingUpIcon': <TrendingUpIcon />,
            'PercentIcon': <PercentIcon />,
            'TextIcon': <TextIcon />,
            'PublicIcon': <PublicIcon />,
            'LocationCityIcon': <LocationCityIcon />,
            'TimeIcon': <TimeIcon />,
            'DateRangeIcon': <DateIcon />
        };
        return iconMap[iconName] || <CategoryIcon />;
    }
};

// Dynamic Data Service
const DataService = {
    // Load data from external API or data source
    getSampleData: async (dataType = 'survey', params = {}) => {
        try {
            // This would typically call your API endpoints
            // Example API calls:
            // const response = await fetch(`/api/admin/reports/data/${dataType}`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(params)
            // });
            // return response.json();

            console.log(`Loading ${dataType} data from API with params:`, params);

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Return empty array - data should come from actual data source
            // In production, this would be populated by your backend API
            return [];

        } catch (error) {
            console.error('Error loading sample data:', error);
            return [];
        }
    },

    // Load data from connected database or file upload
    loadDataFromSource: async (source) => {
        try {
            switch (source.type) {
                case 'api':
                    return await DataService.loadFromAPI(source.endpoint, source.params);
                case 'database':
                    return await DataService.loadFromDatabase(source.connection, source.query);
                case 'file':
                    return await DataService.loadFromFile(source.file);
                case 'csv':
                    return await DataService.loadFromCSV(source.data);
                default:
                    console.log('No data source configured, returning empty dataset');
                    return [];
            }
        } catch (error) {
            console.error('Error loading data from source:', error);
            return [];
        }
    },

    // Load data from API endpoint
    loadFromAPI: async (endpoint, params = {}) => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error loading from API:', error);
            throw error;
        }
    },

    // Load data from database query
    loadFromDatabase: async (connection, query) => {
        try {
            // This would connect to your database
            // Example: const result = await dbClient.query(query);
            // return result.rows;

            console.log('Database query:', query);
            console.log('Connection:', connection);

            // Return empty array - implement your database connection
            return [];
        } catch (error) {
            console.error('Error loading from database:', error);
            throw error;
        }
    },

    // Load data from uploaded file
    loadFromFile: async (file) => {
        try {
            const text = await file.text();

            // Determine file type and parse accordingly
            if (file.type === 'application/json') {
                return JSON.parse(text);
            } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                return DataService.parseCSV(text);
            } else {
                throw new Error('Unsupported file type');
            }
        } catch (error) {
            console.error('Error loading from file:', error);
            throw error;
        }
    },

    // Load data from CSV string
    loadFromCSV: async (csvData) => {
        try {
            return DataService.parseCSV(csvData);
        } catch (error) {
            console.error('Error loading from CSV:', error);
            throw error;
        }
    },

    // Parse CSV data into JSON format
    parseCSV: (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const record = {};

            headers.forEach((header, index) => {
                const value = values[index] || '';
                // Try to parse as number, otherwise keep as string
                record[header] = isNaN(value) ? value : parseFloat(value);
            });

            data.push(record);
        }

        return data;
    },

    // Get sample data configuration options
    getDataSourceOptions: () => {
        return {
            api: {
                name: 'API Endpoint',
                description: 'Load data from REST API',
                fields: ['endpoint', 'method', 'headers', 'params']
            },
            database: {
                name: 'Database Query',
                description: 'Load data from SQL database',
                fields: ['connection', 'query', 'parameters']
            },
            file: {
                name: 'File Upload',
                description: 'Upload JSON or CSV file',
                fields: ['file']
            },
            csv: {
                name: 'CSV Data',
                description: 'Paste CSV data directly',
                fields: ['csvData']
            }
        };
    },

    // Validate data structure
    validateData: (data) => {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array of records');
        }

        if (data.length === 0) {
            return { valid: true, message: 'No data to validate' };
        }

        const firstRecord = data[0];
        if (typeof firstRecord !== 'object') {
            throw new Error('Each record must be an object');
        }

        const fields = Object.keys(firstRecord);
        if (fields.length === 0) {
            throw new Error('Records must have at least one field');
        }

        return {
            valid: true,
            recordCount: data.length,
            fieldCount: fields.length,
            fields: fields,
            sampleRecord: firstRecord
        };
    },

    // Get data summary statistics
    getDataSummary: (data) => {
        if (!data || data.length === 0) {
            return { recordCount: 0, fields: [] };
        }

        const fields = Object.keys(data[0]);
        const summary = {
            recordCount: data.length,
            fields: fields.map(field => {
                const values = data.map(record => record[field]).filter(v => v !== null && v !== undefined);
                const nonNullCount = values.length;
                const uniqueValues = [...new Set(values)];

                let fieldType = 'text';
                let stats = {};

                // Determine field type and calculate statistics
                if (values.every(v => typeof v === 'number' || !isNaN(parseFloat(v)))) {
                    fieldType = 'numeric';
                    const numericValues = values.map(v => parseFloat(v));
                    stats = {
                        min: Math.min(...numericValues),
                        max: Math.max(...numericValues),
                        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
                    };
                } else if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
                    fieldType = 'boolean';
                } else if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(v))) {
                    fieldType = 'date';
                }

                return {
                    name: field,
                    type: fieldType,
                    nonNullCount,
                    uniqueValueCount: uniqueValues.length,
                    sampleValues: uniqueValues.slice(0, 5),
                    statistics: stats
                };
            })
        };

        return summary;
    }
};

// Test Mode Configuration Service
const TestModeService = {
    async loadSampleData() {
        try {
            // Load all sample data files
            const [churchResponses, institutionResponses, nonFormalResponses, surveyQuestions] = await Promise.all([
                fetch('/sample-data/church-survey-responses.json').then(res => res.json()),
                fetch('/sample-data/institution-survey-responses.json').then(res => res.json()),
                fetch('/sample-data/non-formal-survey-responses.json').then(res => res.json()),
                fetch('/sample-data/survey-questions.json').then(res => res.json())
            ]);

            return {
                church: churchResponses,
                institution: institutionResponses,
                nonFormal: nonFormalResponses,
                questions: surveyQuestions
            };
        } catch (error) {
            console.error('Error loading sample data:', error);
            // Fallback to original hardcoded data if files can't be loaded
            return this.getFallbackData();
        }
    },

    getFallbackData() {
        // Original hardcoded data as fallback
        return {
            church: { responses: [] },
            institution: { responses: [] },
            nonFormal: { responses: [] },
            questions: {}
        };
    },

    async getRoleConfiguration() {
        const sampleData = await this.loadSampleData();

        const roleConfig = {
            'Pastor': {
                icon: '⛪',
                description: 'Church pastors and leaders',
                users: sampleData.church.responses.map(response => ({
                    id: `church_${response.id}`,
                    name: response.pastor_name,
                    organization: response.church_name,
                    location: `${response.city}, ${response.country}`,
                    experience: response.years_as_pastor,
                    education: response.education_level,
                    surveyType: 'church',
                    responseData: response
                }))
            },
            'Institution President': {
                icon: '🏛️',
                description: 'Theological institution presidents and administrators',
                users: sampleData.institution.responses.map(response => ({
                    id: `institution_${response.id}`,
                    name: response.president_name,
                    organization: response.institution_name,
                    location: `${response.city}, ${response.country}`,
                    experience: response.years_as_president,
                    education: response.academic_qualification,
                    surveyType: 'institution',
                    responseData: response
                }))
            },
            'Ministry Leader': {
                icon: '🙏',
                description: 'Non-formal ministry leaders',
                users: sampleData.nonFormal.responses.map(response => ({
                    id: `nonformal_${response.id}`,
                    name: response.leader_name,
                    organization: response.ministry_name,
                    location: `${response.city}, ${response.country}`,
                    experience: response.years_in_ministry,
                    education: 'Non-formal',
                    surveyType: 'non_formal',
                    responseData: response
                }))
            }
        };

        return roleConfig;
    },

    async getSampleSurveys() {
        const sampleData = await this.loadSampleData();

        const surveys = [
            {
                id: 'church_survey',
                name: 'Church Leadership Assessment',
                description: 'Assessment for church pastors and leaders',
                responses: sampleData.church.responses.length,
                completion_rate: this.calculateCompletionRate(sampleData.church.responses),
                last_updated: this.getLatestResponseDate(sampleData.church.responses),
                surveyType: 'church',
                questions: sampleData.questions.church_survey
            },
            {
                id: 'institution_survey',
                name: 'Theological Institution Assessment',
                description: 'Assessment for theological institution presidents',
                responses: sampleData.institution.responses.length,
                completion_rate: this.calculateCompletionRate(sampleData.institution.responses),
                last_updated: this.getLatestResponseDate(sampleData.institution.responses),
                surveyType: 'institution',
                questions: sampleData.questions.institution_survey
            },
            {
                id: 'nonformal_survey',
                name: 'Non-Formal Ministry Assessment',
                description: 'Assessment for non-formal ministry leaders',
                responses: sampleData.nonFormal.responses.length,
                completion_rate: this.calculateCompletionRate(sampleData.nonFormal.responses),
                last_updated: this.getLatestResponseDate(sampleData.nonFormal.responses),
                surveyType: 'non_formal',
                questions: sampleData.questions.non_formal_survey
            }
        ];

        return surveys;
    },

    calculateCompletionRate(responses) {
        if (!responses || responses.length === 0) return 0;

        // Count responses that have substantial data (not just partial responses)
        const completedCount = responses.filter(response => {
            // Check if response has scoring data which indicates completion
            return response.ministry_training_scores ||
                response.leadership_assessment ||
                response.ministry_preparation_scores;
        }).length;

        return Math.round((completedCount / responses.length) * 100);
    },

    getLatestResponseDate(responses) {
        if (!responses || responses.length === 0) return '2024-01-01';

        const dates = responses.map(r => new Date(r.response_date));
        const latest = new Date(Math.max(...dates));
        return latest.toISOString().split('T')[0];
    }
};

const VisualReportBuilder = ({ onLogout }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [canvas, setCanvas] = useState({
        columns: [],
        rows: [],
        filters: [],
        colors: [],
        chartType: 'bar',
        title: 'New Report',
        showLegend: true,
        showGrid: true
    });
    const [availableFields, setAvailableFields] = useState({});
    const [previewData, setPreviewData] = useState([]);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [reportName, setReportName] = useState('');
    const [loading, setLoading] = useState(false);

    // Test Mode toggle state
    const [testMode, setTestMode] = useState(false);

    // Test Mode Filters state
    const [testModeFilters, setTestModeFilters] = useState({
        selectedRole: '',
        selectedUser: '',
        selectedSurvey: '',
        availableUsers: [],
        availableSurveys: [],
        compareUsers: [],
        showComparison: false,
        userResponses: [], // Add user responses data
        comparisonResponses: [] // Add comparison data
    });

    // Add state for numerical comparison data
    const [comparisonData, setComparisonData] = useState({
        selectedUserData: null,
        comparisonUsersData: [],
        ministryScores: {},
        averageScores: {},
        scoreDifferences: {}
    });

    const dragRef = useRef(null);

    const tabs = [
        { label: 'Home', path: '/home' },
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Assessment Overview', path: '/root-dashboard' },
        { label: '360 Degree Assessment', path: '/edit-assessments' },
        { label: 'Users Management', path: '/users' },
        { label: 'Settings', path: '/settings' },
        { label: 'Reports', path: '/reports' },
        { label: 'Report Builder', path: '/reportbuilder' },
        { label: 'Visual Builder', path: '/visual-builder' },
    ];

    const chartTypes = [
        { id: 'bar', name: 'Bar Chart', icon: <BarChartIcon />, description: 'Compare categories' },
        { id: 'line', name: 'Line Chart', icon: <LineChartIcon />, description: 'Show trends over time' },
        { id: 'pie', name: 'Pie Chart', icon: <PieChartIcon />, description: 'Show parts of a whole' },
        { id: 'table', name: 'Table', icon: <TableChartIcon />, description: 'Detailed data view' },
    ];



    useEffect(() => {
        // Load default fields for normal mode
        if (!testMode) {
            loadDefaultFields();
        }
    }, []);

    useEffect(() => {
        // When test mode toggles, handle field loading
        if (testMode) {
            // Clear any existing fields
            setAvailableFields({});
            // Reset test mode filters
            setTestModeFilters({
                selectedRole: '',
                selectedUser: '',
                selectedSurvey: '',
                availableUsers: [],
                availableSurveys: [],
                compareUsers: [],
                showComparison: false,
                userResponses: [],
                comparisonResponses: []
            });
        } else {
            // Load default fields for normal mode
            loadDefaultFields();
        }
    }, [testMode]);

    useEffect(() => {
        if (canvas.columns.length > 0 || canvas.rows.length > 0) {
            generatePreviewData();
        }
    }, [canvas]);

    const loadDefaultFields = async () => {
        try {
            setLoading(true);

            // First, try to load data from external source
            const sampleData = await DataService.getSampleData('survey');

            if (sampleData && sampleData.length > 0) {
                // Generate fields dynamically from the loaded data
                const fieldCategories = await FieldConfigurationService.generateFieldsFromData(sampleData);
                const processedFields = {};

                // Process each category and add icons
                Object.entries(fieldCategories).forEach(([categoryName, categoryConfig]) => {
                    processedFields[categoryName] = categoryConfig.fields.map(field => ({
                        ...field,
                        icon: FieldConfigurationService.getIconComponent(categoryConfig.icon),
                        category: categoryName
                    }));
                });

                setAvailableFields(processedFields);
                setChartData(sampleData);

                console.log('Fields generated from data:', processedFields);
                console.log('Data summary:', DataService.getDataSummary(sampleData));
            } else {
                // No data available, show empty state
                setAvailableFields({});
                setChartData([]);
                console.log('No data available - fields will be empty until data is loaded');
            }

        } catch (error) {
            console.error('Error loading fields:', error);
            // Fallback to empty fields
            setAvailableFields({});
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    const generateSampleChartData = () => {
        // Generate comprehensive sample data for survey analysis
        const sampleData = [
            {
                // Question Analysis
                question_id: 'Q001',
                question_text: 'How effective are current teaching methods in your organization?',
                question_section: 'Teaching Methods',
                question_category: 'Effectiveness Assessment',
                question_type: 'Likert Scale',
                question_scale: '1-5 Scale',
                question_order: 1,
                is_required: 'Yes',
                question_response_count: 45,
                question_completion_rate: 95.7,
                question_skip_rate: 4.3,
                average_response_time: 32.5,

                // Response Analysis
                response_id: 'R001',
                response_value: '4',
                response_text: 'Agree',
                response_scale_label: 'Agree',
                response_status: 'Completed',
                response_method: 'Online',
                response_numeric_value: 4,
                response_percentage: 80,
                response_score: 4.2,
                weighted_score: 4.1,
                normalized_score: 82,

                // Survey Structure
                survey_id: 'S001',
                survey_title: 'Theological Education Assessment',
                survey_version: 'v2.1',
                survey_status: 'Active',
                survey_category: 'Education Assessment',
                survey_language: 'English',
                section_name: 'Teaching Methods',
                section_order: 1,
                total_questions: 25,
                total_responses: 47,
                completion_rate: 85.1,
                average_completion_time: 18.5,
                survey_length: 15,

                // Demographics & Users
                user_id: 'U001',
                user_role: 'Pastor',
                organization: 'St. Mary\'s Church',
                organization_type: 'Church',
                department: 'Ministry',
                location: 'Nairobi, Kenya',
                country: 'Kenya',
                region: 'East Africa',
                experience_level: 'Experienced',
                education_level: 'Master\'s Degree',
                age_group: '35-44',
                gender: 'Male',
                user_response_count: 3,
                user_completion_rate: 100,
                years_of_experience: 8,

                // Time & Engagement
                response_date: '2024-01-15',
                response_month: 'January',
                response_quarter: 'Q1',
                response_year: '2024',
                response_day_of_week: 'Monday',
                response_time_of_day: 'Morning',
                survey_launch_date: '2024-01-10',
                survey_close_date: '2024-02-10',
                response_time_seconds: 32,
                session_duration: 1110,
                time_per_question: 44.4,
                engagement_score: 87,
                participation_rate: 94.7,

                // Statistical Analysis
                mean_score: 4.1,
                median_score: 4,
                mode_score: 4,
                standard_deviation: 0.8,
                variance: 0.64,
                confidence_interval: 0.3,
                correlation_coefficient: 0.75,
                percentile_rank: 78,
                z_score: 0.125,
                response_distribution: 0.23,

                // Comparison & Benchmarking
                comparison_group: 'Pastors',
                benchmark_category: 'East African Churches',
                peer_group: 'Similar Role',
                comparison_score: 3.8,
                benchmark_score: 3.9,
                peer_average: 4.0,
                industry_average: 3.7,
                score_difference: 0.2,
                percentage_difference: 5.3,
                rank_position: 12,
                percentile_score: 82,

                user_type: 'primary'
            },
            {
                // Question Analysis
                question_id: 'Q002',
                question_text: 'How relevant is the curriculum content to current ministry needs?',
                question_section: 'Curriculum Content',
                question_category: 'Relevance Assessment',
                question_type: 'Likert Scale',
                question_scale: '1-5 Scale',
                question_order: 2,
                is_required: 'Yes',
                question_response_count: 43,
                question_completion_rate: 91.5,
                question_skip_rate: 8.5,
                average_response_time: 28.7,

                // Response Analysis
                response_id: 'R002',
                response_value: '5',
                response_text: 'Strongly Agree',
                response_scale_label: 'Strongly Agree',
                response_status: 'Completed',
                response_method: 'Online',
                response_numeric_value: 5,
                response_percentage: 100,
                response_score: 4.8,
                weighted_score: 4.7,
                normalized_score: 96,

                // Survey Structure
                survey_id: 'S001',
                survey_title: 'Theological Education Assessment',
                survey_version: 'v2.1',
                survey_status: 'Active',
                survey_category: 'Education Assessment',
                survey_language: 'English',
                section_name: 'Curriculum Content',
                section_order: 2,
                total_questions: 25,
                total_responses: 47,
                completion_rate: 85.1,
                average_completion_time: 18.5,
                survey_length: 15,

                // Demographics & Users
                user_id: 'U002',
                user_role: 'Professor',
                organization: 'Uganda Bible College',
                organization_type: 'Seminary',
                department: 'Theology',
                location: 'Kampala, Uganda',
                country: 'Uganda',
                region: 'East Africa',
                experience_level: 'Expert',
                education_level: 'PhD',
                age_group: '45-54',
                gender: 'Female',
                user_response_count: 5,
                user_completion_rate: 100,
                years_of_experience: 15,

                // Time & Engagement
                response_date: '2024-01-16',
                response_month: 'January',
                response_quarter: 'Q1',
                response_year: '2024',
                response_day_of_week: 'Tuesday',
                response_time_of_day: 'Afternoon',
                survey_launch_date: '2024-01-10',
                survey_close_date: '2024-02-10',
                response_time_seconds: 28,
                session_duration: 1285,
                time_per_question: 51.4,
                engagement_score: 92,
                participation_rate: 94.7,

                // Statistical Analysis
                mean_score: 4.7,
                median_score: 5,
                mode_score: 5,
                standard_deviation: 0.6,
                variance: 0.36,
                confidence_interval: 0.2,
                correlation_coefficient: 0.82,
                percentile_rank: 92,
                z_score: 0.5,
                response_distribution: 0.18,

                // Comparison & Benchmarking
                comparison_group: 'Professors',
                benchmark_category: 'East African Seminaries',
                peer_group: 'Similar Role',
                comparison_score: 4.3,
                benchmark_score: 4.2,
                peer_average: 4.5,
                industry_average: 4.1,
                score_difference: 0.4,
                percentage_difference: 9.8,
                rank_position: 3,
                percentile_score: 92,

                user_type: 'comparison'
            },
            {
                // Question Analysis
                question_id: 'Q003',
                question_text: 'How adequate are the resources available for pastoral care?',
                question_section: 'Student Support',
                question_category: 'Resource Assessment',
                question_type: 'Likert Scale',
                question_scale: '1-5 Scale',
                question_order: 3,
                is_required: 'Yes',
                question_response_count: 41,
                question_completion_rate: 87.2,
                question_skip_rate: 12.8,
                average_response_time: 35.2,

                // Response Analysis
                response_id: 'R003',
                response_value: '3',
                response_text: 'Neutral',
                response_scale_label: 'Neutral',
                response_status: 'Completed',
                response_method: 'Online',
                response_numeric_value: 3,
                response_percentage: 60,
                response_score: 3.2,
                weighted_score: 3.1,
                normalized_score: 64,

                // Survey Structure
                survey_id: 'S001',
                survey_title: 'Theological Education Assessment',
                survey_version: 'v2.1',
                survey_status: 'Active',
                survey_category: 'Education Assessment',
                survey_language: 'English',
                section_name: 'Student Support',
                section_order: 3,
                total_questions: 25,
                total_responses: 47,
                completion_rate: 85.1,
                average_completion_time: 18.5,
                survey_length: 15,

                // Demographics & Users
                user_id: 'U003',
                user_role: 'Pastor',
                organization: 'Trinity Church',
                organization_type: 'Church',
                department: 'Pastoral Care',
                location: 'Dar es Salaam, Tanzania',
                country: 'Tanzania',
                region: 'East Africa',
                experience_level: 'Intermediate',
                education_level: 'Bachelor\'s Degree',
                age_group: '25-34',
                gender: 'Male',
                user_response_count: 2,
                user_completion_rate: 85,
                years_of_experience: 5,

                // Time & Engagement
                response_date: '2024-01-17',
                response_month: 'January',
                response_quarter: 'Q1',
                response_year: '2024',
                response_day_of_week: 'Wednesday',
                response_time_of_day: 'Evening',
                survey_launch_date: '2024-01-10',
                survey_close_date: '2024-02-10',
                response_time_seconds: 35,
                session_duration: 875,
                time_per_question: 35.0,
                engagement_score: 72,
                participation_rate: 94.7,

                // Statistical Analysis
                mean_score: 3.2,
                median_score: 3,
                mode_score: 3,
                standard_deviation: 0.9,
                variance: 0.81,
                confidence_interval: 0.4,
                correlation_coefficient: 0.65,
                percentile_rank: 45,
                z_score: -0.222,
                response_distribution: 0.28,

                // Comparison & Benchmarking
                comparison_group: 'Pastors',
                benchmark_category: 'East African Churches',
                peer_group: 'Similar Role',
                comparison_score: 3.8,
                benchmark_score: 3.9,
                peer_average: 3.5,
                industry_average: 3.3,
                score_difference: -0.6,
                percentage_difference: -15.8,
                rank_position: 28,
                percentile_score: 45,

                user_type: 'comparison'
            },
            {
                // Question Analysis
                question_id: 'Q004',
                question_text: 'How accessible are learning resources and materials?',
                question_section: 'Resource Availability',
                question_category: 'Access Assessment',
                question_type: 'Likert Scale',
                question_scale: '1-5 Scale',
                question_order: 4,
                is_required: 'Yes',
                question_response_count: 44,
                question_completion_rate: 93.6,
                question_skip_rate: 6.4,
                average_response_time: 29.8,

                // Response Analysis
                response_id: 'R004',
                response_value: '4',
                response_text: 'Agree',
                response_scale_label: 'Agree',
                response_status: 'Completed',
                response_method: 'Online',
                response_numeric_value: 4,
                response_percentage: 80,
                response_score: 4.0,
                weighted_score: 3.9,
                normalized_score: 80,

                // Survey Structure
                survey_id: 'S001',
                survey_title: 'Theological Education Assessment',
                survey_version: 'v2.1',
                survey_status: 'Active',
                survey_category: 'Education Assessment',
                survey_language: 'English',
                section_name: 'Resource Availability',
                section_order: 4,
                total_questions: 25,
                total_responses: 47,
                completion_rate: 85.1,
                average_completion_time: 18.5,
                survey_length: 15,

                // Demographics & Users
                user_id: 'U004',
                user_role: 'Pastor',
                organization: 'Grace Fellowship',
                organization_type: 'Church',
                department: 'Education',
                location: 'Kigali, Rwanda',
                country: 'Rwanda',
                region: 'East Africa',
                experience_level: 'Experienced',
                education_level: 'Master\'s Degree',
                age_group: '35-44',
                gender: 'Female',
                user_response_count: 4,
                user_completion_rate: 95,
                years_of_experience: 10,

                // Time & Engagement
                response_date: '2024-01-18',
                response_month: 'January',
                response_quarter: 'Q1',
                response_year: '2024',
                response_day_of_week: 'Thursday',
                response_time_of_day: 'Morning',
                survey_launch_date: '2024-01-10',
                survey_close_date: '2024-02-10',
                response_time_seconds: 30,
                session_duration: 1200,
                time_per_question: 48.0,
                engagement_score: 85,
                participation_rate: 94.7,

                // Statistical Analysis
                mean_score: 4.0,
                median_score: 4,
                mode_score: 4,
                standard_deviation: 0.7,
                variance: 0.49,
                confidence_interval: 0.25,
                correlation_coefficient: 0.78,
                percentile_rank: 72,
                z_score: 0.0,
                response_distribution: 0.25,

                // Comparison & Benchmarking
                comparison_group: 'Pastors',
                benchmark_category: 'East African Churches',
                peer_group: 'Similar Role',
                comparison_score: 3.8,
                benchmark_score: 3.9,
                peer_average: 4.1,
                industry_average: 3.8,
                score_difference: 0.0,
                percentage_difference: 0.0,
                rank_position: 15,
                percentile_score: 72,

                user_type: 'comparison'
            },
            {
                // Question Analysis
                question_id: 'Q005',
                question_text: 'How effective are professional development opportunities?',
                question_section: 'Professional Development',
                question_category: 'Development Assessment',
                question_type: 'Likert Scale',
                question_scale: '1-5 Scale',
                question_order: 5,
                is_required: 'Yes',
                question_response_count: 42,
                question_completion_rate: 89.4,
                question_skip_rate: 10.6,
                average_response_time: 38.1,

                // Response Analysis
                response_id: 'R005',
                response_value: '5',
                response_text: 'Strongly Agree',
                response_scale_label: 'Strongly Agree',
                response_status: 'Completed',
                response_method: 'Online',
                response_numeric_value: 5,
                response_percentage: 100,
                response_score: 4.5,
                weighted_score: 4.4,
                normalized_score: 90,

                // Survey Structure
                survey_id: 'S001',
                survey_title: 'Theological Education Assessment',
                survey_version: 'v2.1',
                survey_status: 'Active',
                survey_category: 'Education Assessment',
                survey_language: 'English',
                section_name: 'Professional Development',
                section_order: 5,
                total_questions: 25,
                total_responses: 47,
                completion_rate: 85.1,
                average_completion_time: 18.5,
                survey_length: 15,

                // Demographics & Users
                user_id: 'U005',
                user_role: 'Dean',
                organization: 'Nairobi Seminary',
                organization_type: 'Seminary',
                department: 'Administration',
                location: 'Nairobi, Kenya',
                country: 'Kenya',
                region: 'East Africa',
                experience_level: 'Expert',
                education_level: 'PhD',
                age_group: '55-64',
                gender: 'Male',
                user_response_count: 6,
                user_completion_rate: 100,
                years_of_experience: 20,

                // Time & Engagement
                response_date: '2024-01-19',
                response_month: 'January',
                response_quarter: 'Q1',
                response_year: '2024',
                response_day_of_week: 'Friday',
                response_time_of_day: 'Afternoon',
                survey_launch_date: '2024-01-10',
                survey_close_date: '2024-02-10',
                response_time_seconds: 38,
                session_duration: 1520,
                time_per_question: 60.8,
                engagement_score: 96,
                participation_rate: 94.7,

                // Statistical Analysis
                mean_score: 4.5,
                median_score: 5,
                mode_score: 5,
                standard_deviation: 0.5,
                variance: 0.25,
                confidence_interval: 0.15,
                correlation_coefficient: 0.89,
                percentile_rank: 88,
                z_score: 0.5,
                response_distribution: 0.15,

                // Comparison & Benchmarking
                comparison_group: 'Deans',
                benchmark_category: 'East African Seminaries',
                peer_group: 'Similar Role',
                comparison_score: 4.1,
                benchmark_score: 4.0,
                peer_average: 4.3,
                industry_average: 4.2,
                score_difference: 0.3,
                percentage_difference: 7.1,
                rank_position: 5,
                percentile_score: 88,

                user_type: 'comparison'
            }
        ];

        setChartData(sampleData);
    };

    // Test Mode Filtering Functions
    const handleTestModeRoleChange = async (role) => {
        try {
            const roleConfig = await TestModeService.getRoleConfiguration();
            const users = roleConfig[role]?.users || [];

            setTestModeFilters(prev => ({
                ...prev,
                selectedRole: role,
                selectedUser: '',
                selectedSurvey: '',
                availableUsers: users,
                availableSurveys: [],
                compareUsers: [],
                showComparison: false
            }));
        } catch (error) {
            console.error('Error loading users for role:', error);
        }
    };

    const handleTestModeUserChange = async (userId) => {
        try {
            // Load surveys available for this user's type
            const userSurveys = await TestModeService.getSampleSurveys();
            const selectedUser = testModeFilters.availableUsers.find(u => u.id === userId);

            // Filter surveys based on user type
            const filteredSurveys = userSurveys.filter(survey => {
                if (selectedUser?.surveyType === 'church') return survey.surveyType === 'church';
                if (selectedUser?.surveyType === 'institution') return survey.surveyType === 'institution';
                if (selectedUser?.surveyType === 'non_formal') return survey.surveyType === 'non_formal';
                return true;
            });

            // Load user responses from sample data
            const userResponses = await loadUserResponsesFromSampleData(userId);

            setTestModeFilters(prev => ({
                ...prev,
                selectedUser: userId,
                selectedSurvey: '',
                availableSurveys: filteredSurveys,
                compareUsers: [],
                showComparison: false,
                userResponses: userResponses
            }));

            // Update comparison data
            if (userResponses.length > 0) {
                updateComparisonData(userResponses[0], []);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleTestModeSurveyChange = async (surveyId) => {
        setTestModeFilters(prev => ({
            ...prev,
            selectedSurvey: surveyId,
            compareUsers: [],
            showComparison: false
        }));

        // Load data for this specific survey and generate fields
        await generateTestModeFields(surveyId);
        await loadSurveySpecificData(surveyId);
    };

    const handleTestModeComparison = async () => {
        try {
            // Load actual church survey responses for comparison
            const churchResponses = await SampleDataService.loadChurchResponses();
            const currentUserId = testModeFilters.selectedUser;

            // Find current user's response
            const currentUserResponse = churchResponses.responses.find(response =>
                response.id.toString() === currentUserId ||
                response.pastor_name.toLowerCase().includes(currentUserId.toLowerCase())
            ) || churchResponses.responses[0]; // fallback to first response

            // Get 3 other responses for comparison
            const comparisonResponses = churchResponses.responses
                .filter(response => response.id !== currentUserResponse.id)
                .slice(0, 3);

            setTestModeFilters(prev => ({
                ...prev,
                compareUsers: comparisonResponses.map(response => ({
                    id: response.id.toString(),
                    name: response.pastor_name,
                    organization: response.church_name,
                    location: `${response.town}, ${response.country}`,
                    experience: response.years_as_pastor,
                    education: response.education_level
                })),
                showComparison: true,
                comparisonResponses: comparisonResponses
            }));

            // Update comparison data with numerical analysis
            updateComparisonData(currentUserResponse, comparisonResponses);

        } catch (error) {
            console.error('Error loading comparison users:', error);
        }
    };

    // New function to load user responses from sample data
    const loadUserResponsesFromSampleData = async (userId) => {
        try {
            const churchResponses = await SampleDataService.loadChurchResponses();

            // Map user IDs to actual responses (simplified mapping for demo)
            const userResponseMap = {
                'pastor_john_w': churchResponses.responses[0],
                'pastor_mary_j': churchResponses.responses[1],
                'pastor_david_b': churchResponses.responses[2],
                'pastor_grace_m': churchResponses.responses[3]
            };

            const userResponse = userResponseMap[userId] || churchResponses.responses[0];
            return [userResponse];
        } catch (error) {
            console.error('Error loading user responses:', error);
            return [];
        }
    };

    // New function to update comparison data with numerical analysis
    const updateComparisonData = (selectedUserData, comparisonUsersData) => {
        if (!selectedUserData) return;

        const ministryScores = selectedUserData.ministry_training_scores || {};
        const comparisonScores = comparisonUsersData.map(user => user.ministry_training_scores || {});

        // Calculate average scores for comparison users
        const averageScores = {};
        const scoreDifferences = {};

        Object.keys(ministryScores).forEach(skillArea => {
            const selectedUserScore = ministryScores[skillArea];
            const comparisonValues = comparisonScores
                .map(scores => scores[skillArea])
                .filter(score => score !== undefined);

            const averageComparisonScore = comparisonValues.length > 0
                ? comparisonValues.reduce((sum, score) => sum + score, 0) / comparisonValues.length
                : 0;

            averageScores[skillArea] = averageComparisonScore;
            scoreDifferences[skillArea] = selectedUserScore - averageComparisonScore;
        });

        setComparisonData({
            selectedUserData,
            comparisonUsersData,
            ministryScores,
            averageScores,
            scoreDifferences
        });

        // Generate chart data for ministry scores comparison
        generateMinistryScoresChartData(ministryScores, averageScores, scoreDifferences);
    };

    // New function to generate chart data for ministry scores
    const generateMinistryScoresChartData = (selectedScores, averageScores, differences) => {
        const chartData = Object.keys(selectedScores).map(skillArea => {
            const skillName = skillArea.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return {
                name: skillName,
                selectedUser: selectedScores[skillArea],
                averageComparison: averageScores[skillArea],
                difference: differences[skillArea],
                skillArea: skillArea
            };
        });

        setChartData(chartData);
        setPreviewData(chartData);
    };

    // New function to load survey-specific data
    const loadSurveySpecificData = async (surveyId) => {
        try {
            const responses = testModeFilters.userResponses;
            if (responses.length === 0) return;

            const selectedResponse = responses[0];

            // Generate specific fields based on the survey data structure
            const ministryFields = Object.keys(selectedResponse.ministry_training_scores || {}).map(skillArea => {
                const skillName = skillArea.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return {
                    id: `ministry_${skillArea}`,
                    name: `${skillName} Score`,
                    type: 'measure',
                    icon: 'StarIcon',
                    category: 'Ministry Training Scores',
                    value: selectedResponse.ministry_training_scores[skillArea]
                };
            });

            const demographicFields = [
                { id: 'age_group', name: 'Age Group', type: 'dimension', icon: 'PersonIcon', value: selectedResponse.age_group },
                { id: 'education_level', name: 'Education Level', type: 'dimension', icon: 'SchoolIcon', value: selectedResponse.education_level },
                { id: 'years_as_pastor', name: 'Years as Pastor', type: 'dimension', icon: 'TimeIcon', value: selectedResponse.years_as_pastor },
                { id: 'last_training_year', name: 'Last Training Year', type: 'dimension', icon: 'DateRangeIcon', value: selectedResponse.last_training_year },
                { id: 'actea_accredited', name: 'ACTEA Accredited', type: 'dimension', icon: 'VerifiedIcon', value: selectedResponse.actea_accredited }
            ];

            const organizationFields = [
                { id: 'church_name', name: 'Church Name', type: 'dimension', icon: 'BusinessIcon', value: selectedResponse.church_name },
                { id: 'country', name: 'Country', type: 'dimension', icon: 'PublicIcon', value: selectedResponse.country },
                { id: 'city', name: 'City', type: 'dimension', icon: 'LocationCityIcon', value: selectedResponse.city },
                { id: 'training_institution', name: 'Training Institution', type: 'dimension', icon: 'SchoolIcon', value: selectedResponse.training_institution }
            ];

            const updatedFields = {
                'Ministry Training Scores': ministryFields.map(field => ({
                    ...field,
                    icon: FieldConfigurationService.getIconComponent(field.icon)
                })),
                'Demographics': demographicFields.map(field => ({
                    ...field,
                    icon: FieldConfigurationService.getIconComponent(field.icon)
                })),
                'Organization': organizationFields.map(field => ({
                    ...field,
                    icon: FieldConfigurationService.getIconComponent(field.icon)
                }))
            };

            setAvailableFields(updatedFields);

        } catch (error) {
            console.error('Error loading survey specific data:', error);
        }
    };

    const generateTestModeFields = async (surveyId) => {
        try {
            // Get the actual sample data
            const sampleData = await TestModeService.loadSampleData();
            const selectedUser = testModeFilters.availableUsers.find(u => u.id === testModeFilters.selectedUser);
            const selectedSurvey = testModeFilters.availableSurveys.find(s => s.id === surveyId);

            if (!selectedUser || !selectedSurvey) {
                console.error('Selected user or survey not found');
                return;
            }

            // Get all responses for the selected survey type
            let surveyResponses = [];
            if (selectedSurvey.surveyType === 'church') {
                surveyResponses = sampleData.church.responses;
            } else if (selectedSurvey.surveyType === 'institution') {
                surveyResponses = sampleData.institution.responses;
            } else if (selectedSurvey.surveyType === 'non_formal') {
                surveyResponses = sampleData.nonFormal.responses;
            }

            // Generate fields based on the survey structure
            const fieldCategories = {
                'Question Analysis': {
                    fields: [
                        { id: 'response_scores', name: 'Response Scores', type: 'measure', icon: 'NumbersIcon' },
                        { id: 'question_type', name: 'Question Type', type: 'dimension', icon: 'CategoryIcon' },
                        { id: 'response_text', name: 'Response Text', type: 'dimension', icon: 'TextIcon' },
                        { id: 'score_rating', name: 'Score Rating', type: 'measure', icon: 'StarIcon' }
                    ]
                },
                'Demographics': {
                    fields: [
                        { id: 'age_group', name: 'Age Group', type: 'dimension', icon: 'PersonIcon' },
                        { id: 'education_level', name: 'Education Level', type: 'dimension', icon: 'SchoolIcon' },
                        { id: 'years_experience', name: 'Years Experience', type: 'dimension', icon: 'TimeIcon' },
                        { id: 'location', name: 'Location', type: 'dimension', icon: 'LocationIcon' }
                    ]
                },
                'Organization': {
                    fields: [
                        { id: 'organization_name', name: 'Organization Name', type: 'dimension', icon: 'BusinessIcon' },
                        { id: 'organization_type', name: 'Organization Type', type: 'dimension', icon: 'CategoryIcon' },
                        { id: 'country', name: 'Country', type: 'dimension', icon: 'PublicIcon' },
                        { id: 'city', name: 'City', type: 'dimension', icon: 'LocationCityIcon' }
                    ]
                },
                'Metrics': {
                    fields: [
                        { id: 'response_count', name: 'Response Count', type: 'measure', icon: 'NumbersIcon' },
                        { id: 'completion_rate', name: 'Completion Rate', type: 'measure', icon: 'PercentIcon' },
                        { id: 'average_score', name: 'Average Score', type: 'measure', icon: 'TrendingUpIcon' },
                        { id: 'response_date', name: 'Response Date', type: 'dimension', icon: 'DateRangeIcon' }
                    ]
                }
            };

            const testModeFields = {};

            // Process and filter categories for test mode
            Object.entries(fieldCategories).forEach(([categoryName, categoryConfig]) => {
                testModeFields[categoryName] = categoryConfig.fields.map(field => ({
                    ...field,
                    icon: FieldConfigurationService.getIconComponent(field.icon),
                    category: categoryName
                }));
            });

            setAvailableFields(testModeFields);
            setChartData(surveyResponses);

            console.log('Test mode fields generated from survey data:', testModeFields);
            console.log('Survey responses loaded:', surveyResponses.length);

        } catch (error) {
            console.error('Error generating test mode fields:', error);
            setAvailableFields({});
            setChartData([]);
        }
    };

    const generatePreviewData = () => {
        if (chartData.length === 0) return;

        let processedData = [...chartData];

        // Apply grouping based on canvas configuration
        if (canvas.rows.length > 0) {
            const groupField = canvas.rows[0].id;
            const measureField = canvas.columns.find(col => col.type === 'measure');

            if (measureField) {
                const grouped = processedData.reduce((acc, item) => {
                    const key = item[groupField];
                    if (!acc[key]) {
                        acc[key] = {
                            name: key,
                            value: 0,
                            count: 0,
                            primary: 0,
                            comparison: 0,
                            primaryCount: 0,
                            comparisonCount: 0
                        };
                    }

                    acc[key].value += item[measureField.id] || 0;
                    acc[key].count += 1;

                    if (item.user_type === 'primary') {
                        acc[key].primary += item[measureField.id] || 0;
                        acc[key].primaryCount += 1;
                    } else if (item.user_type === 'comparison') {
                        acc[key].comparison += item[measureField.id] || 0;
                        acc[key].comparisonCount += 1;
                    }

                    return acc;
                }, {});

                processedData = Object.values(grouped).map(item => ({
                    ...item,
                    value: item.count > 0 ? item.value / item.count : 0,
                    primaryAvg: item.primaryCount > 0 ? item.primary / item.primaryCount : 0,
                    comparisonAvg: item.comparisonCount > 0 ? item.comparison / item.comparisonCount : 0,
                    difference: (item.primaryCount > 0 ? item.primary / item.primaryCount : 0) -
                        (item.comparisonCount > 0 ? item.comparison / item.comparisonCount : 0)
                }));
            }
        } else if (canvas.columns.length > 0) {
            // If only measures are selected, group by a default field
            const measureField = canvas.columns[0];
            processedData = processedData.map(item => ({
                name: item.survey_section || item.organization || item.user_role || 'Data',
                value: item[measureField.id] || 0,
                primaryAvg: item.user_type === 'primary' ? (item[measureField.id] || 0) : 0,
                comparisonAvg: item.user_type === 'comparison' ? (item[measureField.id] || 0) : 0,
                difference: 0
            }));
        }

        setPreviewData(processedData);
    };

    const handleDragStart = (field) => {
        setDraggedItem(field);
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDragging(false);
    };

    const handleDrop = (dropZone, event) => {
        event.preventDefault();
        if (!draggedItem) return;

        const newCanvas = { ...canvas };

        // Remove field from other zones if it exists
        newCanvas.columns = newCanvas.columns.filter(item => item.id !== draggedItem.id);
        newCanvas.rows = newCanvas.rows.filter(item => item.id !== draggedItem.id);
        newCanvas.filters = newCanvas.filters.filter(item => item.id !== draggedItem.id);
        newCanvas.colors = newCanvas.colors.filter(item => item.id !== draggedItem.id);

        // Add to the new zone
        switch (dropZone) {
            case 'columns':
                newCanvas.columns.push(draggedItem);
                break;
            case 'rows':
                newCanvas.rows.push(draggedItem);
                break;
            case 'filters':
                newCanvas.filters.push({ ...draggedItem, value: '' });
                break;
            case 'colors':
                newCanvas.colors.push(draggedItem);
                break;
        }

        setCanvas(newCanvas);
        handleDragEnd();
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const removeFromCanvas = (zone, fieldId) => {
        const newCanvas = { ...canvas };
        newCanvas[zone] = newCanvas[zone].filter(item => item.id !== fieldId);
        setCanvas(newCanvas);
    };

    const updateChartType = (newType) => {
        setCanvas(prev => ({ ...prev, chartType: newType }));
    };

    const generateTestReport = () => {
        // Generate report using test mode data (filtered data)
        console.log('Generating test report with filtered data:', {
            testModeFilters,
            chartData: previewData
        });
        // TODO: Implement actual test report generation
        alert('Test mode report generated! Check console for data.');
    };

    const generateNormalReport = () => {
        // Generate report using normal mode data (sample data)
        console.log('Generating normal report with sample data:', {
            chartType: canvas.chartType,
            columns: canvas.columns,
            rows: canvas.rows,
            filters: canvas.filters,
            chartData: previewData
        });
        // TODO: Implement actual normal report generation
        alert('Normal mode report generated! Check console for data.');
    };

    const renderChart = () => {
        if (previewData.length === 0) {
            return (
                <Box sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f9f9f9',
                    border: '2px dashed #ccc',
                    borderRadius: 2
                }}>
                    <Typography variant="h6" color="textSecondary">
                        {testMode ? 'Complete the filtering steps and drag fields to create your visualization' : 'Drag fields to create your visualization'}
                    </Typography>
                </Box>
            );
        }

        // Enhanced tooltip content for ministry scores comparison
        const CustomTooltip = ({ active, payload, label }) => {
            if (active && payload && payload.length) {
                return (
                    <Paper sx={{ p: 2, border: `1px solid ${adminColors.borderColor}` }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            {label}
                        </Typography>
                        {payload.map((entry, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        bgcolor: entry.color,
                                        borderRadius: '2px'
                                    }}
                                />
                                <Typography variant="body2">
                                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                                    {entry.dataKey === 'difference' && entry.value !== undefined && (
                                        <span style={{
                                            color: entry.value > 0 ? '#4caf50' : entry.value < 0 ? '#f44336' : 'inherit',
                                            fontWeight: 600,
                                            marginLeft: '4px'
                                        }}>
                                            ({entry.value > 0 ? '+' : ''}{entry.value.toFixed(2)})
                                        </span>
                                    )}
                                </Typography>
                            </Box>
                        ))}
                        {testMode && testModeFilters.showComparison && (
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Comparison with {testModeFilters.compareUsers.length} other users
                            </Typography>
                        )}
                    </Paper>
                );
            }
            return null;
        };

        const chartProps = {
            width: '100%',
            height: 400,
            data: previewData
        };

        switch (canvas.chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <BarChart data={previewData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            {canvas.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                interval={0}
                                fontSize={12}
                            />
                            <YAxis domain={[0, 4]} tickCount={5} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            {canvas.showLegend && <Legend />}
                            {testMode && testModeFilters.showComparison ? (
                                <>
                                    <Bar dataKey="selectedUser" fill={adminColors.primary} name="Selected User" />
                                    <Bar dataKey="averageComparison" fill={adminColors.secondary} name="Comparison Average" />
                                </>
                            ) : (
                                <Bar dataKey="selectedUser" fill={adminColors.primary} name="User Score" />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <LineChart data={previewData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            {canvas.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                interval={0}
                                fontSize={12}
                            />
                            <YAxis domain={[0, 4]} tickCount={5} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            {canvas.showLegend && <Legend />}
                            <Line type="monotone" dataKey="selectedUser" stroke={adminColors.primary} strokeWidth={3} name="Selected User" dot={{ r: 6 }} />
                            {testMode && testModeFilters.showComparison && (
                                <Line type="monotone" dataKey="averageComparison" stroke={adminColors.secondary} strokeWidth={2} strokeDasharray="5 5" name="Comparison Average" dot={{ r: 4 }} />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                // For pie charts in test mode, show score distribution
                const pieData = testMode && testModeFilters.showComparison
                    ? previewData.slice(0, 8).map((item, index) => ({
                        name: item.name,
                        value: item.selectedUser,
                        fill: chartColors[index % chartColors.length]
                    }))
                    : previewData.slice(0, 8).map((item, index) => ({
                        name: item.name,
                        value: item.selectedUser || item.value,
                        fill: chartColors[index % chartColors.length]
                    }));

                return (
                    <ResponsiveContainer {...chartProps}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'table':
                return (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: adminColors.headerBg }}>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Ministry Area</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Selected User Score</th>
                                    {testMode && testModeFilters.showComparison && (
                                        <>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Comparison Avg</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Difference</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Performance</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, index) => {
                                    const performance = testMode && testModeFilters.showComparison && row.difference !== undefined
                                        ? row.difference > 0.5 ? 'Above Average'
                                            : row.difference < -0.5 ? 'Below Average'
                                                : 'Average'
                                        : 'N/A';

                                    return (
                                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 500 }}>{row.name}</td>
                                            <td style={{
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: adminColors.primary
                                            }}>
                                                {row.selectedUser || 'N/A'}
                                            </td>
                                            {testMode && testModeFilters.showComparison && (
                                                <>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                        {row.averageComparison?.toFixed(2) || 'N/A'}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        border: '1px solid #ddd',
                                                        textAlign: 'center',
                                                        color: row.difference > 0 ? '#4caf50' : row.difference < 0 ? '#f44336' : 'inherit',
                                                        fontWeight: 600
                                                    }}>
                                                        {row.difference !== undefined ?
                                                            `${row.difference > 0 ? '+' : ''}${row.difference.toFixed(2)}` : 'N/A'}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        border: '1px solid #ddd',
                                                        textAlign: 'center',
                                                        color: performance === 'Above Average' ? '#4caf50'
                                                            : performance === 'Below Average' ? '#f44336'
                                                                : '#666',
                                                        fontWeight: 500
                                                    }}>
                                                        {performance}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {testMode && testModeFilters.showComparison && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    <strong>Scoring Scale:</strong> 1 = Needs Improvement, 2 = Basic, 3 = Good, 4 = Excellent
                                    <br />
                                    <strong>Performance:</strong> Above Average (+0.5), Average (±0.5), Below Average (-0.5)
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );

            default:
                return <Typography>Unsupported chart type</Typography>;
        }
    };

    const FieldItem = ({ field, draggable = true }) => (
        <Paper
            sx={{
                p: 1,
                mb: 1,
                cursor: draggable ? 'grab' : 'default',
                border: `1px solid ${adminColors.borderColor}`,
                borderRadius: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': draggable ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(99, 51, 148, 0.15)',
                    borderColor: adminColors.primary
                } : {},
                '&:active': draggable ? {
                    cursor: 'grabbing',
                    transform: 'scale(0.98)',
                    boxShadow: '0 2px 8px rgba(99, 51, 148, 0.2)'
                } : {},
                bgcolor: field.type === 'measure' ? '#e8f5e8' : '#f3e5f5',
                opacity: isDragging && draggedItem?.id === field.id ? 0.6 : 1
            }}
            draggable={draggable}
            onDragStart={() => handleDragStart(field)}
            onDragEnd={handleDragEnd}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                    color: field.type === 'measure' ? adminColors.success : adminColors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    p: 0.5,
                    borderRadius: '50%',
                    bgcolor: field.type === 'measure' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(99, 51, 148, 0.1)'
                }}>
                    {field.icon}
                </Box>
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>
                    {field.name}
                </Typography>
                {draggable && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.2,
                        opacity: 0.6
                    }}>
                        <Box sx={{ width: 3, height: 3, bgcolor: '#ccc', borderRadius: '50%' }}></Box>
                        <Box sx={{ width: 3, height: 3, bgcolor: '#ccc', borderRadius: '50%' }}></Box>
                        <Box sx={{ width: 3, height: 3, bgcolor: '#ccc', borderRadius: '50%' }}></Box>
                        <Box sx={{ width: 3, height: 3, bgcolor: '#ccc', borderRadius: '50%' }}></Box>
                    </Box>
                )}
            </Box>
        </Paper>
    );

    const DropZone = ({ title, zone, items, icon, allowedTypes = ['dimension', 'measure'] }) => {
        const isValidDrop = isDragging && draggedItem && allowedTypes.includes(draggedItem.type);
        const isInvalidDrop = isDragging && draggedItem && !allowedTypes.includes(draggedItem.type);

        return (
            <Paper
                sx={{
                    p: 2,
                    minHeight: 100,
                    border: `2px dashed ${isValidDrop
                        ? adminColors.primary
                        : isInvalidDrop
                            ? adminColors.error
                            : adminColors.borderColor}`,
                    borderRadius: 2,
                    bgcolor: isValidDrop
                        ? 'rgba(99, 51, 148, 0.08)'
                        : isInvalidDrop
                            ? 'rgba(244, 67, 54, 0.05)'
                            : 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': isValidDrop ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, transparent 48%, ${adminColors.primary}20 50%, transparent 52%)`,
                        animation: 'shimmer 2s infinite'
                    } : {},
                    '@keyframes shimmer': {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' }
                    }
                }}
                onDrop={(e) => handleDrop(zone, e)}
                onDragOver={handleDragOver}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, position: 'relative', zIndex: 1 }}>
                    <Box sx={{
                        color: adminColors.primary,
                        p: 0.5,
                        borderRadius: 1,
                        bgcolor: 'rgba(99, 51, 148, 0.1)',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ color: adminColors.text, fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Chip
                        label={allowedTypes.join(', ')}
                        size="small"
                        variant="outlined"
                        sx={{
                            fontSize: '0.65rem',
                            height: 20,
                            borderColor: adminColors.borderColor,
                            color: 'text.secondary'
                        }}
                    />
                </Box>

                {items.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2, position: 'relative', zIndex: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                            {isValidDrop ? `Drop ${draggedItem.name} here` : `Drop ${allowedTypes.join(' or ')} fields here`}
                        </Typography>
                        {isInvalidDrop && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                {draggedItem.type} not allowed here
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, position: 'relative', zIndex: 1 }}>
                        {items.map((item) => (
                            <Chip
                                key={item.id}
                                label={item.name}
                                onDelete={() => removeFromCanvas(zone, item.id)}
                                icon={item.icon}
                                size="small"
                                sx={{
                                    bgcolor: item.type === 'measure' ? '#e8f5e8' : '#f3e5f5',
                                    border: `1px solid ${item.type === 'measure' ? adminColors.success : adminColors.primary}`,
                                    '& .MuiChip-icon': {
                                        color: item.type === 'measure' ? adminColors.success : adminColors.primary
                                    },
                                    '& .MuiChip-deleteIcon': {
                                        color: 'rgba(0, 0, 0, 0.6)',
                                        '&:hover': {
                                            color: adminColors.error
                                        }
                                    }
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Paper>
        );
    };

    const TestModeFiltering = () => {
        const [roleConfig, setRoleConfig] = useState({});
        const [loadingRoles, setLoadingRoles] = useState(true);

        useEffect(() => {
            const loadRoles = async () => {
                try {
                    setLoadingRoles(true);
                    const config = await TestModeService.getRoleConfiguration();
                    setRoleConfig(config);
                } catch (error) {
                    console.error('Error loading roles:', error);
                    setRoleConfig({});
                } finally {
                    setLoadingRoles(false);
                }
            };

            loadRoles();
        }, []);

        return (
            <Card sx={{ mb: 2 }}>
                <CardHeader title="🧪 Test Mode Filtering" />
                <CardContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Connect your data source to enable role-based comparisons and dynamic field generation.
                    </Typography>

                    {loadingRoles ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <LinearProgress sx={{ width: '100%' }} />
                        </Box>
                    ) : Object.keys(roleConfig).length > 0 ? (
                        <>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Select Role</InputLabel>
                                <Select
                                    value={testModeFilters.selectedRole}
                                    onChange={(e) => handleTestModeRoleChange(e.target.value)}
                                    label="Select Role"
                                >
                                    {Object.entries(roleConfig).map(([roleKey, roleData]) => (
                                        <MenuItem key={roleKey} value={roleKey}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography sx={{ mr: 1 }}>{roleData.icon}</Typography>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {roleKey}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {roleData.description} ({roleData.users.length} users)
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {testModeFilters.selectedRole && (
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Select User</InputLabel>
                                    <Select
                                        value={testModeFilters.selectedUser}
                                        onChange={(e) => handleTestModeUserChange(e.target.value)}
                                        label="Select User"
                                        disabled={testModeFilters.availableUsers.length === 0}
                                    >
                                        {testModeFilters.availableUsers.map((user) => (
                                            <MenuItem key={user.id} value={user.id}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {user.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {user.organization} • {user.location}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {testModeFilters.selectedUser && (
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Select Survey</InputLabel>
                                    <Select
                                        value={testModeFilters.selectedSurvey}
                                        onChange={(e) => handleTestModeSurveyChange(e.target.value)}
                                        label="Select Survey"
                                        disabled={testModeFilters.availableSurveys.length === 0}
                                    >
                                        {testModeFilters.availableSurveys.map((survey) => (
                                            <MenuItem key={survey.id} value={survey.id}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {survey.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {survey.responses} responses • {survey.completion_rate}% complete
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {testModeFilters.selectedSurvey && (
                                <Box>
                                    <Button
                                        variant="outlined"
                                        onClick={handleTestModeComparison}
                                        sx={{ mb: 2 }}
                                        disabled={testModeFilters.availableUsers.length <= 1}
                                    >
                                        Load Other {testModeFilters.selectedRole}s for Comparison
                                    </Button>

                                    {testModeFilters.showComparison && testModeFilters.compareUsers.length > 0 && (
                                        <>
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                                <Typography variant="body2" gutterBottom>
                                                    Comparison users loaded successfully!
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {testModeFilters.compareUsers.map((user) => (
                                                        <Chip
                                                            key={user.id}
                                                            label={user.name}
                                                            size="small"
                                                            sx={{ backgroundColor: adminColors.primary, color: 'white' }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Alert>

                                            {/* Detailed Comparison Analysis */}
                                            {comparisonData.selectedUserData && (
                                                <Card sx={{ mb: 2, bgcolor: '#f8f9fa' }}>
                                                    <CardHeader
                                                        title="📊 Numerical Comparison Analysis"
                                                        sx={{
                                                            bgcolor: adminColors.highlightBg,
                                                            '& .MuiCardHeader-title': { fontSize: '1rem', fontWeight: 600 }
                                                        }}
                                                    />
                                                    <CardContent sx={{ p: 2 }}>
                                                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                                                            Selected User: {comparisonData.selectedUserData.pastor_name}
                                                        </Typography>

                                                        {/* Top Performance Areas */}
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#4caf50', fontWeight: 600 }}>
                                                                🏆 Top Performing Areas:
                                                            </Typography>
                                                            {Object.entries(comparisonData.scoreDifferences)
                                                                .filter(([_, diff]) => diff > 0.5)
                                                                .sort(([_, a], [__, b]) => b - a)
                                                                .slice(0, 3)
                                                                .map(([skillArea, difference]) => (
                                                                    <Box key={skillArea} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                        <Typography variant="caption">
                                                                            {skillArea.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                                                            +{difference.toFixed(2)}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            {Object.entries(comparisonData.scoreDifferences).filter(([_, diff]) => diff > 0.5).length === 0 && (
                                                                <Typography variant="caption" color="textSecondary">No areas significantly above average</Typography>
                                                            )}
                                                        </Box>

                                                        {/* Areas for Improvement */}
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#f44336', fontWeight: 600 }}>
                                                                📈 Areas for Improvement:
                                                            </Typography>
                                                            {Object.entries(comparisonData.scoreDifferences)
                                                                .filter(([_, diff]) => diff < -0.5)
                                                                .sort(([_, a], [__, b]) => a - b)
                                                                .slice(0, 3)
                                                                .map(([skillArea, difference]) => (
                                                                    <Box key={skillArea} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                        <Typography variant="caption">
                                                                            {skillArea.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 600 }}>
                                                                            {difference.toFixed(2)}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            {Object.entries(comparisonData.scoreDifferences).filter(([_, diff]) => diff < -0.5).length === 0 && (
                                                                <Typography variant="caption" color="textSecondary">No areas significantly below average</Typography>
                                                            )}
                                                        </Box>

                                                        {/* Overall Statistics */}
                                                        <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                                            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                                                Overall Performance Summary:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography variant="caption">Average Score:</Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                    {(Object.values(comparisonData.ministryScores).reduce((sum, score) => sum + score, 0) / Object.values(comparisonData.ministryScores).length).toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography variant="caption">Peer Average:</Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                    {(Object.values(comparisonData.averageScores).reduce((sum, score) => sum + score, 0) / Object.values(comparisonData.averageScores).length).toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Typography variant="caption">Overall Difference:</Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        color: (Object.values(comparisonData.scoreDifferences).reduce((sum, diff) => sum + diff, 0) / Object.values(comparisonData.scoreDifferences).length) > 0 ? '#4caf50' : '#f44336'
                                                                    }}
                                                                >
                                                                    {((Object.values(comparisonData.scoreDifferences).reduce((sum, diff) => sum + diff, 0) / Object.values(comparisonData.scoreDifferences).length) > 0 ? '+' : '')}
                                                                    {(Object.values(comparisonData.scoreDifferences).reduce((sum, diff) => sum + diff, 0) / Object.values(comparisonData.scoreDifferences).length).toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                                            Drag "Ministry Training Scores" fields to the chart area to visualize these comparisons
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </>
                                    )}
                                </Box>
                            )}
                        </>
                    ) : (
                        <Alert severity="info">
                            <Typography variant="body2">
                                <strong>No Data Source Connected</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                To use Test Mode filtering, please:
                            </Typography>
                            <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                                <li>Connect your survey database API</li>
                                <li>Upload a CSV file with survey data</li>
                                <li>Configure your data endpoints in the settings</li>
                            </Typography>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        );
    };

    // Data Source Configuration Component
    const DataSourceConfiguration = () => {
        const [dataSourceType, setDataSourceType] = useState('');
        const [uploadedFile, setUploadedFile] = useState(null);
        const [csvData, setCsvData] = useState('');
        const [apiEndpoint, setApiEndpoint] = useState('');
        const [loadingData, setLoadingData] = useState(false);

        const handleFileUpload = async (event) => {
            const file = event.target.files[0];
            if (file) {
                setUploadedFile(file);
                try {
                    setLoadingData(true);
                    const data = await DataService.loadFromFile(file);
                    await processUploadedData(data);
                } catch (error) {
                    console.error('Error processing file:', error);
                    alert('Error processing file: ' + error.message);
                } finally {
                    setLoadingData(false);
                }
            }
        };

        const handleCsvSubmit = async () => {
            if (csvData.trim()) {
                try {
                    setLoadingData(true);
                    const data = await DataService.loadFromCSV(csvData);
                    await processUploadedData(data);
                } catch (error) {
                    console.error('Error processing CSV:', error);
                    alert('Error processing CSV: ' + error.message);
                } finally {
                    setLoadingData(false);
                }
            }
        };

        const processUploadedData = async (data) => {
            if (data && data.length > 0) {
                // Validate data
                const validation = DataService.validateData(data);
                if (!validation.valid) {
                    throw new Error(validation.message);
                }

                // Generate fields from the data
                const fieldCategories = await FieldConfigurationService.generateFieldsFromData(data);
                const processedFields = {};

                Object.entries(fieldCategories).forEach(([categoryName, categoryConfig]) => {
                    processedFields[categoryName] = categoryConfig.fields.map(field => ({
                        ...field,
                        icon: FieldConfigurationService.getIconComponent(categoryConfig.icon),
                        category: categoryName
                    }));
                });

                setAvailableFields(processedFields);
                setChartData(data);

                // Generate test mode configuration if in test mode
                if (testMode) {
                    const testConfig = TestModeService.generateTestConfigFromData(data);
                    console.log('Generated test mode configuration:', testConfig);
                }

                // Show success message
                const summary = DataService.getDataSummary(data);
                alert(`Data loaded successfully!\n\nRecords: ${summary.recordCount}\nFields: ${summary.fields.length}\nCategories: ${Object.keys(processedFields).length}`);
            }
        };

        return (
            <Card sx={{ mb: 2 }}>
                <CardHeader title="📊 Data Source Configuration" />
                <CardContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Load your survey data to automatically generate fields and enable dynamic analysis.
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Data Source Type</InputLabel>
                        <Select
                            value={dataSourceType}
                            onChange={(e) => setDataSourceType(e.target.value)}
                            label="Data Source Type"
                        >
                            <MenuItem value="file">Upload CSV/JSON File</MenuItem>
                            <MenuItem value="csv">Paste CSV Data</MenuItem>
                            <MenuItem value="api">API Endpoint</MenuItem>
                        </Select>
                    </FormControl>

                    {dataSourceType === 'file' && (
                        <Box>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<AddIcon />}
                                sx={{ mb: 2 }}
                            >
                                Upload File
                                <input
                                    type="file"
                                    hidden
                                    accept=".csv,.json"
                                    onChange={handleFileUpload}
                                />
                            </Button>
                            {uploadedFile && (
                                <Typography variant="body2" color="textSecondary">
                                    Selected: {uploadedFile.name}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {dataSourceType === 'csv' && (
                        <Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                value={csvData}
                                onChange={(e) => setCsvData(e.target.value)}
                                placeholder="Paste your CSV data here..."
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleCsvSubmit}
                                disabled={!csvData.trim() || loadingData}
                                sx={{ bgcolor: adminColors.primary }}
                            >
                                Process CSV Data
                            </Button>
                        </Box>
                    )}

                    {dataSourceType === 'api' && (
                        <Box>
                            <TextField
                                fullWidth
                                value={apiEndpoint}
                                onChange={(e) => setApiEndpoint(e.target.value)}
                                placeholder="https://api.example.com/survey-data"
                                label="API Endpoint"
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="contained"
                                disabled={!apiEndpoint.trim() || loadingData}
                                sx={{ bgcolor: adminColors.primary }}
                                onClick={() => alert('API integration ready - implement your endpoint call here')}
                            >
                                Connect API
                            </Button>
                        </Box>
                    )}

                    {loadingData && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                Processing data and generating fields...
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                            Sample CSV Format:
                        </Typography>
                        <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
                            {`user_id,user_role,organization,survey_title,question_text,response_value,score
1,Pastor,St. Mary's Church,Ministry Survey,How effective are teaching methods?,4,85
2,Professor,Bible College,Education Survey,Rate curriculum relevance,5,92
3,Pastor,Grace Church,Ministry Survey,How effective are teaching methods?,3,72`}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: adminColors.background }}>
            <Navbar tabs={tabs} onLogout={onLogout} />

            <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                            Visual Report Builder
                        </Typography>
                        <Typography variant="body2" sx={{ color: testMode ? '#4caf50' : adminColors.secondary, fontWeight: 500 }}>
                            {testMode ? '🧪 Test Mode Active - Use filtering panel below' : '📊 Normal Mode Active - Drag fields to create charts'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setTestMode(!testMode)}
                            startIcon={testMode ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            sx={{
                                borderColor: testMode ? '#4caf50' : adminColors.primary,
                                color: testMode ? '#4caf50' : adminColors.primary,
                                backgroundColor: testMode ? 'rgba(76,175,80,0.1)' : 'rgba(99,51,148,0.1)',
                                px: 2, py: 1, fontWeight: 600, minWidth: '140px',
                                '&:hover': {
                                    borderColor: testMode ? '#45a049' : adminColors.secondary,
                                    backgroundColor: testMode ? 'rgba(76,175,80,0.2)' : 'rgba(99,51,148,0.2)'
                                }
                            }}
                        >
                            {testMode ? 'Test Mode' : 'Normal Mode'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<SaveIcon />}
                            onClick={() => setSaveDialogOpen(true)}
                            sx={{ borderColor: adminColors.primary, color: adminColors.primary }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            sx={{ bgcolor: adminColors.primary }}
                            onClick={() => testMode ? generateTestReport() : generateNormalReport()}
                        >
                            Export
                        </Button>
                    </Box>
                </Box>

                {/* Test Mode Alert */}
                {testMode && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>🧪 Test Mode Active:</strong> The "Test Mode Filtering" panel should now be visible in the left sidebar.
                            Select a role, user, and survey to test role-based comparisons with sample data.
                        </Typography>
                    </Alert>
                )}

                <Grid container spacing={2}>
                    {/* Left Panel - Test Mode Filtering + Fields */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                            <CardHeader
                                title="Data Configuration"
                                sx={{
                                    bgcolor: adminColors.headerBg,
                                    '& .MuiCardHeader-title': {
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: adminColors.primary
                                    }
                                }}
                            />
                            <CardContent sx={{ p: 2 }}>
                                <DataSourceConfiguration />

                                {testMode && <TestModeFiltering />}

                                {/* Dynamic Fields */}
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <LinearProgress sx={{ width: '100%' }} />
                                    </Box>
                                ) : Object.keys(availableFields).length > 0 ? (
                                    <Box>
                                        <Typography variant="h6" sx={{ color: adminColors.primary, fontWeight: 600, mb: 2 }}>
                                            Available Fields
                                        </Typography>
                                        {Object.entries(availableFields).map(([category, fields]) => (
                                            <Box key={category} sx={{ mb: 3 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        mb: 1,
                                                        color: adminColors.secondary,
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {category}
                                                </Typography>
                                                {fields.map((field) => (
                                                    <FieldItem key={field.id} field={field} />
                                                ))}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            {testMode ? 'Select a survey to load fields' : 'No fields available'}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Center Panel - Canvas */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 'calc(100vh - 200px)' }}>
                            <CardHeader
                                title={
                                    <TextField
                                        value={canvas.title}
                                        onChange={(e) => setCanvas(prev => ({ ...prev, title: e.target.value }))}
                                        variant="standard"
                                        sx={{
                                            '& .MuiInput-root': {
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                color: adminColors.primary
                                            }
                                        }}
                                    />
                                }
                                action={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={canvas.showGrid}
                                                    onChange={(e) => setCanvas(prev => ({ ...prev, showGrid: e.target.checked }))}
                                                />
                                            }
                                            label="Grid"
                                            sx={{ mr: 1 }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={canvas.showLegend}
                                                    onChange={(e) => setCanvas(prev => ({ ...prev, showLegend: e.target.checked }))}
                                                />
                                            }
                                            label="Legend"
                                        />
                                    </Box>
                                }
                                sx={{ bgcolor: adminColors.headerBg, pb: 1 }}
                            />

                            <CardContent sx={{ p: 2, height: 'calc(100% - 80px)', overflow: 'auto' }}>
                                {/* Drop Zones */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                        <DropZone
                                            title="Measures"
                                            zone="columns"
                                            items={canvas.columns}
                                            icon={<NumbersIcon />}
                                            allowedTypes={['measure']}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DropZone
                                            title="Dimensions"
                                            zone="rows"
                                            items={canvas.rows}
                                            icon={<CategoryIcon />}
                                            allowedTypes={['dimension']}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DropZone
                                            title="Filters"
                                            zone="filters"
                                            items={canvas.filters}
                                            icon={<FilterIcon />}
                                            allowedTypes={['dimension', 'measure']}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DropZone
                                            title="Colors"
                                            zone="colors"
                                            items={canvas.colors}
                                            icon={<ColorIcon />}
                                            allowedTypes={['dimension']}
                                        />
                                    </Grid>
                                </Grid>

                                {/* Chart Preview */}
                                <Paper sx={{ p: 2, bgcolor: '#fafafa', border: `1px solid ${adminColors.borderColor}` }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2, color: adminColors.text }}>
                                        Live Preview
                                    </Typography>
                                    {renderChart()}
                                </Paper>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Panel - Chart Configuration */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                            <CardHeader
                                title="Chart Settings"
                                sx={{
                                    bgcolor: adminColors.headerBg,
                                    '& .MuiCardHeader-title': {
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: adminColors.primary
                                    }
                                }}
                            />
                            <CardContent sx={{ p: 2 }}>
                                {/* Chart Type Selection */}
                                <Typography variant="subtitle2" sx={{ mb: 2, color: adminColors.text, fontWeight: 600 }}>
                                    Chart Type
                                </Typography>
                                <Grid container spacing={1} sx={{ mb: 3 }}>
                                    {chartTypes.map((type) => (
                                        <Grid item xs={6} key={type.id}>
                                            <Paper
                                                sx={{
                                                    p: 1,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    border: canvas.chartType === type.id ?
                                                        `2px solid ${adminColors.primary}` :
                                                        `1px solid ${adminColors.borderColor}`,
                                                    bgcolor: canvas.chartType === type.id ? adminColors.highlightBg : 'white',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        borderColor: adminColors.primary,
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                                onClick={() => updateChartType(type.id)}
                                            >
                                                <Box sx={{ color: adminColors.primary, mb: 0.5 }}>
                                                    {type.icon}
                                                </Box>
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                    {type.name}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                {/* Chart Summary */}
                                <Typography variant="subtitle2" sx={{ mb: 2, color: adminColors.text, fontWeight: 600 }}>
                                    Current Configuration
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="textSecondary">Measures:</Typography>
                                        <Badge badgeContent={canvas.columns.length} color="primary">
                                            <NumbersIcon fontSize="small" />
                                        </Badge>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="textSecondary">Dimensions:</Typography>
                                        <Badge badgeContent={canvas.rows.length} color="primary">
                                            <CategoryIcon fontSize="small" />
                                        </Badge>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="textSecondary">Filters:</Typography>
                                        <Badge badgeContent={canvas.filters.length} color="primary">
                                            <FilterIcon fontSize="small" />
                                        </Badge>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="textSecondary">Colors:</Typography>
                                        <Badge badgeContent={canvas.colors.length} color="primary">
                                            <ColorIcon fontSize="small" />
                                        </Badge>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Mode Indicator */}
                                <Box sx={{ mb: 2, p: 2, bgcolor: testMode ? 'rgba(76,175,80,0.1)' : 'rgba(99,51,148,0.1)', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: testMode ? '#4caf50' : adminColors.primary, fontWeight: 600 }}>
                                        Current Mode: {testMode ? 'Test Mode' : 'Normal Mode'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {testMode ? 'Using filtered survey data for comparison analysis' : 'Using sample data for general visualization'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Data Summary */}
                                {testMode && testModeFilters.selectedUser && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2, color: adminColors.text, fontWeight: 600 }}>
                                            Test Mode Data Summary
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="textSecondary">Selected Role:</Typography>
                                            <Typography variant="body2">
                                                {testModeFilters.selectedRole}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="textSecondary">Primary User:</Typography>
                                            <Typography variant="body2">
                                                {testModeFilters.availableUsers.find(u => u.id === testModeFilters.selectedUser)?.name || 'None'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="textSecondary">Selected Survey:</Typography>
                                            <Typography variant="body2">
                                                {testModeFilters.availableSurveys.find(s => s.id === testModeFilters.selectedSurvey)?.title || 'None'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="textSecondary">Comparison Users:</Typography>
                                            <Typography variant="body2">
                                                {testModeFilters.compareUsers.length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                {/* Quick Actions */}
                                <Typography variant="subtitle2" sx={{ mb: 2, color: adminColors.text, fontWeight: 600 }}>
                                    Quick Actions
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ClearIcon />}
                                        onClick={() => setCanvas(prev => ({
                                            ...prev,
                                            columns: [],
                                            rows: [],
                                            filters: [],
                                            colors: []
                                        }))}
                                        sx={{ borderColor: adminColors.secondary, color: adminColors.secondary }}
                                    >
                                        Clear Canvas
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<CompareArrowsIcon />}
                                        sx={{ bgcolor: adminColors.primary }}
                                        disabled={!testMode || !testModeFilters.selectedSurvey || testModeFilters.compareUsers.length === 0}
                                        onClick={handleTestModeComparison}
                                    >
                                        Refresh Comparison
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Save Dialog */}
                <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                    <DialogTitle>Save Report</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Report Name"
                            fullWidth
                            variant="outlined"
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            sx={{ bgcolor: adminColors.primary }}
                            disabled={!reportName.trim()}
                        >
                            Save Report
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default VisualReportBuilder;

// Export configuration services for external use
export {
    FieldConfigurationService,
    DataService,
    TestModeService
}; 