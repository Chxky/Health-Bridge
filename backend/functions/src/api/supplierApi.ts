import * as functions from 'firebase-functions';
import { db, TIMESTAMP } from '../config';
import { extractAuthUser } from '../middleware/auth';

export const getSuppliers = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  try {
    const snapshot = await db
      .collection('suppliers')
      .orderBy('name', 'asc')
      .get();

    const suppliers: any[] = [];
    snapshot.forEach((doc) => {
      const supplier = doc.data();
      if (!supplier) return;
      suppliers.push({
        id: doc.id,
        name: supplier.name,
        contactEmail: supplier.contactEmail,
        contactPhone: supplier.contactPhone || '',
        performanceRating: supplier.performanceRating,
        averageDeliveryDays: supplier.averageDeliveryDays,
        totalOrders: supplier.totalOrders || 0,
        onTimeDeliveries: supplier.onTimeDeliveries || 0,
        disputedOrders: supplier.disputedOrders || 0,
      });
    });

    return { success: true, data: suppliers };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch suppliers'
    );
  }
});

export const getSupplierPerformance = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  if (!['natpharm_admin', 'natpharm_officer', 'ministry_viewer'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Access restricted'
    );
  }

  try {
    const { supplierId } = data;

    let query: FirebaseFirestore.Query = db.collection('suppliers');

    // Query for specific supplier by ID if provided
    const snapshot = supplierId 
      ? await db.collection('suppliers').doc(supplierId).get().then(doc => ({
          docs: doc.exists ? [doc] : []
        }))
      : await query.get();
    const performance: any[] = [];

    for (const doc of snapshot.docs) {
      const supplier = doc.data();
      if (!supplier) continue;

      const consignmentsSnapshot = await db
        .collection('medicineConsignments')
        .where('sourceWarehouse', '==', supplier.name)
        .where('status', 'in', ['received', 'partially_received'])
        .get();

      let totalDeliveryDays = 0;
      let deliveryCount = 0;
      let onTimeCount = 0;

      consignmentsSnapshot.forEach((cDoc) => {
        const c = cDoc.data();
        if (c.dispatchedTimestamp && c.receivedTimestamp) {
          const days = Math.ceil(
            (c.receivedTimestamp.toDate().getTime() -
              c.dispatchedTimestamp.toDate().getTime()) /
              (1000 * 60 * 60 * 24)
          );
          totalDeliveryDays += days;
          deliveryCount++;

          if (days <= (supplier.averageDeliveryDays || 30)) {
            onTimeCount++;
          }
        }
      });

      const disputesSnapshot = await db
        .collection('stockMovements')
        .where('action', '==', 'damaged')
        .get();

      let disputeCount = 0;
      disputesSnapshot.forEach((mDoc) => {
        const m = mDoc.data();
        if (m.notes && m.notes.includes(supplier.name || supplier.supplierId)) {
          disputeCount++;
        }
      });

      performance.push({
        supplierId: doc.id,
        name: supplier.name,
        totalOrders: consignmentsSnapshot.size,
        completedDeliveries: deliveryCount,
        averageDeliveryDays: deliveryCount > 0
          ? Math.round(totalDeliveryDays / deliveryCount)
          : supplier.averageDeliveryDays || 0,
        onTimeDeliveryRate: deliveryCount > 0
          ? Math.round((onTimeCount / deliveryCount) * 100)
          : 0,
        disputes: disputeCount,
        performanceRating: supplier.performanceRating || 0,
      });
    }

    return { success: true, data: performance };
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch supplier performance'
    );
  }
});
