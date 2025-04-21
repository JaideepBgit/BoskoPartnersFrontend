import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const validateSurveyCode = async (surveyCode) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/surveys/validate`,
      {survey_code: surveyCode }, // <-- to be matched with backend key
      {headers: {"Content-Type": "application/json"}}
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to validate survey code' };
  }
};
