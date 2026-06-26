import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/stock_model.dart';
import '../models/stock_movement_model.dart';
import '../models/consignment_model.dart';

class OfflineDbService {
  static Database? _database;
  static final OfflineDbService instance = OfflineDbService._init();

  OfflineDbService._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'healthbridge_offline.db');

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createTables,
      onUpgrade: _upgradeTables,
      onConfigure: (db) async {
        await db.execute('PRAGMA journal_mode=WAL');
        await db.execute('PRAGMA foreign_keys=ON');
      },
    );
  }

  Future<void> _createTables(Database db, int version) async {
    await db.execute('''
      CREATE TABLE cached_stock (
        id TEXT PRIMARY KEY,
        facilityId TEXT NOT NULL,
        medicineName TEXT NOT NULL,
        batchNumber TEXT NOT NULL,
        currentQuantity INTEGER NOT NULL,
        minimumThreshold INTEGER NOT NULL,
        reorderPoint INTEGER NOT NULL,
        expiryDate TEXT NOT NULL,
        lastUpdated TEXT NOT NULL,
        daysUntilExpiry INTEGER,
        isLowStock INTEGER DEFAULT 0,
        needsReorder INTEGER DEFAULT 0,
        cachedAt TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE pending_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consignmentId TEXT,
        facilityId TEXT NOT NULL,
        medicineName TEXT NOT NULL,
        batchNumber TEXT NOT NULL,
        action TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        performedBy TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        notes TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        retryCount INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE cached_consignments (
        id TEXT PRIMARY KEY,
        medicineName TEXT NOT NULL,
        batchNumber TEXT NOT NULL,
        expiryDate TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        sourceWarehouse TEXT NOT NULL,
        destinationFacility TEXT NOT NULL,
        status TEXT NOT NULL,
        receivedBy TEXT,
        receivedTimestamp TEXT,
        dispatchedTimestamp TEXT,
        qrCodeUrl TEXT,
        cachedAt TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE pending_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qrData TEXT NOT NULL,
        gpsLatitude REAL,
        gpsLongitude REAL,
        facilityId TEXT,
        scannedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'pending',
        retryCount INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityType TEXT NOT NULL,
        entityId TEXT,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        errorMessage TEXT,
        timestamp TEXT NOT NULL
      )
    ''');

    await db.execute('CREATE INDEX idx_stock_facility ON cached_stock(facilityId)');
    await db.execute('CREATE INDEX idx_stock_low ON cached_stock(isLowStock)');
    await db.execute('CREATE INDEX idx_pending_sync ON pending_movements(syncStatus)');
  }

  Future<void> _upgradeTables(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('CREATE INDEX IF NOT EXISTS idx_pending_sync ON pending_movements(syncStatus)');
    }
  }

  // Cached Stock Operations
  Future<void> cacheStock(List<StockModel> stockList) async {
    final db = await database;
    final batch = db.batch();

    for (final stock in stockList) {
      batch.insert(
        'cached_stock',
        {
          ...stock.toMap(),
          'cachedAt': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
  }

  Future<List<StockModel>> getCachedStock({String? facilityId}) async {
    final db = await database;

    String? where;
    List<dynamic>? whereArgs;

    if (facilityId != null) {
      where = 'facilityId = ?';
      whereArgs = [facilityId];
    }

    final maps = await db.query(
      'cached_stock',
      where: where,
      whereArgs: whereArgs,
      orderBy: 'medicineName ASC',
    );

    return maps.map((map) => StockModel.fromMap(map)).toList();
  }

  Future<List<StockModel>> getCachedLowStock({String? facilityId}) async {
    final db = await database;

    String? where = 'isLowStock = 1';
    List<dynamic>? whereArgs;

    if (facilityId != null) {
      where = 'isLowStock = 1 AND facilityId = ?';
      whereArgs = [facilityId];
    }

    final maps = await db.query(
      'cached_stock',
      where: where,
      whereArgs: whereArgs,
      orderBy: 'currentQuantity ASC',
    );

    return maps.map((map) => StockModel.fromMap(map)).toList();
  }

  Future<void> clearStockCache() async {
    final db = await database;
    await db.delete('cached_stock');
  }

  // Pending Movement Operations
  Future<int> addPendingMovement(StockMovementModel movement) async {
    final db = await database;
    return await db.insert('pending_movements', {
      'consignmentId': movement.consignmentId,
      'facilityId': movement.facilityId,
      'medicineName': movement.medicineName,
      'batchNumber': movement.batchNumber,
      'action': movement.action,
      'quantity': movement.quantity,
      'performedBy': movement.performedBy,
      'timestamp': movement.timestamp.toIso8601String(),
      'notes': movement.notes,
      'syncStatus': 'pending',
      'createdAt': DateTime.now().toIso8601String(),
      'retryCount': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingMovements() async {
    final db = await database;
    return await db.query(
      'pending_movements',
      where: 'syncStatus = ?',
      whereArgs: ['pending'],
      orderBy: 'createdAt ASC',
    );
  }

  Future<void> markMovementSynced(int movementId) async {
    final db = await database;
    await db.update(
      'pending_movements',
      {'syncStatus': 'synced'},
      where: 'id = ?',
      whereArgs: [movementId],
    );
  }

  Future<void> incrementMovementRetry(int movementId) async {
    final db = await database;
    await db.rawUpdate(
      'UPDATE pending_movements SET retryCount = retryCount + 1 WHERE id = ?',
      [movementId],
    );
  }

  Future<void> markMovementFailed(int movementId, String error) async {
    final db = await database;
    await db.update(
      'pending_movements',
      {
        'syncStatus': 'failed',
        'notes': 'Error: $error',
      },
      where: 'id = ?',
      whereArgs: [movementId],
    );
  }

  // Pending Scan Operations
  Future<int> addPendingScan({
    required String qrData,
    double? gpsLatitude,
    double? gpsLongitude,
    String? facilityId,
  }) async {
    final db = await database;
    return await db.insert('pending_scans', {
      'qrData': qrData,
      'gpsLatitude': gpsLatitude,
      'gpsLongitude': gpsLongitude,
      'facilityId': facilityId,
      'scannedAt': DateTime.now().toIso8601String(),
      'syncStatus': 'pending',
      'retryCount': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingScans() async {
    final db = await database;
    return await db.query(
      'pending_scans',
      where: 'syncStatus = ?',
      whereArgs: ['pending'],
      orderBy: 'scannedAt ASC',
    );
  }

  Future<void> markScanSynced(int scanId) async {
    final db = await database;
    await db.update(
      'pending_scans',
      {'syncStatus': 'synced'},
      where: 'id = ?',
      whereArgs: [scanId],
    );
  }

  // Consignment Cache
  Future<void> cacheConsignments(List<ConsignmentModel> consignments) async {
    final db = await database;
    final batch = db.batch();

    for (final consignment in consignments) {
      batch.insert(
        'cached_consignments',
        {
          'id': consignment.id,
          'medicineName': consignment.medicineName,
          'batchNumber': consignment.batchNumber,
          'expiryDate': consignment.expiryDate.toIso8601String(),
          'quantity': consignment.quantity,
          'sourceWarehouse': consignment.sourceWarehouse,
          'destinationFacility': consignment.destinationFacility,
          'status': consignment.status,
          'receivedBy': consignment.receivedBy,
          'receivedTimestamp': consignment.receivedTimestamp?.toIso8601String(),
          'dispatchedTimestamp': consignment.dispatchedTimestamp?.toIso8601String(),
          'qrCodeUrl': consignment.qrCodeUrl,
          'cachedAt': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
  }

  Future<List<ConsignmentModel>> getCachedConsignments({String? status}) async {
    final db = await database;

    String? where;
    List<dynamic>? whereArgs;

    if (status != null) {
      where = 'status = ?';
      whereArgs = [status];
    }

    final maps = await db.query(
      'cached_consignments',
      where: where,
      whereArgs: whereArgs,
      orderBy: 'receivedTimestamp DESC',
    );

    return maps.map((map) => ConsignmentModel.fromJson(map)).toList();
  }

  // Sync Status
  Future<int> getPendingCount() async {
    final db = await database;
    final movementResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM pending_movements WHERE syncStatus = ?',
      ['pending'],
    );
    final scanResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM pending_scans WHERE syncStatus = ?',
      ['pending'],
    );

    final movementCount = movementResult.first['count'] as int? ?? 0;
    final scanCount = scanResult.first['count'] as int? ?? 0;

    return movementCount + scanCount;
  }

  Future<Map<String, int>> getSyncStats() async {
    final db = await database;

    final pendingMovements = await db.rawQuery(
      'SELECT COUNT(*) as count FROM pending_movements WHERE syncStatus = ?',
      ['pending'],
    );
    final failedMovements = await db.rawQuery(
      'SELECT COUNT(*) as count FROM pending_movements WHERE syncStatus = ?',
      ['failed'],
    );
    final pendingScans = await db.rawQuery(
      'SELECT COUNT(*) as count FROM pending_scans WHERE syncStatus = ?',
      ['pending'],
    );

    return {
      'pendingMovements': pendingMovements.first['count'] as int? ?? 0,
      'failedMovements': failedMovements.first['count'] as int? ?? 0,
      'pendingScans': pendingScans.first['count'] as int? ?? 0,
    };
  }

  Future<void> clearOldData(int retentionDays) async {
    final db = await database;
    final cutoff = DateTime.now()
        .subtract(Duration(days: retentionDays))
        .toIso8601String();

    await db.delete('cached_stock', where: 'cachedAt < ?', whereArgs: [cutoff]);
    await db.delete('cached_consignments', where: 'cachedAt < ?', whereArgs: [cutoff]);
    await db.delete('sync_log', where: 'timestamp < ?', whereArgs: [cutoff]);

    // Delete synced movements older than retention
    await db.delete(
      'pending_movements',
      where: 'syncStatus = ? AND createdAt < ?',
      whereArgs: ['synced', cutoff],
    );
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
  }
}
