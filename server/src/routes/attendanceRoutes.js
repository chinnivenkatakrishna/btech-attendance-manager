const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getLogs,
    deleteLog,
    markTimetableAttendance,
    markBulkAttendance,
    clearLogs
} = require('../controllers/attendanceController');
const router = express.Router();

router.route('/subjects')
    .get(protect, getSubjects)
    .post(protect, addSubject);
    
router.route('/subjects/:id')
    .put(protect, updateSubject)
    .delete(protect, deleteSubject);
    
router.get('/logs', protect, getLogs);
router.delete('/logs/:id', protect, deleteLog);
router.post('/mark', protect, markTimetableAttendance);
router.post('/bulk', protect, markBulkAttendance);
router.post('/reset', protect, clearLogs);

module.exports = router;
