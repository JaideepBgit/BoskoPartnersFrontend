import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, InputAdornment,
  Menu, ListItemIcon, ListItemText, TableSortLabel, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Navbar from '../../shared/Navbar/Navbar';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';

const statusColors = {
  open: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  draft: { bg: '#f5f5f5', color: '#757575', border: '#e0e0e0' },
  closed: { bg: '#ffebee', color: '#c62828', border: '#ef9a9a' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB');
};

const SurveysListPage = () => {
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssociation, setFilterAssociation] = useState('');
  const [filterOrganization, setFilterOrganization] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sorting
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // Add Survey Menu
  const [addSurveyAnchorEl, setAddSurveyAnchorEl] = useState(null);

  // User role
  const [userRole, setUserRole] = useState(null);
  const [userOrgId, setUserOrgId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(role);
      setUserOrgId(user.organization_id);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await SurveysV2Service.getSurveys().catch(() => []);
      setSurveys(data);
    } catch (err) {
      console.error('Error loading surveys data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build enriched survey rows
  const surveyRows = useMemo(() => {
    return surveys.map(t => ({
      id: t.id,
      name: t.name || `Survey #${t.id}`,
      status: t.status || 'draft',
      startDate: t.created_at,
      endDate: null,
      responses: 0,
      invitations: 0,
      organization: t.organization_name || (t.organization_names || []).join(', ') || '-',
      organizationId: (t.organization_ids || [])[0] || null,
      association: '-',
      createdAt: t.created_at,
      description: t.description || '',
    }));
  }, [surveys]);

  // Filter + search
  const filteredRows = useMemo(() => {
    return surveyRows.filter(row => {
      if (userRole === 'manager' && row.organizationId !== userOrgId) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = row.name.toLowerCase().includes(term) ||
          row.organization.toLowerCase().includes(term) ||
          row.association.toLowerCase().includes(term) ||
          row.surveyCode.toLowerCase().includes(term);
        if (!match) return false;
      }
      if (filterOrganization && row.organization !== filterOrganization) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterAssociation && row.association !== filterAssociation) return false;
      return true;
    });
  }, [surveyRows, searchTerm, filterAssociation, filterOrganization, filterStatus, userRole, userOrgId]);

  // Sort
  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let aVal = a[orderBy] || '';
      let bVal = b[orderBy] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRows, orderBy, order]);

  // Unique values for filter dropdowns
  const uniqueOrgs = useMemo(() => [...new Set(surveyRows.map(r => r.organization).filter(o => o !== '-'))], [surveyRows]);
  const uniqueAssociations = useMemo(() => [...new Set(surveyRows.map(r => r.association).filter(a => a !== '-'))], [surveyRows]);

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrder('asc');
    }
  };

  const getStatusChip = (status) => {
    const s = status?.toLowerCase() || 'draft';
    const colors = statusColors[s] || statusColors.draft;
    return (
      <Chip
        label={s.charAt(0).toUpperCase() + s.slice(1)}
        size="small"
        sx={{
          backgroundColor: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          fontWeight: 500,
          fontSize: '0.75rem',
        }}
      />
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: '#633394' }} />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ color: '#212121', fontWeight: 'bold' }}>
            Surveys ({filteredRows.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/surveys-v2/groups')}
              sx={{
                color: '#633394',
                borderColor: '#633394',
                backgroundColor: 'rgba(99, 51, 148, 0.04)',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.08)' }
              }}
            >
              Add Survey Group
            </Button>
            <Button
              variant="contained"
              onClick={(e) => setAddSurveyAnchorEl(e.currentTarget)}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                backgroundColor: '#633394',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': { backgroundColor: '#967CB2' }
              }}
            >
              Add Survey
            </Button>
            <Menu
              anchorEl={addSurveyAnchorEl}
              open={Boolean(addSurveyAnchorEl)}
              onClose={() => setAddSurveyAnchorEl(null)}
              PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 200, borderRadius: 2 } }}
            >
              <MenuItem onClick={() => { setAddSurveyAnchorEl(null); navigate('/inventory/blank-survey'); }} sx={{ py: 1.5 }}>
                <ListItemIcon><NoteAddIcon fontSize="small" sx={{ color: '#633394' }} /></ListItemIcon>
                <ListItemText>Blank Survey</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setAddSurveyAnchorEl(null); navigate('/inventory/use-template'); }} sx={{ py: 1.5 }}>
                <ListItemIcon><ContentCopyIcon fontSize="small" sx={{ color: '#633394' }} /></ListItemIcon>
                <ListItemText>Use Template</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setAddSurveyAnchorEl(null); navigate('/inventory/upload-document'); }} sx={{ py: 1.5 }}>
                <ListItemIcon><UploadFileIcon fontSize="small" sx={{ color: '#633394' }} /></ListItemIcon>
                <ListItemText>Upload Document</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Search & Filters */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by survey name, organization, or association"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              flex: 1, minWidth: 280, maxWidth: 420,
              '& .MuiOutlinedInput-root': { backgroundColor: 'white', borderRadius: 2 }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Association</InputLabel>
            <Select
              value={filterAssociation}
              label="Association"
              onChange={(e) => setFilterAssociation(e.target.value)}
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueAssociations.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Organization</InputLabel>
            <Select
              value={filterOrganization}
              label="Organization"
              onChange={(e) => setFilterOrganization(e.target.value)}
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueOrgs.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Surveys Table */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleSort('name')}>
                      Survey
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <TableSortLabel active={orderBy === 'startDate'} direction={orderBy === 'startDate' ? order : 'asc'} onClick={() => handleSort('startDate')}>
                      Start Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Responses
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <TableSortLabel active={orderBy === 'organization'} direction={orderBy === 'organization' ? order : 'asc'} onClick={() => handleSort('organization')}>
                      Organization
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Association
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <TableSortLabel active={orderBy === 'createdAt'} direction={orderBy === 'createdAt' ? order : 'asc'} onClick={() => handleSort('createdAt')}>
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#999' }}>
                      <Typography variant="body1">No surveys found</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>Try adjusting your search or filters</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => navigate(`/surveys-v2/${row.id}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.04)' },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#212121' }}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            {row.surveyGroup}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getStatusChip(row.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(row.startDate)}</Typography>
                        {row.endDate && (
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            Ends: {formatDate(row.endDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.responses}</Typography>
                        <Typography variant="caption" sx={{ color: '#999' }}>
                          {row.invitations} Invitations
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.organization}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.association}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(row.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <ChevronRightIcon sx={{ color: '#bbb' }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </>
  );
};

export default SurveysListPage;
