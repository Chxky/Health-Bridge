import { db, TIMESTAMP, FIELD_VALUE, messaging } from '../config';
import * as admin from 'firebase-admin';
import axios from 'axios';

interface NotificationPayload {
  title: string;
  body: string;
  type: 'low_stock' | 'expiry_alert' | 'consignment_received' | 'reorder_generated' | 'compliance_alert' | 'system';
  facilityId?: string;
  targetRoles: string[];
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export async function sendNotification(payload: NotificationPayload): Promise<string> {
  try {
    const docRef = await db.collection('notifications').add({
      ...payload,
      read: false,
      readBy: [],
      createdAt: TIMESTAMP.now(),
      updatedAt: TIMESTAMP.now(),
    });

    await sendFCMNotification(payload);
    await sendEmailNotification(payload);

    return docRef.id;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

async function sendFCMNotification(payload: NotificationPayload): Promise<void> {
  try {
    const usersSnapshot = await db
      .collection('users')
      .where('fcmToken', '!=', null)
      .where('notificationsEnabled', '==', true)
      .get();

    const tokens: string[] = [];
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      const roleMatch = payload.targetRoles.includes(user.role);
      const facilityMatch = !payload.facilityId || user.facilityId === payload.facilityId;

      if (roleMatch && facilityMatch && user.fcmToken) {
        tokens.push(user.fcmToken);
      }
    });

    if (tokens.length === 0) return;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        ...(payload.data || {}),
        ...(payload.facilityId ? { facilityId: payload.facilityId } : {}),
      },
      android: {
        priority: payload.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: payload.type === 'low_stock' ? 'critical_alerts' : 'general_notifications',
          priority: payload.priority === 'high' ? 'high' : 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: payload.title,
              body: payload.body,
            },
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`FCM sent to ${response.successCount} devices, ${response.failureCount} failures`);
  } catch (error) {
    console.error('FCM notification error:', error);
  }
}

async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;

  if (!sendGridApiKey) {
    console.log('SendGrid API key not configured, skipping email notification');
    return;
  }

  try {
    const usersSnapshot = await db
      .collection('users')
      .where('emailNotifications', '==', true)
      .get();

    const recipients: string[] = [];
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      const roleMatch = payload.targetRoles.includes(user.role);
      const facilityMatch = !payload.facilityId || user.facilityId === payload.facilityId;

      if (roleMatch && facilityMatch && user.email) {
        recipients.push(user.email);
      }
    });

    if (recipients.length === 0) return;

    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: recipients.map((email: string) => ({ email })),
            subject: `[HealthBridge MedTrack] ${payload.title}`,
          },
        ],
        from: {
          email: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@healthbridge.co.zw',
          name: 'HealthBridge MedTrack',
        },
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #1a365d;">HealthBridge MedTrack Alert</h2>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
                  <h3>${payload.title}</h3>
                  <p>${payload.body}</p>
                  ${payload.facilityId
                    ? `<p><strong>Facility:</strong> ${payload.facilityId}</p>`
                    : ''
                  }
                  <p><strong>Type:</strong> ${payload.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <hr style="margin-top: 20px;" />
                <p style="color: #718096; font-size: 12px;">
                  This is an automated message from HealthBridge MedTrack.
                  Please do not reply to this email.
                </p>
              </div>
            `,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Email notification sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

export async function sendLowStockAlert(
  facilityId: string,
  facilityName: string,
  medicineName: string,
  currentQuantity: number,
  minimumThreshold: number
): Promise<void> {
  await sendNotification({
    title: 'Low Stock Alert',
    body: `${medicineName} is low at ${facilityName}. Current stock: ${currentQuantity} (threshold: ${minimumThreshold}). Immediate reorder recommended.`,
    type: 'low_stock',
    facilityId,
    targetRoles: ['pharmacist', 'hospital_admin', 'natpharm_officer', 'natpharm_admin'],
    priority: 'high',
    data: {
      medicineName,
      currentQuantity: currentQuantity.toString(),
      minimumThreshold: minimumThreshold.toString(),
    },
  });
}

export async function sendExpiryAlert(
  facilityId: string,
  facilityName: string,
  medicineName: string,
  batchNumber: string,
  expiryDate: Date,
  daysUntilExpiry: number
): Promise<void> {
  const urgencyLabel = daysUntilExpiry <= 30 ? 'CRITICAL' : daysUntilExpiry <= 60 ? 'WARNING' : 'NOTICE';

  await sendNotification({
    title: `${urgencyLabel}: Medicine Expiry Alert`,
    body: `${medicineName} (Batch: ${batchNumber}) at ${facilityName} expires in ${daysUntilExpiry} days (${expiryDate.toLocaleDateString()}). Please review and plan usage or redistribution.`,
    type: 'expiry_alert',
    facilityId,
    targetRoles: ['pharmacist', 'hospital_admin', 'natpharm_officer', 'natpharm_admin'],
    priority: daysUntilExpiry <= 30 ? 'high' : 'normal',
    data: {
      medicineName,
      batchNumber,
      expiryDate: expiryDate.toISOString(),
      daysUntilExpiry: daysUntilExpiry.toString(),
    },
  });
}

export async function sendReorderAlert(
  facilityId: string,
  facilityName: string,
  medicineName: string,
  purchaseRequestId: string
): Promise<void> {
  await sendNotification({
    title: 'Purchase Request Generated',
    body: `A purchase request for ${medicineName} has been auto-generated for ${facilityName}. Please review and approve.`,
    type: 'reorder_generated',
    facilityId,
    targetRoles: ['hospital_admin', 'natpharm_officer', 'natpharm_admin'],
    priority: 'normal',
    data: {
      medicineName,
      purchaseRequestId,
    },
  });
}
