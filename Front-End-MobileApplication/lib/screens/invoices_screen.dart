import 'dart:async';
import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../utils/currency.dart';
import '../services/api_client.dart';
import '../services/invoice_service.dart';
import '../widgets/demo_data_banner.dart';
import '../widgets/error_retry_view.dart';
import 'invoice_pdf_screen.dart';
import 'new_invoice_flow.dart';

class InvoicesScreen extends StatefulWidget {
  final String? initialFilter;

  const InvoicesScreen({super.key, this.initialFilter});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  late String _filter = widget.initialFilter ?? 'ALL';
  bool _searching = false;
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  int _requestSeq = 0;

  bool _loading = true;
  String? _error;
  bool _usingDemoData = false;
  List<Invoice> _invoices = const [];

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  /// بحث الفواتير خادمي حسب الخطة (رقم الفاتورة/اسم العميل) مع debounce.
  void _onQueryChanged(String value) {
    _debounce?.cancel();
    final query = value.trim();
    if (query.isNotEmpty && query.length < 2) return;
    _debounce = Timer(const Duration(milliseconds: 350), _refresh);
  }

  /// تحويل شريحة الفلتر الحالية إلى معاملات العقد:
  /// المسودات/المرسلة عبر invoiceStatus، والمعلقة عبر paymentStatus.
  (String?, String?) get _filterParams => switch (_filter) {
    'DRAFTS' => ('DRAFT', null),
    'SENT' => ('SENT', null),
    'OVERDUE' => (null, 'PENDING'),
    _ => (null, null),
  };

  Future<void> _refresh() async {
    final seq = ++_requestSeq;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final (invoiceStatus, paymentStatus) = _filterParams;
      final result = await InvoiceService.list(
        page: 1,
        search: _searchCtrl.text.trim(),
        invoiceStatus: invoiceStatus,
        paymentStatus: paymentStatus,
      );
      if (!mounted || seq != _requestSeq) return; // تجاهل استجابة قديمة
      setState(() {
        _invoices = result.items;
        _usingDemoData = false;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted || seq != _requestSeq) return;
      setState(() {
        if (ApiConfig.demoMode) {
          _invoices = sampleInvoices;
          _usingDemoData = true;
        } else {
          _invoices = const [];
          _error = e.message;
        }
        _loading = false;
      });
    }
  }

  Future<void> _confirmInvoice(
    BuildContext context,
    Invoice invoice,
    bool ar,
  ) async {
    try {
      await InvoiceService.confirm(invoice.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ar ? 'تم تأكيد الفاتورة' : 'Invoice confirmed'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      await _refresh();
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _openInvoice(BuildContext context, Invoice invoice) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => InvoicePdfScreen(
          items: invoice.items,
          invoiceId: invoice.id.isNotEmpty ? invoice.id : null,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    // الفلترة والبحث خادميان بالكامل (_refresh) — لا فلترة محلية.
    final filtered = _invoices;

    final chips = ar
        ? [
            ('الكل', 'ALL'),
            ('مسودات', 'DRAFTS'),
            ('مرسلة', 'SENT'),
            ('معلقة', 'OVERDUE'),
          ]
        : [
            ('All', 'ALL'),
            ('Drafts', 'DRAFTS'),
            ('Sent', 'SENT'),
            ('Pending', 'OVERDUE'),
          ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: _searching
            ? TextField(
                controller: _searchCtrl,
                autofocus: true,
                textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
                onChanged: _onQueryChanged,
                decoration: InputDecoration(
                  hintText: ar ? 'ابحث في الفواتير...' : 'Search invoices...',
                  border: InputBorder.none,
                ),
              )
            : Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: AppColors.surfaceContainerHigh,
                    child: const Icon(
                      Icons.person,
                      size: 18,
                      color: AppColors.secondary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    ar ? 'إنتيلي سيلز' : 'IntelliSales',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
        actions: [
          IconButton(
            icon: Icon(
              _searching ? Icons.close : Icons.search,
              color: AppColors.primary,
            ),
            onPressed: () {
              setState(() {
                if (_searching) {
                  _searching = false;
                  _searchCtrl.clear();
                } else {
                  _searching = true;
                }
              });
              if (!_searching) _refresh();
            },
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: chips.map((chip) {
                  final isSelected = _filter == chip.$2;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _filter = chip.$2);
                        _refresh();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.surfaceContainerLowest,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.outlineVariant,
                          ),
                        ),
                        child: Text(
                          chip.$1,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isSelected
                                ? Colors.white
                                : AppColors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Section header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              ar ? 'الفواتير الأخيرة' : 'Recent Invoices',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.onSurface,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Invoice list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorRetryView(message: _error!, ar: ar, onRetry: _refresh)
                : filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.receipt_long_outlined,
                          size: 48,
                          color: AppColors.outlineVariant,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          ar ? 'لا توجد فواتير' : 'No invoices found',
                          style: const TextStyle(
                            color: AppColors.onSurfaceVariant,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _refresh,
                    child: ListView(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      children: [
                        if (_usingDemoData) DemoDataBanner(ar: ar),
                        for (final invoice in filtered)
                          _InvoiceCard(
                            invoice: invoice,
                            ar: ar,
                            onTap: () => _openInvoice(context, invoice),
                            onAction: invoice.status == 'DRAFT'
                                ? () => _confirmInvoice(context, invoice, ar)
                                : () => _openInvoice(context, invoice),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => startNewInvoiceFlow(context, ar),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add, size: 28),
      ),
    );
  }
}

// ── Invoice Card ──────────────────────────────────────────────────────────────

class _InvoiceCard extends StatelessWidget {
  final Invoice invoice;
  final bool ar;
  final VoidCallback onTap;
  final VoidCallback onAction;
  const _InvoiceCard({
    required this.invoice,
    required this.ar,
    required this.onTap,
    required this.onAction,
  });

  (Color bg, Color fg) get _statusColors => switch (invoice.status) {
    'PAID' => (
      AppColors.tertiaryContainer.withValues(alpha: 0.2),
      AppColors.tertiary,
    ),
    'OVERDUE' => (
      AppColors.errorContainer.withValues(alpha: 0.7),
      AppColors.error,
    ),
    'SENT' => (
      AppColors.secondaryContainer.withValues(alpha: 0.4),
      AppColors.secondary,
    ),
    'DRAFT' => (AppColors.surfaceContainerHigh, AppColors.onSurfaceVariant),
    _ => (AppColors.surfaceContainer, AppColors.onSurfaceVariant),
  };

  String _statusLabel(bool ar) => switch (invoice.status) {
    'PAID' => ar ? 'مدفوعة' : 'PAID',
    'OVERDUE' => ar ? 'معلقة' : 'PENDING',
    'SENT' => ar ? 'مرسلة' : 'SENT',
    'DRAFT' => ar ? 'مسودة' : 'DRAFT',
    _ => invoice.status,
  };

  String _actionLabel(bool ar) => switch (invoice.status) {
    'DRAFT' => ar ? 'تعديل المسودة' : 'Edit Draft',
    _ => ar ? 'عرض التفاصيل' : 'View Details',
  };

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.outlineVariant.withValues(alpha: 0.4),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ID + Status badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: ar
                  ? [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: colors.$1,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _statusLabel(ar),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: colors.$2,
                          ),
                        ),
                      ),
                      Text(
                        '#${invoice.id}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ]
                  : [
                      Text(
                        '#${invoice.id}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: colors.$1,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _statusLabel(ar),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: colors.$2,
                          ),
                        ),
                      ),
                    ],
            ),
            const SizedBox(height: 6),

            // Customer name
            Text(
              ar ? invoice.customerAr : invoice.customer,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              ar ? invoice.dateAr : invoice.date,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 10),

            // Amount + action
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  formatSYP(invoice.amount, ar),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
                TextButton.icon(
                  onPressed: onAction,
                  icon: invoice.status == 'DRAFT'
                      ? const Icon(Icons.edit_outlined, size: 16)
                      : const Icon(Icons.chevron_right, size: 18),
                  label: Text(
                    _actionLabel(ar),
                    style: const TextStyle(fontSize: 13),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
