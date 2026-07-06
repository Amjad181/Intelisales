import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../utils/currency.dart';
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
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Invoice> _filtered() {
    var result = _filter == 'ALL'
        ? sampleInvoices
        : sampleInvoices.where((inv) {
            return switch (_filter) {
              'DRAFTS' => inv.status == 'DRAFT',
              'SENT' => inv.status == 'SENT',
              'OVERDUE' => inv.status == 'OVERDUE',
              _ => true,
            };
          }).toList();
    if (_query.isNotEmpty) {
      final q = _query.toLowerCase();
      result = result
          .where((inv) =>
              inv.customer.toLowerCase().contains(q) ||
              inv.customerAr.contains(_query) ||
              inv.id.toLowerCase().contains(q))
          .toList();
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final filtered = _filtered();

    final chips = ar
        ? [('الكل', 'ALL'), ('مسودات', 'DRAFTS'), ('مرسلة', 'SENT'), ('معلقة', 'OVERDUE')]
        : [('All', 'ALL'), ('Drafts', 'DRAFTS'), ('Sent', 'SENT'), ('Pending', 'OVERDUE')];

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
                onChanged: (v) => setState(() => _query = v),
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
                    child: const Icon(Icons.person, size: 18, color: AppColors.secondary),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    ar ? 'إنتيلي سيلز' : 'IntelliSales',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 17,
                        color: AppColors.primary),
                  ),
                ],
              ),
        actions: [
          IconButton(
            icon: Icon(_searching ? Icons.close : Icons.search,
                color: AppColors.primary),
            onPressed: () => setState(() {
              if (_searching) {
                _searching = false;
                _searchCtrl.clear();
                _query = '';
              } else {
                _searching = true;
              }
            }),
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
                      onTap: () => setState(() => _filter = chip.$2),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 10),
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
                  color: AppColors.onSurface),
            ),
          ),
          const SizedBox(height: 12),

          // Invoice list
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            size: 48, color: AppColors.outlineVariant),
                        const SizedBox(height: 12),
                        Text(
                          ar ? 'لا توجد فواتير' : 'No invoices found',
                          style: const TextStyle(
                              color: AppColors.onSurfaceVariant, fontSize: 15),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) =>
                        _InvoiceCard(invoice: filtered[i], ar: ar),
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
  const _InvoiceCard({required this.invoice, required this.ar});

  (Color bg, Color fg) get _statusColors => switch (invoice.status) {
        'PAID' => (AppColors.tertiaryContainer.withValues(alpha: 0.2), AppColors.tertiary),
        'OVERDUE' => (AppColors.errorContainer.withValues(alpha: 0.7), AppColors.error),
        'SENT' => (AppColors.secondaryContainer.withValues(alpha: 0.4), AppColors.secondary),
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
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const InvoicePdfScreen(items: [])),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: AppColors.outlineVariant.withValues(alpha: 0.4)),
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
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: colors.$1,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(_statusLabel(ar),
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: colors.$2)),
                      ),
                      Text(
                        '#${invoice.id}',
                        style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600),
                      ),
                    ]
                  : [
                      Text(
                        '#${invoice.id}',
                        style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: colors.$1,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(_statusLabel(ar),
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: colors.$2)),
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
                  color: AppColors.onSurface),
            ),
            const SizedBox(height: 4),
            Text(
              ar ? invoice.dateAr : invoice.date,
              style: const TextStyle(
                  fontSize: 13, color: AppColors.onSurfaceVariant),
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
                      color: AppColors.onSurface),
                ),
                TextButton.icon(
                  onPressed: () {},
                  icon: invoice.status == 'DRAFT'
                      ? const Icon(Icons.edit_outlined, size: 16)
                      : const Icon(Icons.chevron_right, size: 18),
                  label: Text(_actionLabel(ar),
                      style: const TextStyle(fontSize: 13)),
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

