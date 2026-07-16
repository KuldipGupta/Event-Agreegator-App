const cron = require('node-cron');
const Reminder = require('../models/reminder');
const Notification = require('../models/notification');
const Event = require('../models/event');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const logger = require('./logger');

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASSWORD || '').replace(/\s/g, '');
const isEmailConfigured = Boolean(emailUser && emailPass);
const smsApiKey = (process.env.SMS_API_KEY || '').trim();
const isSmsConfigured = Boolean(smsApiKey);

// Email transporter configuration
const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    })
  : null;

if (transporter) {
  // Verify SMTP connection on startup
  transporter.verify((error) => {
    if (error) {
      logger.error('SMTP connection failed: ' + error.message);
    } else {
      logger.info('SMTP connection verified - ready to send emails');
    }
  });
} else {
  logger.warn('EMAIL_USER or EMAIL_PASSWORD missing; email notifications are disabled');
}

const normalizeMobile = (mobile) => {
  if (!mobile) return '';
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length < 10) return '';
  return digits.slice(-10);
};

const sendSms = async (mobile, message) => {
  if (!isSmsConfigured) {
    return false;
  }

  const normalizedMobile = normalizeMobile(mobile);
  if (!normalizedMobile) {
    logger.warn('User mobile number missing/invalid; SMS notification skipped');
    return false;
  }

  const smsApiUrl = process.env.SMS_API_URL || 'https://www.fast2sms.com/dev/bulkV2';

  try {
    await require('axios').post(
      smsApiUrl,
      {
        route: process.env.SMS_ROUTE || 'q',
        sender_id: process.env.SMS_SENDER_ID || 'FSTSMS',
        message,
        language: 'english',
        numbers: normalizedMobile
      },
      {
        headers: {
          authorization: smsApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return true;
  } catch (error) {
    logger.error('Error sending SMS notification', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
};

// Create reminders when user registers for an event
exports.createRemindersForUser = async (userId, eventId, options = {}) => {
  try {
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event || !user.reminderPreferences.enabled) {
      return;
    }

    const hoursBeforeList = Array.isArray(options.hoursBeforeList) && options.hoursBeforeList.length > 0
      ? options.hoursBeforeList
      : user.reminderPreferences.timings;
    const reminderType = options.type || 'both';

    const eventDate = new Date(event.date);
    const reminders = [];

    // Create reminders based on user preferences
    for (const hoursBeforeEvent of hoursBeforeList) {
      const reminderTime = new Date(eventDate.getTime() - hoursBeforeEvent * 60 * 60 * 1000);
      
      // Only create reminder if it's in the future
      if (reminderTime > new Date()) {
        const reminder = await Reminder.findOneAndUpdate(
          {
            userId,
            eventId,
            hoursBeforeEvent,
            sent: false
          },
          {
            userId,
            eventId,
            reminderTime,
            hoursBeforeEvent,
            type: reminderType
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );
        reminders.push(reminder);
      }
    }

    return reminders;
  } catch (error) {
    console.error('Error creating reminders:', error);
    throw error;
  }
};

const sendInAppMessage = async (user, event, hoursBeforeEvent) => {
  const label = hoursBeforeEvent === 24 ? '1 day' : `${hoursBeforeEvent} hour(s)`;
  const eventTime = new Date(event.date).toLocaleString();
  const message = `Reminder: ${event.title} starts in ${label}. Start time: ${eventTime}.`;

  try {
    await Notification.create({
      userId: user._id,
      eventId: event._id,
      title: `${event.title} starts in ${label}`,
      message,
      type: 'reminder'
    });
    return true;
  } catch (error) {
    console.error('Error creating in-app reminder message:', error);
    return false;
  }
};

// Send email reminder
const sendEmailReminder = async (user, event, hoursBeforeEvent) => {
  if (!transporter) {
    logger.warn('Skipping reminder email: SMTP credentials are not configured');
    return false;
  }

  const label = hoursBeforeEvent === 24 ? '1 day' : `${hoursBeforeEvent} hour(s)`;
  const mailOptions = {
    from: `"Event Aggregator App" <${emailUser}>`,
    to: user.email,
    subject: `⏰ Reminder: ${event.title} starts in ${label} | Event Aggregator App`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#1a73e8;padding:20px 30px">
          <h1 style="color:#fff;margin:0;font-size:22px">🏆 Event Aggregator App</h1>
          <p style="color:#c9e0ff;margin:4px 0 0">Your one-stop contest tracker</p>
        </div>
        <div style="padding:30px">
          <h2 style="color:#e67e22;margin-top:0">⏰ Contest Starting Soon!</h2>
          <p>Hi <strong>${user.name || user.username || 'User'}</strong>,</p>
          <p>This is a reminder from <strong>Event Aggregator App</strong> that your registered contest is starting in <strong>${label}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#fff8f0">
              <td style="padding:10px 14px;font-weight:bold;color:#555;width:35%">Contest</td>
              <td style="padding:10px 14px">${event.title}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:bold;color:#555">Platform</td>
              <td style="padding:10px 14px">${event.platform || 'N/A'}</td>
            </tr>
            <tr style="background:#fff8f0">
              <td style="padding:10px 14px;font-weight:bold;color:#555">Start Time</td>
              <td style="padding:10px 14px">${new Date(event.date).toLocaleString()}</td>
            </tr>
            ${event.description ? `<tr><td style="padding:10px 14px;font-weight:bold;color:#555">Description</td><td style="padding:10px 14px">${event.description}</td></tr>` : ''}
          </table>
          ${event.href ? `<p style="text-align:center"><a href="${event.href}" style="display:inline-block;background:#e67e22;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Join Contest Now</a></p>` : ''}
          <p style="color:#555">Good luck! 🚀</p>
        </div>
        <div style="background:#f5f5f5;padding:16px 30px;text-align:center;color:#999;font-size:12px">
          This email was sent by <strong>Event Aggregator App</strong>. You are receiving this because you registered for a contest on our platform.
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendSmsReminder = async (user, event, hoursBeforeEvent) => {
  const label = hoursBeforeEvent === 24 ? '1 day' : `${hoursBeforeEvent} hour(s)`;
  const eventTime = new Date(event.date).toLocaleString();
  const smsText = `Reminder: ${event.title} starts in ${label}. Start: ${eventTime}. ${event.href || ''}`.trim();
  return sendSms(user.mobile, smsText);
};

exports.sendRegistrationNotifications = async (userId, eventId) => {
  try {
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event) {
      return;
    }

    const eventTime = new Date(event.date).toLocaleString();

    if (!user.email) {
      logger.warn(`Registration email skipped: user ${user.username || user._id} has no email address set`);
    } else if (!transporter) {
      logger.warn('Registration email skipped: SMTP credentials are not configured');
    } else {
      const mailOptions = {
        from: `"Event Aggregator App" <${emailUser}>`,
        to: user.email,
        subject: `✅ Registration Confirmed: ${event.title} | Event Aggregator App`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
            <div style="background:#1a73e8;padding:20px 30px">
              <h1 style="color:#fff;margin:0;font-size:22px">🏆 Event Aggregator App</h1>
              <p style="color:#c9e0ff;margin:4px 0 0">Your one-stop contest tracker</p>
            </div>
            <div style="padding:30px">
              <h2 style="color:#1a73e8;margin-top:0">Registration Confirmed ✅</h2>
              <p>Hi <strong>${user.name || user.username || 'User'}</strong>,</p>
              <p>You have successfully registered for the following contest on <strong>Event Aggregator App</strong>:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#f5f8ff">
                  <td style="padding:10px 14px;font-weight:bold;color:#555;width:35%">Contest</td>
                  <td style="padding:10px 14px">${event.title}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-weight:bold;color:#555">Platform</td>
                  <td style="padding:10px 14px">${event.platform || 'N/A'}</td>
                </tr>
                <tr style="background:#f5f8ff">
                  <td style="padding:10px 14px;font-weight:bold;color:#555">Start Time</td>
                  <td style="padding:10px 14px">${eventTime}</td>
                </tr>
              </table>
              ${event.href ? `<p style="text-align:center"><a href="${event.href}" style="display:inline-block;background:#1a73e8;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Open Contest</a></p>` : ''}
              <p style="color:#555">⏰ You will receive a reminder email <strong>1 day before</strong> the contest starts.</p>
            </div>
            <div style="background:#f5f5f5;padding:16px 30px;text-align:center;color:#999;font-size:12px">
              This email was sent by <strong>Event Aggregator App</strong>. You are receiving this because you registered for a contest on our platform.
            </div>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        logger.info(`Registration confirmation email sent to ${user.email}`);
      } catch (error) {
        logger.error('Error sending registration email', { message: error.message });
      }
    }

    if (isSmsConfigured) {
      const smsText = `Registered: ${event.title}. Starts at ${eventTime}. You will get a reminder 1 day before.`;
      await sendSms(user.mobile, smsText);
    }

    await Notification.create({
      userId: user._id,
      eventId: event._id,
      title: `Registered for ${event.title}`,
      message: `You registered successfully. A reminder will be sent 1 day before start time.`,
      type: 'system'
    });
  } catch (error) {
    logger.error('Error sending registration notifications', { message: error.message });
  }
};

// Process pending reminders
const processPendingReminders = async () => {
  try {
    const now = new Date();
    const pendingReminders = await Reminder.find({
      sent: false,
      reminderTime: { $lte: now }
    }).populate('userId eventId');

    for (const reminder of pendingReminders) {
      if (!reminder.userId || !reminder.eventId) {
        reminder.sent = true;
        await reminder.save();
        continue;
      }

      const { userId: user, eventId: event } = reminder;

      let emailSent = true;
      let messageSent = true;

      if (reminder.type === 'email' || reminder.type === 'both') {
        emailSent = await sendEmailReminder(user, event, reminder.hoursBeforeEvent);
      }

      if (reminder.type === 'in-app' || reminder.type === 'both') {
        messageSent = await sendInAppMessage(user, event, reminder.hoursBeforeEvent);
      }

      let smsSent = true;
      if (reminder.type === 'both') {
        smsSent = await sendSmsReminder(user, event, reminder.hoursBeforeEvent);
      }

      if (emailSent || messageSent || smsSent) {
        reminder.sent = true;
        await reminder.save();
      }

      console.log(`Reminder sent to ${user.username} for event ${event.title}`);
    }
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
};

// Update event statuses
const updateEventStatuses = async () => {
  try {
    const events = await Event.find({ status: { $ne: 'cancelled' } });
    
    for (const event of events) {
      const oldStatus = event.status;
      await event.save(); // This will trigger the pre-save middleware
      
      if (oldStatus !== event.status) {
        console.log(`Event ${event.title} status updated from ${oldStatus} to ${event.status}`);
      }
    }
  } catch (error) {
    console.error('Error updating event statuses:', error);
  }
};

// Start the reminder scheduler
exports.startReminderScheduler = () => {
  // Check for pending reminders every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Checking for pending reminders...');
    await processPendingReminders();
  });

  // Update event statuses every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Updating event statuses...');
    await updateEventStatuses();
  });

  console.log('Reminder scheduler started');
};

// Get user's upcoming reminders
exports.getUserReminders = async (userId) => {
  try {
    const reminders = await Reminder.find({
      userId,
      sent: false,
      reminderTime: { $gte: new Date() }
    }).populate('eventId').sort({ reminderTime: 1 });

    return reminders;
  } catch (error) {
    console.error('Error fetching user reminders:', error);
    throw error;
  }
};

// Delete reminders for an event
exports.deleteEventReminders = async (userId, eventId) => {
  try {
    await Reminder.deleteMany({
      userId,
      eventId,
      sent: false
    });
  } catch (error) {
    console.error('Error deleting reminders:', error);
    throw error;
  }
};
