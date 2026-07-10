const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env in server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'btech_attendance_secret_key_12345'
};
