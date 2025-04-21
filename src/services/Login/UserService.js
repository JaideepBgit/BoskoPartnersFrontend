import axios from "axios";

const API_BASE_URL  = 'http://localhost:5000/api/users';

const loginUser = async (username, password) => {
    try{
        console.log('Sending login request with:', { username });
        const response = await axios.post(`${API_BASE_URL}/login`,{
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