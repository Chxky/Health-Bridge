import '../models/stock_model.dart';
import '../models/consignment_model.dart';
import '../models/notification_model.dart';
import '../models/stock_movement_model.dart';

final List<StockModel> mockStock = [
  StockModel(
    id: 's1',
    facilityId: 'f1',
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2024-001',
    currentQuantity: 1250,
    minimumThreshold: 500,
    reorderPoint: 800,
    expiryDate: DateTime(2025, 6, 15),
    lastUpdated: DateTime.now(),
    isLowStock: false,
    needsReorder: false,
  ),
  StockModel(
    id: 's2',
    facilityId: 'f1',
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'PCM-2024-042',
    currentQuantity: 300,
    minimumThreshold: 500,
    reorderPoint: 1000,
    expiryDate: DateTime(2024, 12, 20),
    lastUpdated: DateTime.now(),
    isLowStock: true,
    needsReorder: true,
  ),
];

final List<ConsignmentModel> mockConsignments = [
  ConsignmentModel(
    id: 'c1',
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2024-001',
    quantity: 5000,
    status: 'delivered',
    sourceWarehouse: 'NatPharm Central',
    destinationFacility: 'f1',
    dispatchedTimestamp: DateTime.now().subtract(const Duration(days: 2)),
    receivedTimestamp: DateTime.now().subtract(const Duration(days: 1)),
    expiryDate: DateTime(2025, 6, 15),
  ),
  ConsignmentModel(
    id: 'c2',
    medicineName: 'Artemether/Lumefantrine',
    batchNumber: 'MAL-24-X',
    quantity: 2000,
    status: 'dispatched',
    sourceWarehouse: 'NatPharm Central',
    destinationFacility: 'f1',
    dispatchedTimestamp: DateTime.now().subtract(const Duration(hours: 5)),
    expiryDate: DateTime(2025, 12, 1),
  ),
];

final List<AppNotification> mockNotifications = [
  AppNotification(
    id: 'n1',
    title: 'CRITICAL: Stock Depletion',
    body: 'Paracetamol 500mg is completely out of stock at Parirenyatwa.',
    type: 'low_stock',
    facilityId: 'f1',
    targetRoles: ['pharmacist', 'admin'],
    read: false,
    createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
  ),
  AppNotification(
    id: 'n2',
    title: 'URGENT: Stock Reorder Required',
    body: 'Amoxicillin 500mg has fallen below the minimum threshold. Reorder 1,000 units.',
    type: 'reorder_generated',
    facilityId: 'f1',
    targetRoles: ['pharmacist'],
    read: true,
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
  ),
  AppNotification(
    id: 'n3',
    title: 'Consignment Dispatched',
    body: 'NatPharm Central has dispatched Artemether/Lumefantrine to your facility.',
    type: 'consignment_received',
    facilityId: 'f1',
    targetRoles: ['pharmacist'],
    read: false,
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
  ),
];

final List<StockMovementModel> mockMovements = [
  StockMovementModel(
    id: 'm1',
    consignmentId: 'c1',
    facilityId: 'f1',
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2024-001',
    action: 'received',
    quantity: 5000,
    performedBy: 'Demo Pharmacist',
    timestamp: DateTime.now().subtract(const Duration(days: 1)),
    notes: 'Received in good condition from NatPharm',
  ),
  StockMovementModel(
    id: 'm2',
    facilityId: 'f1',
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'PCM-2024-042',
    action: 'dispensed',
    quantity: 50,
    performedBy: 'Demo Pharmacist',
    timestamp: DateTime.now().subtract(const Duration(hours: 4)),
    notes: 'OPD Ward Requisition',
  ),
];

final List<Map<String, dynamic>> mockPurchaseRequests = [
  {
    'id': 'pr1',
    'facilityId': 'f1',
    'medicineName': 'Paracetamol 500mg',
    'quantity': 2000,
    'urgency': 'high',
    'status': 'pending',
    'generatedAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
    'reason': 'Automated reorder based on predictive depletion model',
  },
  {
    'id': 'pr2',
    'facilityId': 'f1',
    'medicineName': 'Amoxicillin 500mg',
    'quantity': 1000,
    'urgency': 'medium',
    'status': 'approved',
    'generatedAt': DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
    'reviewedAt': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
    'reason': 'Below minimum threshold',
  },
];
