import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, CircularProgress, Alert, Chip
} from '@mui/material';
import Navbar from '../shared/Navbar/Navbar';
import DataTable from '../shared/DataTable/DataTable';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    cardBg: '#ffffff',
    accentBg: '#f3e5f5',
    borderColor: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
};

function AssociationOrganizationsPage({ onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [linkedOrganizations, setLinkedOrganizations] = useState([]);
    const [associationName, setAssociationName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const userString = localStorage.getItem('user');
            if (!userString) {
                navigate('/login');
                return;
            }

            const currentUser = JSON.parse(userString);
            const associationId = currentUser.organization_id;

            if (!associationId) {
                setError('No association organization found');
                setLoading(false);
                return;
            }

            // Fetch association details
            const assocResponse = await fetch(`/api/organizations/${associationId}`);
            if (!assocResponse.ok) {
                throw new Error('Failed to fetch association details');
            }
            const association = await assocResponse.json();
            setAssociationName(association.name);

            // Fetch all organizations
            const orgsResponse = await fetch('/api/organizations');
            if (!orgsResponse.ok) {
                throw new Error('Failed to fetch organizations');
            }
            const allOrgs = await orgsResponse.json();

            // Find organizations linked to this association
            const linked = allOrgs.filter(org => {
                if (org.id === associationId) return false;
                
                const denominationMatch = org.denomination_affiliation === association.name;
                const accreditationMatch = org.accreditation_status_or_body === association.name;
                const affiliationMatch = org.affiliation_validation === association.name;
                const umbrellaMatch = org.umbrella_association_membership === association.name;
                
                return denominationMatch || accreditationMatch || affiliationMatch || umbrellaMatch;
            });
            
            setLinkedOrganizations(linked);
        } catch (error) {
            console.error('Error loading data:', error);
            setError(error.message || 'Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationClick = (org) => {
        // Pass state so the organization page knows to return to association organizations
        navigate(`/organization-management/${org.id}`, {
            state: {
                fromAssociationOrganizations: true
            }
        });
    };

    const getLocation = (org) => {
        if (!org?.geo_location) return 'N/A';
        const { city, province, country } = org.geo_location;
        return [city, province, country].filter(Boolean).join(', ') || 'N/A';
    };

    const getOrgTypeLabel = (type) => {
        switch (type?.toLowerCase()) {
            case 'church': return 'Church';
            case 'institution': return 'Institution';
            case 'non_formal_organizations': return 'Non-formal Org';
            default: return type || 'Other';
        }
    };

    const getTypeChipColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'church': return { bg: '#e8f5e9', color: '#2e7d32' };
            case 'institution': return { bg: '#e3f2fd', color: '#1565c0' };
            case 'non_formal_organizations': return { bg: '#fff3e0', color: '#ef6c00' };
            default: return { bg: colors.accentBg, color: colors.primary };
        }
    };

    const sortValueGetter = (row, orderBy) => {
        if (orderBy === 'name') {
            return (row.name || '').toLowerCase();
        } else if (orderBy === 'type') {
            return (row.organization_type?.type || '').toLowerCase();
        } else if (orderBy === 'location') {
            return getLocation(row).toLowerCase();
        }
        return row[orderBy];
    };

    const tableColumns = useMemo(() => [
        {
            id: 'name',
            label: 'Organization',
            sortable: true,
            render: (org) => {
                const typeColors = getTypeChipColor(org.organization_type?.type);
                return (
                    <Box>
                        <Typography variant="body1" fontWeight="600">
                            {org.name}
                        </Typography>
                        <Chip
                            label={getOrgTypeLabel(org.organization_type?.type)}
                            size="small"
                            sx={{
                                mt: 0.5,
                                backgroundColor: typeColors.bg,
                                color: typeColors.color,
                                fontSize: '0.7rem',
                                height: 22
                            }}
                        />
                    </Box>
                );
            }
        },
        {
            id: 'location',
            label: 'Location',
            sortable: true,
            render: (org) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                        {getLocation(org)}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'chevron',
            label: '',
            width: 50,
            render: () => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <ChevronRightIcon sx={{ color: colors.textSecondary }} />
                </Box>
            )
        }
    ], []);

    if (loading) {
        return (
            <>
                <Navbar onLogout={onLogout} />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar onLogout={onLogout} />
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: colors.textPrimary, mb: 1 }}>
                        Organizations
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Organizations linked to {associationName}
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {linkedOrganizations.length === 0 ? (
                    <Alert severity="info">
                        No organizations are currently linked to this association.
                    </Alert>
                ) : (
                    <DataTable
                        columns={tableColumns}
                        data={linkedOrganizations}
                        pagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        defaultRowsPerPage={10}
                        defaultSortColumn="name"
                        defaultSortDirection="asc"
                        sortValueGetter={sortValueGetter}
                        onRowClick={(org) => handleOrganizationClick(org)}
                        emptyMessage="No organizations found"
                        hoverEffect
                    />
                )}
            </Container>
        </>
    );
}

export default AssociationOrganizationsPage;
