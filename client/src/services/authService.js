import API from './api';

export const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (name, email, password, collegeName) => {
    const response = await API.post('/auth/register', { name, email, password, collegeName });
    return response.data;
};

export const getProfile = async () => {
    const response = await API.get('/student/profile');
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await API.put('/student/profile', profileData);
    return response.data;
};
