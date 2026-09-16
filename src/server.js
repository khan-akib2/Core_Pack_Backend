import 'dotenv/config';
import cron from 'node-cron';
import app from './app.js';
import connectDB from './config/db.js';
import backupService from './services/BackupService.js';
import WhatsAppService from './services/WhatsAppService.js';

import logger from './utils/logger.js';
import { seedDatabase } from './utils/seed.js';

const PORT = process.env.PORT || 5000;

connectDB().then(async (connected) => {
  if (connected && (process.env.SEED_DB === 'true' || process.env.NODE_ENV !== 'production')) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`[Server]: API listening on port ${PORT}`);
    logger.info(`Server started on port ${PORT}`);

    // Optional boot-time auto-initialization (disabled by default to preserve 512MB RAM on free hosting tiers)
    if (process.env.AUTO_INIT_WHATSAPP === 'true') {
      logger.info('AUTO_INIT_WHATSAPP is enabled. Initializing WhatsApp on startup...');
      WhatsAppService.initialize();
    } else {
      logger.info('WhatsApp boot-time auto-initialization is disabled. Use settings page or /api/v1/whatsapp/reconnect to initialize on demand.');
    }

    // Schedule daily backup at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting scheduled daily database backup...');
        const backup = await backupService.createBackup();
        logger.info(`Scheduled backup completed successfully: ${backup.filename}`);
      } catch (error) {
        logger.error(`Scheduled backup failed: ${error.message}`);
      }
    });
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  app.listen(PORT, () => {
    console.log(`🚀 Core Pack India Backend running on port ${PORT} in fallback mode`);
  });
});
