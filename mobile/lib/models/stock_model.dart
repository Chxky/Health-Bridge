class StockModel {
  final String id;
  final String facilityId;
  final String medicineName;
  final String batchNumber;
  final int currentQuantity;
  final int minimumThreshold;
  final int reorderPoint;
  final DateTime expiryDate;
  final DateTime lastUpdated;
  final int? daysUntilExpiry;
  final bool isLowStock;
  final bool needsReorder;

  StockModel({
    required this.id,
    required this.facilityId,
    required this.medicineName,
    required this.batchNumber,
    required this.currentQuantity,
    required this.minimumThreshold,
    required this.reorderPoint,
    required this.expiryDate,
    required this.lastUpdated,
    this.daysUntilExpiry,
    this.isLowStock = false,
    this.needsReorder = false,
  });

  factory StockModel.fromJson(Map<String, dynamic> json) {
    final daysUntilExpiry = json['daysUntilExpiry'] != null
        ? (json['daysUntilExpiry'] as num).toInt()
        : null;

    final isLowStock = json['isLowStock'] ?? false;
    final needsReorder = json['needsReorder'] ?? false;

    return StockModel(
      id: json['id'] ?? '',
      facilityId: json['facilityId'] ?? '',
      medicineName: json['medicineName'] ?? '',
      batchNumber: json['batchNumber'] ?? '',
      currentQuantity: json['currentQuantity'] ?? 0,
      minimumThreshold: json['minimumThreshold'] ?? 100,
      reorderPoint: json['reorderPoint'] ?? 200,
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : DateTime.now(),
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'])
          : DateTime.now(),
      daysUntilExpiry: daysUntilExpiry,
      isLowStock: isLowStock,
      needsReorder: needsReorder,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'facilityId': facilityId,
      'medicineName': medicineName,
      'batchNumber': batchNumber,
      'currentQuantity': currentQuantity,
      'minimumThreshold': minimumThreshold,
      'reorderPoint': reorderPoint,
      'expiryDate': expiryDate.toIso8601String(),
      'lastUpdated': lastUpdated.toIso8601String(),
      'daysUntilExpiry': daysUntilExpiry,
      'isLowStock': isLowStock,
      'needsReorder': needsReorder,
    };
  }

  factory StockModel.fromMap(Map<String, dynamic> map) {
    return StockModel(
      id: map['id']?.toString() ?? '',
      facilityId: map['facilityId']?.toString() ?? '',
      medicineName: map['medicineName']?.toString() ?? '',
      batchNumber: map['batchNumber']?.toString() ?? '',
      currentQuantity: (map['currentQuantity'] as num?)?.toInt() ?? 0,
      minimumThreshold: (map['minimumThreshold'] as num?)?.toInt() ?? 100,
      reorderPoint: (map['reorderPoint'] as num?)?.toInt() ?? 200,
      expiryDate: map['expiryDate'] != null
          ? DateTime.parse(map['expiryDate'].toString())
          : DateTime.now(),
      lastUpdated: map['lastUpdated'] != null
          ? DateTime.parse(map['lastUpdated'].toString())
          : DateTime.now(),
      daysUntilExpiry: (map['daysUntilExpiry'] as num?)?.toInt(),
      isLowStock: map['isLowStock'] == true,
      needsReorder: map['needsReorder'] == true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'facilityId': facilityId,
      'medicineName': medicineName,
      'batchNumber': batchNumber,
      'currentQuantity': currentQuantity,
      'minimumThreshold': minimumThreshold,
      'reorderPoint': reorderPoint,
      'expiryDate': expiryDate.toIso8601String(),
      'lastUpdated': lastUpdated.toIso8601String(),
      'daysUntilExpiry': daysUntilExpiry,
      'isLowStock': isLowStock ? 1 : 0,
      'needsReorder': needsReorder ? 1 : 0,
    };
  }

  double get stockPercentage {
    if (minimumThreshold <= 0) return 1.0;
    return (currentQuantity / (minimumThreshold * 2)).clamp(0.0, 1.0);
  }

  String get stockStatusLabel {
    if (currentQuantity <= 0) return 'Out of Stock';
    if (currentQuantity <= minimumThreshold) return 'Low Stock';
    if (currentQuantity <= reorderPoint) return 'Reorder Soon';
    return 'In Stock';
  }

  bool get isExpiringSoon {
    if (daysUntilExpiry == null) return false;
    return daysUntilExpiry! <= 90;
  }

  bool get isExpired {
    return expiryDate.isBefore(DateTime.now());
  }
}
