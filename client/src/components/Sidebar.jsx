import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    LayoutDashboard, 
    CalendarDays, 
    BookOpen, 
    Clock,
    UserCog, 
    Sliders, 
    LogOut,
    GraduationCap
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <aside className="sidebar">
            <div className="brand-section">
                <div className="brand-logo-box">
                    <GraduationCap size={24} color="white" />
                </div>
                <h1 className="brand-title">B.Tech Manager</h1>
            </div>

            <nav>
                <ul className="nav-links">
                    <li className="nav-item">
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
                            <CalendarDays size={20} />
                            <span>Attendance</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/subjects" className={({ isActive }) => isActive ? 'active' : ''}>
                            <BookOpen size={20} />
                            <span>Subjects</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
                            <Clock size={20} />
                            <span>Bunk History</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                            <UserCog size={20} />
                            <span>Profile</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                            <Sliders size={20} />
                            <span>Settings</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                {user && (
                    <div className="user-profile-summary">
                        <div className="avatar-box">
                            {getInitials(user.name)}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user.name}</span>
                            <span className="user-college">{user.collegeName || 'Student'}</span>
                        </div>
                    </div>
                )}
                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
