const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, username, password, email, collegeName, dob, gender, age, department, mobile } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    // Explicitly whitelist fields — never spread req.body to prevent mass assignment (role, admin escalation, etc.)
    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
      collegeName,
      dob,
      gender,
      age,
      department,
      mobile,
      role: 'user'
    });
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isMatch = await bcrypt.compare(password, user?.password || '');

    if (!user || !isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};
