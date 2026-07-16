const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../utils/cache');
const { getCacheKey } = cache;
const { validateClistQuery } = require('../middleware/validation');
const { contestLimiter } = require('../middleware/rateLimiter');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const CLIST_USERNAME = process.env.CLIST_USERNAME;
const CLIST_API_KEY = process.env.CLIST_API_KEY;

const getResourceName = (contest) => {
  const resource = contest?.resource;
  if (!resource) return '';
  if (typeof resource === 'string') return resource;
  if (typeof resource === 'object') {
    return (resource.name || resource.host || resource.short || '').toString();
  }
  return String(resource);
};

// Get contests with caching and validation
router.get('/contests', 
  contestLimiter, 
  validateClistQuery, 
  asyncHandler(async (req, res) => {
    const { start, end, resource } = req.query;
    
    // Validate API credentials
    if (!CLIST_USERNAME || !CLIST_API_KEY) {
      logger.error('Missing CLIST API credentials');
      throw new AppError('API configuration error', 500);
    }
    
    // Default: last 15 days through the next 15 days
    const today = new Date();
    const fifteenDaysAgo = new Date();
    const fifteenDaysLater = new Date();

    fifteenDaysAgo.setDate(today.getDate() - 15);
    fifteenDaysLater.setDate(today.getDate() + 15);

    const startDate = start || fifteenDaysAgo.toISOString().split('T')[0];
    const endDate = end || fifteenDaysLater.toISOString().split('T')[0];
    
    logger.info(`Date range requested: ${startDate} to ${endDate}`);
    
    // Generate cache key
    const cacheKey = getCacheKey('clist_contests', { startDate, endDate, resource });
    
    // Check cache first
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      logger.info('Returning cached contests data');
      return res.json(cachedData);
    }
    
    // Fetch from API if not cached
    try {
      logger.info(`Fetching contests from Clist API: ${startDate} to ${endDate}`);
      // Use only supported Clist filters and do platform matching on our side.
      const url = `https://clist.by/api/v4/contest/?username=${CLIST_USERNAME}&api_key=${CLIST_API_KEY}&start__gte=${startDate}&start__lte=${endDate}&order_by=start&limit=1000`;
      logger.info(`Clist API URL: ${url.replace(CLIST_API_KEY, 'REDACTED')}`);
      const response = await axios.get(url, { timeout: 15000 });
      
      // Log sample dates from response
      let contests = response.data.objects || [];
      logger.info(`Successfully fetched ${contests.length} contests`);
      if (resource) {
        const normalized = resource.toLowerCase();
        const filtered = contests.filter(c => getResourceName(c).toLowerCase().includes(normalized));
        if (filtered.length !== contests.length) {
          logger.info(`Applied server-side resource filter '${resource}': ${filtered.length} of ${contests.length} contests retained`);
        }
        contests = filtered;
        response.data.objects = contests; // Keep shape consistent for client
      }
      if (contests.length > 0) {
        logger.info(`Sample dates: first=${contests[0]?.start}, last=${contests[contests.length - 1]?.start}`);
      }
      
      // Cache the response for 1 hour (reduced from 24h for testing)
      await cache.setCache(cacheKey, response.data, 1 * 60 * 60);
      
      res.json(response.data);
    } catch (err) {
      logger.error('CLIST API error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new AppError('Invalid CLIST API credentials', 401);
      }
      throw new AppError('Failed to fetch contests from external API', 503);
    }
  })
);

module.exports = router;