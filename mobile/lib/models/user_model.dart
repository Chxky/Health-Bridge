class UserModel {
  final String uid;
  final String email;
  final String name;
  final String role;
  final String? facilityId;
  final String? facilityName;
  final String? fcmToken;
  final bool notificationsEnabled;
  final bool emailNotifications;
  final DateTime? lastLogin;

  UserModel({
    required this.uid,
    required this.email,
    required this.name,
    required this.role,
    this.facilityId,
    this.facilityName,
    this.fcmToken,
    this.notificationsEnabled = true,
    this.emailNotifications = true,
    this.lastLogin,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['uid'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'pharmacist',
      facilityId: json['facilityId'],
      facilityName: json['facilityName'],
      fcmToken: json['fcmToken'],
      notificationsEnabled: json['notificationsEnabled'] ?? true,
      emailNotifications: json['emailNotifications'] ?? true,
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'name': name,
      'role': role,
      'facilityId': facilityId,
      'facilityName': facilityName,
      'fcmToken': fcmToken,
      'notificationsEnabled': notificationsEnabled,
      'emailNotifications': emailNotifications,
      'lastLogin': lastLogin?.toIso8601String(),
    };
  }

  bool get isNatPharmOfficial =>
      role == 'natpharm_officer' || role == 'natpharm_admin';

  bool get isMinistryViewer => role == 'ministry_viewer';

  bool get isHospitalAdmin => role == 'hospital_admin';

  bool get isPharmacist => role == 'pharmacist';

  bool get canViewNationalData => isNatPharmOfficial || isMinistryViewer;

  String get roleDisplayName {
    switch (role) {
      case 'pharmacist':
        return 'Pharmacist';
      case 'hospital_admin':
        return 'Hospital Admin';
      case 'natpharm_officer':
        return 'NatPharm Officer';
      case 'natpharm_admin':
        return 'NatPharm Admin';
      case 'ministry_viewer':
        return 'Ministry Viewer';
      default:
        return 'Unknown';
    }
  }
}
