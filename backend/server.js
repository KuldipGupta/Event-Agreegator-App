const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const userEventsRoutes = require('./routes/userEvents');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contact');
const clistRoutes = require('./routes/clist');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { startReminderScheduler } = require('./utils/reminderScheduler');

connectDB();
const app = express();

app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Apply rate limiters
app.use(generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/user', userEventsRoutes);

// API routes
app.use('/api/clist', clistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/contests', require('./routes/contestRoutes'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/tracking', require('./routes/trackingRoutes'));

const clientBuildPath = process.env.CLIENT_BUILD_PATH
  ? path.resolve(process.env.CLIENT_BUILD_PATH)
  : path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
        if (!req.originalUrl.startsWith('/api/')) {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        } else {
            res.status(404).json({ message: 'API route not found' });
        }
    });
} else {
    logger.warn(`${clientBuildPath} not found. React frontend will not be served.`);
}

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`✅ Server running on port ${PORT}`);
    // Start reminder scheduler
    startReminderScheduler();
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Set PORT to an open port or stop the process using it.`);
        process.exit(1);
    }
    logger.error('Server error', { error: err });
    process.exit(1);
});