import * as functions from 'firebase-functions';
import { db, TIMESTAMP, FIELD_VALUE, CONSIGNMENT_STATUS } from '../config';
import { generateConsignmentQR } from '../services/qrService';

export const onConsignmentCreated = functions.firestore
  .document('medicineConsignments/{consignmentId}')
  .onCreate(async (snap, context) => {
    const consignment = snap.data();

    try {
      const qrImageUrl = await generateConsignmentQR({
        ...consignment,
        consignmentId: context.params.consignmentId,
      });

      console.log(`QR code generated for consignment ${context.params.consignmentId}: ${qrImageUrl}`);
    } catch (error) {
      console.error(`Failed to generate QR for consignment ${context.params.consignmentId}:`, error);
    }
  });

export const onConsignmentReceived = functions.firestore
  .document('medicineConsignments/{consignmentId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) return;

    if (
      beforeData.status === CONSIGNMENT_STATUS.IN_TRANSIT &&
      (afterData.status === CONSIGNMENT_STATUS.RECEIVED ||
        afterData.status === CONSIGNMENT_STATUS.PARTIALLY_RECEIVED)
    ) {
      const receivedQuantity =
        afterData.status === CONSIGNMENT_STATUS.PARTIALLY_RECEIVED
          ? afterData.receivedQuantity || afterData.quantity
          : afterData.quantity;

      const stockQuery = await db
        .collection('facilityStock')
        .where('facilityId', '==', afterData.destinationFacility)
        .where('medicineName', '==', afterData.medicineName)
        .where('batchNumber', '==', afterData.batchNumber)
        .limit(1)
        .get();

      if (stockQuery.empty) {
        await db.collection('facilityStock').add({
          facilityId: afterData.destinationFacility,
          medicineName: afterData.medicineName,
          batchNumber: afterData.batchNumber,
          currentQuantity: receivedQuantity,
          minimumThreshold: afterData.minimumThreshold || 100,
          reorderPoint: afterData.reorderPoint || 200,
          expiryDate: afterData.expiryDate,
          lastUpdated: TIMESTAMP.now(),
        });
      } else {
        const stockDoc = stockQuery.docs[0];
        const currentQty = stockDoc.data().currentQuantity || 0;

        await db.collection('facilityStock').doc(stockDoc.id).update({
          currentQuantity: currentQty + receivedQuantity,
          lastUpdated: TIMESTAMP.now(),
        });
      }

      await db.collection('stockMovements').add({
        consignmentId: context.params.consignmentId,
        facilityId: afterData.destinationFacility,
        medicineName: afterData.medicineName,
        batchNumber: afterData.batchNumber,
        action: 'received',
        quantity: receivedQuantity,
        performedBy: afterData.receivedBy,
        timestamp: TIMESTAMP.now(),
        notes: `Consignment received. Status: ${afterData.status}`,
      });

      const facilityDoc = await db.collection('facilities').doc(afterData.destinationFacility).get();
      if (facilityDoc.exists) {
        const facility = facilityDoc.data()!;
        const complianceRef = db.collection('complianceRecords').doc(`${afterData.destinationFacility}_${new Date().toISOString().slice(0, 7)}`);

        await complianceRef.set(
          {
            facilityId: afterData.destinationFacility,
            facilityName: facility.name,
            month: new Date().toISOString().slice(0, 7),
            consignmentsReceived: FIELD_VALUE.increment(1),
            consignmentsScanned: FIELD_VALUE.increment(1),
            lastScanDate: TIMESTAMP.now(),
          },
          { merge: true }
        );
      }

      console.log(
        `Consignment ${context.params.consignmentId} received at ${afterData.destinationFacility}`
      );
    }
  });
