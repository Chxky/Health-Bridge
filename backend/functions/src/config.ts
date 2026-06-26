import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();

export const FIELD_VALUE = admin.firestore.FieldValue;
export const TIMESTAMP = admin.firestore.Timestamp;

export const CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'healthbridge-medtrack',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'healthbridge-medtrack.appspot.com',

  historicalLookbackDays: parseInt(
    process.env.HISTORICAL_CONSUMPTION_LOOKBACK_DAYS || '90'
  ),
  leadTimeBufferDays: parseInt(
    process.env.LEAD_TIME_BUFFER_DAYS || '7'
  ),
  seasonalFactorEnabled: process.env.SEASONAL_FACTOR_ENABLED === 'true',
  emergencyStockFactor: parseFloat(
    process.env.EMERGENCY_STOCK_FACTOR || '1.5'
  ),
};

export const ROLES = {
  PHARMACIST: 'pharmacist',
  HOSPITAL_ADMIN: 'hospital_admin',
  NATPHARM_OFFICER: 'natpharm_officer',
  NATPHARM_ADMIN: 'natpharm_admin',
  MINISTRY_VIEWER: 'ministry_viewer',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const CONSIGNMENT_STATUS = {
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  PARTIALLY_RECEIVED: 'partially_received',
} as const;

export const STOCK_ACTION = {
  RECEIVED: 'received',
  DISPENSED: 'dispensed',
  EXPIRED: 'expired',
  DAMAGED: 'damaged',
  TRANSFERRED: 'transferred',
} as const;

export const FACILITY_TYPES = {
  CENTRAL_HOSPITAL: 'central_hospital',
  PROVINCIAL_HOSPITAL: 'provincial_hospital',
  DISTRICT_HOSPITAL: 'district_hospital',
  CLINIC: 'clinic',
} as const;
