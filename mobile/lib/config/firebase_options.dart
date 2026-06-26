import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return const FirebaseOptions(
      apiKey: 'YOUR_API_KEY',
      appId: 'YOUR_APP_ID',
      messagingSenderId: 'YOUR_SENDER_ID',
      projectId: 'healthbridge-medtrack',
      storageBucket: 'healthbridge-medtrack.appspot.com',
      authDomain: 'healthbridge-medtrack.firebaseapp.com',
      databaseURL: 'https://healthbridge-medtrack.firebaseio.com',
      iosBundleId: 'com.healthbridge.medtrack',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID',
      iosClientId: 'YOUR_IOS_CLIENT_ID',
    );
  }
}
