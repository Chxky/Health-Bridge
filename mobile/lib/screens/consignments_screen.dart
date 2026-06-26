import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/consignment_model.dart';
import 'package:intl/intl.dart';

class ConsignmentsScreen extends StatefulWidget {
  const ConsignmentsScreen({Key? key}) : super(key: key);

  @override
  State<ConsignmentsScreen> createState() => _ConsignmentsScreenState();
}

class _ConsignmentsScreenState extends State<ConsignmentsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<ConsignmentModel> _consignments = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConsignments();
  }

  Future<void> _loadConsignments() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      final data = await _apiService.getConsignments();
      setState(() {
        _consignments = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'received':
        return const Color(0xFF38A169); // Green
      case 'dispatched':
      case 'in_transit':
        return const Color(0xFFD69E2E); // Yellow/Orange
      default:
        return const Color(0xFF718096); // Gray
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFC),
      appBar: AppBar(
        title: const Text('Consignments'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadConsignments,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 48),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadConsignments,
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : _consignments.isEmpty
                  ? const Center(
                      child: Text('No consignments found', style: TextStyle(color: Colors.grey)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _consignments.length,
                      itemBuilder: (context, index) {
                        final consignment = _consignments[index];
                        final isDelivered = consignment.status.toLowerCase() == 'delivered';
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        consignment.medicineName,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A202C)),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(consignment.status).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        consignment.status.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _getStatusColor(consignment.status),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.local_shipping_outlined, size: 16, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text('From: ${consignment.sourceWarehouse}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.inventory_2_outlined, size: 16, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text('Qty: ${NumberFormat("#,###").format(consignment.quantity)} units', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Dispatched: ${consignment.dispatchedTimestamp != null ? DateFormat('MMM d, y HH:mm').format(consignment.dispatchedTimestamp!) : 'N/A'}',
                                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                                    ),
                                  ],
                                ),
                                if (isDelivered && consignment.receivedTimestamp != null) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.check_circle_outline, size: 16, color: Colors.green),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Received: ${DateFormat('MMM d, y HH:mm').format(consignment.receivedTimestamp!)}',
                                        style: const TextStyle(color: Colors.green, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ]
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
