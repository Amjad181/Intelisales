import '../data/sample_data.dart';
import 'api_client.dart';

/// ملخص لوحة التحكم من GET /dashboard/summary — يفسّر data.summary
/// بالحقول الدقيقة المحددة في العقد (لا حقول مخمّنة مثل completedToday).
class DashboardCustomersSummary {
  final int total;
  final int active;
  final int inactive;
  final Map<String, dynamic> byType;

  const DashboardCustomersSummary({
    required this.total,
    required this.active,
    required this.inactive,
    this.byType = const {},
  });

  factory DashboardCustomersSummary.fromApi(Map<String, dynamic>? json) =>
      DashboardCustomersSummary(
        total: _asInt(json?['total']),
        active: _asInt(json?['active']),
        inactive: _asInt(json?['inactive']),
        byType: (json?['byType'] as Map<String, dynamic>?) ?? const {},
      );
}

class DashboardProductsSummary {
  final int total;
  final int active;
  final int inactive;

  const DashboardProductsSummary({
    required this.total,
    required this.active,
    required this.inactive,
  });

  factory DashboardProductsSummary.fromApi(Map<String, dynamic>? json) =>
      DashboardProductsSummary(
        total: _asInt(json?['total']),
        active: _asInt(json?['active']),
        inactive: _asInt(json?['inactive']),
      );
}

class DashboardInvoicesSummary {
  final int total;
  final int draft;
  final int confirmed;
  final int archived;
  final int sent;
  final int paid;
  final int pending;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final double overdueAmount;
  final String currency;

  const DashboardInvoicesSummary({
    required this.total,
    required this.draft,
    required this.confirmed,
    required this.archived,
    required this.sent,
    required this.paid,
    required this.pending,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.overdueAmount,
    required this.currency,
  });

  factory DashboardInvoicesSummary.fromApi(Map<String, dynamic>? json) =>
      DashboardInvoicesSummary(
        total: _asInt(json?['total']),
        draft: _asInt(json?['draft']),
        confirmed: _asInt(json?['confirmed']),
        archived: _asInt(json?['archived']),
        sent: _asInt(json?['sent']),
        paid: _asInt(json?['paid']),
        pending: _asInt(json?['pending']),
        totalAmount: _asDouble(json?['totalAmount']),
        paidAmount: _asDouble(json?['paidAmount']),
        remainingAmount: _asDouble(json?['remainingAmount']),
        overdueAmount: _asDouble(json?['overdueAmount']),
        currency: (json?['currency'] as String?) ?? 'SYP',
      );
}

class DashboardVisitsSummary {
  final int total;
  final int planned;
  final int completed;
  final int cancelled;
  final int upcoming;
  final int overdue;

  const DashboardVisitsSummary({
    required this.total,
    required this.planned,
    required this.completed,
    required this.cancelled,
    required this.upcoming,
    required this.overdue,
  });

  factory DashboardVisitsSummary.fromApi(Map<String, dynamic>? json) =>
      DashboardVisitsSummary(
        total: _asInt(json?['total']),
        planned: _asInt(json?['planned']),
        completed: _asInt(json?['completed']),
        cancelled: _asInt(json?['cancelled']),
        upcoming: _asInt(json?['upcoming']),
        overdue: _asInt(json?['overdue']),
      );
}

class DashboardSummary {
  final String scope;
  final String generatedAt;
  final DashboardCustomersSummary customers;
  final DashboardProductsSummary products;
  final DashboardInvoicesSummary invoices;
  final DashboardVisitsSummary visits;
  final List<Invoice> recentInvoices;
  final List<Map<String, dynamic>> recentVisits;

  const DashboardSummary({
    required this.scope,
    required this.generatedAt,
    required this.customers,
    required this.products,
    required this.invoices,
    required this.visits,
    required this.recentInvoices,
    required this.recentVisits,
  });

  factory DashboardSummary.fromApi(Map<String, dynamic> json) {
    final recent = json['recent'] as Map<String, dynamic>?;
    final recentInvoicesRaw = (recent?['invoices'] as List?) ?? const [];
    final recentVisitsRaw = (recent?['visits'] as List?) ?? const [];
    return DashboardSummary(
      scope: (json['scope'] as String?) ?? '',
      generatedAt: (json['generatedAt'] as String?) ?? '',
      customers: DashboardCustomersSummary.fromApi(
        json['customers'] as Map<String, dynamic>?,
      ),
      products: DashboardProductsSummary.fromApi(
        json['products'] as Map<String, dynamic>?,
      ),
      invoices: DashboardInvoicesSummary.fromApi(
        json['invoices'] as Map<String, dynamic>?,
      ),
      visits: DashboardVisitsSummary.fromApi(
        json['visits'] as Map<String, dynamic>?,
      ),
      recentInvoices: recentInvoicesRaw
          .whereType<Map<String, dynamic>>()
          .map(Invoice.fromApi)
          .toList(),
      recentVisits: recentVisitsRaw.whereType<Map<String, dynamic>>().toList(),
    );
  }
}

int _asInt(dynamic v) => (v as num?)?.toInt() ?? 0;
double _asDouble(dynamic v) => (v as num?)?.toDouble() ?? 0;

class DashboardService {
  static Future<DashboardSummary> summary() async {
    final res = await ApiClient.get('/dashboard/summary');
    return DashboardSummary.fromApi(res.entity('summary'));
  }
}
