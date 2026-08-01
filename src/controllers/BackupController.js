import backupService from '../services/BackupService.js';
import logger from '../utils/logger.js';

export const getBackups = async (req, res, next) => {
  try {
    const backups = await backupService.getBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    next(error);
  }
};

export const createBackup = async (req, res, next) => {
  try {
    const backup = await backupService.createBackup();
    logger.info(`Manual backup created: ${backup.filename}`);
    res.status(201).json({ success: true, message: 'Backup created successfully', data: backup });
  } catch (error) {
    logger.error('Manual backup failed: ' + error.message);
    next(error);
  }
};

export const restoreBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;
    await backupService.restoreBackup(filename);
    logger.info(`Database restored from backup: ${filename}`);
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    logger.error('Database restore failed: ' + error.message);
    next(error);
  }
};

export const deleteBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;
    await backupService.deleteBackup(filename);
    logger.info(`Backup deleted: ${filename}`);
    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    next(error);
  }
};
