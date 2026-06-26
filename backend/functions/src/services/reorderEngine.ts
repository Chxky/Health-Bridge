import { db, TIMESTAMP, CONFIG } from '../config';
import * as functions from 'firebase-functions';

interface ReorderAssessment {
  facilityId: string;
  facilityName: string;
  medicineName: string;
  batchNumber: string;
  currentQuantity: number;
  minimumThreshold: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  estimatedDaysUntilStockout: number;
  consumptionRate: number;
}

export async function assessReorderNeeds(
  facilityId?: string
): Promise<ReorderAssessment[]> {
  const assessments: ReorderAssessment[] = [];

  try {
    let stockQuery: FirebaseFirestore.Query = db.collection('facilityStock');

    if (facilityId) {
      stockQuery = stockQuery.where('facilityId', '==', facilityId);
    }

    const stockSnapshot = await stockQuery.get();
    const allStock: FirebaseFirestore.DocumentData[] = [];
    stockSnapshot.forEach((doc) => allStock.push({ id: doc.id, ...doc.data() }));

    const facilitySnapshot = await db.collection('facilities').get();
    const facilities: Record<string, any> = {};
    facilitySnapshot.forEach((doc) => {
      facilities[doc.id] = doc.data();
    });

    for (const stock of allStock) {
      if (stock.currentQuantity >= stock.reorderPoint) {
        continue;
      }

      const consumptionRate = await calculateConsumptionRate(
        stock.facilityId,
        stock.medicineName
      );

      const daysUntilStockout = consumptionRate > 0
        ? Math.floor(stock.currentQuantity / consumptionRate)
        : 999;

      const leadTimeDays = await getAverageLeadTime(stock.medicineName);
      const seasonalFactor = CONFIG.seasonalFactorEnabled
        ? await getSeasonalDemandFactor(stock.medicineName)
        : 1.0;

      const suggestedQuantity = Math.round(
        consumptionRate * leadTimeDays * seasonalFactor * CONFIG.emergencyStockFactor
      );

      const urgency = daysUntilStockout <= 7
        ? 'critical'
        : daysUntilStockout <= 14
          ? 'high'
          : daysUntilStockout <= 30
            ? 'medium'
            : 'low';

      assessments.push({
        facilityId: stock.facilityId,
        facilityName: facilities[stock.facilityId]?.name || 'Unknown Facility',
        medicineName: stock.medicineName,
        batchNumber: stock.batchNumber,
        currentQuantity: stock.currentQuantity,
        minimumThreshold: stock.minimumThreshold,
        reorderPoint: stock.reorderPoint,
        suggestedOrderQuantity: Math.max(suggestedQuantity, stock.reorderPoint - stock.currentQuantity),
        urgency,
        estimatedDaysUntilStockout: daysUntilStockout,
        consumptionRate: Math.round(consumptionRate * 100) / 100,
      });
    }

    assessments.sort((a, b) => a.estimatedDaysUntilStockout - b.estimatedDaysUntilStockout);
  } catch (error) {
    console.error('Reorder assessment engine error:', error);
  }

  return assessments;
}

async function calculateConsumptionRate(
  facilityId: string,
  medicineName: string
): Promise<number> {
  try {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - CONFIG.historicalLookbackDays);

    const movementsSnapshot = await db
      .collection('stockMovements')
      .where('action', '==', 'dispensed')
      .where('timestamp', '>=', TIMESTAMP.fromDate(lookbackDate))
      .get();

    let totalDispensed = 0;
    movementsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.facilityId === facilityId && data.medicineName === medicineName) {
        totalDispensed += data.quantity || 0;
      }
    });

    return totalDispensed / CONFIG.historicalLookbackDays;
  } catch (error) {
    console.error('Error calculating consumption rate:', error);
    return 0;
  }
}

async function getAverageLeadTime(medicineName: string): Promise<number> {
  try {
    const consignmentsSnapshot = await db
      .collection('medicineConsignments')
      .where('medicineName', '==', medicineName)
      .where('status', '==', 'received')
      .limit(20)
      .get();

    let totalDays = 0;
    let count = 0;

    consignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.dispatchedTimestamp && data.receivedTimestamp) {
        const dispatched = data.dispatchedTimestamp.toDate();
        const received = data.receivedTimestamp.toDate();
        const days = Math.ceil(
          (received.getTime() - dispatched.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
        count++;
      }
    });

    return count > 0 ? Math.ceil(totalDays / count) : 30;
  } catch (error) {
    console.error('Error calculating lead time:', error);
    return 30;
  }
}

async function getSeasonalDemandFactor(medicineName: string): Promise<number> {
  const currentMonth = new Date().getMonth();

  const seasonalFactors: Record<string, number[]> = {
    default: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    'Artemether/Lumefantrine': [1.5, 1.5, 1.3, 1.0, 0.8, 0.7, 0.7, 0.8, 1.0, 1.2, 1.4, 1.5],
    'ORS': [1.3, 1.4, 1.4, 1.2, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.2, 1.3],
    'Zinc Sulfate': [1.3, 1.4, 1.4, 1.2, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.2, 1.3],
    'Amoxicillin': [1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 1.3],
  };

  const factors = seasonalFactors[medicineName] || seasonalFactors['default'];
  return factors[currentMonth] || 1.0;
}

export async function generatePurchaseRequests(
  facilityId?: string
): Promise<number> {
  const assessments = await assessReorderNeeds(facilityId);
  let createdCount = 0;

  for (const assessment of assessments) {
    if (assessment.urgency === 'critical' || assessment.urgency === 'high') {
      try {
        await db.collection('purchaseRequests').add({
          facilityId: assessment.facilityId,
          facilityName: assessment.facilityName,
          medicineName: assessment.medicineName,
          batchNumber: assessment.batchNumber,
          currentStock: assessment.currentQuantity,
          suggestedQuantity: assessment.suggestedOrderQuantity,
          urgency: assessment.urgency,
          estimatedDaysUntilStockout: assessment.estimatedDaysUntilStockout,
          consumptionRate: assessment.consumptionRate,
          status: 'pending_review',
          generatedAt: TIMESTAMP.now(),
          reviewedAt: null,
          reviewedBy: null,
          notes: `Auto-generated by reorder engine. Stock at ${assessment.currentQuantity}, reorder point at ${assessment.reorderPoint}. Estimated ${assessment.estimatedDaysUntilStockout} days until stockout.`,
        });
        createdCount++;
      } catch (error) {
        console.error(
          `Failed to create purchase request for ${assessment.medicineName} at ${assessment.facilityName}:`,
          error
        );
      }
    }
  }

  return createdCount;
}
