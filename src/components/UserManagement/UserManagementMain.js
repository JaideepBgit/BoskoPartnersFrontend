import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper, Button } from '@mui/material';
import UsersManagement from './Users/UsersManagement';
import OrganizationsManagement from './Organizations/OrganizationsManagement';
import ContactReferrals from './Users/ContactReferrals';
import Navbar from '../shared/Navbar/Navbar';

function UserManagementMain() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const tabs = [
        { label: 'Home', path: '/home'},
        { label: 'Assessment Overview', path: '/root-dashboard' },
        { label: '360 Degree Assessment', path: '/edit-assessments' },
        { label: 'Users Management', path: '/users' },
        { label: 'Settings', path: '/settings' },
        { label: 'Reports', path: '/reports' },
    ];

    return (
        <>
            <Navbar />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        User & Organization Management
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
                            <Tab label="Organizations" />
                            <Tab label="Contact Referrals" />
                        </Tabs>
                        
                        <Box sx={{ p: 3 }}>
                            {activeTab === 0 && <UsersManagement />}
                            {activeTab === 1 && <OrganizationsManagement />}
                            {activeTab === 2 && <ContactReferrals />}
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}

export default UserManagementMain;
