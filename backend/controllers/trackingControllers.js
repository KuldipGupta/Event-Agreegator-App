const User = require('../models/user');
const Event = require('../models/event');
const Reminder = require('../models/reminder');
const Notification = require('../models/notification');
const { createRemindersForUser, deleteEventReminders, getUserReminders, sendRegistrationNotifications } = require('../utils/reminderScheduler');

// Update user reminder preferences
exports.updateReminderPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { enabled, timings } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.reminderPreferences = {
      enabled: enabled !== undefined ? enabled : user.reminderPreferences.enabled,
      timings: timings || user.reminderPreferences.timings
    };

    await user.save();

    res.json({
      message: 'Reminder preferences updated successfully',
      reminderPreferences: user.reminderPreferences
    });
  } catch (error) {
    console.error('Error updating reminder preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user reminder preferences
exports.getReminderPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ reminderPreferences: user.reminderPreferences });
  } catch (error) {
    console.error('Error fetching reminder preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register for event (with reminder creation)
exports.registerForEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event) {
      return res.status(404).json({ message: 'User or Event not found' });
    }

    // Check if already registered
    if (user.registrations.includes(eventId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Add to registrations
    user.registrations.push(eventId);
    event.participants.push(userId);

    // Add activity
    user.activityHistory.push({
      eventId,
      action: 'registered',
      timestamp: new Date()
    });

    await user.save();
    await event.save();

    // Create a one-day reminder using both channels (email + in-app message)
    await createRemindersForUser(userId, eventId, { hoursBeforeList: [24], type: 'both' });
    setImmediate(() => {
      sendRegistrationNotifications(userId, eventId).catch((notificationError) => {
        console.error('Registration notification failed:', notificationError.message);
      });
    });

    res.json({
      message: 'Successfully registered for event',
      event
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unregister from event (with reminder deletion)
exports.unregisterFromEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event) {
      return res.status(404).json({ message: 'User or Event not found' });
    }

    // Remove from registrations
    user.registrations = user.registrations.filter(id => id.toString() !== eventId);
    event.participants = event.participants.filter(id => id.toString() !== userId.toString());

    // Add activity
    user.activityHistory.push({
      eventId,
      action: 'cancelled',
      timestamp: new Date()
    });

    await user.save();
    await event.save();

    // Delete reminders
    await deleteEventReminders(userId, eventId);

    res.json({
      message: 'Successfully unregistered from event'
    });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark event as attended
exports.markEventAttended = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event) {
      return res.status(404).json({ message: 'User or Event not found' });
    }

    // Check if registered
    if (!user.registrations.includes(eventId)) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    // Check if already attended
    if (user.attendedEvents.includes(eventId)) {
      return res.status(400).json({ message: 'Already marked as attended' });
    }

    // Add to attended events
    user.attendedEvents.push(eventId);
    event.attendees.push(userId);

    // Add activity
    user.activityHistory.push({
      eventId,
      action: 'attended',
      timestamp: new Date()
    });

    await user.save();
    await event.save();

    res.json({
      message: 'Event marked as attended',
      event
    });
  } catch (error) {
    console.error('Error marking event as attended:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark event as completed
exports.markEventCompleted = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event) {
      return res.status(404).json({ message: 'User or Event not found' });
    }

    // Check if already completed
    if (user.completedEvents.includes(eventId)) {
      return res.status(400).json({ message: 'Already marked as completed' });
    }

    // Add to completed events
    user.completedEvents.push(eventId);

    // Add activity
    user.activityHistory.push({
      eventId,
      action: 'completed',
      timestamp: new Date()
    });

    await user.save();

    res.json({
      message: 'Event marked as completed',
      event
    });
  } catch (error) {
    console.error('Error marking event as completed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user activity history
exports.getActivityHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, action } = req.query;

    const user = await User.findById(userId).populate('activityHistory.eventId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let activityHistory = user.activityHistory;

    // Filter by action if specified
    if (action) {
      activityHistory = activityHistory.filter(activity => activity.action === action);
    }

    // Sort by timestamp (most recent first) and limit
    activityHistory = activityHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit));

    res.json({ activityHistory });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      totalRegistrations: user.registrations.length,
      totalAttended: user.attendedEvents.length,
      totalCompleted: user.completedEvents.length,
      totalFavorites: user.favorites.length,
      attendanceRate: user.registrations.length > 0 
        ? ((user.attendedEvents.length / user.registrations.length) * 100).toFixed(2) 
        : 0,
      completionRate: user.attendedEvents.length > 0 
        ? ((user.completedEvents.length / user.attendedEvents.length) * 100).toFixed(2) 
        : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get upcoming reminders
exports.getUpcomingReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const reminders = await getUserReminders(userId);

    res.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reminder messages (in-app notifications)
exports.getReminderMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Notification.find({ userId, type: 'reminder' })
      .populate('eventId', 'title date href')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching reminder messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark reminder message as read
exports.markReminderMessageRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const updated = await Notification.findOneAndUpdate(
      { _id: messageId, userId },
      { read: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message marked as read', notification: updated });
  } catch (error) {
    console.error('Error marking reminder message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
