import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Divider,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { checkEmailExists, formatPhoneNumber, updateContactReferral } from '../../services/UserManagement/ContactReferralService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ContactReferralPage = () => {
  const [primaryContact, setPrimaryContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    fullPhone: '',
    whatsapp: '',
    preferredContact: '',
    typeOfInstitution: '',
    institutionName: '',
    title: '',
    physicalAddress: '',
    country: ''
  });

  const [referrals, setReferrals] = useState([]);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [institutionTypes, setInstitutionTypes] = useState([]);
  const [emailCheckDialog, setEmailCheckDialog] = useState({ open: false, data: null, isReferral: false, referralId: null });
  const [countryCode, setCountryCode] = useState('+254'); // Default to Kenya

  // Track if data is from existing record
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [originalPrimaryContact, setOriginalPrimaryContact] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [existingSubReferralIds, setExistingSubReferralIds] = useState(new Map());
  const [originalReferrals, setOriginalReferrals] = useState(new Map());
  const [referralChanges, setReferralChanges] = useState(new Map());

  // Fetch organization types from API on component mount
  useEffect(() => {
    const fetchOrganizationTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/organization-types`);

        // Filter to only show churches, institution, and non_formal_organizations
        const allowedTypes = ['church', 'institution', 'non_formal_organizations'];
        const filteredTypes = response.data.organization_types
          .filter(orgType => allowedTypes.includes(orgType.type.toLowerCase()))
          .map(orgType => ({
            id: orgType.id,
            type: orgType.type,
            // Custom display names: "Organization" for non_formal_organizations
            displayName: orgType.type.toLowerCase() === 'non_formal_organizations'
              ? 'Organization'
              : orgType.type.charAt(0).toUpperCase() + orgType.type.slice(1)
          }));

        setInstitutionTypes(filteredTypes);
      } catch (error) {
        console.error('Error fetching organization types:', error);
        // Fallback to default types if API fails
        setInstitutionTypes([
          { id: 1, type: 'church', displayName: 'Church' },
          { id: 2, type: 'Institution', displayName: 'Institution' },
          { id: 3, type: 'Non_formal_organizations', displayName: 'Organization' }
        ]);
      }
    };

    fetchOrganizationTypes();
  }, []);

  const contactMethods = ['Email', 'Phone', 'WhatsApp'];

  const handlePrimaryContactChange = async (field, value) => {
    setPrimaryContact(prev => {
      const updated = { ...prev, [field]: value };

      // Check if there are changes from original
      if (originalPrimaryContact && existingRecordId) {
        const changed = Object.keys(updated).some(key =>
          updated[key] !== originalPrimaryContact[key]
        );
        setHasChanges(changed);
      }

      return updated;
    });

    // Check email when it's changed and valid
    if (field === 'email' && value && value.includes('@')) {
      await checkEmail(value, false, null);
    }

    // Format phone number when it changes
    if (field === 'fullPhone' && value) {
      const formatted = formatPhoneNumber(value, countryCode);
      if (formatted !== value) {
        setPrimaryContact(prev => ({ ...prev, fullPhone: formatted }));
      }
    }
  };

  const handleUpdatePrimaryContact = async () => {
    if (!existingRecordId) return;

    setLoading(true);
    try {
      const response = await updateContactReferral(existingRecordId, primaryContact);

      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Contact information updated successfully!',
          severity: 'success'
        });

        // Update the original data to reflect the new state
        setOriginalPrimaryContact({ ...primaryContact });
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      setSnackbar({
        open: true,
        message: 'Error updating contact information. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReferral = async (tempId) => {
    const actualId = existingSubReferralIds.get(tempId);
    if (!actualId) return;

    const referral = referrals.find(r => r.id === tempId);
    if (!referral) return;

    setLoading(true);
    try {
      const response = await updateContactReferral(actualId, referral);

      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Referral updated successfully!',
          severity: 'success'
        });

        // Update the original data to reflect the new state
        setOriginalReferrals(prev => {
          const newMap = new Map(prev);
          newMap.set(tempId, { ...referral });
          return newMap;
        });

        // Clear the change flag
        setReferralChanges(prev => {
          const newMap = new Map(prev);
          newMap.set(tempId, false);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      setSnackbar({
        open: true,
        message: 'Error updating referral. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrimaryContact = async () => {
    // Validate required fields
    if (!primaryContact.firstName || !primaryContact.lastName || !primaryContact.email) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields (First Name, Last Name, Email)',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/contact-referrals`, {
        primary_contact: primaryContact,
        referrals: []
      });

      // After successful save, treat it as an existing record
      if (response.data.primary_contact_id) {
        setExistingRecordId(response.data.primary_contact_id);
        setOriginalPrimaryContact({ ...primaryContact });
        setHasChanges(false);
      }

      setSnackbar({
        open: true,
        message: 'Contact information saved successfully!',
        severity: 'success'
      });
      setShowReferralForm(true);
    } catch (error) {
      console.error('Error saving contact:', error);
      setSnackbar({
        open: true,
        message: 'Error saving contact information. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const addReferral = () => {
    setReferrals([...referrals, {
      id: Date.now(),
      firstName: '',
      lastName: '',
      email: '',
      fullPhone: '',
      whatsapp: '',
      preferredContact: '',
      typeOfInstitution: '',
      institutionName: '',
      title: '',
      physicalAddress: '',
      country: ''
    }]);
  };

  const removeReferral = (id) => {
    setReferrals(referrals.filter(ref => ref.id !== id));
  };

  const handleReferralChange = async (id, field, value) => {
    // Build the updated referral first
    const updatedReferrals = referrals.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    );
    setReferrals(updatedReferrals);

    // Check if this is an existing referral and track changes
    if (existingSubReferralIds.has(id)) {
      const original = originalReferrals.get(id);
      const updated = updatedReferrals.find(r => r.id === id);
      if (original && updated) {
        // Compare all fields to detect any changes
        const changed = Object.keys(original).some(key =>
          key !== 'id' && updated[key] !== original[key]
        );

        setReferralChanges(prev => {
          const newMap = new Map(prev);
          newMap.set(id, changed);
          return newMap;
        });
      }
    }

    // Check email when it's changed and valid
    if (field === 'email' && value && value.includes('@')) {
      await checkEmail(value, true, id);
    }

    // Format phone number when it changes
    if (field === 'fullPhone' && value) {
      const formatted = formatPhoneNumber(value, countryCode);
      if (formatted !== value) {
        setReferrals(prev => prev.map(ref =>
          ref.id === id ? { ...ref, fullPhone: formatted } : ref
        ));
      }
    }
  };

  const checkEmail = async (email, isReferral, referralId) => {
    try {
      const result = await checkEmailExists(email);
      if (result.exists) {
        setEmailCheckDialog({
          open: true,
          data: result.data,
          source: result.source,
          referrer: result.referrer,
          subReferrals: result.subReferrals || [],
          original_contact_id: result.original_contact_id,
          isReferral,
          referralId
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleUseExistingData = () => {
    const { data, subReferrals, isReferral, referralId, original_contact_id } = emailCheckDialog;

    if (isReferral && referralId) {
      setReferrals(referrals.map(ref =>
        ref.id === referralId ? { ...ref, ...data } : ref
      ));
    } else {
      // Store the existing record ID and original data
      setExistingRecordId(original_contact_id);
      setOriginalPrimaryContact({ ...data });
      setHasChanges(false);

      // Populate primary contact
      setPrimaryContact(prev => ({ ...prev, ...data }));

      // Populate sub-referrals if they exist
      if (subReferrals && subReferrals.length > 0) {
        const subRefIdMap = new Map();
        const originalRefMap = new Map();
        const newReferrals = subReferrals.map((subRef, index) => {
          const tempId = Date.now() + index;
          if (subRef.id) {
            subRefIdMap.set(tempId, subRef.id);
            originalRefMap.set(tempId, { ...subRef });
          }
          return {
            ...subRef,
            id: tempId  // Override the database id with tempId so our Map lookups work
          };
        });
        setReferrals(newReferrals);
        setExistingSubReferralIds(subRefIdMap);
        setOriginalReferrals(originalRefMap);
        setShowReferralForm(true);
      }
    }

    setEmailCheckDialog({ open: false, data: null, isReferral: false, referralId: null });

    const message = subReferrals && subReferrals.length > 0
      ? `Existing data populated successfully with ${subReferrals.length} sub-referral(s)`
      : 'Existing data populated successfully';

    setSnackbar({
      open: true,
      message,
      severity: 'info'
    });
  };

  const handleContinueWithNew = () => {
    setEmailCheckDialog({ open: false, data: null, isReferral: false, referralId: null });
  };

  const handleSubmitAll = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/contact-referrals`, {
        primary_contact: primaryContact,
        referrals: referrals
      });

      setSnackbar({
        open: true,
        message: 'All contacts submitted successfully!',
        severity: 'success'
      });

      // Reset form after successful submission
      setTimeout(() => {
        setPrimaryContact({
          firstName: '',
          lastName: '',
          email: '',
          fullPhone: '',
          whatsapp: '',
          preferredContact: '',
          typeOfInstitution: '',
          institutionName: '',
          title: '',
          physicalAddress: '',
          country: ''
        });
        setReferrals([]);
        setShowReferralForm(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting contacts:', error);
      setSnackbar({
        open: true,
        message: 'Error submitting contacts. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContactForm = (contact, onChange, isReferral = false, referralId = null) => (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {/* Row 1 */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Email ID"
            type="email"
            value={contact.email}
            onChange={(e) => onChange(isReferral ? referralId : 'email', isReferral ? 'email' : e.target.value, isReferral ? e.target.value : null)}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="First Name"
            value={contact.firstName}
            onChange={(e) => onChange(isReferral ? referralId : 'firstName', isReferral ? 'firstName' : e.target.value, isReferral ? e.target.value : null)}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Last Name"
            value={contact.lastName}
            onChange={(e) => onChange(isReferral ? referralId : 'lastName', isReferral ? 'lastName' : e.target.value, isReferral ? e.target.value : null)}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Country Code"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            size="small"
            placeholder="+254"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Full Phone"
            value={contact.fullPhone}
            onChange={(e) => onChange(isReferral ? referralId : 'fullPhone', isReferral ? 'fullPhone' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="WhatsApp"
            value={contact.whatsapp}
            onChange={(e) => onChange(isReferral ? referralId : 'whatsapp', isReferral ? 'whatsapp' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            label="Preferred Contact"
            value={contact.preferredContact}
            onChange={(e) => onChange(isReferral ? referralId : 'preferredContact', isReferral ? 'preferredContact' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          >
            {contactMethods.map(method => (
              <MenuItem key={method} value={method}>{method}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            label="Type of Institution"
            value={contact.typeOfInstitution}
            onChange={(e) => onChange(isReferral ? referralId : 'typeOfInstitution', isReferral ? 'typeOfInstitution' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          >
            {institutionTypes.map(type => (
              <MenuItem key={type.id} value={type.type}>{type.displayName}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Institution Name"
            value={contact.institutionName}
            onChange={(e) => onChange(isReferral ? referralId : 'institutionName', isReferral ? 'institutionName' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Title"
            value={contact.title}
            onChange={(e) => onChange(isReferral ? referralId : 'title', isReferral ? 'title' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Physical Address"
            value={contact.physicalAddress}
            onChange={(e) => onChange(isReferral ? referralId : 'physicalAddress', isReferral ? 'physicalAddress' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Country"
            value={contact.country}
            onChange={(e) => onChange(isReferral ? referralId : 'country', isReferral ? 'country' : e.target.value, isReferral ? e.target.value : null)}
            size="small"
          />
        </Grid>
        {isReferral && (
          <Grid item xs={12} sm={6} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="error"
              onClick={() => removeReferral(referralId)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src="/assets/actea-logo.png"
                alt="ACTEA Logo"
                style={{ height: '80px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Box>
                <Typography variant="h4" sx={{ color: '#633394', fontWeight: 'bold' }}>
                  Welcome and thank you for collaborating with us.
                </Typography>
                <Typography variant="h6" sx={{ color: '#633394', mt: 1 }}>
                  Kindly share your contact information and then the contact information
                  for others you recommend we collaborate with.
                </Typography>
              </Box>
            </Box>
            <img
              src="/assets/saurara-high-resolution-logo-transparent.png"
              alt="Saurara Logo"
              style={{ height: '60px' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Box>
        </Paper>

        {/* Primary Contact Form */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#633394', fontWeight: 'bold' }}>
            Your Contact Information
          </Typography>

          {renderContactForm(primaryContact, handlePrimaryContactChange)}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {existingRecordId ? (
              // Show UPDATE button after save or when editing existing record
              <Button
                variant="contained"
                onClick={handleUpdatePrimaryContact}
                disabled={loading || !hasChanges}
                startIcon={<EditIcon />}
                sx={{
                  backgroundColor: hasChanges ? '#ff9800' : '#9e9e9e',
                  '&:hover': { backgroundColor: hasChanges ? '#f57c00' : '#757575' },
                  px: 4
                }}
              >
                {hasChanges ? 'Update' : 'No Changes'}
              </Button>
            ) : (
              // Show SAVE button for new records
              <Button
                variant="contained"
                onClick={handleSavePrimaryContact}
                disabled={loading}
                sx={{
                  backgroundColor: '#633394',
                  '&:hover': { backgroundColor: '#4a2570' },
                  px: 4
                }}
              >
                Save
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => {
                setShowReferralForm(true);
                addReferral();
              }}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: '#633394',
                '&:hover': { backgroundColor: '#4a2570' },
                px: 4
              }}
            >
              Refer a Contact
            </Button>
          </Box>
        </Paper>

        {/* Referrals Section */}
        {showReferralForm && referrals.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#633394', fontWeight: 'bold' }}>
              Referred Contacts
            </Typography>
            {referrals.map((referral, index) => {
              const isExisting = existingSubReferralIds.has(referral.id);
              const hasReferralChanges = referralChanges.get(referral.id) || false;

              return (
                <Box key={referral.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: '#633394' }}>
                      Referral {index + 1} {isExisting && <span style={{ fontSize: '0.8em', color: '#ff9800' }}>(Existing)</span>}
                    </Typography>
                    {isExisting && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUpdateReferral(referral.id)}
                        disabled={loading || !hasReferralChanges}
                        startIcon={<EditIcon />}
                        sx={{
                          backgroundColor: hasReferralChanges ? '#ff9800' : '#9e9e9e',
                          '&:hover': { backgroundColor: hasReferralChanges ? '#f57c00' : '#757575' },
                          px: 2
                        }}
                      >
                        {hasReferralChanges ? 'Update' : 'No Changes'}
                      </Button>
                    )}
                  </Box>
                  {renderContactForm(
                    referral,
                    (id, field, value) => handleReferralChange(id, field, value),
                    true,
                    referral.id
                  )}
                  {index < referrals.length - 1 && <Divider sx={{ my: 3 }} />}
                </Box>
              );
            })}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={addReferral}
                startIcon={<AddIcon />}
                sx={{
                  borderColor: '#633394',
                  color: '#633394',
                  '&:hover': {
                    borderColor: '#4a2570',
                    backgroundColor: 'rgba(99, 51, 148, 0.04)'
                  }
                }}
              >
                Add Another
              </Button>

              {existingRecordId ? (
                <Alert severity="info" sx={{ flex: 1, mx: 2 }}>
                  Viewing existing records. Modify fields and click UPDATE to save changes. You can add new sub-referrals using "Add Another".
                </Alert>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmitAll}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#633394',
                    '&:hover': { backgroundColor: '#4a2570' },
                    px: 4
                  }}
                >
                  Submit All
                </Button>
              )}
            </Box>
          </Paper>
        )}

        {/* Information Box */}
        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
          <Typography variant="body1" sx={{ color: '#333', lineHeight: 1.8 }}>
            <strong>Note:</strong> Once a person shares their contact information and saves it,
            the button to <strong>Refer a Contact</strong> will appear. Then a new blank record
            will appear below to add the same information they entered about themselves for the
            contact they are (recommending/referring). The form will capture date, time and device
            level information from the user including their location and country. Each new referred
            contact will be added to the database and include the (lead source or person who made
            the referral).
          </Typography>
        </Paper>

        {/* Email Duplicate Check Dialog */}
        <Dialog
          open={emailCheckDialog.open}
          onClose={handleContinueWithNew}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon />
            Email Already Exists
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This email address already exists in our {emailCheckDialog.source === 'user' ? 'users database' : 'contact referrals'}.
              {emailCheckDialog.isReferral && emailCheckDialog.referrer && (
                <Box sx={{ mt: 1, fontWeight: 'bold', color: '#633394' }}>
                  Note: This person will be linked as a referral to {emailCheckDialog.referrer.name} who originally entered this email.
                </Box>
              )}
            </Alert>

            {emailCheckDialog.data && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Existing Record:</strong>
                </Typography>
                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2"><strong>Name:</strong> {emailCheckDialog.data.firstName} {emailCheckDialog.data.lastName}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {emailCheckDialog.data.email}</Typography>
                  {emailCheckDialog.data.fullPhone && (
                    <Typography variant="body2"><strong>Phone:</strong> {emailCheckDialog.data.fullPhone}</Typography>
                  )}
                  {emailCheckDialog.data.institutionName && (
                    <Typography variant="body2"><strong>Institution:</strong> {emailCheckDialog.data.institutionName}</Typography>
                  )}
                  {emailCheckDialog.data.country && (
                    <Typography variant="body2"><strong>Country:</strong> {emailCheckDialog.data.country}</Typography>
                  )}
                </Box>

                {emailCheckDialog.referrer && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      📌 Originally entered by: {emailCheckDialog.referrer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1565c0' }}>
                      {emailCheckDialog.referrer.email}
                    </Typography>
                  </Box>
                )}

                {emailCheckDialog.subReferrals && emailCheckDialog.subReferrals.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ff9800' }}>
                    <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                      👥 This contact has {emailCheckDialog.subReferrals.length} existing sub-referral(s)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ef6c00', display: 'block', mt: 0.5 }}>
                      If you use existing data, all sub-referrals will be populated automatically.
                    </Typography>
                  </Box>
                )}

                <Typography variant="body1" sx={{ mt: 2 }}>
                  Would you like to use the existing data{emailCheckDialog.subReferrals && emailCheckDialog.subReferrals.length > 0 ? ' (including sub-referrals)' : ''} or continue with new information?
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleContinueWithNew} color="primary">
              Continue with New
            </Button>
            <Button
              onClick={handleUseExistingData}
              variant="contained"
              sx={{
                backgroundColor: '#633394',
                '&:hover': { backgroundColor: '#4a2570' }
              }}
            >
              Use Existing Data
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ContactReferralPage;
