import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../context/AttendanceContext';
import { 
    Clock, 
    Search, 
    Trash2, 
    X,
    Calendar,
    RotateCcw
} from 'lucide-react';

const BunkHistory = () => {
    const { user } = useAuth();
    const { 
        logs, 
        loading, 
        deleteLog, 
        resetState 
    } = useAttendance();
    const [searchText, setSearchText] = useState('');

    const handleDeleteLog = async (id) => {
        if (!confirm('Are you sure you want to delete this log? (This will NOT affect your attendance counts or checklist state).')) return;
        try {
            await deleteLog(id);
        } catch (error) {
            console.error('Error deleting log:', error);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear your entire Bunk History logs? (This will NOT affect your attendance counts or subjects).')) return;
        try {
            await resetState('logs');
        } catch (error) {
            console.error('Error resetting logs:', error);
        }
    };

    // Filter logs by subject name search query
    const filteredLogs = logs.filter(log => {
        const query = searchText.toLowerCase();
        const displayDetails = log.details && log.details.startsWith('classRef:') ? 'bunked via checklist' : (log.details || 'logged class missed');
        return log.subjectName.toLowerCase().includes(query) || displayDetails.toLowerCase().includes(query);
    });

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <div className="timetable-header">
                <Navbar 
                    title="Bunk History Log" 
                    subtitle="Track and modify all missed lectures and manual overrides" 
                />
                {logs.length > 0 && (
                    <button className="btn btn-outline" onClick={handleClearHistory} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                        <RotateCcw size={18} />
                        <span>Clear History</span>
                    </button>
                )}
            </div>

            {/* Toolbar search */}
            <div className="subjects-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search history by course..." 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            {/* History logs rendering */}
            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading log history...</div>
            ) : filteredLogs.length === 0 ? (
                <div className="no-data-state">
                    <Clock size={36} />
                    <p>{searchText ? `No records match search "${searchText}"` : 'No bunk logs recorded yet. All caught up!'}</p>
                </div>
            ) : (
                <div className="history-list" style={{ maxHeight: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredLogs.map((log) => {
                        const isAM = log.timestamp && log.timestamp.toUpperCase().includes('AM');
                        const timePeriodLabel = isAM ? 'AM' : 'PM';
                        const friendlyDetails = log.details || 'Logged class missed';

                        return (
                            <div key={log.id} className="history-item" style={{ padding: '1.25rem 1.5rem', borderRadius: '14px' }}>
                                <div className="history-item-left">
                                    <div className="history-icon-box bg-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                        {timePeriodLabel}
                                    </div>
                                    <div className="history-details" style={{ gap: '0.35rem' }}>
                                        <span className="history-subj-name" style={{ fontSize: '1.05rem' }}>{log.subjectName}</span>
                                        <span className="history-action-text" style={{ fontSize: '0.85rem' }}>
                                            Missed class: <b>{friendlyDetails}</b>
                                        </span>
                                    </div>
                                </div>
                                <div className="history-item-right" style={{ gap: '0.5rem', flexDirection: 'row', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', marginRight: '1rem' }}>
                                        <span className="history-date" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{log.date}</span>
                                        {log.timestamp && (
                                            <span className="history-time" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.timestamp}</span>
                                        )}
                                    </div>
                                    <button 
                                        className="icon-btn delete-btn" 
                                        onClick={() => handleDeleteLog(log.id)}
                                        title="Delete Bunk Record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BunkHistory;
