import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../context/AttendanceContext';
import { calculateAttendanceStats } from '../utils/helpers';
import { 
    TrendingUp, 
    BookOpen, 
    AlertTriangle, 
    Clock, 
    X,
    Calendar,
    ArrowRight
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const { subjects, logs, loading } = useAttendance();

    // Calculate aggregated metrics
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalConducted = subjects.reduce((sum, s) => sum + s.conducted, 0);
    const target = user?.targetPercentage || 75;
    const individualTarget = user?.individualTargetPercentage || 40;
    
    const overallStats = calculateAttendanceStats(totalAttended, totalConducted, target);
    
    // Warning subjects (attendance below individual target)
    const warningSubjects = subjects.filter(s => {
        if (s.conducted === 0) return false;
        return (s.attended / s.conducted * 100) < individualTarget;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
                Loading Dashboard...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Navbar 
                title={`Welcome back, ${user?.name || 'Student'}`} 
                subtitle={`Current target: ${target}% | College: ${user?.collegeName || 'Not Set'}`} 
            />

            {/* Overall Attendance warning banner */}
            {overallStats.percentage < target && totalConducted > 0 && (
                <div className="projection-banner danger">
                    <AlertTriangle size={20} />
                    <span>
                        Your overall attendance (<b>{overallStats.percentage}%</b>) is below your target of {target}%. 
                        You need to attend the next <b>{overallStats.needsToAttend}</b> classes consecutively to restore it!
                    </span>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="card stat-card">
                    <div className="stat-card-left">
                        <span className="stat-label">Overall Attendance</span>
                        <span className={`stat-val ${overallStats.status === 'safe' ? 'color-safe' : 'color-danger'}`}>
                            {overallStats.percentage}%
                        </span>
                        <span className="stat-change">
                            {totalAttended} / {totalConducted} classes attended
                        </span>
                    </div>
                    <TrendingUp className="stat-icon" color="var(--accent-blue)" />
                </div>

                <div className="card stat-card">
                    <div className="stat-card-left">
                        <span className="stat-label">Courses Logged</span>
                        <span className="stat-val color-safe">{subjects.length}</span>
                        <span className="stat-change">Active tracked classes</span>
                    </div>
                    <BookOpen className="stat-icon" color="var(--accent-teal)" />
                </div>

                <div className="card stat-card">
                    <div className="stat-card-left">
                        <span className="stat-label">Action Alerts</span>
                        <span className={`stat-val ${warningSubjects.length > 0 ? 'color-warning' : 'color-safe'}`}>
                            {warningSubjects.length}
                        </span>
                        <span className="stat-change">Courses below {individualTarget}% target</span>
                    </div>
                    <AlertTriangle className="stat-icon" color="var(--accent-orange)" />
                </div>
            </div>

            <div className="dashboard-panels-row">
                {/* Course Projection details panel */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="panel-header">
                        <h2>Course Wise Attendance Status</h2>
                    </div>

                    {subjects.length === 0 ? (
                        <div className="no-data-state">
                            <BookOpen size={36} />
                            <p>No courses added yet. Go to the Subjects tab to add courses.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {subjects.map(s => {
                                const stats = calculateAttendanceStats(s.attended, s.conducted, individualTarget);
                                return (
                                    <div key={s._id} style={{
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.015)',
                                        border: '1px solid var(--border-color)',
                                        padding: '1.25rem',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {s.code || 'No Code'} | {s.attended} attended of {s.conducted} classes
                                            </span>
                                            <span style={{ fontSize: '0.8rem', marginTop: '0.25rem' }} className={stats.status === 'safe' ? 'color-safe' : stats.status === 'warning' ? 'color-warning' : 'color-danger'}>
                                                {stats.message}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '700',
                                            color: stats.status === 'safe' ? 'var(--color-safe)' : stats.status === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)'
                                        }}>
                                            {stats.percentage}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Bunk History sidebar panel */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="panel-header">
                        <h2>Bunk Log History</h2>
                    </div>

                    {logs.length === 0 ? (
                        <div className="no-data-state">
                            <Clock size={36} />
                            <p>No classes bunked yet! Perfect attendance record.</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {logs.map(log => (
                                <div key={log.id} className="history-item">
                                    <div className="history-item-left">
                                        <div className="history-icon-box bg-danger">
                                            <X size={16} color="white" />
                                        </div>
                                        <div className="history-details">
                                            <span className="history-subj-name">{log.subjectName}</span>
                                            <span className="history-action-text">{log.details || 'Bunked class'}</span>
                                        </div>
                                    </div>
                                    <div className="history-item-right">
                                        <span className="history-date">{log.date}</span>
                                        {log.timestamp && (
                                            <span className="history-time">{log.timestamp}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
