import axios from 'axios';

const API = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'
});

// Interceptor to automatically add JWT Token to request authorization headers
API.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('btech_student'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
