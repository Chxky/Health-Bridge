import * as functions from 'firebase-functions';
import { db, TIMESTAMP, FIELD_VALUE } from '../config';
import { sendLowStockAlert, sendExpiryAlert } from '../services/notificationService';
import { generatePurchaseRequests } from '../services/reorderEngine';

export const onStockUpdate = functions.firestore
  .document('facilityStock/{stockId}')
  .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!afterData) return;

    const facilityId = afterData.facilityId;
    const medicineName = afterData.medicineName;

    if (!beforeData || beforeData.currentQuantity !== afterData.currentQuantity) {
      if (afterData.currentQuantity <= afterData.minimumThreshold) {
        const facilityDoc = await db.collection('facilities').doc(facilityId).get();
        const facilityName = facilityDoc.data()?.name || 'Unknown Facility';

        await sendLowStockAlert(
          facilityId,
          facilityName,
          medicineName,
          afterData.currentQuantity,
          afterData.minimumThreshold
        );

        await generatePurchaseRequests(facilityId);
      }
    }

    if (afterData.expiryDate) {
      const expiryDate = afterData.expiryDate.toDate();
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if ([30, 60, 90].includes(daysUntilExpiry) && afterData.currentQuantity > 0) {
        const facilityDoc = await db.collection('facilities').doc(facilityId).get();
        const facilityName = facilityDoc.data()?.name || 'Unknown Facility';

        await sendExpiryAlert(
          facilityId,
          facilityName,
          medicineName,
          afterData.batchNumber,
          expiryDate,
          daysUntilExpiry
        );
      }
    }

    const lastUpdate = afterData.lastUpdated?.toDate() || new Date(0);
    const now = new Date();
    const secondsSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;

    if (secondsSinceUpdate > 10) {
      await db.collection('facilityStock').doc(context.params.stockId).update({
        lastUpdated: TIMESTAMP.now(),
      });
    }
  });

export const onNewStockMovement = functions.firestore
  .document('stockMovements/{movementId}')
  .onCreate(async (snap, context) => {
    const movement = snap.data();

    const stockQuery = await db
      .collection('facilityStock')
      .where('facilityId', '==', movement.facilityId)
      .where('medicineName', '==', movement.medicineName)
      .where('batchNumber', '==', movement.batchNumber)
      .limit(1)
      .get();

    if (stockQuery.empty) {
      console.warn(
        `No stock record found for ${movement.medicineName} (Batch: ${movement.batchNumber}) at facility ${movement.facilityId}`
      );
      return;
    }

    const stockDoc = stockQuery.docs[0];
    const stockData = stockDoc.data();

    let newQuantity = stockData.currentQuantity;

    switch (movement.action) {
      case 'received':
        newQuantity += movement.quantity;
        break;
      case 'dispensed':
      case 'expired':
      case 'damaged':
        newQuantity = Math.max(0, newQuantity - movement.quantity);
        break;
      case 'transferred':
        newQuantity = Math.max(0, newQuantity - movement.quantity);
        break;
      default:
        console.warn(`Unknown stock action: ${movement.action}`);
        return;
    }

    await db.collection('facilityStock').doc(stockDoc.id).update({
      currentQuantity: newQuantity,
      lastUpdated: TIMESTAMP.now(),
    });

    console.log(
      `Stock updated for ${movement.medicineName} at ${movement.facilityId}: ${stockData.currentQuantity} -> ${newQuantity} (${movement.action})`
    );
  });

export const checkExpiryAlertsDaily = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('Africa/Harare')
  .onRun(async (context) => {
    console.log('Running daily expiry alert check...');

    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const stockSnapshot = await db
      .collection('facilityStock')
      .where('expiryDate', '>=', TIMESTAMP.fromDate(now))
      .where('expiryDate', '<=', TIMESTAMP.fromDate(ninetyDaysFromNow))
      .where('currentQuantity', '>', 0)
      .get();

    let alertCount = 0;

    const facilityCache: Record<string, string> = {};

    for (const doc of stockSnapshot.docs) {
      const stock = doc.data();
      const expiryDate = stock.expiryDate.toDate();
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if ([30, 60, 90].includes(daysUntilExpiry)) {
        if (!facilityCache[stock.facilityId]) {
          const facilityDoc = await db.collection('facilities').doc(stock.facilityId).get();
          facilityCache[stock.facilityId] = facilityDoc.data()?.name || 'Unknown Facility';
        }

        await sendExpiryAlert(
          stock.facilityId,
          facilityCache[stock.facilityId],
          stock.medicineName,
          stock.batchNumber,
          expiryDate,
          daysUntilExpiry
        );

        alertCount++;
      }
    }

    console.log(`Expiry alert check complete. Sent ${alertCount} alerts.`);
  });
