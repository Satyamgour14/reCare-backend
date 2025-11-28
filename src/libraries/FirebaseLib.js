import firebaseAdmin from 'firebase-admin';
import logger from '~/utils/logger';
// import serviceAccount from '../../serviceAccountKey.json';

/**
 *  Firebase library to send notificaton
 */
class FirebaseLib {

  constructor() {
    this.firebaseAdmin = null;
    this.initialize();
  }

  async initialize() {
    try {
      if (!this.firebaseAdmin) {
        this.firebaseAdmin = firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(serviceAccount),
        });
      }
    } catch (error) {
      logger.error('Firebase Initialization failed:', error);
    }
  }

  async sendNotification(token, notificationPayload) {
    const message = {
      token: token,
      apns: {
        payload: {
          aps: {
            "content-available": 1,
          },
        },
      },
      data: notificationPayload.additionalData,
      notification: {
        title: notificationPayload.title,
        body: notificationPayload.body,
      }
    };

    try {
      await this.firebaseAdmin.messaging().send(message);
    } catch (error) {
      logger.error('Error sending single notification:', error);
      return error;
    }

  }
}
module.exports = FirebaseLib;