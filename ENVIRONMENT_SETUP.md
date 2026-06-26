# HealthBridge MedTrack - Environment Setup

## Quick Start (Windows)

### Option 1: Run Individual Components
Double-click any of these batch files in your project root:
- **START_BACKEND.bat** - Start Firebase Cloud Functions
- **START_DASHBOARD.bat** - Start React Dashboard
- **START_MOBILE.bat** - Start Flutter Mobile App

### Option 2: Run All at Once
Double-click:
- **START_ALL.bat** - Starts all three components in separate windows

---

## System Requirements

### Backend
- Node.js 18+
- npm 8+
- Firebase CLI (install: `npm install -g firebase-tools`)
- Java SDK (for Android emulation via Firebase)

### Dashboard
- Node.js 18+
- npm 8+
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Mobile
- Flutter SDK 3.0+
- Android Studio + Android SDK (for Android)
- Xcode (for iOS - macOS only)
- Java SDK 11+ (for Android)

---

## Installation Steps

### 1. Install Node.js & npm
- Download from https://nodejs.org/
- Choose **LTS version** (18+)
- Verify: `node -v` and `npm -v` in terminal

### 2. Install Firebase CLI (Global)
```cmd
npm install -g firebase-tools
firebase --version
firebase login
```

### 3. Install Flutter (if running mobile)
- Download from https://flutter.dev/docs/get-started/install
- Unzip and add to PATH
- Run: `flutter doctor` to verify setup

### 4. Setup Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project named `healthbridge-medtrack`
3. Enable Blaze plan (required for Cloud Functions)
4. Enable these services:
   - ✅ Authentication (Email/Password)
   - ✅ Firestore Database
   - ✅ Cloud Functions
   - ✅ Cloud Storage
   - ✅ Cloud Pub/Sub (for scheduled tasks)

5. Download service account key:
   - Project Settings → Service Accounts → Generate new private key
   - Save as `backend/functions/.env` or use Firebase CLI

---

## Configuration Files

### Backend Environment Variables
Create `backend/functions/.env`:
```
FIREBASE_PROJECT_ID=healthbridge-medtrack
FIREBASE_STORAGE_BUCKET=healthbridge-medtrack.appspot.com
HISTORICAL_CONSUMPTION_LOOKBACK_DAYS=90
LEAD_TIME_BUFFER_DAYS=7
SEASONAL_FACTOR_ENABLED=true
EMERGENCY_STOCK_FACTOR=1.5
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+263712345678
```

### Dashboard Environment
Create `dashboard/.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_APP_ID=1:234567890:android:abcdef1234567890
VITE_FIREBASE_AUTH_DOMAIN=healthbridge-medtrack.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=healthbridge-medtrack
VITE_FIREBASE_STORAGE_BUCKET=healthbridge-medtrack.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=234567890
VITE_API_BASE_URL=http://localhost:5001/healthbridge-medtrack/us-central1
```

### Mobile Firebase Config
Update `mobile/lib/config/firebase_options.dart`:
```dart
apiKey: 'your_api_key',
appId: 'your_app_id',
messagingSenderId: 'your_sender_id',
projectId: 'healthbridge-medtrack',
```

---

## Firestore Setup

Before running, populate Firestore with test data:

### Create Test Facility
Collection: `facilities`
Document: `facility_001`
```json
{
  "name": "Harare Central Hospital",
  "type": "central_hospital",
  "location": {
    "latitude": -17.8252,
    "longitude": 31.0335
  },
  "contactPhone": "+263712345678",
  "province": "Harare"
}
```

### Create Test Supplier
Collection: `suppliers`
Document: `supplier_001`
```json
{
  "name": "PharmaChem Zimbabwe",
  "contactEmail": "contact@pharmachem.co.zw",
  "contactPhone": "+263712345678",
  "performanceRating": 4.5,
  "averageDeliveryDays": 7,
  "totalOrders": 25,
  "onTimeDeliveries": 23,
  "disputedOrders": 0
}
```

### Create Test Stock
Collection: `facilityStock`
Document: `stock_001`
```json
{
  "facilityId": "facility_001",
  "medicineName": "Artemether/Lumefantrine",
  "batchNumber": "BATCH2024001",
  "currentQuantity": 150,
  "minimumThreshold": 100,
  "reorderPoint": 200,
  "expiryDate": Timestamp(2025-12-31),
  "lastUpdated": Timestamp(now)
}
```

---

## Running the Project

### Terminal 1: Backend
```cmd
cd backend\functions
npm install
npm run build
npm run serve
```
✅ Emulator UI: http://localhost:4000  
✅ Functions: http://localhost:5001

### Terminal 2: Dashboard
```cmd
cd dashboard
npm install
npm run dev
```
✅ Dashboard: http://localhost:5173

### Terminal 3: Mobile
```cmd
cd mobile
flutter pub get
flutter run
```
✅ App launches on device/emulator

---

## Troubleshooting

### Backend won't start
```cmd
# Clear npm cache
npm cache clean --force

# Check Node version
node -v

# Delete node_modules and reinstall
cd backend\functions
rmdir /s node_modules
npm install
npm run build
npm run serve
```

### Dashboard port 5173 already in use
```cmd
# Use different port
npm run dev -- --port 3000
```

### Mobile can't find devices
```cmd
# List connected devices
flutter devices

# Start Android emulator
emulator -avd Pixel_4_API_30

# Or iOS simulator (macOS)
open -a Simulator
```

### Firebase authentication failing
- Verify Firebase project ID matches in all configs
- Check custom claims set on test users
- Verify authentication provider enabled in Firebase Console

---

## Test Credentials

Use these for testing (create in Firebase Auth):

**NatPharm Admin:**
- Email: `admin@natpharm.co.zw`
- Password: `Test@123`
- Role: `natpharm_admin`

**Hospital Pharmacist:**
- Email: `pharmacist@hospital.co.zw`
- Password: `Test@123`
- Role: `pharmacist`
- FacilityId: `facility_001`

**Ministry Viewer:**
- Email: `viewer@moh.co.zw`
- Password: `Test@123`
- Role: `ministry_viewer`

---

## Default Ports

| Service | Port | URL |
|---------|------|-----|
| Firebase Emulator | 4000 | http://localhost:4000 |
| Backend Functions | 5001 | http://localhost:5001 |
| Dashboard | 5173 | http://localhost:5173 |
| Firestore Emulator | 8080 | http://localhost:8080 |

---

## Useful Commands

```cmd
# Backend
npm run build          # Compile TypeScript
npm run serve          # Run with emulator
firebase deploy        # Deploy to production
firebase functions:log # View logs

# Dashboard
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # Check for errors

# Mobile
flutter pub get       # Install dependencies
flutter run           # Run on device
flutter build apk     # Build Android release
flutter build ios     # Build iOS release (macOS)
flutter clean         # Clear build cache
flutter doctor        # Check environment
```

---

## Need Help?

- **Firebase Docs**: https://firebase.google.com/docs
- **Flutter Docs**: https://flutter.dev/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

---

**Created**: May 2026  
**Project**: HealthBridge MedTrack - Zimbabwe Medicine Traceability System
