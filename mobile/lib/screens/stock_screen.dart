import 'package:flutter/material.dart';
import '../models/stock_model.dart';
import '../services/api_service.dart';
import '../services/offline_db_service.dart';
import '../services/sync_service.dart';
import '../services/auth_service.dart';

class StockScreen extends StatefulWidget {
  const StockScreen({Key? key}) : super(key: key);

  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  final ApiService _apiService = ApiService();
  final OfflineDbService _offlineDb = OfflineDbService.instance;
  final SyncService _syncService = SyncService.instance;

  List<StockModel> _stockList = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';
  String _filterOption = 'all';
  bool _isOnline = true;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _isOnline = _syncService.isOnline;
    _loadStock();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadStock() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      List<StockModel> stock;

      if (_isOnline) {
        stock = await _apiService.getFacilityStock(
          facilityId: AuthService().currentUser?.facilityId,
        );
        await _offlineDb.cacheStock(stock);
      } else {
        stock = await _offlineDb.getCachedStock(
          facilityId: AuthService().currentUser?.facilityId,
        );
      }

      setState(() => _stockList = stock);
    } catch (e) {
      try {
        final cached = await _offlineDb.getCachedStock(
          facilityId: AuthService().currentUser?.facilityId,
        );
        setState(() {
          _stockList = cached;
          _error = 'Showing cached data. Connect to refresh.';
        });
      } catch (cacheError) {
        setState(() => _error = 'Failed to load stock data');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<StockModel> get _filteredStock {
    var list = _stockList;

    switch (_filterOption) {
      case 'low':
        list = list.where((s) => s.isLowStock).toList();
        break;
      case 'expiring':
        list = list.where((s) => s.isExpiringSoon).toList();
        break;
      case 'reorder':
        list = list.where((s) => s.needsReorder).toList();
        break;
    }

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      list = list
          .where((s) =>
              s.medicineName.toLowerCase().contains(query) ||
              s.batchNumber.toLowerCase().contains(query))
          .toList();
    }

    list.sort((a, b) => a.currentQuantity.compareTo(b.currentQuantity));
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A365D),
        foregroundColor: Colors.white,
        title: const Text('Stock Levels'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStock,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Color(0x08000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search medicines...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF7FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All',
                        active: _filterOption == 'all',
                        onTap: () => setState(() => _filterOption = 'all'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Low Stock',
                        active: _filterOption == 'low',
                        onTap: () => setState(() => _filterOption = 'low'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Expiring Soon',
                        active: _filterOption == 'expiring',
                        onTap: () => setState(() => _filterOption = 'expiring'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Needs Reorder',
                        active: _filterOption == 'reorder',
                        onTap: () => setState(() => _filterOption = 'reorder'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Error Banner
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: const Color(0xFFFFF3CD),
              child: Row(
                children: [
                  const Icon(Icons.info_outline,
                      size: 16, color: Color(0xFF856404)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(
                          color: Color(0xFF856404), fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),

          // Stock Summary
          if (!_isLoading && _stockList.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _SummaryStat(
                    label: 'Total Items',
                    value: '${_stockList.length}',
                    color: const Color(0xFF2B6CB0),
                  ),
                  const SizedBox(width: 12),
                  _SummaryStat(
                    label: 'Low Stock',
                    value: '${_stockList.where((s) => s.isLowStock).length}',
                    color: const Color(0xFFE53E3E),
                  ),
                  const SizedBox(width: 12),
                  _SummaryStat(
                    label: 'Expiring',
                    value:
                        '${_stockList.where((s) => s.isExpiringSoon).length}',
                    color: const Color(0xFFD69E2E),
                  ),
                ],
              ),
            ),

          // Stock List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredStock.isEmpty
                    ? const Center(
                        child: Text(
                          'No stock records found',
                          style: TextStyle(color: Color(0xFFA0AEC0)),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadStock,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filteredStock.length,
                          itemBuilder: (context, index) {
                            return _StockItemCard(
                              stock: _filteredStock[index],
                              onTap: () {
                                Navigator.of(context).pushNamed(
                                  '/stock/detail',
                                  arguments: _filteredStock[index],
                                );
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF1A365D) : const Color(0xFFEDF2F7),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : const Color(0xFF4A5568),
            fontWeight: active ? FontWeight.w600 : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _SummaryStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryStat({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF718096),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StockItemCard extends StatelessWidget {
  final StockModel stock;
  final VoidCallback onTap;

  const _StockItemCard({required this.stock, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final Color statusColor;
    if (stock.currentQuantity <= 0) {
      statusColor = const Color(0xFFE53E3E);
    } else if (stock.isLowStock) {
      statusColor = const Color(0xFFDD6B20);
    } else if (stock.needsReorder) {
      statusColor = const Color(0xFFD69E2E);
    } else {
      statusColor = const Color(0xFF38A169);
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Stock indicator bar
              Container(
                width: 4,
                height: 48,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stock.medicineName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: Color(0xFF1A202C),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Batch: ${stock.batchNumber}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF718096),
                      ),
                    ),
                    if (stock.daysUntilExpiry != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        stock.isExpired
                            ? 'EXPIRED'
                            : 'Expires in ${stock.daysUntilExpiry} days',
                        style: TextStyle(
                          fontSize: 12,
                          color: stock.isExpired
                              ? const Color(0xFFE53E3E)
                              : stock.isExpiringSoon
                                  ? const Color(0xFFD69E2E)
                                  : const Color(0xFF718096),
                          fontWeight: stock.isExpired || stock.isExpiringSoon
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // Quantity
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${stock.currentQuantity}',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                  Text(
                    stock.stockStatusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      color: statusColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
