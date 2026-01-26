import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper, Button } from '@mui/material';
import UsersManagement from './Users/UsersManagement';
import OrganizationsManagement from './Organizations/OrganizationsManagement';
import ContactReferrals from './Users/ContactReferrals';
import EmailTemplatesTab from '../Admin/Inventory/EmailTemplatesTab';
import Navbar from '../shared/Navbar/Navbar';
import InventoryService from '../../services/Admin/Inventory/InventoryService';
import { fetchOrganizations } from '../../services/UserManagement/UserManagementService';

function UserManagementMain() {
    const [activeTab, setActiveTab] = useState(0);
    const [allEmailTemplates, setAllEmailTemplates] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

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
        if (activeTab === 2) {
            fetchAllEmailTemplates();
            loadOrganizations();
        }
    }, [activeTab]);

    return (
        <>
            <Navbar />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        Users Management
                    </Typography>

                    <Paper sx={{ width: '100%', mb: 2, boxShadow: 3, overflow: 'hidden' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            sx={{
                                mb: 3,
                                '& .MuiTab-root': {
                                    color: '#633394',
                                    fontWeight: 500,
                                    '&.Mui-selected': { fontWeight: 700 },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#633394',
                                },
                            }}
                            variant="fullWidth"
                        >
                            <Tab label="Users" />
                            {/* <Tab label="Organizations" /> */}
                            <Tab label="Contact Referrals" />
                            <Tab label="Email Templates" />
                        </Tabs>

                        <Box sx={{ p: 3 }}>
                            {activeTab === 0 && <UsersManagement />}
                            {/* {activeTab === 1 && <OrganizationsManagement />} */}
                            {activeTab === 1 && <ContactReferrals />}
                            {activeTab === 2 && (
                                <EmailTemplatesTab
                                    emailTemplates={allEmailTemplates}
                                    onRefreshData={(filterOrgId = null) => fetchAllEmailTemplates(filterOrgId)}
                                    organizationId={null}
                                    organizations={organizations}
                                />
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}

export default UserManagementMain;
