import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/data/sample_data.dart';
import 'package:flutter_application_1/services/voice_invoice_service.dart';

const _catalog = [
  Product(
    id: 'p-1',
    name: 'Safety Helmet',
    nameAr: 'خوذة أمان',
    price: 50,
    icon: Icons.engineering_outlined,
  ),
  Product(
    id: 'p-2',
    name: 'Fire Extinguisher',
    nameAr: 'طفاية حريق',
    price: 80,
    icon: Icons.local_fire_department_outlined,
  ),
];

void main() {
  group('VoiceInvoiceService.parseItems (local, no external service)', () {
    test('matches Arabic word quantities against backend catalog products', () {
      final result = VoiceInvoiceService.parseItems(
        'ثلاثة خوذة أمان و طفاية حريق',
        catalog: _catalog,
      );
      expect(result.items, hasLength(2));
      expect(result.items[0].productId, 'p-1');
      expect(result.items[0].qty, 3);
      expect(result.items[1].productId, 'p-2');
      expect(result.items[1].qty, 1);
      expect(result.unmatched, isEmpty);
    });

    test('parses digit quantities including eastern Arabic numerals', () {
      final result = VoiceInvoiceService.parseItems(
        'أضف ٥ خوذة أمان',
        catalog: _catalog,
      );
      expect(result.items.single.qty, 5);
      expect(result.items.single.productId, 'p-1');
    });

    test('unmatched phrases are reported, never auto-added', () {
      final result = VoiceInvoiceService.parseItems(
        'خمس شاشات عرض',
        catalog: _catalog,
      );
      expect(result.items, isEmpty);
      expect(result.unmatched, hasLength(1));
    });

    test('uses the catalog price so no client-side pricing is invented', () {
      final result = VoiceInvoiceService.parseItems(
        'طفاية حريق',
        catalog: _catalog,
      );
      expect(result.items.single.unitPrice, 80);
    });
  });
}
