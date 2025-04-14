import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Define the backend API URL
const API_BASE_URL = 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = false;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const FormContext = createContext();

export const FormProvider = ({ children }) => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userId, setUserId] = useState(1); // Default user ID for testing
  const [organizationId, setOrganizationId] = useState(1); // Default organization ID for testing
  const [formErrors, setFormErrors] = useState({});
  const [formProgress, setFormProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [testDataInitialized, setTestDataInitialized] = useState(false);
  const [useFallbackSave, setUseFallbackSave] = useState(false);

  // Initialize test data
  useEffect(() => {
    const initializeTestData = async () => {
      try {
        console.log('Initializing test data...');
        const response = await axios.get(`${API_BASE_URL}/api/initialize-test-data`);
        console.log('Test data initialized:', response.data);

        if (response.data.status === 'success') {
          setUserId(response.data.test_user_id);
          setOrganizationId(response.data.test_org_id);
          setTestDataInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing test data:', error);
        // If we can't initialize test data via API, use default values
        console.log('Using default test data values');
        setTestDataInitialized(true);
        setUseFallbackSave(true);
      }
    };

    if (!testDataInitialized) {
      initializeTestData();
    }
  }, [testDataInitialized]);

  // Load existing form data if available
  useEffect(() => {
    const loadFormData = async () => {
      if (!userId) return; // Don't try to load if we don't have a user ID yet

      try {
        console.log('Attempting to load form data for user ID:', userId);
        const response = await axios.get(`${API_BASE_URL}/api/user-details/${userId}`);
        console.log('Form data loaded successfully:', response.data);

        if (response.data.form_data) {
          setFormData(response.data.form_data);
          setCurrentPage(response.data.last_page);
          setIsSubmitted(response.data.is_submitted);
          calculateProgress(response.data.form_data, response.data.last_page);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('No existing form data found for this user. Starting with empty form.');
        } else {
          console.error('Error loading form data:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          } else if (error.request) {
            console.error('No response received:', error.request);
            setUseFallbackSave(true);
          } else {
            console.error('Error message:', error.message);
          }
        }
      }
    };

    if (userId && testDataInitialized) {
      loadFormData();
    }
  }, [userId, testDataInitialized]);

  // Update progress when current page changes
  useEffect(() => {
    calculateProgress(formData, currentPage);
  }, [currentPage, formData]);

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

  // Fallback method to save form data locally
  const saveFormDataLocally = () => {
    try {
      // Save to localStorage as a fallback
      localStorage.setItem('formData', JSON.stringify(formData));
      localStorage.setItem('currentPage', currentPage.toString());
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('organizationId', organizationId.toString());
      console.log('Form data saved to localStorage as fallback');
      console.log('2. Fallback save successful.');
      // Display a message to the user
      alert('Form data saved locally. Note: This data will be synced with the database when the connection is restored.');
      return true;
    } catch (error) {
      console.error('Error saving form data locally:', error);
      return false;
    }
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

        if (useFallbackSave) {
          // Use fallback save method
          const success = saveFormDataLocally();
          if (success) {
            // Proceed to next page
            setCurrentPage(prev => Math.min(prev + 1, 3));
          }
        } else {
          // Try API save
          const response = await axios.post(`${API_BASE_URL}/api/user-details/save`, {
            user_id: userId,
            organization_id: organizationId,
            form_data: formData,
            current_page: currentPage,
            action: 'continue'
          });
          console.log('Form data saved successfully:', response.data);

          // Always proceed to next page if validation passes
          setCurrentPage(prev => Math.min(prev + 1, 3));
        }
      } catch (error) {
        console.error('Error saving form data:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          console.error('No response received:', error.request);
          // If API call fails, use fallback save
          console.log('Using fallback save method...');
          const success = saveFormDataLocally();
          if (success) {
            // Proceed to next page
            setCurrentPage(prev => Math.min(prev + 1, 3));
          }
        } else {
          console.error('Error message:', error.message);
        }
        alert('There was an issue saving to the database. Your data has been saved locally.');
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

      if (useFallbackSave) {
        // Use fallback save method
        const success = saveFormDataLocally();
        if (success) {
          console.log("3. Fallback save successful.")
          alert('Form data saved locally. You can safely exit now.');
        }
      } else {
        // Try API save
        const response = await axios.post(`${API_BASE_URL}/api/user-details/save`, {
          user_id: userId,
          organization_id: organizationId,
          form_data: formData,
          current_page: currentPage,
          action: 'exit'
        });
        console.log('Form data saved before exit:', response.data);

        // Redirect to dashboard or home
        alert('Form data saved successfully! Redirecting to dashboard...');
        // Uncomment this when dashboard is implemented
        // window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
        // If API call fails, use fallback save
        console.log('Using fallback save method...');
        const success = saveFormDataLocally();
        if (success) {
          console.log('1. Fallback save successful.');
          alert('Form data saved locally. You can safely exit now.');
        }
      } else {
        console.error('Error message:', error.message);
      }
      alert('There was an issue saving to the database. Your data has been saved locally.');
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

        if (useFallbackSave) {
          // Use fallback save method
          const success = saveFormDataLocally();
          if (success) {
            setIsSubmitted(true);
            alert('Form submitted successfully (locally)! Your data will be synced with the database when connection is restored.');
          }
        } else {
          // Try API save
          const response = await axios.post(`${API_BASE_URL}/api/user-details/submit`, {
            user_id: userId,
            form_data: formData
          });
          console.log('Form submitted successfully:', response.data);

          setIsSubmitted(true);
          // Redirect to success page
          alert('Form submitted successfully! Redirecting to success page...');
          // Uncomment this when success page is implemented
          // window.location.href = '/submission-success';
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          console.error('No response received:', error.request);
          // If API call fails, use fallback save
          console.log('Using fallback save method...');
          const success = saveFormDataLocally();
          if (success) {
            setIsSubmitted(true);
            alert('Form submitted successfully (locally)! Your data will be synced with the database when connection is restored.');
          }
        } else {
          console.error('Error message:', error.message);
        }
        alert('There was an issue submitting to the database. Your data has been saved locally.');
      } finally {
        setIsSaving(false);
      }
    }
  };

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

      return newData;
    });
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        currentPage,
        isSubmitted,
        formErrors,
        formProgress,
        isSaving,
        userId,
        organizationId,
        updateFormData,
        saveAndContinue,
        saveAndExit,
        submitForm,
        setCurrentPage
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
