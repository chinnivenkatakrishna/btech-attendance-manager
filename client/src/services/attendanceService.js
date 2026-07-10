import API from './api';

export const getSubjects = async () => {
    const response = await API.get('/attendance/subjects');
    return response.data;
};

export const addSubject = async (subjectData) => {
    const response = await API.post('/attendance/subjects', subjectData);
    return response.data;
};

export const updateSubject = async (id, subjectData) => {
    const response = await API.put(`/attendance/subjects/${id}`, subjectData);
    return response.data;
};

export const deleteSubject = async (id) => {
    const response = await API.delete(`/attendance/subjects/${id}`);
    return response.data;
};

export const getTimetable = async () => {
    const response = await API.get('/student/timetable');
    return response.data;
};

export const addTimetableSlot = async (slotData) => {
    const response = await API.post('/student/timetable', slotData);
    return response.data;
};

export const deleteTimetableSlot = async (day, id) => {
    const response = await API.delete(`/student/timetable/${day}/${id}`);
    return response.data;
};

export const getLogs = async () => {
    const response = await API.get('/attendance/logs');
    return response.data;
};

export const deleteLog = async (id) => {
    const response = await API.delete(`/attendance/logs/${id}`);
    return response.data;
};

export const markAttendance = async (attendanceData) => {
    const response = await API.post('/attendance/mark', attendanceData);
    return response.data;
};

export const markBulkAttendance = async (bulkData) => {
    const response = await API.post('/attendance/bulk', bulkData);
    return response.data;
};

export const resetState = async (action) => {
    const response = await API.post('/attendance/reset', { action });
    return response.data;
};
