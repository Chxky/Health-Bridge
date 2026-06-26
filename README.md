# HealthBridge MedTrack

**Zimbabwe Medicine Traceability & Stock Management System**

A mobile-first system for tracking medicine consignments from NatPharm central warehouse to hospital pharmacies across Zimbabwe. Features QR code-based receipt confirmation, real-time stock visibility, AI-powered reorder alerts, and e-GP compliance monitoring.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Flutter Mobile  │────▶│   Firebase/      │◀────│  React Admin     │
│  App (Pharmacy)  │     │   Supabase       │     │  Dashboard       │
│                  │     │   Backend        │     │  (NatPharm/MoH)  │
│  - QR Scanning   │     │                  │     │                  │
│  - Stock View    │     │  - Firestore DB  │     │  - Stock Map     │
│  - Offline Mode  │     │  - Cloud Funcs   │     │  - Reorder Eng   │
│  - Adjustments   │     │  - Auth          │     │  - Compliance    │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

## Project Structure

```
healthbridge-medtrack/
├── backend/                    # Firebase Configuration & Cloud Functions
│   ├── firestore.rules         # Firestore security rules
│   ├── firestore.indexes.json  # Composite indexes
│   ├── firebase.json           # Firebase project config
│   ├── storage.rules           # Storage security rules
│   └── functions/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts              # Function exports
│           ├── config.ts             # Firebase init & constants
│           ├── middleware/auth.ts     # Auth helpers
│           ├── api/                  # Callable API functions
│           │   ├── stockApi.ts
│           │   ├── consignmentApi.ts
│           │   ├── facilityApi.ts
│           │   ├── supplierApi.ts
│           │   └── reorderApi.ts
│           ├── triggers/             # Firestore triggers
│           │   ├── stockTriggers.ts
│           │   └── consignmentTriggers.ts
│           └── services/
│               ├── qrService.ts           # QR generation
│               ├── reorderEngine.ts       # AI reorder logic
│               └── notificationService.ts # Push/email/SMS
├── mobile/                     # Flutter Pharmacy App
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart
│       ├── config/             # App config, routes, themes
│       ├── models/             # Data models
│       ├── services/           # API, auth, offline DB, sync
│       └── screens/            # UI screens
├── dashboard/                  # React Admin Dashboard
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── config/             # Firebase init, theme
│       ├── contexts/           # Auth context
│       ├── services/           # API service layer
│       ├── components/         # Layout, shared components
│       └── pages/              # Dashboard pages
├── README.md
└── PILOT_BRIEF.md
```

## Prerequisites

- **Node.js** v18+ and npm
- **Flutter** SDK 3.0+
- **Firebase** CLI (`npm install -g firebase-tools`)
- A Firebase project with **Blaze plan** (for Cloud Functions)

## Setup & Deployment

### 1. Firebase Backend

```bash
cd backend

# Install dependencies
cd functions && npm install && cd ..

# Login to Firebase
firebase login

# Set your project
firebase use --add

# Deploy Firestore rules & indexes
firebase deploy --only firestore

# Deploy Cloud Functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# Set environment config
firebase functions:config:set sendgrid.api_key="your_key"
firebase functions:config:set twilio.account_sid="your_sid"
firebase functions:config:set twilio.auth_token="your_token"
firebase functions:config:set twilio.phone_number="+263XXXXXXXXX"
```

### 2. Flutter Mobile App

```bash
cd mobile

# Install dependencies
flutter pub get

# Configure Firebase
# 1. Place google-services.json in android/app/
# 2. Place GoogleService-Info.plist in ios/
# 3. Update firebase_options.dart with your config

# Run on device
flutter run

# Build release
flutter build apk --release   # Android
flutter build ios --release   # iOS
```

### 3. React Admin Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Firebase config

# Run development server
npm start

# Build for production
npm run build
```

## Database Schema

### Collections

| Collection | Description | Key Fields |
|-----------|-------------|------------|
| `medicineConsignments` | QR-tagged medicine shipments | consignmentId, qrCodeData, status, destinationFacility |
| `facilityStock` | Current stock per medicine per facility | facilityId, medicineName, currentQuantity, reorderPoint |
| `stockMovements` | Immutable audit log | action, quantity, performedBy, timestamp |
| `facilities` | Hospital/clinic registry | name, type, location (GeoPoint) |
| `suppliers` | Pharmaceutical suppliers | name, performanceRating, averageDeliveryDays |
| `purchaseRequests` | AI-generated reorder requests | medicineName, suggestedQuantity, urgency, status |
| `notifications` | Push/in-app notifications | title, body, type, targetRoles, facilityId |
| `users` | User profiles and preferences | name, role, facilityId, fcmToken |

### Security Rules

Role-based access control with 5 roles:
- **pharmacist**: Local stock mgmt, scan consignments, record adjustments
- **hospital_admin**: Full access to facility data, approve reorders
- **natpharm_officer**: National-level consignment mgmt, reorder engine
- **natpharm_admin**: Full system access, user management
- **ministry_viewer**: Read-only access to dashboards and reports

## API Endpoints (Cloud Functions)

| Function | Description | Auth Required |
|----------|-------------|:---:|
| `scanConsignment` | Process QR scan and confirm receipt | Yes |
| `createConsignment` | Create new consignment with QR | NatPharm only |
| `getFacilityStock` | Query stock by facility/medicine | Yes |
| `getNationalStockMap` | Aggregate stock across all facilities | NatPharm/MoH |
| `adjustStock` | Record dispensed/expired/damaged | Yes |
| `getReorderAssessments` | Run reorder analysis | NatPharm/Hospital admin |
| `triggerReorderRun` | Generate purchase requests | NatPharm |
| `getComplianceReport` | e-GP compliance by facility/month | NatPharm/MoH |
| `getSupplierPerformance` | Supplier metrics and history | NatPharm/MoH |

## AI Reorder Engine

The reorder engine (`reorderEngine.ts`) runs daily via Cloud Scheduler and on stock updates:

1. **Assessment**: For each facility stock record, check if `currentQuantity < reorderPoint`
2. **Consumption Rate**: Calculated from historical `stockMovements` (90-day lookback)
3. **Lead Time**: Average days from dispatch to receipt for each medicine
4. **Seasonal Factor**: Month-specific demand multipliers (e.g., malaria meds peak Jan-Mar)
5. **Suggested Quantity**: `consumptionRate × leadTime × seasonalFactor × emergencyFactor`
6. **Urgency**: critical (<7 days to stockout), high (7-14), medium (15-30)
7. **Notification**: Push + email alerts sent to facility admin and NatPharm procurement

## Offline Mode

The Flutter app uses `sqflite` for local storage:
- **Stock data** is cached locally for offline viewing
- **QR scans** are queued when offline and synced via FIFO when connectivity returns
- **Stock adjustments** are saved as pending movements
- **Sync service** retries failed operations (max 3 retries)
- **Conflict resolution**: Server timestamp wins on sync conflicts

## Pilot Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Firestore security rules deployed
- [ ] Cloud Functions deployed
- [ ] User accounts created with appropriate roles
- [ ] Facilities loaded into Firestore
- [ ] Suppliers loaded into Firestore
- [ ] Flutter app installed on pilot pharmacy devices
- [ ] QR scanners tested with sample consignments
- [ ] Dashboard accessible to NatPharm team
- [ ] Notification channels configured (FCM, email)
- [ ] Offline mode verified with airplane mode testing
- [ ] Staff training completed

## License

Proprietary - Ministry of Health and Child Care, Zimbabwe
