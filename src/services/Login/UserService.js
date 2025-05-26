import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const loginUser = async (username, password) => {
    try{
        console.log('Sending login request with:', { username });
        const response = await axios.post(`${BASE_URL}/users/login`,{
            username,
            password
        });
        console.log('Raw API response:', response);
        console.log('API response.data:', response.data);
        
        // Return the full response.data object
        return response.data;
    }catch(error){
        console.error("API Call failed: ", error.response || error.message);
        throw error;
    }
};

export default {loginUser};