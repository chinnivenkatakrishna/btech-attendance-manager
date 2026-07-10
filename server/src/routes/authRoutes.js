const express = require('express');
const { registerStudent, loginStudent, getSecurityQuestion, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/security-question/:email', getSecurityQuestion);
router.post('/reset-password', resetPassword);

module.exports = router;
