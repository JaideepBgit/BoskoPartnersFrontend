import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Country name → approximate lat/lng centroid
const COUNTRY_COORDS = {
  'Nigeria': { lat: 9.082, lng: 8.6753 },
  'Kenya': { lat: -0.0236, lng: 37.9062 },
  'Ethiopia': { lat: 9.145, lng: 40.4897 },
  'Uganda': { lat: 1.3733, lng: 32.2903 },
  'Tanzania': { lat: -6.369, lng: 34.8888 },
  'Ghana': { lat: 7.9465, lng: -1.0232 },
  'South Africa': { lat: -30.5595, lng: 22.9375 },
  'Cameroon': { lat: 3.848, lng: 11.5021 },
  'Rwanda': { lat: -1.9403, lng: 29.8739 },
  'Sierra Leone': { lat: 8.4606, lng: -11.7799 },
  'Senegal': { lat: 14.4974, lng: -14.4524 },
  'Zambia': { lat: -13.1339, lng: 27.8493 },
  'Zimbabwe': { lat: -19.0154, lng: 29.1549 },
  'Mozambique': { lat: -18.6657, lng: 35.5296 },
  'Angola': { lat: -11.2027, lng: 17.8739 },
  'Madagascar': { lat: -18.7669, lng: 46.8691 },
  'Malawi': { lat: -13.2543, lng: 34.3015 },
  'Sudan': { lat: 12.8628, lng: 30.2176 },
  'South Sudan': { lat: 6.877, lng: 31.307 },
  'Somalia': { lat: 5.1521, lng: 46.1996 },
  'Egypt': { lat: 26.0, lng: 30.0 },
  'Morocco': { lat: 31.7917, lng: -7.0926 },
  'Algeria': { lat: 28.0339, lng: 1.6596 },
  'Tunisia': { lat: 33.8869, lng: 9.5375 },
  'Libya': { lat: 26.3351, lng: 17.2283 },
  'Congo': { lat: -0.228, lng: 15.8277 },
  'DR Congo': { lat: -4.0383, lng: 21.7587 },
  'Côte d\'Ivoire': { lat: 7.54, lng: -5.5471 },
  'Ivory Coast': { lat: 7.54, lng: -5.5471 },
  'Mali': { lat: 17.5707, lng: -3.9962 },
  'Burkina Faso': { lat: 12.3641, lng: -1.5275 },
  'Niger': { lat: 17.6078, lng: 8.0817 },
  'Chad': { lat: 15.4542, lng: 18.7322 },
  'Togo': { lat: 8.6195, lng: 0.8248 },
  'Benin': { lat: 9.3077, lng: 2.3158 },
  'Liberia': { lat: 6.4281, lng: -9.4295 },
  'Guinea': { lat: 9.9456, lng: -11.2103 },
  'Guinea-Bissau': { lat: 11.8037, lng: -15.1804 },
  'Gambia': { lat: 13.4432, lng: -15.3101 },
  'Mauritania': { lat: 21.0079, lng: -10.9408 },
  'Gabon': { lat: -0.8037, lng: 11.6094 },
  'Equatorial Guinea': { lat: 1.6508, lng: 10.2679 },
  'Central African Republic': { lat: 6.6111, lng: 20.9394 },
  'Eritrea': { lat: 15.1794, lng: 39.7823 },
  'Djibouti': { lat: 11.8251, lng: 42.5903 },
  'Burundi': { lat: -3.3731, lng: 29.9189 },
  'Lesotho': { lat: -29.61, lng: 28.2336 },
  'Botswana': { lat: -22.3285, lng: 24.6849 },
  'Namibia': { lat: -22.9576, lng: 18.4904 },
  'Eswatini': { lat: -26.5225, lng: 31.4659 },
  'United States': { lat: 37.09, lng: -95.7129 },
  'Canada': { lat: 56.1304, lng: -106.3468 },
  'United Kingdom': { lat: 55.3781, lng: -3.436 },
  'Germany': { lat: 51.1657, lng: 10.4515 },
  'France': { lat: 46.2276, lng: 2.2137 },
  'Brazil': { lat: -14.235, lng: -51.9253 },
  'India': { lat: 20.5937, lng: 78.9629 },
  'China': { lat: 35.8617, lng: 104.1954 },
  'Australia': { lat: -25.2744, lng: 133.7751 },
  'Netherlands': { lat: 52.1326, lng: 5.2913 },
  'Sweden': { lat: 60.1282, lng: 18.6435 },
  'Norway': { lat: 60.472, lng: 8.4689 },
  'Denmark': { lat: 56.2639, lng: 9.5018 },
  'Finland': { lat: 61.9241, lng: 25.7482 },
  'Switzerland': { lat: 46.8182, lng: 8.2275 },
};

const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    if (document.getElementById('gm-kpi-script')) {
      const check = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'gm-kpi-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const GeographicMapModal = ({ open, onClose, data }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  // Load Google Maps script once
  useEffect(() => {
    if (!open) return;
    loadGoogleMaps()
      .then(() => setMapReady(true))
      .catch(() => setError('Failed to load Google Maps.'));
  }, [open]);

  // Init map & place markers
  useEffect(() => {
    if (!open || !mapReady || !mapRef.current || !data) return;

    // Cleanup previous markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    const entries = Object.entries(data).filter(([country]) => COUNTRY_COORDS[country]);
    if (entries.length === 0) return;

    const totalResponses = entries.reduce((s, [, d]) => s + d.count, 0);

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 2,
      center: { lat: 5, lng: 20 },
      mapTypeId: 'roadmap',
      mapId: 'GEO_KPI_MAP',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    mapInstanceRef.current = map;

    const infoWindow = new window.google.maps.InfoWindow();

    entries.forEach(([country, countryData]) => {
      const coords = COUNTRY_COORDS[country];
      const pct = ((countryData.count / totalResponses) * 100).toFixed(1);
      const pin = document.createElement('div');
      pin.style.cssText = `
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(99,51,148,0.85);
        border: 2.5px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
      `;
      pin.textContent = countryData.count;

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: coords,
        map,
        title: country,
        content: pin,
      });

      marker.addListener('click', () => {
        const cities = countryData.cities?.join(', ') || '—';
        infoWindow.setContent(`
          <div style="font-family:sans-serif;min-width:140px">
            <div style="font-weight:700;font-size:14px;color:#633394;margin-bottom:4px">${country}</div>
            <div style="font-size:12px;color:#555"><b>${countryData.count}</b> response${countryData.count !== 1 ? 's' : ''} (${pct}%)</div>
            ${cities ? `<div style="font-size:11px;color:#888;margin-top:4px">${cities}</div>` : ''}
          </div>
        `);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];
    };
  }, [open, mapReady, data]);

  const totalResponses = data
    ? Object.values(data).reduce((s, d) => s + d.count, 0)
    : 0;
  const countryCount = data ? Object.keys(data).length : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#633394' }}>
            Geographic Distribution — Map View
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalResponses} response{totalResponses !== 1 ? 's' : ''} across {countryCount} {countryCount === 1 ? 'country' : 'countries'} · Click a marker for details
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: 520 }}>
        {error ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : !mapReady ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <CircularProgress size={24} sx={{ color: '#633394' }} />
            <Typography color="text.secondary">Loading map…</Typography>
          </Box>
        ) : (
          <Box ref={mapRef} sx={{ width: '100%', height: '100%' }} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeographicMapModal;
