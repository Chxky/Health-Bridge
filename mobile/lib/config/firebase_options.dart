import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return const FirebaseOptions(
      apiKey: String.fromEnvironment(
        'FIREBASE_API_KEY',
        defaultValue: 'AIzaSyBYxQhq9gApCjlhQ5mZuk2OWalvHQLFPWI',
      ),
      appId: String.fromEnvironment(
        'FIREBASE_APP_ID',
        defaultValue: '1:817378191380:web:300fa5b75b5c5759b65f01',
      ),
      messagingSenderId: String.fromEnvironment(
        'FIREBASE_MESSAGING_SENDER_ID',
        defaultValue: '817378191380',
      ),
      projectId: String.fromEnvironment(
        'FIREBASE_PROJECT_ID',
        defaultValue: 'health-bridge-e7e9e',
      ),
      storageBucket: String.fromEnvironment(
        'FIREBASE_STORAGE_BUCKET',
        defaultValue: 'health-bridge-e7e9e.firebasestorage.app',
      ),
      authDomain: String.fromEnvironment(
        'FIREBASE_AUTH_DOMAIN',
        defaultValue: 'health-bridge-e7e9e.firebaseapp.com',
      ),
      databaseURL: String.fromEnvironment(
        'FIREBASE_DATABASE_URL',
        defaultValue: 'https://health-bridge-e7e9e.firebaseio.com',
      ),
      iosBundleId: String.fromEnvironment(
        'FIREBASE_IOS_BUNDLE_ID',
        defaultValue: 'com.healthbridge.medtrack',
      ),
      androidClientId: String.fromEnvironment(
        'FIREBASE_ANDROID_CLIENT_ID',
        defaultValue: 'YOUR_ANDROID_CLIENT_ID',
      ),
      iosClientId: String.fromEnvironment(
        'FIREBASE_IOS_CLIENT_ID',
        defaultValue: 'YOUR_IOS_CLIENT_ID',
      ),
    );
  }
}
