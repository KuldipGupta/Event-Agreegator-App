const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    const thirtyDaysLater = new Date();
    
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysLater.setDate(today.getDate() + 30);

    // Get both past 30 days and upcoming 30 days events
    const events = await Event.find({
      date: {
        $gte: thirtyDaysAgo,
        $lte: thirtyDaysLater
      }
    }).sort({ date: 1 }); // Sort by date ascending

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit event (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete event (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;