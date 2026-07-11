const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
    getStudentProfile, 
    updateStudentProfile, 
    getStudentTimetable, 
    addTimetableSlot, 
    deleteTimetableSlot,
    reorderTimetableSlots
} = require('../controllers/studentController');
const router = express.Router();

router.route('/profile')
    .get(protect, getStudentProfile)
    .put(protect, updateStudentProfile);
    
router.route('/timetable')
    .get(protect, getStudentTimetable)
    .post(protect, addTimetableSlot);
    
router.put('/timetable/reorder', protect, reorderTimetableSlots);
router.delete('/timetable/:day/:id', protect, deleteTimetableSlot);

module.exports = router;
