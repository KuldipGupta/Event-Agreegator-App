const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  reminderTime: { 
    type: Date, 
    required: true 
  },
  sent: { 
    type: Boolean, 
    default: false 
  },
  type: { 
    type: String, 
    enum: ['email', 'in-app', 'both'], 
    default: 'both' 
  },
  hoursBeforeEvent: Number,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient querying
reminderSchema.index({ reminderTime: 1, sent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
