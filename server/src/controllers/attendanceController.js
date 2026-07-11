const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Helper to escape HTML characters (standard security)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// @desc    Get all subjects for a student
// @route   GET /api/attendance/subjects
// @access  Private
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ studentId: req.student._id });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add new subject
// @route   POST /api/attendance/subjects
// @access  Private
const addSubject = async (req, res) => {
    const { name, code, color } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Subject name is required' });
    }

    try {
        const subject = await Subject.create({
            studentId: req.student._id,
            name,
            code: code || '',
            color: color || 'blue',
            attended: 0,
            conducted: 0
        });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update subject counts/details
// @route   PUT /api/attendance/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
    const { name, code, color, attended, conducted } = req.body;

    try {
        const subject = await Subject.findOne({ _id: req.params.id, studentId: req.student._id });

        if (subject) {
            const oldAttended = subject.attended;
            const oldConducted = subject.conducted;

            subject.name = name || subject.name;
            subject.code = code !== undefined ? code : subject.code;
            subject.color = color || subject.color;
            subject.attended = attended !== undefined ? attended : subject.attended;
            subject.conducted = conducted !== undefined ? conducted : subject.conducted;

            const updatedSubject = await subject.save();

            // Log manual change in logs if counts were modified and bunks were added
            const diffConducted = subject.conducted - oldConducted;
            const diffAttended = subject.attended - oldAttended;
            const bunksAdded = diffConducted - diffAttended;

            if (bunksAdded > 0) {
                await Attendance.create({
                    studentId: req.student._id,
                    subjectId: subject._id,
                    dateString: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }),
                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    action: "bunked class",
                    details: "Manual counter increment"
                });
            }

            res.json(updatedSubject);
        } else {
            res.status(404).json({ error: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete subject
// @route   DELETE /api/attendance/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, studentId: req.student._id });

        if (subject) {
            // Delete subject
            await Subject.deleteOne({ _id: req.params.id });

            // Clean up attendance logs linked to this subject
            await Attendance.deleteMany({ subjectId: req.params.id });

            // Clean up timetable slots linked to this subject
            const student = await Student.findById(req.student._id);
            if (student) {
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const deletedSlotIds = [];
                days.forEach(day => {
                    if (student.timetable[day]) {
                        student.timetable[day].forEach(slot => {
                            if (slot.subjectId.toString() === req.params.id) {
                                deletedSlotIds.push(slot.id || slot._id.toString());
                            }
                        });
                        student.timetable[day] = student.timetable[day].filter(
                            slot => slot.subjectId.toString() !== req.params.id
                        );
                    }
                });

                // Clean up loggedClasses keys ending with deletedSlotIds
                if (student.loggedClasses && deletedSlotIds.length > 0) {
                    const newLoggedClasses = { ...student.loggedClasses };
                    let modified = false;
                    Object.keys(newLoggedClasses).forEach(key => {
                        const parts = key.split('_');
                        const classId = parts[parts.length - 1];
                        if (deletedSlotIds.includes(classId)) {
                            delete newLoggedClasses[key];
                            modified = true;
                        }
                    });
                    if (modified) {
                        student.loggedClasses = newLoggedClasses;
                        student.markModified('loggedClasses');
                    }
                }

                await student.save();
            }

            res.json({ message: 'Subject removed' });
        } else {
            res.status(404).json({ error: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Bunk History logs
// @route   GET /api/attendance/logs
// @access  Private
const getLogs = async (req, res) => {
    try {
        const logs = await Attendance.find({ studentId: req.student._id })
            .populate('subjectId')
            .sort({ createdAt: -1 });

        // Map it to include subjectName
        const mappedLogs = logs.map(log => ({
            id: log._id,
            subjectName: log.subjectId ? log.subjectId.name : 'Deleted Subject',
            action: log.action,
            date: log.dateString,
            timestamp: log.timestamp,
            details: log.details
        }));

        res.json(mappedLogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Toggle attendance checklist status
// @route   POST /api/attendance/mark
// @access  Private
const markTimetableAttendance = async (req, res) => {
    const { classId, status, dateKey, dateString, timestamp, timePeriod } = req.body;

    if (!classId || !status || !dateKey) {
        return res.status(400).json({ error: 'classId, status, and dateKey are required' });
    }

    try {
        const student = await Student.findById(req.student._id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find the timetable slot
        let classItem = null;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const day of days) {
            classItem = student.timetable[day].find(c => c.id === classId || c._id.toString() === classId);
            if (classItem) break;
        }

        if (!classItem) {
            return res.status(404).json({ error: 'Timetable class slot not found' });
        }

        // Find the mapped subject
        const subject = await Subject.findOne({ _id: classItem.subjectId, studentId: student._id });
        if (!subject) {
            return res.status(404).json({ error: 'Subject linked to timetable class not found' });
        }

        const key = `${dateKey}_${classId}`;
        const previousStatus = student.loggedClasses[key];
        const logIdString = `${dateKey}_${classId}`;

        // Initialize loggedClasses object if missing
        if (!student.loggedClasses) {
            student.loggedClasses = {};
        }

        // Toggle state logic
        if (previousStatus === status) {
            // Uncheck the toggle
            if (status === 'present') {
                subject.attended = Math.max(0, subject.attended - 1);
                subject.conducted = Math.max(0, subject.conducted - 1);
            } else if (status === 'absent') {
                subject.conducted = Math.max(0, subject.conducted - 1);
                await Attendance.deleteOne({ studentId: student._id, details: `classRef:${logIdString}` });
            }
            // Remove the logged class status
            // Map types in mongoose require using .set() or direct assignment on mixed fields
            const newLoggedClasses = { ...student.loggedClasses };
            delete newLoggedClasses[key];
            student.loggedClasses = newLoggedClasses;
        } else {
            // Undo previous check-in effect
            if (previousStatus === 'present') {
                subject.attended = Math.max(0, subject.attended - 1);
                subject.conducted = Math.max(0, subject.conducted - 1);
            } else if (previousStatus === 'absent') {
                subject.conducted = Math.max(0, subject.conducted - 1);
                await Attendance.deleteOne({ studentId: student._id, details: `classRef:${logIdString}` });
            }

            // Apply new check-in effect
            if (status === 'present') {
                subject.attended++;
                subject.conducted++;
            } else if (status === 'absent') {
                subject.conducted++;
                await Attendance.create({
                    studentId: student._id,
                    subjectId: subject._id,
                    dateString,
                    timestamp,
                    action: "bunked class",
                    details: `classRef:${logIdString}`
                });
            }
            // Set the new status
            const newLoggedClasses = { ...student.loggedClasses };
            newLoggedClasses[key] = status;
            student.loggedClasses = newLoggedClasses;
        }

        // Mark modified to force mongoose to save mixed object types
        student.markModified('loggedClasses');
        await student.save();
        await subject.save();

        res.json({
            loggedClasses: student.loggedClasses,
            subject
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Clear logs / reset application database
// @route   POST /api/attendance/reset
// @access  Private
const clearLogs = async (req, res) => {
    const { action } = req.body; // 'logs' or 'factory'

    try {
        if (action === 'logs') {
            await Attendance.deleteMany({ studentId: req.student._id });
            // Reset conducted/attended counts on subjects to 0
            await Subject.updateMany({ studentId: req.student._id }, { attended: 0, conducted: 0 });
            
            const student = await Student.findById(req.student._id);
            student.loggedClasses = {};
            student.markModified('loggedClasses');
            await student.save();

            res.json({ message: 'Bunk history logs and statistics cleared successfully' });
        } else if (action === 'factory') {
            // Delete all subjects
            await Subject.deleteMany({ studentId: req.student._id });
            // Delete all logs
            await Attendance.deleteMany({ studentId: req.student._id });
            
            // Empty student timetable and logs
            const student = await Student.findById(req.student._id);
            student.timetable = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
            student.loggedClasses = {};
            student.markModified('loggedClasses');
            await student.save();

            res.json({ message: 'All subjects, timetable slots, and logs have been wiped successfully' });
        } else {
            res.status(400).json({ error: 'Invalid reset action specified' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a single bunk log entry
// @route   DELETE /api/attendance/logs/:id
// @access  Private
const deleteLog = async (req, res) => {
    try {
        const log = await Attendance.findOne({ _id: req.params.id, studentId: req.student._id });
        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        // Adjust subject conducted count
        const subject = await Subject.findOne({ _id: log.subjectId, studentId: req.student._id });
        if (subject) {
            subject.conducted = Math.max(0, subject.conducted - 1);
            await subject.save();
        }

        // Check if this log was from a timetable checklist click (contains "classRef:")
        if (log.details && log.details.startsWith('classRef:')) {
            const classRef = log.details.split('classRef:')[1];
            // Remove the check-in status from Student.loggedClasses
            const student = await Student.findById(req.student._id);
            if (student && student.loggedClasses) {
                const newLoggedClasses = { ...student.loggedClasses };
                delete newLoggedClasses[classRef];
                student.loggedClasses = newLoggedClasses;
                student.markModified('loggedClasses');
                await student.save();
            }
        }

        await Attendance.deleteOne({ _id: req.params.id });
        res.json({ message: 'Bunk log removed and attendance recalculated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Bulk mark attendance for a specific day
// @route   POST /api/attendance/bulk
// @access  Private
const markBulkAttendance = async (req, res) => {
    const { slots, status, dateKey, dateString, timestamp } = req.body;
    
    try {
        const student = await Student.findById(req.student._id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const newLoggedClasses = { ...student.loggedClasses };

        for (const slot of slots) {
            const key = `${dateKey}_${slot.classId}`;
            const logIdString = `${dateKey}_${slot.classId}`;
            const previousStatus = newLoggedClasses[key];

            const subject = await Subject.findOne({ _id: slot.subjectId, studentId: req.student._id });
            if (!subject) continue;

            // 1. Undo previous status
            if (previousStatus === 'present') {
                subject.attended = Math.max(0, subject.attended - 1);
                subject.conducted = Math.max(0, subject.conducted - 1);
            } else if (previousStatus === 'absent') {
                subject.conducted = Math.max(0, subject.conducted - 1);
                await Attendance.deleteOne({ studentId: student._id, details: `classRef:${logIdString}` });
            }

            // 2. Apply new status
            if (status === 'present') {
                subject.attended++;
                subject.conducted++;
                newLoggedClasses[key] = 'present';
            } else if (status === 'absent') {
                subject.conducted++;
                await Attendance.create({
                    studentId: student._id,
                    subjectId: subject._id,
                    dateString,
                    timestamp,
                    action: "bunked class",
                    details: `classRef:${logIdString}`
                });
                newLoggedClasses[key] = 'absent';
            } else if (status === 'holiday') {
                newLoggedClasses[key] = 'holiday';
            } else if (status === 'clear') {
                delete newLoggedClasses[key];
            }

            await subject.save();
        }

        student.loggedClasses = newLoggedClasses;
        student.markModified('loggedClasses');
        await student.save();

        res.json({ loggedClasses: student.loggedClasses });
    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getLogs,
    deleteLog,
    markTimetableAttendance,
    markBulkAttendance,
    clearLogs
};
