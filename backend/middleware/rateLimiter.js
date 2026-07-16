const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    logger.debug(`Rate limit check: ${req.method} ${req.path}`);
    return false;
  }
});

// Strict rate limiter for auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login/registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Contest endpoint limiter: 50 requests per minute
const contestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many contest requests, please try again later.'
});

// API endpoint limiter: 200 requests per hour
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  message: 'API rate limit exceeded'
});

module.exports = {
  generalLimiter,
  authLimiter,
  contestLimiter,
  apiLimiter
};
