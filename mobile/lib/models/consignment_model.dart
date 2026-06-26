class ConsignmentModel {
  final String id;
  final String medicineName;
  final String batchNumber;
  final DateTime expiryDate;
  final int quantity;
  final String sourceWarehouse;
  final String destinationFacility;
  final String status;
  final String? receivedBy;
  final DateTime? receivedTimestamp;
  final DateTime? dispatchedTimestamp;
  final String? qrCodeUrl;
  final double? gpsLatitude;
  final double? gpsLongitude;

  ConsignmentModel({
    required this.id,
    required this.medicineName,
    required this.batchNumber,
    required this.expiryDate,
    required this.quantity,
    required this.sourceWarehouse,
    required this.destinationFacility,
    required this.status,
    this.receivedBy,
    this.receivedTimestamp,
    this.dispatchedTimestamp,
    this.qrCodeUrl,
    this.gpsLatitude,
    this.gpsLongitude,
  });

  factory ConsignmentModel.fromJson(Map<String, dynamic> json) {
    return ConsignmentModel(
      id: json['id'] ?? '',
      medicineName: json['medicineName'] ?? '',
      batchNumber: json['batchNumber'] ?? '',
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : DateTime.now(),
      quantity: json['quantity'] ?? 0,
      sourceWarehouse: json['sourceWarehouse'] ?? '',
      destinationFacility: json['destinationFacility'] ?? '',
      status: json['status'] ?? 'dispatched',
      receivedBy: json['receivedBy'],
      receivedTimestamp: json['receivedTimestamp'] != null
          ? DateTime.parse(json['receivedTimestamp'])
          : null,
      dispatchedTimestamp: json['dispatchedTimestamp'] != null
          ? DateTime.parse(json['dispatchedTimestamp'])
          : null,
      qrCodeUrl: json['qrCodeUrl'],
      gpsLatitude: json['gpsLatitude']?.toDouble(),
      gpsLongitude: json['gpsLongitude']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'medicineName': medicineName,
      'batchNumber': batchNumber,
      'expiryDate': expiryDate.toIso8601String(),
      'quantity': quantity,
      'sourceWarehouse': sourceWarehouse,
      'destinationFacility': destinationFacility,
      'status': status,
      'receivedBy': receivedBy,
      'receivedTimestamp': receivedTimestamp?.toIso8601String(),
      'dispatchedTimestamp': dispatchedTimestamp?.toIso8601String(),
      'qrCodeUrl': qrCodeUrl,
      'gpsLatitude': gpsLatitude,
      'gpsLongitude': gpsLongitude,
    };
  }

  bool get isReceived => status == 'received';
  bool get isInTransit => status == 'in_transit';
  bool get isDispatched => status == 'dispatched';
  bool get isPartiallyReceived => status == 'partially_received';

  String get statusDisplayName {
    switch (status) {
      case 'received':
        return 'Received';
      case 'in_transit':
        return 'In Transit';
      case 'dispatched':
        return 'Dispatched';
      case 'partially_received':
        return 'Partially Received';
      default:
        return status;
    }
  }

  int get daysSinceDispatch {
    if (dispatchedTimestamp == null) return 0;
    return DateTime.now().difference(dispatchedTimestamp!).inDays;
  }
}
