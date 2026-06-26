import 'package:flutter/material.dart';
import '../models/stock_movement_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class AdjustmentsScreen extends StatefulWidget {
  const AdjustmentsScreen({Key? key}) : super(key: key);

  @override
  State<AdjustmentsScreen> createState() => _AdjustmentsScreenState();
}

class _AdjustmentsScreenState extends State<AdjustmentsScreen> {
  final ApiService _apiService = ApiService();

  List<StockMovementModel> _movements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMovements();
  }

  Future<void> _loadMovements() async {
    setState(() => _isLoading = true);

    try {
      final movements = await _apiService.getStockMovements(
        facilityId: AuthService().currentUser?.facilityId,
        limit: 50,
      );
      setState(() => _movements = movements);
    } catch (e) {
      setState(() => _movements = []);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A365D),
        foregroundColor: Colors.white,
        title: const Text('Stock Adjustments'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).pushNamed('/adjustments/new'),
        backgroundColor: const Color(0xFF2B6CB0),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Adjustment'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _movements.isEmpty
              ? const Center(
                  child: Text(
                    'No adjustments recorded yet',
                    style: TextStyle(color: Color(0xFFA0AEC0)),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMovements,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    itemCount: _movements.length,
                    itemBuilder: (context, index) {
                      final movement = _movements[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: movement.isAddition
                                      ? const Color(0xFF38A169)
                                          .withOpacity(0.1)
                                      : const Color(0xFFE53E3E)
                                          .withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  movement.isAddition
                                      ? Icons.add_circle_outline
                                      : Icons.remove_circle_outline,
                                  color: movement.isAddition
                                      ? const Color(0xFF38A169)
                                      : const Color(0xFFE53E3E),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      movement.medicineName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${movement.actionDisplayName} - Batch: ${movement.batchNumber}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF718096),
                                      ),
                                    ),
                                    Text(
                                      '${movement.timestamp.day}/${movement.timestamp.month}/${movement.timestamp.year} ${movement.timestamp.hour}:${movement.timestamp.minute.toString().padLeft(2, '0')}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Color(0xFFA0AEC0),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                movement.quantityDisplay,
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: movement.isAddition
                                      ? const Color(0xFF38A169)
                                      : const Color(0xFFE53E3E),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
