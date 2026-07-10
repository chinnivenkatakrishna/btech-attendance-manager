const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    dateString: {
        type: String,
        required: true // e.g. "Tuesday, Jul 7, 2026"
    },
    timestamp: {
        type: String,
        required: true // e.g. "10:15 AM"
    },
    action: {
        type: String,
        default: 'bunked class'
    },
    details: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
