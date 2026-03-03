import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = () => {
    const { user, loading, isAdmin, isAlumni, isAlumniManager } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Checking Authorization...</div>;
    }

    // 1. Check if user is logged in
    if (!user) {
        return <Navigate to="/admin-login" replace />;
    }

    // 2. SPECIAL EXCEPTION for Alumni Manager - Allow them to access ONLY Alumni Admin Routes
    if (isAlumniManager) {
        const currentPath = location.pathname;
        if (currentPath.startsWith('/admin/alumni')) {
            return <Outlet />;
        } else {
            return <Navigate to="/admin/alumni" replace />;
        }
    }

    // 3. If user is a regular Alumnus, DENY access to Admin Panel
    if (isAlumni) {
        return <Navigate to="/alumni/profile" replace />;
    }

    // 4. Otherwise, only allow if they are explicitly an Admin
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
