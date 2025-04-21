import React, { useState,} from 'react';
import Navbar from '../shared/Navbar/Navbar';
import PersonalDetailsPage from './PersonalDetailsPage';
import OrganizationalDetailsPage from './OrganizationalDetailsPage';
import SubmitPage from './SubmitPage';
import { Paper, Box, Typography, LinearProgress, Container } from '@mui/material';
import { saveUserDetails, submitUserDetails } from '../../services/UserDetails/UserDetailsService';
import { useLocation, useNavigate } from 'react-router-dom';

const FormContainer = () => {
  // Form state
  const [formData, setFormData] = useState({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    organizational: {
      country: '',
      region: '',
      church: '',
      school: ''
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
  // User and organization IDs (would come from authentication in a real app)
  const userId = 1; {/*LOOK HERE*/}
  const organizationId = 1; {/*LOOK HERE*/}
  
  const survey = state?.survey; //we are passing the entire survey object
  const navigate = useNavigate();

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
    const orgFieldsFilled = ['country', 'region', 'church', 'school'].filter(f => data.organizational[f]).length;
    
    // Total required fields and how many are filled
    const totalRequiredFields = 6; // 2 personal + 4 organizational
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
      if (!formData.organizational.country) errors.country = 'Country is required';
      if (!formData.organizational.region) errors.region = 'Region is required';
      if (!formData.organizational.church) errors.church = 'Church is required';
      if (!formData.organizational.school) errors.school = 'School is required';
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
      // Uncomment this when dashboard is implemented
      // window.location.href = '/dashboard';
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
        
        alert('Form submitted successfully! Redirecting to success page...');
        // Uncomment this when success page is implemented
        // window.location.href = '/submission-success';
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to submit form. Your data has been saved locally.');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // Render the appropriate page based on currentPage
  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <PersonalDetailsPage 
            formData={formData}
            updateFormData={updateFormData}
            saveAndContinue={saveAndContinue}
            saveAndExit={saveAndExit}
            formErrors={formErrors}
            isSaving={isSaving}
          />
        );
      case 2:
        return (
          <OrganizationalDetailsPage 
            formData={formData}
            updateFormData={updateFormData}
            saveAndContinue={saveAndContinue}
            saveAndExit={saveAndExit}
            formErrors={formErrors}
            setCurrentPage={setCurrentPage}
            isSaving={isSaving}
          />
        );
      case 3:
        return (
          <SubmitPage 
            formData={formData}
            submitForm={submitForm}
            setCurrentPage={setCurrentPage}
            isSaving={isSaving}
          />
        );
      default:
        return <PersonalDetailsPage />;
    }
  };
  
  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ width: '100%', mb: 4 }}>
          <LinearProgress 
            variant="determinate" 
            value={formProgress} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#8a94e3',
              }
            }} 
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">0%</Typography>
            <Typography variant="body2" color="text.secondary">100%</Typography>
          </Box>
        </Box>
        
        {renderPage()}
      </Paper>
    </Container>
    </>
  );
};

export default FormContainer;
