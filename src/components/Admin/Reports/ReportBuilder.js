import React, { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    FormControlLabel,
    TextField,
    Tabs,
    Tab,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormGroup,
    Paper,
    Tooltip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Save as SaveIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    PlayArrow as PlayArrowIcon,
    Settings as SettingsIcon,
    DragIndicator as DragIcon,
    Add as AddIcon,
    Map as MapIcon,
    LocationOn as LocationOnIcon,
    Numbers as NumbersIcon,
    Category as CategoryIcon,
    DateRange as DateIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ShowChart as LineChartIcon,
    TableChart as TableChartIcon,
    ScatterPlot as ScatterPlotIcon,
    FilterList as FilterIcon,
    Palette as ColorIcon,
    Clear as ClearIcon,
    Dataset as DatasetIcon,
    School as SchoolIcon,
    Church as ChurchIcon,
    Group as GroupIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
    CloudUpload as CloudUploadIcon,
    Storage as StorageIcon
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
    ComposedChart,
    Area
} from 'recharts';
import Navbar from '../../shared/Navbar/Navbar';
import GeographicCircleSelector from './GeographicCircleSelector';
import SampleDataService from '../../../services/SampleDataService';

// Admin colors from AdminDashboard
const adminColors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    text: '#212121',
    headerBg: '#ede7f6',
    borderColor: '#e0e0e0',
    highlightBg: '#f3e5f5'
};

// Chart color palette
const chartColors = [
    '#633394', '#967CB2', '#4CAF50', '#FF9800', '#F44336',
    '#2196F3', '#9C27B0', '#795548', '#607D8B', '#E91E63'
];

function ReportBuilder({ onLogout }) {
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

    // Sub-tab management for Report Builder
    const [activeSubTab, setActiveSubTab] = useState(0);

    // State management
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState([]);
    const [previewData, setPreviewData] = useState([]);

    // Data scope state
    const [dataScope, setDataScope] = useState({
        surveys: [],
        sections: [],
        dateRange: { start: '', end: '' },
        geography: {
            continents: [],
            countries: [],
            regions: [],
            customGroups: [],
            circles: [] // Geographic circles for regional comparison
        },
        // Individual response filtering
        individualFilters: {
            includeIndividualResponses: false,
            filterByRole: false,
            selectedRoles: [],
            filterByOrganization: false,
            selectedOrganizations: [],
            filterByDemographics: false,
            ageRange: { min: '', max: '' },
            experienceRange: { min: '', max: '' },
            educationLevels: [],
            filterByRegion: false,
            selectedRegions: [],
            compareAcrossIndividuals: false
        }
    });

    // Geographic circle selector state
    const [mapDialogOpen, setMapDialogOpen] = useState(false);

    // Metrics and dimensions state
    const [selectedMetrics, setSelectedMetrics] = useState([]);
    const [selectedDimensions, setSelectedDimensions] = useState([]);
    const [chartConfig, setChartConfig] = useState({
        type: 'bar',
        title: '',
        subtitle: '',
        xAxis: '',
        yAxis: '',
        colorPalette: 'default',
        showMissingData: true,
        legendPosition: 'right',
        sortOrder: 'asc'
    });

    // Role-based comparison state
    const [roleComparison, setRoleComparison] = useState({
        enabled: false,
        comparisonMode: 'within_role', // 'within_role', 'across_roles', 'role_vs_average', 'cross_regional'
        selectedRoles: [],
        selectedDemographics: [],
        benchmarkRole: '',
        showStatistics: true,
        regionFilter: 'all', // 'all', 'specific_regions', 'cross_regional'
        selectedRegions: [],
        includeRegionalAnalysis: false,
        showRoleDemographics: false,
        compareExperienceLevels: false
    });

    // Template management state
    const [templates, setTemplates] = useState([]);
    const [templateDialog, setTemplateDialog] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Sample data loading state
    const [sampleDataLoading, setSampleDataLoading] = useState(false);
    const [sampleDataDialog, setSampleDataDialog] = useState(false);
    const [sampleDataResults, setSampleDataResults] = useState(null);
    const [selectedOrganization, setSelectedOrganization] = useState('');
    const [selectedOrganizationHead, setSelectedOrganizationHead] = useState('');
    const [organizationHeads, setOrganizationHeads] = useState([]);

    // Test mode toggle state
    const [testMode, setTestMode] = useState(false);

    // Enhanced test mode filtering state
    const [testModeFilters, setTestModeFilters] = useState({
        selectedRole: '',
        availableUsers: [],
        selectedUser: '',
        availableSurveys: [],
        selectedSurvey: '',
        compareUsers: [],
        showComparison: false
    });



    // Available options for dropdowns
    const [availableData, setAvailableData] = useState({
        surveys: [],
        sections: [],
        questions: [],
        organizations: [],
        users: [],
        geographicData: {
            continents: [],
            countries: [],
            regions: []
        }
    });

    const metrics = [
        { id: 'response_count', name: 'Response Count', description: 'Total number of responses' },
        { id: 'completion_rate', name: 'Completion Rate', description: 'Percentage of completed surveys' },
        { id: 'average_rating', name: 'Average Rating', description: 'Average score for rating questions' },
        { id: 'response_percentage', name: 'Response Percentage', description: 'Percentage distribution of responses' },
        { id: 'unique_respondents', name: 'Unique Respondents', description: 'Number of unique survey participants' },
        { id: 'time_to_complete', name: 'Average Completion Time', description: 'Average time to complete survey' },
        // Role-specific metrics
        { id: 'role_comparison_score', name: 'Role Comparison Score', description: 'Comparative score against other roles' },
        { id: 'role_distribution', name: 'Role Distribution', description: 'Distribution of responses by role' },
        { id: 'demographic_breakdown', name: 'Demographic Breakdown', description: 'Age, experience, education distribution by role' },
        { id: 'competency_gaps', name: 'Competency Gaps', description: 'Areas where roles score lower than average' },
        { id: 'training_effectiveness', name: 'Training Effectiveness', description: 'Measure of training impact by role' },
        { id: 'role_satisfaction', name: 'Role Satisfaction', description: 'Overall satisfaction levels by role' },
        // Geographic-specific metrics
        { id: 'geographic_distribution', name: 'Geographic Distribution', description: 'Distribution of responses within selected regions' },
        { id: 'regional_comparison', name: 'Regional Comparison', description: 'Compare responses within vs outside selected regions' },
        { id: 'distance_correlation', name: 'Distance Correlation', description: 'Correlation between distance from center and responses' }
    ];

    const dimensions = [
        { id: 'question', name: 'Question', description: 'Group by survey questions' },
        { id: 'organization', name: 'Organization', description: 'Group by organization/institution' },
        { id: 'geographic_location', name: 'Geographic Location', description: 'Group by country/region' },
        { id: 'survey_section', name: 'Survey Section', description: 'Group by survey sections' },
        { id: 'response_date', name: 'Response Date', description: 'Group by response submission date' },
        { id: 'organization_type', name: 'Organization Type', description: 'Group by institution type' },
        { id: 'accreditation_status', name: 'Accreditation Status', description: 'Group by accreditation status' },
        { id: 'user_role', name: 'User Role', description: 'Group by respondent role' },
        // Enhanced role-based dimensions
        { id: 'role_demographics', name: 'Role Demographics', description: 'Age, experience, education within roles' },
        { id: 'role_competency', name: 'Role Competency', description: 'Training effectiveness by role' },
        { id: 'role_comparison', name: 'Role Comparison', description: 'Cross-role performance comparison' },
        { id: 'ministry_experience', name: 'Ministry Experience', description: 'Years of experience in ministry' },
        { id: 'education_level', name: 'Education Level', description: 'Educational qualifications' },
        { id: 'age_group', name: 'Age Group', description: 'Age demographic grouping' },
        { id: 'institutional_type', name: 'Institutional Type', description: 'Type of theological institution' },
        // Geographic-specific dimensions
        { id: 'geographic_region', name: 'Geographic Region', description: 'Group by selected circular regions' },
        { id: 'distance_from_center', name: 'Distance from Center', description: 'Group by distance from region centers' },
        { id: 'regional_density', name: 'Regional Density', description: 'Group by response density within regions' }
    ];

    // Available user roles from the survey documents
    const userRoles = [
        { id: 'pastor', name: 'Pastor/Church Leader', description: 'Senior pastor or church leader' },
        { id: 'president', name: 'Institution President', description: 'President/Principal/Rector/Doyen of theological institution' },
        { id: 'ministry_leader', name: 'Ministry Leader', description: 'Leader in non-formal theological education' },
        { id: 'faculty', name: 'Faculty Member', description: 'Teaching staff at theological institution' },
        { id: 'administrator', name: 'Administrator', description: 'Administrative staff' },
        { id: 'student', name: 'Student', description: 'Current student' },
        { id: 'alumni', name: 'Alumni', description: 'Graduate' }
    ];

    // Pre-built role-specific templates
    const roleTemplates = [
        {
            id: 'pastor_comparison',
            name: 'Pastor Performance Comparison',
            description: 'Compare pastors across different churches and regions',
            role: 'pastor',
            config: {
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'within_role',
                    selectedRoles: ['pastor'],
                    regionFilter: 'all',
                    includeRegionalAnalysis: true,
                    showRoleDemographics: true
                },
                metrics: ['average_rating', 'role_satisfaction', 'training_effectiveness'],
                dimensions: ['organization', 'geographic_region', 'ministry_experience'],
                chartType: 'bar'
            }
        },
        {
            id: 'president_benchmarking',
            name: 'Institution President Benchmarking',
            description: 'Benchmark institution presidents against overall averages',
            role: 'president',
            config: {
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'role_vs_average',
                    selectedRoles: ['president'],
                    benchmarkRole: 'president',
                    showStatistics: true,
                    showRoleDemographics: true
                },
                metrics: ['average_rating', 'competency_gaps', 'training_effectiveness'],
                dimensions: ['organization', 'accreditation_status', 'education_level'],
                chartType: 'bar'
            }
        },
        {
            id: 'ministry_leader_analysis',
            name: 'Ministry Leader Regional Analysis',
            description: 'Analyze ministry leaders across different regions',
            role: 'ministry_leader',
            config: {
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'cross_regional',
                    selectedRoles: ['ministry_leader'],
                    regionFilter: 'cross_regional',
                    includeRegionalAnalysis: true
                },
                metrics: ['average_rating', 'role_distribution', 'training_effectiveness'],
                dimensions: ['geographic_region', 'ministry_experience', 'age_group'],
                chartType: 'bar'
            }
        },
        {
            id: 'cross_role_comparison',
            name: 'Cross-Role Leadership Comparison',
            description: 'Compare performance across different leadership roles',
            role: 'all',
            config: {
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'across_roles',
                    selectedRoles: ['pastor', 'president', 'ministry_leader'],
                    showStatistics: true,
                    compareExperienceLevels: true
                },
                metrics: ['average_rating', 'role_comparison_score', 'training_effectiveness'],
                dimensions: ['user_role', 'ministry_experience', 'education_level'],
                chartType: 'bar'
            }
        }
    ];

    // Organization types and heads for sample data
    const organizationTypes = [
        {
            id: 'church',
            name: 'Church',
            description: 'Church or religious organization',
            icon: <ChurchIcon />,
            heads: [
                { id: 'pastor_john', name: 'Pastor John Williams', role: 'Senior Pastor', organization: 'Grace Community Church' },
                { id: 'pastor_mary', name: 'Pastor Mary Johnson', role: 'Associate Pastor', organization: 'Unity Fellowship Church' },
                { id: 'pastor_david', name: 'Pastor David Brown', role: 'Senior Pastor', organization: 'First Baptist Church' }
            ]
        },
        {
            id: 'institution',
            name: 'Educational Institution',
            description: 'Theological education institution',
            icon: <SchoolIcon />,
            heads: [
                { id: 'president_sarah', name: 'Dr. Sarah Thompson', role: 'President', organization: 'Theological Seminary of Excellence' },
                { id: 'dean_michael', name: 'Dr. Michael Davis', role: 'Academic Dean', organization: 'Institute of Biblical Studies' },
                { id: 'rector_james', name: 'Dr. James Wilson', role: 'Rector', organization: 'Christian University College' }
            ]
        },
        {
            id: 'non_formal',
            name: 'Non-Formal Education',
            description: 'Non-formal theological education provider',
            icon: <GroupIcon />,
            heads: [
                { id: 'leader_anna', name: 'Anna Rodriguez', role: 'Program Director', organization: 'Community Bible Training Center' },
                { id: 'coordinator_paul', name: 'Paul Martinez', role: 'Training Coordinator', organization: 'Outreach Ministry Institute' },
                { id: 'director_rachel', name: 'Rachel Chen', role: 'Executive Director', organization: 'Rural Ministry Training Program' }
            ]
        }
    ];

    // Demographics categories for role-based analysis
    const demographicCategories = [
        { id: 'age', name: 'Age Groups', options: ['20-30', '31-40', '41-50', '51-60', '60+'] },
        { id: 'experience', name: 'Ministry Experience', options: ['1-3 years', '4-7 years', '8-10 years', '11-15 years', '16-20 years', '20+ years'] },
        { id: 'education', name: 'Education Level', options: ['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD'] },
        { id: 'institution_type', name: 'Institution Type', options: ['Church', 'School', 'Seminary', 'Bible College', 'University'] }
    ];

    const chartTypes = [
        { id: 'bar', name: 'Bar Chart', icon: '📊' },
        { id: 'line', name: 'Line Chart', icon: '📈' },
        { id: 'pie', name: 'Pie Chart', icon: '🥧' },
        { id: 'stacked_bar', name: 'Stacked Bar', icon: '📊' },
        { id: 'scatter', name: 'Scatter Plot', icon: '🔵' },
        { id: 'table', name: 'Data Table', icon: '📋' },
        { id: 'kpi', name: 'KPI Cards', icon: '📢' },
        // Role-specific chart types
        { id: 'role_comparison', name: 'Role Comparison', icon: '⚖️' },
        { id: 'demographic_breakdown', name: 'Demographic Breakdown', icon: '👥' },
        { id: 'competency_matrix', name: 'Competency Matrix', icon: '🎯' },
        { id: 'training_effectiveness', name: 'Training Effectiveness', icon: '📚' },
        { id: 'role_heatmap', name: 'Role Performance Heatmap', icon: '🔥' },
        // Geographic-specific chart types
        { id: 'geographic_map', name: 'Geographic Map View', icon: '🗺️' },
        { id: 'regional_comparison', name: 'Regional Comparison', icon: '📍' },
        { id: 'distance_analysis', name: 'Distance Analysis', icon: '📏' }
    ];

    // Pre-built role-specific templates
    const roleSpecificTemplates = [
        {
            name: 'President Performance Dashboard',
            description: 'Compare institution presidents across key leadership metrics',
            targetRole: 'president',
            config: {
                dataScope: { surveys: [], sections: [], dateRange: { start: '', end: '' } },
                metrics: ['response_count', 'role_comparison_score', 'demographic_breakdown'],
                dimensions: ['user_role', 'organization_type', 'role_demographics'],
                chartConfig: { type: 'role_comparison', title: 'President Performance Analysis' },
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'within_role',
                    selectedRoles: ['president'],
                    selectedDemographics: ['age', 'experience', 'education'],
                    showStatistics: true
                }
            }
        },
        {
            name: 'Pastor Training Effectiveness',
            description: 'Analyze pastoral training outcomes and competency gaps',
            targetRole: 'pastor',
            config: {
                dataScope: { surveys: [], sections: [], dateRange: { start: '', end: '' } },
                metrics: ['training_effectiveness', 'competency_gaps', 'role_satisfaction'],
                dimensions: ['user_role', 'ministry_experience', 'education_level'],
                chartConfig: { type: 'training_effectiveness', title: 'Pastor Training Analysis' },
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'within_role',
                    selectedRoles: ['pastor'],
                    selectedDemographics: ['age', 'experience', 'education'],
                    showStatistics: true
                }
            }
        },
        {
            name: 'Cross-Role Competency Matrix',
            description: 'Compare competencies across different ministry roles',
            targetRole: 'all',
            config: {
                dataScope: { surveys: [], sections: [], dateRange: { start: '', end: '' } },
                metrics: ['role_comparison_score', 'competency_gaps', 'training_effectiveness'],
                dimensions: ['user_role', 'role_comparison', 'role_competency'],
                chartConfig: { type: 'competency_matrix', title: 'Cross-Role Competency Analysis' },
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'across_roles',
                    selectedRoles: ['president', 'pastor', 'ministry_leader'],
                    selectedDemographics: ['age', 'experience', 'education'],
                    showStatistics: true
                }
            }
        },
        {
            name: 'Ministry Leader Impact Assessment',
            description: 'Evaluate non-formal theological education effectiveness',
            targetRole: 'ministry_leader',
            config: {
                dataScope: { surveys: [], sections: [], dateRange: { start: '', end: '' } },
                metrics: ['training_effectiveness', 'role_satisfaction', 'competency_gaps'],
                dimensions: ['user_role', 'ministry_experience', 'institutional_type'],
                chartConfig: { type: 'role_heatmap', title: 'Ministry Leader Impact Assessment' },
                roleComparison: {
                    enabled: true,
                    comparisonMode: 'within_role',
                    selectedRoles: ['ministry_leader'],
                    selectedDemographics: ['age', 'experience', 'institution_type'],
                    showStatistics: true
                }
            }
        },
        {
            name: 'Geographic Regional Analysis',
            description: 'Compare survey responses across selected geographic regions',
            targetRole: 'all',
            config: {
                dataScope: {
                    surveys: [],
                    sections: [],
                    dateRange: { start: '', end: '' },
                    geography: { circles: [] }
                },
                metrics: ['geographic_distribution', 'regional_comparison', 'response_count'],
                dimensions: ['geographic_region', 'distance_from_center', 'organization_type'],
                chartConfig: { type: 'regional_comparison', title: 'Geographic Regional Analysis' },
                roleComparison: {
                    enabled: false,
                    comparisonMode: 'within_role',
                    selectedRoles: [],
                    selectedDemographics: [],
                    showStatistics: true
                }
            }
        }
    ];

    // Load initial data
    useEffect(() => {
        loadAvailableData();
        loadTemplates();
    }, []);

    const loadAvailableData = async () => {
        try {
            setLoading(true);

            if (testMode) {
                // Load sample data in test mode
                await loadSampleAvailableData();
            } else {
                // Load backend data in normal mode
                // Fetch surveys and templates
                const surveysResponse = await fetch('/api/survey-templates/available');
                const surveysData = await surveysResponse.json();

                // Fetch organizations
                const orgsResponse = await fetch('/api/organizations');
                const orgsData = await orgsResponse.json();

                // Fetch users
                const usersResponse = await fetch('/api/users');
                const usersData = await usersResponse.json();

                // Extract geographic data from organizations
                const continents = [...new Set(orgsData.map(org => org.geo_location?.continent).filter(Boolean))];
                const countries = [...new Set(orgsData.map(org => org.geo_location?.country).filter(Boolean))];
                const regions = [...new Set(orgsData.map(org => org.geo_location?.region).filter(Boolean))];

                setAvailableData({
                    surveys: surveysData.templates || [],
                    sections: extractSectionsFromSurveys(surveysData.templates || []),
                    questions: extractQuestionsFromSurveys(surveysData.templates || []),
                    organizations: orgsData,
                    users: usersData,
                    geographicData: { continents, countries, regions }
                });
            }
        } catch (error) {
            console.error('Error loading available data:', error);
            setError('Failed to load available data');
        } finally {
            setLoading(false);
        }
    };

    const loadSampleAvailableData = async () => {
        try {
            console.log('🔄 Loading sample data in test mode...');

            // Load sample survey questions (this returns a nested object structure)
            const questionsData = await SampleDataService.loadSurveyQuestions();
            console.log('📋 Survey questions loaded:', questionsData);

            // Load all sample responses to extract organization and user data
            const [churchResponses, institutionResponses, nonFormalResponses] = await Promise.all([
                SampleDataService.loadChurchResponses(),
                SampleDataService.loadInstitutionResponses(),
                SampleDataService.loadNonFormalResponses()
            ]);

            console.log('⛪ Church responses:', churchResponses.length);
            console.log('🏫 Institution responses:', institutionResponses.length);
            console.log('👥 Non-formal responses:', nonFormalResponses.length);

            const allResponses = [...churchResponses, ...institutionResponses, ...nonFormalResponses];
            console.log('📊 Total responses loaded:', allResponses.length);

            // Extract unique organizations from sample data
            const organizations = [
                ...new Map(allResponses.map(r => [r.organization_name, {
                    id: r.organization_name,
                    name: r.organization_name,
                    type: r.organization_type,
                    geo_location: {
                        country: r.country,
                        continent: 'Africa', // Most sample data is from Africa
                        region: r.country
                    }
                }])).values()
            ];

            // Extract unique users from sample data
            const users = [
                ...new Map(allResponses.map(r => [r.respondent_name, {
                    id: r.respondent_name,
                    name: r.respondent_name,
                    role: r.current_role,
                    organization: r.organization_name
                }])).values()
            ];

            // Extract all questions from the nested structure
            const extractQuestionsFromSurveyData = (surveyData) => {
                const allQuestions = [];
                Object.values(surveyData).forEach(survey => {
                    if (survey.sections) {
                        Object.values(survey.sections).forEach(section => {
                            if (section.questions && Array.isArray(section.questions)) {
                                section.questions.forEach(question => {
                                    allQuestions.push({
                                        ...question,
                                        section: section.title,
                                        survey_type: survey.title
                                    });
                                });
                            }
                        });
                    }
                });
                return allQuestions;
            };

            const allQuestions = extractQuestionsFromSurveyData(questionsData);
            console.log('❓ All questions extracted:', allQuestions.length);

            // Create mock survey templates from the structured data
            const mockSurveys = [
                {
                    id: 'sample_church_survey',
                    version_name: 'Church Survey (Sample)',
                    organization_type: 'Church',
                    sections: questionsData.church_survey?.sections ? Object.keys(questionsData.church_survey.sections) : [],
                    questions: allQuestions.filter(q => q.survey_type?.includes('church') || q.survey_type?.includes('Church'))
                },
                {
                    id: 'sample_institution_survey',
                    version_name: 'Institution Survey (Sample)',
                    organization_type: 'Institution',
                    sections: questionsData.institution_survey?.sections ? Object.keys(questionsData.institution_survey.sections) : [],
                    questions: allQuestions.filter(q => q.survey_type?.includes('institution') || q.survey_type?.includes('School'))
                },
                {
                    id: 'sample_nonformal_survey',
                    version_name: 'Non-Formal Education Survey (Sample)',
                    organization_type: 'Non-Formal',
                    sections: questionsData.non_formal_survey?.sections ? Object.keys(questionsData.non_formal_survey.sections) : [],
                    questions: allQuestions.filter(q => q.survey_type?.includes('non-formal') || q.survey_type?.includes('Non-Formal'))
                }
            ];

            // Extract geographic data from sample responses
            const countries = SampleDataService.getUniqueCountries(allResponses);
            const continents = ['Africa']; // Sample data is primarily from Africa
            const regions = countries; // Use countries as regions for simplicity

            console.log('🌍 Geographic data:', { countries, continents, regions });

            const finalAvailableData = {
                surveys: mockSurveys,
                sections: extractSectionsFromSurveys(mockSurveys),
                questions: extractQuestionsFromSurveys(mockSurveys),
                organizations: organizations,
                users: users,
                geographicData: { continents, countries, regions }
            };

            console.log('✅ Final available data set:', finalAvailableData);
            setAvailableData(finalAvailableData);
        } catch (error) {
            console.error('Error loading sample available data:', error);
            throw error;
        }
    };

    const extractSectionsFromSurveys = (surveys) => {
        const sections = [];
        surveys.forEach(survey => {
            if (survey.sections) {
                survey.sections.forEach(section => {
                    sections.push({
                        id: `${survey.id}_${section.name}`,
                        name: section.name,
                        survey_id: survey.id,
                        survey_name: survey.version_name
                    });
                });
            }
        });
        return sections;
    };

    const extractQuestionsFromSurveys = (surveys) => {
        const questions = [];
        surveys.forEach(survey => {
            if (survey.questions) {
                survey.questions.forEach(question => {
                    questions.push({
                        id: question.id,
                        text: question.question_text,
                        type: question.question_type_id,
                        section: question.section,
                        survey_id: survey.id,
                        survey_name: survey.version_name
                    });
                });
            }
        });
        return questions;
    };

    const loadTemplates = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`/api/reports/templates?user_id=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🚀 Starting report generation...');
            console.log('🔬 Test mode:', testMode);
            console.log('📊 Current configuration:', {
                dataScope,
                selectedMetrics,
                selectedDimensions,
                chartConfig,
                roleComparison
            });

            if (testMode) {
                // Use sample data in test mode
                console.log('🧪 Using test mode - generating test report');
                await generateTestReport();
            } else {
                // Use backend data in normal mode
                const reportConfig = {
                    dataScope,
                    metrics: selectedMetrics,
                    dimensions: selectedDimensions,
                    chartConfig,
                    roleComparison: roleComparison.enabled ? roleComparison : null,
                    individualFilters: dataScope.individualFilters.includeIndividualResponses ? dataScope.individualFilters : null
                };

                const response = await fetch('/api/reports/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reportConfig)
                });

                if (!response.ok) {
                    throw new Error('Failed to generate report');
                }

                const data = await response.json();
                setReportData(data.results || []);
                setPreviewData(processDataForChart(data.results || []));
            }
        } catch (error) {
            console.error('Error generating report:', error);
            setError('Failed to generate report. Please check your configuration.');
        } finally {
            setLoading(false);
        }
    };

    const generateTestReport = async () => {
        try {
            console.log('🧪 Generating test report...');

            let sampleData = [];

            // Check if enhanced test mode filtering is active
            if (testModeFilters.selectedRole && testModeFilters.selectedUser) {
                console.log('🎭 Using enhanced test mode with role/user filtering');
                console.log('Selected role:', testModeFilters.selectedRole);
                console.log('Selected user:', testModeFilters.selectedUser);
                console.log('Selected survey:', testModeFilters.selectedSurvey);

                // Load data for specific user and survey
                const userData = await SampleDataService.getUserSurveyData(
                    testModeFilters.selectedUser,
                    testModeFilters.selectedSurvey
                );

                if (userData.success) {
                    sampleData = userData.data.responses;
                    console.log('👤 User survey data loaded:', sampleData.length, 'responses');

                    // If comparison is enabled, load other users' data for comparison
                    if (testModeFilters.showComparison && testModeFilters.compareUsers.length > 0) {
                        console.log('🔄 Loading comparison data for other users...');

                        const comparisonData = await SampleDataService.getComparisonDataForRole(
                            testModeFilters.selectedRole,
                            testModeFilters.selectedUser,
                            testModeFilters.compareUsers
                        );

                        if (comparisonData.success) {
                            sampleData = [...sampleData, ...comparisonData.data.responses];
                            console.log('👥 Comparison data added:', comparisonData.data.responses.length, 'additional responses');
                        }
                    }
                }
            } else if (selectedOrganization) {
                console.log('🎯 Using specific organization data:', selectedOrganization, selectedOrganizationHead);
                // Use specific organization data if selected
                const orgData = await SampleDataService.loadOrganizationData(selectedOrganization, selectedOrganizationHead);
                if (orgData.success) {
                    sampleData = orgData.data.responses;
                    console.log('📊 Organization data loaded:', sampleData.length, 'responses');
                }
            } else {
                console.log('📂 Loading all sample data...');
                // Use all sample data if no specific organization selected
                const [churchResponses, institutionResponses, nonFormalResponses] = await Promise.all([
                    SampleDataService.loadChurchResponses(),
                    SampleDataService.loadInstitutionResponses(),
                    SampleDataService.loadNonFormalResponses()
                ]);
                sampleData = [...churchResponses, ...institutionResponses, ...nonFormalResponses];
                console.log('📊 All sample data loaded:', sampleData.length, 'responses');
            }

            console.log('🔧 Processing with configuration:', {
                chartType: chartConfig.type,
                metrics: selectedMetrics,
                dimensions: selectedDimensions
            });

            // Generate sample report data based on selected metrics and dimensions
            const processedData = SampleDataService.generateSampleReportData(
                sampleData,
                chartConfig.type,
                selectedMetrics,
                selectedDimensions,
                roleComparison.enabled ? roleComparison : null,
                dataScope.individualFilters
            );

            console.log('📈 Processed report data:', processedData);

            setReportData(processedData);
            setPreviewData(processDataForChart(processedData));

            console.log('✅ Test report generated successfully');
        } catch (error) {
            console.error('❌ Error generating test report:', error);
            throw error;
        }
    };

    const processDataForChart = (data) => {
        // Process raw data based on chart type and configuration
        if (!data || data.length === 0) return [];

        let processedData = data.map((item, index) => ({
            ...item,
            _color: chartColors[index % chartColors.length],
            _missingData: item.value === null || item.value === undefined ? 'No Response' : item.value
        }));

        // Enhanced processing for role-based comparisons
        if (roleComparison.enabled) {
            processedData = processedData.map(item => {
                // Add role-specific metadata
                if (item.role_data) {
                    return {
                        ...item,
                        role_average: item.role_data.role_average || 0,
                        overall_average: item.role_data.overall_average || 0,
                        role_count: item.role_data.role_count || 0,
                        percentile_rank: item.role_data.percentile_rank || 0,
                        comparison_score: item.role_data.comparison_score || 0
                    };
                }
                return item;
            });

            // Sort by role comparison score if in comparison mode
            if (roleComparison.comparisonMode === 'role_vs_average') {
                processedData.sort((a, b) => (b.comparison_score || 0) - (a.comparison_score || 0));
            }
        }

        return processedData;
    };

    const saveTemplate = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const templateData = {
                name: templateName,
                description: `Report template created on ${new Date().toLocaleDateString()}`,
                created_by: userId,
                is_public: false, // Can be made configurable
                config: {
                    dataScope,
                    metrics: selectedMetrics,
                    dimensions: selectedDimensions,
                    chartConfig,
                    roleComparison
                }
            };

            const response = await fetch('/api/reports/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateData)
            });

            if (response.ok) {
                setTemplateDialog(false);
                setTemplateName('');
                loadTemplates();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            setError('Failed to save template');
        }
    };

    const loadTemplate = (template) => {
        setDataScope(template.config.dataScope || {});
        setSelectedMetrics(template.config.metrics || []);
        setSelectedDimensions(template.config.dimensions || []);
        setChartConfig(template.config.chartConfig || {});
        setRoleComparison(template.config.roleComparison || {
            enabled: false,
            comparisonMode: 'within_role',
            selectedRoles: [],
            selectedDemographics: [],
            benchmarkRole: '',
            showStatistics: true
        });
        setSelectedTemplate(template);
    };

    const loadRoleTemplate = (template) => {
        console.log('🎭 Loading role template:', template);
        setSelectedMetrics(template.config.metrics || []);
        setSelectedDimensions(template.config.dimensions || []);
        setChartConfig(prev => ({ ...prev, type: template.config.chartType || 'bar' }));
        setRoleComparison(template.config.roleComparison || {
            enabled: false,
            comparisonMode: 'within_role',
            selectedRoles: [],
            selectedDemographics: [],
            benchmarkRole: '',
            showStatistics: true,
            regionFilter: 'all',
            selectedRegions: [],
            includeRegionalAnalysis: false,
            showRoleDemographics: false,
            compareExperienceLevels: false
        });
        setSelectedTemplate(template);
    };

    const resetConfiguration = () => {
        setDataScope({
            surveys: [],
            sections: [],
            dateRange: { start: '', end: '' },
            geography: { continents: [], countries: [], regions: [], customGroups: [], circles: [] },
            individualFilters: {
                includeIndividualResponses: false,
                filterByRole: false,
                selectedRoles: [],
                filterByOrganization: false,
                selectedOrganizations: [],
                filterByDemographics: false,
                ageRange: { min: '', max: '' },
                experienceRange: { min: '', max: '' },
                educationLevels: [],
                filterByRegion: false,
                selectedRegions: [],
                compareAcrossIndividuals: false
            }
        });
        setSelectedMetrics([]);
        setSelectedDimensions([]);
        setChartConfig({
            type: 'bar',
            title: '',
            subtitle: '',
            xAxis: '',
            yAxis: '',
            colorPalette: 'default',
            showMissingData: true,
            legendPosition: 'right',
            sortOrder: 'asc'
        });
        setRoleComparison({
            enabled: false,
            comparisonMode: 'within_role',
            selectedRoles: [],
            selectedDemographics: [],
            benchmarkRole: '',
            showStatistics: true
        });
        setSelectedTemplate(null);
        setReportData([]);
        setPreviewData([]);
    };

    // Geographic circle handlers
    const handleCirclesUpdate = (circles) => {
        setDataScope(prev => ({
            ...prev,
            geography: {
                ...prev.geography,
                circles: circles
            }
        }));
    };

    const openMapDialog = () => {
        setMapDialogOpen(true);
    };

    const closeMapDialog = () => {
        setMapDialogOpen(false);
    };

    const exportReport = () => {
        // Export functionality - could be CSV, PDF, etc.
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Update organization heads when organization type changes
    useEffect(() => {
        if (selectedOrganization) {
            const orgType = organizationTypes.find(org => org.id === selectedOrganization);
            setOrganizationHeads(orgType?.heads || []);
            setSelectedOrganizationHead(''); // Reset selected head when org type changes
        }
    }, [selectedOrganization]);

    // Reload available data when test mode changes
    useEffect(() => {
        loadAvailableData();
        loadTemplates();
    }, [testMode]);

    // Sample data loading handlers
    const handleLoadSampleData = async () => {
        if (!selectedOrganization || !selectedOrganizationHead) {
            alert('Please select an organization type and head before loading sample data.');
            return;
        }

        setSampleDataLoading(true);
        setSampleDataResults(null);

        try {
            // Load specific organization data based on selection
            const results = await SampleDataService.loadOrganizationData(selectedOrganization, selectedOrganizationHead);
            setSampleDataResults(results);
            setSampleDataDialog(true);

            // Refresh the report builder data after loading sample data
            await loadAvailableData();

        } catch (error) {
            console.error('Error loading sample data:', error);
            setSampleDataResults({
                success: false,
                error: error.message || 'Failed to load sample data'
            });
            setSampleDataDialog(true);
        } finally {
            setSampleDataLoading(false);
        }
    };

    const handleCloseSampleDataDialog = () => {
        setSampleDataDialog(false);
        setSampleDataResults(null);
    };

    const handleOrganizationChange = (orgId) => {
        setSelectedOrganization(orgId);
        setSelectedOrganizationHead(''); // Reset head selection
    };

    const handleOrganizationHeadChange = (headId) => {
        setSelectedOrganizationHead(headId);
    };

    // Enhanced test mode handlers
    const handleTestModeRoleChange = async (role) => {
        console.log('🎭 Test mode role selected:', role);

        setTestModeFilters(prev => ({
            ...prev,
            selectedRole: role,
            selectedUser: '',
            selectedSurvey: '',
            availableUsers: [],
            availableSurveys: [],
            compareUsers: [],
            showComparison: false
        }));

        if (role) {
            try {
                const users = await SampleDataService.getUsersByRole(role);
                console.log('👥 Users found for role', role, ':', users);

                setTestModeFilters(prev => ({
                    ...prev,
                    availableUsers: users
                }));
            } catch (error) {
                console.error('Error loading users for role:', error);
            }
        }
    };

    const handleTestModeUserChange = async (userId) => {
        console.log('👤 Test mode user selected:', userId);

        setTestModeFilters(prev => ({
            ...prev,
            selectedUser: userId,
            selectedSurvey: '',
            availableSurveys: []
        }));

        if (userId) {
            try {
                const surveys = await SampleDataService.getSurveysByUser(userId);
                console.log('📋 Surveys found for user', userId, ':', surveys);

                setTestModeFilters(prev => ({
                    ...prev,
                    availableSurveys: surveys
                }));
            } catch (error) {
                console.error('Error loading surveys for user:', error);
            }
        }
    };

    const handleTestModeSurveyChange = (surveyId) => {
        console.log('📊 Test mode survey selected:', surveyId);

        setTestModeFilters(prev => ({
            ...prev,
            selectedSurvey: surveyId
        }));
    };

    const handleTestModeComparison = async () => {
        console.log('🔄 Loading test mode comparison data...');

        if (!testModeFilters.selectedRole) {
            alert('Please select a role first');
            return;
        }

        try {
            const otherUsers = await SampleDataService.getOtherUsersInRole(
                testModeFilters.selectedRole,
                testModeFilters.selectedUser
            );

            setTestModeFilters(prev => ({
                ...prev,
                compareUsers: otherUsers,
                showComparison: true
            }));

            console.log('👥 Comparison users loaded:', otherUsers);
        } catch (error) {
            console.error('Error loading comparison users:', error);
        }
    };

    const renderChart = () => {
        if (!previewData || previewData.length === 0) {
            return (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400} sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        {testMode ? '🧪 Ready for Test Report' : '📊 Ready to Generate Report'}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        {testMode ? (
                            'Sample data loaded! Configure your report settings:'
                        ) : (
                            'Configure your report and click "Generate Report" to see results'
                        )}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                        {testMode && (
                            <>
                                <Typography variant="body2" color="textPrimary">
                                    ✅ Sample data: {availableData.surveys?.length || 0} surveys available
                                </Typography>
                                <Typography variant="body2" color="textPrimary">
                                    📊 Organizations: {availableData.organizations?.length || 0} loaded
                                </Typography>
                            </>
                        )}
                        {selectedMetrics.length === 0 && selectedDimensions.length === 0 && (
                            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                                ⚠️ Please select at least one metric or dimension
                            </Typography>
                        )}
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
                        Use the tabs on the left to configure Data Scope, Metrics, and Dimensions
                    </Typography>
                </Box>
            );
        }

        const chartProps = {
            width: '100%',
            height: 400,
            data: previewData
        };

        switch (chartConfig.type) {
            case 'bar':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <BarChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="value" fill={adminColors.primary} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <LineChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke={adminColors.primary} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <PieChart>
                            <Pie
                                data={previewData}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                fill={adminColors.primary}
                                dataKey="value"
                                label
                            >
                                {previewData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'table':
                return (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: adminColors.headerBg }}>
                                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Name</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Value</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                            {row.name || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                            {row.value ?? 'No Response'}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                            {row.percentage ? `${row.percentage}%` : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                );

            case 'role_comparison':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <ComposedChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="value" fill={adminColors.primary} name="Role Score" />
                            <Line type="monotone" dataKey="role_average" stroke="#FF9800" name="Role Average" />
                            <Line type="monotone" dataKey="overall_average" stroke="#4CAF50" name="Overall Average" />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            case 'demographic_breakdown':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <BarChart data={previewData} stackOffset="expand">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            {demographicCategories.map((category, index) => (
                                <Bar
                                    key={category.id}
                                    dataKey={category.id}
                                    fill={chartColors[index % chartColors.length]}
                                    name={category.name}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'competency_matrix':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <ScatterChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="competency_score" name="Competency Score" />
                            <YAxis dataKey="role_satisfaction" name="Role Satisfaction" />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            <Scatter name="Role Performance" data={previewData} fill={adminColors.primary} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'training_effectiveness':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <LineChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="training_category" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="before_training" stroke="#F44336" name="Before Training" />
                            <Line type="monotone" dataKey="after_training" stroke="#4CAF50" name="After Training" />
                            <Line type="monotone" dataKey="improvement" stroke="#2196F3" name="Improvement" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'role_heatmap':
                return (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 2,
                            p: 2
                        }}>
                            {previewData.map((item, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        p: 2,
                                        borderRadius: 1,
                                        backgroundColor: `rgba(99, 51, 148, ${(item.value || 0) / 100})`,
                                        color: (item.value || 0) > 50 ? 'white' : 'black',
                                        textAlign: 'center',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <Typography variant="body2" fontWeight="bold">
                                        {item.name}
                                    </Typography>
                                    <Typography variant="h6">
                                        {item.value || 0}%
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                );

            case 'kpi':
                return (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 2,
                        p: 2
                    }}>
                        {previewData.map((item, index) => (
                            <Card key={index} sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                                    {item.value || 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {item.name}
                                </Typography>
                                {item.role_average && (
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        Role Avg: {item.role_average}
                                    </Typography>
                                )}
                            </Card>
                        ))}
                    </Box>
                );

            case 'geographic_map':
                return (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                            Geographic Map View
                            <br />
                            Showing survey responses plotted on selected geographic regions
                            <br />
                            {dataScope.geography.circles.length} region(s) selected
                        </Typography>
                        {dataScope.geography.circles.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                {dataScope.geography.circles.map((circle, index) => (
                                    <Box key={circle.id} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                        <Typography variant="body2">
                                            <strong>{circle.name}</strong> - Center: {circle.center.lat.toFixed(4)}, {circle.center.lng.toFixed(4)}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Radius: {circle.radius > 1000 ? `${(circle.radius / 1000).toFixed(1)} km` : `${circle.radius} m`}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                );

            case 'regional_comparison':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <BarChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="inside_region" fill="#633394" name="Inside Selected Regions" />
                            <Bar dataKey="outside_region" fill="#967CB2" name="Outside Selected Regions" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'distance_analysis':
                return (
                    <ResponsiveContainer {...chartProps}>
                        <LineChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="distance_km" name="Distance (km)" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="response_count" stroke="#633394" name="Response Count" />
                            <Line type="monotone" dataKey="average_score" stroke="#FF9800" name="Average Score" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            default:
                return <Typography>Unsupported chart type</Typography>;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: adminColors.background }}>
            <Navbar tabs={tabs} onLogout={onLogout} />

            <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                        Report Builder
                    </Typography>

                    {/* Test Mode Toggle */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CloudUploadIcon sx={{ color: testMode ? '#ccc' : adminColors.primary }} />
                            <Typography variant="body2" sx={{ color: testMode ? '#ccc' : adminColors.primary, fontWeight: 500 }}>
                                Backend Data
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            onClick={() => setTestMode(!testMode)}
                            startIcon={testMode ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            sx={{
                                borderColor: testMode ? '#4caf50' : adminColors.primary,
                                color: testMode ? '#4caf50' : adminColors.primary,
                                backgroundColor: testMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(99, 51, 148, 0.1)',
                                '&:hover': {
                                    borderColor: testMode ? '#45a049' : adminColors.secondary,
                                    backgroundColor: testMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(99, 51, 148, 0.2)'
                                },
                                px: 2,
                                py: 1,
                                fontWeight: 600,
                                minWidth: '140px'
                            }}
                        >
                            {testMode ? 'Test Mode' : 'Normal Mode'}
                        </Button>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StorageIcon sx={{ color: testMode ? '#4caf50' : '#ccc' }} />
                            <Typography variant="body2" sx={{ color: testMode ? '#4caf50' : '#ccc', fontWeight: 500 }}>
                                Sample Data
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Test Mode Info Alert */}
                {testMode && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Enhanced Test Mode Active:</strong> Select a role, user, and survey to test role-based comparisons.
                            Load comparison users to compare survey responses between users with the same role.
                        </Typography>
                    </Alert>
                )}

                {/* Sub-tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={activeSubTab}
                        onChange={(e, v) => setActiveSubTab(v)}
                        variant="standard"
                        sx={{
                            mb: 3,
                            '& .MuiTab-root': {
                                color: adminColors.primary,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                minWidth: '160px',
                                padding: '12px 16px',
                                '&.Mui-selected': { fontWeight: 700 },
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: adminColors.primary,
                            }
                        }}
                    >
                        <Tab label="Report Builder" />
                    </Tabs>
                </Paper>

                {/* Report Builder Tab */}
                {activeSubTab === 0 && (
                    <Grid container spacing={3}>
                        {/* Left Panel - Configuration */}
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader
                                    title="Report Configuration"
                                    action={
                                        <Box>
                                            <Tooltip title="Reset Configuration">
                                                <IconButton onClick={resetConfiguration}>
                                                    <RefreshIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Save as Template">
                                                <IconButton onClick={() => setTemplateDialog(true)}>
                                                    <SaveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                                <CardContent>
                                    {/* Quick Start Guide */}
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Quick Start:</strong>
                                            {testMode ? (
                                                <span>
                                                    1️⃣ Select Role → User → Survey in "Test Mode Filtering" →
                                                    2️⃣ (Optional) Load comparison users →
                                                    3️⃣ Choose metrics in "Metrics" →
                                                    4️⃣ Pick dimensions in "Dimensions" →
                                                    5️⃣ Click "Generate Test Report" button
                                                </span>
                                            ) : (
                                                <span>
                                                    Enable "Test Mode" to use sample data, or configure backend data sources in each tab.
                                                </span>
                                            )}
                                        </Typography>
                                    </Alert>

                                    <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} orientation="vertical">
                                        <Tab label="Data Scope" />
                                        <Tab label="Metrics" />
                                        <Tab label="Dimensions" />
                                        <Tab label="Role Comparison" />
                                        <Tab label="Visualization" />
                                        <Tab label="Templates" />
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Configuration Panels */}
                            <Box sx={{ mt: 2 }}>
                                {/* Enhanced Test Mode Filtering */}
                                {testMode && (
                                    <Card sx={{ mb: 2 }}>
                                        <CardHeader title="🧪 Test Mode Filtering" />
                                        <CardContent>
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                                Select a role, user, and survey to test role-based comparisons with sample data.
                                            </Typography>

                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Select Role</InputLabel>
                                                <Select
                                                    value={testModeFilters.selectedRole}
                                                    onChange={(e) => handleTestModeRoleChange(e.target.value)}
                                                    label="Select Role"
                                                >
                                                    <MenuItem value="pastor">Pastor</MenuItem>
                                                    <MenuItem value="president">Institution President</MenuItem>
                                                    <MenuItem value="ministry_leader">Ministry Leader</MenuItem>
                                                    <MenuItem value="faculty">Faculty Member</MenuItem>
                                                    <MenuItem value="administrator">Administrator</MenuItem>
                                                </Select>
                                            </FormControl>

                                            {testModeFilters.selectedRole && (
                                                <FormControl fullWidth sx={{ mb: 2 }}>
                                                    <InputLabel>Select User</InputLabel>
                                                    <Select
                                                        value={testModeFilters.selectedUser}
                                                        onChange={(e) => handleTestModeUserChange(e.target.value)}
                                                        label="Select User"
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
                                                    >
                                                        {testModeFilters.availableSurveys.map((survey) => (
                                                            <MenuItem key={survey.id} value={survey.id}>
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {survey.title}
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
                                                        startIcon={<GroupIcon />}
                                                    >
                                                        Load Other {testModeFilters.selectedRole}s for Comparison
                                                    </Button>

                                                    {testModeFilters.showComparison && testModeFilters.compareUsers.length > 0 && (
                                                        <Alert severity="success" sx={{ mt: 2 }}>
                                                            <Typography variant="body2">
                                                                <strong>Comparison Ready!</strong> Loaded {testModeFilters.compareUsers.length} other {testModeFilters.selectedRole}s for comparison:
                                                            </Typography>
                                                            <Box sx={{ mt: 1 }}>
                                                                {testModeFilters.compareUsers.map((user) => (
                                                                    <Chip
                                                                        key={user.id}
                                                                        label={user.name}
                                                                        size="small"
                                                                        sx={{ mr: 1, mb: 1 }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Alert>
                                                    )}
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {currentTab === 0 && (
                                    <Card>
                                        <CardHeader title="Data Scope" />
                                        <CardContent>
                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Select Surveys</InputLabel>
                                                <Select
                                                    multiple
                                                    value={dataScope.surveys}
                                                    onChange={(e) => setDataScope(prev => ({ ...prev, surveys: e.target.value }))}
                                                    renderValue={(selected) => (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {selected.map((value) => (
                                                                <Chip key={value} label={
                                                                    availableData.surveys.find(s => s.id === value)?.version_name || value
                                                                } size="small" />
                                                            ))}
                                                        </Box>
                                                    )}
                                                >
                                                    {availableData.surveys.map((survey) => (
                                                        <MenuItem key={survey.id} value={survey.id}>
                                                            {survey.version_name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                fullWidth
                                                label="Start Date"
                                                type="date"
                                                value={dataScope.dateRange.start}
                                                onChange={(e) => setDataScope(prev => ({
                                                    ...prev,
                                                    dateRange: { ...prev.dateRange, start: e.target.value }
                                                }))}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ mb: 2 }}
                                            />

                                            <TextField
                                                fullWidth
                                                label="End Date"
                                                type="date"
                                                value={dataScope.dateRange.end}
                                                onChange={(e) => setDataScope(prev => ({
                                                    ...prev,
                                                    dateRange: { ...prev.dateRange, end: e.target.value }
                                                }))}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ mb: 3 }}
                                            />

                                            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                                                Geographic Filtering
                                            </Typography>

                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<MapIcon />}
                                                onClick={openMapDialog}
                                                sx={{ mb: 2 }}
                                            >
                                                Select Geographic Regions on Map
                                            </Button>

                                            {dataScope.geography.circles && dataScope.geography.circles.length > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                                        Selected Regions ({dataScope.geography.circles.length}):
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {dataScope.geography.circles.map((circle) => (
                                                            <Chip
                                                                key={circle.id}
                                                                label={`${circle.name} (${circle.radius > 1000 ?
                                                                    `${(circle.radius / 1000).toFixed(1)}km` :
                                                                    `${circle.radius}m`})`}
                                                                size="small"
                                                                icon={<LocationOnIcon />}
                                                                onDelete={() => {
                                                                    const updatedCircles = dataScope.geography.circles.filter(c => c.id !== circle.id);
                                                                    handleCirclesUpdate(updatedCircles);
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                            <Divider sx={{ my: 3 }} />

                                            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                                                Individual Response Filtering
                                            </Typography>

                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={dataScope.individualFilters.includeIndividualResponses}
                                                        onChange={(e) => setDataScope(prev => ({
                                                            ...prev,
                                                            individualFilters: {
                                                                ...prev.individualFilters,
                                                                includeIndividualResponses: e.target.checked
                                                            }
                                                        }))}
                                                    />
                                                }
                                                label="Include Individual Response Analysis"
                                                sx={{ mb: 2 }}
                                            />

                                            {dataScope.individualFilters.includeIndividualResponses && (
                                                <Box sx={{ pl: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={dataScope.individualFilters.filterByRole}
                                                                onChange={(e) => setDataScope(prev => ({
                                                                    ...prev,
                                                                    individualFilters: {
                                                                        ...prev.individualFilters,
                                                                        filterByRole: e.target.checked
                                                                    }
                                                                }))}
                                                            />
                                                        }
                                                        label="Filter by Role"
                                                        sx={{ mb: 1 }}
                                                    />

                                                    {dataScope.individualFilters.filterByRole && (
                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                            <InputLabel>Select Roles</InputLabel>
                                                            <Select
                                                                multiple
                                                                value={dataScope.individualFilters.selectedRoles}
                                                                onChange={(e) => setDataScope(prev => ({
                                                                    ...prev,
                                                                    individualFilters: {
                                                                        ...prev.individualFilters,
                                                                        selectedRoles: e.target.value
                                                                    }
                                                                }))}
                                                                renderValue={(selected) => (
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                        {selected.map((value) => (
                                                                            <Chip key={value} label={
                                                                                userRoles.find(r => r.id === value)?.name || value
                                                                            } size="small" />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            >
                                                                {userRoles.map((role) => (
                                                                    <MenuItem key={role.id} value={role.id}>
                                                                        {role.name}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}

                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={dataScope.individualFilters.filterByOrganization}
                                                                onChange={(e) => setDataScope(prev => ({
                                                                    ...prev,
                                                                    individualFilters: {
                                                                        ...prev.individualFilters,
                                                                        filterByOrganization: e.target.checked
                                                                    }
                                                                }))}
                                                            />
                                                        }
                                                        label="Filter by Organization"
                                                        sx={{ mb: 1 }}
                                                    />

                                                    {dataScope.individualFilters.filterByOrganization && (
                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                            <InputLabel>Select Organizations</InputLabel>
                                                            <Select
                                                                multiple
                                                                value={dataScope.individualFilters.selectedOrganizations}
                                                                onChange={(e) => setDataScope(prev => ({
                                                                    ...prev,
                                                                    individualFilters: {
                                                                        ...prev.individualFilters,
                                                                        selectedOrganizations: e.target.value
                                                                    }
                                                                }))}
                                                                renderValue={(selected) => (
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                        {selected.map((value) => (
                                                                            <Chip key={value} label={value} size="small" />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            >
                                                                {availableData.organizations.map((org) => (
                                                                    <MenuItem key={org.id} value={org.name}>
                                                                        {org.name}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}

                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={dataScope.individualFilters.filterByDemographics}
                                                                onChange={(e) => setDataScope(prev => ({
                                                                    ...prev,
                                                                    individualFilters: {
                                                                        ...prev.individualFilters,
                                                                        filterByDemographics: e.target.checked
                                                                    }
                                                                }))}
                                                            />
                                                        }
                                                        label="Filter by Demographics"
                                                        sx={{ mb: 1 }}
                                                    />

                                                    {dataScope.individualFilters.filterByDemographics && (
                                                        <Box sx={{ pl: 2, mb: 2 }}>
                                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                                Age Range
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                                <TextField
                                                                    label="Min Age"
                                                                    type="number"
                                                                    size="small"
                                                                    value={dataScope.individualFilters.ageRange.min}
                                                                    onChange={(e) => setDataScope(prev => ({
                                                                        ...prev,
                                                                        individualFilters: {
                                                                            ...prev.individualFilters,
                                                                            ageRange: {
                                                                                ...prev.individualFilters.ageRange,
                                                                                min: e.target.value
                                                                            }
                                                                        }
                                                                    }))}
                                                                />
                                                                <TextField
                                                                    label="Max Age"
                                                                    type="number"
                                                                    size="small"
                                                                    value={dataScope.individualFilters.ageRange.max}
                                                                    onChange={(e) => setDataScope(prev => ({
                                                                        ...prev,
                                                                        individualFilters: {
                                                                            ...prev.individualFilters,
                                                                            ageRange: {
                                                                                ...prev.individualFilters.ageRange,
                                                                                max: e.target.value
                                                                            }
                                                                        }
                                                                    }))}
                                                                />
                                                            </Box>

                                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                                Experience Range (Years)
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                                <TextField
                                                                    label="Min Experience"
                                                                    type="number"
                                                                    size="small"
                                                                    value={dataScope.individualFilters.experienceRange.min}
                                                                    onChange={(e) => setDataScope(prev => ({
                                                                        ...prev,
                                                                        individualFilters: {
                                                                            ...prev.individualFilters,
                                                                            experienceRange: {
                                                                                ...prev.individualFilters.experienceRange,
                                                                                min: e.target.value
                                                                            }
                                                                        }
                                                                    }))}
                                                                />
                                                                <TextField
                                                                    label="Max Experience"
                                                                    type="number"
                                                                    size="small"
                                                                    value={dataScope.individualFilters.experienceRange.max}
                                                                    onChange={(e) => setDataScope(prev => ({
                                                                        ...prev,
                                                                        individualFilters: {
                                                                            ...prev.individualFilters,
                                                                            experienceRange: {
                                                                                ...prev.individualFilters.experienceRange,
                                                                                max: e.target.value
                                                                            }
                                                                        }
                                                                    }))}
                                                                />
                                                            </Box>

                                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                                <InputLabel>Education Levels</InputLabel>
                                                                <Select
                                                                    multiple
                                                                    value={dataScope.individualFilters.educationLevels}
                                                                    onChange={(e) => setDataScope(prev => ({
                                                                        ...prev,
                                                                        individualFilters: {
                                                                            ...prev.individualFilters,
                                                                            educationLevels: e.target.value
                                                                        }
                                                                    }))}
                                                                    renderValue={(selected) => (
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                            {selected.map((value) => (
                                                                                <Chip key={value} label={value} size="small" />
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                >
                                                                    {['High School', 'Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Other'].map((level) => (
                                                                        <MenuItem key={level} value={level}>
                                                                            {level}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    )}

                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={dataScope.individualFilters.compareAcrossIndividuals}
                                                                onChange={(e) => setDataScope(prev => ({
                                                                    ...prev,
                                                                    individualFilters: {
                                                                        ...prev.individualFilters,
                                                                        compareAcrossIndividuals: e.target.checked
                                                                    }
                                                                }))}
                                                            />
                                                        }
                                                        label="Compare Across Individuals"
                                                        sx={{ mb: 1 }}
                                                    />

                                                    {dataScope.individualFilters.compareAcrossIndividuals && (
                                                        <Alert severity="info" sx={{ mt: 1 }}>
                                                            <Typography variant="body2">
                                                                This will compare individual responses within the same survey,
                                                                allowing you to see how different people answered the same questions.
                                                            </Typography>
                                                        </Alert>
                                                    )}
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {currentTab === 1 && (
                                    <Card>
                                        <CardHeader title="Select Metrics" />
                                        <CardContent>
                                            <FormGroup>
                                                {metrics.map((metric) => (
                                                    <FormControlLabel
                                                        key={metric.id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedMetrics.includes(metric.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedMetrics(prev => [...prev, metric.id]);
                                                                    } else {
                                                                        setSelectedMetrics(prev => prev.filter(m => m !== metric.id));
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {metric.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {metric.description}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                ))}
                                            </FormGroup>
                                        </CardContent>
                                    </Card>
                                )}

                                {currentTab === 2 && (
                                    <Card>
                                        <CardHeader title="Select Dimensions" />
                                        <CardContent>
                                            <FormGroup>
                                                {dimensions.map((dimension) => (
                                                    <FormControlLabel
                                                        key={dimension.id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedDimensions.includes(dimension.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedDimensions(prev => [...prev, dimension.id]);
                                                                    } else {
                                                                        setSelectedDimensions(prev => prev.filter(d => d !== dimension.id));
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {dimension.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {dimension.description}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                ))}
                                            </FormGroup>
                                        </CardContent>
                                    </Card>
                                )}

                                {currentTab === 3 && (
                                    <Card>
                                        <CardHeader title="Role-Based Comparison" />
                                        <CardContent>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={roleComparison.enabled}
                                                        onChange={(e) => setRoleComparison(prev => ({ ...prev, enabled: e.target.checked }))}
                                                    />
                                                }
                                                label="Enable Role-Based Comparison"
                                                sx={{ mb: 2 }}
                                            />

                                            {roleComparison.enabled && (
                                                <>
                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Comparison Mode</InputLabel>
                                                        <Select
                                                            value={roleComparison.comparisonMode}
                                                            onChange={(e) => setRoleComparison(prev => ({ ...prev, comparisonMode: e.target.value }))}
                                                        >
                                                            <MenuItem value="within_role">Compare Within Same Role</MenuItem>
                                                            <MenuItem value="across_roles">Compare Across Different Roles</MenuItem>
                                                            <MenuItem value="role_vs_average">Compare Role vs Overall Average</MenuItem>
                                                            <MenuItem value="cross_regional">Compare Same Role Across Regions</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Select Roles to Compare</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={roleComparison.selectedRoles}
                                                            onChange={(e) => setRoleComparison(prev => ({ ...prev, selectedRoles: e.target.value }))}
                                                            renderValue={(selected) => (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                    {selected.map((value) => (
                                                                        <Chip key={value} label={
                                                                            userRoles.find(r => r.id === value)?.name || value
                                                                        } size="small" />
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        >
                                                            {userRoles.map((role) => (
                                                                <MenuItem key={role.id} value={role.id}>
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight="bold">
                                                                            {role.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {role.description}
                                                                        </Typography>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>

                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Demographics to Include</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={roleComparison.selectedDemographics}
                                                            onChange={(e) => setRoleComparison(prev => ({ ...prev, selectedDemographics: e.target.value }))}
                                                            renderValue={(selected) => (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                    {selected.map((value) => (
                                                                        <Chip key={value} label={
                                                                            demographicCategories.find(d => d.id === value)?.name || value
                                                                        } size="small" />
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        >
                                                            {demographicCategories.map((category) => (
                                                                <MenuItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>

                                                    {roleComparison.comparisonMode === 'role_vs_average' && (
                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                            <InputLabel>Benchmark Role</InputLabel>
                                                            <Select
                                                                value={roleComparison.benchmarkRole}
                                                                onChange={(e) => setRoleComparison(prev => ({ ...prev, benchmarkRole: e.target.value }))}
                                                            >
                                                                {userRoles.map((role) => (
                                                                    <MenuItem key={role.id} value={role.id}>
                                                                        {role.name}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}

                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={roleComparison.showStatistics}
                                                                onChange={(e) => setRoleComparison(prev => ({ ...prev, showStatistics: e.target.checked }))}
                                                            />
                                                        }
                                                        label="Show Statistical Analysis"
                                                    />

                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Region Filter</InputLabel>
                                                        <Select
                                                            value={roleComparison.regionFilter}
                                                            onChange={(e) => setRoleComparison(prev => ({ ...prev, regionFilter: e.target.value }))}
                                                        >
                                                            <MenuItem value="all">All Regions</MenuItem>
                                                            <MenuItem value="specific_regions">Specific Regions Only</MenuItem>
                                                            <MenuItem value="cross_regional">Cross-Regional Comparison</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    {roleComparison.regionFilter === 'specific_regions' && (
                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                            <InputLabel>Select Regions</InputLabel>
                                                            <Select
                                                                multiple
                                                                value={roleComparison.selectedRegions}
                                                                onChange={(e) => setRoleComparison(prev => ({ ...prev, selectedRegions: e.target.value }))}
                                                                renderValue={(selected) => (
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                        {selected.map((value) => (
                                                                            <Chip key={value} label={value} size="small" />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            >
                                                                {['East Africa', 'West Africa', 'Central Africa', 'Southern Africa', 'North Africa'].map((region) => (
                                                                    <MenuItem key={region} value={region}>
                                                                        {region}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}

                                                    <FormGroup sx={{ mb: 2 }}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={roleComparison.includeRegionalAnalysis}
                                                                    onChange={(e) => setRoleComparison(prev => ({ ...prev, includeRegionalAnalysis: e.target.checked }))}
                                                                />
                                                            }
                                                            label="Include Regional Analysis"
                                                        />
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={roleComparison.showRoleDemographics}
                                                                    onChange={(e) => setRoleComparison(prev => ({ ...prev, showRoleDemographics: e.target.checked }))}
                                                                />
                                                            }
                                                            label="Show Role Demographics"
                                                        />
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={roleComparison.compareExperienceLevels}
                                                                    onChange={(e) => setRoleComparison(prev => ({ ...prev, compareExperienceLevels: e.target.checked }))}
                                                                />
                                                            }
                                                            label="Compare Experience Levels"
                                                        />
                                                    </FormGroup>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {currentTab === 4 && (
                                    <Card>
                                        <CardHeader title="Visualization Settings" />
                                        <CardContent>
                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Chart Type</InputLabel>
                                                <Select
                                                    value={chartConfig.type}
                                                    onChange={(e) => setChartConfig(prev => ({ ...prev, type: e.target.value }))}
                                                >
                                                    {chartTypes.map((type) => (
                                                        <MenuItem key={type.id} value={type.id}>
                                                            {type.icon} {type.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                fullWidth
                                                label="Chart Title"
                                                value={chartConfig.title}
                                                onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                                                sx={{ mb: 2 }}
                                            />

                                            <TextField
                                                fullWidth
                                                label="Subtitle"
                                                value={chartConfig.subtitle}
                                                onChange={(e) => setChartConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                                                sx={{ mb: 2 }}
                                            />

                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={chartConfig.showMissingData}
                                                        onChange={(e) => setChartConfig(prev => ({ ...prev, showMissingData: e.target.checked }))}
                                                    />
                                                }
                                                label="Show Missing Data as 'Unknown'"
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {currentTab === 5 && (
                                    <Card>
                                        <CardHeader title="Report Templates" />
                                        <CardContent>
                                            <Accordion defaultExpanded>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography variant="h6">Role-Specific Templates</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List>
                                                        {roleTemplates.map((template, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemText
                                                                    primary={template.name}
                                                                    secondary={
                                                                        <Box>
                                                                            <Typography variant="body2" color="textSecondary">
                                                                                {template.description}
                                                                            </Typography>
                                                                            <Chip
                                                                                label={template.role === 'all' ? 'All Roles' :
                                                                                    userRoles.find(r => r.id === template.role)?.name || template.role}
                                                                                size="small"
                                                                                sx={{ mt: 1 }}
                                                                            />
                                                                        </Box>
                                                                    }
                                                                />
                                                                <ListItemSecondaryAction>
                                                                    <IconButton onClick={() => loadRoleTemplate(template)}>
                                                                        <PlayArrowIcon />
                                                                    </IconButton>
                                                                </ListItemSecondaryAction>
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>

                                            {testMode && (
                                                <Accordion>
                                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                        <Typography variant="h6">Sample Data Testing</Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                                            Load sample data for specific organization heads to test and compare survey responses.
                                                        </Typography>

                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                            <InputLabel>Select Organization Type</InputLabel>
                                                            <Select
                                                                value={selectedOrganization}
                                                                onChange={(e) => handleOrganizationChange(e.target.value)}
                                                                label="Select Organization Type"
                                                            >
                                                                {organizationTypes.map((org) => (
                                                                    <MenuItem key={org.id} value={org.id}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            {org.icon}
                                                                            <Box>
                                                                                <Typography variant="body2" fontWeight="bold">
                                                                                    {org.name}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="textSecondary">
                                                                                    {org.description}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>

                                                        <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedOrganization}>
                                                            <InputLabel>Select Organization Head</InputLabel>
                                                            <Select
                                                                value={selectedOrganizationHead}
                                                                onChange={(e) => handleOrganizationHeadChange(e.target.value)}
                                                                label="Select Organization Head"
                                                            >
                                                                {organizationHeads.map((head) => (
                                                                    <MenuItem key={head.id} value={head.id}>
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight="bold">
                                                                                {head.name}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="textSecondary">
                                                                                {head.role} • {head.organization}
                                                                            </Typography>
                                                                        </Box>
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>

                                                        <Button
                                                            variant="contained"
                                                            startIcon={sampleDataLoading ? <CircularProgress size={20} color="inherit" /> : <DatasetIcon />}
                                                            onClick={handleLoadSampleData}
                                                            disabled={sampleDataLoading || !selectedOrganization || !selectedOrganizationHead}
                                                            sx={{
                                                                backgroundColor: '#4caf50',
                                                                '&:hover': { backgroundColor: '#45a049' },
                                                                mb: 2
                                                            }}
                                                        >
                                                            {sampleDataLoading ? 'Loading...' : 'Load Sample Data'}
                                                        </Button>

                                                        {(selectedOrganization || selectedOrganizationHead) && (
                                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                                <Typography variant="body2">
                                                                    This will load sample survey data for the selected organization head,
                                                                    allowing you to test report generation and compare responses across different surveys.
                                                                </Typography>
                                                            </Alert>
                                                        )}
                                                    </AccordionDetails>
                                                </Accordion>
                                            )}

                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography variant="h6">Saved Templates</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    {templates.length === 0 ? (
                                                        <Typography variant="body2" color="textSecondary">
                                                            No saved templates yet. Create a report configuration and save it as a template.
                                                        </Typography>
                                                    ) : (
                                                        <List>
                                                            {templates.map((template) => (
                                                                <ListItem key={template.id}>
                                                                    <ListItemText
                                                                        primary={template.name}
                                                                        secondary={`Created: ${new Date(template.created_at).toLocaleDateString()}`}
                                                                    />
                                                                    <ListItemSecondaryAction>
                                                                        <IconButton onClick={() => loadTemplate(template)}>
                                                                            <PlayArrowIcon />
                                                                        </IconButton>
                                                                        <IconButton onClick={() => {/* Delete template */ }}>
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </ListItemSecondaryAction>
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    )}
                                                </AccordionDetails>
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                )}


                            </Box>
                        </Grid>

                        {/* Right Panel - Preview and Results */}
                        <Grid item xs={12} md={roleComparison.enabled ? 6 : 8}>
                            <Card>
                                <CardHeader
                                    title="Report Preview"
                                    action={
                                        <Box>
                                            <Button
                                                variant="contained"
                                                onClick={generateReport}
                                                disabled={loading || (selectedMetrics.length === 0 && selectedDimensions.length === 0)}
                                                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                                                sx={{
                                                    mr: 1,
                                                    backgroundColor: testMode ? '#4caf50' : adminColors.primary,
                                                    '&:hover': { backgroundColor: testMode ? '#45a049' : adminColors.secondary },
                                                    px: 3,
                                                    py: 1.5,
                                                    fontSize: '1rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {loading ? 'Generating...' : (testMode ? 'Generate Test Report' : 'Generate Report')}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={exportReport}
                                                disabled={reportData.length === 0}
                                                startIcon={<DownloadIcon />}
                                            >
                                                Export
                                            </Button>
                                        </Box>
                                    }
                                />
                                <CardContent>
                                    {chartConfig.title && (
                                        <Typography variant="h6" gutterBottom align="center">
                                            {chartConfig.title}
                                        </Typography>
                                    )}
                                    {chartConfig.subtitle && (
                                        <Typography variant="subtitle2" gutterBottom align="center" color="textSecondary">
                                            {chartConfig.subtitle}
                                        </Typography>
                                    )}

                                    <Box sx={{ mt: 2 }}>
                                        {renderChart()}
                                    </Box>

                                    {reportData.length > 0 && (
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Summary Statistics
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6} md={3}>
                                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                        <Typography variant="h4" color="primary">
                                                            {reportData.length}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Data Points
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                        <Typography variant="h4" color="primary">
                                                            {reportData.filter(d => d.value != null).length}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Valid Responses
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                        <Typography variant="h4" color="primary">
                                                            {reportData.filter(d => d.value == null).length}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Missing Data
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                        <Typography variant="h4" color="primary">
                                                            {Math.round((reportData.filter(d => d.value != null).length / reportData.length) * 100)}%
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Completion Rate
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Role Comparison Insights Panel */}
                        {roleComparison.enabled && (
                            <Grid item xs={12} md={2}>
                                <Card>
                                    <CardHeader title="Role Insights" />
                                    <CardContent>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Selected Roles
                                            </Typography>
                                            {roleComparison.selectedRoles.map(roleId => {
                                                const role = userRoles.find(r => r.id === roleId);
                                                return (
                                                    <Chip
                                                        key={roleId}
                                                        label={role?.name || roleId}
                                                        size="small"
                                                        sx={{ mr: 1, mb: 1 }}
                                                    />
                                                );
                                            })}
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Comparison Mode
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {roleComparison.comparisonMode === 'within_role' && 'Comparing within same role'}
                                                {roleComparison.comparisonMode === 'across_roles' && 'Comparing across different roles'}
                                                {roleComparison.comparisonMode === 'role_vs_average' && 'Comparing role vs overall average'}
                                            </Typography>
                                        </Box>

                                        {roleComparison.showStatistics && previewData.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    Quick Stats
                                                </Typography>
                                                <Box sx={{ p: 1, bgcolor: adminColors.background, borderRadius: 1 }}>
                                                    <Typography variant="body2">
                                                        Total Responses: {previewData.reduce((sum, item) => sum + (item.role_count || 0), 0)}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Average Score: {(previewData.reduce((sum, item) => sum + (item.value || 0), 0) / previewData.length).toFixed(1)}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Top Performer: {previewData.sort((a, b) => (b.value || 0) - (a.value || 0))[0]?.name || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Demographics
                                            </Typography>
                                            {roleComparison.selectedDemographics.map(demoId => {
                                                const demo = demographicCategories.find(d => d.id === demoId);
                                                return (
                                                    <Chip
                                                        key={demoId}
                                                        label={demo?.name || demoId}
                                                        size="small"
                                                        sx={{ mr: 1, mb: 1 }}
                                                    />
                                                );
                                            })}
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        {dataScope.geography.circles && dataScope.geography.circles.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    Geographic Regions
                                                </Typography>
                                                {dataScope.geography.circles.map(circle => (
                                                    <Box key={circle.id} sx={{ mb: 1 }}>
                                                        <Chip
                                                            label={circle.name}
                                                            size="small"
                                                            sx={{ mr: 1, mb: 0.5 }}
                                                        />
                                                        <Typography variant="caption" color="textSecondary" display="block">
                                                            {circle.radius > 1000 ?
                                                                `${(circle.radius / 1000).toFixed(1)} km radius` :
                                                                `${circle.radius} m radius`}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 2 }} />

                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                Recommendations
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                • Focus on roles with lower performance scores
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                • Identify training gaps in underperforming areas
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                • Compare similar demographic groups for insights
                                            </Typography>
                                            {dataScope.geography.circles && dataScope.geography.circles.length > 0 && (
                                                <Typography variant="body2" color="textSecondary">
                                                    • Analyze geographic patterns within selected regions
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                )}



                {/* Geographic Circle Selector Dialog */}
                <GeographicCircleSelector
                    open={mapDialogOpen}
                    onClose={closeMapDialog}
                    onCirclesUpdate={handleCirclesUpdate}
                    initialCircles={dataScope.geography.circles}
                    title="Select Geographic Regions for Comparison"
                />

                {/* Template Save Dialog */}
                <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)}>
                    <DialogTitle>Save Report Template</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Template Name"
                            fullWidth
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
                        <Button onClick={saveTemplate} variant="contained">Save</Button>
                    </DialogActions>
                </Dialog>

                {/* Sample Data Results Dialog */}
                <Dialog
                    open={sampleDataDialog}
                    onClose={handleCloseSampleDataDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Sample Data Loading Results
                    </DialogTitle>
                    <DialogContent>
                        {sampleDataResults && (
                            <Box sx={{ mt: 2 }}>
                                {sampleDataResults.success ? (
                                    <Box>
                                        <Alert severity="success" sx={{ mb: 2 }}>
                                            Sample data loaded successfully for {
                                                organizationHeads.find(h => h.id === selectedOrganizationHead)?.name
                                            }!
                                        </Alert>
                                        <Typography variant="h6" gutterBottom>
                                            Data Summary:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Card sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" color="primary">
                                                        Organization Type
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {organizationTypes.find(org => org.id === selectedOrganization)?.name}
                                                    </Typography>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Card sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" color="primary">
                                                        Questions Loaded
                                                    </Typography>
                                                    <Typography variant="h4">
                                                        {sampleDataResults.questions || 0}
                                                    </Typography>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Card sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" color="primary">
                                                        Survey Responses
                                                    </Typography>
                                                    <Typography variant="h4">
                                                        {sampleDataResults.responses || 0}
                                                    </Typography>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Card sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" color="primary">
                                                        Organization Head
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {sampleDataResults.selectedHead?.name || organizationHeads.find(h => h.id === selectedOrganizationHead)?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {sampleDataResults.selectedHead?.role || organizationHeads.find(h => h.id === selectedOrganizationHead)?.role}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        {sampleDataResults.selectedHead?.organization}
                                                    </Typography>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Card sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                        Role Assignment Details
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <strong>Survey Respondent:</strong> {sampleDataResults.selectedHead?.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <strong>Role for Filtering:</strong> {
                                                            sampleDataResults.organizationType === 'church' ? 'Pastor' :
                                                                sampleDataResults.organizationType === 'institution' ? 'President' :
                                                                    sampleDataResults.organizationType === 'non_formal' ? 'Ministry Leader' : 'Unknown'
                                                        }
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Organization:</strong> {sampleDataResults.selectedHead?.organization}
                                                    </Typography>
                                                </Card>
                                            </Grid>
                                        </Grid>
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Test Data Ready!</strong> All survey responses are now assigned to {sampleDataResults.selectedHead?.name}
                                                with role "{
                                                    sampleDataResults.organizationType === 'church' ? 'Pastor' :
                                                        sampleDataResults.organizationType === 'institution' ? 'President' :
                                                            sampleDataResults.organizationType === 'non_formal' ? 'Ministry Leader' : 'Unknown'
                                                }".
                                                You can now test role-based filtering in Data Scope → Individual Response Filtering → Filter by Role.
                                            </Typography>
                                        </Alert>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            Failed to load sample data
                                        </Alert>
                                        <Typography variant="body2" color="error">
                                            {sampleDataResults.error}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseSampleDataDialog} variant="contained">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}

export default ReportBuilder; 