import * as functions from 'firebase-functions';
import { db } from '../config';
import { extractAuthUser } from '../middleware/auth';

export const getFacilities = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  try {
    const { type } = data;

    let query: FirebaseFirestore.Query = db.collection('facilities');

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    const facilities: any[] = [];

    snapshot.forEach((doc) => {
      const facility = doc.data();
      facilities.push({
        id: doc.id,
        name: facility.name,
        type: facility.type,
        location: facility.location
          ? {
              latitude: facility.location.latitude,
              longitude: facility.location.longitude,
            }
          : null,
        contactPhone: facility.contactPhone,
      });
    });

    return { success: true, data: facilities };
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch facilities'
    );
  }
});

export const getComplianceReport = functions.https.onCall(async (data, context) => {
  const user = extractAuthUser(context);

  if (!['natpharm_admin', 'natpharm_officer', 'ministry_viewer'].includes(user.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Access restricted to NatPharm and Ministry officials'
    );
  }

  try {
    const { month } = data;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const facilitiesSnapshot = await db.collection('facilities').get();
    const facilityMap: Record<string, any> = {};
    facilitiesSnapshot.forEach((doc) => {
      facilityMap[doc.id] = doc.data();
    });

    const complianceSnapshot = await db
      .collection('complianceRecords')
      .where('month', '==', targetMonth)
      .get();

    const complianceMap: Record<string, any> = {};
    complianceSnapshot.forEach((doc) => {
      complianceMap[doc.data().facilityId] = doc.data();
    });

    const report = Object.entries(facilityMap).map(([facilityId, facility]) => {
      const record = complianceMap[facilityId];

      const consignmentsReceived = record?.consignmentsReceived || 0;
      const consignmentsScanned = record?.consignmentsScanned || 0;

      return {
        facilityId,
        facilityName: facility.name,
        facilityType: facility.type,
        consignmentsReceived,
        consignmentsScanned,
        complianceRate:
          consignmentsReceived > 0
            ? Math.round((consignmentsScanned / consignmentsReceived) * 100)
            : 0,
        lastScanDate: record?.lastScanDate?.toDate().toISOString() || null,
        status:
          consignmentsReceived === 0
            ? 'no_data'
            : consignmentsScanned === consignmentsReceived
              ? 'compliant'
              : consignmentsScanned > 0
                ? 'partial'
                : 'non_compliant',
      };
    });

    report.sort((a, b) => a.complianceRate - b.complianceRate);

    const overallRate =
      report.length > 0
        ? Math.round(
            report.reduce((sum, r) => sum + r.complianceRate, 0) / report.length
          )
        : 0;

    return {
      success: true,
      data: {
        month: targetMonth,
        overallComplianceRate: overallRate,
        totalFacilities: report.length,
        compliantCount: report.filter((r) => r.status === 'compliant').length,
        partialCount: report.filter((r) => r.status === 'partial').length,
        nonCompliantCount: report.filter((r) => r.status === 'non_compliant').length,
        noDataCount: report.filter((r) => r.status === 'no_data').length,
        facilities: report,
      },
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate compliance report'
    );
  }
});
