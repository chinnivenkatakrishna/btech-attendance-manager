const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server/.env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const Student = require('../models/Student');

async function resetPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
        console.log('Usage: node src/utils/resetPassword.js <email> <newPassword>');
        process.exit(1);
    }

    if (newPassword.length < 6) {
        console.log('Error: Password must be at least 6 characters long.');
        process.exit(1);
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.log('Error: MONGO_URI is missing from your .env file.');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const student = await Student.findOne({ email });
        if (!student) {
            console.log(`Error: No student found with email: ${email}`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`Resetting password for ${student.name} (${email})...`);
        student.password = newPassword;
        
        // This save() call will trigger the pre('save') hook in Student.js to securely hash the password
        await student.save();
        console.log('Success! Password has been reset successfully.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('An error occurred during password reset:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

resetPassword();
