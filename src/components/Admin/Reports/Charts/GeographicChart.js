import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import GeographicMapModal from './GeographicMapModal';

const GeographicChart = ({ title, data, height = 300 }) => {
  const [mapOpen, setMapOpen] = useState(false);

  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 3, height: height, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#633394' }}>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const totalResponses = Object.values(data).reduce((sum, d) => sum + d.count, 0);
  const sortedCountries = Object.entries(data).sort((a, b) => b[1].count - a[1].count);

  return (
    <>
    <GeographicMapModal open={mapOpen} onClose={() => setMapOpen(false)} data={data} />
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublicIcon sx={{ color: '#633394' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#633394' }}>{title}</Typography>
        </Box>
        <Tooltip title="View on map">
          <IconButton
            size="small"
            onClick={() => setMapOpen(true)}
            sx={{
              color: '#633394',
              border: '1px solid rgba(99,51,148,0.3)',
              borderRadius: 1.5,
              px: 1,
              gap: 0.5,
              '&:hover': { bgcolor: 'rgba(99,51,148,0.08)' },
            }}
          >
            <MapIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Map</Typography>
          </IconButton>
        </Tooltip>
      </Box>
      
      <TableContainer sx={{ maxHeight: height - 120 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Country</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Responses</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Share</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Cities</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCountries.map(([country, countryData], index) => {
              const percentage = ((countryData.count / totalResponses) * 100).toFixed(1);
              
              return (
                <TableRow key={country} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {country}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={countryData.count} 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(99, 51, 148, 0.1)',
                        color: '#633394',
                        fontWeight: 600,
                        minWidth: 40
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {percentage}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {countryData.cities.slice(0, 3).map((city, cityIndex) => (
                        <Chip 
                          key={cityIndex}
                          label={city} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20,
                            borderColor: '#e0e0e0'
                          }}
                        />
                      ))}
                      {countryData.cities.length > 3 && (
                        <Chip 
                          label={`+${countryData.cities.length - 3}`}
                          size="small"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20,
                            bgcolor: '#f5f5f5',
                            color: 'text.secondary'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Summary */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>{totalResponses}</strong> responses across <strong>{Object.keys(data).length}</strong> {Object.keys(data).length === 1 ? 'country' : 'countries'}
        </Typography>
      </Box>
    </Paper>
    </>
  );
};

export default GeographicChart;
