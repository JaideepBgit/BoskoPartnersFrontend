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
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                <Box>
                    <EmailTemplatesTab
                        emailTemplates={allEmailTemplates}
                        onRefreshData={(filterOrgId = null) => fetchAllEmailTemplates(filterOrgId)}
                        organizationId={null}
                        organizations={organizations}
                    />
                </Box>
            </Container>
        </>
    );
}

export default EmailTemplatesPage;
