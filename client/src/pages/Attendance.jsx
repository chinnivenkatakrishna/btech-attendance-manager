import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../context/AttendanceContext';
import { getDateForWeekday, formatBunkDate, colorMap } from '../utils/helpers';
import { 
    Clock, 
    MapPin, 
    Plus, 
    Trash2,
    Calendar,
    Search,
    X,
    BookOpen,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

const Attendance = () => {
    const { user } = useAuth();
    const { 
        timetable, 
        subjects, 
        loggedClasses, 
        loading, 
        markAttendance, 
        markBulkAttendance,
        addTimetableSlot, 
        deleteTimetableSlot,
        reorderTimetableSlots
    } = useAttendance();
    const [currentDay, setCurrentDay] = useState('Monday');
    const [weekOffset, setWeekOffset] = useState(0);
    
    // Add Class Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDay, setModalDay] = useState('Monday');
    const [modalSubjectId, setModalSubjectId] = useState('');
    const [modalTime, setModalTime] = useState('');
    const [modalRoom, setModalRoom] = useState('');

    useEffect(() => {
        // Set current tab based on today's weekday on boot
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];
        if (todayName !== 'Sunday') {
            setCurrentDay(todayName);
        }
    }, []);

    const handleMarkAttendance = async (classId, status) => {
        try {
            const classDay = currentDay;
            const classDate = getDateForWeekday(classDay, weekOffset);
            
            const year = classDate.getFullYear();
            const month = String(classDate.getMonth() + 1).padStart(2, '0');
            const date = String(classDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${date}`;
            
            const dateString = formatBunkDate(classDate);
            const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            await markAttendance({
                classId,
                status,
                dateKey,
                dateString,
                timestamp
            });
        } catch (error) {
            console.error('Error toggling attendance:', error);
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!modalSubjectId || !modalTime) return;

        try {
            await addTimetableSlot({
                day: modalDay,
                time: modalTime,
                subjectId: modalSubjectId,
                room: modalRoom
            });
            
            setIsModalOpen(false);
            setModalSubjectId('');
            setModalTime('');
            setModalRoom('');
        } catch (error) {
            console.error('Error adding timetable slot:', error);
        }
    };

    const handleDeleteClass = async (day, id) => {
        if (!confirm('Are you sure you want to remove this class from your schedule?')) return;
        try {
            await deleteTimetableSlot(day, id);
        } catch (error) {
            console.error('Error deleting timetable slot:', error);
        }
    };

    const handleMarkAllPresent = async () => {
        const slots = sortedClasses.map(c => ({ classId: c._id, subjectId: c.subjectId?._id || c.subjectId }));
        const dateString = formatBunkDate(getDateForWeekday(currentDay, weekOffset));
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        try {
            await markBulkAttendance({
                slots,
                status: 'present',
                dateKey: activeDateKey,
                dateString,
                timestamp
            });
        } catch (error) {
            console.error('Error bulk marking present:', error);
        }
    };

    const handleMarkAllAbsent = async () => {
        const slots = sortedClasses.map(c => ({ classId: c._id, subjectId: c.subjectId?._id || c.subjectId }));
        const dateString = formatBunkDate(getDateForWeekday(currentDay, weekOffset));
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        try {
            await markBulkAttendance({
                slots,
                status: 'absent',
                dateKey: activeDateKey,
                dateString,
                timestamp
            });
        } catch (error) {
            console.error('Error bulk marking absent:', error);
        }
    };

    const handleDeclareHoliday = async () => {
        const slots = sortedClasses.map(c => ({ classId: c._id, subjectId: c.subjectId?._id || c.subjectId }));
        const dateString = formatBunkDate(getDateForWeekday(currentDay, weekOffset));
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        try {
            await markBulkAttendance({
                slots,
                status: 'holiday',
                dateKey: activeDateKey,
                dateString,
                timestamp
            });
        } catch (error) {
            console.error('Error declaring holiday:', error);
        }
    };

    const handleClearDayMarks = async () => {
        const slots = sortedClasses.map(c => ({ classId: c._id, subjectId: c.subjectId?._id || c.subjectId }));
        const dateString = formatBunkDate(getDateForWeekday(currentDay, weekOffset));
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        try {
            await markBulkAttendance({
                slots,
                status: 'clear',
                dateKey: activeDateKey,
                dateString,
                timestamp
            });
        } catch (error) {
            console.error('Error resetting day marks:', error);
        }
    };

    const sortedClasses = timetable[currentDay] || [];

    const handleMoveClass = async (index, direction) => {
        const slots = [...sortedClasses];
        if (direction === 'up' && index > 0) {
            const temp = slots[index];
            slots[index] = slots[index - 1];
            slots[index - 1] = temp;
        } else if (direction === 'down' && index < slots.length - 1) {
            const temp = slots[index];
            slots[index] = slots[index + 1];
            slots[index + 1] = temp;
        } else {
            return;
        }

        try {
            await reorderTimetableSlots(currentDay, slots);
        } catch (error) {
            console.error('Error reordering timetable slots:', error);
        }
    };

    // Get date key for active day selectors
    const getActiveDateKey = () => {
        const classDate = getDateForWeekday(currentDay, weekOffset);
        const year = classDate.getFullYear();
        const month = String(classDate.getMonth() + 1).padStart(2, '0');
        const date = String(classDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${date}`;
    };

    const activeDateKey = getActiveDateKey();

    const getWeekRangeString = () => {
        const mondayDate = getDateForWeekday('Monday', weekOffset);
        const saturdayDate = getDateForWeekday('Saturday', weekOffset);
        
        const opt = { month: 'short', day: 'numeric' };
        const startStr = mondayDate.toLocaleDateString('en-US', opt);
        const endStr = saturdayDate.toLocaleDateString('en-US', opt);
        
        return `${startStr} - ${endStr}, ${mondayDate.getFullYear()}`;
    };

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <div className="timetable-header">
                <Navbar 
                    title="Timetable Checklist" 
                    subtitle={`Mark attendance for: ${formatBunkDate(getDateForWeekday(currentDay, weekOffset))}`} 
                />
                <button className="btn btn-primary" onClick={() => { setModalDay(currentDay); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    <span>Add Class</span>
                </button>
            </div>

            {/* Week Navigator toolbar */}
            <div className="week-navigator-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: '12px', width: 'fit-content' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(prev => prev - 1)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}>
                    ← Prev Week
                </button>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', minWidth: '180px', textAlign: 'center' }}>
                    {getWeekRangeString()}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(prev => prev + 1)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}>
                    Next Week →
                </button>
                {weekOffset !== 0 && (
                    <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(0)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        Today
                    </button>
                )}
            </div>

            {/* Weekday selector tabs */}
            <div className="day-selector-group" style={{ marginBottom: '2.5rem', alignSelf: 'flex-start' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <button 
                        key={day} 
                        className={`day-btn ${currentDay === day ? 'active' : ''}`}
                        onClick={() => setCurrentDay(day)}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Timetable schedule list */}
            {sortedClasses.length === 0 ? (
                <div className="no-data-state">
                    <Calendar size={36} />
                    <p>No classes scheduled for {currentDay}.</p>
                    <button className="btn btn-outline" onClick={() => { setModalDay(currentDay); setIsModalOpen(true); }} style={{ marginTop: '0.5rem' }}>
                        Schedule Class
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Bulk controls bar */}
                    <div className="bulk-actions-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={handleMarkAllPresent} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            Mark All Present
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={handleMarkAllAbsent} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            Mark All Absent
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={handleDeclareHoliday} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-orange)' }}>
                            Declare Holiday (Dismiss)
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={handleClearDayMarks} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                            Reset Day
                        </button>
                    </div>
                    <div className="timetable-list">
                        {sortedClasses.map((c, idx) => {
                            const subject = c.subjectId; // populated as object from backend
                            const subjectName = subject ? subject.name : 'Deleted Course';
                            const subjectColor = subject ? (subject.color || 'blue') : 'blue';
                            const colorVal = colorMap[subjectColor] || 'var(--accent-blue)';
                            
                            const key = `${activeDateKey}_${c._id || c.id}`;
                            const currentStatus = loggedClasses[key] || '';
                            const isHoliday = currentStatus === 'holiday';

                            return (
                                <div 
                                    key={c._id || c.id} 
                                    className={`timetable-item ${isHoliday ? 'dismissed' : ''}`} 
                                    style={{ 
                                        borderLeft: `4px solid ${isHoliday ? 'rgba(255, 255, 255, 0.15)' : colorVal}`,
                                        opacity: isHoliday ? 0.5 : 1,
                                        borderStyle: isHoliday ? 'dashed' : 'solid'
                                    }}
                                >
                                    <div className="timetable-item-info">
                                        <div className="timetable-item-time">
                                            <Clock size={16} color="var(--text-secondary)" />
                                            <span>{c.time}</span>
                                        </div>
                                        <div className="timetable-item-details">
                                            <span 
                                                className="timetable-item-title" 
                                                style={{ 
                                                    textDecoration: isHoliday ? 'line-through' : 'none',
                                                    color: isHoliday ? 'var(--text-secondary)' : 'var(--text-primary)'
                                                }}
                                            >
                                                {subjectName}
                                            </span>
                                            {isHoliday && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 600, display: 'block', marginTop: '0.15rem' }}>
                                                    Dismissed (Holiday)
                                                 </span>
                                            )}
                                            {c.room && !isHoliday && (
                                                <span className="timetable-item-room">
                                                    <MapPin size={12} />
                                                    <span>{c.room}</span>
                                                </span>
                                            )}
                                    </div>
                                </div>
                                <div className="timetable-item-actions">
                                    <button 
                                        className={`btn-attendance-toggle present ${currentStatus === 'present' ? 'active' : ''}`}
                                        onClick={() => handleMarkAttendance(c._id || c.id, 'present')}
                                    >
                                        Present
                                    </button>
                                    <button 
                                        className={`btn-attendance-toggle absent ${currentStatus === 'absent' ? 'active' : ''}`}
                                        onClick={() => handleMarkAttendance(c._id || c.id, 'absent')}
                                    >
                                        Absent
                                    </button>
                                    <button 
                                        className={`btn-attendance-toggle holiday ${currentStatus === 'holiday' ? 'active' : ''}`}
                                        onClick={() => handleMarkAttendance(c._id || c.id, 'holiday')}
                                    >
                                        Dismiss
                                    </button>
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => handleMoveClass(idx, 'up')}
                                        disabled={idx === 0}
                                        title="Move Up"
                                        style={{ border: '1px solid var(--border-color)', opacity: idx === 0 ? 0.3 : 1 }}
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => handleMoveClass(idx, 'down')}
                                        disabled={idx === sortedClasses.length - 1}
                                        title="Move Down"
                                        style={{ border: '1px solid var(--border-color)', opacity: idx === sortedClasses.length - 1 ? 0.3 : 1 }}
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                    <button 
                                        className="icon-btn delete-btn" 
                                        onClick={() => handleDeleteClass(currentDay, c._id || c.id)}
                                        title="Delete Class Slot"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

            {/* Add Timetable Class Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Timetable Class</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddClass}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="modal-day">Day of Week</label>
                                    <select 
                                        id="modal-day" 
                                        value={modalDay} 
                                        onChange={(e) => setModalDay(e.target.value)}
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="modal-subject">Course Name *</label>
                                    <select 
                                        id="modal-subject"
                                        value={modalSubjectId}
                                        onChange={(e) => setModalSubjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose Subject --</option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.code || 'No Code'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="modal-time">Class Period *</label>
                                        <input 
                                            type="text" 
                                            id="modal-time" 
                                            placeholder="e.g. 09:00 AM - 10:00 AM"
                                            value={modalTime}
                                            onChange={(e) => setModalTime(e.target.value)}
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="modal-room">Room / Lab</label>
                                        <input 
                                            type="text" 
                                            id="modal-room" 
                                            placeholder="e.g. Room 402"
                                            value={modalRoom}
                                            onChange={(e) => setModalRoom(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Class</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
