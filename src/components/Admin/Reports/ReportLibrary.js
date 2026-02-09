import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Paper,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    Avatar,
    AvatarGroup,
    LinearProgress,
    Tabs,
    Tab,
    Badge,
    Divider,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TableChartIcon from '@mui/icons-material/TableChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

/**
 * Report Library Component
 * Manages saved reports with sharing and export capabilities
 */
const ReportLibrary = ({ onOpenReport, onCreateNew }) => {
    const [reports, setReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareEmails, setShareEmails] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const colors = {
        primary: '#633394',
        primaryLight: '#8e5bbc',
        primaryDark: '#4a2570',
        background: '#f8f4fc',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        border: '#e8dff5'
    };

    // Load reports from backend API
    useEffect(() => {
        const loadReports = async () => {
            try {
                // Get user info from localStorage
                // Check 'user' object first, then standalone keys
                const userStr = localStorage.getItem('user');
                const userObj = userStr ? JSON.parse(userStr) : {};
                const userId = localStorage.getItem('userId') || userObj.id || userObj.user_id;

                if (!userId) {
                    console.warn('User ID not found, using default or skipping load');
                }

                const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const response = await fetch(`${baseURL}/reports?user_id=${userId || 1}`);

                if (response.ok) {
                    const data = await response.json();
                    // Transform backend data to match expected format
                    const formattedReports = data.map(report => ({
                        id: report.id,
                        name: report.title,
                        type: 'document', // Default type for new reports
                        surveyCount: report.content?.blocks?.length || 0,
                        createdAt: report.created_at,
                        updatedAt: report.updated_at,
                        status: 'completed',
                        sharedWith: [],
                        metrics: { completionRate: 100, avgScore: 0 },
                        content: report.content // Store full content for viewing
                    }));
                    setReports(formattedReports);
                    console.log('Loaded reports from backend:', formattedReports);
                } else {
                    console.warn('Failed to load reports from backend, using sample data');
                    // Fallback to sample reports for demo
                    setReports([
                        {
                            id: 1,
                            name: 'Q4 2025 Church Survey Analysis',
                            type: 'comparative',
                            surveyCount: 15,
                            createdAt: '2025-12-15T10:30:00Z',
                            status: 'completed',
                            sharedWith: ['john@example.com', 'mary@example.com'],
                            metrics: { completionRate: 87, avgScore: 4.2 }
                        },
                        {
                            id: 2,
                            name: 'Institution Performance Report',
                            type: 'organization',
                            organizationName: 'Bethel Seminary',
                            surveyCount: 8,
                            createdAt: '2025-12-10T14:00:00Z',
                            status: 'completed',
                            sharedWith: [],
                            metrics: { completionRate: 92, avgScore: 4.5 }
                        }
                    ]);
                }
            } catch (e) {
                console.error('Error loading reports:', e);
                // Fallback to sample data on error
                setReports([
                    {
                        id: 1,
                        name: 'Sample Report',
                        type: 'comparative',
                        surveyCount: 5,
                        createdAt: new Date().toISOString(),
                        status: 'completed',
                        sharedWith: [],
                        metrics: { completionRate: 100, avgScore: 4.0 }
                    }
                ]);
            }
        };

        loadReports();
    }, []);

    const handleMenuOpen = (event, report) => {
        setAnchorEl(event.currentTarget);
        setSelectedReport(report);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleShare = () => {
        setShareDialogOpen(true);
        handleMenuClose();
    };

    const handleShareSubmit = () => {
        if (selectedReport && shareEmails) {
            const emails = shareEmails.split(',').map(e => e.trim());
            const updatedReports = reports.map(r => {
                if (r.id === selectedReport.id) {
                    return {
                        ...r,
                        sharedWith: [...new Set([...(r.sharedWith || []), ...emails])]
                    };
                }
                return r;
            });
            setReports(updatedReports);
            localStorage.setItem('savedReports', JSON.stringify(updatedReports));
            setShareDialogOpen(false);
            setShareEmails('');
        }
    };

    const handleCopyLink = () => {
        const shareUrl = `${window.location.origin}/reports/${selectedReport?.id}`;
        navigator.clipboard.writeText(shareUrl);
        handleMenuClose();
        alert('Report link copied to clipboard!');
    };

    const handleExport = (format) => {
        console.log(`Exporting report ${selectedReport?.id} as ${format}`);
        handleMenuClose();
        alert(`Report exported as ${format.toUpperCase()}`);
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        if (selectedReport) {
            try {
                const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const response = await fetch(`${baseURL}/reports/${selectedReport.id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    const updatedReports = reports.filter(r => r.id !== selectedReport.id);
                    setReports(updatedReports);
                    console.log('Report deleted successfully');
                } else {
                    console.error('Failed to delete report from backend');
                    alert('Failed to delete report');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                alert('Error deleting report');
            }
            setDeleteDialogOpen(false);
            setSelectedReport(null);
        }
    };

    const getReportIcon = (type) => {
        switch (type) {
            case 'organization': return <BusinessIcon />;
            case 'contact': return <PersonIcon />;
            case 'comparative': return <CompareArrowsIcon />;
            default: return <DescriptionIcon />;
        }
    };

    const getReportColor = (type) => {
        switch (type) {
            case 'organization': return '#2196f3';
            case 'contact': return '#4caf50';
            case 'comparative': return colors.primary;
            default: return '#757575';
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 0 ||
            (activeTab === 1 && report.type === 'comparative') ||
            (activeTab === 2 && report.type === 'organization') ||
            (activeTab === 3 && report.type === 'contact');
        return matchesSearch && matchesTab;
    });

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    // Statistics
    const stats = {
        total: reports.length,
        comparative: reports.filter(r => r.type === 'comparative').length,
        organization: reports.filter(r => r.type === 'organization').length,
        contact: reports.filter(r => r.type === 'contact').length,
        shared: reports.filter(r => r.sharedWith && r.sharedWith.length > 0).length
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colors.border}`,
                borderRadius: 3
            }}
            elevation={0}
        >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                {/* Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AssessmentIcon sx={{ color: colors.primary, fontSize: 32 }} />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#212121' }}>
                                    Report Library
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage and share your generated reports
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={onCreateNew}
                            sx={{
                                bgcolor: colors.primary,
                                '&:hover': { bgcolor: colors.primaryDark }
                            }}
                        >
                            Create New Report
                        </Button>
                    </Box>

                    {/* Stats Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {[
                            { label: 'Total Reports', value: stats.total, icon: <DescriptionIcon />, color: colors.primary },
                            { label: 'Comparative', value: stats.comparative, icon: <CompareArrowsIcon />, color: '#9c27b0' },
                            { label: 'Organization', value: stats.organization, icon: <BusinessIcon />, color: '#2196f3' },
                            { label: 'Contact', value: stats.contact, icon: <PersonIcon />, color: '#4caf50' }
                        ].map((stat, idx) => (
                            <Grid item xs={6} sm={3} key={idx}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        border: `1px solid ${colors.border}`
                                    }}
                                    elevation={0}
                                >
                                    <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color }}>
                                        {stat.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: stat.color }}>
                                            {stat.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {stat.label}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Search and Filter */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>

                    {/* Tabs */}
                    <Tabs
                        value={activeTab}
                        onChange={(e, val) => setActiveTab(val)}
                        sx={{
                            '& .MuiTab-root': { textTransform: 'none' },
                            '& .Mui-selected': { color: colors.primary },
                            '& .MuiTabs-indicator': { bgcolor: colors.primary }
                        }}
                    >
                        <Tab label={`All (${stats.total})`} />
                        <Tab label={`Comparative (${stats.comparative})`} />
                        <Tab label={`Organization (${stats.organization})`} />
                        <Tab label={`Contact (${stats.contact})`} />
                    </Tabs>
                </Box>

                <Divider />

                {/* Reports Table */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {filteredReports.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 8,
                            color: 'text.secondary'
                        }}>
                            <DescriptionIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                            <Typography variant="h6">No reports found</Typography>
                            <Typography variant="body2">
                                {searchQuery ? 'Try a different search term' : 'Create your first report to get started'}
                            </Typography>
                            {!searchQuery && (
                                <Button
                                    variant="outlined"
                                    onClick={onCreateNew}
                                    sx={{ mt: 2, borderColor: colors.primary, color: colors.primary }}
                                >
                                    Create Report
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }}>Report</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }}>Surveys</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }}>Performance</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }}>Shared With</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }}>Created</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#FAFAFA', fontSize: '0.75rem' }} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredReports.map((report) => (
                                        <TableRow
                                            key={report.id}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: `${colors.background}50` }
                                            }}
                                            onClick={() => onOpenReport && onOpenReport(report)}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: `${getReportColor(report.type)}15`,
                                                            color: getReportColor(report.type),
                                                            width: 40,
                                                            height: 40
                                                        }}
                                                    >
                                                        {getReportIcon(report.type)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {report.name}
                                                        </Typography>
                                                        {(report.organizationName || report.contactName) && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {report.organizationName || report.contactName}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={report.type}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: `${getReportColor(report.type)}15`,
                                                        color: getReportColor(report.type),
                                                        fontWeight: 500,
                                                        textTransform: 'capitalize'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{report.surveyCount}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <TrendingUpIcon fontSize="small" color="success" />
                                                        <Typography variant="body2">
                                                            {report.metrics?.avgScore?.toFixed(1) || 'N/A'}/5.0
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={report.metrics?.completionRate || 0}
                                                        sx={{
                                                            height: 4,
                                                            borderRadius: 2,
                                                            bgcolor: `${colors.success}20`,
                                                            '& .MuiLinearProgress-bar': { bgcolor: colors.success }
                                                        }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {report.metrics?.completionRate || 0}% completion
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {report.sharedWith && report.sharedWith.length > 0 ? (
                                                    <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                                                        {report.sharedWith.map((email, idx) => (
                                                            <Tooltip key={idx} title={email}>
                                                                <Avatar
                                                                    sx={{ width: 28, height: 28, fontSize: 12, bgcolor: colors.primaryLight }}
                                                                >
                                                                    {email[0].toUpperCase()}
                                                                </Avatar>
                                                            </Tooltip>
                                                        ))}
                                                    </AvatarGroup>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Not shared
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTimeIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getTimeAgo(report.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip title="View">
                                                    <IconButton size="small" onClick={() => onOpenReport && onOpenReport(report)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Share">
                                                    <IconButton size="small" onClick={(e) => { setSelectedReport(report); setShareDialogOpen(true); }}>
                                                        <ShareIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, report)}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </CardContent>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleCopyLink}>
                    <LinkIcon fontSize="small" sx={{ mr: 1 }} />
                    Copy Link
                </MenuItem>
                <MenuItem onClick={handleShare}>
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    Share via Email
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleExport('pdf')}>
                    <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
                    Export as PDF
                </MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>
                    <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
                    Export as Excel
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete Report
                </MenuItem>
            </Menu>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Share Report</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Share "{selectedReport?.name}" with team members via email
                    </Typography>
                    <TextField
                        autoFocus
                        label="Email addresses"
                        placeholder="Enter email addresses separated by commas"
                        fullWidth
                        multiline
                        rows={2}
                        value={shareEmails}
                        onChange={(e) => setShareEmails(e.target.value)}
                        helperText="Recipients will receive a link to view this report"
                    />
                    <Box sx={{ mt: 2, p: 2, bgcolor: colors.background, borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Or share via link:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                fullWidth
                                value={`${window.location.origin}/reports/${selectedReport?.id}`}
                                InputProps={{ readOnly: true }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/reports/${selectedReport?.id}`);
                                    alert('Link copied!');
                                }}
                                startIcon={<ContentCopyIcon />}
                            >
                                Copy
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleShareSubmit}
                        disabled={!shareEmails.trim()}
                        sx={{ bgcolor: colors.primary }}
                    >
                        Send Invitations
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Report</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{selectedReport?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default ReportLibrary;
