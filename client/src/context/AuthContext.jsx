import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Retrieve logged user from localStorage
        const storedUser = localStorage.getItem('btech_student');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data);
        localStorage.setItem('btech_student', JSON.stringify(data));
        return data;
    };

    const register = async (name, email, password, collegeName) => {
        const data = await authService.register(name, email, password, collegeName);
        setUser(data);
        localStorage.setItem('btech_student', JSON.stringify(data));
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('btech_student');
        localStorage.removeItem('btech_attendance_state'); // Clear fallbacks
    };

    const updateUser = (userData) => {
        const updated = { ...user, ...userData };
        setUser(updated);
        localStorage.setItem('btech_student', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
