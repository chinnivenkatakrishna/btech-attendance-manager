const Student = require('../models/Student');

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private
const getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.student._id);
        if (student) {
            res.json({
                _id: student._id,
                name: student.name,
                email: student.email,
                targetPercentage: student.targetPercentage,
                individualTargetPercentage: student.individualTargetPercentage,
                collegeName: student.collegeName,
                securityQuestion: student.securityQuestion || '',
                loggedClasses: student.loggedClasses
            });
        } else {
            res.status(404).json({ error: 'Student profile not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private
const updateStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.student._id);

        if (student) {
            student.name = req.body.name || student.name;
            if (req.body.password) {
                student.password = req.body.password;
            }
            if (req.body.securityQuestion) {
                student.securityQuestion = req.body.securityQuestion;
            }
            if (req.body.securityAnswer) {
                student.securityAnswer = req.body.securityAnswer;
            }
            student.targetPercentage = req.body.targetPercentage !== undefined ? req.body.targetPercentage : student.targetPercentage;
            student.individualTargetPercentage = req.body.individualTargetPercentage !== undefined ? req.body.individualTargetPercentage : student.individualTargetPercentage;
            student.collegeName = req.body.collegeName !== undefined ? req.body.collegeName : student.collegeName;

            const updatedStudent = await student.save();
            res.json({
                _id: updatedStudent._id,
                name: updatedStudent.name,
                email: updatedStudent.email,
                targetPercentage: updatedStudent.targetPercentage,
                individualTargetPercentage: updatedStudent.individualTargetPercentage,
                collegeName: updatedStudent.collegeName,
                securityQuestion: updatedStudent.securityQuestion || '',
                loggedClasses: updatedStudent.loggedClasses
            });
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get timetable
// @route   GET /api/student/timetable
// @access  Private
const getStudentTimetable = async (req, res) => {
    try {
        const student = await Student.findById(req.student._id);
        if (student) {
            // Populate subject info for timetable slots
            const populatedStudent = await student.populate([
                { path: 'timetable.Monday.subjectId' },
                { path: 'timetable.Tuesday.subjectId' },
                { path: 'timetable.Wednesday.subjectId' },
                { path: 'timetable.Thursday.subjectId' },
                { path: 'timetable.Friday.subjectId' },
                { path: 'timetable.Saturday.subjectId' }
            ]);
            res.json(populatedStudent.timetable);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add timetable slot
// @route   POST /api/student/timetable
// @access  Private
const addTimetableSlot = async (req, res) => {
    const { day, time, subjectId, room } = req.body;

    if (!day || !time || !subjectId) {
        return res.status(400).json({ error: 'Day, time, and subjectId are required' });
    }

    try {
        const student = await Student.findById(req.student._id);
        if (student) {
            const newSlot = {
                id: `tt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                subjectId,
                time,
                room: room || ''
            };

            if (!student.timetable[day]) {
                student.timetable[day] = [];
            }

            student.timetable[day].push(newSlot);
            await student.save();

            // Populate and return updated timetable
            const populatedStudent = await student.populate([
                { path: 'timetable.Monday.subjectId' },
                { path: 'timetable.Tuesday.subjectId' },
                { path: 'timetable.Wednesday.subjectId' },
                { path: 'timetable.Thursday.subjectId' },
                { path: 'timetable.Friday.subjectId' },
                { path: 'timetable.Saturday.subjectId' }
            ]);

            res.status(201).json(populatedStudent.timetable);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete timetable slot
// @route   DELETE /api/student/timetable/:day/:id
// @access  Private
const deleteTimetableSlot = async (req, res) => {
    const { day, id } = req.params;

    try {
        const student = await Student.findById(req.student._id);
        if (student) {
            if (student.timetable[day]) {
                student.timetable[day] = student.timetable[day].filter(slot => slot.id !== id && slot._id.toString() !== id);
                await student.save();

                // Populate and return updated timetable
                const populatedStudent = await student.populate([
                    { path: 'timetable.Monday.subjectId' },
                    { path: 'timetable.Tuesday.subjectId' },
                    { path: 'timetable.Wednesday.subjectId' },
                    { path: 'timetable.Thursday.subjectId' },
                    { path: 'timetable.Friday.subjectId' },
                    { path: 'timetable.Saturday.subjectId' }
                ]);

                res.json(populatedStudent.timetable);
            } else {
                res.status(400).json({ error: 'Invalid day specified' });
            }
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStudentProfile,
    updateStudentProfile,
    getStudentTimetable,
    addTimetableSlot,
    deleteTimetableSlot
};
