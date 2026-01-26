import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Button,
    Divider,
    TextField,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Chip,
    Card,
    CardContent,
    CardHeader,
    Alert,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Drawer,
    Collapse,
    Fab,
    Snackbar,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Slider,
    Grid,
    Radio,
} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    FormatAlignJustify,
    Image,
    Person as PersonIcon,
    TableChart,
    BarChart,
    PieChart,
    ShowChart,
    Timeline,
    BubbleChart,
    DonutLarge,
    Add,
    Delete,
    DragIndicator,
    Edit,
    Save,
    Download,
    Share,
    Undo,
    Redo,
    ChevronLeft,
    ChevronRight,
    ExpandMore,
    ExpandLess,
    Article,
    Title,
    TextFields,
    FormatQuote,
    HorizontalRule,
    InsertPhoto,
    ViewModule,
    Fullscreen,
    FullscreenExit,
    Settings,
    Palette,
    GridOn,
    Assessment,
    PictureAsPdf,
    ZoomIn,
    ZoomOut,
    ContentCopy,
    ArrowUpward,
    ArrowDownward,
    KeyboardArrowUp,
    KeyboardArrowDown,
    Close,
    Check,
    InsertPageBreak,
    NoteAdd,
    PostAdd,
    Search,
} from '@mui/icons-material';
import {
    BarChart as RechartsBarChart,
    Bar,
    LineChart,
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    AreaChart,
    Area,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Report Document Editor
 * 
 * A WYSIWYG document editor that allows users to:
 * - Drag and drop charts from Survey Analytics
 * - Write and format rich text content
 * - Arrange elements freely within the document
 * - Export to PDF with embedded charts
 */

const colors = {
    primary: '#633394',
    primaryLight: '#8e5bbc',
    primaryDark: '#4a2570',
    background: '#f8f4fc',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    border: '#e8dff5',
    text: '#333333',
    textSecondary: '#666666',
};

const chartColors = [
    '#633394', '#967CB2', '#4CAF50', '#FF9800', '#F44336',
    '#2196F3', '#9C27B0', '#795548', '#607D8B', '#E91E63'
];

// Document block types
const BLOCK_TYPES = {
    HEADING1: 'heading1',
    HEADING2: 'heading2',
    HEADING3: 'heading3',
    PARAGRAPH: 'paragraph',
    BULLET_LIST: 'bulletList',
    NUMBERED_LIST: 'numberedList',
    QUOTE: 'quote',
    DIVIDER: 'divider',
    IMAGE: 'image',
    CHART: 'chart',
    TABLE: 'table',
    SPACER: 'spacer',
    PAGE_BREAK: 'pageBreak',
    NEW_PAGE: 'newPage',
};

// Available chart types
const CHART_TYPES = [
    { type: 'bar', label: 'Bar Chart', icon: <BarChart /> },
    { type: 'line', label: 'Line Chart', icon: <ShowChart /> },
    { type: 'pie', label: 'Pie Chart', icon: <PieChart /> },
    { type: 'area', label: 'Area Chart', icon: <Timeline /> },
    { type: 'radar', label: 'Radar Chart', icon: <BubbleChart /> },
    { type: 'donut', label: 'Donut Chart', icon: <DonutLarge /> },
];

// Sample chart data for demonstration
const generateSampleChartData = () => ({
    surveyCompletion: [
        { name: 'Q1', completed: 85, pending: 15 },
        { name: 'Q2', completed: 78, pending: 22 },
        { name: 'Q3', completed: 92, pending: 8 },
        { name: 'Q4', completed: 88, pending: 12 },
    ],
    categoryDistribution: [
        { name: 'Leadership', value: 35 },
        { name: 'Communication', value: 25 },
        { name: 'Technical', value: 20 },
        { name: 'Teamwork', value: 20 },
    ],
    performanceTrend: [
        { month: 'Jan', score: 72 },
        { month: 'Feb', score: 75 },
        { month: 'Mar', score: 78 },
        { month: 'Apr', score: 82 },
        { month: 'May', score: 85 },
        { month: 'Jun', score: 88 },
    ],
    radarData: [
        { category: 'Leadership', A: 85, B: 72 },
        { category: 'Technical', A: 78, B: 82 },
        { category: 'Communication', A: 92, B: 85 },
        { category: 'Problem Solving', A: 88, B: 78 },
        { category: 'Teamwork', A: 80, B: 90 },
    ],
});

// Create a unique ID generator
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial document state
const createInitialDocument = (userName, orgName) => {
    const title = orgName ? `${orgName} - Survey Analysis Report` : 'Survey Analysis Report';
    const subtitle = userName ? `Prepared for: ${userName}` : '';

    return {
        id: generateId(),
        title: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blocks: [
            {
                id: generateId(),
                type: BLOCK_TYPES.HEADING1,
                content: title,
            },
            ...(subtitle ? [{
                id: generateId(),
                type: BLOCK_TYPES.HEADING3,
                content: subtitle,
            }] : []),
            {
                id: generateId(),
                type: BLOCK_TYPES.PARAGRAPH,
                content: `This report provides comprehensive analysis of survey data${orgName ? ` for ${orgName}` : ''}${userName ? ` (completed by ${userName})` : ''}. The insights below highlight key findings and recommendations based on the collected responses.`,
            },
        ],
    };
};

// Block component that renders different content types
const DocumentBlock = ({
    block,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    isFirst,
    isLast,
    availableCharts,
    surveyData,
    chartBuilderQuestions,
    selectedSurveyType,
    onOpenTableDialog,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(block.content || '');
    const [chartDialogOpen, setChartDialogOpen] = useState(false);
    const contentRef = useRef(null);
    const fileInputRef = useRef(null); // Move useRef to component level

    const handleSave = () => {
        onUpdate({ ...block, content: editContent });
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && block.type !== BLOCK_TYPES.PARAGRAPH) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setEditContent(block.content || '');
            setIsEditing(false);
        }
    };

    const renderTextBlock = (variant, placeholder, multiline = false) => {
        if (isEditing) {
            return (
                <TextField
                    fullWidth
                    multiline={multiline}
                    minRows={multiline ? 3 : 1}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    autoFocus
                    variant="standard"
                    placeholder={placeholder}
                    sx={{
                        '& .MuiInput-root': {
                            fontSize: variant === 'h3' ? '2rem' :
                                variant === 'h4' ? '1.5rem' :
                                    variant === 'h5' ? '1.25rem' : '1rem',
                            fontWeight: variant.startsWith('h') ? 600 : 400,
                        },
                    }}
                />
            );
        }

        return (
            <Typography
                variant={variant}
                onClick={() => setIsEditing(true)}
                sx={{
                    cursor: 'text',
                    minHeight: '1.5em',
                    '&:hover': { bgcolor: 'rgba(99, 51, 148, 0.04)' },
                    color: block.content ? 'inherit' : 'text.disabled',
                    fontWeight: variant.startsWith('h') ? 600 : 400,
                }}
            >
                {block.content || placeholder}
            </Typography>
        );
    };

    const renderChartBlock = () => {
        const sampleData = generateSampleChartData();
        const chartData = block.chartData || sampleData.surveyCompletion;
        const chartHeight = block.height || 300;

        const renderChart = () => {
            switch (block.chartType) {
                case 'bar':
                    return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <RechartsBarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                {Object.keys(chartData[0] || {}).filter(k => k !== 'name').map((key, idx) => (
                                    <Bar key={key} dataKey={key} fill={chartColors[idx % chartColors.length]} />
                                ))}
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    );
                case 'line':
                    return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                {Object.keys(chartData[0] || {}).filter(k => k !== 'name').map((key, idx) => (
                                    <Line key={key} type="monotone" dataKey={key} stroke={chartColors[idx % chartColors.length]} strokeWidth={2} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    );
                case 'pie':
                case 'donut':
                    return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <RechartsPieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={block.chartType === 'donut' ? 60 : 0}
                                    outerRadius={100}
                                    label
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    );
                case 'area':
                    return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                {Object.keys(chartData[0] || {}).filter(k => k !== 'name').map((key, idx) => (
                                    <Area key={key} type="monotone" dataKey={key} fill={chartColors[idx % chartColors.length]} fillOpacity={0.3} stroke={chartColors[idx % chartColors.length]} />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    );
                case 'radar':
                    return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <RadarChart data={chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="category" />
                                <PolarRadiusAxis />
                                {Object.keys(chartData[0] || {}).filter(k => k !== 'category').map((key, idx) => (
                                    <Radar key={key} name={key} dataKey={key} stroke={chartColors[idx % chartColors.length]} fill={chartColors[idx % chartColors.length]} fillOpacity={0.3} />
                                ))}
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    );
                default:
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <BarChart sx={{ fontSize: 48, mb: 2 }} />
                            <Typography>Click to configure chart</Typography>
                        </Box>
                    );
            }
        };

        return (
            <Box>
                {block.chartTitle && (
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        {block.chartTitle}
                    </Typography>
                )}
                {renderChart()}
                {block.chartCaption && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {block.chartCaption}
                    </Typography>
                )}
            </Box>
        );
    };

    const renderBlock = () => {
        switch (block.type) {
            case BLOCK_TYPES.HEADING1:
                return renderTextBlock('h3', 'Heading 1');
            case BLOCK_TYPES.HEADING2:
                return renderTextBlock('h4', 'Heading 2');
            case BLOCK_TYPES.HEADING3:
                return renderTextBlock('h5', 'Heading 3');
            case BLOCK_TYPES.PARAGRAPH:
                return renderTextBlock('body1', 'Start typing...', true);
            case BLOCK_TYPES.QUOTE:
                return (
                    <Box sx={{
                        pl: 3,
                        borderLeft: `4px solid ${colors.primary}`,
                        bgcolor: colors.background,
                        py: 2,
                        pr: 2,
                    }}>
                        {renderTextBlock('body1', 'Enter quote...', true)}
                    </Box>
                );
            case BLOCK_TYPES.BULLET_LIST:
            case BLOCK_TYPES.NUMBERED_LIST:
                return (
                    <Box component={block.type === BLOCK_TYPES.BULLET_LIST ? 'ul' : 'ol'} sx={{ pl: 3, m: 0 }}>
                        {(block.items || ['']).map((item, idx) => (
                            <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    value={item}
                                    placeholder="List item..."
                                    onChange={(e) => {
                                        const newItems = [...(block.items || [''])];
                                        newItems[idx] = e.target.value;
                                        onUpdate({ ...block, items: newItems });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const newItems = [...(block.items || [''])];
                                            newItems.splice(idx + 1, 0, '');
                                            onUpdate({ ...block, items: newItems });
                                        }
                                        if (e.key === 'Backspace' && item === '' && (block.items || []).length > 1) {
                                            e.preventDefault();
                                            const newItems = [...(block.items || [''])];
                                            newItems.splice(idx, 1);
                                            onUpdate({ ...block, items: newItems });
                                        }
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                );
            case BLOCK_TYPES.DIVIDER:
                return <Divider sx={{ my: 2 }} />;
            case BLOCK_TYPES.SPACER:
                return <Box sx={{ height: block.height || 32 }} />;
            case BLOCK_TYPES.PAGE_BREAK:
                return (
                    <Box
                        className="page-break"
                        sx={{
                            my: 3,
                            py: 2,
                            borderTop: `2px dashed ${colors.primary}`,
                            borderBottom: `2px dashed ${colors.primary}`,
                            textAlign: 'center',
                            bgcolor: colors.background,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            ── Page Break ──
                        </Typography>
                    </Box>
                );
            case BLOCK_TYPES.NEW_PAGE:
                return (
                    <Box
                        className="page-break new-page"
                        sx={{
                            my: 4,
                            position: 'relative',
                        }}
                    >
                        {/* Page separator line */}
                        <Box
                            sx={{
                                height: 40,
                                bgcolor: '#e0e0e0',
                                borderTop: `3px solid ${colors.primary}`,
                                borderBottom: `3px solid ${colors.primary}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                            }}
                        >
                            <NoteAdd sx={{ color: colors.primary }} />
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: colors.primary,
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                {block.pageTitle || 'New Page'}
                            </Typography>
                        </Box>
                        {/* Visual page number badge */}
                        {block.pageNumber && (
                            <Chip
                                label={`Page ${block.pageNumber}`}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    right: 16,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: colors.primary,
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            />
                        )}
                    </Box>
                );
            case BLOCK_TYPES.CHART:
                return renderChartBlock();
            case BLOCK_TYPES.TABLE:
                return block.tableData ? (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colors.border}` }}>
                            <thead>
                                <tr style={{ backgroundColor: colors.background }}>
                                    {block.tableData.headers?.map((header, idx) => (
                                        <th key={idx} style={{
                                            border: `1px solid ${colors.border}`,
                                            padding: '12px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: colors.primary
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {block.tableData.rows?.map((row, rowIdx) => (
                                    <tr key={rowIdx} style={{ '&:hover': { backgroundColor: colors.background } }}>
                                        {row.map((cell, cellIdx) => (
                                            <td key={cellIdx} style={{
                                                border: `1px solid ${colors.border}`,
                                                padding: '10px'
                                            }}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {block.tableCaption && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                {block.tableCaption}
                            </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                size="small"
                                startIcon={<Edit />}
                                onClick={() => onOpenTableDialog && onOpenTableDialog(block)}
                            >
                                Edit Table
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box
                        onClick={() => onOpenTableDialog && onOpenTableDialog(block)}
                        sx={{
                            p: 4,
                            border: `2px dashed ${colors.border}`,
                            borderRadius: 1,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { borderColor: colors.primary, bgcolor: colors.background }
                        }}
                    >
                        <TableChart sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary" variant="h6">Click to add table</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Select data from your surveys to create a table
                        </Typography>
                    </Box>
                );
            case BLOCK_TYPES.IMAGE:
                const handleImageUpload = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            onUpdate({
                                ...block,
                                imageUrl: reader.result,
                                imageAlt: file.name
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                };

                return block.imageUrl ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <img
                            src={block.imageUrl}
                            alt={block.imageAlt || 'Image'}
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: 8,
                                cursor: 'pointer'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        />
                        {block.imageCaption && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {block.imageCaption}
                            </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                size="small"
                                startIcon={<Edit />}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change Image
                            </Button>
                            <TextField
                                size="small"
                                placeholder="Add caption..."
                                value={block.imageCaption || ''}
                                onChange={(e) => onUpdate({ ...block, imageCaption: e.target.value })}
                                sx={{ maxWidth: 300 }}
                            />
                        </Box>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </Box>
                ) : (
                    <>
                        <Box
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                p: 4,
                                border: `2px dashed ${colors.border}`,
                                borderRadius: 1,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': { borderColor: colors.primary, bgcolor: colors.background },
                            }}
                        >
                            <InsertPhoto sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography color="text.secondary" variant="h6">Click to upload image</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Supports JPG, PNG, GIF (max 5MB)
                            </Typography>
                        </Box>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </>
                );
            default:
                return (
                    <Typography color="text.secondary">
                        Unknown block type: {block.type}
                    </Typography>
                );
        }
    };

    return (
        <Box
            ref={contentRef}
            data-block-id={block.id}
            data-block-type={block.type}
            onClick={() => onSelect(block.id)}
            sx={{
                position: 'relative',
                border: isSelected ? `2px solid ${colors.primary}` : '2px solid transparent',
                borderRadius: 1,
                p: 2,
                mb: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: 'rgba(99, 51, 148, 0.02)',
                    '& .block-actions': { opacity: 1 },
                },
            }}
        >
            {/* Block Type Label */}
            {isSelected && (
                <Chip
                    size="small"
                    label={block.type.replace(/([A-Z])/g, ' $1').trim()}
                    sx={{
                        position: 'absolute',
                        top: -12,
                        left: 8,
                        bgcolor: colors.primary,
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                    }}
                />
            )}

            {/* Block Actions */}
            <Box
                className="block-actions"
                sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    display: 'flex',
                    gap: 0.5,
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    bgcolor: 'white',
                    borderRadius: 1,
                    boxShadow: 1,
                    p: 0.25,
                }}
            >
                <Tooltip title="Move Up">
                    <span>
                        <IconButton size="small" onClick={onMoveUp} disabled={isFirst}>
                            <KeyboardArrowUp fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Move Down">
                    <span>
                        <IconButton size="small" onClick={onMoveDown} disabled={isLast}>
                            <KeyboardArrowDown fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Duplicate">
                    <IconButton size="small" onClick={onDuplicate}>
                        <ContentCopy fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" onClick={onDelete} color="error">
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Drag Handle */}
            <Box
                className="block-actions"
                sx={{
                    position: 'absolute',
                    left: -30,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    cursor: 'grab',
                }}
            >
                <DragIndicator sx={{ color: 'text.disabled' }} />
            </Box>

            {/* Block Content */}
            {renderBlock()}
        </Box>
    );
};

// Enhanced Chart Selection Dialog with intuitive data selection
const ChartSelectionDialog = ({ open, onClose, onSelect, availableCharts, comparisonData, surveyData, chartBuilderQuestions = [], selectedSurveyType = 'institution', preselectedChartType = null }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [chartType, setChartType] = useState(preselectedChartType || 'bar');
    const [chartTitle, setChartTitle] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByType, setFilterByType] = useState('all');
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [currentSurveyType, setCurrentSurveyType] = useState(selectedSurveyType);
    const [aggregationType, setAggregationType] = useState('average');
    const sampleData = generateSampleChartData();

    // Effect to update chart type when preselectedChartType changes
    React.useEffect(() => {
        if (preselectedChartType) {
            setChartType(preselectedChartType);
        }
    }, [preselectedChartType, open]);

    // Filter questions based on search and type
    const filteredQuestions = React.useMemo(() => {
        let questions = chartBuilderQuestions || [];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            questions = questions.filter(q =>
                q.text?.toLowerCase().includes(term) ||
                q.section?.toLowerCase().includes(term)
            );
        }

        if (filterByType === 'numeric') {
            questions = questions.filter(q => q.is_numeric);
        } else if (filterByType === 'non-numeric') {
            questions = questions.filter(q => !q.is_numeric);
        }

        return questions;
    }, [chartBuilderQuestions, searchTerm, filterByType]);

    // Count question types
    const questionStats = React.useMemo(() => ({
        total: chartBuilderQuestions?.length || 0,
        numeric: chartBuilderQuestions?.filter(q => q.is_numeric)?.length || 0,
        nonNumeric: chartBuilderQuestions?.filter(q => !q.is_numeric)?.length || 0,
    }), [chartBuilderQuestions]);

    // Generate Survey Analytics chart options from comparisonData
    const surveyAnalyticsCharts = React.useMemo(() => {
        const charts = [];

        if (comparisonData) {
            if (comparisonData.averages && comparisonData.targetScores) {
                const avgData = Object.entries(comparisonData.averages).map(([key, value]) => ({
                    name: comparisonData.question_labels?.[key] || key.replace(/_/g, ' '),
                    average: typeof value === 'number' ? parseFloat(value.toFixed(2)) : 0,
                    individual: comparisonData.targetScores[key] || 0,
                }));

                charts.push({
                    id: 'comparison_chart',
                    title: 'Individual vs Group Average',
                    chartType: 'bar',
                    data: avgData,
                    description: 'Compare scores against the group average',
                });
            }

            if (comparisonData.averages) {
                const avgOnlyData = Object.entries(comparisonData.averages).map(([key, value]) => ({
                    name: comparisonData.question_labels?.[key] || key.replace(/_/g, ' '),
                    value: typeof value === 'number' ? parseFloat(value.toFixed(2)) : 0,
                }));

                charts.push({
                    id: 'averages_chart',
                    title: 'Group Averages',
                    chartType: 'bar',
                    data: avgOnlyData,
                    description: 'Overall group performance',
                });

                charts.push({
                    id: 'averages_pie',
                    title: 'Distribution (Pie)',
                    chartType: 'pie',
                    data: avgOnlyData,
                    description: 'Pie chart of averages',
                });
            }
        }

        return charts;
    }, [comparisonData]);

    // Extract response data for selected question (using robust matching from ChartSelectorCard)
    const extractChartData = (question) => {
        if (!question || !surveyData) return [];

        const responses = surveyData[currentSurveyType] || [];
        const dataMap = {};

        console.log('📊 Chart Dialog - Extracting data for question:', question.text);
        console.log('📊 Survey type:', currentSurveyType, '| Responses:', responses.length);

        responses.forEach((response, index) => {
            if (!response.answers) return;

            let answersObj = response.answers;
            if (typeof answersObj === 'string') {
                try { answersObj = JSON.parse(answersObj); } catch (e) { return; }
            }

            let answerValue = null;

            // Matching priority (same as ChartSelectorCard):
            // 1. By question text (exact match)
            if (answersObj[question.text]) {
                answerValue = answersObj[question.text];
            }
            // 2. By question text (case-insensitive)
            else {
                const questionTextLower = question.text?.toLowerCase();
                let foundByText = false;
                for (const key in answersObj) {
                    if (key.toLowerCase() === questionTextLower) {
                        answerValue = answersObj[key];
                        foundByText = true;
                        break;
                    }
                }

                // 3. By question ID (as number)
                if (!foundByText && answersObj[question.id]) {
                    answerValue = answersObj[question.id];
                }
                // 4. By question ID (as string)
                else if (!foundByText && answersObj[String(question.id)]) {
                    answerValue = answersObj[String(question.id)];
                }
                // 5. By order + 1 (for template-generated IDs)
                else if (!foundByText && question.order !== undefined && question.order !== null) {
                    const orderKey = String(question.order + 1);
                    if (answersObj[orderKey]) {
                        answerValue = answersObj[orderKey];
                    }
                }
            }

            // 6. If answers is an array of objects with question_id
            if (!answerValue && Array.isArray(answersObj)) {
                const answer = answersObj.find(a =>
                    a.question_id === question.id ||
                    a.question_text === question.text ||
                    (a.question && a.question.toLowerCase() === question.text?.toLowerCase())
                );
                if (answer) {
                    answerValue = answer.answer || answer.value || answer.response;
                }
            }

            // Handle complex answer values (objects)
            if (answerValue && typeof answerValue === 'object' && !Array.isArray(answerValue)) {
                if (answerValue['YES/NO']) {
                    answerValue = answerValue['YES/NO'];
                } else if (Object.keys(answerValue).length > 0) {
                    answerValue = JSON.stringify(answerValue);
                }
            }

            if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
                const key = String(answerValue);
                dataMap[key] = (dataMap[key] || 0) + 1;
            }
        });

        const result = Object.entries(dataMap).map(([name, count]) => ({
            name,
            value: count,
            count,
        }));

        console.log('📊 Extracted data points:', result.length, result);
        return result;
    };

    const handleConfirm = () => {
        let chartData;
        let title = chartTitle;

        if (activeTab === 0 && selectedQuestion) {
            // Build from survey data
            chartData = extractChartData(selectedQuestion);
            title = title || selectedQuestion.text?.substring(0, 50) || 'Survey Chart';
        } else if (activeTab === 1) {
            // Quick charts from comparison data
            const selectedChart = surveyAnalyticsCharts.find(c => c.id === selectedQuestion?.id);
            if (selectedChart) {
                chartData = selectedChart.data;
                title = title || selectedChart.title;
            }
        }

        if (!chartData || chartData.length === 0) {
            chartData = sampleData.surveyCompletion;
            title = title || 'Chart';
        }

        onSelect({
            id: generateId(),
            type: BLOCK_TYPES.CHART,
            chartType: chartType,
            chartTitle: title,
            chartData: chartData,
            chartCaption: '',
            height: 300,
        });

        // Reset state
        setSelectedQuestion(null);
        setChartTitle('');
        setSearchTerm('');
        onClose();
    };

    const hasQuestions = chartBuilderQuestions?.length > 0;
    const hasAnalyticsData = surveyAnalyticsCharts.length > 0 || availableCharts?.length > 0;
    const allAvailableCharts = [...surveyAnalyticsCharts, ...(availableCharts || [])];

    const aggregationTypes = [
        { value: 'count', label: 'Count' },
        { value: 'average', label: 'Average' },
        { value: 'sum', label: 'Sum' },
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ bgcolor: colors.primary, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChart />
                    Insert Chart
                </Box>
                <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}>
                    <Select
                        value={currentSurveyType}
                        onChange={(e) => setCurrentSurveyType(e.target.value)}
                        sx={{ color: 'black' }}
                    >
                        <MenuItem value="church">Church Survey</MenuItem>
                        <MenuItem value="institution">Institution Survey</MenuItem>
                        <MenuItem value="nonFormal">Non-Formal Survey</MenuItem>
                    </Select>
                </FormControl>
            </DialogTitle>
            <DialogContent sx={{ mt: 2, minHeight: 500 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newVal) => {
                        setActiveTab(newVal);
                        setSelectedQuestion(null);
                    }}
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        icon={<Assessment sx={{ fontSize: 20 }} />}
                        iconPosition="start"
                        label="Build from Survey Data"
                        disabled={!hasQuestions}
                    />
                    <Tab
                        icon={<ShowChart sx={{ fontSize: 20 }} />}
                        iconPosition="start"
                        label="Quick Charts"
                        disabled={!hasAnalyticsData}
                    />
                    <Tab
                        icon={<BarChart sx={{ fontSize: 20 }} />}
                        iconPosition="start"
                        label="Custom Chart"
                    />
                </Tabs>

                {/* Tab 0: Build from Survey Data */}
                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        {/* Left: Question Selection */}
                        <Grid item xs={12} md={7}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Assessment fontSize="small" /> Select a Question to Visualize
                            </Typography>

                            {/* Stats Bar */}
                            <Paper sx={{ p: 1.5, mb: 2, bgcolor: '#f5f5f5', display: 'flex', gap: 2 }}>
                                <Chip label={`Total: ${questionStats.total}`} size="small" />
                                <Chip label={`Numeric: ${questionStats.numeric}`} size="small" color="primary" />
                                <Chip label={`Text: ${questionStats.nonNumeric}`} size="small" color="secondary" />
                            </Paper>

                            {/* Search */}
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ mb: 1 }}
                                InputProps={{
                                    startAdornment: <Assessment sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                                }}
                            />

                            {/* Filter Chips */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                    label="All"
                                    onClick={() => setFilterByType('all')}
                                    color={filterByType === 'all' ? 'primary' : 'default'}
                                    size="small"
                                    variant={filterByType === 'all' ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    label="Numeric"
                                    onClick={() => setFilterByType('numeric')}
                                    color={filterByType === 'numeric' ? 'primary' : 'default'}
                                    size="small"
                                    variant={filterByType === 'numeric' ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    label="Text"
                                    onClick={() => setFilterByType('non-numeric')}
                                    color={filterByType === 'non-numeric' ? 'primary' : 'default'}
                                    size="small"
                                    variant={filterByType === 'non-numeric' ? 'filled' : 'outlined'}
                                />
                            </Box>

                            {/* Questions List */}
                            <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                {!hasQuestions ? (
                                    <Alert severity="info" sx={{ m: 2 }}>
                                        No questions available. Select a survey response in Survey Analytics first to load questions.
                                    </Alert>
                                ) : filteredQuestions.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                                        No questions match your search
                                    </Typography>
                                ) : (
                                    filteredQuestions.map((question) => {
                                        const isSelected = selectedQuestion?.id === question.id;
                                        return (
                                            <Paper
                                                key={question.id}
                                                onClick={() => {
                                                    setSelectedQuestion(question);
                                                    setChartTitle(question.text?.substring(0, 50) || '');
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    m: 1,
                                                    cursor: 'pointer',
                                                    border: isSelected ? `2px solid ${colors.primary}` : '1px solid #e0e0e0',
                                                    bgcolor: isSelected ? '#f3e5f5' : 'white',
                                                    '&:hover': { bgcolor: isSelected ? '#f3e5f5' : '#fafafa' },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                    <Radio checked={isSelected} size="small" />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                                            {question.text?.length > 80 ? question.text.substring(0, 80) + '...' : question.text}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                            <Chip
                                                                label={question.question_type_display || 'Unknown'}
                                                                size="small"
                                                                sx={{ fontSize: '0.65rem', height: 18 }}
                                                            />
                                                            {question.is_numeric && (
                                                                <Chip label="Numeric" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                            )}
                                                            {question.section && (
                                                                <Chip label={question.section} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
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

                        {/* Right: Chart Configuration */}
                        <Grid item xs={12} md={5}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Chart Configuration
                            </Typography>

                            <TextField
                                fullWidth
                                size="small"
                                label="Chart Title"
                                value={chartTitle}
                                onChange={(e) => setChartTitle(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Chart Type</InputLabel>
                                <Select value={chartType} label="Chart Type" onChange={(e) => setChartType(e.target.value)}>
                                    {CHART_TYPES.map((ct) => (
                                        <MenuItem key={ct.type} value={ct.type}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {ct.icon}
                                                {ct.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Aggregation</InputLabel>
                                <Select value={aggregationType} label="Aggregation" onChange={(e) => setAggregationType(e.target.value)}>
                                    {aggregationTypes.map((agg) => (
                                        <MenuItem key={agg.value} value={agg.value}>{agg.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Selected Question Preview */}
                            {selectedQuestion && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Selected Question:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                        {selectedQuestion.text}
                                    </Typography>
                                    {(() => {
                                        const previewData = extractChartData(selectedQuestion);
                                        return previewData.length > 0 ? (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Data Preview ({previewData.length} unique values):
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                    {previewData.slice(0, 5).map((d, i) => (
                                                        <Chip key={i} label={`${d.name}: ${d.count}`} size="small" variant="outlined" />
                                                    ))}
                                                    {previewData.length > 5 && (
                                                        <Chip label={`+${previewData.length - 5} more`} size="small" />
                                                    )}
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                                                <Typography variant="caption">No response data found for this question</Typography>
                                            </Alert>
                                        );
                                    })()}
                                </Paper>
                            )}

                            {!selectedQuestion && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Select a question from the left panel to configure your chart
                                </Alert>
                            )}
                        </Grid>
                    </Grid>
                )}

                {/* Tab 1: Quick Charts */}
                {activeTab === 1 && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Quick charts from your current Survey Analytics comparison:
                        </Typography>
                        {allAvailableCharts.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                                {allAvailableCharts.map((chart, idx) => (
                                    <Card
                                        key={chart.id || idx}
                                        onClick={() => {
                                            setSelectedQuestion(chart);
                                            setChartTitle(chart.title);
                                            setChartType(chart.chartType || 'bar');
                                        }}
                                        sx={{
                                            width: 180,
                                            cursor: 'pointer',
                                            border: selectedQuestion?.id === chart.id ? `2px solid ${colors.primary}` : '1px solid #eee',
                                            transition: 'all 0.2s ease',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                                        }}
                                    >
                                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                            {chart.chartType === 'pie' ? <PieChart sx={{ fontSize: 36, color: colors.primary }} /> :
                                                chart.chartType === 'line' ? <ShowChart sx={{ fontSize: 36, color: colors.primary }} /> :
                                                    <BarChart sx={{ fontSize: 36, color: colors.primary }} />}
                                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>
                                                {chart.title}
                                            </Typography>
                                            {chart.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {chart.description}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                No comparison data available. Go to Survey Analytics and select a survey response first.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Tab 2: Custom Chart with sample data */}
                {activeTab === 2 && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Create a custom chart with sample data:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, mt: 2 }}>
                            {CHART_TYPES.map((ct) => (
                                <Chip
                                    key={ct.type}
                                    icon={ct.icon}
                                    label={ct.label}
                                    onClick={() => setChartType(ct.type)}
                                    variant={chartType === ct.type ? 'filled' : 'outlined'}
                                    color={chartType === ct.type ? 'primary' : 'default'}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>
                        <TextField
                            fullWidth
                            label="Chart Title"
                            value={chartTitle}
                            onChange={(e) => setChartTitle(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Alert severity="info">
                            This will insert a chart with sample data. You can edit the data after inserting.
                        </Alert>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    sx={{ bgcolor: colors.primary }}
                    disabled={activeTab === 0 && !selectedQuestion}
                >
                    Insert Chart
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Table Selection Dialog
const TableSelectionDialog = ({ open, onClose, onSelect, surveyData, chartBuilderQuestions = [], selectedSurveyType = 'institution' }) => {
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [tableTitle, setTableTitle] = useState('');
    const [currentSurveyType, setCurrentSurveyType] = useState(selectedSurveyType);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByType, setFilterByType] = useState('all');

    // Filter questions
    const filteredQuestions = React.useMemo(() => {
        let questions = chartBuilderQuestions || [];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            questions = questions.filter(q =>
                q.text?.toLowerCase().includes(term) ||
                q.section?.toLowerCase().includes(term)
            );
        }

        if (filterByType === 'numeric') {
            questions = questions.filter(q => q.is_numeric);
        } else if (filterByType === 'non-numeric') {
            questions = questions.filter(q => !q.is_numeric);
        }

        return questions;
    }, [chartBuilderQuestions, searchTerm, filterByType]);

    // Count question types
    const questionStats = React.useMemo(() => ({
        total: chartBuilderQuestions?.length || 0,
        numeric: chartBuilderQuestions?.filter(q => q.is_numeric)?.length || 0,
        nonNumeric: chartBuilderQuestions?.filter(q => !q.is_numeric)?.length || 0,
    }), [chartBuilderQuestions]);

    // Extract table data from survey responses
    const extractTableData = (question) => {
        if (!question || !surveyData) return { headers: [], rows: [] };

        const responses = surveyData[currentSurveyType] || [];
        const dataMap = {};

        responses.forEach((response) => {
            if (!response.answers) return;

            let answersObj = response.answers;
            if (typeof answersObj === 'string') {
                try { answersObj = JSON.parse(answersObj); } catch (e) { return; }
            }

            let answerValue = null;

            // Find answer (uses robust matching logic)
            // 1. By question text (exact match)
            if (answersObj[question.text]) {
                answerValue = answersObj[question.text];
            }
            // 2. By question text (case-insensitive)
            else {
                const questionTextLower = question.text?.toLowerCase();
                let foundByText = false;
                for (const key in answersObj) {
                    if (key.toLowerCase() === questionTextLower) {
                        answerValue = answersObj[key];
                        foundByText = true;
                        break;
                    }
                }

                // 3. By question ID (as number)
                if (!foundByText && answersObj[question.id]) {
                    answerValue = answersObj[question.id];
                }
                // 4. By question ID (as string)
                else if (!foundByText && answersObj[String(question.id)]) {
                    answerValue = answersObj[String(question.id)];
                }
                // 5. By order + 1 (for template-generated IDs)
                else if (!foundByText && question.order !== undefined && question.order !== null) {
                    const orderKey = String(question.order + 1);
                    if (answersObj[orderKey]) {
                        answerValue = answersObj[orderKey];
                    }
                }
            }

            // 6. If answers is an array of objects with question_id
            if (!answerValue && Array.isArray(answersObj)) {
                const answer = answersObj.find(a =>
                    a.question_id === question.id ||
                    a.question_text === question.text ||
                    (a.question && a.question.toLowerCase() === question.text?.toLowerCase())
                );
                if (answer) {
                    answerValue = answer.answer || answer.value || answer.response;
                }
            }

            // Handle complex answer values (objects)
            if (answerValue && typeof answerValue === 'object' && !Array.isArray(answerValue)) {
                if (answerValue['YES/NO']) {
                    answerValue = answerValue['YES/NO'];
                } else if (Object.keys(answerValue).length > 0) {
                    answerValue = JSON.stringify(answerValue);
                }
            }

            if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
                const key = String(answerValue);
                dataMap[key] = (dataMap[key] || 0) + 1;
            }
        });

        // Convert to table format
        const headers = ['Response', 'Count', 'Percentage'];
        const total = Object.values(dataMap).reduce((sum, count) => sum + count, 0);
        const rows = Object.entries(dataMap)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([response, count]) => [
                response,
                count,
                `${((count / total) * 100).toFixed(1)}%`
            ]);

        return { headers, rows };
    };

    const handleConfirm = () => {
        if (!selectedQuestion) return;

        const tableData = extractTableData(selectedQuestion);
        const title = tableTitle || selectedQuestion.text?.substring(0, 50) || 'Survey Data Table';

        onSelect({
            id: generateId(),
            type: BLOCK_TYPES.TABLE,
            tableData: tableData,
            tableCaption: title,
        });

        // Reset
        setSelectedQuestion(null);
        setTableTitle('');
        setSearchTerm('');
        onClose();
    };

    const previewData = selectedQuestion ? extractTableData(selectedQuestion) : null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ bgcolor: colors.primary, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChart />
                Create Table from Survey Data
            </DialogTitle>
            <DialogContent sx={{ mt: 2, height: 600, display: 'flex', flexDirection: 'column' }}>
                <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
                    {/* Left: Question Selection */}
                    <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            <Assessment fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                            Select a Question to Analyze
                        </Typography>

                        {/* Stats Bar */}
                        <Paper sx={{ p: 1.5, mb: 2, bgcolor: '#f5f5f5', display: 'flex', gap: 2 }}>
                            <Chip label={`Total: ${questionStats.total}`} size="small" />
                            <Chip label={`Numeric: ${questionStats.numeric}`} size="small" color="primary" />
                            <Chip label={`Text: ${questionStats.nonNumeric}`} size="small" color="secondary" />
                        </Paper>

                        {/* Search */}
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ mb: 1 }}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            }}
                        />

                        {/* Filter Chips */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip
                                label="All"
                                onClick={() => setFilterByType('all')}
                                color={filterByType === 'all' ? 'primary' : 'default'}
                                size="small"
                                variant={filterByType === 'all' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label="Numeric"
                                onClick={() => setFilterByType('numeric')}
                                color={filterByType === 'numeric' ? 'primary' : 'default'}
                                size="small"
                                variant={filterByType === 'numeric' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label="Text"
                                onClick={() => setFilterByType('non-numeric')}
                                color={filterByType === 'non-numeric' ? 'primary' : 'default'}
                                size="small"
                                variant={filterByType === 'non-numeric' ? 'filled' : 'outlined'}
                            />
                        </Box>

                        {/* Questions List */}
                        <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            {filteredQuestions.length > 0 ? (
                                filteredQuestions.map((question) => {
                                    const isSelected = selectedQuestion?.id === question.id;
                                    return (
                                        <Paper
                                            key={question.id}
                                            onClick={() => {
                                                setSelectedQuestion(question);
                                                setTableTitle(question.text?.substring(0, 50) || '');
                                            }}
                                            sx={{
                                                p: 1.5,
                                                m: 1,
                                                cursor: 'pointer',
                                                border: isSelected ? `2px solid ${colors.primary}` : '1px solid #e0e0e0',
                                                bgcolor: isSelected ? '#f3e5f5' : 'white',
                                                '&:hover': { bgcolor: isSelected ? '#f3e5f5' : '#fafafa' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Radio checked={isSelected} size="small" />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                                        {question.text}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                        <Chip
                                                            label={question.question_type_display || 'Unknown'}
                                                            size="small"
                                                            sx={{ fontSize: '0.65rem', height: 18 }}
                                                        />
                                                        {question.section && (
                                                            <Chip
                                                                label={question.section}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem', height: 18 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                })
                            ) : (
                                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                    No questions available
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    {/* Right: Table Configuration */}
                    <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Table Configuration
                        </Typography>

                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Survey Data Source</InputLabel>
                            <Select
                                value={currentSurveyType}
                                label="Survey Data Source"
                                onChange={(e) => setCurrentSurveyType(e.target.value)}
                            >
                                <MenuItem value="church">Church Survey</MenuItem>
                                <MenuItem value="institution">Institution Survey</MenuItem>
                                <MenuItem value="nonFormal">Non-Formal Survey</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            label="Table Caption"
                            value={tableTitle}
                            onChange={(e) => setTableTitle(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        {/* Selected Question Preview */}
                        {selectedQuestion ? (
                            <Paper sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <Typography variant="caption" color="text.secondary">Table Preview:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5, mb: 1 }}>
                                    {selectedQuestion.text}
                                </Typography>

                                {previewData?.rows.length > 0 ? (
                                    <Box sx={{ flex: 1, overflow: 'auto', border: `1px solid ${colors.border}`, borderRadius: 1, bgcolor: 'white' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: colors.background }}>
                                                <tr>
                                                    {previewData.headers.map((header, idx) => (
                                                        <th key={idx} style={{ borderBottom: `2px solid ${colors.border}`, padding: '8px', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem' }}>
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.rows.map((row, rowIdx) => (
                                                    <tr key={rowIdx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                                        {row.map((cell, cellIdx) => (
                                                            <td key={cellIdx} style={{ padding: '8px', fontSize: '0.8rem' }}>
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                ) : (
                                    <Alert severity="warning" sx={{ mt: 1 }}>
                                        No data found for this question
                                    </Alert>
                                )}

                                {previewData?.rows.length > 0 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                        Total Responses: {previewData.rows.reduce((sum, row) => sum + (row[1] || 0), 0)}
                                    </Typography>
                                )}
                            </Paper>
                        ) : (
                            <Alert severity="info">
                                Select a question from the left panel to configure your table
                            </Alert>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!selectedQuestion}
                    sx={{ bgcolor: colors.primary }}
                >
                    Insert Table
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Block Insertion Menu
const BlockInsertMenu = ({ anchorEl, onClose, onInsert }) => {
    const blocks = [
        { type: BLOCK_TYPES.HEADING1, label: 'Heading 1', icon: <Title /> },
        { type: BLOCK_TYPES.HEADING2, label: 'Heading 2', icon: <Title sx={{ fontSize: 20 }} /> },
        { type: BLOCK_TYPES.HEADING3, label: 'Heading 3', icon: <Title sx={{ fontSize: 16 }} /> },
        { type: BLOCK_TYPES.PARAGRAPH, label: 'Paragraph', icon: <TextFields /> },
        { type: BLOCK_TYPES.BULLET_LIST, label: 'Bullet List', icon: <FormatListBulleted /> },
        { type: BLOCK_TYPES.NUMBERED_LIST, label: 'Numbered List', icon: <FormatListNumbered /> },
        { type: BLOCK_TYPES.QUOTE, label: 'Quote', icon: <FormatQuote /> },
        { type: BLOCK_TYPES.DIVIDER, label: 'Divider', icon: <HorizontalRule /> },
        { type: BLOCK_TYPES.IMAGE, label: 'Image', icon: <InsertPhoto /> },
        { type: BLOCK_TYPES.CHART, label: 'Chart', icon: <BarChart /> },
        { type: BLOCK_TYPES.TABLE, label: 'Table', icon: <TableChart /> },
        { type: BLOCK_TYPES.SPACER, label: 'Spacer', icon: <ViewModule /> },
        { type: BLOCK_TYPES.NEW_PAGE, label: 'New Page', icon: <NoteAdd /> },
        { type: BLOCK_TYPES.PAGE_BREAK, label: 'Page Break', icon: <InsertPageBreak /> },
    ];

    return (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
            {blocks.map((block) => (
                <MenuItem
                    key={block.type}
                    onClick={() => {
                        onInsert(block.type);
                        onClose();
                    }}
                >
                    <ListItemIcon>{block.icon}</ListItemIcon>
                    <ListItemText>{block.label}</ListItemText>
                </MenuItem>
            ))}
        </Menu>
    );
};

// Main Report Document Editor Component
const ReportDocumentEditor = ({
    initialDocument,
    availableCharts = [],
    surveyData = {},
    comparisonData = null,
    chartBuilderQuestions = [],
    selectedSurveyType = 'institution',
    targetOrganizationId = null, // Organization ID of the survey being analyzed
    targetOrganizationName = null, // Organization name for display
    targetUserName = null, // User name (person who completed the survey)
    onSave,
    onExport,
    onClose,
}) => {
    const [document, setDocument] = useState(() => initialDocument || createInitialDocument(targetUserName, targetOrganizationName));
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [insertMenuAnchor, setInsertMenuAnchor] = useState(null);
    const [chartDialogOpen, setChartDialogOpen] = useState(false);
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [editingBlockId, setEditingBlockId] = useState(null);
    const [preselectedChartType, setPreselectedChartType] = useState(null);
    const [insertAfterBlockId, setInsertAfterBlockId] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const documentRef = useRef(null);
    const paperRef = useRef(null);

    // Save to history for undo/redo
    const saveToHistory = useCallback((newDocument) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.stringify(newDocument));
        if (newHistory.length > 50) newHistory.shift(); // Limit history
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Update document when initialDocument changes (for loading saved reports)
    useEffect(() => {
        if (initialDocument) {
            setDocument(initialDocument);
            setHistory([]);
            setHistoryIndex(-1);
        }
    }, [initialDocument]);

    // Undo
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setDocument(JSON.parse(history[historyIndex - 1]));
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setDocument(JSON.parse(history[historyIndex + 1]));
        }
    };

    // Update block
    const handleUpdateBlock = useCallback((updatedBlock) => {
        setDocument((prev) => {
            const newDoc = {
                ...prev,
                updatedAt: new Date().toISOString(),
                blocks: prev.blocks.map((block) =>
                    block.id === updatedBlock.id ? updatedBlock : block
                ),
            };
            saveToHistory(newDoc);
            return newDoc;
        });
    }, [saveToHistory]);

    // Delete block
    const handleDeleteBlock = useCallback((blockId) => {
        setDocument((prev) => {
            const newDoc = {
                ...prev,
                updatedAt: new Date().toISOString(),
                blocks: prev.blocks.filter((block) => block.id !== blockId),
            };
            saveToHistory(newDoc);
            return newDoc;
        });
        setSelectedBlockId(null);
    }, [saveToHistory]);

    // Move block up
    const handleMoveBlockUp = useCallback((blockId) => {
        setDocument((prev) => {
            const index = prev.blocks.findIndex((b) => b.id === blockId);
            if (index <= 0) return prev;
            const newBlocks = [...prev.blocks];
            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
            const newDoc = { ...prev, blocks: newBlocks, updatedAt: new Date().toISOString() };
            saveToHistory(newDoc);
            return newDoc;
        });
    }, [saveToHistory]);

    // Move block down
    const handleMoveBlockDown = useCallback((blockId) => {
        setDocument((prev) => {
            const index = prev.blocks.findIndex((b) => b.id === blockId);
            if (index >= prev.blocks.length - 1) return prev;
            const newBlocks = [...prev.blocks];
            [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
            const newDoc = { ...prev, blocks: newBlocks, updatedAt: new Date().toISOString() };
            saveToHistory(newDoc);
            return newDoc;
        });
    }, [saveToHistory]);

    // Duplicate block
    const handleDuplicateBlock = useCallback((blockId) => {
        setDocument((prev) => {
            const index = prev.blocks.findIndex((b) => b.id === blockId);
            if (index < 0) return prev;
            const block = prev.blocks[index];
            const newBlock = { ...block, id: generateId() };
            const newBlocks = [...prev.blocks];
            newBlocks.splice(index + 1, 0, newBlock);
            const newDoc = { ...prev, blocks: newBlocks, updatedAt: new Date().toISOString() };
            saveToHistory(newDoc);
            return newDoc;
        });
    }, [saveToHistory]);

    // Handle adding a new page (inserts new page marker + heading)
    const handleAddNewPage = useCallback(() => {
        // Count existing NEW_PAGE blocks to determine page number
        setDocument((prev) => {
            const existingPages = prev.blocks.filter(b => b.type === BLOCK_TYPES.NEW_PAGE).length;
            const pageNumber = existingPages + 2; // Start from page 2 (page 1 is the default first page)

            const newPageBlock = {
                id: generateId(),
                type: BLOCK_TYPES.NEW_PAGE,
                pageTitle: `Page ${pageNumber}`,
                pageNumber: pageNumber,
            };

            // Also add a heading block for the new page
            const newHeadingBlock = {
                id: generateId(),
                type: BLOCK_TYPES.HEADING2,
                content: '',
            };

            const insertIndex = insertAfterBlockId
                ? prev.blocks.findIndex((b) => b.id === insertAfterBlockId) + 1
                : prev.blocks.length;

            const newBlocks = [...prev.blocks];
            newBlocks.splice(insertIndex, 0, newPageBlock, newHeadingBlock);

            const newDoc = { ...prev, blocks: newBlocks, updatedAt: new Date().toISOString() };
            saveToHistory(newDoc);

            // Set selection after state update
            setTimeout(() => {
                setSelectedBlockId(newHeadingBlock.id);
            }, 0);

            return newDoc;
        });

        setInsertAfterBlockId(null);
        setSnackbar({ open: true, message: 'New page added!', severity: 'success' });
    }, [insertAfterBlockId, saveToHistory]);

    // Insert new block
    const handleInsertBlock = (blockType) => {
        const newBlock = {
            id: generateId(),
            type: blockType,
            content: '',
        };

        if (blockType === BLOCK_TYPES.BULLET_LIST || blockType === BLOCK_TYPES.NUMBERED_LIST) {
            newBlock.items = [''];
        }

        if (blockType === BLOCK_TYPES.CHART) {
            setChartDialogOpen(true);
            return;
        }

        if (blockType === BLOCK_TYPES.NEW_PAGE) {
            handleAddNewPage();
            return;
        }

        setDocument((prev) => {
            const insertIndex = insertAfterBlockId
                ? prev.blocks.findIndex((b) => b.id === insertAfterBlockId) + 1
                : prev.blocks.length;

            const newBlocks = [...prev.blocks];
            newBlocks.splice(insertIndex, 0, newBlock);

            const newDoc = { ...prev, blocks: newBlocks, updatedAt: new Date().toISOString() };
            saveToHistory(newDoc);
            return newDoc;
        });

        setSelectedBlockId(newBlock.id);
        setInsertAfterBlockId(null);
    };

    // Handle chart insertion from dialog
    const handleInsertChart = (chartBlock) => {
        setDocument((prev) => {
            const insertIndex = insertAfterBlockId
                ? prev.blocks.findIndex((b) => b.id === insertAfterBlockId) + 1
                : prev.blocks.length;

            const newBlocks = [...prev.blocks];
            newBlocks.splice(insertIndex, 0, chartBlock);

            const newDoc = { ...prev, blocks: newBlocks, updatedAt: new Date().toISOString() };
            saveToHistory(newDoc);
            return newDoc;
        });

        setSelectedBlockId(chartBlock.id);
        setInsertAfterBlockId(null);
    };

    // Save document to backend API
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Get user info from localStorage
            // Check 'user' object first, then standalone keys
            const userStr = localStorage.getItem('user');
            const userObj = userStr ? JSON.parse(userStr) : {};

            // Try to get ID from multiple possible sources
            const userId = localStorage.getItem('userId') || userObj.id || userObj.user_id;

            // For organization_id, prioritize:
            // 1. targetOrganizationId prop (the organization being analyzed in the report)
            // 2. User's organization from localStorage
            // 3. null (backend will look up from user's profile)
            const organizationId = targetOrganizationId || localStorage.getItem('organizationId') || userObj.organization_id || null;

            if (!userId) {
                console.error('User ID not found in localStorage');
                throw new Error('User not logged in');
            }

            const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            // Prepare the report data
            // Check if ID is from DB (numeric or string without 'block_' prefix)
            // vs local temporary ID (starts with 'block_')
            const isDbId = document.id &&
                (typeof document.id === 'number' ||
                    (typeof document.id === 'string' &&
                        !document.id.startsWith('block_') &&
                        !document.id.startsWith('doc_')));

            const reportData = {
                id: isDbId ? document.id : null,
                user_id: userId,
                organization_id: organizationId, // Use the target organization (analyzed org) or fallback
                title: document.title || 'Untitled Report',
                content: document // Store the entire document structure
            };

            const response = await fetch(`${baseURL}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                const result = await response.json();
                // Update document ID if this was a new save
                if (result.id && document.id !== result.id) {
                    setDocument(prev => ({ ...prev, id: result.id }));
                }
                setSnackbar({ open: true, message: 'Document saved to database!', severity: 'success' });
                console.log('Document saved to backend:', result);
            } else {
                throw new Error('Failed to save to backend');
            }

            // Call onSave callback if provided
            if (onSave) {
                await onSave(document);
            }
        } catch (error) {
            console.error('Error saving document to backend:', error);
            // Fallback to localStorage
            localStorage.setItem(`report_document_${document.id}`, JSON.stringify(document));
            setSnackbar({ open: true, message: 'Saved locally (backend unavailable)', severity: 'warning' });
        } finally {
            setIsSaving(false);
        }
    };

    // Export to PDF with proper multi-page handling
    const handleExportPDF = async () => {
        setIsExporting(true);

        // Save current selection and clear it to prevent selection border from appearing in PDF
        const previousSelection = selectedBlockId;
        setSelectedBlockId(null);

        // Wait for React to re-render without the selection
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const documentContainer = documentRef.current;
            if (!documentContainer) return;

            // A4 dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm

            const pdf = new jsPDF('p', 'mm', 'a4');

            // Find all document pages
            const pages = documentContainer.querySelectorAll('.document-page');

            if (pages.length === 0) {
                // Fallback - capture the whole container
                const canvas = await html2canvas(documentContainer, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                });

                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
            } else {
                // Capture each page separately
                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];

                    // Add new PDF page for each except the first
                    if (i > 0) {
                        pdf.addPage();
                    }

                    const canvas = await html2canvas(page, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                    });

                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // Center the image if it's shorter than the page
                    const yPos = 0;

                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yPos, imgWidth, Math.min(imgHeight, pageHeight));
                }
            }

            pdf.save(`${document.title || 'report'}.pdf`);
            setSnackbar({ open: true, message: 'PDF exported successfully!', severity: 'success' });

            if (onExport) {
                onExport(document, 'pdf');
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            setSnackbar({ open: true, message: 'Error exporting PDF', severity: 'error' });
        } finally {
            setIsExporting(false);
            // Restore the previous selection after export
            setSelectedBlockId(previousSelection);
        }
    };

    // Initialize history
    useEffect(() => {
        if (history.length === 0) {
            setHistory([JSON.stringify(document)]);
            setHistoryIndex(0);
        }
    }, []);

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f0f0' }}>
            {/* Left Sidebar - Block Inserter */}
            <Drawer
                variant="persistent"
                open={sidebarOpen}
                sx={{
                    width: sidebarOpen ? 280 : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 280,
                        boxSizing: 'border-box',
                        position: 'relative',
                        height: '100%',
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.primary }}>
                            Insert Elements
                        </Typography>
                        <IconButton
                            onClick={() => setSidebarOpen(false)}
                            size="small"
                            sx={{
                                bgcolor: colors.background,
                                '&:hover': { bgcolor: colors.border },
                            }}
                        >
                            <ChevronLeft />
                        </IconButton>
                    </Box>

                    {/* Text Blocks */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Text
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {[
                            { type: BLOCK_TYPES.HEADING1, label: 'H1', icon: <Title /> },
                            { type: BLOCK_TYPES.HEADING2, label: 'H2', icon: <Title sx={{ fontSize: 20 }} /> },
                            { type: BLOCK_TYPES.HEADING3, label: 'H3', icon: <Title sx={{ fontSize: 16 }} /> },
                            { type: BLOCK_TYPES.PARAGRAPH, label: 'Text', icon: <TextFields /> },
                        ].map((item) => (
                            <Button
                                key={item.type}
                                variant="outlined"
                                size="small"
                                startIcon={item.icon}
                                onClick={() => handleInsertBlock(item.type)}
                                sx={{
                                    borderColor: colors.border,
                                    color: colors.text,
                                    '&:hover': { borderColor: colors.primary, bgcolor: colors.background },
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    {/* List & Structure */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Lists & Structure
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FormatListBulleted />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.BULLET_LIST)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Bullets
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FormatListNumbered />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.NUMBERED_LIST)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Numbers
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FormatQuote />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.QUOTE)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Quote
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<HorizontalRule />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.DIVIDER)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Divider
                        </Button>
                    </Box>

                    {/* Charts */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Charts & Analytics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {CHART_TYPES.slice(0, 4).map((chart) => (
                            <Button
                                key={chart.type}
                                variant="outlined"
                                size="small"
                                startIcon={chart.icon}
                                onClick={() => {
                                    // Open chart dialog with this chart type pre-selected
                                    setPreselectedChartType(chart.type);
                                    setChartDialogOpen(true);
                                }}
                                sx={{
                                    borderColor: colors.border,
                                    color: colors.text,
                                    '&:hover': { borderColor: colors.primary, bgcolor: colors.background },
                                }}
                            >
                                {chart.label}
                            </Button>
                        ))}
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Assessment />}
                        onClick={() => setChartDialogOpen(true)}
                        sx={{ bgcolor: colors.primary, mb: 2 }}
                    >
                        Browse All Charts
                    </Button>

                    {/* Media */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Media
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<InsertPhoto />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.IMAGE)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Image
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<TableChart />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.TABLE)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Table
                        </Button>
                    </Box>

                    {/* Pages */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Pages
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<NoteAdd />}
                            onClick={() => handleAddNewPage()}
                            sx={{
                                bgcolor: colors.primary,
                                color: 'white',
                                '&:hover': { bgcolor: colors.primaryDark },
                            }}
                        >
                            Add New Page
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<InsertPageBreak />}
                            onClick={() => handleInsertBlock(BLOCK_TYPES.PAGE_BREAK)}
                            sx={{ borderColor: colors.border, color: colors.text }}
                        >
                            Page Break
                        </Button>
                    </Box>

                    {/* Available Charts from Survey Analytics */}
                    {availableCharts.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Survey Analytics Charts
                            </Typography>
                            <List dense>
                                {availableCharts.map((chart, idx) => (
                                    <ListItem
                                        key={idx}
                                        button
                                        onClick={() => {
                                            handleInsertChart({
                                                id: generateId(),
                                                type: BLOCK_TYPES.CHART,
                                                chartType: chart.chartType || 'bar',
                                                chartTitle: chart.title,
                                                chartData: chart.data,
                                                height: 300,
                                            });
                                        }}
                                        sx={{
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: 1,
                                            mb: 0.5,
                                            '&:hover': { bgcolor: colors.background },
                                        }}
                                    >
                                        <ListItemIcon><Assessment sx={{ color: colors.primary }} /></ListItemIcon>
                                        <ListItemText primary={chart.title} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Box>
            </Drawer>

            {/* Toggle Sidebar Button - Only show when sidebar is closed */}
            {!sidebarOpen && (
                <IconButton
                    onClick={() => setSidebarOpen(true)}
                    sx={{
                        position: 'absolute',
                        left: 8,
                        top: 400,
                        zIndex: 1200,
                        bgcolor: 'white',
                        boxShadow: 1,
                        '&:hover': { bgcolor: colors.background },
                    }}
                >
                    <ChevronRight />
                </IconButton>
            )}

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Toolbar */}
                <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 0, boxShadow: 1 }}>
                    {/* Document Title */}
                    <TextField
                        variant="standard"
                        value={document.title}
                        onChange={(e) => setDocument({ ...document, title: e.target.value })}
                        sx={{ width: 300, '& input': { fontWeight: 600, fontSize: '1.1rem' } }}
                    />

                    {/* Survey Target Info - Person and Organization */}
                    {(targetUserName || targetOrganizationName) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {targetUserName && (
                                <Chip
                                    icon={<PersonIcon sx={{ ml: 1, fontSize: '1.2rem !important' }} />}
                                    label={targetUserName}
                                    size="small"
                                    sx={{
                                        bgcolor: colors.background,
                                        color: colors.text,
                                        fontWeight: 500,
                                        border: `1px solid ${colors.primary}`,
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                            )}
                            {targetOrganizationName && (
                                <Chip
                                    label={targetOrganizationName}
                                    size="small"
                                    sx={{
                                        bgcolor: colors.primaryLight,
                                        color: 'white',
                                        fontWeight: 500,
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    {/* Undo/Redo */}
                    <Tooltip title="Undo">
                        <span>
                            <IconButton onClick={handleUndo} disabled={historyIndex <= 0}>
                                <Undo />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Redo">
                        <span>
                            <IconButton onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                                <Redo />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    {/* Zoom */}
                    <Tooltip title="Zoom Out">
                        <IconButton onClick={() => setZoom(Math.max(50, zoom - 10))}>
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                        {zoom}%
                    </Typography>
                    <Tooltip title="Zoom In">
                        <IconButton onClick={() => setZoom(Math.min(200, zoom + 10))}>
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Save & Export */}
                    <Button
                        variant="outlined"
                        startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
                        onClick={handleSave}
                        disabled={isSaving}
                        sx={{ borderColor: colors.primary, color: colors.primary }}
                    >
                        Save
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        sx={{ bgcolor: colors.primary }}
                    >
                        Export PDF
                    </Button>

                    {onClose && (
                        <IconButton onClick={onClose}>
                            <Close />
                        </IconButton>
                    )}
                </Paper>

                {/* Document Canvas - Multi-Page Layout */}
                <Box
                    ref={documentRef}
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        bgcolor: '#606060',
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    {/* Split blocks into pages based on NEW_PAGE markers */}
                    {(() => {
                        // Group blocks into pages
                        const pages = [];
                        let currentPage = [];

                        document.blocks.forEach((block, index) => {
                            if (block.type === BLOCK_TYPES.NEW_PAGE && currentPage.length > 0) {
                                // Save current page and start new one
                                pages.push(currentPage);
                                currentPage = [block]; // Include the NEW_PAGE block on the new page for reference
                            } else {
                                currentPage.push(block);
                            }
                        });

                        // Don't forget the last page
                        if (currentPage.length > 0) {
                            pages.push(currentPage);
                        }

                        // If no pages, create an empty one
                        if (pages.length === 0) {
                            pages.push([]);
                        }

                        return pages.map((pageBlocks, pageIndex) => (
                            <Box key={`page-container-${pageIndex}`} sx={{ position: 'relative' }}>
                                {/* Page number indicator */}
                                <Chip
                                    label={`Page ${pageIndex + 1}`}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: -12,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        bgcolor: colors.primary,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        zIndex: 10,
                                    }}
                                />
                                <Paper
                                    ref={pageIndex === 0 ? paperRef : null}
                                    elevation={8}
                                    className="document-page"
                                    data-page-number={pageIndex + 1}
                                    sx={{
                                        width: `${(8.5 * 96 * zoom) / 100}px`, // 8.5 inches at 96 DPI
                                        minHeight: `${(11 * 96 * zoom) / 100}px`, // 11 inches at 96 DPI
                                        p: 6,
                                        bgcolor: 'white',
                                        transform: `scale(${zoom / 100})`,
                                        transformOrigin: 'top center',
                                        position: 'relative',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {/* Page header for pages after the first */}
                                    {pageIndex > 0 && (
                                        <Box
                                            sx={{
                                                mb: 3,
                                                pb: 1,
                                                borderBottom: `2px solid ${colors.primary}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{ color: colors.primary, fontWeight: 'bold' }}
                                            >
                                                {document.title || 'Untitled Report'}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: 'text.secondary' }}
                                            >
                                                Page {pageIndex + 1}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Render page blocks (skip the NEW_PAGE marker itself) */}
                                    {pageBlocks
                                        .filter(block => block.type !== BLOCK_TYPES.NEW_PAGE)
                                        .map((block, blockIndex) => {
                                            const globalIndex = document.blocks.findIndex(b => b.id === block.id);
                                            return (
                                                <DocumentBlock
                                                    key={block.id}
                                                    block={block}
                                                    isSelected={selectedBlockId === block.id}
                                                    onSelect={setSelectedBlockId}
                                                    onUpdate={handleUpdateBlock}
                                                    onDelete={() => handleDeleteBlock(block.id)}
                                                    onMoveUp={() => handleMoveBlockUp(block.id)}
                                                    onMoveDown={() => handleMoveBlockDown(block.id)}
                                                    onDuplicate={() => handleDuplicateBlock(block.id)}
                                                    isFirst={globalIndex === 0}
                                                    isLast={globalIndex === document.blocks.length - 1}
                                                    availableCharts={availableCharts}
                                                    surveyData={surveyData}
                                                    chartBuilderQuestions={chartBuilderQuestions}
                                                    selectedSurveyType={selectedSurveyType}
                                                    onOpenTableDialog={(block) => {
                                                        setEditingBlockId(block.id);
                                                        setTableDialogOpen(true);
                                                    }}
                                                />
                                            );
                                        })}

                                    {/* Add block button at the end of each page */}
                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 2,
                                            border: `2px dashed ${colors.border}`,
                                            borderRadius: 1,
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: colors.primary,
                                                bgcolor: colors.background,
                                                color: colors.primary,
                                            },
                                        }}
                                        onClick={(e) => {
                                            // Set insert position to after the last block on this page
                                            const lastBlock = pageBlocks[pageBlocks.length - 1];
                                            setInsertAfterBlockId(lastBlock?.id || null);
                                            setInsertMenuAnchor(e.currentTarget);
                                        }}
                                    >
                                        <Add sx={{ mb: 0.5 }} />
                                        <Typography variant="body2">Add content to page {pageIndex + 1}</Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        ));
                    })()}

                    {/* Add new page button at the bottom */}
                    <Box
                        sx={{
                            width: `${(8.5 * 96 * zoom) / 100}px`,
                            p: 3,
                            border: `3px dashed ${colors.primary}`,
                            borderRadius: 2,
                            textAlign: 'center',
                            color: colors.primary,
                            cursor: 'pointer',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            transition: 'all 0.2s ease',
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.2)',
                                borderColor: colors.primaryLight,
                            },
                        }}
                        onClick={handleAddNewPage}
                    >
                        <NoteAdd sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            + Add New Page
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Block Insert Menu */}
            <BlockInsertMenu
                anchorEl={insertMenuAnchor}
                onClose={() => setInsertMenuAnchor(null)}
                onInsert={handleInsertBlock}
            />

            {/* Chart Selection Dialog */}
            <ChartSelectionDialog
                open={chartDialogOpen}
                onClose={() => {
                    setChartDialogOpen(false);
                    setPreselectedChartType(null); // Reset preselected chart type when dialog closes
                }}
                onSelect={handleInsertChart}
                availableCharts={availableCharts}
                comparisonData={comparisonData}
                surveyData={surveyData}
                chartBuilderQuestions={chartBuilderQuestions}
                selectedSurveyType={selectedSurveyType}
                preselectedChartType={preselectedChartType}
            />

            {/* Table Selection Dialog */}
            <TableSelectionDialog
                open={tableDialogOpen}
                onClose={() => {
                    setTableDialogOpen(false);
                    setEditingBlockId(null);
                }}
                onSelect={(tableBlock) => {
                    const newBlocks = [...document.blocks];
                    if (editingBlockId) {
                        const index = newBlocks.findIndex(b => b.id === editingBlockId);
                        if (index !== -1) {
                            // Preserve ID, update content
                            newBlocks[index] = { ...newBlocks[index], ...tableBlock, id: editingBlockId };
                        }
                    } else if (insertAfterBlockId) {
                        const index = newBlocks.findIndex(b => b.id === insertAfterBlockId);
                        newBlocks.splice(index + 1, 0, tableBlock);
                        setInsertAfterBlockId(null);
                    } else {
                        newBlocks.push(tableBlock);
                    }
                    const newDocument = { ...document, blocks: newBlocks };
                    setDocument(newDocument);
                    saveToHistory(newDocument);
                    setTableDialogOpen(false);
                    setEditingBlockId(null);
                }}
                surveyData={surveyData}
                chartBuilderQuestions={chartBuilderQuestions}
                selectedSurveyType={selectedSurveyType}
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ReportDocumentEditor;
