import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`API Error: ${err.message}`, { error: err, url: req.originalUrl, method: req.method });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
