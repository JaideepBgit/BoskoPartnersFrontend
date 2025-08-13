import React, { useState, useEffect } from 'react';
import Navbar from '../shared/Navbar/Navbar';
import PersonalDetailsPage from './PersonalDetailsPage';
import OrganizationalDetailsPage from './OrganizationalDetailsPage';
import SubmitPage from './SubmitPage';
import { Paper, Box, Typography, LinearProgress, Container, useMediaQuery, useTheme } from '@mui/material';
import { saveUserDetails, submitUserDetails, getUserDetails } from '../../services/UserDetails/UserDetailsService';
import { useLocation, useNavigate } from 'react-router-dom';

const FormContainer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Form state
  const [formData, setFormData] = useState({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    organizational: {
      organization: null,
      country: '',
      province: '',
      city: '',
      town: '',
      address_line1: '',
      address_line2: '',
      postal_code: '',
      latitude: null,
      longitude: null
    }
  });
  
  // Current page state
  const [currentPage, setCurrentPage] = useState(1);
  // Form errors
  const [formErrors, setFormErrors] = useState({});
  // Loading state
  const [isSaving, setIsSaving] = useState(false);
  // Progress state
  const [formProgress, setFormProgress] = useState(0);
  const { state } = useLocation();
  // Get user and organization IDs from localStorage (set during login)
  // Convert to numbers since the backend expects numeric values
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const organizationId = parseInt(localStorage.getItem('organizationId') || '0', 10); // Default to 1 if not found
  
  const survey = state?.survey; //we are passing the entire survey object
  const navigate = useNavigate();

  // Store survey code in localStorage for dashboard access
  useEffect(() => {
    if (survey && survey.survey_code) {
      localStorage.setItem('surveyCode', survey.survey_code);
      localStorage.setItem('userId', survey.id || userId);
    }
  }, [survey, userId]);

  // Load existing user details when form opens
  useEffect(() => {
    const loadUserDetails = async () => {
      if (userId > 0) {
        try {
          const existingDetails = await getUserDetails(userId);
          console.log('Loaded existing user details:', existingDetails);
          
          if (existingDetails && existingDetails.form_data) {
            // Update form data with existing details
            setFormData(existingDetails.form_data);
            
            // Set current page to the last page the user was on
            if (existingDetails.last_page) {
              setCurrentPage(existingDetails.last_page);
            }
            
            // Calculate progress based on loaded data
            calculateProgress(existingDetails.form_data, existingDetails.last_page || 1);
          }
        } catch (error) {
          console.log('No existing user details found or error loading:', error);
          // This is fine - user might be filling the form for the first time
        }
      }
    };

    loadUserDetails();
  }, [userId]);

  if (!survey){
    navigate('/', {replace: true});
    return null;
  }

  // Update form data
  const updateFormData = (section, fieldName, value) => {
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [section]: {
          ...prevData[section],
          [fieldName]: value
        }
      };
      
      // Calculate progress whenever form data changes
      calculateProgress(newData, currentPage);
      return newData;
    });
  };
  
  // Calculate form progress
  const calculateProgress = (data, page) => {
    const totalPages = 3;
    let baseProgress = ((page - 1) / totalPages) * 100;
    
    // Check all required fields across all pages
    const personalFieldsFilled = ['firstName', 'lastName'].filter(f => data.personal[f]).length;
    const orgFieldsFilled = ['organization', 'country', 'province', 'city', 'address_line1'].filter(f => data.organizational[f]).length;
    
    // Total required fields and how many are filled
    const totalRequiredFields = 7; // 2 personal + 5 organizational (organization, country, province, city, address_line1)
    const totalFieldsFilled = personalFieldsFilled + orgFieldsFilled;
    
    // Calculate field-based progress (up to 100%)
    const fieldProgress = (totalFieldsFilled / totalRequiredFields) * 100;
    
    // Combine page-based and field-based progress
    // Use the higher of: current page progress OR field completion progress
    const combinedProgress = Math.max(baseProgress, fieldProgress);
    
    // If on page 3 or all fields are filled, allow 100%
    if (page === 3 || totalFieldsFilled === totalRequiredFields) {
      setFormProgress(Math.round(combinedProgress));
    } else {
      // Otherwise cap at 66% until reaching final page
      setFormProgress(Math.min(Math.round(combinedProgress), 66));
    }
  };
  
  // Validate form data
  const validateForm = (page) => {
    const errors = {};
    
    if (page === 1) {
      if (!formData.personal.firstName) errors.firstName = 'First name is required';
      if (!formData.personal.lastName) errors.lastName = 'Last name is required';
      // Email and phone are optional
    } else if (page === 2) {
      if (!formData.organizational.organization) errors.organization = 'Organization is required';
      if (!formData.organizational.country) errors.country = 'Country is required';
      if (!formData.organizational.province) errors.province = 'Province is required';
      if (!formData.organizational.city) errors.city = 'City is required';
      if (!formData.organizational.address_line1) errors.address_line1 = 'Address line 1 is required';
      // town, address_line2, and postal_code are optional
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Save and continue
  const saveAndContinue = async () => {
    const isValid = validateForm(currentPage);
    
    if (isValid) {
      setIsSaving(true);
      try {
        console.log('Saving form data:', {
          user_id: userId,
          organization_id: organizationId,
          form_data: formData,
          current_page: currentPage,
          action: 'continue'
        });
        
        await saveUserDetails({
          user_id: userId,
          organization_id: organizationId,
          form_data: formData,
          current_page: currentPage,
          action: 'continue'
        });
        
        // Proceed to next page
        setCurrentPage(prev => Math.min(prev + 1, 3));
      } catch (error) {
        console.error('Error saving form data:', error);
        alert('Failed to save form data. Your data has been saved locally.');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // Save and exit
  const saveAndExit = async () => {
    setIsSaving(true);
    try {
      console.log('Saving form data before exit:', {
        user_id: userId,
        organization_id: organizationId,
        form_data: formData,
        current_page: currentPage,
        action: 'exit'
      });
      
      await saveUserDetails({
        user_id: userId,
        organization_id: organizationId,
        form_data: formData,
        current_page: currentPage,
        action: 'exit'
      });
      
      alert('Form data saved successfully! Redirecting to dashboard...');
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving form data:', error);
      alert('Failed to save form data. Your data has been saved locally.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Submit form
  const submitForm = async () => {
    const isValid = validateForm(currentPage);
    
    if (isValid) {
      setIsSaving(true);
      try {
        console.log('Submitting form data:', {
          user_id: userId,
          form_data: formData
        });
        
        await submitUserDetails({
          user_id: userId,
          form_data: formData
        });
        
        alert('Form submitted successfully! Redirecting to dashboard...');
        // Redirect to dashboard after successful submission
        navigate('/dashboard');
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to submit form. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 2 : 4, px: isMobile ? 2 : 3 }}>
        <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: '8px', backgroundColor: '#f5f5f5' }}>
          {/* Progress bar */}
          <Box sx={{ width: '100%', mb: isMobile ? 2 : 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Step {currentPage} of 3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formProgress}% Complete
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={formProgress} 
              sx={{ 
                height: isMobile ? 10 : 10, 
                borderRadius: 5,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#633394',
                }
              }} 
            />
          </Box>
          
          {/* Form pages */}
          {currentPage === 1 && (
            <PersonalDetailsPage 
              formData={formData}
              updateFormData={updateFormData}
              saveAndContinue={saveAndContinue}
              saveAndExit={saveAndExit}
              formErrors={formErrors}
              isSaving={isSaving}
            />
          )}
          
          {currentPage === 2 && (
            <OrganizationalDetailsPage 
              formData={formData}
              updateFormData={updateFormData}
              saveAndContinue={saveAndContinue}
              goBack={() => setCurrentPage(1)}
              saveAndExit={saveAndExit}
              formErrors={formErrors}
              isSaving={isSaving}
            />
          )}
          
          {currentPage === 3 && (
            <SubmitPage 
              formData={formData}
              goBack={() => setCurrentPage(2)}
              submitForm={submitForm}
              isSaving={isSaving}
            />
          )}
        </Paper>
      </Container>
    </>
  );
};

export default FormContainer;
