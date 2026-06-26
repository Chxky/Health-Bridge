import '../models/stock_model.dart';
import '../models/consignment_model.dart';

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
    expiryDate: DateTime(2025, 3, 10),
  ),
];
