import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import ContactReferrals from './ContactReferrals';
import Navbar from '../../shared/Navbar/Navbar';

function ContactReferralsPage() {
    return (
        <>
            <Navbar />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        Contact Referrals
                    </Typography>

                    <Paper sx={{ width: '100%', mb: 2, boxShadow: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 3 }}>
                            <ContactReferrals />
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}

export default ContactReferralsPage;
