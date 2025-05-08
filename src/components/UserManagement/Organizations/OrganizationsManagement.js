import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, 
    InputLabel, TablePagination, Card, CardContent, Grid, Chip, Tabs, Tab, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { 
    fetchOrganizations, addOrganization, updateOrganization, deleteOrganization, 
    fetchDenominations, fetchAccreditationBodies, fetchUmbrellaAssociations,
    uploadOrganizationFile
} from '../../../services/UserManagement/UserManagementService';

function OrganizationsManagement() {
    const theme = useTheme();
    
    // State variables
    const [organizations, setOrganizations] = useState([]);
    const [denominations, setDenominations] = useState([]);
    const [accreditationBodies, setAccreditationBodies] = useState([]);
    const [umbrellaAssociations, setUmbrellaAssociations] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalOrganizations, setTotalOrganizations] = useState(0);
    const [orgTypeFilter, setOrgTypeFilter] = useState('all');
    const [activeTab, setActiveTab] = useState(0);
    
    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        type: 'church',
        continent: '',
        region: '',
        province: '',
        city: '',
        town: '',
        denomination_id: '',
        accreditation_body_id: '',
        umbrella_association_id: '',
        primary_contact_id: '',
        secondary_contact_id: '',
        details: {}
    });
    
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadOrganizations();
        loadDenominations();
        loadAccreditationBodies();
        loadUmbrellaAssociations();
    }, []);

    // Load organizations from API
    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            setOrganizations(data);
            setTotalOrganizations(data.length);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    // Load denominations from API
    const loadDenominations = async () => {
        try {
            const data = await fetchDenominations();
            setDenominations(data || []);
        } catch (error) {
            console.error('Failed to fetch denominations:', error);
            setDenominations([]);
        }
    };

    // Load accreditation bodies from API
    const loadAccreditationBodies = async () => {
        try {
            const data = await fetchAccreditationBodies();
            setAccreditationBodies(data || []);
        } catch (error) {
            console.error('Failed to fetch accreditation bodies:', error);
            setAccreditationBodies([]);
        }
    };

    // Load umbrella associations from API
    const loadUmbrellaAssociations = async () => {
        try {
            const data = await fetchUmbrellaAssociations();
            setUmbrellaAssociations(data || []);
        } catch (error) {
            console.error('Failed to fetch umbrella associations:', error);
            setUmbrellaAssociations([]);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle details input changes
    const handleDetailsChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            details: {
                ...formData.details,
                [name]: value
            }
        });
    };

    // Handle file selection for upload
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const response = await uploadOrganizationFile(formData);
            setUploadStatus(`File uploaded successfully: ${response.filename}`);
            
            // Reload organizations after successful upload
            loadOrganizations();
            
            // Close the dialog after a delay
            setTimeout(() => {
                setOpenUploadDialog(false);
                setSelectedFile(null);
                setUploadStatus('');
            }, 2000);
        } catch (error) {
            setUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    // Open add organization dialog
    const handleOpenAddDialog = () => {
        setFormData({
            name: '',
            type: 'church',
            continent: '',
            region: '',
            province: '',
            city: '',
            town: '',
            denomination_id: '',
            accreditation_body_id: '',
            umbrella_association_id: '',
            primary_contact_id: '',
            secondary_contact_id: '',
            details: {}
        });
        setOpenAddDialog(true);
    };

    // Open edit organization dialog
    const handleOpenEditDialog = (organization) => {
        setSelectedOrganization(organization);
        
        // Prepare form data based on organization type
        const details = {};
        
        setFormData({
            name: organization.name,
            type: organization.type,
            continent: organization.continent || '',
            region: organization.region || '',
            province: organization.province || '',
            city: organization.city || '',
            town: organization.town || '',
            denomination_id: organization.denomination_id || '',
            accreditation_body_id: organization.accreditation_body_id || '',
            umbrella_association_id: organization.umbrella_association_id || '',
            primary_contact_id: organization.primary_contact_id || '',
            secondary_contact_id: organization.secondary_contact_id || '',
            details: organization.details || {}
        });
        
        setOpenEditDialog(true);
    };

    // Open delete organization dialog
    const handleOpenDeleteDialog = (organization) => {
        setSelectedOrganization(organization);
        setOpenDeleteDialog(true);
    };

    // Open upload file dialog
    const handleOpenUploadDialog = () => {
        setSelectedFile(null);
        setUploadStatus('');
        setOpenUploadDialog(true);
    };

    // Close all dialogs
    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setOpenUploadDialog(false);
        setSelectedOrganization(null);
        setFormData({
            name: '',
            type: 'church',
            continent: '',
            region: '',
            province: '',
            city: '',
            town: '',
            denomination_id: '',
            accreditation_body_id: '',
            umbrella_association_id: '',
            primary_contact_id: '',
            secondary_contact_id: '',
            details: {}
        });
    };

    // Add a new organization
    const handleAddOrganization = async () => {
        try {
            await addOrganization(formData);
            loadOrganizations();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to add organization:', error);
            alert(`Failed to add organization: ${error.message}`);
        }
    };

    // Update an existing organization
    const handleUpdateOrganization = async () => {
        if (!selectedOrganization) return;
        
        try {
            await updateOrganization(selectedOrganization.id, formData);
            loadOrganizations();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert(`Failed to update organization: ${error.message}`);
        }
    };

    // Delete an organization
    const handleDeleteOrganization = async () => {
        if (!selectedOrganization) return;
        
        try {
            await deleteOrganization(selectedOrganization.id);
            loadOrganizations();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to delete organization:', error);
            alert(`Failed to delete organization: ${error.message}`);
        }
    };

    // Handle pagination change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle organization type filter change
    const handleOrgTypeFilterChange = (event) => {
        setOrgTypeFilter(event.target.value);
        setPage(0);
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Get denomination name by ID
    const getDenominationName = (id) => {
        const denomination = denominations.find(d => d.id === id);
        return denomination ? denomination.name : 'N/A';
    };

    // Get accreditation body name by ID
    const getAccreditationBodyName = (id) => {
        const body = accreditationBodies.find(b => b.id === id);
        return body ? body.name : 'N/A';
    };

    // Get umbrella association name by ID
    const getUmbrellaAssociationName = (id) => {
        const association = umbrellaAssociations.find(a => a.id === id);
        return association ? association.name : 'N/A';
    };

    // Filter organizations based on type
    const filteredOrganizations = orgTypeFilter === 'all'
        ? organizations
        : organizations.filter(org => org.type === orgTypeFilter);

    // Paginate organizations
    const paginatedOrganizations = filteredOrganizations.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Render the organizations table
    const renderOrganizationsTable = () => {
        return (
            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ mr: 2, fontWeight: 'bold', color: '#633394' }}>
                        Filter by Type:
                    </Typography>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={orgTypeFilter}
                            onChange={handleOrgTypeFilterChange}
                            displayEmpty
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="church">Churches</MenuItem>
                            <MenuItem value="school">Schools</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Table>
                    <TableHead sx={{ backgroundColor: '#633394' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Denomination</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedOrganizations.map((org) => (
                            <TableRow key={org.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
                                <TableCell>{org.name}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={org.type.charAt(0).toUpperCase() + org.type.slice(1)} 
                                        color={
                                            org.type === 'church' ? 'primary' : 
                                            org.type === 'school' ? 'secondary' : 'default'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {[org.city, org.province, org.region, org.continent]
                                        .filter(Boolean)
                                        .join(', ')}
                                </TableCell>
                                <TableCell>
                                    {org.denomination_id ? getDenominationName(org.denomination_id) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpenEditDialog(org)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleOpenDeleteDialog(org)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredOrganizations.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ 
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            margin: 0
                        }
                    }}
                />
            </TableContainer>
        );
    };

    // Render organization form
    const renderOrganizationForm = () => {
        return (
            <Box>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    sx={{ mb: 2 }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="Basic Information" />
                    <Tab label="Type-Specific Details" />
                </Tabs>

                {activeTab === 0 && (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                required
                                fullWidth
                                label="Organization Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    label="Type"
                                >
                                    <MenuItem value="church">Church</MenuItem>
                                    <MenuItem value="school">School</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Continent"
                                name="continent"
                                value={formData.continent}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Region"
                                name="region"
                                value={formData.region}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Province"
                                name="province"
                                value={formData.province}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Town"
                                name="town"
                                value={formData.town}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Denomination</InputLabel>
                                <Select
                                    name="denomination_id"
                                    value={formData.denomination_id}
                                    onChange={handleInputChange}
                                    label="Denomination"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {denominations.map((denom) => (
                                        <MenuItem key={denom.id} value={denom.id}>
                                            {denom.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Accreditation Body</InputLabel>
                                <Select
                                    name="accreditation_body_id"
                                    value={formData.accreditation_body_id}
                                    onChange={handleInputChange}
                                    label="Accreditation Body"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {accreditationBodies.map((body) => (
                                        <MenuItem key={body.id} value={body.id}>
                                            {body.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Umbrella Association</InputLabel>
                                <Select
                                    name="umbrella_association_id"
                                    value={formData.umbrella_association_id}
                                    onChange={handleInputChange}
                                    label="Umbrella Association"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {umbrellaAssociations.map((assoc) => (
                                        <MenuItem key={assoc.id} value={assoc.id}>
                                            {assoc.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Grid container spacing={2}>
                        {formData.type === 'church' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Senior Pastor Name"
                                        name="senior_pastor_name"
                                        value={formData.details.senior_pastor_name || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Pastor Email"
                                        name="pastor_email"
                                        type="email"
                                        value={formData.details.pastor_email || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Umbrella Association"
                                        name="umbrella_association"
                                        value={formData.details.umbrella_association || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                            </>
                        )}

                        {formData.type === 'school' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Town"
                                        name="town"
                                        value={formData.details.town || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Highest Education"
                                        name="highest_education"
                                        value={formData.details.highest_education || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                            </>
                        )}

                        {formData.type === 'other' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Organization Lead"
                                        name="org_lead"
                                        value={formData.details.org_lead || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Lead Email"
                                        name="lead_email"
                                        type="email"
                                        value={formData.details.lead_email || ''}
                                        onChange={handleDetailsChange}
                                        margin="normal"
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                )}
            </Box>
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#633394', fontWeight: 'bold' }}>
                    Organizations Management
                </Typography>
                <Box>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenAddDialog}
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' }, mr: 1 }}
                    >
                        Add Organization
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<UploadFileIcon />} 
                        onClick={handleOpenUploadDialog}
                        sx={{ color: '#633394', borderColor: '#633394', '&:hover': { borderColor: '#7c52a5', color: '#7c52a5' } }}
                    >
                        Upload CSV/XLSX
                    </Button>
                </Box>
            </Box>

            <Card sx={{ mb: 4, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        Organization Statistics
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>{organizations.length}</Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Total Organizations</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {organizations.filter(org => org.type === 'church').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Churches</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {organizations.filter(org => org.type === 'school').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Schools</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {renderOrganizationsTable()}

            {/* Add Organization Dialog */}
            <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Add New Organization
                </DialogTitle>
                <DialogContent dividers>
                    {renderOrganizationForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleAddOrganization} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add Organization
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Organization Dialog */}
            <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Edit Organization
                </DialogTitle>
                <DialogContent dividers>
                    {renderOrganizationForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleUpdateOrganization} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Update Organization
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Organization Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Delete Organization
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Are you sure you want to delete the organization "{selectedOrganization?.name}"? 
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleDeleteOrganization} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload File Dialog */}
            <Dialog open={openUploadDialog} onClose={handleCloseDialogs}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Upload Organizations File
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        Upload a CSV or XLSX file containing organization data. 
                        The file should have columns for name, type, location, etc.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept=".csv,.xlsx"
                            type="file"
                            onChange={handleFileChange}
                            style={{ 
                                padding: '10px',
                                border: `1px solid #633394`,
                                borderRadius: '4px'
                            }}
                        />
                        {uploadStatus && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                {uploadStatus}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleFileUpload} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                        disabled={!selectedFile}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default OrganizationsManagement;
