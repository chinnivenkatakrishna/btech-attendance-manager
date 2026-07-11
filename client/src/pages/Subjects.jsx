import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../context/AttendanceContext';
import { calculateAttendanceStats, colorMap } from '../utils/helpers';
import { 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    Check, 
    X, 
    XOctagon, 
    BookOpen,
    GraduationCap
} from 'lucide-react';

const Subjects = () => {
    const { user } = useAuth();
    const { 
        subjects, 
        loading, 
        addSubject, 
        updateSubject, 
        deleteSubject,
        refreshAll
    } = useAttendance();
    const [searchText, setSearchText] = useState('');
    
    // Add/Edit Subject Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeSubjectId, setActiveSubjectId] = useState(null);
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectColor, setSubjectColor] = useState('blue');
    
    // Manual Edit States
    const [manualAttended, setManualAttended] = useState(0);
    const [manualConducted, setManualConducted] = useState(0);

    const handleOpenAddModal = () => {
        setIsEditMode(false);
        setSubjectName('');
        setSubjectCode('');
        setSubjectColor('blue');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (sub) => {
        setIsEditMode(true);
        setActiveSubjectId(sub._id);
        setSubjectName(sub.name);
        setSubjectCode(sub.code || '');
        setSubjectColor(sub.color || 'blue');
        setManualAttended(sub.attended);
        setManualConducted(sub.conducted);
        setIsModalOpen(true);
    };

    const handleSaveSubject = async (e) => {
        e.preventDefault();
        if (!subjectName) return;

        try {
            if (isEditMode) {
                await updateSubject(activeSubjectId, {
                    name: subjectName,
                    code: subjectCode,
                    color: subjectColor,
                    attended: manualAttended,
                    conducted: manualConducted
                });
            } else {
                await addSubject({
                    name: subjectName,
                    code: subjectCode,
                    color: subjectColor
                });
            }
            
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving subject:', error);
        }
    };

    const handleDeleteSubject = async (id) => {
        if (!confirm('Are you sure you want to delete this subject? This will clear all linked timetable classes and logs.')) return;
        try {
            await deleteSubject(id);
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    const handleManualCounter = async (sub, attendedOffset, conductedOffset) => {
        let nextAttended = sub.attended + attendedOffset;
        let nextConducted = sub.conducted + conductedOffset;
        
        if (nextAttended < 0) nextAttended = 0;
        if (nextConducted < 0) nextConducted = 0;
        if (nextAttended > nextConducted) {
            nextAttended = nextConducted;
        }

        try {
            await updateSubject(sub._id, {
                attended: nextAttended,
                conducted: nextConducted
            });
        } catch (error) {
            console.error('Error updating counter:', error);
        }
    };

    // Filter subjects by search keyword
    const filteredSubjects = subjects.filter(s => {
        const query = searchText.toLowerCase();
        return s.name.toLowerCase().includes(query) || (s.code || '').toLowerCase().includes(query);
    });

    const targetPercent = user?.individualTargetPercentage || 40;

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <div className="timetable-header">
                <Navbar 
                    title="Course Tracker" 
                    subtitle="Monitor individual lecture records and project attendance targets" 
                />
                <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    <span>Add Subject</span>
                </button>
            </div>

            {/* Toolbar search */}
            <div className="subjects-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search subjects by name or code..." 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            {/* Subjects grid */}
            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading course tracker...</div>
            ) : filteredSubjects.length === 0 ? (
                <div className="no-data-state">
                    <BookOpen size={36} />
                    <p>{searchText ? `No courses matches search "${searchText}"` : 'No courses logged yet.'}</p>
                    {!searchText && (
                        <button className="btn btn-outline" onClick={handleOpenAddModal} style={{ marginTop: '0.5rem' }}>
                            Add Subject
                        </button>
                    )}
                </div>
            ) : (
                <div className="subjects-grid">
                    {filteredSubjects.map((s) => {
                        const stats = calculateAttendanceStats(s.attended, s.conducted, targetPercent);
                        const cardColor = colorMap[s.color] || 'var(--accent-blue)';
                        
                        const radius = 35;
                        const circ = 2 * Math.PI * radius;
                        const offset = circ - (stats.percentage / 100) * circ;

                        return (
                            <div key={s._id} className="card subject-card" style={{ '--card-accent': cardColor }}>
                                <div className="subject-card-header">
                                    <div className="subj-title-group">
                                        <h3>{s.name}</h3>
                                        <span className="subj-code">{s.code || 'NO CODE'}</span>
                                    </div>
                                    <div className="card-actions-menu">
                                        <button className="icon-btn" onClick={() => handleOpenEditModal(s)} title="Edit Subject Details">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDeleteSubject(s._id)} title="Delete Subject">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="subject-card-body">
                                    <div className="subj-numbers">
                                        <div className="subj-count">Attended: <span>{s.attended}</span></div>
                                        <div className="subj-count">Conducted: <span>{s.conducted}</span></div>
                                    </div>
                                    <div className="subj-progress-radial">
                                        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" r={radius} cx="40" cy="40"/>
                                            <circle 
                                                stroke={s.conducted === 0 ? 'var(--primary-color)' : `var(--color-${stats.status})`} 
                                                strokeWidth="6" 
                                                fill="transparent" 
                                                r={radius} 
                                                cx="40" 
                                                cy="40" 
                                                strokeLinecap="round"
                                                style={{
                                                    strokeDasharray: `${circ} ${circ}`,
                                                    strokeDashoffset: isNaN(offset) ? circ : offset,
                                                    transition: 'stroke-dashoffset 0.4s'
                                                }}
                                            />
                                        </svg>
                                        <div className="subj-percent-text">{stats.percentage}%</div>
                                    </div>
                                </div>

                                <div className={`subject-card-projection ${stats.status}`}>
                                    <span>{stats.message}</span>
                                </div>

                                <div className="subject-card-quick-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                                    <button 
                                        className="btn btn-outline" 
                                        onClick={() => handleManualCounter(s, 1, 1)}
                                        style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '32px' }}
                                        title="Increment both attended and conducted count"
                                    >
                                        + Attended
                                    </button>
                                    <button 
                                        className="btn btn-outline" 
                                        onClick={() => handleManualCounter(s, 0, 1)}
                                        style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '32px', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' }}
                                        title="Increment conducted count only to record a bunk"
                                    >
                                        + Bunked
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Course Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{isEditMode ? 'Edit Course Details' : 'Add New Subject'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveSubject}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="subj-name">Subject Name *</label>
                                    <input 
                                        type="text" 
                                        id="subj-name" 
                                        placeholder="e.g. Theory of Computation"
                                        value={subjectName}
                                        onChange={(e) => setSubjectName(e.target.value)}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subj-code">Subject Code</label>
                                    <input 
                                        type="text" 
                                        id="subj-code" 
                                        placeholder="e.g. CS-304"
                                        value={subjectCode}
                                        onChange={(e) => setSubjectCode(e.target.value)}
                                    />
                                </div>

                                {/* Custom manual counter override in Edit Mode */}
                                {isEditMode && (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="subj-edit-attended">Attended Lectures</label>
                                            <input 
                                                type="number" 
                                                id="subj-edit-attended" 
                                                value={manualAttended}
                                                onChange={(e) => setManualAttended(parseInt(e.target.value) || 0)}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="subj-edit-conducted">Conducted Lectures</label>
                                            <input 
                                                type="number" 
                                                id="subj-edit-conducted" 
                                                value={manualConducted}
                                                onChange={(e) => setManualConducted(parseInt(e.target.value) || 0)}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Card Color Palette Accent</label>
                                    <div className="color-picker-grid">
                                        {['blue', 'purple', 'teal', 'emerald', 'orange', 'pink'].map(c => (
                                            <div 
                                                key={c}
                                                className={`color-option ${subjectColor === c ? 'selected' : ''}`}
                                                style={{ backgroundColor: colorMap[c] }}
                                                onClick={() => setSubjectColor(c)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subjects;
