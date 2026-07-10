const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// Default Seed Subjects
const defaultSubjects = [
    { name: "Data Structures & Algorithms", code: "CS-301", attended: 21, conducted: 25, color: "blue" },
    { name: "Computer Networks", code: "CS-302", attended: 14, conducted: 20, color: "purple" },
    { name: "Database Management Systems", code: "CS-303", attended: 18, conducted: 22, color: "teal" },
    { name: "Theory of Computation", code: "CS-304", attended: 10, conducted: 16, color: "orange" },
    { name: "Software Engineering Lab", code: "CS-308", attended: 8, conducted: 8, color: "emerald" }
];

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
    const { name, email, password, collegeName, securityQuestion, securityAnswer } = req.body;

    if (!securityQuestion || !securityAnswer) {
        return res.status(400).json({ error: 'Security question and answer are required' });
    }

    try {
        const studentExists = await Student.findOne({ email });

        if (studentExists) {
            return res.status(400).json({ error: 'Student already exists' });
        }

        // Create student
        const student = await Student.create({
            name,
            email,
            password,
            collegeName: collegeName || '',
            securityQuestion,
            securityAnswer
        });

        if (student) {
            // Seed default subjects for new student
            const subjectsToCreate = defaultSubjects.map(sub => ({
                ...sub,
                studentId: student._id
            }));
            const createdSubjects = await Subject.insertMany(subjectsToCreate);

            // Setup default timetable slots referencing created subjects
            student.timetable = {
                Monday: [
                    { id: "tt-demo-1", subjectId: createdSubjects[0]._id, time: "09:00 AM - 10:00 AM", room: "Room 401" },
                    { id: "tt-demo-2", subjectId: createdSubjects[1]._id, time: "10:15 AM - 11:15 AM", room: "Room 402" }
                ],
                Tuesday: [
                    { id: "tt-demo-3", subjectId: createdSubjects[2]._id, time: "11:30 AM - 12:30 PM", room: "Lab-B" },
                    { id: "tt-demo-4", subjectId: createdSubjects[3]._id, time: "01:30 PM - 02:30 PM", room: "Room 403" }
                ],
                Wednesday: [
                    { id: "tt-demo-5", subjectId: createdSubjects[0]._id, time: "09:00 AM - 10:00 AM", room: "Room 401" }
                ],
                Thursday: [
                    { id: "tt-demo-6", subjectId: createdSubjects[1]._id, time: "10:15 AM - 11:15 AM", room: "Room 402" },
                    { id: "tt-demo-7", subjectId: createdSubjects[4]._id, time: "02:30 PM - 04:30 PM", room: "Lab-C" }
                ],
                Friday: [
                    { id: "tt-demo-8", subjectId: createdSubjects[2]._id, time: "11:30 AM - 12:30 PM", room: "Lab-B" }
                ],
                Saturday: []
            };
            await student.save();

            // Create default demo Bunk log
            await Attendance.create({
                studentId: student._id,
                subjectId: createdSubjects[1]._id,
                dateString: "Tuesday, Jul 7, 2026",
                timestamp: "10:15 AM",
                action: "bunked class",
                details: "Time: 10:15 AM - 11:15 AM"
            });

            res.status(201).json({
                _id: student._id,
                name: student.name,
                email: student.email,
                targetPercentage: student.targetPercentage,
                individualTargetPercentage: student.individualTargetPercentage,
                collegeName: student.collegeName,
                token: generateToken(student._id)
            });
        } else {
            res.status(400).json({ error: 'Invalid student data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Auth student & get token
// @route   POST /api/auth/login
// @access  Public
const loginStudent = async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = await Student.findOne({ email }).select('+password');

        if (student && (await student.matchPassword(password))) {
            res.json({
                _id: student._id,
                name: student.name,
                email: student.email,
                targetPercentage: student.targetPercentage,
                individualTargetPercentage: student.individualTargetPercentage,
                collegeName: student.collegeName,
                token: generateToken(student._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get security question for a student by email
// @route   GET /api/auth/security-question/:email
// @access  Public
const getSecurityQuestion = async (req, res) => {
    const { email } = req.params;

    try {
        const student = await Student.findOne({ email: email.toLowerCase().trim() });
        if (!student) {
            return res.status(404).json({ error: 'Student with this email does not exist' });
        }

        res.json({ question: student.securityQuestion });
    } catch (error) {
        console.error('Get security question error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Reset student password using security answer
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
        return res.status(400).json({ error: 'Email, security answer, and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        const student = await Student.findOne({ email: email.toLowerCase().trim() }).select('+securityAnswer');
        if (!student) {
            return res.status(404).json({ error: 'Student with this email does not exist' });
        }

        const normalizedAnswer = securityAnswer.toLowerCase().trim();
        const isMatch = await bcrypt.compare(normalizedAnswer, student.securityAnswer);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect security answer' });
        }

        // Update password (Student model save hook will hash it)
        student.password = newPassword;
        await student.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { registerStudent, loginStudent, getSecurityQuestion, resetPassword };
