import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../data/sample_data.dart';
import 'api_client.dart';

/// منتج مقترح على الزبون بناءً على تاريخ مشترياته من الباك اند.
class ProductSuggestion {
  final String productId;
  final String name;
  final String nameAr;
  final double price;
  final IconData icon;
  final String reason;

  const ProductSuggestion({
    required this.productId,
    required this.name,
    required this.nameAr,
    required this.price,
    required this.icon,
    required this.reason,
  });
}

/// خدمة اقتراح المنتجات — تتصل بـ
/// GET /recommendations/customers/:customerId/products?limit=&includeHistory=true
/// وتقرأ data.recommendations حسب العقد.
///
/// لا يوجد أي fallback محلي صامت في وضع التكامل: فشل الباك اند أو غياب
/// عميل حقيقي يعني ببساطة عدم عرض اقتراحات. الاقتراحات المحلية تعمل فقط
/// في وضع العرض التجريبي الصريح (--dart-define=DEMO_MODE=true).
class ProductSuggestionService {
  static Future<List<ProductSuggestion>> fetch({
    required List<InvoiceItem> cartItems,
    String? customerId,
    int limit = 5,
  }) async {
    if (cartItems.isEmpty) return [];

    final cartProductIds = cartItems
        .map((i) => i.productId)
        .whereType<String>()
        .toSet()
        .toList();

    if (customerId != null && customerId.isNotEmpty) {
      try {
        final res = await ApiClient.get(
          '/recommendations/customers/$customerId/products',
          query: {'limit': '$limit', 'includeHistory': 'true'},
        );
        final raw = (res.dataAsMap()['recommendations'] as List?) ?? [];
        return raw
            .whereType<Map<String, dynamic>>()
            .map(_fromJson)
            .whereType<ProductSuggestion>()
            .where((s) => !cartProductIds.contains(s.productId))
            .take(limit)
            .toList();
      } on ApiException {
        if (!ApiConfig.demoMode) return [];
        // وضع تجريبي صريح فقط — يُسمح بالاقتراحات المحلية أدناه
      }
    }

    if (!ApiConfig.demoMode) return [];
    return _localDemoSuggestions(cartItems, cartProductIds, limit);
  }

  static ProductSuggestion? _fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    final id = product?['id']?.toString();
    final name = product?['name'] as String?;
    if (id == null || name == null) return null;
    return ProductSuggestion(
      productId: id,
      name: name,
      nameAr: name,
      price: ((json['price'] as num?) ?? 0).toDouble(),
      icon: Icons.inventory_2_outlined,
      reason: (json['reason'] as String?) ?? 'customer_history',
    );
  }

  /// اقتراحات محلية للعرض التجريبي الصريح فقط (DEMO_MODE=true).
  static List<ProductSuggestion> _localDemoSuggestions(
    List<InvoiceItem> cartItems,
    List<String> cartProductIds,
    int limit,
  ) {
    final cartNames = cartItems.map((i) => i.nameAr).toSet();
    return sampleProducts
        .where(
          (p) =>
              !cartProductIds.contains(p.id) && !cartNames.contains(p.nameAr),
        )
        .take(limit)
        .map(
          (p) => ProductSuggestion(
            productId: p.id,
            name: p.name,
            nameAr: p.nameAr,
            price: p.price,
            icon: p.icon,
            reason: 'category_match',
          ),
        )
        .toList();
  }
}
