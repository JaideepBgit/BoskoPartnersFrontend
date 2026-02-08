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
                    <ContactReferrals />
                </Box>
            </Container>
        </>
    );
}

export default ContactReferralsPage;
