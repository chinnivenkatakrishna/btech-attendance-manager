const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a subject name'],
        trim: true
    },
    code: {
        type: String,
        default: ''
    },
    attended: {
        type: Number,
        default: 0
    },
    conducted: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: 'blue'
    }
}, { timestamps: true });

// Prevent duplicate subject names for the same student
SubjectSchema.index({ studentId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
