import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Save user details (for both "Save & Continue" and "Save & Exit")
export const saveUserDetails = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/user-details/save`, data);
    console.log('Data saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving user details:', error);
    
    // Fallback to localStorage if API call fails
    saveToLocalStorage(data);
    
    throw error;
  }
};

// Submit the complete form
export const submitUserDetails = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/user-details/submit`, data);
    console.log('Form submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting user details:', error);
    
    // Fallback to localStorage if API call fails
    saveToLocalStorage({
      ...data,
      is_submitted: true
    });
    
    throw error;
  }
};

// Get user details (to resume form filling)
export const getUserDetails = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/user-details/${userId}`);
    console.log('User details retrieved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting user details:', error);
    
    // Try to get from localStorage if API call fails
    const localData = getFromLocalStorage();
    if (localData) {
      return localData;
    }
    
    throw error;
  }
};

// Fallback method to save to localStorage
export const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem('userFormData', JSON.stringify(data));
    console.log('Form data saved to localStorage as fallback');
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

// Get data from localStorage
export const getFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('userFormData');
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Clear data from localStorage
export const clearLocalStorage = () => {
  try {
    localStorage.removeItem('userFormData');
    console.log('Form data cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};
