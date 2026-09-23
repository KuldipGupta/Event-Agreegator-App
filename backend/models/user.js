const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  collegeName: String,
  dob: String,
  gender: String,
  age: String,
  department: String,
  mobile: String,
  profileImage: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  // Reminder preferences
  reminderPreferences: {
    enabled: { type: Boolean, default: true },
    timings: [{ type: Number, default: [24, 1] }] // hours before event (24h, 1h)
  },
  // Activity tracking
  activityHistory: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    action: { type: String, enum: ['registered', 'attended', 'completed', 'cancelled'] },
    timestamp: { type: Date, default: Date.now }
  }],
  attendedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  completedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
});

module.exports = mongoose.model('User', userSchema);