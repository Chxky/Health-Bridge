import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../config/app_config.dart';
import 'offline_db_service.dart';
import 'api_service.dart';

enum SyncStatus { idle, syncing, error }

class SyncService {
  static final SyncService instance = SyncService._init();

  final OfflineDbService _offlineDb = OfflineDbService.instance;
  final ApiService _apiService = ApiService();
  final Connectivity _connectivity = Connectivity();

  Timer? _syncTimer;
  SyncStatus _status = SyncStatus.idle;
  bool _isOnline = false;

  SyncStatus get status => _status;
  bool get isOnline => _isOnline;

  final StreamController<SyncStatus> _statusController =
      StreamController<SyncStatus>.broadcast();
  Stream<SyncStatus> get statusStream => _statusController.stream;

  final StreamController<bool> _connectivityController =
      StreamController<bool>.broadcast();
  Stream<bool> get connectivityStream => _connectivityController.stream;

  SyncService._init();

  Future<void> initialize() async {
    _connectivity.onConnectivityChanged.listen((results) {
      if (results == ConnectivityResult.none) {
        _isOnline = false;
        _connectivityController.add(false);
      } else {
        _isOnline = true;
        _connectivityController.add(true);
        syncAll();
      }
    });

    final connectivityResult = await _connectivity.checkConnectivity();
    _isOnline = connectivityResult != ConnectivityResult.none;
    _connectivityController.add(_isOnline);

    _syncTimer = Timer.periodic(
      Duration(seconds: AppConfig.syncIntervalSeconds),
      (_) {
        if (_isOnline) syncAll();
      },
    );
  }

  Future<bool> checkConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    _isOnline = result != ConnectivityResult.none;
    _connectivityController.add(_isOnline);
    return _isOnline;
  }

  Future<void> syncAll() async {
    if (_status == SyncStatus.syncing) return;
    if (!_isOnline) return;

    _status = SyncStatus.syncing;
    _statusController.add(SyncStatus.syncing);

    try {
      await syncPendingScans();
      await syncPendingMovements();
      await refreshCachedData();

      _status = SyncStatus.idle;
      _statusController.add(SyncStatus.idle);
    } catch (e) {
      print('Sync error: $e');
      _status = SyncStatus.error;
      _statusController.add(SyncStatus.error);
    }
  }

  Future<void> syncPendingScans() async {
    final pendingScans = await _offlineDb.getPendingScans();

    for (final scan in pendingScans) {
      try {
        final scanId = scan['id'] as int;
        await _apiService.scanConsignment(
          qrData: scan['qrData'] as String,
          gpsLatitude: scan['gpsLatitude'] as double?,
          gpsLongitude: scan['gpsLongitude'] as double?,
          facilityId: scan['facilityId'] as String?,
        );

        await _offlineDb.markScanSynced(scanId);
      } catch (e) {
        await _offlineDb.incrementMovementRetry(scan['id'] as int);

        final retryCount = scan['retryCount'] as int? ?? 0;
        if (retryCount >= 3) {
          await _offlineDb.markMovementFailed(
            scan['id'] as int,
            e.toString(),
          );
        }
      }
    }
  }

  Future<void> syncPendingMovements() async {
    final pendingMovements = await _offlineDb.getPendingMovements();

    for (final movement in pendingMovements) {
      try {
        final movementId = movement['id'] as int;
        await _apiService.adjustStock(
          facilityId: movement['facilityId'] as String?,
          medicineName: movement['medicineName'] as String,
          batchNumber: movement['batchNumber'] as String,
          action: movement['action'] as String,
          quantity: movement['quantity'] as int,
          notes: movement['notes'] as String?,
          consignmentId: movement['consignmentId'] as String?,
        );

        await _offlineDb.markMovementSynced(movementId);
      } catch (e) {
        await _offlineDb.incrementMovementRetry(movement['id'] as int);

        final retryCount = movement['retryCount'] as int? ?? 0;
        if (retryCount >= 3) {
          await _offlineDb.markMovementFailed(
            movement['id'] as int,
            e.toString(),
          );
        }
      }
    }
  }

  Future<void> refreshCachedData() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final idToken = await user.getIdTokenResult();
      final facilityId = idToken.claims?['facilityId'] as String?;

      if (facilityId != null) {
        final stock = await _apiService.getFacilityStock(
          facilityId: facilityId,
        );
        await _offlineDb.cacheStock(stock);

        final consignments = await _apiService.getConsignments(
          facilityId: facilityId,
          limit: 50,
        );
        await _offlineDb.cacheConsignments(consignments);
      }
    } catch (e) {
      print('Cache refresh error (non-fatal): $e');
    }
  }

  Future<int> getPendingItemCount() async {
    return await _offlineDb.getPendingCount();
  }

  void dispose() {
    _syncTimer?.cancel();
    _statusController.close();
    _connectivityController.close();
  }
}
