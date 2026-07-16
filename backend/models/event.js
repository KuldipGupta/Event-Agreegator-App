const mongoose = require('mongoose');


const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  platform: String,
  href: String,
  externalId: String, // for external contests
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  duration: Number, // in hours
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to auto-update status
eventSchema.pre('save', function(next) {
  if (this.date) {
    const now = new Date();
    const eventDate = new Date(this.date);
    const duration = this.duration || 2; // default 2 hours
    const eventEndDate = new Date(eventDate.getTime() + duration * 60 * 60 * 1000);
    
    if (now < eventDate) {
      this.status = 'upcoming';
    } else if (now >= eventDate && now < eventEndDate) {
      this.status = 'ongoing';
    } else if (now >= eventEndDate) {
      this.status = 'completed';
    }
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);