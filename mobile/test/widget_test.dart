import 'package:flutter_test/flutter_test.dart';
import 'package:healthbridge_medtrack/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HealthBridgeMedTrackApp());
    expect(find.byType(HealthBridgeMedTrackApp), findsOneWidget);
  });
}
