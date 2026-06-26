import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/consignment_model.dart';
import '../models/stock_model.dart';
import '../models/stock_movement_model.dart';
import '../models/notification_model.dart';
import '../config/app_config.dart';
import 'mock_data.dart';

const bool useMock = true;

class ApiService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<String?> _getToken() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    return await user.getIdToken();
  }

  Map<String, String> _headers(String? token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Stock APIs
  Future<List<StockModel>> getFacilityStock({
    String? facilityId,
    String? medicineName,
  }) async {
    if (useMock) return mockStock;
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      Query query = _firestore.collection('facilityStock');

      final idToken = await user.getIdTokenResult();
      final userFacilityId = idToken.claims?['facilityId'] as String?;
      final targetFacilityId = facilityId ?? userFacilityId;

      if (targetFacilityId != null) {
        query = query.where('facilityId', isEqualTo: targetFacilityId);
      }

      if (medicineName != null) {
        query = query.where('medicineName', isEqualTo: medicineName);
      }

      final snapshot = await query.get();
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        final daysUntilExpiry = data['expiryDate'] != null
            ? (data['expiryDate'] as Timestamp).toDate()
                .difference(DateTime.now())
                .inDays
            : null;

        return StockModel(
          id: doc.id,
          facilityId: data['facilityId'] ?? '',
          medicineName: data['medicineName'] ?? '',
          batchNumber: data['batchNumber'] ?? '',
          currentQuantity: (data['currentQuantity'] ?? 0).toInt(),
          minimumThreshold: (data['minimumThreshold'] ?? 100).toInt(),
          reorderPoint: (data['reorderPoint'] ?? 200).toInt(),
          expiryDate: (data['expiryDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
          lastUpdated: (data['lastUpdated'] as Timestamp?)?.toDate() ?? DateTime.now(),
          daysUntilExpiry: daysUntilExpiry,
          isLowStock: (data['currentQuantity'] ?? 0) <= (data['minimumThreshold'] ?? 100),
          needsReorder: (data['currentQuantity'] ?? 0) <= (data['reorderPoint'] ?? 200),
        );
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch stock: $e');
    }
  }

  // Scan consignment
  Future<Map<String, dynamic>> scanConsignment({
    required String qrData,
    double? gpsLatitude,
    double? gpsLongitude,
    String? facilityId,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/scan-consignment'),
        headers: _headers(token),
        body: jsonEncode({
          'qrData': qrData,
          'gpsLatitude': gpsLatitude,
          'gpsLongitude': gpsLongitude,
          'facilityId': facilityId,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception(jsonDecode(response.body)['error'] ?? 'Scan failed');
      }
    } catch (e) {
      throw Exception('Failed to scan consignment: $e');
    }
  }

  // Get consignments
  Future<List<ConsignmentModel>> getConsignments({
    String? facilityId,
    String? status,
    int limit = 50,
  }) async {
    if (useMock) return mockConsignments;
    try {
      Query query = _firestore.collection('medicineConsignments');

      if (facilityId != null) {
        query = query.where('destinationFacility', isEqualTo: facilityId);
      }

      if (status != null) {
        query = query.where('status', isEqualTo: status);
      }

      query = query.orderBy('receivedTimestamp', descending: true).limit(limit);

      final snapshot = await query.get();
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return ConsignmentModel(
          id: doc.id,
          medicineName: data['medicineName'] ?? '',
          batchNumber: data['batchNumber'] ?? '',
          expiryDate: (data['expiryDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
          quantity: (data['quantity'] ?? 0).toInt(),
          sourceWarehouse: data['sourceWarehouse'] ?? '',
          destinationFacility: data['destinationFacility'] ?? '',
          status: data['status'] ?? 'dispatched',
          receivedBy: data['receivedBy'],
          receivedTimestamp: (data['receivedTimestamp'] as Timestamp?)?.toDate(),
          dispatchedTimestamp: (data['dispatchedTimestamp'] as Timestamp?)?.toDate(),
          qrCodeUrl: data['qrCodeUrl'],
        );
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch consignments: $e');
    }
  }

  // Record stock adjustment
  Future<Map<String, dynamic>> adjustStock({
    String? facilityId,
    required String medicineName,
    required String batchNumber,
    required String action,
    required int quantity,
    String? notes,
    String? consignmentId,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/adjust-stock'),
        headers: _headers(token),
        body: jsonEncode({
          'facilityId': facilityId,
          'medicineName': medicineName,
          'batchNumber': batchNumber,
          'action': action,
          'quantity': quantity,
          'notes': notes,
          'consignmentId': consignmentId,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception(jsonDecode(response.body)['error'] ?? 'Adjustment failed');
      }
    } catch (e) {
      throw Exception('Failed to adjust stock: $e');
    }
  }

  // Get notifications
  Future<List<AppNotification>> getNotifications({int limit = 50}) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final idToken = await user.getIdTokenResult();
      final role = idToken.claims?['role'] as String?;
      final facilityId = idToken.claims?['facilityId'] as String?;

      Query query = _firestore
          .collection('notifications')
          .orderBy('createdAt', descending: true)
          .limit(limit);

      final snapshot = await query.get();

      final notifications = <AppNotification>[];
      for (final doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final targetRoles = List<String>.from(data['targetRoles'] ?? []);
        final notificationFacilityId = data['facilityId'] as String?;

        if (targetRoles.contains(role)) {
          if (notificationFacilityId == null || notificationFacilityId == facilityId) {
            notifications.add(AppNotification(
              id: doc.id,
              title: data['title'] ?? '',
              body: data['body'] ?? '',
              type: data['type'] ?? 'system',
              facilityId: notificationFacilityId,
              targetRoles: targetRoles,
              read: data['read'] ?? false,
              createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
              data: data['data'] != null ? Map<String, String>.from(data['data']) : null,
            ));
          }
        }
      }

      return notifications;
    } catch (e) {
      throw Exception('Failed to fetch notifications: $e');
    }
  }

  // Mark notification as read
  Future<void> markNotificationRead(String notificationId) async {
    try {
      await _firestore.collection('notifications').doc(notificationId).update({
        'read': true,
      });
    } catch (e) {
      throw Exception('Failed to mark notification as read: $e');
    }
  }

  // Get facilities
  Future<List<Map<String, dynamic>>> getFacilities({String? type}) async {
    try {
      Query query = _firestore.collection('facilities');
      if (type != null) {
        query = query.where('type', isEqualTo: type);
      }

      final snapshot = await query.get();
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return {
          'id': doc.id,
          'name': data['name'] ?? '',
          'type': data['type'] ?? '',
          'contactPhone': data['contactPhone'] ?? '',
          'location': data['location'] != null
              ? {
                  'latitude': (data['location'] as GeoPoint).latitude,
                  'longitude': (data['location'] as GeoPoint).longitude,
                }
              : null,
        };
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch facilities: $e');
    }
  }

  // Get stock movements
  Future<List<StockMovementModel>> getStockMovements({
    String? facilityId,
    int limit = 50,
  }) async {
    try {
      Query query = _firestore
          .collection('stockMovements')
          .orderBy('timestamp', descending: true)
          .limit(limit);

      if (facilityId != null) {
        query = query.where('facilityId', isEqualTo: facilityId);
      }

      final snapshot = await query.get();
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return StockMovementModel(
          id: doc.id,
          consignmentId: data['consignmentId'],
          facilityId: data['facilityId'] ?? '',
          medicineName: data['medicineName'] ?? '',
          batchNumber: data['batchNumber'] ?? '',
          action: data['action'] ?? '',
          quantity: (data['quantity'] ?? 0).toInt(),
          performedBy: data['performedBy'] ?? '',
          timestamp: (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
          notes: data['notes'],
        );
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch stock movements: $e');
    }
  }

  // Get purchase requests
  Future<List<Map<String, dynamic>>> getPurchaseRequests({
    String? facilityId,
    String? status,
  }) async {
    try {
      Query query = _firestore.collection('purchaseRequests');

      if (facilityId != null) {
        query = query.where('facilityId', isEqualTo: facilityId);
      }
      if (status != null) {
        query = query.where('status', isEqualTo: status);
      }

      query = query.orderBy('generatedAt', descending: true);

      final snapshot = await query.get();
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return {
          'id': doc.id,
          ...data,
          'generatedAt': (data['generatedAt'] as Timestamp?)?.toDate().toIso8601String(),
          'reviewedAt': (data['reviewedAt'] as Timestamp?)?.toDate().toIso8601String(),
        };
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch purchase requests: $e');
    }
  }
}
