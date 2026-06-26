import './config';

// Stock Management APIs
export {
  getFacilityStock,
  getNationalStockMap,
  adjustStock,
} from './api/stockApi';

// Consignment Management APIs
export {
  scanConsignment,
  getConsignments,
  createConsignment,
} from './api/consignmentApi';

// Facility & Compliance APIs
export {
  getFacilities,
  getComplianceReport,
} from './api/facilityApi';

// Supplier APIs
export {
  getSuppliers,
  getSupplierPerformance,
} from './api/supplierApi';

// Reorder Engine APIs
export {
  getReorderAssessments,
  triggerReorderRun,
  getPurchaseRequests,
  updatePurchaseRequestStatus,
  scheduledReorderRun,
} from './api/reorderApi';

// Firestore Triggers
export {
  onStockUpdate,
  onNewStockMovement,
  checkExpiryAlertsDaily,
} from './triggers/stockTriggers';

export {
  onConsignmentCreated,
  onConsignmentReceived,
} from './triggers/consignmentTriggers';

// Notification APIs - convenience wrappers
export { sendNotification } from './services/notificationService';
