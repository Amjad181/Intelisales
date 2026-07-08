import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/data/sample_data.dart';
import 'package:flutter_application_1/services/dashboard_service.dart';

void main() {
  group('Customer.fromApi', () {
    test('maps backend field names exactly and prefers id over _id', () {
      final c = Customer.fromApi(const {
        'id': 'c-1',
        '_id': 'legacy',
        'name': 'Nour Trading',
        'contactName': 'Ahmad',
        'phone': '0999',
        'status': 'ACTIVE',
        'customerType': 'Retail',
        'paymentType': 'Cash',
        'email': 'x@y.com',
      });
      expect(c.id, 'c-1');
      expect(c.name, 'Nour Trading');
      expect(c.contact, 'Ahmad');
      expect(c.phone1, '0999');
      expect(c.customerType, 'Retail');
    });

    test('falls back to _id only when id is absent', () {
      final c = Customer.fromApi(const {'_id': 'legacy-1', 'name': 'X'});
      expect(c.id, 'legacy-1');
    });
  });

  group('Invoice.fromApi', () {
    test('derives display status and maps item snapshots', () {
      final inv = Invoice.fromApi(const {
        'id': 'inv-1',
        'invoiceStatus': 'DRAFT',
        'paymentStatus': 'PENDING',
        'totalAmount': 150.5,
        'paidAmount': 0,
        'remainingAmount': 150.5,
        'currency': 'SYP',
        'customerSnapshot': {'id': 'c-1', 'name': 'Nour Trading'},
        'items': [
          {
            'productId': 'p-1',
            'productName': 'Helmet',
            'quantity': 3,
            'unitPrice': 50,
          },
        ],
      });
      expect(inv.id, 'inv-1');
      expect(inv.status, 'DRAFT');
      expect(inv.customer, 'Nour Trading');
      expect(inv.totalAmount, 150.5);
      expect(inv.items.single.productId, 'p-1');
      expect(inv.items.single.qty, 3);
    });
  });

  group('Product price-list mapping', () {
    test('fromPriceListItem overrides base price with the item price', () {
      final p = Product.fromPriceListItem(const {
        'price': 42.5,
        'currency': 'SYP',
        'product': {'id': 'p-9', 'name': 'Rack', 'basePrice': 60, 'unit': 'pc'},
      });
      expect(p.id, 'p-9');
      expect(p.price, 42.5);
      expect(p.unit, 'pc');
    });

    test('fromPriceListItem handles flat items without nested product', () {
      final p = Product.fromPriceListItem(const {
        'id': 'p-2',
        'name': 'Vest',
        'price': 25,
      });
      expect(p.id, 'p-2');
      expect(p.price, 25);
    });
  });

  group('DashboardSummary.fromApi (exact contract fields)', () {
    test('parses every documented group without guessed fields', () {
      final s = DashboardSummary.fromApi(const {
        'scope': 'SALES_REPRESENTATIVE',
        'generatedAt': '2026-07-08T10:00:00Z',
        'customers': {
          'total': 12,
          'active': 10,
          'inactive': 2,
          'byType': {'Retail': 8},
        },
        'products': {'total': 40, 'active': 35, 'inactive': 5},
        'invoices': {
          'total': 20,
          'draft': 3,
          'confirmed': 10,
          'archived': 1,
          'sent': 4,
          'paid': 9,
          'pending': 8,
          'totalAmount': 5000,
          'paidAmount': 3000,
          'remainingAmount': 2000,
          'overdueAmount': 500,
          'currency': 'SYP',
        },
        'visits': {
          'total': 15,
          'planned': 5,
          'completed': 8,
          'cancelled': 2,
          'upcoming': 3,
          'overdue': 1,
        },
        'recent': {
          'invoices': [
            {'id': 'inv-1', 'invoiceStatus': 'CONFIRMED', 'totalAmount': 100},
          ],
          'visits': [
            {'id': 'v-1'},
          ],
        },
      });
      expect(s.scope, 'SALES_REPRESENTATIVE');
      expect(s.customers.total, 12);
      expect(s.products.active, 35);
      expect(s.invoices.remainingAmount, 2000);
      expect(s.invoices.currency, 'SYP');
      expect(s.visits.completed, 8);
      expect(s.visits.planned, 5);
      expect(s.recentInvoices.single.id, 'inv-1');
      expect(s.recentVisits, hasLength(1));
    });

    test('missing groups default to zeros instead of crashing', () {
      final s = DashboardSummary.fromApi(const {});
      expect(s.visits.completed, 0);
      expect(s.invoices.total, 0);
      expect(s.recentInvoices, isEmpty);
    });
  });
}
