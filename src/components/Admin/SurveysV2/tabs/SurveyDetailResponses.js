import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Chip
} from '@mui/material';
import SurveysV2Service from '../../../../services/Admin/SurveysV2Service';

const statusConfig = {
  draft:     { label: 'Draft',       bg: '#e3f2fd', color: '#1565c0' },
  in_progress: { label: 'In Progress', bg: '#fff3e0', color: '#e65100' },
  submitted: { label: 'Submitted',   bg: '#e8f5e9', color: '#2e7d32' },
  completed: { label: 'Completed',   bg: '#e8f5e9', color: '#2e7d32' },
  pending:   { label: 'Pending',     bg: '#f3e8ff', color: '#633394' },
};

const getStatus = (status) => statusConfig[status] || statusConfig.draft;

const SurveyDetailResponses = ({ surveyId }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResponses = async () => {
      setLoading(true);
      try {
        const data = await SurveysV2Service.getResponses(surveyId);
        setResponses(data);
      } catch (err) {
        console.error('Error loading responses:', err);
      } finally {
        setLoading(false);
      }
    };
    loadResponses();
  }, [surveyId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: '#633394' }} />
      </Box>
    );
  }

  if (responses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body1" sx={{ color: '#999' }}>No responses yet</Typography>
        <Typography variant="body2" sx={{ color: '#bbb', mt: 1 }}>
          Responses will appear here once users complete the survey.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Respondent</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Started</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {responses.map((r) => {
            const s = getStatus(r.status);
            return (
              <TableRow key={r.id} hover>
                <TableCell>{r.user_name || r.user_email || `User #${r.user_id}`}</TableCell>
                <TableCell>{r.organization_name || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={s.label}
                    size="small"
                    sx={{ backgroundColor: s.bg, color: s.color }}
                  />
                </TableCell>
                <TableCell>
                  {r.start_date ? new Date(r.start_date).toLocaleDateString('en-GB') : '-'}
                </TableCell>
                <TableCell>
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleDateString('en-GB')
                    : r.end_date
                      ? new Date(r.end_date).toLocaleDateString('en-GB')
                      : '-'}
                </TableCell>
                <TableCell>{r.progress != null ? `${r.progress}%` : '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SurveyDetailResponses;
