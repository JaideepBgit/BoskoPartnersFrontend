import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  LinearProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Navbar from '../shared/Navbar/Navbar';
import KpiStatCard from './KpiStatCard';
import KpiDashboardService from '../../services/Admin/KpiDashboardService';
import InteractiveBarChart from '../Admin/Reports/Charts/InteractiveBarChart';
import GeographicChart from '../Admin/Reports/Charts/GeographicChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';

const adminColors = { primary: '#633394', secondary: '#967CB2' };

const KpiDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');

  const userRole = localStorage.getItem('userRole') || 'admin';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const organizationId = user.organization_id || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await KpiDashboardService.getKpiData(userRole, organizationId);
        setData(result);
      } catch (err) {
        console.error('Error fetching KPI data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userRole, organizationId]);

  const filteredOrgs = useMemo(() => {
    if (!data?.organization_breakdown) return [];
    return data.organization_breakdown.filter((org) => {
      const matchesSearch = org.name.toLowerCase().includes(orgSearch.toLowerCase());
      if (orgFilter === 'active') return matchesSearch && org.total_responses > 0;
      if (orgFilter === 'inactive') return matchesSearch && org.total_responses === 0;
      return matchesSearch;
    });
  }, [data, orgSearch, orgFilter]);

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#633394' }} />
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>Loading dashboard...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  if (!data) return null;

  // Transform data for charts
  const participationData = {
    'Invited': data.participation.total_invited,
    'Accepted': data.participation.total_accepted,
    'Responded': data.participation.total_responded,
  };

  const ct = data.completion_trend || {};
  const trendData = [
    { status: 'Completed', count: ct.completed || 0 },
    { status: 'In Progress', count: ct.in_progress || 0 },
    { status: 'Pending', count: ct.pending || 0 },
  ];

  const showOrgBreakdown = userRole === 'admin' || userRole === 'root' || userRole === 'association';

  return (
    <Box>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
            Dashboard
          </Typography>
        </Box>

        {/* KPI Summary Cards — compact, right-aligned */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {[
            { icon: <AssessmentIcon />, label: 'Total Surveys', value: data.survey_lifecycle.total_surveys, subtitle: `${data.survey_lifecycle.surveys_open} open` },
            { icon: <PeopleIcon />, label: 'Participants Invited', value: data.participation.total_invited, subtitle: `${data.participation.acceptance_rate}% accepted` },
            { icon: <CheckCircleIcon />, label: 'Responses Submitted', value: data.completion.total_submitted, subtitle: `of ${data.completion.total_responses} total` },
            { icon: <TrendingUpIcon />, label: 'Completion Rate', value: `${data.completion.completion_rate}%`, subtitle: `Avg ${data.survey_lifecycle.avg_days_to_completion} days` },
          ].map((card) => (
            <KpiStatCard key={card.label} {...card} />
          ))}
        </Box>

        {/* Charts Row 1: Survey Lifecycle Metrics + Participation */}
        <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
          <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#633394' }}>
                  Survey Lifecycle Metrics
                </Typography>
                {(userRole === 'admin' || userRole === 'root') && (
                  <Tooltip title="Management Console">
                    <IconButton
                      onClick={() => navigate('/dashboard/management')}
                      sx={{
                        backgroundColor: '#633394',
                        color: 'white',
                        '&:hover': { backgroundColor: '#7c52a5' },
                      }}
                    >
                      <AdminPanelSettingsIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Total surveys sent', value: (ct.completed || 0) + (ct.in_progress || 0) + (ct.pending || 0) },
                  { label: 'Surveys in progress', value: ct.in_progress || 0 },
                  { label: 'Surveys completed', value: ct.completed || 0 },
                  { label: 'Avg time to completion', value: `${data.survey_lifecycle.avg_days_to_completion} days` },
                ].map(({ label, value }) => (
                  <Grid item xs={6} key={label}>
                    <Box sx={{ p: 1.5, bgcolor: '#f7f4fb', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                        {label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#633394', lineHeight: 1.1 }}>
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <InteractiveBarChart
                title="Participation Overview"
                data={participationData}
                height={280}
                adminColors={adminColors}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Charts Row 2: Completion Status + Geographic */}
        <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
          <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#633394', mb: 2 }}>
                Completion Status
              </Typography>
              <Box sx={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: '#333' }} width={80} />
                    <RechartsTooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Responses">
                      {trendData.map((entry, index) => (
                        <Cell key={index} fill={['#633394', '#967CB2', '#c4b0d9'][index % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <GeographicChart
                title="Geographic Distribution"
                data={data.geographic.countries}
                height={280}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Organization Breakdown Table */}
        {showOrgBreakdown && data.organization_breakdown && data.organization_breakdown.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: adminColors.primary }}>
                Organization Breakdown
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search organizations..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 220 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={orgFilter}
                    label="Filter"
                    onChange={(e) => setOrgFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active (responses &gt; 0)</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Organization</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Users</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Responses</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Submitted</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Completion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No organizations match your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrgs.map((org, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{org.name}</TableCell>
                        <TableCell align="center">{org.total_users}</TableCell>
                        <TableCell align="center">{org.total_responses}</TableCell>
                        <TableCell align="center">{org.submitted}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={org.completion_rate}
                              sx={{
                                width: 80,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  bgcolor: '#633394',
                                },
                              }}
                            />
                            <Typography variant="body2" sx={{ minWidth: 40 }}>
                              {org.completion_rate}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default KpiDashboard;
