import API from './api';

export const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (name, email, password, collegeName, securityQuestion, securityAnswer) => {
    const response = await API.post('/auth/register', { name, email, password, collegeName, securityQuestion, securityAnswer });
    return response.data;
};

export const getSecurityQuestion = async (email) => {
    const response = await API.get(`/auth/security-question/${encodeURIComponent(email)}`);
    return response.data;
};

export const resetPassword = async (email, securityAnswer, newPassword) => {
    const response = await API.post('/auth/reset-password', { email, securityAnswer, newPassword });
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
