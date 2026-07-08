import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/services/api_client.dart';

void main() {
  group('ApiResponse extractors', () {
    test('entity() extracts nested single-entity payloads', () {
      const res = ApiResponse(
        success: true,
        message: 'ok',
        data: {
          'customer': {'id': 'c1', 'name': 'Nour Trading'},
        },
      );
      expect(res.entity('customer')['id'], 'c1');
    });

    test(
      'entity() throws a descriptive contract error when key is missing',
      () {
        const res = ApiResponse(
          success: true,
          message: 'ok',
          data: {'id': 'c1'},
        );
        expect(
          () => res.entity('customer'),
          throwsA(
            isA<ApiException>().having(
              (e) => e.message,
              'message',
              contains('data.customer'),
            ),
          ),
        );
      },
    );

    test('entity() throws when data is not a map', () {
      const res = ApiResponse(success: true, message: 'ok', data: [1, 2]);
      expect(() => res.entity('invoice'), throwsA(isA<ApiException>()));
    });

    test('dataAsList() returns the top-level data list', () {
      const res = ApiResponse(
        success: true,
        message: 'ok',
        data: [
          {'id': '1'},
          {'id': '2'},
        ],
      );
      expect(res.dataAsList(), hasLength(2));
    });

    test('dataAsList() returns empty for null data (empty list responses)', () {
      const res = ApiResponse(success: true, message: 'ok');
      expect(res.dataAsList(), isEmpty);
    });

    test('dataAsList() throws when data is a map instead of a list', () {
      const res = ApiResponse(success: true, message: 'ok', data: {'x': 1});
      expect(() => res.dataAsList(), throwsA(isA<ApiException>()));
    });

    test('pagedList() carries top-level pagination and count', () {
      const res = ApiResponse(
        success: true,
        message: 'ok',
        data: [
          {'id': 'a'},
        ],
        count: 1,
        pagination: {'page': 2, 'limit': 20, 'total': 45, 'pages': 3},
      );
      final paged = res.pagedList((json) => json['id'] as String);
      expect(paged.items, ['a']);
      expect(paged.count, 1);
      expect(paged.pagination!.page, 2);
      expect(paged.pagination!.limit, 20);
      expect(paged.pagination!.total, 45);
      expect(paged.pagination!.pages, 3);
    });
  });

  group('Pagination.fromJson', () {
    test('parses all contract fields with safe defaults', () {
      final p = Pagination.fromJson(const {'page': 1, 'limit': 10});
      expect(p.page, 1);
      expect(p.limit, 10);
      expect(p.total, 0);
      expect(p.pages, 1);
    });
  });
}
