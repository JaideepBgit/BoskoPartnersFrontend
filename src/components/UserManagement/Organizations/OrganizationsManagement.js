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
    uploadOrganizationFile, fetchOrganizationTypes, initializeOrganizationTypes
} from '../../../services/UserManagement/UserManagementService';

function OrganizationsManagement() {
    const theme = useTheme();
    
    // State variables
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);
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
        type: 'Churches',
        continent: '',
        region: '',
        country: '',
        province: '',
        city: '',
        town: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        website: '',
        denomination_affiliation: '',
        accreditation_status_or_body: '',
        highest_level_of_education: '',
        affiliation_validation: '',
        umbrella_association_membership: '',
        denomination_id: '',
        accreditation_body_id: '',
        umbrella_association_id: '',
        primary_contact_id: '',
        secondary_contact_id: '',
        head_name: '',
        head_email: '',
        head_phone: '',
        head_address: '',
        details: {}
    });
    
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadOrganizations();
        loadOrganizationTypes();
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

    // Load organization types from API
    const loadOrganizationTypes = async () => {
        try {
            const data = await fetchOrganizationTypes();
            if (!data || data.length === 0) {
                // Initialize default types if none exist
                await initializeOrganizationTypes();
                const retryData = await fetchOrganizationTypes();
                setOrganizationTypes(retryData || []);
            } else {
                setOrganizationTypes(data);
            }
        } catch (error) {
            console.error('Failed to fetch organization types:', error);
            setOrganizationTypes([]);
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
            type: 'Churches',
            continent: '',
            region: '',
            country: '',
            province: '',
            city: '',
            town: '',
            address_line1: '',
            address_line2: '',
            postal_code: '',
            website: '',
            denomination_affiliation: '',
            accreditation_status_or_body: '',
            highest_level_of_education: '',
            affiliation_validation: '',
            umbrella_association_membership: '',
            denomination_id: '',
            accreditation_body_id: '',
            umbrella_association_id: '',
            primary_contact_id: '',
            secondary_contact_id: '',
            head_name: '',
            head_email: '',
            head_phone: '',
            head_address: '',
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
            type: organization.organization_type?.type || 'Churches',
            continent: organization.geo_location?.continent || '',
            region: organization.geo_location?.region || '',
            country: organization.geo_location?.country || '',
            province: organization.geo_location?.province || '',
            city: organization.geo_location?.city || '',
            town: organization.geo_location?.town || '',
            address_line1: organization.geo_location?.address_line1 || '',
            address_line2: organization.geo_location?.address_line2 || '',
            postal_code: organization.geo_location?.postal_code || '',
            website: organization.website || '',
            denomination_affiliation: organization.denomination_affiliation || '',
            accreditation_status_or_body: organization.accreditation_status_or_body || '',
            highest_level_of_education: organization.highest_level_of_education || '',
            affiliation_validation: organization.affiliation_validation || '',
            umbrella_association_membership: organization.umbrella_association_membership || '',
            denomination_id: organization.denomination_id || '',
            accreditation_body_id: organization.accreditation_body_id || '',
            umbrella_association_id: organization.umbrella_association_id || '',
            primary_contact_id: organization.primary_contact_id || '',
            secondary_contact_id: organization.secondary_contact_id || '',
            head_name: organization.lead?.firstname + ' ' + organization.lead?.lastname || '',
            head_email: organization.lead?.email || '',
            head_phone: organization.lead?.phone || '',
            head_address: organization.lead?.address || '',
            details: organization.misc || {}
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
            type: 'Churches',
            continent: '',
            region: '',
            country: '',
            province: '',
            city: '',
            town: '',
            address_line1: '',
            address_line2: '',
            postal_code: '',
            website: '',
            denomination_affiliation: '',
            accreditation_status_or_body: '',
            highest_level_of_education: '',
            affiliation_validation: '',
            umbrella_association_membership: '',
            denomination_id: '',
            accreditation_body_id: '',
            umbrella_association_id: '',
            primary_contact_id: '',
            secondary_contact_id: '',
            head_name: '',
            head_email: '',
            head_phone: '',
            head_address: '',
            details: {}
        });
    };

    // Transform form data to API format
    const transformFormDataToApiFormat = (formData) => {
        // Find the organization type ID
        const orgType = organizationTypes.find(ot => ot.type === formData.type);
        
        return {
            name: formData.name,
            organization_type_id: orgType?.id || null,
            geo_location: {
                continent: formData.continent,
                region: formData.region,
                country: formData.country,
                province: formData.province,
                city: formData.city,
                town: formData.town,
                address_line1: formData.address_line1 || '',
                address_line2: formData.address_line2 || '',
                postal_code: formData.postal_code || ''
            },
            website: formData.website || '',
            denomination_affiliation: formData.denomination_affiliation || '',
            accreditation_status_or_body: formData.accreditation_status_or_body || '',
            highest_level_of_education: formData.highest_level_of_education || '',
            affiliation_validation: formData.affiliation_validation || '',
            umbrella_association_membership: formData.umbrella_association_membership || '',
            misc: formData.details || {}
        };
    };

    // Add a new organization
    const handleAddOrganization = async () => {
        try {
            const apiData = transformFormDataToApiFormat(formData);
            await addOrganization(apiData);
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
            const apiData = transformFormDataToApiFormat(formData);
            await updateOrganization(selectedOrganization.id, apiData);
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
        : organizations.filter(org => org.organization_type?.type === orgTypeFilter);

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
                            {organizationTypes.map((orgType) => (
                                <MenuItem key={orgType.id} value={orgType.type}>
                                    {orgType.type === 'Churches' ? 'Churches' :
                                     orgType.type === 'Institutions' ? 'Institutions' :
                                     orgType.type === 'Non_formal_organizations' ? 'Non-formal Organizations' :
                                     orgType.type.charAt(0).toUpperCase() + orgType.type.slice(1)}
                                </MenuItem>
                            ))}
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
                                        label={org.organization_type?.type === 'Churches' ? 'Church' :
                                               org.organization_type?.type === 'Institutions' ? 'Institution' :
                                               org.organization_type?.type === 'Non_formal_organizations' ? 'Non-formal Org' :
                                               org.organization_type?.type || 'N/A'} 
                                        color={
                                            org.organization_type?.type === 'Churches' ? 'primary' : 
                                            org.organization_type?.type === 'Institutions' ? 'secondary' : 
                                            org.organization_type?.type === 'Non_formal_organizations' ? 'success' : 'default'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {[
                                        org.geo_location?.city, 
                                        org.geo_location?.province, 
                                        org.geo_location?.region, 
                                        org.geo_location?.continent
                                    ]
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
                    <Tab label="Basic Information & Address" />
                    <Tab label="Contacts & Relationships" />
                </Tabs>

                {activeTab === 0 && (
                    <Box>
                        {/* Basic Information Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', mb: 3, width: '96.5%' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                                Basic Information
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Column 1 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label={formData.type === 'Churches' ? 'Name of Church' : 
                                               formData.type === 'Institutions' ? 'Name of Institution' : 
                                               'Name of Organization'}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />
                                    
                                    <TextField
                                        fullWidth
                                        label="Website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />
                                </Box>

                                {/* Column 2 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            label="Type"
                                        >
                                            {organizationTypes.map((orgType) => (
                                                <MenuItem key={orgType.id} value={orgType.type}>
                                                    {orgType.type === 'Churches' ? 'Churches' :
                                                     orgType.type === 'Institutions' ? 'Institutions' :
                                                     orgType.type === 'Non_formal_organizations' ? 'Non-formal Organizations' :
                                                     orgType.type.charAt(0).toUpperCase() + orgType.type.slice(1)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    
                                    {formData.type === 'Institutions' && (
                                        <TextField
                                            fullWidth
                                            label="Highest Level of Education"
                                            name="highest_level_of_education"
                                            value={formData.highest_level_of_education}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Paper>

                        {/* Address Information Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                                Address Information
                            </Typography>
                            
                            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                                <Grid container spacing={3}>
                                    {/* Left Column */}
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Country"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="Province/District/County"
                                                name="province"
                                                value={formData.province}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="City"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="Address Line 1"
                                                name="address_line1"
                                                value={formData.address_line1}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="Postal Code"
                                                name="postal_code"
                                                value={formData.postal_code}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>
                                    
                                    {/* Right Column */}
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Continent"
                                                name="continent"
                                                value={formData.continent}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="Region"
                                                name="region"
                                                value={formData.region}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="Town"
                                                name="town"
                                                value={formData.town}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                label="Address Line 2"
                                                name="address_line2"
                                                value={formData.address_line2}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Grid container spacing={2}>
                        {/* Contacts Section */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
                                Contacts
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={`${formData.type === 'Churches' ? 'Church' : formData.type === 'Institutions' ? 'Institution' : 'Organization'} Primary Contact`}
                                name="primary_contact_id"
                                value={formData.primary_contact_id}
                                onChange={handleInputChange}
                                margin="normal"
                                helperText="Search and select existing user or add new user"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={`${formData.type === 'Churches' ? 'Church' : formData.type === 'Institutions' ? 'Institution' : 'Organization'} Secondary Contact`}
                                name="secondary_contact_id"
                                value={formData.secondary_contact_id}
                                onChange={handleInputChange}
                                margin="normal"
                                helperText="Search and select existing user or add new user"
                            />
                        </Grid>

                        {/* Head/Lead Section */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2, mt: 2 }}>
                                {formData.type === 'Churches' ? 'Senior/Lead Pastor' : 
                                 formData.type === 'Institutions' ? 'School President' : 
                                 'Organization Lead'}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={formData.type === 'Churches' ? 'Senior/Lead Pastor Name' : 
                                       formData.type === 'Institutions' ? 'School President Name' : 
                                       'Organization Lead Name'}
                                name="head_name"
                                value={formData.head_name}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={formData.type === 'Churches' ? "Pastor's Email Address" : 
                                       formData.type === 'Institutions' ? "President's Email Address" : 
                                       'Org. Lead Email Address'}
                                name="head_email"
                                type="email"
                                value={formData.head_email}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone Contact"
                                name="head_phone"
                                value={formData.head_phone}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={formData.type === 'Churches' ? 'Church Physical Address' : 'Physical Address'}
                                name="head_address"
                                value={formData.head_address}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>

                        {/* Organization-specific fields */}
                        {formData.type === 'Institutions' && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Highest Level of Education"
                                    name="highest_level_of_education"
                                    value={formData.highest_level_of_education}
                                    onChange={handleInputChange}
                                    margin="normal"
                                />
                            </Grid>
                        )}

                        {/* Organizational Relationships Section */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2, mt: 2 }}>
                                Organizational Relationships
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Denomination/Affiliation"
                                name="denomination_affiliation"
                                value={formData.denomination_affiliation}
                                onChange={handleInputChange}
                                margin="normal"
                                helperText="Search organizations or add new"
                            />
                        </Grid>
                        
                        {formData.type === 'Institutions' && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Accreditation Status/Accrediting Body"
                                    name="accreditation_status_or_body"
                                    value={formData.accreditation_status_or_body}
                                    onChange={handleInputChange}
                                    margin="normal"
                                    helperText="Search organizations or add new"
                                />
                            </Grid>
                        )}
                        
                        {formData.type === 'Non_formal_organizations' && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Affiliation/Validation"
                                    name="affiliation_validation"
                                    value={formData.affiliation_validation}
                                    onChange={handleInputChange}
                                    margin="normal"
                                    helperText="Search organizations or add new"
                                />
                            </Grid>
                        )}
                        
                        {formData.type === 'Churches' && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Umbrella Association Membership"
                                    name="umbrella_association_membership"
                                    value={formData.umbrella_association_membership}
                                    onChange={handleInputChange}
                                    margin="normal"
                                    helperText="Search organizations or add new"
                                />
                            </Grid>
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
                        <Grid item xs={12} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>{organizations.length}</Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Total Organizations</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {organizations.filter(org => org.organization_type?.type === 'Churches').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Churches</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {organizations.filter(org => org.organization_type?.type === 'Institutions').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Institutions</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {organizations.filter(org => org.organization_type?.type === 'Non_formal_organizations').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Non-formal Orgs</Typography>
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
