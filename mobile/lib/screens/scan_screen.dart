import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';
import '../services/offline_db_service.dart';
import '../services/sync_service.dart';
import '../services/auth_service.dart';
import '../config/app_config.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({Key? key}) : super(key: key);

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final MobileScannerController _scannerController = MobileScannerController();
  final ApiService _apiService = ApiService();
  final OfflineDbService _offlineDb = OfflineDbService.instance;
  final SyncService _syncService = SyncService.instance;

  bool _isProcessing = false;
  bool _isOnline = true;
  String? _lastScannedCode;
  Timer? _resetTimer;

  @override
  void initState() {
    super.initState();
    _isOnline = _syncService.isOnline;
    _syncService.connectivityStream.listen((online) {
      if (mounted) setState(() => _isOnline = online);
    });
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _resetTimer?.cancel();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null) return;

    final rawValue = barcode.rawValue;
    if (rawValue == null || rawValue == _lastScannedCode) return;

    setState(() {
      _isProcessing = true;
      _lastScannedCode = rawValue;
    });

    _scannerController.stop();

    try {
      if (_isOnline) {
        Position? position;
        if (AppConfig.requireGpsOnScan) {
          try {
            position = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.high,
              timeLimit: const Duration(seconds: 10),
            );
          } catch (e) {
            print('GPS unavailable: $e');
          }
        }

        final user = AuthService().currentUser;
        final result = await _apiService.scanConsignment(
          qrData: rawValue,
          gpsLatitude: position?.latitude,
          gpsLongitude: position?.longitude,
          facilityId: user?.facilityId,
        );

        if (mounted) {
          _showResultDialog(
            success: true,
            message: result['message'] ?? 'Consignment received successfully',
            medicineName: result['medicineName'],
            batchNumber: result['batchNumber'],
            quantity: result['quantity'],
          );
        }
      } else {
        await _offlineDb.addPendingScan(
          qrData: rawValue,
          facilityId: AuthService().currentUser?.facilityId,
        );

        if (mounted) {
          _showResultDialog(
            success: true,
            message: 'Scan saved offline. Will sync when connected.',
            isOffline: true,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        _showResultDialog(
          success: false,
          message: e.toString().replaceFirst('Exception: ', ''),
        );
      }
    }
  }

  void _showResultDialog({
    required bool success,
    required String message,
    String? medicineName,
    String? batchNumber,
    int? quantity,
    bool isOffline = false,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              success ? Icons.check_circle : Icons.error,
              color: success
                  ? const Color(0xFF38A169)
                  : const Color(0xFFE53E3E),
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              success ? 'Scan Successful' : 'Scan Failed',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: success
                    ? const Color(0xFF38A169)
                    : const Color(0xFFE53E3E),
              ),
            ),
            if (isOffline) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3CD),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'OFFLINE MODE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF856404),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Color(0xFF4A5568)),
            ),
            if (medicineName != null) ...[
              const SizedBox(height: 8),
              Text(
                medicineName,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A202C),
                ),
              ),
            ],
            if (batchNumber != null)
              Text(
                'Batch: $batchNumber | Qty: $quantity',
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF718096),
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _resetScanner();
            },
            child: const Text('Scan Another'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _resetScanner() {
    setState(() => _isProcessing = false);
    _scannerController.start();

    _resetTimer?.cancel();
    _resetTimer = Timer(const Duration(seconds: 3), () {
      _lastScannedCode = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Scan QR Code'),
        actions: [
          if (!_isOnline)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Icon(Icons.cloud_off, color: Color(0xFFE53E3E), size: 20),
            ),
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _scannerController.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
            errorBuilder: (context, error, child) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline,
                        color: Colors.white70, size: 48),
                    const SizedBox(height: 16),
                    const Text(
                      'Camera access is required for QR scanning',
                      style: TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => _scannerController.start(),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            },
          ),

          // Scan overlay
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: const Color(0xFF2B6CB0),
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),

          // Processing overlay
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Processing scan...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),

          // Instructions at bottom
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Text(
                  _isOnline
                      ? 'Point camera at the QR code on the consignment'
                      : 'Offline mode - scan will be saved and synced later',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _StatusDot(
                      label: 'GPS',
                      active: AppConfig.requireGpsOnScan,
                    ),
                    const SizedBox(width: 16),
                    _StatusDot(
                      label: 'Online',
                      active: _isOnline,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  final String label;
  final bool active;

  const _StatusDot({required this.label, required this.active});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? const Color(0xFF38A169) : const Color(0xFFE53E3E),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 12),
        ),
      ],
    );
  }
}
