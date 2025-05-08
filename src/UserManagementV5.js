import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField,
    TablePagination, Select, MenuItem, FormControl, InputLabel, Card, IconButton, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import DialogContentText from '@mui/material/DialogContentText';
import AddIcon from '@mui/icons-material/Add';
import MinimizeIcon from '@mui/icons-material/Minimize';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchUsers, addUser, deleteUser, fetchCompanies, addCompany, updateCompanyUser,fetchCoachesByCompany,updateCompany, deleteCompany,fetchCompanyCoachDetails,fetchUserHierarchy } from './services/userService'; // Import service functions.... updateCompany, deleteCompany
import DashboardLayout from './DashboardLayout'; // Import DashboardLayout
import { motion } from 'framer-motion'; // Import framer-motion
import ManageCompanyUsersForm from './Utilities/UserManagement/ManageCompanyUsersFormV1';
import {InvitationEmailDialog} from './../Email/InvitationEmailDialog';
import DownloadIcon from '@mui/icons-material/Download';
import { fetchVersionsV2 } from './services/assessmentService';

function UserManagement({ onLogout }) {
    const getDefaultStartDate = () => new Date().toISOString().split('T')[0];
    const getDefaultEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 15);
        return date.toISOString().split('T')[0];
    };

    const [users, setUsers] = useState([]);
    const [leaders, setLeaders] = useState([]);
    const [userHierarchy, setUserHierarchy] = useState([]); // State to hold user hierarchy details
    const [coaches, setCoaches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('');
    const [newUserPhoneNumber, setNewUserPhoneNumber] = useState('');
    const [newUserCompanyId, setNewUserCompanyId] = useState('');
    //const [userGroupSelectedCompanyId, setUserGroupSelectedCompanyId] = useState(''); // previously used as variables sent to ManageCompanyUsersFormV1.
    //const [updateTrigger, setUpdateTrigger] = useState(false); // previously used as variables which are sent to ManageCompanyUsersFormV1.
    const [companyUsers, setCompanyUsers] = useState([]);
    const [selectedLeaderId, setSelectedLeaderId] = useState('');
    const [selectedCoachId, setSelectedCoachId] = useState('');
    const [filteredCoachesForAddUser, setFilteredCoachesForAddUser] = useState([]); //used during when a leader is about to be added, One should select a company, and only coaches assigned to particular company should be shown in the drop-down list.
    const [startDate, setStartDate] = useState(getDefaultStartDate());
    const [endDate, setEndDate] = useState(getDefaultEndDate());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [displayedUsers, setDisplayedUsers] = useState([]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editUserData, setEditUserData] = useState({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState(null);
    const [deleteUserRole, setDeleteUserRole] = useState('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyAddress, setNewCompanyAddress] = useState('');
    const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
    const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
    const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
    const [isManageCompaniesOpen, setIsManageCompaniesOpen] = useState(false);
    const [editCompanyData, setEditCompanyData] = useState(null);
    // Manage Companies Pagination state
    const [manageCompaniesPage, setManageCompaniesPage] = useState(0);
    const [manageCompaniesRowsPerPage, setManageCompaniesRowsPerPage] = useState(4);
    // While adding user, select the role and then show additional fields
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailDialogData, setEmailDialogData] = useState({});
    const [subRole, setSubRole] = useState(''); // New state for sub-role
    const [companyCoachDetails, setCompanyCoachDetails] = useState([]);
    const [availableCoachesForEditUser, setAvailableCoachesavailableCoaches] = useState([]); // use in Edit User to change coach for a leader when a company changes.
    // These states declarations in UserManagement component
    const [version, setVersion] = useState('1');
    const [availableVersions, setAvailableVersions] = useState(['1']);
    const [selectedLeaderVersion, setSelectedLeaderVersion] = useState('1');

    useEffect(() => {
        loadUsers();
        loadCompanies();
        const companyCoachDetailsFetch = async () => {
            try {
                const dataCC = await fetchCompanyCoachDetails();
                setCompanyCoachDetails(dataCC);
            } catch (error) {
                console.error(error);
            }
        };
        const loadVersions = async () => {
            try {
                const versions = await fetchVersionsV2(); // You will need to import this
                const validVersions = versions?.length > 0 
                    ? versions.map(String) 
                    : ['1'];
                setAvailableVersions(validVersions);
                setVersion(validVersions[0]);
            } catch (error) {
                console.error('Failed to load versions:', error);
                setAvailableVersions(['1']);
                setVersion('1');
            }
        };
        companyCoachDetailsFetch();
        loadVersions();
    }, []);//updateTrigger this trigger is not required, shifted to ManageCompanyUsersFormV1

    useEffect(() => {
        const companyCoachDetailsFetch = async () => {
            try {
                const dataCC = await fetchCompanyCoachDetails();
                setCompanyCoachDetails(dataCC);
            } catch (error) {
                console.error(error);
            }
        };
        companyCoachDetailsFetch();
    }, [coaches]);

    useEffect(() => {
        updateCoachCompanyIds();
    }, [leaders]);


    useEffect(() => {
        const updateFilteredCoaches = async () => {
            if (newUserRole === 'leader' && newUserCompanyId) {
                try {
                    // Filter and map `companyCoachDetails`
                    const tmpCoachesV1 = companyCoachDetails
                        .filter((c) => c.company_id === newUserCompanyId)
                        .map((c) => ({
                            id: c.coach_id,
                            name: c.coach_name,
                        }));
    
                    // Update state with filtered coaches
                    setFilteredCoachesForAddUser(tmpCoachesV1);
                } catch (error) {
                    console.error('Failed to fetch or filter coaches:', error);
                }
            }
        };
    
        updateFilteredCoaches();
    }, [newUserRole, newUserCompanyId, companyCoachDetails]);

    // Add this new effect to handle pagination
    /*useEffect(() => {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        
        // Create a stable copy of the sliced data
        const paginatedUsers = users
            .slice(startIndex, endIndex)
            .map(user => ({...user})); // Create new object references
            
        setDisplayedUsers(paginatedUsers);
    }, [users, page, rowsPerPage]);

    //use effect to handle 
    useEffect(() => {
        // Define role priority
        const rolePriority = {
            'leader': 1,
            'coach': 2,
            'observer': 3
        };
    
        // Sort users by role priority
        const sortedUsers = [...users].sort((a, b) => {
            const roleA = a.role || 'observer'; // Default to observer if role is undefined
            const roleB = b.role || 'observer';
            return rolePriority[roleA] - rolePriority[roleB];
        });
    
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        //console.log(users,sortedUsers);
        // Create a stable copy of the sliced data from sorted users
        const paginatedUsers = sortedUsers
            .slice(startIndex, endIndex)
            .map(user => ({...user}));
            
        setDisplayedUsers(paginatedUsers);
    }, [users, page, rowsPerPage]);*/

    useEffect(() => {
        // Define role priority
        const rolePriority = {
            'leader': 1,
            'coach': 2,
            'observer': 3
        };
    
        // Create entirely new array with new references
        const stableUsers = users.map(user => ({
            ...user,
            role: user.role || 'observer',
            // Add a stable, unique identifier that includes both the id and the page
            uniqueKey: `${user.id}-${user.email}-${page}`
        }));
    
        // Sort users by role priority with new array reference
        const sortedUsers = Array.from(stableUsers).sort((a, b) => {
            return rolePriority[a.role] - rolePriority[b.role];
        });
    
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        
        // Create new array reference for paginated data
        const paginatedUsers = Array.from(
            sortedUsers.slice(startIndex, endIndex)
        );
        
        // Set with new reference
        setDisplayedUsers(paginatedUsers);
    }, [users, page, rowsPerPage]);

    const loadCompanies = async () => {
        try {
            const companies = await fetchCompanies();
            setCompanies(companies);
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    };
    const refreshCompanies = async () => {
        const data = await fetchCompanies();
        setCompanies(data);
    };

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            const dataUserHierarchy = await fetchUserHierarchy();
            //console.log(dataUserHierarchy);
            const filteredUsers = data.filter(user => user.role !== 'root');
    
            // Separate roles
            const leaderList = filteredUsers.filter(user => user.role === 'leader');
            const coachList = filteredUsers.filter(user => user.role === 'coach');
            const observerList = filteredUsers.filter(user => user.role === 'observer');
            // console.log(leaderList);
            // Assign company_id to observers based on leader_id
            const updatedObservers = observerList.map(observer => {
                const leader = leaderList.find(leader => leader.id === observer.leader_id);
                if (leader) {
                    return {
                        ...observer,
                        company_id: leader.company_id,
                    };
                }
                return observer;
            });
    
            // Merge back updated observer list with other users
            const updatedUsers = [
                ...filteredUsers.filter(user => user.role !== 'observer'),
                ...updatedObservers,
            ];
    
            setUsers(updatedUsers);
            setLeaders(leaderList);
            setCoaches(coachList);
            setUserHierarchy(dataUserHierarchy);
            //updateFilteredUsers();
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };
    

    /* Obselete the code is shifted to ManageCompanyUsersFormV1
    const updateFilteredUsers = () => {
        const filteredUsers = users.filter(user => user.company_id === userGroupSelectedCompanyId);
        setCompanyUsers(filteredUsers);
    };*/

    const updateCoachCompanyIds = () => {
        const updatedCoaches = coaches.map(coach => {
            const leadersUnderCoach = leaders.filter(leader => leader.coach_id === coach.id);
            const uniqueCompanyIds = [...new Set(leadersUnderCoach.map(leader => leader.company_id))];
            return {
                ...coach,
                company_ids: uniqueCompanyIds,
            };
        });
        setCoaches(updatedCoaches);
    };

    const handleAddUser = async () => {
        if (new Date(endDate) < new Date(startDate)) {
            alert('End date cannot be earlier than start date.');
            return;
        }
        // For observers, ensure we're using the leader's version
        const userVersion = newUserRole === 'observer' 
        ? selectedLeaderVersion 
        : version
        const newUser = { 
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            sub_role: subRole, // Include sub-role when adding a new observer
            phone_number: newUserPhoneNumber,
            company_id: newUserCompanyId,
            version: userVersion, // Use selected version, removed 'version'
            start_date: newUserRole === 'leader' || newUserRole === 'observer' ? startDate : null,
            end_date: newUserRole === 'leader' || newUserRole === 'observer' ? endDate : null,
            leader_id: newUserRole === 'observer' ? selectedLeaderId : null,
            coach_id: newUserRole === 'leader' ? selectedCoachId : null
        };
        
        try {
            const response = await addUser(newUser);
            alert(`User added successfully. Generated password: ${response.password}`);
            loadUsers();


            if (newUserRole === 'leader' || newUserRole === 'observer') {
                let additionalInfo = {};
                
                if (newUserRole === 'leader') {
                    // Get coach name for leader
                    const selectedCoach = coaches.find(coach => coach.id === selectedCoachId);
                    additionalInfo = {
                        Coach: selectedCoach ? selectedCoach.name : '',
                        Leader: ''
                    };
                } else if (newUserRole === 'observer') {
                    // Get leader name for observer
                    const selectedLeader = leaders.find(leader => leader.id === selectedLeaderId);
                    additionalInfo = {
                        Coach: '',
                        Leader: selectedLeader ? selectedLeader.name : ''
                    };
                }
                // Reset form fields including version
                setVersion('1');
                setEmailDialogData({
                    role: newUserRole,
                    name: newUserName,
                    email: newUserEmail,
                    link: response.link,
                    auth_code: response.auth_code,
                    ...additionalInfo
                });
                setIsEmailDialogOpen(true);
            }
            setNewUserName('');
            setNewUserEmail('');
            setNewUserRole('');
            setSubRole('');
            setNewUserPhoneNumber('');
            setNewUserCompanyId('');
            setStartDate(getDefaultStartDate());
            setEndDate(getDefaultEndDate());
            setSelectedLeaderId('');
            setSelectedCoachId('');
            setShowAdditionalFields(false);

            // Open InvitationEmailDialog for the new leader or observer
            /*if (newUserRole === 'leader' || newUserRole === 'observer') {
                setEmailDialogData({
                    role: newUserRole,
                    name: newUserName,
                    email: newUserEmail,
                    link: response.link,
                    auth_code: response.auth_code
                });
                setIsEmailDialogOpen(true);
            }*/
            loadUsers();
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleAddCompany = async() =>{
        if(!newCompanyName.trim()){
            alert('Company name cannot be empty');
            return;
        }

        try{
            await addCompany({
                name: newCompanyName,
                address: newCompanyAddress,
                industry: newCompanyIndustry,
                website: newCompanyWebsite,
            });
            loadCompanies(); //Reload companies after adding a new one
            setIsAddCompanyDialogOpen(false);
            setNewCompanyName('');
            setNewCompanyAddress('');
            setNewCompanyIndustry('');
            setNewCompanyWebsite('');
        }catch(error){
            console.error('Failed to add compnay', error);
            alert('Failed to add company');
        }
    }
    const handleDeleteUser = async (userId, userRole) => {
        //console.log(userId, userRole);
        try {
            await deleteUser(deleteUserId, deleteUserRole);
            loadUsers();
            setDeleteUserId(null);
            setDeleteUserRole('');
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const handleOpenDeleteDialog = (userId, userRole) => {
        setDeleteUserId(userId);
        setDeleteUserRole(userRole);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    /*const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };*/

    const handleChangeRowsPerPage = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0); // Reset to first page when changing rows per page
    };

    const toggleFormVisibility = () => {
        setIsFormOpen(!isFormOpen);
        setNewUserRole('');
        setShowAdditionalFields(false);
    };

    const toggleFormVisibilityManageCompanies = () => {
        setIsManageCompaniesOpen(!isManageCompaniesOpen);
    };
    

    const getCoachName = (userId) => {
        const mapping = userHierarchy.find((uh) => uh.UserID1 === userId);
        if (mapping) {
            const coach = coaches.find((coach) => coach.id === mapping.UserID2);
            return coach ? coach.name : '';
        }
        return '';
    };
    const handleEditUser = (user) => {
        //console.log(user);
        //const currentCoachName = getCoachName(user.id); // Get current coach name
        //console.log(currentCoachName);
        //setEditUserData(user);
        const currentCoachMapping = userHierarchy.find((uh) => uh.UserID1 === user.id);
        const currentCoachId = currentCoachMapping ? currentCoachMapping.UserID2 : '';
        setEditUserData({ ...user, coach_id: currentCoachId }); // Add coach_name to editUserData

        
        // Filter available coaches based on the user's company
        if (user.role === 'leader' && user.company_id) {
            const filteredCoaches = companyCoachDetails
            .filter((coach) => coach.company_id === user.company_id)
            .map((coach) => ({ id: coach.coach_id, name: coach.coach_name }));
            setAvailableCoachesavailableCoaches(filteredCoaches);
        } else {
            setAvailableCoachesavailableCoaches([]); // Clear if not applicable
        }
        setIsEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setIsEditDialogOpen(false);
        setEditUserData({});
    };

    const handleEditUserSave = async () => {
        //console.log(editUserData);
        try {
            await updateCompanyUser(editUserData.id, editUserData, 'edit', editUserData.role);
            loadUsers();
            setIsEditDialogOpen(false);
        } catch (error) {
            alert(`Failed to update user: ${error}`);
        }
    };

    const toggleManageCompaniesVisibility = () => {
        setIsManageCompaniesOpen(!isManageCompaniesOpen);
    };

    const handleAddCompanyDialogOpen = () => {
        setEditCompanyData(null); // Reset editCompanyData
        setIsAddCompanyDialogOpen(true);
    };

    const handleEditCompany = (company) => {
        setEditCompanyData(company);
        setIsAddCompanyDialogOpen(true);
    };

    const handleEditCompanySave = async () => {
        if (!editCompanyData.name.trim()) {
            alert('Company name cannot be empty');
            return;
        }

        try {
            await updateCompany(editCompanyData.id, editCompanyData);
            loadCompanies();
            resetCompanyForm();
            setIsAddCompanyDialogOpen(false);
        } catch (error) {
            console.error('Failed to update company:', error);
            alert('Failed to update company');
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            try {
                await deleteCompany(companyId);
                loadCompanies();
            } catch (error) {
                console.error('Failed to delete company:', error);
                alert('Failed to delete company');
            }
        }
    };

    const resetCompanyForm = () => {
        setEditCompanyData(null);
        setNewCompanyName('');
        setNewCompanyAddress('');
        setNewCompanyIndustry('');
        setNewCompanyWebsite('');
    };

    // Manage Company Pagination handlers
    const handleManageCompaniesChangePage = (event, newPage) => {
        setManageCompaniesPage(newPage);
    };
    const handleManageCompaniesChangeRowsPerPage = (event) => {
        setManageCompaniesRowsPerPage(parseInt(event.target.value, 10));
        setManageCompaniesPage(0);
    };


    const tabs = [
        { label: 'Home', path: '/home'},
        { label: 'Assessment Overview', path: '/root-dashboard' },
        { label: '360 Degree Assessment', path: '/edit-assessments' },
        { label: 'Users Management', path: '/users' },
        { label: 'Settings', path: '/settings' },
        { label: 'Reports', path: '/reports' },
    ];

    const handleCompanyChange = async (event) =>{
        const tmpCompanyID = event.target.value;
        setNewUserCompanyId(tmpCompanyID);
        setSelectedCoachId(''); // Reset coach selection when company changes

        /*if(newUserRole==='leader' && tmpCompanyID){
            try{
                const tmpCoachesV1 = companyCoachDetails
                .filter(c => c.company_id === tmpCompanyID)
                .map(c => ({
                    id: c.coach_id,
                    name: c.coach_name,
                }));
                setFilteredCoachesForAddUser(tmpCoachesV1);
            }  catch(error){
                console.error('Failed to fetch coaches for the selected company: ', error)
            }
        }*/
    };

    const handleCompanyChangeEditUser = async (event) => {
        const selectedCompanyId = event.target.value; // Get selected company ID
        //console.log(selectedCompanyId);
        //setEditUserData({ ...editUserData, company_id: selectedCompanyId }); // Update company in user data - Causing an update problem the coaches are updates for the new company but the company is later set to original company
        setAvailableCoachesavailableCoaches([]); // Clear existing filtered coaches
        
            try {
            // Filter coaches based on the selected company
            const filteredCoaches = companyCoachDetails
                .filter((coach) => coach.company_id === selectedCompanyId)
                .map((coach) => ({ id: coach.coach_id, name: coach.coach_name }));
                //console.log(filteredCoaches);

        //setEditUserData({ ...editUserData, coach_id: '' }); // Reset selected coach - Causing an update problem the coaches are updates for the new company but the company is later set to original company
        // Update both company_id and coach_id in a single state update
        setEditUserData((prevState) => ({
            ...prevState,
            company_id: selectedCompanyId,
            coach_id: '', // Reset selected coach
        }));
            setAvailableCoachesavailableCoaches(filteredCoaches); // Update state with filtered coaches
            } catch (error) {
            console.error('Failed to fetch or filter coaches:', error);
            }
        };
    
    /*Obselete - All the handling code ManageCompanyUsersForm is shifted to ManageCompanyUsersForm
        // handleCompanyChange code is being used for the handling of filtering coaches as per the company, And not used for ManageCompanyUsersForm
        const handleCompanyChange = (event) => { 
            setUserGroupSelectedCompanyId(event.target.value);
            const filteredUsers = users.filter(user => user.company_id === event.target.value);
            setCompanyUsers(filteredUsers);
        };

        const handleUpdateCompanyUser = async (userId, newValue, updateType) => {
            try {
                await updateCompanyUser(userId, newValue, updateType);
                loadUsers();
                setUpdateTrigger(prev => !prev);
            } catch (error) {
                alert(`Failed to update company user: ${error}`);
            }
        };
    */
    const generateCSV = (user) => {
        const headers = ['Name', 'Email', 'Phone Number', 'Password'];
        const data = [user.name, user.email, user.phone_no, user.password]; // Password is masked for security
        return `${headers.join(',')}\n${data.join(',')}`;
        };
    const handleDownload = (user) => {
        if (user.role !== 'coach') return;
    
        const csvContent = generateCSV(user);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${user.name}_details.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div>
            <DashboardLayout tabs={tabs} onLogout={onLogout} />
            <Typography variant="h4" gutterBottom sx={{ color: '#263d9d' }}>USERS MANAGEMENT</Typography>
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* User Management Table */}
                    <Card sx={{ boxShadow: 3, flexBasis: '50%', maxWidth: '50%', padding: 2, backgroundColor: '#5a8354' }}>
                        <Typography variant="h5" sx={{ paddingBottom: 1, color: '#ffffff' }}>
                            Users Directory
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#d1dad6' }}>
                                        {/*<TableCell>ID</TableCell>*/}
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Phone Number</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                {/*<TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No users available</TableCell>
                                        </TableRow>
                                    ) : (
                                        users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                                                <TableRow key={user.id}>
                                                 <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.phone_no}</TableCell>
                                                <TableCell>{user.role || 'observer'}</TableCell>
                                                <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                                                    <Button color="primary" onClick={() => handleEditUser(user)} startIcon={<EditIcon />}></Button>
                                                    <Button color="secondary" onClick={() => handleOpenDeleteDialog(user.id, user.role || 'observer')} startIcon={<DeleteIcon />}></Button>
                                                    {user.role === 'coach' && (
                                                            <Button sx={{ padding: 0.5 }} color="default" onClick={() => handleDownload(user)} startIcon={<DownloadIcon />}></Button>
                                                        )}
                                                </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                    <TableBody>
                                        {displayedUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">No users available</TableCell>
                                            </TableRow>
                                        ) : (
                                            displayedUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.phone_no}</TableCell>
                                                    <TableCell>{user.role || 'observer'}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                                                            <Button 
                                                                color="primary" 
                                                                onClick={() => handleEditUser(user)} 
                                                                startIcon={<EditIcon />}
                                                            />
                                                            <Button 
                                                                color="secondary" 
                                                                onClick={() => handleOpenDeleteDialog(user.id, user.role || 'observer')} 
                                                                startIcon={<DeleteIcon />}
                                                            />
                                                            {user.role === 'coach' && (
                                                                <Button 
                                                                    sx={{ padding: 0.5 }} 
                                                                    color="default" 
                                                                    onClick={() => handleDownload(user)} 
                                                                    startIcon={<DownloadIcon />}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>*/}
                                    <TableBody>
                                        {displayedUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">No users available</TableCell>
                                            </TableRow>
                                        ) : (
                                            displayedUsers.map((user) => (
                                                <TableRow key={user.uniqueKey}> {/* Use the new uniqueKey */}
                                                    <TableCell>{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.phone_no}</TableCell>
                                                    <TableCell>{user.role}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                                                            <Button 
                                                                color="primary" 
                                                                onClick={() => handleEditUser(user)} 
                                                                startIcon={<EditIcon />}
                                                            />
                                                            <Button 
                                                                color="secondary" 
                                                                onClick={() => handleOpenDeleteDialog(user.id, user.role)} 
                                                                startIcon={<DeleteIcon />}
                                                            />
                                                            {user.role === 'coach' && (
                                                                <Button 
                                                                    sx={{ padding: 0.5 }} 
                                                                    color="default" 
                                                                    onClick={() => handleDownload(user)} 
                                                                    startIcon={<DownloadIcon />}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={users.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 15]}
                            />
                        </TableContainer>
                    </Card>

                        {/* Add User Form */}
                        <Box sx={{ flexBasis: '50%', maxWidth: '50%', position: 'relative', minHeight: 200 }}>
                            {!isFormOpen && !isManageCompaniesOpen && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setIsFormOpen(true)}
                                    sx={{ backgroundColor: "#263d9d", position: 'absolute', top: 6, right: 350 }}
                                >
                                    Add User
                                </Button>
                            )}
                            {isFormOpen && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            >
                            <Box sx={{ backgroundColor: '#5a8354',
                                boxShadow: 3,
                                borderRadius:1,
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                padding: 2,  flexDirection: 'column'  }}>
                            <Typography variant="h6" gutterBottom>Add User</Typography>

                            <Card sx={{ boxShadow: 3, padding: 7 , maxWidth: '90%'}}>
                                
                                <IconButton
                                    onClick={toggleFormVisibility}
                                    sx={{ position: 'absolute', top: 4, right: 16, color: 'white' }}
                                >
                                    <MinimizeIcon />
                                </IconButton>
                                {!showAdditionalFields && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                    {/* Role Selection */}
                                    <Box sx={{ width: '300px' }}> {/* Set an appropriate width for visibility */}
                                        <FormControl variant="outlined" margin="normal" fullWidth>
                                            <InputLabel>Role</InputLabel>
                                            <Select 
                                                value={newUserRole} 
                                                onChange={(e) => { 
                                                    setNewUserRole(e.target.value); 
                                                    setShowAdditionalFields(true); 
                                                }} 
                                                label="Role"
                                            >
                                                <MenuItem value="none">None</MenuItem>
                                                <MenuItem value="coach">Coach</MenuItem>
                                                <MenuItem value="observer">Observer</MenuItem>
                                                <MenuItem value="leader">Leader</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>                                

                                )}
                            {showAdditionalFields && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                    {/* First Column */}
                                    <Box sx={{ flexBasis: '50%' }}>
                                        <TextField
                                            label="Name"
                                            variant="outlined"
                                            margin="normal"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Email"
                                            variant="outlined"
                                            margin="normal"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Phone Number"
                                            variant="outlined"
                                            margin="normal"
                                            value={newUserPhoneNumber}
                                            onChange={(e) => setNewUserPhoneNumber(e.target.value)}
                                            fullWidth
                                        />
                                        {showAdditionalFields && (newUserRole === 'leader' || newUserRole === 'observer') && (
                                            <FormControl variant="outlined" margin="normal" fullWidth>
                                                <InputLabel>Survey Version</InputLabel>
                                                <Select
                                                    //value={version}
                                                    value={newUserRole === 'observer' ? selectedLeaderVersion : version}
                                                    onChange={(e) => setVersion(e.target.value)}
                                                    label="Survey Version"
                                                    disabled={newUserRole === 'observer'}
                                                >
                                                    {availableVersions.map((ver) => (
                                                        <MenuItem key={ver} value={ver}>Version {ver}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                        <Box sx={{display:'flex', alignItems:'center',gap:1}}>
                                            <FormControl variant="outlined" margin="normal" fullWidth>
                                                <InputLabel>Company</InputLabel>
                                                <Select
                                                    value={newUserCompanyId}
                                                    onChange={handleCompanyChange}
                                                    // onChange = {(e) => setNewUserCompanyId(e.target.value)} // moved to handleCompanyChange function
                                                    label="Company"
                                                    disabled={newUserRole === 'observer'}
                                                >
                                                    {companies.map((company) => (
                                                        <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <IconButton
                                                color="primary"
                                                onClick={()=>setIsAddCompanyDialogOpen(true)}
                                            >
                                                <AddIcon/>
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    
                                    {/* Second Column */}
                                    <Box sx={{ flexBasis: '50%' }}>
                                        <FormControl variant="outlined" margin="normal" fullWidth>
                                            <InputLabel>Role</InputLabel>
                                            <Select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} label="Role">
                                                <MenuItem value="none">None</MenuItem>
                                                <MenuItem value="coach">Coach</MenuItem>
                                                <MenuItem value="observer">Observer</MenuItem>
                                                <MenuItem value="leader">Leader</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {(newUserRole === 'leader' || newUserRole === 'observer') && (
                                            <>
                                                <TextField
                                                    label="Start Date"
                                                    type="date"
                                                    variant="outlined"
                                                    margin="normal"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    fullWidth
                                                    sx={{
                                                        '& .MuiInputBase-input': {
                                                            paddingTop: 2,
                                                            paddingBottom: 2,
                                                        }
                                                    }}
                                                />
                                                <TextField
                                                    label="End Date"
                                                    type="date"
                                                    variant="outlined"
                                                    margin="normal"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    fullWidth
                                                    sx={{
                                                        '& .MuiInputBase-input': {
                                                            paddingTop: 2,
                                                            paddingBottom: 2,
                                                        }
                                                    }}
                                                />
                                                {newUserRole === 'observer' && (
                                                    <FormControl variant="outlined" margin="normal" fullWidth>
                                                        <InputLabel>Sub-role</InputLabel>
                                                        <Select
                                                            value={subRole}
                                                            onChange={(e) => setSubRole(e.target.value)}
                                                            label="Sub-role"
                                                        >
                                                            <MenuItem value="Co-Worker">Co-Worker</MenuItem>
                                                            <MenuItem value="Manager">Manager</MenuItem>
                                                            <MenuItem value="Direct Report">Direct Report</MenuItem>
                                                            <MenuItem value="Other">Other</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                )}

                                                {newUserRole === 'observer' && (
                                                    <FormControl variant="outlined" margin="normal" fullWidth>
                                                        <InputLabel>Leader</InputLabel>
                                                        <Select 
                                                            value={selectedLeaderId} 
                                                            onChange={(e) => {
                                                                const leaderId = e.target.value;
                                                                setSelectedLeaderId(leaderId);
                                                                // Automatically set the company of the observer based on selected leader
                                                                const selectedLeader = leaders.find((leader) => leader.id === leaderId);
                                                                if (selectedLeader) {
                                                                    setNewUserCompanyId(selectedLeader.company_id);
                                                                    setVersion(selectedLeader.version || '1'); // Set version from leader
                                                                    setSelectedLeaderVersion(selectedLeader.Version || '1');
                                                                }
                                                            }}
                                                            label="Leader"
                                                        >
                                                            {leaders.map((leader) => (
                                                                <MenuItem key={leader.id} value={leader.id}>{leader.name}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                                
                                                {newUserRole === 'leader' && newUserCompanyId && (
                                                    <FormControl variant="outlined" margin="normal" fullWidth>
                                                        <InputLabel>Coach</InputLabel>
                                                        <Select value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)} label="Coach">
                                                            {filteredCoachesForAddUser.map((coach) => (
                                                                <MenuItem key={coach.id} value={coach.id}>{coach.name}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                    </Box>
                                    )}
                                    {showAdditionalFields && (
                                    <Button variant="contained" onClick={handleAddUser} sx={{ backgroundColor: "#263d9d", ml: 2 }}>
                                        Add User
                                    </Button>
                                )}
                            </Card>
                            </Box>
                            </motion.div>
                            )}
                            {/* Button to manage companies */}
                            {!isManageCompaniesOpen && !isFormOpen && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={toggleManageCompaniesVisibility}
                                    sx={{ backgroundColor: "#263d9d", position: 'absolute', top: 6, right: 100 }}
                                >
                                    Manage Companies
                                </Button>
                            )}
                            {isManageCompaniesOpen && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                >
                                    <Box sx={{ backgroundColor: '#5a8354',
                                            boxShadow: 3,
                                            borderRadius: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: 2,
                                            //maxHeight: '500px',
                                            position: 'relative',
                                            overflow: 'auto'  }}
                                    >
                                        <Typography variant="h5" sx={{ paddingBottom: 1}}>Manage Companies</Typography>

                                        {/*<Card sx={{ boxShadow: 3, padding: 2, mt: 4 }}>*/}
                                            <IconButton
                                                onClick={toggleFormVisibilityManageCompanies}
                                                sx={{ position: 'absolute', top: 4, right: 16, color: 'white' }}
                                            >
                                                <MinimizeIcon />
                                            </IconButton>

                                            <TableContainer component={Paper}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#d1dad6' }}>
                                                            {/*<TableCell>ID</TableCell>*/}
                                                            <TableCell>Name</TableCell>
                                                            <TableCell>Address</TableCell>
                                                            <TableCell>Industry</TableCell>
                                                            <TableCell>Website</TableCell>
                                                            <TableCell>Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {companies.slice(manageCompaniesPage * manageCompaniesRowsPerPage, manageCompaniesPage * manageCompaniesRowsPerPage + manageCompaniesRowsPerPage).map((company) => (
                                                            <TableRow key={company.id}>
                                                                {/*<TableCell>{company.id}</TableCell>*/}
                                                                <TableCell>{company.name}</TableCell>
                                                                <TableCell>{company.address}</TableCell>
                                                                <TableCell>{company.industry}</TableCell>
                                                                <TableCell>{company.website}</TableCell>
                                                                <TableCell>
                                                                    <Button color="primary" onClick={() => handleEditCompany(company)} startIcon={<EditIcon />}></Button>
                                                                    <Button color="secondary" onClick={() => handleDeleteCompany(company.id)} startIcon={<DeleteIcon />}></Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                <TablePagination
                                                    component="div"
                                                    count={companies.length}
                                                    page={manageCompaniesPage}
                                                    onPageChange={handleManageCompaniesChangePage}
                                                    rowsPerPage={manageCompaniesRowsPerPage}
                                                    onRowsPerPageChange={handleManageCompaniesChangeRowsPerPage}
                                                    rowsPerPageOptions={[4, 8, 12]}
                                                />
                                            </TableContainer>
                                            
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={handleAddCompanyDialogOpen}
                                                sx={{ backgroundColor: "#263d9d", position: 'absolute', bottom: 20, left: 20 }}
                                            >
                                                Add Company
                                            </Button>
                                        {/*</Card>*/}
                                    </Box>
                                </motion.div>
                            )}
                            
                        </Box>
                    
                </Box>
                <ManageCompanyUsersForm
                    // this all parts are shifted to ManageCompanyUsersFormV1
                    leaders = {leaders}
                    //companies={companies}
                    //selectedCompanyId={userGroupSelectedCompanyId}
                    //handleCompanyChange={handleCompanyChange}
                    //companyUsers={companyUsers}
                    //handleUpdateCompanyUser={handleUpdateCompanyUser}
                    coaches={coaches}
                    refreshCompanies={refreshCompanies}
                    companyCoachDetails={companyCoachDetails}
                    setCompanyCoachDetails={setCompanyCoachDetails}
                />
            </Container>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onClose={handleEditDialogClose}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        variant="outlined"
                        margin="normal"
                        value={editUserData.name || ''}
                        onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Email"
                        variant="outlined"
                        margin="normal"
                        value={editUserData.email || ''}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Phone Number"
                        variant="outlined"
                        margin="normal"
                        value={editUserData.phone_no || ''}
                        onChange={(e) => setEditUserData({ ...editUserData, phone_no: e.target.value })}
                        fullWidth
                    />
                    {/*{editUserData.role !== 'observer' && (*/}
                       {/* <FormControl variant="outlined" margin="normal" fullWidth>
                            <InputLabel>Company</InputLabel>
                            <Select
                                value={editUserData.company_id || ''}
                                onChange={(e) => setEditUserData({ ...editUserData, company_id: e.target.value })}
                                label="Company"
                                disabled={editUserData.role === 'observer' || editUserData.role ==='coach' }
                            >
                                {companies.map((company) => (
                                    <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>*/}
                    {/*)}*/}
                    <FormControl variant="outlined" margin="normal" fullWidth>
                        <InputLabel>Company</InputLabel>
                        <Select
                            value={editUserData.company_id || ''}
                            onChange={handleCompanyChangeEditUser} // Attach dynamic handler
                            label="Company"
                            disabled={editUserData.role === 'observer' || editUserData.role === 'coach'}
                        >
                            {companies.map((company) => (
                            <MenuItem key={company.id} value={company.id}>
                                {company.name}
                            </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl variant="outlined" margin="normal" fullWidth>
                        <InputLabel>Coach</InputLabel>
                        <Select
                            value={editUserData.coach_id || ''}
                            onChange={(e) =>
                            setEditUserData({ ...editUserData, coach_id: e.target.value })
                            }
                            label="Coach"
                            disabled={!availableCoachesForEditUser.length && editUserData.role !== 'leader'}
                        >
                            {availableCoachesForEditUser.map((coach) => (
                            <MenuItem key={coach.id} value={coach.id}>
                                {coach.name}
                            </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {editUserData.role === 'leader' && (
                            <FormControl variant="outlined" margin="normal" fullWidth>
                                <InputLabel>Survey Version</InputLabel>
                                <Select
                                    value={editUserData.Version || '1'}
                                    onChange={(e) => setEditUserData({ 
                                        ...editUserData, 
                                        Version: e.target.value 
                                    })}
                                    label="Survey Version"
                                >
                                    {availableVersions.map((ver) => (
                                        <MenuItem key={ver} value={ver}>
                                            Version {ver}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditDialogClose} color="secondary">Cancel</Button>
                    <Button onClick={handleEditUserSave} color="primary">Save</Button>
                </DialogActions>
            </Dialog>
            
            <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this user? 
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteUser} color="primary">
                        Yes, Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isAddCompanyDialogOpen} onClose={()=>setIsAddCompanyDialogOpen(false)}>
                <DialogTitle>Add New Company [ *if not in list ]</DialogTitle>
                <DialogContent>
                <TextField
                        label="Company Name"
                        variant="outlined"
                        margin="normal"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Address"
                        variant="outlined"
                        margin="normal"
                        value={newCompanyAddress}
                        onChange={(e) => setNewCompanyAddress(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Industry"
                        variant="outlined"
                        margin="normal"
                        value={newCompanyIndustry}
                        onChange={(e) => setNewCompanyIndustry(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Website"
                        variant="outlined"
                        margin="normal"
                        value={newCompanyWebsite}
                        onChange={(e) => setNewCompanyWebsite(e.target.value)}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddCompanyDialogOpen(false)} color="secondary">Cancel</Button>
                    <Button onClick={handleAddCompany} color="primary">Add</Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Company Dialog */}
            <Dialog open={isAddCompanyDialogOpen} onClose={() => setIsAddCompanyDialogOpen(false)}>
                <DialogTitle>{editCompanyData ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Company Name"
                        variant="outlined"
                        margin="normal"
                        value={editCompanyData ? editCompanyData.name : newCompanyName}
                        onChange={(e) => editCompanyData ? setEditCompanyData({ ...editCompanyData, name: e.target.value }) : setNewCompanyName(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Address"
                        variant="outlined"
                        margin="normal"
                        value={editCompanyData ? editCompanyData.address : newCompanyAddress}
                        onChange={(e) => editCompanyData ? setEditCompanyData({ ...editCompanyData, address: e.target.value }) : setNewCompanyAddress(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Industry"
                        variant="outlined"
                        margin="normal"
                        value={editCompanyData ? editCompanyData.industry : newCompanyIndustry}
                        onChange={(e) => editCompanyData ? setEditCompanyData({ ...editCompanyData, industry: e.target.value }) : setNewCompanyIndustry(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Website"
                        variant="outlined"
                        margin="normal"
                        value={editCompanyData ? editCompanyData.website : newCompanyWebsite}
                        onChange={(e) => editCompanyData ? setEditCompanyData({ ...editCompanyData, website: e.target.value }) : setNewCompanyWebsite(e.target.value)}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddCompanyDialogOpen(false)} color="secondary">Cancel</Button>
                    <Button onClick={editCompanyData ? handleEditCompanySave : handleAddCompany} color="primary">{editCompanyData ? 'Save' : 'Add'}</Button>
                </DialogActions>
            </Dialog>

            {/*Email Invitation Dialog*/}
            <InvitationEmailDialog
                open={isEmailDialogOpen}
                onClose={() => setIsEmailDialogOpen(false)}
                role={emailDialogData.role}
                name={emailDialogData.name}
                email={emailDialogData.email}
                link={emailDialogData.link}
                auth_code={emailDialogData.auth_code}
                Coach={emailDialogData.Coach}
                Leader={emailDialogData.Leader}
            />

        </div>
    );
}

export default UserManagement;
