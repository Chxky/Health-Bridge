class AppConfig {
  static const String appName = 'HealthBridge MedTrack';
  static const String appVersion = '1.0.0';
  static const String apiBaseUrl = 'https://api.healthbridge.co.zw/v1';
  static const String countryCode = 'ZW';
  static const String timezone = 'Africa/Harare';

  // Sync settings
  static const int syncIntervalSeconds = 300;
  static const int maxOfflineQueueSize = 500;
  static const int dataRetentionDays = 90;

  // Stock thresholds
  static const int defaultMinimumThreshold = 100;
  static const int defaultReorderPoint = 200;
  static const int criticalStockDays = 7;

  // QR scan settings
  static const bool requireGpsOnScan = true;
  static const int qrScanTimeoutSeconds = 30;

  // UI
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const int pageSize = 20;
  static const int searchDebounceMs = 500;
}

class AppTheme {
  static const int primaryColor = 0xFF1A365D;
  static const int secondaryColor = 0xFF2B6CB0;
  static const int accentColor = 0xFF38A169;
  static const int warningColor = 0xFFD69E2E;
  static const int dangerColor = 0xFFE53E3E;
  static const int backgroundColor = 0xFFF7FAFC;
  static const int surfaceColor = 0xFFFFFFFF;
  static const int textPrimaryColor = 0xFF1A202C;
  static const int textSecondaryColor = 0xFF718096;

  static const Map<String, int> statusColors = {
    'received': 0xFF38A169,
    'in_transit': 0xFF2B6CB0,
    'dispatched': 0xFFD69E2E,
    'partially_received': 0xFF805AD5,
  };

  static const Map<String, int> urgencyColors = {
    'critical': 0xFFE53E3E,
    'high': 0xFFDD6B20,
    'medium': 0xFFD69E2E,
    'low': 0xFF38A169,
  };
}
