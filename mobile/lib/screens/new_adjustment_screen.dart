import 'package:flutter/material.dart';
import '../models/stock_model.dart';
import '../models/stock_movement_model.dart';
import '../services/api_service.dart';
import '../services/offline_db_service.dart';
import '../services/sync_service.dart';
import '../services/auth_service.dart';

class NewAdjustmentScreen extends StatefulWidget {
  const NewAdjustmentScreen({Key? key}) : super(key: key);

  @override
  State<NewAdjustmentScreen> createState() => _NewAdjustmentScreenState();
}

class _NewAdjustmentScreenState extends State<NewAdjustmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _offlineDb = OfflineDbService.instance;
  final _syncService = SyncService.instance;

  final _medicineController = TextEditingController();
  final _batchController = TextEditingController();
  final _quantityController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedAction = 'dispensed';
  bool _isSubmitting = false;
  bool _isOnline = true;

  final List<Map<String, String>> _actions = [
    {'value': 'dispensed', 'label': 'Dispensed'},
    {'value': 'expired', 'label': 'Expired'},
    {'value': 'damaged', 'label': 'Damaged'},
    {'value': 'transferred', 'label': 'Transferred'},
  ];

  @override
  void initState() {
    super.initState();
    _isOnline = _syncService.isOnline;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is StockModel) {
        _medicineController.text = args.medicineName;
        _batchController.text = args.batchNumber;
      }
    });
  }

  @override
  void dispose() {
    _medicineController.dispose();
    _batchController.dispose();
    _quantityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final quantity = int.parse(_quantityController.text.trim());
      final user = AuthService().currentUser;
      if (user == null) throw Exception('Not authenticated');

      if (_isOnline) {
        await _apiService.adjustStock(
          facilityId: user.facilityId,
          medicineName: _medicineController.text.trim(),
          batchNumber: _batchController.text.trim(),
          action: _selectedAction,
          quantity: quantity,
          notes: _notesController.text.trim().isNotEmpty
              ? _notesController.text.trim()
              : null,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$quantity units recorded as $_selectedAction'),
              backgroundColor: const Color(0xFF38A169),
            ),
          );
          Navigator.of(context).pop();
        }
      } else {
        await _offlineDb.addPendingMovement(
          StockMovementModel(
            facilityId: user.facilityId ?? '',
            medicineName: _medicineController.text.trim(),
            batchNumber: _batchController.text.trim(),
            action: _selectedAction,
            quantity: quantity,
            performedBy: user.uid,
            timestamp: DateTime.now(),
            notes: _notesController.text.trim().isNotEmpty
                ? _notesController.text.trim()
                : null,
            isSynced: false,
          ),
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Saved offline. Will sync when connected.'),
              backgroundColor: Color(0xFFD69E2E),
            ),
          );
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: const Color(0xFFE53E3E),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A365D),
        foregroundColor: Colors.white,
        title: const Text('Record Adjustment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              if (!_isOnline)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3CD),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.wifi_off,
                          size: 16, color: Color(0xFF856404)),
                      SizedBox(width: 8),
                      Text(
                        'Offline mode - saved locally until connected',
                        style: TextStyle(
                            color: Color(0xFF856404), fontSize: 13),
                      ),
                    ],
                  ),
                ),

              // Medicine Name
              TextFormField(
                controller: _medicineController,
                decoration: InputDecoration(
                  labelText: 'Medicine Name *',
                  prefixIcon: const Icon(Icons.medication_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              // Batch Number
              TextFormField(
                controller: _batchController,
                decoration: InputDecoration(
                  labelText: 'Batch Number *',
                  prefixIcon: const Icon(Icons.tag),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              // Action
              DropdownButtonFormField<String>(
                initialValue: _selectedAction,
                decoration: InputDecoration(
                  labelText: 'Action *',
                  prefixIcon: const Icon(Icons.swap_horiz),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
                items: _actions.map((a) {
                  return DropdownMenuItem(
                    value: a['value'],
                    child: Text(a['label']!),
                  );
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedAction = v);
                },
              ),
              const SizedBox(height: 16),

              // Quantity
              TextFormField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Quantity *',
                  prefixIcon: const Icon(Icons.numbers),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final n = int.tryParse(v.trim());
                  if (n == null || n <= 0) return 'Enter a positive number';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Notes
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Notes (optional)',
                  prefixIcon: const Padding(
                    padding: EdgeInsets.only(bottom: 48),
                    child: Icon(Icons.notes),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 24),

              // Submit
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2B6CB0),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          'Record Adjustment',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
