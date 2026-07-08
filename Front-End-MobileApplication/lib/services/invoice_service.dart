import 'dart:typed_data';
import '../data/sample_data.dart';
import 'api_client.dart';

/// الفواتير: GET/POST /invoices، GET/PATCH /invoices/:id، confirm/archive/
/// mark-sent/payment، وتحميل PDF الفاتورة. الباك اند يحسب الأسعار
/// والضرائب والمجاميع؛ العميل يرسل فقط المنتجات والكميات — لا يُرسل أي
/// سعر وحدة أو مجموع من التطبيق إطلاقاً.
class InvoiceService {
  /// GET /invoices مع كل معاملات الاستعلام المدعومة في العقد.
  static Future<PagedResult<Invoice>> list({
    int? page,
    int? limit,
    String? search,
    String? invoiceStatus,
    String? paymentStatus,
    String? customerId,
    String? dateFrom,
    String? dateTo,
    String? sortBy,
    String? sortOrder,
  }) async {
    final res = await ApiClient.get(
      '/invoices',
      query: {
        if (page != null) 'page': '$page',
        if (limit != null) 'limit': '$limit',
        if (search != null && search.isNotEmpty) 'search': search,
        if (invoiceStatus != null && invoiceStatus.isNotEmpty)
          'invoiceStatus': invoiceStatus,
        if (paymentStatus != null && paymentStatus.isNotEmpty)
          'paymentStatus': paymentStatus,
        if (customerId != null && customerId.isNotEmpty)
          'customerId': customerId,
        if (dateFrom != null && dateFrom.isNotEmpty) 'dateFrom': dateFrom,
        if (dateTo != null && dateTo.isNotEmpty) 'dateTo': dateTo,
        if (sortBy != null && sortBy.isNotEmpty) 'sortBy': sortBy,
        if (sortOrder != null && sortOrder.isNotEmpty) 'sortOrder': sortOrder,
      },
    );
    return res.pagedList(Invoice.fromApi);
  }

  static Future<Invoice> createDraft({
    required String customerId,
    required List<InvoiceItem> items,
    String discountType = 'NONE',
    double discountValue = 0,
    DateTime? dueDate,
    required String source, // 'MANUAL' | 'VOICE_TEXT'
    String? voiceText,
    String? notes,
  }) async {
    final res = await ApiClient.post(
      '/invoices',
      body: {
        'customerId': customerId,
        'items': items
            .map((i) => {'productId': i.productId, 'quantity': i.qty})
            .toList(),
        'discountType': discountType,
        'discountValue': discountValue,
        'dueDate': ?dueDate?.toIso8601String(),
        'source': source,
        'voiceText': ?voiceText,
        'notes': ?notes,
      },
    );
    return Invoice.fromApi(res.entity('invoice'));
  }

  static Future<Invoice> confirm(String id) async {
    final res = await ApiClient.patch('/invoices/$id/confirm');
    return Invoice.fromApi(res.entity('invoice'));
  }

  static Future<Invoice> archive(String id) async {
    final res = await ApiClient.patch('/invoices/$id/archive');
    return Invoice.fromApi(res.entity('invoice'));
  }

  static Future<Invoice> markSent(String id) async {
    final res = await ApiClient.patch('/invoices/$id/mark-sent');
    return Invoice.fromApi(res.entity('invoice'));
  }

  static Future<Invoice> recordPayment(
    String id, {
    required double amount,
  }) async {
    final res = await ApiClient.patch(
      '/invoices/$id/payment',
      body: {'paidAmount': amount, 'paymentMethod': 'Cash'},
    );
    return Invoice.fromApi(res.entity('invoice'));
  }

  static Future<Uint8List> fetchPdfBytes(String id) =>
      ApiClient.getBytes('/invoices/$id/pdf');
}
