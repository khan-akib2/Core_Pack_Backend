import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import EventEmitter from 'events';
import logger from '../utils/logger.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.qrCode = null;
    this.status = 'DISCONNECTED'; // INITIALIZING, QR_READY, AUTHENTICATED, READY, DISCONNECTED
    this.clientInfo = null;
    this.lastError = null;
    this.isInitializing = false;
  }

  cleanupStaleLocks(cleanSession = false) {
    const authDir = path.resolve('./.wwebjs_auth');
    const sessionDir = path.join(authDir, 'session');

    if (cleanSession && fs.existsSync(sessionDir)) {
      logger.warn('Cleaning session directory for a fresh WhatsApp Web start...');
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info('Cleaned WhatsApp session directory successfully.');
        return;
      } catch (err) {
        logger.warn('Error deleting session directory:', err.message);
      }
    }

    if (!fs.existsSync(sessionDir)) return;

    logger.info('Checking for stale Chrome locks in .wwebjs_auth/session...');
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

    const lockFilePath = path.join(sessionDir, 'SingletonLock');
    if (fs.existsSync(lockFilePath)) {
      try {
        const linkTarget = fs.readlinkSync(lockFilePath);
        const parts = linkTarget.split('-');
        const pidStr = parts[parts.length - 1];
        const pid = parseInt(pidStr, 10);

        if (!isNaN(pid)) {
          try {
            process.kill(pid, 0);
            logger.warn(`Found active process (${pid}) locking session. Terminating lingering process...`);
            process.kill(pid, 'SIGKILL');
          } catch (e) {
            logger.info(`Lock holder process (${pid}) is dead. Cleaning up stale symlinks...`);
          }
        }
      } catch (err) {
        logger.warn('Could not read SingletonLock symlink:', err.message);
      }
    }

    for (const file of lockFiles) {
      const p = path.join(sessionDir, file);
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
          logger.info(`Removed stale lock file: ${file}`);
        } catch (err) {
          logger.warn(`Failed to remove lock file ${file}: ${err.message}`);
        }
      }
    }
  }

  async initialize(cleanSessionOnFailure = false) {
    if (this.isInitializing) {
      logger.info('WhatsAppService initialization is already in progress. Skipping duplicate call.');
      return;
    }

    if (this.client && ['READY', 'AUTHENTICATED', 'QR_READY'].includes(this.status)) {
      logger.info('WhatsAppService is already running in state: ' + this.status);
      return;
    }

    this.isInitializing = true;
    this.status = 'INITIALIZING';
    this.lastError = null;
    this.emit('status', this.status);

    try {
      if (this.client) {
        logger.info('Destroying existing WhatsApp client before starting new one...');
        try {
          await this.client.destroy();
        } catch (e) {
          logger.warn('Error destroying prior WhatsApp client instance:', e.message);
        }
        this.client = null;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      this.cleanupStaleLocks(cleanSessionOnFailure);

      const execPath = await puppeteer.executablePath();
      this.client = new Client({
        authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
        webVersionCache: {
          type: 'local'
        },
        puppeteer: {
          executablePath: execPath,
          headless: true,
          bypassCSP: true,
          protocolTimeout: 120000, // 2 minutes timeout for CDP commands
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run'
          ]
        }
      });

      this.client.on('qr', (qr) => {
        logger.info('WhatsApp QR Code generated successfully. Awaiting scan...');
        this.qrCode = qr;
        this.status = 'QR_READY';
        this.lastError = null;
        this.emit('qr', qr);
        this.emit('status', this.status);
      });

      this.client.on('authenticated', () => {
        logger.info('WhatsApp authenticated successfully.');
        this.qrCode = null;
        this.status = 'AUTHENTICATED';
        this.lastError = null;
        this.emit('status', this.status);
      });

      this.client.on('auth_failure', msg => {
        logger.error(`WhatsApp auth failure: ${msg}`);
        this.status = 'DISCONNECTED';
        this.lastError = `Authentication failed: ${msg}`;
        this.emit('status', this.status);
      });

      this.client.on('ready', () => {
        logger.info('WhatsApp client is ready.');
        this.status = 'READY';
        this.clientInfo = this.client.info;
        this.lastError = null;
        this.emit('status', this.status);
        this.emit('ready', this.client.info);
      });

      this.client.on('disconnected', (reason) => {
        logger.warn(`WhatsApp client disconnected: ${reason}`);
        this.status = 'DISCONNECTED';
        this.qrCode = null;
        this.clientInfo = null;
        this.lastError = `Disconnected: ${reason}`;
        this.emit('status', this.status);
      });

      logger.info('Initializing WhatsApp client (launching Chromium with local webVersionCache)...');
      
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timed out after 60 seconds.')), 60000)
      );

      try {
        await Promise.race([initPromise, timeoutPromise]);
      } catch (err) {
        // Force cleanup on timeout, but don't await destroy as it might hang if browser is stuck
        try {
          if (this.client) {
            this.client.destroy().catch(() => {});
          }
        } catch (destroyErr) {}
        this.client = null;
        throw err;
      }

    } catch (error) {
      logger.error('Failed to initialize WhatsApp client:', error);
      this.status = 'DISCONNECTED';
      this.lastError = error.message || 'Initialization failed';
      this.qrCode = null;
      this.clientInfo = null;
      this.emit('status', this.status);

      if (error.message && (error.message.includes('detached Frame') || error.message.includes('timed out'))) {
        logger.warn('Session corruption or timeout detected. Automatically marking session folder for cleanup...');
        this.cleanupStaleLocks(true);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCode,
      info: this.clientInfo,
      lastError: this.lastError
    };
  }

  async logout() {
    try {
      if (this.client) {
        await this.client.logout().catch(() => {});
        await this.client.destroy().catch(() => {});
        this.client = null;
      }
    } catch (err) {
      logger.error('Error logging out WhatsApp:', err);
    } finally {
      this.status = 'DISCONNECTED';
      this.qrCode = null;
      this.clientInfo = null;
      this.lastError = null;
      this.emit('status', this.status);
      this.cleanupStaleLocks(true);
    }
  }

  async reinitialize() {
    if (this.isInitializing) {
      logger.info('WhatsApp initialization already running. Returning current status.');
      return this.getStatus();
    }

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (e) {
        logger.warn('Error destroying prior WhatsApp client instance:', e.message);
      }
      this.client = null;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    this.status = 'DISCONNECTED';
    await this.initialize(true);
    return this.getStatus();
  }

  async sendDocumentWhatsApp({ toNumber, message, attachmentBuffer, filename }) {
    if (this.status !== 'READY' || !this.client) {
      throw new Error('WhatsApp client is not connected. Please scan the QR code in settings.');
    }

    if (!toNumber) {
      throw new Error('Recipient WhatsApp number is required.');
    }

    let formattedNumber = toNumber.replace(/[^\d+]/g, '');
    if (formattedNumber.startsWith('+')) {
      formattedNumber = formattedNumber.substring(1);
    }
    if (formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }

    const chatId = `${formattedNumber}@c.us`;

    try {
      try {
        const isRegistered = await this.client.isRegisteredUser(chatId);
        if (!isRegistered) {
          throw new Error(`The number ${formattedNumber} is not registered on WhatsApp.`);
        }
      } catch (regErr) {
        if (regErr.message && regErr.message.includes('not registered')) {
          throw regErr;
        }
        logger.warn('isRegisteredUser check skipped due to warning:', regErr.message);
      }

      console.log("attachmentBuffer type:", typeof attachmentBuffer);
      console.log("attachmentBuffer instanceof Buffer:", attachmentBuffer instanceof Buffer);
      console.log("attachmentBuffer instanceof Uint8Array:", attachmentBuffer instanceof Uint8Array);
      console.log("attachmentBuffer keys:", Object.keys(attachmentBuffer).slice(0, 10));
      const media = new MessageMedia(
        'application/pdf',
        Buffer.from(attachmentBuffer).toString('base64'),
        filename
      );

      let response;
      try {
        response = await this.client.sendMessage(chatId, media, { caption: message });
      } catch (sendErr) {
        if (sendErr.message && sendErr.message.includes("reading 'id'")) {
          logger.info("Message sent successfully (library response object omitted id).");
          return { success: true, messageId: 'sent' };
        } else if (sendErr.message && (sendErr.message.includes('detached Frame') || sendErr.message.includes('Execution context'))) {
          logger.warn('Detached frame on first attempt. Retrying sendMessage after 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          response = await this.client.sendMessage(chatId, media, { caption: message });
        } else {
          throw sendErr;
        }
      }

      const messageId = response?.id?.id || response?.id?._serialized || 'sent';
      return { success: true, messageId };
    } catch (error) {
      logger.error('WhatsApp sending failed:', error);

      if (error.message && error.message.includes('detached Frame')) {
        logger.info('Detached Frame detected. Triggering background re-initialization...');
        this.reinitialize().catch(err => logger.error('Recovery failed:', err));
      }

      throw new Error(`WhatsApp delivery failed: ${error.message}`);
    }
  }
}

const service = new WhatsAppService();

process.on('SIGINT', async () => {
  if (service.client) {
    try { await service.client.destroy(); } catch (e) {}
  }
});

process.on('SIGTERM', async () => {
  if (service.client) {
    try { await service.client.destroy(); } catch (e) {}
  }
});

export default service;
