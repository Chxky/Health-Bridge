# 🚀 HealthBridge MedTrack - Quick Start Guide

## What You Have Now

A complete **3-part healthcare system** for Zimbabwe medicine traceability:
- ✅ **Backend**: Firebase Cloud Functions (TypeScript)
- ✅ **Dashboard**: React Admin Web App (TypeScript + Vite)
- ✅ **Mobile**: Flutter Pharmacy App (Dart)
- ✅ **All errors fixed** and ready to run

---

## 🎯 Quick Start (Fastest Way)

### Step 1: One-Time Setup
```cmd
# Install global tools (run once)
npm install -g firebase-tools
# Download Flutter from https://flutter.dev/
```

### Step 2: Start Everything
Just **double-click in project root**:
```
START_ALL.bat
```

This will open 3 new windows:
- **Window 1**: Backend (Firebase Functions)
- **Window 2**: Dashboard (React App)
- **Window 3**: Mobile (Flutter)

---

## 📱 What You'll See

### Backend (Terminal)
```
⚡ Emulator UI: http://localhost:4000
⚡ Functions: http://localhost:5001
```

### Dashboard
```
Open browser: http://localhost:5173
Login screen ready
```

### Mobile
```
App launches on emulator/device
Ready to scan QR codes
```

---

## 🔑 Test Login Credentials

Use these in the Dashboard/Mobile:

| User | Email | Password | Role |
|------|-------|----------|------|
| **Admin** | admin@natpharm.co.zw | Test@123 | NatPharm Admin |
| **Pharmacist** | pharmacist@hospital.co.zw | Test@123 | Hospital Staff |
| **Viewer** | viewer@moh.co.zw | Test@123 | Ministry Viewer |

*Create these accounts in Firebase Auth first*

---

## 📋 Individual Startup Commands

**Only need one part?**

### Backend Only
```cmd
cd backend\functions
npm install
npm run serve
```

### Dashboard Only
```cmd
cd dashboard
npm install
npm run dev
```

### Mobile Only
```cmd
cd mobile
flutter pub get
flutter run
```

---

## ⚠️ Before First Run

### 1. Create Firebase Project
- Go to https://console.firebase.google.com
- Create project: `healthbridge-medtrack`
- Enable **Blaze plan** (needed for Functions)

### 2. Update Firebase Config
Edit these files with your Firebase credentials:
- `mobile/lib/config/firebase_options.dart`
- `dashboard/.env` (create from .env.example)
- `backend/functions/.env` (optional)

### 3. Add Test Data to Firestore
```
Collection: facilities
  ↳ Document: facility_001
    ├── name: "Harare Central Hospital"
    ├── type: "central_hospital"
    └── location: {latitude: -17.8252, longitude: 31.0335}

Collection: suppliers
  ↳ Document: supplier_001
    ├── name: "PharmaChem Zimbabwe"
    ├── performanceRating: 4.5
    └── averageDeliveryDays: 7
```

### 4. Create Firebase Users
```
In Firebase Console → Authentication:
- admin@natpharm.co.zw (password: Test@123)
- pharmacist@hospital.co.zw (password: Test@123)
- viewer@moh.co.zw (password: Test@123)

Set custom claims:
{
  "role": "natpharm_admin",
  "facilityId": "facility_001"
}
```

---

## 📱 System Requirements

- **Node.js 18+** (for backend & dashboard)
- **Flutter 3.0+** (for mobile)
- **Firebase CLI** (global npm install)
- **4GB RAM minimum**
- **1GB disk space** for node_modules

---

## 🛠️ What Got Fixed

✅ Backend notification service (axios import)  
✅ Supplier API query (missing field error)  
✅ Mobile Firebase config (placeholder credentials)  
✅ Dashboard dependencies (removed firebase-admin)  
✅ Type safety issues (Query casting)  
✅ Auth middleware (missing implementation docs)  

**Status**: Project is now ready to run! 🎉

---

## 📊 Project Structure
```
healthbridge-medtrack/
├── backend/
│   ├── functions/           ← Cloud Functions (TypeScript)
│   ├── firestore.rules      ← Security rules
│   └── firebase.json        ← Config
├── dashboard/               ← React Admin App (Port 5173)
│   └── src/                 ← React components
├── mobile/                  ← Flutter Mobile App
│   └── lib/                 ← Flutter code
├── START_ALL.bat            ← ⭐ Run everything!
├── START_BACKEND.bat        ← Start backend only
├── START_DASHBOARD.bat      ← Start dashboard only
├── START_MOBILE.bat         ← Start mobile only
└── RUN_PROJECT.md           ← Detailed guide
```

---

## 🚨 Troubleshooting

### Backend won't start
```cmd
npm cache clean --force
cd backend\functions && npm install && npm run build
```

### Dashboard port taken
```cmd
npm run dev -- --port 3000
```

### Mobile can't find devices
```cmd
flutter devices
emulator -avd Pixel_4_API_30  # Start Android emulator
```

### Firebase connection failing
- ✅ Verify project ID matches everywhere
- ✅ Check Firebase Blaze plan enabled
- ✅ Verify credentials in .env files
- ✅ Check custom user claims set

---

## ✨ Features Ready to Test

### Mobile App 📱
- ✅ QR code scanning
- ✅ Stock management
- ✅ Offline mode
- ✅ Real-time sync
- ✅ Push notifications

### Dashboard 🌐
- ✅ Stock map visualization
- ✅ Compliance reporting
- ✅ Reorder engine
- ✅ Supplier performance
- ✅ Analytics & charts

### Backend ⚙️
- ✅ Firestore triggers
- ✅ Cloud Functions APIs
- ✅ Scheduled reorder runs
- ✅ Email/SMS alerts
- ✅ QR code generation

---

## 📞 Next Steps

1. **Setup Firebase** - Create project & credentials
2. **Double-click START_ALL.bat** - Start all services
3. **Open http://localhost:5173** - Login to dashboard
4. **Scan QR codes** - Test mobile app
5. **Check consignments** - Verify data flow
6. **Deploy to production** - When ready

---

## 📚 Detailed Docs

See these for more info:
- `RUN_PROJECT.md` - Complete setup guide
- `ENVIRONMENT_SETUP.md` - Environment variables & configs
- `errors_found.md` - What was fixed

---

**Ready to go! 🚀**

For help: Check the docs or Firebase/Flutter official documentation
