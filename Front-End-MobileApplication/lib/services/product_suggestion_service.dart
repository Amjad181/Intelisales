import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../data/sample_data.dart';

/// منتج مقترح على الزبون بناءً على محتوى الفاتورة الحالية.
class ProductSuggestion {
  final String productId;
  final String name;
  final String nameAr;
  final double price;
  final IconData icon;
  final String reason; // frequently_bought_together | customer_history | category_match

  const ProductSuggestion({
    required this.productId,
    required this.name,
    required this.nameAr,
    required this.price,
    required this.icon,
    required this.reason,
  });
}

/// خدمة اقتراح المنتجات — تتصل بـ endpoint الباك اند حسب العقد المتفق عليه:
/// GET /api/products/suggestions?cartItems=1,5,9&customerId=42&limit=5
/// إلى أن يجهّز الباك اند، تُستخدم قاعدة محلية بسيطة (fallback) فتبقى الواجهة
/// تعمل وتُختبر الآن، وتتحول تلقائياً لبيانات حقيقية بمجرد تفعيل الرابط.
class ProductSuggestionService {
  // TODO: استبدل هذا برابط الباك اند الفعلي من زميلك عند جاهزيته
  static const String _baseUrl = 'https://YOUR_BACKEND_URL';

  static Future<List<ProductSuggestion>> fetch({
    required List<InvoiceItem> cartItems,
    String? customerId,
    int limit = 5,
  }) async {
    if (cartItems.isEmpty) return [];

    final productIds = cartItems
        .map((i) => i.productId)
        .whereType<String>()
        .toSet()
        .toList();

    // نستدعي الباك اند فقط لو عندنا معرّفات منتجات حقيقية لإرسالها بالعقد
    // المتفق عليه؛ صنف من الصوت بدون تطابق بالكتالوج يبقى بدون productId.
    if (productIds.isNotEmpty) {
      try {
        final uri = Uri.parse('$_baseUrl/api/products/suggestions').replace(
          queryParameters: {
            'cartItems': productIds.join(','),
            if (customerId != null) 'customerId': customerId,
            'limit': '$limit',
          },
        );
        final res = await http.get(uri).timeout(const Duration(seconds: 6));
        if (res.statusCode == 200) {
          final data = json.decode(res.body) as Map<String, dynamic>;
          final raw = (data['suggestions'] as List?) ?? [];
          final result = raw
              .map((e) => _fromJson(e as Map<String, dynamic>))
              .whereType<ProductSuggestion>()
              .toList();
          if (result.isNotEmpty) return result;
        }
      } catch (_) {
        // الباك اند غير متاح بعد (أو بدون إنترنت) — نعتمد على fallback المحلي
      }
    }

    return _localFallback(cartItems, productIds, limit);
  }

  /// يبني اقتراحاً من استجابة الباك اند: يقرأ productId + reason من الشبكة،
  /// ويكمّل بيانات العرض (الاسم، السعر، الأيقونة) من الكتالوج المحلي كي يبقى
  /// مصدر الحقيقة لعرض المنتج واحداً.
  static ProductSuggestion? _fromJson(Map<String, dynamic> json) {
    final id = json['productId']?.toString();
    if (id == null) return null;
    final product = sampleProducts.where((p) => p.id == id).cast<Product?>().firstWhere(
          (p) => p != null,
          orElse: () => null,
        );
    if (product == null) return null;
    return ProductSuggestion(
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: product.price,
      icon: product.icon,
      reason: (json['reason'] as String?) ?? 'frequently_bought_together',
    );
  }

  static List<ProductSuggestion> _localFallback(
    List<InvoiceItem> cartItems,
    List<String> cartProductIds,
    int limit,
  ) {
    // نستثني بالاسم أيضاً وليس فقط بالمعرّف، لأن أصناف الصوت غير المطابقة
    // للكتالوج لا تحمل productId لكنها موجودة بالفاتورة فعلياً.
    final cartNames = cartItems.map((i) => i.nameAr).toSet();
    return sampleProducts
        .where((p) => !cartProductIds.contains(p.id) && !cartNames.contains(p.nameAr))
        .take(limit)
        .map((p) => ProductSuggestion(
              productId: p.id,
              name: p.name,
              nameAr: p.nameAr,
              price: p.price,
              icon: p.icon,
              reason: 'category_match',
            ))
        .toList();
  }
}
