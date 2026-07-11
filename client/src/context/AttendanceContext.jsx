import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import * as attendanceService from '../services/attendanceService';

export const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [subjects, setSubjectsState] = useState([]);
    const [timetable, setTimetable] = useState({
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
    });
    const [logs, setLogs] = useState([]);
    const [loggedClasses, setLoggedClassesState] = useState({});
    const [loading, setLoading] = useState(false);

    // Synchronous refs for state variables to prevent stale reads during rapid updates
    const subjectsRef = useRef([]);
    const loggedClassesRef = useRef({});
    const requestSequence = useRef({});

    const setSubjects = (val) => {
        if (typeof val === 'function') {
            setSubjectsState(prev => {
                const res = val(prev);
                subjectsRef.current = res;
                return res;
            });
        } else {
            subjectsRef.current = val;
            setSubjectsState(val);
        }
    };

    const setLoggedClasses = (val) => {
        if (typeof val === 'function') {
            setLoggedClassesState(prev => {
                const res = val(prev);
                loggedClassesRef.current = res;
                return res;
            });
        } else {
            loggedClassesRef.current = val;
            setLoggedClassesState(val);
        }
    };

    // Fetch all data from server
    const fetchAllData = async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const [subjectsData, timetableData, logsData] = await Promise.all([
                attendanceService.getSubjects(),
                attendanceService.getTimetable(),
                attendanceService.getLogs()
            ]);
            setSubjects(subjectsData);
            setTimetable(timetableData);
            setLogs(logsData);
            
            // Sync loggedClasses from user profile
            const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/profile`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.loggedClasses) {
                    setLoggedClasses(profileData.loggedClasses);
                }
            }
        } catch (error) {
            console.error('Error loading attendance context data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load data when user session changes
    useEffect(() => {
        if (user?.token) {
            fetchAllData();
        } else {
            // Clear states on logout
            setSubjects([]);
            setTimetable({ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] });
            setLogs([]);
            setLoggedClasses({});
        }
    }, [user]);

    // Global Wrapper Actions (Optimistic UI & background sync)
    const addSubject = async (subjectData) => {
        try {
            const created = await attendanceService.addSubject(subjectData);
            setSubjects(prev => [...prev, created]);
            return created;
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const updateSubject = async (id, subjectData) => {
        try {
            // Optimistic update
            setSubjects(prev => prev.map(s => s._id === id ? { ...s, ...subjectData } : s));
            
            const updated = await attendanceService.updateSubject(id, subjectData);
            
            // Sync with actual server record
            setSubjects(prev => prev.map(s => s._id === id ? updated : s));
            
            // Reload logs in background if manual log was generated
            const logsData = await attendanceService.getLogs();
            setLogs(logsData);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const deleteSubject = async (id) => {
        try {
            setSubjects(prev => prev.filter(s => s._id !== id));
            // Remove linked logs from memory
            setLogs(prev => prev.filter(log => log.subjectId !== id));
            // Remove linked timetable slots from memory
            setTimetable(prev => {
                const updated = {};
                Object.keys(prev).forEach(day => {
                    updated[day] = prev[day].filter(slot => slot.subjectId?._id !== id && slot.subjectId !== id);
                });
                return updated;
            });

            await attendanceService.deleteSubject(id);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const addTimetableSlot = async (slotData) => {
        try {
            const updated = await attendanceService.addTimetableSlot(slotData);
            setTimetable(updated);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const deleteTimetableSlot = async (day, id) => {
        try {
            setTimetable(prev => ({
                ...prev,
                [day]: prev[day].filter(slot => slot.id !== id)
            }));
            const updated = await attendanceService.deleteTimetableSlot(day, id);
            setTimetable(updated);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const reorderTimetableSlots = async (day, slots) => {
        try {
            setTimetable(prev => ({
                ...prev,
                [day]: slots
            }));
            const updated = await attendanceService.reorderTimetable(day, slots);
            setTimetable(updated);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const markAttendance = async (attendanceData) => {
        const key = `${attendanceData.dateKey}_${attendanceData.classId}`;
        
        // 1. Get sequence ID to prevent out-of-order API overrides
        if (!requestSequence.current[key]) {
            requestSequence.current[key] = 0;
        }
        const currentSeq = ++requestSequence.current[key];

        // 2. Read the latest status from our synchronous ref
        const previousStatus = loggedClassesRef.current[key] || '';
        const targetStatus = attendanceData.status;

        // 3. Determine if this toggles the current state off
        const isToggleOff = previousStatus === targetStatus;

        // 4. Optimistic Update of loggedClasses map
        setLoggedClasses(prev => {
            const updated = { ...prev };
            if (isToggleOff) {
                delete updated[key];
            } else {
                updated[key] = targetStatus;
            }
            return updated;
        });

        // Find subjectId linked to classId in timetable
        let subjectId = null;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const day of days) {
            const slot = timetable[day].find(c => c.id === attendanceData.classId || c._id?.toString() === attendanceData.classId);
            if (slot) {
                subjectId = slot.subjectId?._id || slot.subjectId;
                break;
            }
        }

        // 5. Optimistic Update of subject counts
        if (subjectId) {
            setSubjects(prev => {
                return prev.map(subject => {
                    if (subject._id !== subjectId) return subject;

                    let nextAttended = subject.attended;
                    let nextConducted = subject.conducted;

                    // Undo previous
                    if (previousStatus === 'present') {
                        nextAttended = Math.max(0, nextAttended - 1);
                        nextConducted = Math.max(0, nextConducted - 1);
                    } else if (previousStatus === 'absent') {
                        nextConducted = Math.max(0, nextConducted - 1);
                    }

                    // Apply new (if not toggling off)
                    if (!isToggleOff) {
                        if (targetStatus === 'present') {
                            nextAttended++;
                            nextConducted++;
                        } else if (targetStatus === 'absent') {
                            nextConducted++;
                        }
                    }

                    return { ...subject, attended: nextAttended, conducted: nextConducted };
                });
            });
        }

        try {
            // 6. Trigger backend request in background
            const data = await attendanceService.markAttendance(attendanceData);
            
            // Only update local state if no newer click has overridden this request
            if (currentSeq === requestSequence.current[key]) {
                setLoggedClasses(data.loggedClasses);
                if (data.subject) {
                    setSubjects(prev => prev.map(s => s._id === data.subject._id ? data.subject : s));
                }
            }
            
            // Reload logs in background
            const logsData = await attendanceService.getLogs();
            setLogs(logsData);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const deleteLog = async (id) => {
        try {
            setLogs(prev => prev.filter(log => log.id !== id));
            await attendanceService.deleteLog(id);
            
            // Sync counts and check map in background
            const [subjectsData, profileResponse] = await Promise.all([
                attendanceService.getSubjects(),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/profile`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);
            setSubjects(subjectsData);
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.loggedClasses) {
                    setLoggedClasses(profileData.loggedClasses);
                }
            }
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const markBulkAttendance = async (bulkData) => {
        const { slots, status } = bulkData;
        
        // 1. Optimistic Update of loggedClasses map (Instant checkboxes/holiday styling)
        setLoggedClasses(prev => {
            const updated = { ...prev };
            slots.forEach(slot => {
                const key = `${bulkData.dateKey}_${slot.classId}`;
                if (status === 'clear') {
                    delete updated[key];
                } else {
                    updated[key] = status;
                }
            });
            return updated;
        });

        // 2. Optimistic Update of subject counts (Instant progress bar updates)
        setSubjects(prev => {
            return prev.map(subject => {
                const matchingSlots = slots.filter(slot => slot.subjectId === subject._id);
                if (matchingSlots.length === 0) return subject;

                let nextAttended = subject.attended;
                let nextConducted = subject.conducted;

                matchingSlots.forEach(slot => {
                    const key = `${bulkData.dateKey}_${slot.classId}`;
                    const previousStatus = loggedClassesRef.current[key];

                    // Undo previous
                    if (previousStatus === 'present') {
                        nextAttended = Math.max(0, nextAttended - 1);
                        nextConducted = Math.max(0, nextConducted - 1);
                    } else if (previousStatus === 'absent') {
                        nextConducted = Math.max(0, nextConducted - 1);
                    }

                    // Apply new
                    if (status === 'present') {
                        nextAttended++;
                        nextConducted++;
                    } else if (status === 'absent') {
                        nextConducted++;
                    }
                });

                return { ...subject, attended: nextAttended, conducted: nextConducted };
            });
        });

        try {
            // 3. Trigger backend request in background
            const data = await attendanceService.markBulkAttendance(bulkData);
            setLoggedClasses(data.loggedClasses);
            
            // Sync all subjects and logs from backend
            const [subjectsData, logsData] = await Promise.all([
                attendanceService.getSubjects(),
                attendanceService.getLogs()
            ]);
            setSubjects(subjectsData);
            setLogs(logsData);
        } catch (error) {
            console.error(error);
            fetchAllData();
            throw error;
        }
    };

    const resetState = async (action) => {
        setLoading(true);
        try {
            await attendanceService.resetState(action);
            await fetchAllData();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <AttendanceContext.Provider value={{
            subjects,
            timetable,
            logs,
            loggedClasses,
            loading,
            refreshAll: fetchAllData,
            addSubject,
            updateSubject,
            deleteSubject,
            addTimetableSlot,
            deleteTimetableSlot,
            reorderTimetableSlots,
            markAttendance,
            markBulkAttendance,
            deleteLog,
            resetState
        }}>
            {children}
        </AttendanceContext.Provider>
    );
};

// Helper hook
export const useAttendance = () => {
    return useContext(AttendanceContext);
};

// Internal helper for auth
function useAuthContext() {
    return useContext(AuthContext);
}
