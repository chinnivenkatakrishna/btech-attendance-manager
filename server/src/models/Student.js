const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TimetableClassSchema = new mongoose.Schema({
    id: { type: String, required: true }, // unique frontend ID
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    time: { type: String, required: true },
    room: { type: String, default: '' }
});

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // prevent select by default
    },
    targetPercentage: {
        type: Number,
        default: 75
    },
    individualTargetPercentage: {
        type: Number,
        default: 40
    },
    collegeName: {
        type: String,
        default: ''
    },
    securityQuestion: {
        type: String,
        required: [true, 'Please select a security question']
    },
    securityAnswer: {
        type: String,
        required: [true, 'Please provide a security answer'],
        select: false
    },
    loggedClasses: {
        type: Object,
        default: {}
    },
    timetable: {
        Monday: { type: [TimetableClassSchema], default: [] },
        Tuesday: { type: [TimetableClassSchema], default: [] },
        Wednesday: { type: [TimetableClassSchema], default: [] },
        Thursday: { type: [TimetableClassSchema], default: [] },
        Friday: { type: [TimetableClassSchema], default: [] },
        Saturday: { type: [TimetableClassSchema], default: [] }
    }
}, { timestamps: true });

// Encrypt password and security answer using bcrypt
StudentSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (this.isModified('securityAnswer')) {
        const salt = await bcrypt.genSalt(10);
        const normalizedAnswer = this.securityAnswer.toLowerCase().trim();
        this.securityAnswer = await bcrypt.hash(normalizedAnswer, salt);
    }
    next();
});

// Match student entered password to hashed password in database
StudentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);
