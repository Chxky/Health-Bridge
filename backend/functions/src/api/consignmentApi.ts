import * as functions from 'firebase-functions';
import { db, TIMESTAMP, CONSIGNMENT_STATUS } from '../config';
import { extractAuthUser, requireFacilityAccess } from '../middleware/auth';
import { parseQRData } from '../services/qrService';

export const scanConsignment = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  const { qrData, gpsLatitude, gpsLongitude, facilityId } = data;

  if (!qrData) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'QR data is required'
    );
  }

  const payload = parseQRData(qrData);

  if (!payload) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid QR code data format'
    );
  }

  const targetFacilityId = facilityId || payload.destinationFacility;

  if (!requireFacilityAccess(user, targetFacilityId)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have access to this facility'
    );
  }

  try {
    const consignmentRef = db.collection('medicineConsignments').doc(payload.consignmentId);
    const consignmentDoc = await consignmentRef.get();

    if (!consignmentDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Consignment ${payload.consignmentId} not found in the system`
      );
    }

    const consignment = consignmentDoc.data()!;

    if (consignment.status === CONSIGNMENT_STATUS.RECEIVED) {
      throw new functions.https.HttpsError(
        'already-exists',
        `Consignment ${payload.consignmentId} has already been received`
      );
    }

    await consignmentRef.update({
      status: CONSIGNMENT_STATUS.RECEIVED,
      receivedBy: user.uid,
      receivedTimestamp: TIMESTAMP.now(),
      gpsLatitude: gpsLatitude || null,
      gpsLongitude: gpsLongitude || null,
      receivingFacilityId: targetFacilityId,
    });

    return {
      success: true,
      consignmentId: payload.consignmentId,
      medicineName: payload.medicineName,
      batchNumber: payload.batchNumber,
      quantity: payload.quantity,
      message: `Successfully received ${payload.medicineName} (Batch: ${payload.batchNumber})`,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;

    console.error('Error scanning consignment:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process consignment scan'
    );
  }
});

export const getConsignments = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  const { facilityId, status, limit: queryLimit, startAfter } = data;
  const targetFacilityId = facilityId || user.facilityId;

  try {
    let query: FirebaseFirestore.Query = db.collection('medicineConsignments');

    if (targetFacilityId) {
      if (!requireFacilityAccess(user, targetFacilityId)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Access denied'
        );
      }
      query = query.where('destinationFacility', '==', targetFacilityId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('receivedTimestamp', 'desc').limit(queryLimit || 50);

    if (startAfter) {
      const startDoc = await db.collection('medicineConsignments').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    const consignments: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      consignments.push({
        id: doc.id,
        medicineName: data.medicineName,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate?.toDate().toISOString(),
        quantity: data.quantity,
        sourceWarehouse: data.sourceWarehouse,
        destinationFacility: data.destinationFacility,
        status: data.status,
        receivedBy: data.receivedBy,
        receivedTimestamp: data.receivedTimestamp?.toDate().toISOString(),
        dispatchedTimestamp: data.dispatchedTimestamp?.toDate().toISOString(),
      });
    });

    return { success: true, data: consignments };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;

    console.error('Error fetching consignments:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch consignments'
    );
  }
});

export const createConsignment = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  if (!['natpharm_admin', 'natpharm_officer'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only NatPharm officials can create consignments'
    );
  }

  const {
    medicineName,
    batchNumber,
    expiryDate,
    quantity,
    sourceWarehouse,
    destinationFacility,
    minimumThreshold,
    reorderPoint,
  } = data;

  if (!medicineName || !batchNumber || !expiryDate || !quantity || !sourceWarehouse || !destinationFacility) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'All required fields must be provided'
    );
  }

  try {
    const facilityDoc = await db.collection('facilities').doc(destinationFacility).get();
    if (!facilityDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Facility ${destinationFacility} not found`
      );
    }

    const consignmentRef = await db.collection('medicineConsignments').add({
      medicineName,
      batchNumber,
      expiryDate: TIMESTAMP.fromDate(new Date(expiryDate)),
      quantity,
      sourceWarehouse,
      destinationFacility,
      minimumThreshold: minimumThreshold || 100,
      reorderPoint: reorderPoint || 200,
      status: CONSIGNMENT_STATUS.DISPATCHED,
      dispatchedTimestamp: TIMESTAMP.now(),
      dispatchedBy: user.uid,
      receivedBy: null,
      receivedTimestamp: null,
      gpsLatitude: null,
      gpsLongitude: null,
      receivingFacilityId: null,
    });

    return {
      success: true,
      consignmentId: consignmentRef.id,
      message: `Consignment created for ${quantity} units of ${medicineName} to ${destinationFacility}`,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;

    console.error('Error creating consignment:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create consignment'
    );
  }
});
