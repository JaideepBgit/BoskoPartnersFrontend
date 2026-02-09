import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import UsersManagement from './Users/UsersManagement';
import Navbar from '../shared/Navbar/Navbar';

function UserManagementMain() {
    const navigate = useNavigate();
    const [openUploadDialog, setOpenUploadDialog] = useState(false);

    const handleOpenAddDialog = () => {
        navigate('/users/add');
    };

    const handleOpenUploadDialog = () => {
        setOpenUploadDialog(true);
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    {/* Header with Users Management and Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" sx={{ color: '#212121', fontWeight: 'bold' }}>
                            Users
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<UploadFileIcon />}
                                onClick={handleOpenUploadDialog}
                                sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                            >
                                Upload Users
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleOpenAddDialog}
                                sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                            >
                                Add User
                            </Button>
                        </Box>
                    </Box>

                    <Paper sx={{ width: '100%', mb: 2, boxShadow: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 3 }}>
                            <UsersManagement
                                openUploadDialog={openUploadDialog}
                                setOpenUploadDialog={setOpenUploadDialog}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}

export default UserManagementMain;

