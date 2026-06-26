import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/stock_model.dart';

class StockDetailScreen extends StatelessWidget {
  final StockModel stock;

  const StockDetailScreen({Key? key, required this.stock}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A365D),
        foregroundColor: Colors.white,
        title: Text(stock.medicineName),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stock Status Card
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${stock.currentQuantity} units',
                            style: TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              color: stock.isLowStock
                                  ? const Color(0xFFE53E3E)
                                  : const Color(0xFF1A365D),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            stock.stockStatusLabel,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: stock.isLowStock
                                  ? const Color(0xFFE53E3E)
                                  : const Color(0xFF38A169),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      width: 80,
                      height: 80,
                      child: Stack(
                        children: [
                          PieChart(
                            PieChartData(
                              sections: [
                                PieChartSectionData(
                                  value: stock.currentQuantity.toDouble(),
                                  color: stock.isLowStock
                                      ? const Color(0xFFE53E3E)
                                      : const Color(0xFF38A169),
                                  radius: 40,
                                  showTitle: false,
                                ),
                                PieChartSectionData(
                                  value: Math.max(
                                    0.0,
                                    (stock.minimumThreshold * 2 -
                                            stock.currentQuantity)
                                        .toDouble(),
                                  ) as double,
                                  color: const Color(0xFFE2E8F0),
                                  radius: 40,
                                  showTitle: false,
                                ),
                              ],
                              centerSpaceRadius: 25,
                              sectionsSpace: 2,
                            ),
                          ),
                          Center(
                            child: Text(
                              '${(stock.stockPercentage * 100).toInt()}%',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1A202C),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Details Grid
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Stock Details',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1A202C),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _DetailRow(
                      label: 'Batch Number',
                      value: stock.batchNumber,
                    ),
                    _DetailRow(
                      label: 'Minimum Threshold',
                      value: '${stock.minimumThreshold} units',
                    ),
                    _DetailRow(
                      label: 'Reorder Point',
                      value: '${stock.reorderPoint} units',
                    ),
                    _DetailRow(
                      label: 'Expiry Date',
                      value: '${stock.expiryDate.day}/${stock.expiryDate.month}/${stock.expiryDate.year}',
                      valueColor: stock.isExpired
                          ? const Color(0xFFE53E3E)
                          : stock.isExpiringSoon
                              ? const Color(0xFFD69E2E)
                              : null,
                    ),
                    _DetailRow(
                      label: 'Status',
                      value: stock.stockStatusLabel,
                      valueColor: stock.isLowStock
                          ? const Color(0xFFE53E3E)
                          : const Color(0xFF38A169),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Actions
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).pushNamed(
                    '/adjustments/new',
                    arguments: stock,
                  );
                },
                icon: const Icon(Icons.edit_note),
                label: const Text('Adjust Stock Level'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2B6CB0),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF718096),
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: valueColor ?? const Color(0xFF1A202C),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class Math {
  static num max(num a, num b) => a > b ? a : b;
}
