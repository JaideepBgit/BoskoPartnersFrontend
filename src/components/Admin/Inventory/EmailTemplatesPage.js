import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import EmailTemplatesTab from './EmailTemplatesTab';
import Navbar from '../../shared/Navbar/Navbar';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import { fetchOrganizations } from '../../../services/UserManagement/UserManagementService';

function EmailTemplatesPage() {
    const [allEmailTemplates, setAllEmailTemplates] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    const fetchAllEmailTemplates = async (filterOrgId = null) => {
        try {
            let data;
            if (filterOrgId) {
                data = await InventoryService.getEmailTemplates(null, filterOrgId);
            } else {
                data = await InventoryService.getAllEmailTemplates();
            }
            setAllEmailTemplates(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching email templates:', err);
            setAllEmailTemplates([]);
        }
    };

    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            setOrganizations(data);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    useEffect(() => {
        fetchAllEmailTemplates();
        loadOrganizations();
    }, []);

    return (
        <>
            <Navbar />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        Email Templates
                    </Typography>

                    <Paper sx={{ width: '100%', mb: 2, boxShadow: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 3 }}>
                            <EmailTemplatesTab
                                emailTemplates={allEmailTemplates}
                                onRefreshData={(filterOrgId = null) => fetchAllEmailTemplates(filterOrgId)}
                                organizationId={null}
                                organizations={organizations}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}

export default EmailTemplatesPage;
