export const MOCK_STOCK = [
  {
    id: 's1',
    facilityId: 'f1',
    facilityName: 'Parirenyatwa Group of Hospitals',
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2024-001',
    currentQuantity: 1250,
    minimumThreshold: 500,
    reorderPoint: 800,
    expiryDate: '2025-06-15T00:00:00Z',
    lastUpdated: new Date().toISOString(),
    isLowStock: false,
    needsReorder: false,
  },
  {
    id: 's2',
    facilityId: 'f1',
    facilityName: 'Parirenyatwa Group of Hospitals',
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'PCM-2024-042',
    currentQuantity: 300,
    minimumThreshold: 500,
    reorderPoint: 1000,
    expiryDate: '2024-12-20T00:00:00Z',
    lastUpdated: new Date().toISOString(),
    isLowStock: true,
    needsReorder: true,
  },
  {
    id: 's3',
    facilityId: 'f2',
    facilityName: 'Mpilo Central Hospital',
    medicineName: 'Insulin Glargine',
    batchNumber: 'INS-BY-99',
    currentQuantity: 45,
    minimumThreshold: 50,
    reorderPoint: 100,
    expiryDate: '2024-08-10T00:00:00Z',
    lastUpdated: new Date().toISOString(),
    isLowStock: true,
    needsReorder: true,
  }
];

export const MOCK_CONSIGNMENTS = [
  {
    id: 'c1',
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2024-001',
    quantity: 5000,
    status: 'delivered',
    sourceWarehouse: 'NatPharm Central',
    destinationFacility: 'f1',
    dispatchedTimestamp: '2024-05-10T08:00:00Z',
    receivedTimestamp: '2024-05-11T14:30:00Z',
  },
  {
    id: 'c2',
    medicineName: 'Artemether/Lumefantrine',
    batchNumber: 'MAL-24-X',
    quantity: 2000,
    status: 'dispatched',
    sourceWarehouse: 'NatPharm Central',
    destinationFacility: 'f2',
    dispatchedTimestamp: '2024-05-12T10:00:00Z',
  }
];

export const MOCK_FACILITIES = [
  { id: 'f1', name: 'Parirenyatwa Group of Hospitals', type: 'hospital', location: { latitude: -17.817, longitude: 31.053 } },
  { id: 'f2', name: 'Mpilo Central Hospital', type: 'hospital', location: { latitude: -20.133, longitude: 28.583 } },
  { id: 'f3', name: 'Harare Central Hospital', type: 'hospital', location: { latitude: -17.850, longitude: 31.033 } }
];
