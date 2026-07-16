const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingControllers');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Reminder preferences routes
router.get('/reminders/preferences', trackingController.getReminderPreferences);
router.put('/reminders/preferences', trackingController.updateReminderPreferences);
router.get('/reminders/upcoming', trackingController.getUpcomingReminders);
router.get('/reminders/messages', trackingController.getReminderMessages);
router.patch('/reminders/messages/:messageId/read', trackingController.markReminderMessageRead);

// Event registration routes (with tracking)
router.post('/events/register', trackingController.registerForEvent);
router.post('/events/unregister', trackingController.unregisterFromEvent);
router.post('/events/attend', trackingController.markEventAttended);
router.post('/events/complete', trackingController.markEventCompleted);

// Activity and stats routes
router.get('/activity/history', trackingController.getActivityHistory);
router.get('/activity/stats', trackingController.getUserStats);

module.exports = router;
