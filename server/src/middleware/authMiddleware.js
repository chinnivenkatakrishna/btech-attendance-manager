const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'btech_attendance_secret_key_12345');

            // Get student from database (excluding password)
            req.student = await Student.findById(decoded.id);
            if (!req.student) {
                return res.status(401).json({ error: 'Not authorized, student user not found' });
            }

            next();
        } catch (error) {
            console.error('Auth middleware token validation error:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };
