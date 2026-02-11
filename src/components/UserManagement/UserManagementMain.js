import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import UsersManagement from './Users/UsersManagement';
import Navbar from '../shared/Navbar/Navbar';

function UserManagementMain() {
    const navigate = useNavigate();
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [userCount, setUserCount] = useState(0);

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
                            Users ({userCount})
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

                    <UsersManagement
                        openUploadDialog={openUploadDialog}
                        setOpenUploadDialog={setOpenUploadDialog}
                        onUserCountChange={setUserCount}
                    />
                </Box>
            </Container>
        </>
    );
}

export default UserManagementMain;

