import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, TextField, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, CircularProgress, IconButton, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../../shared/Navbar/Navbar';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

const SurveyGroupsPage = () => {
  const navigate = useNavigate();

  const [surveyGroups, setSurveyGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [versions, tmpls] = await Promise.all([
        InventoryService.getTemplateVersions().catch(() => []),
        InventoryService.getTemplates().catch(() => []),
      ]);
      setSurveyGroups(versions);
      setTemplates(tmpls);
    } catch (err) {
      console.error('Error loading survey groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enrich groups with survey counts
  const enrichedGroups = useMemo(() => {
    return surveyGroups.map(g => ({
      ...g,
      surveyCount: templates.filter(t => t.version_id === g.id).length,
    }));
  }, [surveyGroups, templates]);

  const filtered = useMemo(() => {
    if (!searchTerm) return enrichedGroups;
    const term = searchTerm.toLowerCase();
    return enrichedGroups.filter(g =>
      g.name.toLowerCase().includes(term) ||
      (g.description && g.description.toLowerCase().includes(term)) ||
      (g.organization_name && g.organization_name.toLowerCase().includes(term))
    );
  }, [enrichedGroups, searchTerm]);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/surveys-v2')}
              sx={{ color: '#633394', borderColor: '#e0e0e0', textTransform: 'none' }}
            >
              Surveys
            </Button>
            <Typography variant="h4" sx={{ color: '#212121', fontWeight: 'bold' }}>
              Survey Groups ({filtered.length})
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/surveys-v2/groups/create')}
            sx={{
              backgroundColor: '#633394',
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              '&:hover': { backgroundColor: '#967CB2' }
            }}
          >
            Create Survey Group
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search by group name, description, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              minWidth: 350,
              '& .MuiOutlinedInput-root': { backgroundColor: 'white', borderRadius: 2 }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
        </Box>

        {/* Survey Groups Table */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>Group Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>Organization</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', fontSize: '0.75rem' }}>Surveys</TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#999' }}>
                      <Typography variant="body1">No survey groups found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(g => (
                    <TableRow
                      key={g.id}
                      hover
                      onClick={() => navigate(`/surveys-v2/groups/${g.id}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.04)' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{g.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {g.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{g.organization_name || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={g.surveyCount} size="small" sx={{ backgroundColor: '#f3e5f5', color: '#633394', fontWeight: 600 }} />
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

export default SurveyGroupsPage;
