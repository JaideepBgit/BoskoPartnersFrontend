import React, { useState } from 'react';
import { 
    AppBar, Box, Toolbar, Typography, Button, Container, 
    Tabs, Tab, Drawer, List, ListItem, ListItemIcon, 
    ListItemText, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';

function DashboardLayout({ children, tabs, activeTab, onLogout }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleTabChange = (event, newValue) => {
        navigate(tabs[newValue].path);
    };

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const getTabIcon = (label) => {
        switch (label.toLowerCase()) {
            case 'home':
                return <HomeIcon />;
            case 'assessment overview':
            case '360 degree assessment':
                return <AssessmentIcon />;
            case 'users management':
                return <PeopleIcon />;
            case 'settings':
                return <SettingsIcon />;
            case 'reports':
                return <BarChartIcon />;
            default:
                return null;
        }
    };

    const drawer = (
        <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
            <List>
                {tabs.map((tab, index) => (
                    <ListItem 
                        button 
                        key={tab.label} 
                        onClick={() => navigate(tab.path)}
                        selected={index === activeTab}
                    >
                        <ListItemIcon>
                            {getTabIcon(tab.label)}
                        </ListItemIcon>
                        <ListItemText primary={tab.label} />
                    </ListItem>
                ))}
                <ListItem button onClick={onLogout}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Bosko Partners
                    </Typography>
                    <Button color="inherit" onClick={onLogout}>Logout</Button>
                </Toolbar>
                {!isMobile && (
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange} 
                        indicatorColor="secondary"
                        textColor="inherit"
                        variant="fullWidth"
                        sx={{ bgcolor: 'primary.dark' }}
                    >
                        {tabs.map((tab) => (
                            <Tab key={tab.label} label={tab.label} />
                        ))}
                    </Tabs>
                )}
            </AppBar>
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={handleDrawerToggle}
            >
                {drawer}
            </Drawer>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {children}
            </Container>
        </Box>
    );
}

export default DashboardLayout;