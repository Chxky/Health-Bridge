class StockMovementModel {
  final String? id;
  final String? consignmentId;
  final String facilityId;
  final String medicineName;
  final String batchNumber;
  final String action;
  final int quantity;
  final String performedBy;
  final DateTime timestamp;
  final String? notes;
  final bool isSynced;

  StockMovementModel({
    this.id,
    this.consignmentId,
    required this.facilityId,
    required this.medicineName,
    required this.batchNumber,
    required this.action,
    required this.quantity,
    required this.performedBy,
    required this.timestamp,
    this.notes,
    this.isSynced = true,
  });

  factory StockMovementModel.fromJson(Map<String, dynamic> json) {
    return StockMovementModel(
      id: json['id'],
      consignmentId: json['consignmentId'],
      facilityId: json['facilityId'] ?? '',
      medicineName: json['medicineName'] ?? '',
      batchNumber: json['batchNumber'] ?? '',
      action: json['action'] ?? '',
      quantity: json['quantity'] ?? 0,
      performedBy: json['performedBy'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      notes: json['notes'],
      isSynced: json['isSynced'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'consignmentId': consignmentId,
      'facilityId': facilityId,
      'medicineName': medicineName,
      'batchNumber': batchNumber,
      'action': action,
      'quantity': quantity,
      'performedBy': performedBy,
      'timestamp': timestamp.toIso8601String(),
      'notes': notes,
      'isSynced': isSynced,
    };
  }

  factory StockMovementModel.fromMap(Map<String, dynamic> map) {
    return StockMovementModel(
      id: map['id']?.toString(),
      consignmentId: map['consignmentId']?.toString(),
      facilityId: map['facilityId']?.toString() ?? '',
      medicineName: map['medicineName']?.toString() ?? '',
      batchNumber: map['batchNumber']?.toString() ?? '',
      action: map['action']?.toString() ?? '',
      quantity: (map['quantity'] as num?)?.toInt() ?? 0,
      performedBy: map['performedBy']?.toString() ?? '',
      timestamp: map['timestamp'] != null
          ? DateTime.parse(map['timestamp'].toString())
          : DateTime.now(),
      notes: map['notes']?.toString(),
      isSynced: map['isSynced'] == 1,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'consignmentId': consignmentId,
      'facilityId': facilityId,
      'medicineName': medicineName,
      'batchNumber': batchNumber,
      'action': action,
      'quantity': quantity,
      'performedBy': performedBy,
      'timestamp': timestamp.toIso8601String(),
      'notes': notes,
      'isSynced': isSynced ? 1 : 0,
    };
  }

  String get actionDisplayName {
    switch (action) {
      case 'received':
        return 'Received';
      case 'dispensed':
        return 'Dispensed';
      case 'expired':
        return 'Marked Expired';
      case 'damaged':
        return 'Damaged';
      case 'transferred':
        return 'Transferred';
      default:
        return action;
    }
  }

  bool get isAddition => action == 'received';

  String get quantityDisplay {
    final sign = isAddition ? '+' : '-';
    return '$sign$quantity';
  }
}
