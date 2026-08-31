import admin from 'firebase-admin';
import Session from '../models/Session.js';

class PushService {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    try {
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn('[PushService]: Firebase credentials missing. Push notifications are disabled.');
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle private keys with embedded newlines correctly
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });

      this.initialized = true;
      console.log('[PushService]: Firebase Admin initialized successfully.');
    } catch (error) {
      console.error('[PushService] Initialization error:', error.message);
    }
  }

  /**
   * Send a push notification to all active devices of a user
   * @param {number} userId - The ID of the user to notify
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} [data] - Optional payload data
   */
  async notifyUser(userId, title, body, data = {}) {
    if (!this.initialized) {
      console.warn('[PushService]: Not initialized, skipping notification.');
      return;
    }

    try {
      // Find all active sessions for this user that have a pushToken
      const sessions = await Session.findAll({
        where: {
          userId,
          isRevoked: false
        }
      });

      const pushTokens = sessions
        .map(session => session.pushToken)
        .filter(token => token && token.trim() !== '');

      if (pushTokens.length === 0) {
        console.log(`[PushService]: No active push tokens found for user ${userId}.`);
        return;
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard generic action or custom URL
        },
        tokens: pushTokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`[PushService]: Sent ${response.successCount} messages successfully, ${response.failureCount} failed.`);
      
      // Optional: Cleanup invalid tokens (e.g. UNREGISTERED)
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && (resp.error.code === 'messaging/invalid-registration-token' || resp.error.code === 'messaging/registration-token-not-registered')) {
            failedTokens.push(pushTokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await Session.update(
            { pushToken: null },
            { where: { pushToken: failedTokens } }
          );
          console.log(`[PushService]: Cleaned up ${failedTokens.length} invalid tokens.`);
        }
      }
    } catch (error) {
      console.error('[PushService]: Error sending notification:', error);
    }
  }
}

const pushService = new PushService();
export default pushService;
