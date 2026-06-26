import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return FirebaseOptions(
      apiKey: const String.fromEnvironment(
        'FIREBASE_API_KEY',
        defaultValue: 'YOUR_API_KEY',
      ),
      appId: const String.fromEnvironment(
        'FIREBASE_APP_ID',
        defaultValue: 'YOUR_APP_ID',
      ),
      messagingSenderId: const String.fromEnvironment(
        'FIREBASE_MESSAGING_SENDER_ID',
        defaultValue: 'YOUR_SENDER_ID',
      ),
      projectId: const String.fromEnvironment(
        'FIREBASE_PROJECT_ID',
        defaultValue: 'healthbridge-medtrack',
      ),
      storageBucket: const String.fromEnvironment(
        'FIREBASE_STORAGE_BUCKET',
        defaultValue: 'healthbridge-medtrack.appspot.com',
      ),
      authDomain: const String.fromEnvironment(
        'FIREBASE_AUTH_DOMAIN',
        defaultValue: 'healthbridge-medtrack.firebaseapp.com',
      ),
      databaseURL: const String.fromEnvironment(
        'FIREBASE_DATABASE_URL',
        defaultValue: 'https://healthbridge-medtrack.firebaseio.com',
      ),
      iosBundleId: const String.fromEnvironment(
        'FIREBASE_IOS_BUNDLE_ID',
        defaultValue: 'com.healthbridge.medtrack',
      ),
      androidClientId: const String.fromEnvironment(
        'FIREBASE_ANDROID_CLIENT_ID',
        defaultValue: 'YOUR_ANDROID_CLIENT_ID',
      ),
      iosClientId: const String.fromEnvironment(
        'FIREBASE_IOS_CLIENT_ID',
        defaultValue: 'YOUR_IOS_CLIENT_ID',
      ),
    );
  }
}
