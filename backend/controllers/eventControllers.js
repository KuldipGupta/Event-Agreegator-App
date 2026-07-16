const Event = require('../models/event');

exports.getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};

exports.createEvent = async (req, res) => {
  const { title, description, date } = req.body;
  const event = await Event.create({ title, description, date });
  res.status(201).json(event);
};
