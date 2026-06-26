# HealthBridge MedTrack - Project Setup & Run Guide

## Prerequisites
- **Node.js** v18+ and npm
- **Flutter** SDK 3.0+
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Java SDK** (for Flutter Android development)
- A Firebase project with Blaze plan (for Cloud Functions)

---

## 1. Backend Setup (Firebase Cloud Functions)

### Step 1: Install Dependencies
```bash
cd backend/functions
npm install
```

### Step 2: Build TypeScript
```bash
npm run build
```

This will compile TypeScript to JavaScript in the `lib/` directory.

### Step 3: Setup Firebase Credentials
```bash
firebase login
firebase use --add
# Select your Firebase project ID
```

### Step 4: Set Environment Variables (Optional)
If using email/SMS notifications, configure:
```bash
firebase functions:config:set sendgrid.api_key="your_sendgrid_key"
firebase functions:config:set twilio.account_sid="your_twilio_sid"
firebase functions:config:set twilio.auth_token="your_twilio_token"
firebase functions:config:set twilio.phone_number="+263XXXXXXXXX"
```

### Step 5: Deploy or Run Locally
**Deploy to Firebase:**
```bash
firebase deploy --only functions
```

**Or Run Locally (with Emulator):**
```bash
npm run serve
# Functions will be available at http://localhost:5001
```

---

## 2. Dashboard Setup (React Web App)

### Step 1: Install Dependencies
```bash
cd dashboard
npm install
```

### Step 2: Configure Firebase
Create a `.env` file from the template:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase project config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

### Step 3: Run Development Server
```bash
npm start
# Or with Vite:
npm run dev
```

Dashboard will be available at `http://localhost:5173`

### Step 4: Build for Production
```bash
npm run build
# Output in dist/ folder
```

---

## 3. Mobile Setup (Flutter)

### Step 1: Install Dependencies
```bash
cd mobile
flutter pub get
```

### Step 2: Configure Firebase
1. **Android**: Place `google-services.json` in `android/app/`
   - Download from Firebase Console → Project Settings → google-services.json

2. **iOS**: Place `GoogleService-Info.plist` in `ios/Runner/`
   - Download from Firebase Console → Project Settings → GoogleService-Info.plist

3. **Update Firebase Options**: Edit `lib/config/firebase_options.dart` with your credentials:
   ```dart
   apiKey: 'YOUR_FIREBASE_API_KEY',
   appId: 'YOUR_APP_ID',
   messagingSenderId: 'YOUR_SENDER_ID',
   projectId: 'healthbridge-medtrack',
   ```

### Step 3: Run on Device/Emulator
**List connected devices:**
```bash
flutter devices
```

**Run on Android:**
```bash
flutter run
# Or specific device:
flutter run -d <device_id>
```

**Run on iOS:**
```bash
flutter run -d ios
# Requires macOS with Xcode
```

**Build Release APK (Android):**
```bash
flutter build apk --release
# Output: build/app/outputs/apk/release/app-release.apk
```

**Build iOS App:**
```bash
flutter build ios --release
```

---

## 4. Running All Components Together

### Terminal 1 - Backend
```bash
cd backend/functions
npm run serve
```

### Terminal 2 - Dashboard
```bash
cd dashboard
npm start
```

### Terminal 3 - Mobile
```bash
cd mobile
flutter run
```

---

## 5. Testing & Verification

### Verify Backend is Running
- Functions available at: `http://localhost:5001/healthbridge-medtrack/us-central1/`
- Emulator UI: `http://localhost:4000`

### Verify Dashboard is Running
- Open browser: `http://localhost:5173`
- Login with test Firebase account
- Should see the main dashboard

### Verify Mobile is Running
- App launches on emulator/device
- Can see login screen
- Firebase authentication should work

---

## 6. Troubleshooting

### Backend Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check build errors
npm run build

# View function logs
firebase functions:log
```

### Dashboard Issues
```bash
# Clear Node cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Port already in use?
npm start -- --port 3000  # Use different port
```

### Mobile Issues
```bash
# Clear Flutter cache
flutter clean
flutter pub get

# Check device connection
flutter devices

# View detailed logs
flutter run -v

# Check Firebase connectivity
flutter doctor -v
```

---

## 7. Database Initialization

Before testing, you need to populate Firestore with test data:

### Create Test Facilities
In Firestore Console, add documents to `facilities` collection:
```json
{
  "name": "Harare Central Hospital",
  "type": "central_hospital",
  "location": {"latitude": -17.8252, "longitude": 31.0335},
  "contactPhone": "+263712345678"
}
```

### Create Test Users
Use Firebase Auth to create test users with custom claims:
```javascript
admin.auth().setCustomUserClaims(uid, {
  role: 'pharmacist',
  facilityId: 'facility_id',
  name: 'John Doe'
})
```

### Create Test Medicines
Add to `suppliers` collection and then create `facilityStock` records.

---

## 8. Security Notes

⚠️ **Before Production:**
- ✅ Replace placeholder Firebase credentials
- ✅ Set up proper Firestore security rules
- ✅ Configure Firebase Authentication providers
- ✅ Set up real SendGrid & Twilio accounts
- ✅ Enable Cloud Scheduler for reorder engine
- ✅ Review and update all custom claims in Auth rules

---

## 9. Useful Commands

```bash
# View Firebase project config
firebase projects:list

# Deploy specific component
firebase deploy --only functions
firebase deploy --only firestore:rules

# Monitor Cloud Functions
firebase functions:log --limit 50

# Clear Flutter build cache
flutter clean

# Generate Flutter app icons
flutter pub run flutter_launcher_icons:main
```

---

## Project Structure Reminder

```
healthbridge-medtrack/
├── backend/functions/          # Firebase Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── api/               # API endpoints
│   │   ├── triggers/          # Firestore triggers
│   │   ├── services/          # Business logic
│   │   └── middleware/        # Auth helpers
│   └── lib/                   # Compiled JavaScript
├── dashboard/                 # React Admin Dashboard (TypeScript)
│   ├── src/
│   │   ├── pages/            # Dashboard pages
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   └── contexts/         # Auth context
│   └── dist/                 # Production build
└── mobile/                    # Flutter Mobile App
    └── lib/
        ├── screens/          # UI screens
        ├── services/         # API & local storage
        ├── models/           # Data models
        └── config/           # App configuration
```

---

**Happy coding! 🚀**
