// Test utility to manually trigger reminder checks
// Run this with: node backend/utils/testReminders.js

require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');
const Reminder = require('../models/reminder');
const Event = require('../models/event');
const User = require('../models/user');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const displayReminders = async () => {
  console.log('\n=== UPCOMING REMINDERS ===\n');
  const reminders = await Reminder.find({ sent: false })
    .populate('userId', 'name email username')
    .populate('eventId', 'title date')
    .sort({ reminderTime: 1 });

  if (reminders.length === 0) {
    console.log('No upcoming reminders found.');
  } else {
    reminders.forEach((reminder, index) => {
      console.log(`${index + 1}. ${reminder.userId?.username || 'Unknown'} → ${reminder.eventId?.title || 'Unknown Event'}`);
      console.log(`   Reminder Time: ${reminder.reminderTime}`);
      console.log(`   Event Time: ${reminder.eventId?.date}`);
      console.log(`   Type: ${reminder.type}`);
      console.log('');
    });
  }
};

const displayUserStats = async () => {
  console.log('\n=== USER STATISTICS ===\n');
  const users = await User.find().select('username registrations attendedEvents completedEvents activityHistory');

  users.forEach((user) => {
    const attendanceRate = user.registrations.length > 0 
      ? ((user.attendedEvents.length / user.registrations.length) * 100).toFixed(2) 
      : 0;
    
    const completionRate = user.attendedEvents.length > 0 
      ? ((user.completedEvents.length / user.attendedEvents.length) * 100).toFixed(2) 
      : 0;

    console.log(`👤 ${user.username}`);
    console.log(`   Registrations: ${user.registrations.length}`);
    console.log(`   Attended: ${user.attendedEvents.length}`);
    console.log(`   Completed: ${user.completedEvents.length}`);
    console.log(`   Attendance Rate: ${attendanceRate}%`);
    console.log(`   Completion Rate: ${completionRate}%`);
    console.log(`   Recent Activities: ${user.activityHistory.length}`);
    console.log('');
  });
};

const displayEventStatuses = async () => {
  console.log('\n=== EVENT STATUSES ===\n');
  const events = await Event.find().sort({ date: 1 });

  const statusGroups = {
    upcoming: [],
    ongoing: [],
    completed: [],
    cancelled: []
  };

  events.forEach(event => {
    statusGroups[event.status].push(event);
  });

  Object.keys(statusGroups).forEach(status => {
    console.log(`\n${status.toUpperCase()} (${statusGroups[status].length}):`);
    statusGroups[status].forEach(event => {
      console.log(`  • ${event.title} - ${event.date}`);
      console.log(`    Participants: ${event.participants.length}, Attendees: ${event.attendees.length}`);
    });
  });
};

const createTestReminder = async (userId, eventId, hoursBeforeEvent = 0.01) => {
  const event = await Event.findById(eventId);
  if (!event) {
    console.log('❌ Event not found');
    return;
  }

  const reminderTime = new Date(Date.now() + hoursBeforeEvent * 60 * 60 * 1000);
  
  const reminder = await Reminder.create({
    userId,
    eventId,
    reminderTime,
    hoursBeforeEvent,
    type: 'email'
  });

  console.log(`✅ Test reminder created! Will trigger at: ${reminderTime}`);
  return reminder;
};

const main = async () => {
  await connectDB();

  const command = process.argv[2];

  switch (command) {
    case 'list':
      await displayReminders();
      await displayEventStatuses();
      break;

    case 'stats':
      await displayUserStats();
      break;

    case 'test-create':
      // Usage: node testReminders.js test-create USER_ID EVENT_ID
      const userId = process.argv[3];
      const eventId = process.argv[4];
      if (userId && eventId) {
        await createTestReminder(userId, eventId);
      } else {
        console.log('Usage: node testReminders.js test-create USER_ID EVENT_ID');
      }
      break;

    case 'clear-sent':
      const result = await Reminder.deleteMany({ sent: true });
      console.log(`✅ Deleted ${result.deletedCount} sent reminders`);
      break;

    default:
      console.log(`
📋 Available Commands:

  list          - Display all upcoming reminders and event statuses
  stats         - Display user statistics
  test-create   - Create a test reminder (args: userId eventId)
  clear-sent    - Delete all sent reminders

Usage: node backend/utils/testReminders.js [command]
      `);
  }

  mongoose.connection.close();
};

main().catch(console.error);
