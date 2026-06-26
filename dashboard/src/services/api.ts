import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  throw new Error(message);
}

// Stock APIs
export async function getFacilityStock(facilityId: string, medicineName?: string) {
  try {
    const constraints: any[] = [where('facilityId', '==', facilityId)];
    if (medicineName) constraints.push(where('medicineName', '==', medicineName));

    const q = query(collection(db, 'facilityStock'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const expiryDate = data.expiryDate?.toDate();
      const daysUntilExpiry = expiryDate
        ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: doc.id,
        facilityId: data.facilityId,
        medicineName: data.medicineName,
        batchNumber: data.batchNumber,
        currentQuantity: data.currentQuantity,
        minimumThreshold: data.minimumThreshold,
        reorderPoint: data.reorderPoint,
        expiryDate: expiryDate?.toISOString(),
        lastUpdated: data.lastUpdated?.toDate()?.toISOString(),
        daysUntilExpiry,
        isLowStock: data.currentQuantity <= data.minimumThreshold,
        needsReorder: data.currentQuantity <= data.reorderPoint,
      };
    });
  } catch (error) {
    handleError(error);
  }
}

export async function getNationalStockMap(medicineName?: string, lowStockOnly?: boolean) {
  try {
    const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
    const facilities: Record<string, any> = {};
    facilitiesSnapshot.forEach((doc) => {
      facilities[doc.id] = doc.data();
    });

    const stockSnapshot = await getDocs(collection(db, 'facilityStock'));
    const facilityStockMap: Record<string, any[]> = {};

    stockSnapshot.forEach((doc) => {
      const stock = doc.data();
      const facId = stock.facilityId;

      if (medicineName && stock.medicineName !== medicineName) return;
      if (lowStockOnly && stock.currentQuantity > stock.minimumThreshold) return;

      if (!facilityStockMap[facId]) facilityStockMap[facId] = [];
      facilityStockMap[facId].push({
        id: doc.id,
        medicineName: stock.medicineName,
        batchNumber: stock.batchNumber,
        currentQuantity: stock.currentQuantity,
        minimumThreshold: stock.minimumThreshold,
        expiryDate: stock.expiryDate?.toDate()?.toISOString(),
        isLowStock: stock.currentQuantity <= stock.minimumThreshold,
      });
    });

    return Object.entries(facilityStockMap).map(([facilityId, stock]) => ({
      facilityId,
      facilityName: facilities[facilityId]?.name || 'Unknown',
      facilityType: facilities[facilityId]?.type || 'unknown',
      location: facilities[facilityId]?.location
        ? {
            lat: facilities[facilityId].location.latitude,
            lng: facilities[facilityId].location.longitude,
          }
        : null,
      stockCount: stock.length,
      lowStockCount: stock.filter((s: any) => s.isLowStock).length,
      stock,
    }));
  } catch (error) {
    handleError(error);
  }
}

// Consignment APIs
export async function getConsignments(facilityId?: string, status?: string, itemLimit = 50) {
  try {
    const constraints: any[] = [orderBy('receivedTimestamp', 'desc'), limit(itemLimit)];
    if (facilityId) constraints.unshift(where('destinationFacility', '==', facilityId));
    if (status) constraints.unshift(where('status', '==', status));

    const q = query(collection(db, 'medicineConsignments'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiryDate: data.expiryDate?.toDate()?.toISOString(),
        receivedTimestamp: data.receivedTimestamp?.toDate()?.toISOString(),
        dispatchedTimestamp: data.dispatchedTimestamp?.toDate()?.toISOString(),
      };
    });
  } catch (error) {
    handleError(error);
  }
}

export async function createConsignment(data: {
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  sourceWarehouse: string;
  destinationFacility: string;
  minimumThreshold?: number;
  reorderPoint?: number;
}) {
  try {
    const docRef = await addDoc(collection(db, 'medicineConsignments'), {
      ...data,
      expiryDate: Timestamp.fromDate(new Date(data.expiryDate)),
      status: 'dispatched',
      dispatchedTimestamp: Timestamp.now(),
      receivedBy: null,
      receivedTimestamp: null,
      gpsLatitude: null,
      gpsLongitude: null,
      receivingFacilityId: null,
    });

    return { consignmentId: docRef.id, ...data };
  } catch (error) {
    handleError(error);
  }
}

// Facility & Compliance APIs
export async function getFacilities(type?: string) {
  try {
    const constraints: any[] = [];
    if (type) constraints.push(where('type', '==', type));

    const q = query(collection(db, 'facilities'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      location: doc.data().location
        ? {
            latitude: doc.data().location.latitude,
            longitude: doc.data().location.longitude,
          }
        : null,
    }));
  } catch (error) {
    handleError(error);
  }
}

export async function getComplianceReport(month?: string) {
  try {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
    const facilityMap: Record<string, any> = {};
    facilitiesSnapshot.forEach((doc) => {
      facilityMap[doc.id] = doc.data();
    });

    const complianceQ = query(
      collection(db, 'complianceRecords'),
      where('month', '==', targetMonth)
    );
    const complianceSnapshot = await getDocs(complianceQ);

    const complianceMap: Record<string, any> = {};
    complianceSnapshot.forEach((doc) => {
      complianceMap[doc.data().facilityId] = doc.data();
    });

    const report = Object.entries(facilityMap).map(([facilityId, facility]) => {
      const record = complianceMap[facilityId];
      const received = record?.consignmentsReceived || 0;
      const scanned = record?.consignmentsScanned || 0;

      return {
        facilityId,
        facilityName: facility.name,
        facilityType: facility.type,
        consignmentsReceived: received,
        consignmentsScanned: scanned,
        complianceRate: received > 0 ? Math.round((scanned / received) * 100) : 0,
        lastScanDate: record?.lastScanDate?.toDate()?.toISOString() || null,
        status:
          received === 0
            ? 'no_data'
            : scanned === received
              ? 'compliant'
              : scanned > 0
                ? 'partial'
                : 'non_compliant',
      };
    });

    report.sort((a, b) => a.complianceRate - b.complianceRate);

    const overallRate =
      report.length > 0
        ? Math.round(report.reduce((sum, r) => sum + r.complianceRate, 0) / report.length)
        : 0;

    return {
      month: targetMonth,
      overallComplianceRate: overallRate,
      totalFacilities: report.length,
      compliantCount: report.filter((r) => r.status === 'compliant').length,
      partialCount: report.filter((r) => r.status === 'partial').length,
      nonCompliantCount: report.filter((r) => r.status === 'non_compliant').length,
      noDataCount: report.filter((r) => r.status === 'no_data').length,
      facilities: report,
    };
  } catch (error) {
    handleError(error);
  }
}

// Supplier APIs
export async function getSuppliers() {
  try {
    const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    handleError(error);
  }
}

// Reorder APIs
export async function getReorderAssessments(facilityId?: string) {
  try {
    let q;
    if (facilityId) {
      q = query(
        collection(db, 'facilityStock'),
        where('facilityId', '==', facilityId),
        where('currentQuantity', '<', 999999)
      );
    } else {
      q = query(collection(db, 'facilityStock'), where('currentQuantity', '>=', 0));
    }

    const snapshot = await getDocs(q);
    const assessments: any[] = [];

    for (const doc of snapshot.docs) {
      const stock = doc.data();
      if (stock.currentQuantity >= stock.reorderPoint) continue;

      const consumptionRate = stock.currentQuantity > 0 ? 1 : 0;
      const daysUntilStockout = consumptionRate > 0
        ? Math.floor(stock.currentQuantity / consumptionRate)
        : 0;

      assessments.push({
        facilityId: stock.facilityId,
        medicineName: stock.medicineName,
        batchNumber: stock.batchNumber,
        currentQuantity: stock.currentQuantity,
        minimumThreshold: stock.minimumThreshold,
        reorderPoint: stock.reorderPoint,
        suggestedOrderQuantity: stock.reorderPoint - stock.currentQuantity + 100,
        urgency: daysUntilStockout <= 7 ? 'critical' : daysUntilStockout <= 14 ? 'high' : 'medium',
        estimatedDaysUntilStockout: daysUntilStockout,
      });
    }

    assessments.sort((a, b) => a.estimatedDaysUntilStockout - b.estimatedDaysUntilStockout);

    return {
      assessments,
      summary: {
        total: assessments.length,
        critical: assessments.filter((a) => a.urgency === 'critical').length,
        high: assessments.filter((a) => a.urgency === 'high').length,
        medium: assessments.filter((a) => a.urgency === 'medium').length,
      },
    };
  } catch (error) {
    handleError(error);
  }
}

export async function getPurchaseRequests(facilityId?: string, status?: string) {
  try {
    const constraints: any[] = [orderBy('generatedAt', 'desc')];
    if (facilityId) constraints.unshift(where('facilityId', '==', facilityId));
    if (status) constraints.unshift(where('status', '==', status));

    const q = query(collection(db, 'purchaseRequests'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt?.toDate()?.toISOString(),
        reviewedAt: data.reviewedAt?.toDate()?.toISOString(),
      };
    });
  } catch (error) {
    handleError(error);
  }
}

// Notifications
export async function getNotifications(limitCount = 50) {
  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString(),
      };
    });
  } catch (error) {
    handleError(error);
  }
}

// Suppliers performance
export async function getSupplierPerformance(supplierId?: string) {
  try {
    const constraints: any[] = [];
    if (supplierId) constraints.push(where('supplierId', '==', supplierId));

    const q = query(collection(db, 'suppliers'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const supplier = doc.data();
      return {
        supplierId: doc.id,
        name: supplier.name,
        contactEmail: supplier.contactEmail,
        performanceRating: supplier.performanceRating || 0,
        averageDeliveryDays: supplier.averageDeliveryDays || 0,
        totalOrders: supplier.totalOrders || 0,
        onTimeDeliveries: supplier.onTimeDeliveries || 0,
        disputedOrders: supplier.disputedOrders || 0,
      };
    });
  } catch (error) {
    handleError(error);
  }
}
