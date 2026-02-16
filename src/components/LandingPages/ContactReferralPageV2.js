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
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Chip,
  Link as MuiLink,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  checkEmailExists,
  formatPhoneNumber,
  validateReferralCode,
  searchOrganizations
} from '../../services/UserManagement/ContactReferralService';
import { fetchTitles } from '../../services/UserManagement/UserManagementService';
import UserService from '../../services/Login/UserService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Steps
const STEP_EMAIL = 'email';
const STEP_LOGIN = 'login';
const STEP_REGISTER = 'register';

const ContactReferralPageV2 = () => {
  const { referralCode } = useParams();
  const navigate = useNavigate();

  // Referral info
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralValidating, setReferralValidating] = useState(false);

  // Flow state
  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Login state
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    fullPhone: '',
    whatsapp: '',
    sameAsPhone: false,
    institutionName: '',
    typeOfInstitution: '',
    physicalAddress: '',
    addressLine2: '',
    country: '',
    selectedOrganizationId: null,
  });

  // Organization search
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgSearchResults, setOrgSearchResults] = useState([]);
  const [orgSearchLoading, setOrgSearchLoading] = useState(false);
  const [showManualOrg, setShowManualOrg] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Form data
  const [institutionTypes, setInstitutionTypes] = useState([]);
  const [activeTitles, setActiveTitles] = useState([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+1');

  // Load organization types and titles on mount
  useEffect(() => {
    const fetchOrganizationTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/organization-types`);
        const allowedTypes = ['church', 'institution', 'non_formal_organizations'];
        const filteredTypes = response.data.organization_types
          .filter(orgType => allowedTypes.includes(orgType.type.toLowerCase()))
          .map(orgType => ({
            id: orgType.id,
            type: orgType.type,
            displayName: orgType.type.toLowerCase() === 'non_formal_organizations'
              ? 'Organization'
              : orgType.type.charAt(0).toUpperCase() + orgType.type.slice(1)
          }));
        setInstitutionTypes(filteredTypes);
      } catch (error) {
        console.error('Error fetching organization types:', error);
        setInstitutionTypes([
          { id: 1, type: 'church', displayName: 'Church' },
          { id: 2, type: 'Institution', displayName: 'Institution' },
          { id: 3, type: 'Non_formal_organizations', displayName: 'Organization' }
        ]);
      }
    };

    const loadTitles = async () => {
      try {
        const data = await fetchTitles();
        if (data && data.length > 0) {
          setActiveTitles(data.map(t => t.name));
        } else {
          setActiveTitles(['Manager', 'Director', 'Coordinator', 'Lead', 'Executive']);
        }
      } catch (error) {
        console.error('Failed to fetch titles', error);
        setActiveTitles(['Manager', 'Director', 'Coordinator', 'Lead', 'Executive']);
      }
    };

    fetchOrganizationTypes();
    loadTitles();
  }, []);

  // Validate referral code
  useEffect(() => {
    const validateCode = async () => {
      if (!referralCode) return;
      setReferralValidating(true);
      try {
        const result = await validateReferralCode(referralCode);
        if (result.valid) {
          setReferralInfo({
            referral_link_id: result.referral_link_id,
            referring_user: result.referring_user
          });
        } else {
          setSnackbar({
            open: true,
            message: 'This referral link is invalid or has expired.',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Error validating referral code:', error);
      } finally {
        setReferralValidating(false);
      }
    };
    validateCode();
  }, [referralCode]);

  // Organization search with debounce
  useEffect(() => {
    if (!orgSearchQuery || orgSearchQuery.length < 2) {
      setOrgSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setOrgSearchLoading(true);
      try {
        const result = await searchOrganizations(orgSearchQuery, 10);
        if (result.organizations) {
          setOrgSearchResults(result.organizations);
        }
      } catch (error) {
        console.error('Error searching organizations:', error);
      } finally {
        setOrgSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [orgSearchQuery]);

  // Handle email continue
  const handleEmailContinue = async () => {
    if (!email || !email.includes('@')) {
      setSnackbar({ open: true, message: 'Please enter a valid email address.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await checkEmailExists(email);

      if (result.exists && result.source === 'user') {
        // User exists in the system - show login
        setStep(STEP_LOGIN);
      } else if (result.exists && result.source === 'contact_referral') {
        // Contact referral exists - pre-populate and show registration
        const data = result.data || {};
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          title: data.title || '',
          fullPhone: data.fullPhone || '',
          whatsapp: data.whatsapp || '',
          institutionName: data.institutionName || '',
          typeOfInstitution: data.typeOfInstitution || '',
          physicalAddress: data.physicalAddress || '',
          country: data.country || '',
        }));
        setStep(STEP_REGISTER);
        setSnackbar({
          open: true,
          message: 'We found your previous submission. Your information has been pre-filled.',
          severity: 'info'
        });
      } else {
        // New user - show registration form
        setStep(STEP_REGISTER);
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Default to registration on error
      setStep(STEP_REGISTER);
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoading(true);
    setLoginError('');
    try {
      const response = await UserService.loginUser(email, password);
      const userData = response.data || response;

      // Store auth data
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.id) localStorage.setItem('userId', userData.id);
      if (userData.role) localStorage.setItem('userRole', userData.role);
      if (userData.organization_id) localStorage.setItem('organizationId', userData.organization_id);

      setSnackbar({ open: true, message: 'Login successful! Redirecting...', severity: 'success' });

      // Navigate based on role
      setTimeout(() => {
        switch (userData.role) {
          case 'admin': navigate('/admin'); break;
          case 'root': navigate('/root-dashboard'); break;
          case 'manager': navigate('/manager-dashboard'); break;
          case 'association': navigate('/association-dashboard'); break;
          default: navigate('/user');
        }
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field change
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Sync whatsapp when "same as phone" is checked
      if (field === 'sameAsPhone' && value === true) {
        updated.whatsapp = prev.fullPhone;
      }
      if (field === 'fullPhone' && prev.sameAsPhone) {
        updated.whatsapp = value;
      }

      return updated;
    });
  };

  // Handle registration submit
  const handleRegisterSubmit = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      setSnackbar({ open: true, message: 'Please fill in your first and last name.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Format phone numbers
      const formattedPhone = formData.fullPhone ? formatPhoneNumber(formData.fullPhone, phoneCountryCode) : '';
      const formattedWhatsapp = formData.whatsapp ? formatPhoneNumber(formData.whatsapp, whatsappCountryCode) : '';

      // Build physical address from two lines
      let fullAddress = formData.physicalAddress || '';
      if (formData.addressLine2) {
        fullAddress = fullAddress ? `${fullAddress}, ${formData.addressLine2}` : formData.addressLine2;
      }

      const payload = {
        primary_contact: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: email,
          fullPhone: formattedPhone,
          whatsapp: formattedWhatsapp,
          title: formData.title,
          typeOfInstitution: showManualOrg ? formData.typeOfInstitution : (selectedOrg ? '' : formData.typeOfInstitution),
          institutionName: showManualOrg ? formData.institutionName : (selectedOrg ? selectedOrg.name : ''),
          physicalAddress: showManualOrg ? fullAddress : (selectedOrg ? '' : fullAddress),
          country: showManualOrg ? formData.country : (selectedOrg ? '' : formData.country),
          selectedOrganizationId: selectedOrg ? selectedOrg.id : null,
        },
        referrals: []
      };

      if (referralCode) {
        payload.referral_code = referralCode;
      }
      if (referralInfo?.referral_link_id) {
        payload.referred_by_link_id = referralInfo.referral_link_id;
      }

      await axios.post(`${API_BASE_URL}/contact-referrals`, payload);

      setSnackbar({
        open: true,
        message: 'Your request has been submitted successfully! An administrator will review your application.',
        severity: 'success'
      });

      // Reset after success
      setTimeout(() => {
        setStep(STEP_EMAIL);
        setEmail('');
        setPassword('');
        setFormData({
          firstName: '', lastName: '', title: '', fullPhone: '', whatsapp: '',
          sameAsPhone: false, institutionName: '', typeOfInstitution: '',
          physicalAddress: '', addressLine2: '', country: '', selectedOrganizationId: null,
        });
        setSelectedOrg(null);
        setShowManualOrg(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting registration:', error);
      setSnackbar({
        open: true,
        message: 'Error submitting your information. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Referrer display name
  const referrerName = referralInfo?.referring_user
    ? `${referralInfo.referring_user.firstname} ${referralInfo.referring_user.lastname}`
    : null;

  // Platform colors from theme
  const primaryColor = 'rgb(99, 51, 148)';    // #633394

  // Styles
  const cardStyle = {
    p: { xs: 2, sm: 3 },
    borderRadius: 2,
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
  };
  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fafafa',
      '& fieldset': { borderColor: '#e0e0e0' },
      '&:hover fieldset': { borderColor: primaryColor },
      '&.Mui-focused fieldset': { borderColor: primaryColor },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: primaryColor },
  };

  // ──────────────────────────────────────────
  // STEP 1: Email Entry
  // ──────────────────────────────────────────
  const renderEmailStep = () => (
    <Paper elevation={0} sx={cardStyle}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#212121', mb: 1 }}>
        Join the Collaboration
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
        Start by sharing your details below.
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Email Address
      </Typography>
      <TextField
        fullWidth
        placeholder="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
        sx={{ ...fieldStyle, mb: 3 }}
        size="small"
      />

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleEmailContinue}
        disabled={loading || !email}
        sx={{ py: 1.2 }}
      >
        {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Continue'}
      </Button>
    </Paper>
  );

  // ──────────────────────────────────────────
  // STEP 2a: Login (existing user)
  // ──────────────────────────────────────────
  const renderLoginStep = () => (
    <Paper elevation={0} sx={cardStyle}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#212121', mb: 0.5 }}>
        We found your account, welcome back.
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
        Sign in to continue
      </Typography>

      <Box component="form" onSubmit={handleLogin}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Email Address
        </Typography>
        <TextField
          fullWidth
          value={email}
          disabled
          sx={{ ...fieldStyle, mb: 2 }}
          size="small"
        />

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Password
        </Typography>
        <TextField
          fullWidth
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ ...fieldStyle, mb: 1 }}
          size="small"
          autoFocus
        />

        {loginError && (
          <Alert severity="error" sx={{ mb: 2, py: 0 }}>
            {loginError}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading || !password}
          sx={{ py: 1.2, mt: 1 }}
        >
          {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Log In'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <MuiLink
            component="button"
            type="button"
            variant="body2"
            onClick={() => {
              setStep(STEP_EMAIL);
              setPassword('');
              setLoginError('');
            }}
            sx={{ color: '#666', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Use a different email
          </MuiLink>
        </Box>
      </Box>
    </Paper>
  );

  // ──────────────────────────────────────────
  // STEP 2b: Registration (new user)
  // ──────────────────────────────────────────
  const renderRegisterStep = () => (
    <Paper elevation={0} sx={cardStyle}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#212121', mb: 3 }}>
        Create your account
      </Typography>

      {/* Full Name */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Full Name
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            required
            sx={fieldStyle}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            required
            sx={fieldStyle}
            size="small"
          />
        </Grid>
      </Grid>

      {/* Title */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Title (Optional)
      </Typography>
      <Autocomplete
        multiple
        freeSolo
        options={activeTitles}
        value={formData.title ? formData.title.split(', ').filter(Boolean) : []}
        onChange={(event, newValue) => {
          handleFieldChange('title', newValue.join(', '));
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder="Title"
            size="small"
            sx={fieldStyle}
          />
        )}
        sx={{ mb: 2 }}
      />

      {/* Phone Number + WhatsApp */}
      <Grid container spacing={1.5} sx={{ mb: 0.5 }}>
        <Grid item xs={6}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Phone Number
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            WhatsApp Number
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={1.5} sx={{ mb: 1 }}>
        <Grid item xs={2}>
          <TextField
            fullWidth
            value={phoneCountryCode}
            onChange={(e) => setPhoneCountryCode(e.target.value)}
            size="small"
            placeholder="+1"
            sx={fieldStyle}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            placeholder="000-000-0000"
            value={formData.fullPhone}
            onChange={(e) => handleFieldChange('fullPhone', e.target.value)}
            size="small"
            sx={fieldStyle}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            fullWidth
            value={whatsappCountryCode}
            onChange={(e) => setWhatsappCountryCode(e.target.value)}
            size="small"
            placeholder="+1"
            sx={fieldStyle}
            disabled={formData.sameAsPhone}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            placeholder="000-000-0000"
            value={formData.sameAsPhone ? formData.fullPhone : formData.whatsapp}
            onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
            size="small"
            sx={fieldStyle}
            disabled={formData.sameAsPhone}
          />
        </Grid>
      </Grid>
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.sameAsPhone}
            onChange={(e) => handleFieldChange('sameAsPhone', e.target.checked)}
            size="small"
            sx={{ '&.Mui-checked': { color: primaryColor } }}
          />
        }
        label={<Typography variant="caption" sx={{ color: '#666' }}>Same as Phone Number</Typography>}
        sx={{ mb: 2 }}
      />

      {/* Organization Search */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Organization Name
      </Typography>
      {!showManualOrg ? (
        <>
          <Autocomplete
            freeSolo
            options={orgSearchResults}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.name || '';
            }}
            value={selectedOrg}
            onChange={(event, newValue) => {
              if (typeof newValue === 'string') {
                setSelectedOrg(null);
                setOrgSearchQuery(newValue);
              } else {
                setSelectedOrg(newValue);
              }
            }}
            onInputChange={(event, newInputValue) => {
              setOrgSearchQuery(newInputValue);
            }}
            loading={orgSearchLoading}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  {option.match_type && (
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {option.match_type === 'exact' ? 'Exact match' : ''}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                placeholder="Search for your organization..."
                size="small"
                sx={fieldStyle}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {orgSearchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={orgSearchQuery?.length >= 2 ? "No organizations found" : "Type to search..."}
            sx={{ mb: 1 }}
          />
          {selectedOrg && (
            <Alert severity="success" sx={{ mb: 1.5, py: 0 }}>
              You will be associated with <strong>{selectedOrg.name}</strong>
            </Alert>
          )}
          <MuiLink
            component="button"
            variant="body2"
            onClick={() => {
              setShowManualOrg(true);
              setSelectedOrg(null);
            }}
            sx={{
              color: primaryColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'block',
              mb: 2,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            I do not see my organization
          </MuiLink>
        </>
      ) : (
        /* Manual Organization Entry */
        <>
          <TextField
            fullWidth
            placeholder="Organization"
            value={formData.institutionName}
            onChange={(e) => handleFieldChange('institutionName', e.target.value)}
            size="small"
            sx={{ ...fieldStyle, mb: 2 }}
          />

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Organization Type
          </Typography>
          <TextField
            fullWidth
            select
            value={formData.typeOfInstitution}
            onChange={(e) => handleFieldChange('typeOfInstitution', e.target.value)}
            size="small"
            sx={{ ...fieldStyle, mb: 2 }}
            placeholder="Select"
          >
            {institutionTypes.map(type => (
              <MenuItem key={type.id} value={type.type}>{type.displayName}</MenuItem>
            ))}
          </TextField>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Address 1
          </Typography>
          <TextField
            fullWidth
            placeholder="Organization"
            value={formData.physicalAddress}
            onChange={(e) => handleFieldChange('physicalAddress', e.target.value)}
            size="small"
            sx={{ ...fieldStyle, mb: 2 }}
          />

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Address 2
              </Typography>
              <TextField
                fullWidth
                placeholder="Organization"
                value={formData.addressLine2}
                onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                size="small"
                sx={fieldStyle}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Country
              </Typography>
              <TextField
                fullWidth
                select
                value={formData.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                size="small"
                sx={fieldStyle}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Kenya">Kenya</MenuItem>
                <MenuItem value="Uganda">Uganda</MenuItem>
                <MenuItem value="Tanzania">Tanzania</MenuItem>
                <MenuItem value="Nigeria">Nigeria</MenuItem>
                <MenuItem value="South Africa">South Africa</MenuItem>
                <MenuItem value="Ghana">Ghana</MenuItem>
                <MenuItem value="Ethiopia">Ethiopia</MenuItem>
                <MenuItem value="Rwanda">Rwanda</MenuItem>
                <MenuItem value="United States">United States</MenuItem>
                <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <MuiLink
            component="button"
            variant="body2"
            onClick={() => {
              setShowManualOrg(false);
              setFormData(prev => ({
                ...prev,
                institutionName: '',
                typeOfInstitution: '',
                physicalAddress: '',
                addressLine2: '',
                country: '',
              }));
            }}
            sx={{
              color: primaryColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'block',
              mb: 2,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            Search existing organizations instead
          </MuiLink>
        </>
      )}

      {/* Submit */}
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleRegisterSubmit}
        disabled={loading || !formData.firstName || !formData.lastName}
        sx={{ py: 1.2, mt: 1 }}
      >
        {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Continue'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => {
            setStep(STEP_EMAIL);
            setFormData({
              firstName: '', lastName: '', title: '', fullPhone: '', whatsapp: '',
              sameAsPhone: false, institutionName: '', typeOfInstitution: '',
              physicalAddress: '', addressLine2: '', country: '', selectedOrganizationId: null,
            });
            setSelectedOrg(null);
            setShowManualOrg(false);
          }}
          sx={{ color: '#666', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Use a different email
        </MuiLink>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Main Content Card */}
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          {/* Referral Banner - shown when user arrives via invite link */}
          {referralInfo?.referring_user && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                borderRadius: '8px',
                backgroundColor: '#f3e8ff',
                color: '#633394',
                '& .MuiAlert-icon': { color: '#633394' },
              }}
            >
              You were invited by <strong>{referralInfo.referring_user.firstname} {referralInfo.referring_user.lastname}</strong>.
              Please fill in your contact information below.
            </Alert>
          )}

          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
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
                  <Typography variant="h4" sx={{ color: '#212121', fontWeight: 'bold' }}>
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
            <Divider />
          </Box>

          {/* Form Content */}
          {referralValidating ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress sx={{ color: primaryColor }} />
              <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
                Validating your invitation...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Box sx={{ width: '100%', maxWidth: step === STEP_REGISTER ? 600 : 420 }}>
                {step === STEP_EMAIL && renderEmailStep()}
                {step === STEP_LOGIN && renderLoginStep()}
                {step === STEP_REGISTER && renderRegisterStep()}
              </Box>
            </Box>
          )}
        </Paper>
      </Container>

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
    </Box>
  );
};

export default ContactReferralPageV2;
