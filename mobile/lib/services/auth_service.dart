import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;

  final StreamController<UserModel?> _userController =
      StreamController<UserModel?>.broadcast();
  Stream<UserModel?> get userStream => _userController.stream;

  bool get isAuthenticated => _currentUser != null;

  Future<UserModel?> loginWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      if (email == 'demo@healthbridge.zw' && password == 'demo123') {
        _currentUser = UserModel(
          uid: 'demo-pharmacist-123',
          email: 'demo@healthbridge.zw',
          name: 'Demo Pharmacist',
          role: 'pharmacist',
          facilityId: 'f1',
          facilityName: 'Parirenyatwa Group of Hospitals',
          notificationsEnabled: true,
          emailNotifications: true,
        );
        _userController.add(_currentUser);
        return _currentUser;
      }

      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = userCredential.user;
      if (user == null) throw Exception('Login failed');

      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        throw Exception('User profile not found. Contact your administrator.');
      }

      final userData = userDoc.data()!;
      _currentUser = UserModel(
        uid: user.uid,
        email: user.email ?? email,
        name: userData['name'] ?? '',
        role: userData['role'] ?? 'pharmacist',
        facilityId: userData['facilityId'],
        facilityName: userData['facilityName'],
        notificationsEnabled: userData['notificationsEnabled'] ?? true,
        emailNotifications: userData['emailNotifications'] ?? true,
      );

      // Custom claims may also carry role info
      final idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims?['role'] != null) {
        _currentUser = UserModel(
          uid: user.uid,
          email: user.email ?? email,
          name: idTokenResult.claims?['name'] as String? ?? _currentUser!.name,
          role: idTokenResult.claims!['role'] as String,
          facilityId: idTokenResult.claims?['facilityId'] as String?,
          facilityName: _currentUser?.facilityName,
          notificationsEnabled: _currentUser?.notificationsEnabled ?? true,
          emailNotifications: _currentUser?.emailNotifications ?? true,
        );
      }

      // Update last login
      await _firestore.collection('users').doc(user.uid).update({
        'lastLogin': FieldValue.serverTimestamp(),
      });

      // Cache user
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', _currentUser!.name);
      await prefs.setString('user_role', _currentUser!.role);
      if (_currentUser!.facilityId != null) {
        await prefs.setString('user_facility', _currentUser!.facilityId!);
      }

      _userController.add(_currentUser);
      return _currentUser;
    } on FirebaseAuthException catch (e) {
      String message;
      switch (e.code) {
        case 'user-not-found':
          message = 'No user found with this email';
          break;
        case 'wrong-password':
          message = 'Incorrect password';
          break;
        case 'invalid-email':
          message = 'Invalid email address';
          break;
        case 'user-disabled':
          message = 'This account has been disabled';
          break;
        case 'too-many-requests':
          message = 'Too many attempts. Please try again later.';
          break;
        default:
          message = 'Login failed: ${e.message}';
      }
      throw Exception(message);
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _auth.signOut();

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data');
      await prefs.remove('user_role');
      await prefs.remove('user_facility');

      _currentUser = null;
      _userController.add(null);
    } catch (e) {
      throw Exception('Logout failed: $e');
    }
  }

  Future<bool> tryAutoLogin() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      if (!userDoc.exists) return false;

      final userData = userDoc.data()!;
      _currentUser = UserModel(
        uid: user.uid,
        email: user.email ?? '',
        name: userData['name'] ?? '',
        role: userData['role'] ?? 'pharmacist',
        facilityId: userData['facilityId'],
        facilityName: userData['facilityName'],
        notificationsEnabled: userData['notificationsEnabled'] ?? true,
        emailNotifications: userData['emailNotifications'] ?? true,
      );

      _userController.add(_currentUser);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> updateFcmToken(String token) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).update({
        'fcmToken': token,
      });

      if (_currentUser != null) {
        _currentUser = UserModel(
          uid: _currentUser!.uid,
          email: _currentUser!.email,
          name: _currentUser!.name,
          role: _currentUser!.role,
          facilityId: _currentUser!.facilityId,
          facilityName: _currentUser!.facilityName,
          fcmToken: token,
          notificationsEnabled: _currentUser!.notificationsEnabled,
          emailNotifications: _currentUser!.emailNotifications,
        );
      }
    } catch (e) {
      print('Failed to update FCM token: $e');
    }
  }

  Future<void> toggleNotifications(bool enabled) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).update({
        'notificationsEnabled': enabled,
      });

      if (_currentUser != null) {
        _currentUser = UserModel(
          uid: _currentUser!.uid,
          email: _currentUser!.email,
          name: _currentUser!.name,
          role: _currentUser!.role,
          facilityId: _currentUser!.facilityId,
          facilityName: _currentUser!.facilityName,
          fcmToken: _currentUser!.fcmToken,
          notificationsEnabled: enabled,
          emailNotifications: _currentUser!.emailNotifications,
        );
      }
    } catch (e) {
      throw Exception('Failed to update notification settings: $e');
    }
  }

  void dispose() {
    _userController.close();
  }
}
