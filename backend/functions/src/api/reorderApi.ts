import * as functions from 'firebase-functions';
import { db, TIMESTAMP } from '../config';
import { extractAuthUser } from '../middleware/auth';
import { assessReorderNeeds, generatePurchaseRequests } from '../services/reorderEngine';
import { sendReorderAlert } from '../services/notificationService';

export const getReorderAssessments = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  const { facilityId, urgency } = data;

  if (!['natpharm_admin', 'natpharm_officer', 'hospital_admin'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Access restricted'
    );
  }

  const targetFacilityId =
    user.role === 'hospital_admin' ? user.facilityId : facilityId;

  try {
    const assessments = await assessReorderNeeds(targetFacilityId);

    const filteredAssessments = urgency
      ? assessments.filter((a) => a.urgency === urgency)
      : assessments;

    return {
      success: true,
      data: filteredAssessments,
      summary: {
        total: filteredAssessments.length,
        critical: filteredAssessments.filter((a) => a.urgency === 'critical').length,
        high: filteredAssessments.filter((a) => a.urgency === 'high').length,
        medium: filteredAssessments.filter((a) => a.urgency === 'medium').length,
        low: filteredAssessments.filter((a) => a.urgency === 'low').length,
      },
    };
  } catch (error) {
    console.error('Error getting reorder assessments:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate reorder assessments'
    );
  }
});

export const triggerReorderRun = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  if (!['natpharm_admin', 'natpharm_officer'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only NatPharm officials can trigger reorder runs'
    );
  }

  const { facilityId } = data;

  try {
    const createdCount = await generatePurchaseRequests(facilityId);

    if (createdCount > 0) {
      const recentRequests = await db
        .collection('purchaseRequests')
        .where('generatedAt', '>=', TIMESTAMP.fromDate(new Date(Date.now() - 60000)))
        .get();

      const notifiedFacilities = new Set<string>();
      recentRequests.forEach((doc) => {
        const req = doc.data();
        if (!notifiedFacilities.has(req.facilityId)) {
          notifiedFacilities.add(req.facilityId);
          sendReorderAlert(
            req.facilityId,
            req.facilityName,
            req.medicineName,
            doc.id
          ).catch((err) =>
            console.error('Failed to send reorder alert:', err)
          );
        }
      });
    }

    return {
      success: true,
      purchaseRequestsCreated: createdCount,
      message: `Reorder run complete. ${createdCount} purchase requests generated.`,
    };
  } catch (error) {
    console.error('Error running reorder engine:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to run reorder engine'
    );
  }
});

export const getPurchaseRequests = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  const { facilityId, status, limit: queryLimit } = data;

  try {
    let query: FirebaseFirestore.Query = db.collection('purchaseRequests');

    const targetFacilityId =
      user.role === 'hospital_admin' ? user.facilityId : facilityId;

    if (targetFacilityId) {
      query = query.where('facilityId', '==', targetFacilityId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('generatedAt', 'desc').limit(queryLimit || 100);

    const snapshot = await query.get();
    const requests: any[] = [];

    snapshot.forEach((doc) => {
      const req = doc.data();
      requests.push({
        id: doc.id,
        facilityId: req.facilityId,
        facilityName: req.facilityName,
        medicineName: req.medicineName,
        batchNumber: req.batchNumber,
        currentStock: req.currentStock,
        suggestedQuantity: req.suggestedQuantity,
        urgency: req.urgency,
        estimatedDaysUntilStockout: req.estimatedDaysUntilStockout,
        consumptionRate: req.consumptionRate,
        status: req.status,
        generatedAt: req.generatedAt?.toDate().toISOString(),
        reviewedAt: req.reviewedAt?.toDate().toISOString(),
        reviewedBy: req.reviewedBy,
        notes: req.notes,
      });
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch purchase requests'
    );
  }
});

export const updatePurchaseRequestStatus = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  if (!['natpharm_admin', 'natpharm_officer', 'hospital_admin'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Access restricted'
    );
  }

  const { requestId, status, notes } = data;

  if (!requestId || !status) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'requestId and status are required'
    );
  }

  if (!['pending_review', 'approved', 'rejected', 'ordered', 'fulfilled'].includes(status)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid status value'
    );
  }

  try {
    await db.collection('purchaseRequests').doc(requestId).update({
      status,
      reviewedAt: TIMESTAMP.now(),
      reviewedBy: user.uid,
      ...(notes ? { notes } : {}),
    });

    return {
      success: true,
      message: `Purchase request ${requestId} updated to ${status}`,
    };
  } catch (error) {
    console.error('Error updating purchase request:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update purchase request'
    );
  }
});

export const scheduledReorderRun = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Africa/Harare')
  .onRun(async (context) => {
    console.log('Running scheduled daily reorder engine...');

    try {
      const createdCount = await generatePurchaseRequests();

      console.log(`Scheduled reorder run complete. ${createdCount} requests generated.`);
    } catch (error) {
      console.error('Scheduled reorder run failed:', error);
    }
  });
