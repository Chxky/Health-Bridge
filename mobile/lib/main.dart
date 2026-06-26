import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'config/app_config.dart';
import 'config/firebase_options.dart';
import 'config/routes.dart';
import 'services/auth_service.dart';
import 'services/sync_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/scan_screen.dart';
import 'screens/stock_screen.dart';
import 'screens/stock_detail_screen.dart';
import 'screens/adjustments_screen.dart';
import 'screens/new_adjustment_screen.dart';
import 'screens/consignments_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const HealthBridgeMedTrackApp());
}

class HealthBridgeMedTrackApp extends StatefulWidget {
  const HealthBridgeMedTrackApp({Key? key}) : super(key: key);

  @override
  State<HealthBridgeMedTrackApp> createState() => _HealthBridgeMedTrackAppState();
}

class _HealthBridgeMedTrackAppState extends State<HealthBridgeMedTrackApp> {
  final AuthService _authService = AuthService();
  bool _isInitializing = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    await SyncService.instance.initialize();

    final authenticated = await _authService.tryAutoLogin();
    if (mounted) {
      setState(() {
        _isAuthenticated = authenticated;
        _isInitializing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Inter',
        colorScheme: ColorScheme.light(
          primary: const Color(0xFF0E4A27), // MoHCC Deep Green
          secondary: const Color(0xFFD4AF37), // Gold Accent
          surface: const Color(0xFFFFFFFF),
          error: const Color(0xFFE53E3E),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0E4A27),
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        cardTheme: CardThemeData(
          elevation: 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
      initialRoute: _isInitializing
          ? '/'
          : _isAuthenticated
              ? AppRoutes.home
              : AppRoutes.login,
      routes: {
        '/': (context) => _isInitializing
            ? const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              )
            : const LoginScreen(),
        AppRoutes.login: (context) => const LoginScreen(),
        AppRoutes.home: (context) => const HomeScreen(),
        AppRoutes.scan: (context) => const ScanScreen(),
        AppRoutes.stock: (context) => const StockScreen(),
        AppRoutes.stockDetail: (context) {
          final stock = ModalRoute.of(context)?.settings.arguments;
          if (stock == null) return const StockScreen();
          return StockDetailScreen(stock: stock as dynamic);
        },
        AppRoutes.adjustments: (context) => const AdjustmentsScreen(),
        AppRoutes.newAdjustment: (context) => const NewAdjustmentScreen(),
        AppRoutes.consignments: (context) => const ConsignmentsScreen(),
      },
    );
  }
}
