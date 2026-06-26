import * as functions from 'firebase-functions';
import { db, TIMESTAMP, FIELD_VALUE } from '../config';
import { extractAuthUser, requireFacilityAccess } from '../middleware/auth';

export const getFacilityStock = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);
  const { facilityId, medicineName, expiryDateBefore } = data;

  const targetFacilityId = facilityId || user.facilityId;
  if (!targetFacilityId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'facilityId is required'
    );
  }

  if (!requireFacilityAccess(user, targetFacilityId)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have access to this facility'
    );
  }

  try {
    let query: FirebaseFirestore.Query = db
      .collection('facilityStock')
      .where('facilityId', '==', targetFacilityId);

    if (medicineName) {
      query = query.where('medicineName', '==', medicineName);
    }

    if (expiryDateBefore) {
      query = query.where('expiryDate', '<=', TIMESTAMP.fromDate(new Date(expiryDateBefore)));
    }

    const snapshot = await query.get();
    const stock: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      stock.push({
        id: doc.id,
        medicineName: data.medicineName,
        batchNumber: data.batchNumber,
        currentQuantity: data.currentQuantity,
        minimumThreshold: data.minimumThreshold,
        reorderPoint: data.reorderPoint,
        expiryDate: data.expiryDate?.toDate().toISOString(),
        lastUpdated: data.lastUpdated?.toDate().toISOString(),
        daysUntilExpiry: data.expiryDate
          ? Math.ceil(
              (data.expiryDate.toDate().getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
        isLowStock: data.currentQuantity <= data.minimumThreshold,
        needsReorder: data.currentQuantity <= data.reorderPoint,
      });
    });

    return { success: true, data: stock };
  } catch (error) {
    console.error('Error fetching facility stock:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch stock data'
    );
  }
});

export const getNationalStockMap = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  if (!['natpharm_admin', 'natpharm_officer', 'ministry_viewer'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only NatPharm and Ministry officials can view the national stock map'
    );
  }

  try {
    const { medicineName, lowStockOnly } = data;

    const facilitiesSnapshot = await db.collection('facilities').get();
    const facilities: Record<string, any> = {};
    facilitiesSnapshot.forEach((doc) => {
      facilities[doc.id] = doc.data();
    });

    const stockSnapshot = await db.collection('facilityStock').get();
    const facilityStockMap: Record<string, any[]> = {};

    stockSnapshot.forEach((doc) => {
      const stock = doc.data();
      const facilityId = stock.facilityId;

      if (medicineName && stock.medicineName !== medicineName) return;
      if (lowStockOnly && stock.currentQuantity > stock.minimumThreshold) return;

      if (!facilityStockMap[facilityId]) {
        facilityStockMap[facilityId] = [];
      }

      facilityStockMap[facilityId].push({
        id: doc.id,
        medicineName: stock.medicineName,
        batchNumber: stock.batchNumber,
        currentQuantity: stock.currentQuantity,
        minimumThreshold: stock.minimumThreshold,
        expiryDate: stock.expiryDate?.toDate().toISOString(),
        isLowStock: stock.currentQuantity <= stock.minimumThreshold,
      });
    });

    const result = Object.entries(facilityStockMap).map(([facilityId, stock]) => ({
      facilityId,
      facilityName: facilities[facilityId]?.name || 'Unknown',
      facilityType: facilities[facilityId]?.type || 'unknown',
      location: facilities[facilityId]?.location || null,
      stockCount: stock.length,
      lowStockCount: stock.filter((s: any) => s.isLowStock).length,
      stock,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching national stock map:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch national stock data'
    );
  }
});

export const adjustStock = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  const {
    facilityId,
    medicineName,
    batchNumber,
    action,
    quantity,
    notes,
    consignmentId,
  } = data;

  const targetFacilityId = facilityId || user.facilityId;

  if (!targetFacilityId || !medicineName || !batchNumber || !action || !quantity) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'facilityId, medicineName, batchNumber, action, and quantity are required'
    );
  }

  if (!['dispensed', 'expired', 'damaged', 'transferred'].includes(action)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'action must be one of: dispensed, expired, damaged, transferred'
    );
  }

  if (!requireFacilityAccess(user, targetFacilityId)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have access to this facility'
    );
  }

  if (quantity <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Quantity must be positive'
    );
  }

  try {
    const stockQuery = await db
      .collection('facilityStock')
      .where('facilityId', '==', targetFacilityId)
      .where('medicineName', '==', medicineName)
      .where('batchNumber', '==', batchNumber)
      .limit(1)
      .get();

    if (stockQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        `No stock record found for ${medicineName} (${batchNumber})`
      );
    }

    const stockDoc = stockQuery.docs[0];
    const stockData = stockDoc.data();

    if (stockData.currentQuantity < quantity && action !== 'received') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient stock. Available: ${stockData.currentQuantity}, Requested: ${quantity}`
      );
    }

    const movementRef = await db.collection('stockMovements').add({
      consignmentId: consignmentId || null,
      facilityId: targetFacilityId,
      medicineName,
      batchNumber,
      action,
      quantity,
      performedBy: user.uid,
      timestamp: TIMESTAMP.now(),
      notes: notes || '',
    });

    return {
      success: true,
      movementId: movementRef.id,
      message: `${quantity} units of ${medicineName} recorded as ${action}`,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;

    console.error('Error adjusting stock:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to adjust stock'
    );
  }
});
