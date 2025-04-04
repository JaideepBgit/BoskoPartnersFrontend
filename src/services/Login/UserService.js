import axios from "axios";

const API_BASE_URL  = 'http://localhost:5000/api/users';

const loginUser = async (username, password) => {
    try{
        const response = await axios.post(`${API_BASE_URL}/login`,{
            username,
            password
        });
        console.log(response.data);
        return response.data;
    }catch(error){
        console.error("API Call failed: ", error.response || error.message);
        throw error;
    }
};

export default {loginUser};