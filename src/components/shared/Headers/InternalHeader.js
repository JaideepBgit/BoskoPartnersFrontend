import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

const InternalHeader = ({ title, leftActions, rightActions }) => {
    return (
        <AppBar position="sticky" sx={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', top: 0, zIndex: 1100 }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* Left Actions Group */}
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    {leftActions}
                </Box>

                {/* Page Title - Center */}
                <Typography variant="h6" sx={{ color: '#000000', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {title}
                </Typography>

                {/* Right Actions Group */}
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                    {rightActions}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default InternalHeader;
