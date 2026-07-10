const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'btech_attendance_secret_key_12345', {
        expiresIn: '30d'
    });
};

module.exports = generateToken;
