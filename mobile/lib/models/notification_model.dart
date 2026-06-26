class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final String? facilityId;
  final List<String> targetRoles;
  final bool read;
  final DateTime createdAt;
  final Map<String, String>? data;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.facilityId,
    required this.targetRoles,
    this.read = false,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? 'system',
      facilityId: json['facilityId'],
      targetRoles: List<String>.from(json['targetRoles'] ?? []),
      read: json['read'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      data: json['data'] != null
          ? Map<String, String>.from(json['data'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'facilityId': facilityId,
      'targetRoles': targetRoles,
      'read': read,
      'createdAt': createdAt.toIso8601String(),
      'data': data,
    };
  }

  bool get isLowStock => type == 'low_stock';
  bool get isExpiryAlert => type == 'expiry_alert';
  bool get isReorderGenerated => type == 'reorder_generated';

  String get typeIcon {
    switch (type) {
      case 'low_stock':
        return 'inventory_2';
      case 'expiry_alert':
        return 'calendar_today';
      case 'consignment_received':
        return 'check_circle';
      case 'reorder_generated':
        return 'receipt_long';
      case 'compliance_alert':
        return 'gavel';
      default:
        return 'notifications';
    }
  }

  String get timeAgo {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }
}
