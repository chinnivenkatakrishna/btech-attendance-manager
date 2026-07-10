import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Attendance from '../pages/Attendance';
import Subjects from '../pages/Subjects';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import BunkHistory from '../pages/BunkHistory';

const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/attendance" element={
                <ProtectedRoute>
                    <Layout><Attendance /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/subjects" element={
                <ProtectedRoute>
                    <Layout><Subjects /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/history" element={
                <ProtectedRoute>
                    <Layout><BunkHistory /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/profile" element={
                <ProtectedRoute>
                    <Layout><Profile /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute>
                    <Layout><Settings /></Layout>
                </ProtectedRoute>
            } />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

export default AppRoutes;
