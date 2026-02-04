import React, { useState } from 'react';
import { TextField, Box, Button, FormControl, InputLabel, Select, MenuItem, Grid, Paper, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ManualAddressInput = ({
    onPlaceSelect,
    label = "Address Information",  
    fullWidth = true,
    disabled = false
}) => {
    const [formData, setFormData] = useState({
        continent: '',
        country: '',
        province: '',
        region: '',
        city: '',
        town: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        latitude: '',
        longitude: ''
    });

    const [searchText, setSearchText] = useState('');

    const continents = [
        'Africa',
        'Antarctica',
        'Asia',
        'Europe',
        'North America',
        'Oceania',
        'South America'
    ];

    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        const updatedData = {
            ...formData,
            [field]: value
        };
        setFormData(updatedData);

        // Auto-update continent based on country
        if (field === 'country') {
            const continent = getContinent(value);
            if (continent) {
                updatedData.continent = continent;
                setFormData(updatedData);
            }
        }

        // Trigger callback with updated data
        if (onPlaceSelect) {
            onPlaceSelect({
                formattedAddress: generateFormattedAddress(updatedData),
                geoLocationData: updatedData,
                placeDetails: null
            });
        }
    };

    const getContinent = (country) => {
        const countryToContinent = {
            // North America
            'United States': 'North America',
            'USA': 'North America',
            'Canada': 'North America',
            'Mexico': 'North America',
            'Guatemala': 'North America',
            'Belize': 'North America',
            'Costa Rica': 'North America',
            'El Salvador': 'North America',
            'Honduras': 'North America',
            'Nicaragua': 'North America',
            'Panama': 'North America',

            // Europe
            'United Kingdom': 'Europe',
            'UK': 'Europe',
            'England': 'Europe',
            'Scotland': 'Europe',
            'Wales': 'Europe',
            'Ireland': 'Europe',
            'Germany': 'Europe',
            'France': 'Europe',
            'Spain': 'Europe',
            'Italy': 'Europe',
            'Netherlands': 'Europe',
            'Belgium': 'Europe',
            'Portugal': 'Europe',
            'Greece': 'Europe',
            'Poland': 'Europe',
            'Sweden': 'Europe',
            'Norway': 'Europe',
            'Denmark': 'Europe',
            'Finland': 'Europe',
            'Switzerland': 'Europe',
            'Austria': 'Europe',
            'Czech Republic': 'Europe',
            'Hungary': 'Europe',
            'Romania': 'Europe',
            'Bulgaria': 'Europe',
            'Croatia': 'Europe',
            'Serbia': 'Europe',
            'Ukraine': 'Europe',
            'Russia': 'Europe',

            // Asia
            'China': 'Asia',
            'Japan': 'Asia',
            'India': 'Asia',
            'South Korea': 'Asia',
            'Singapore': 'Asia',
            'Thailand': 'Asia',
            'Philippines': 'Asia',
            'Indonesia': 'Asia',
            'Malaysia': 'Asia',
            'Vietnam': 'Asia',
            'Bangladesh': 'Asia',
            'Pakistan': 'Asia',
            'Sri Lanka': 'Asia',
            'Myanmar': 'Asia',
            'Cambodia': 'Asia',
            'Laos': 'Asia',
            'Mongolia': 'Asia',
            'Kazakhstan': 'Asia',
            'Uzbekistan': 'Asia',
            'Afghanistan': 'Asia',
            'Iran': 'Asia',
            'Iraq': 'Asia',
            'Saudi Arabia': 'Asia',
            'United Arab Emirates': 'Asia',
            'UAE': 'Asia',
            'Kuwait': 'Asia',
            'Qatar': 'Asia',
            'Bahrain': 'Asia',
            'Oman': 'Asia',
            'Yemen': 'Asia',
            'Jordan': 'Asia',
            'Lebanon': 'Asia',
            'Syria': 'Asia',
            'Turkey': 'Asia',
            'Israel': 'Asia',
            'Palestine': 'Asia',

            // Oceania
            'Australia': 'Oceania',
            'New Zealand': 'Oceania',
            'Fiji': 'Oceania',
            'Papua New Guinea': 'Oceania',
            'Solomon Islands': 'Oceania',
            'Vanuatu': 'Oceania',
            'Samoa': 'Oceania',
            'Tonga': 'Oceania',

            // South America
            'Brazil': 'South America',
            'Argentina': 'South America',
            'Chile': 'South America',
            'Colombia': 'South America',
            'Peru': 'South America',
            'Venezuela': 'South America',
            'Ecuador': 'South America',
            'Bolivia': 'South America',
            'Paraguay': 'South America',
            'Uruguay': 'South America',
            'Guyana': 'South America',
            'Suriname': 'South America',
            'French Guiana': 'South America',

            // Africa
            'South Africa': 'Africa',
            'Nigeria': 'Africa',
            'Kenya': 'Africa',
            'Egypt': 'Africa',
            'Morocco': 'Africa',
            'Ghana': 'Africa',
            'Ethiopia': 'Africa',
            'Tanzania': 'Africa',
            'Uganda': 'Africa',
            'Algeria': 'Africa',
            'Sudan': 'Africa',
            'Libya': 'Africa',
            'Tunisia': 'Africa',
            'Zimbabwe': 'Africa',
            'Zambia': 'Africa',
            'Botswana': 'Africa',
            'Namibia': 'Africa',
            'Mozambique': 'Africa',
            'Madagascar': 'Africa',
            'Cameroon': 'Africa',
            'Ivory Coast': 'Africa',
            'Senegal': 'Africa',
            'Mali': 'Africa',
            'Burkina Faso': 'Africa',
            'Niger': 'Africa',
            'Chad': 'Africa',
            'Central African Republic': 'Africa',
            'Democratic Republic of the Congo': 'Africa',
            'Republic of the Congo': 'Africa',
            'Gabon': 'Africa',
            'Equatorial Guinea': 'Africa',
            'Rwanda': 'Africa',
            'Burundi': 'Africa'
        };

        // Try exact match first
        if (countryToContinent[country]) {
            return countryToContinent[country];
        }

        // Try partial match (case insensitive)
        const lowerCountry = country.toLowerCase();
        for (const [key, value] of Object.entries(countryToContinent)) {
            if (key.toLowerCase().includes(lowerCountry) || lowerCountry.includes(key.toLowerCase())) {
                return value;
            }
        }

        return '';
    };

    const generateFormattedAddress = (data) => {
        const parts = [
            data.address_line1,
            data.address_line2,
            data.city,
            data.province,
            data.country,
            data.postal_code
        ].filter(part => part && part.trim() !== '');

        return parts.join(', ');
    };

    const handleClear = () => {
        const emptyData = {
            continent: '',
            country: '',
            province: '',
            region: '',
            city: '',
            town: '',
            address_line1: '',
            address_line2: '',
            postal_code: '',
            latitude: '',
            longitude: ''
        };
        setFormData(emptyData);
        setSearchText('');

        if (onPlaceSelect) {
            onPlaceSelect({
                formattedAddress: '',
                geoLocationData: emptyData,
                placeDetails: null
            });
        }
    };

    const handleQuickSearch = () => {
        if (searchText.trim()) {
            // Parse simple search text
            const parts = searchText.split(',').map(p => p.trim());
            const updatedData = { ...formData };

            if (parts.length >= 1) updatedData.address_line1 = parts[0];
            if (parts.length >= 2) updatedData.city = parts[1];
            if (parts.length >= 3) updatedData.province = parts[2];
            if (parts.length >= 4) updatedData.country = parts[3];

            // Auto-detect continent
            if (updatedData.country) {
                const continent = getContinent(updatedData.country);
                if (continent) {
                    updatedData.continent = continent;
                }
            }

            setFormData(updatedData);
            setSearchText('');

            if (onPlaceSelect) {
                onPlaceSelect({
                    formattedAddress: generateFormattedAddress(updatedData),
                    geoLocationData: updatedData,
                    placeDetails: null
                });
            }
        }
    };

    return (
        <Box>
            {/* Quick Search */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                    fullWidth
                    label="Quick Address Search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="e.g., 123 Main St, New York, NY, USA"
                    helperText="Enter address separated by commas"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleQuickSearch();
                        }
                    }}
                />
                <Button
                    variant="outlined"
                    onClick={handleQuickSearch}
                    disabled={!searchText.trim()}
                    sx={{
                        minWidth: '100px',
                        height: '56px',
                        color: '#633394',
                        borderColor: '#633394'
                    }}
                >
                    Parse
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleClear}
                    sx={{
                        minWidth: '80px',
                        height: '56px',
                        color: '#633394',
                        borderColor: '#633394'
                    }}
                >
                    Clear
                </Button>
            </Box>

            {/* Detailed Address Form */}
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#633394' }}>
                    <LocationOnIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                    Detailed Address Information
                </Typography>

                <Grid container spacing={2}>
                    {/* Row 1 */}
                    <Grid item xs={12} sm={6} sx={{ minWidth: 220 }}>
                        <FormControl fullWidth>
                            <InputLabel>Continent</InputLabel>
                            <Select
                                value={formData.continent}
                                onChange={handleInputChange('continent')}
                                label="Continent"
                            >
                                <MenuItem value=""><em>Select Continent</em></MenuItem>
                                {continents.map(continent => (
                                    <MenuItem key={continent} value={continent}>
                                        {continent}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Country"
                            value={formData.country}
                            onChange={handleInputChange('country')}
                            placeholder="e.g., United States, Germany, Japan"
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Province/State"
                            value={formData.province}
                            onChange={handleInputChange('province')}
                            placeholder="e.g., California, Ontario, Bavaria"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Region"
                            value={formData.region}
                            onChange={handleInputChange('region')}
                            placeholder="e.g., Northern Region, Southeast"
                        />
                    </Grid>

                    {/* Row 3 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="City"
                            value={formData.city}
                            onChange={handleInputChange('city')}
                            placeholder="e.g., New York, London, Tokyo"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Town/District"
                            value={formData.town}
                            onChange={handleInputChange('town')}
                            placeholder="e.g., Downtown, Suburb"
                        />
                    </Grid>

                    {/* Row 4 */}
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            label="Address Line 1"
                            value={formData.address_line1}
                            onChange={handleInputChange('address_line1')}
                            placeholder="e.g., 123 Main Street"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Postal Code"
                            value={formData.postal_code}
                            onChange={handleInputChange('postal_code')}
                            placeholder="e.g., 12345"
                        />
                    </Grid>

                    {/* Row 5 */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Address Line 2"
                            value={formData.address_line2}
                            onChange={handleInputChange('address_line2')}
                            placeholder="e.g., Apartment 4B, Suite 200"
                        />
                    </Grid>

                    {/* Row 6 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Latitude (Optional)"
                            value={formData.latitude}
                            onChange={handleInputChange('latitude')}
                            placeholder="e.g., 40.7128"
                            type="number"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Longitude (Optional)"
                            value={formData.longitude}
                            onChange={handleInputChange('longitude')}
                            placeholder="e.g., -74.0060"
                            type="number"
                        />
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default ManualAddressInput; 