import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:printing/printing.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../utils/currency.dart';
import '../utils/invoice_pdf_builder.dart';

class InvoicePdfScreen extends StatefulWidget {
  final List<InvoiceItem> items;
  final Customer? customer;
  final VisitInfo? visitInfo;

  const InvoicePdfScreen({
    super.key,
    required this.items,
    this.customer,
    this.visitInfo,
  });

  @override
  State<InvoicePdfScreen> createState() => _InvoicePdfScreenState();
}

class _InvoicePdfScreenState extends State<InvoicePdfScreen> {
  static const double _taxRate = 0.0;
  static const double _discountRate = 0.0;
  bool _saved = false;

  List<InvoiceItem> get items => widget.items;

  double get _subtotal => items.fold(0, (s, i) => s + i.total);
  double get _tax => _subtotal * _taxRate;
  double get _discount => _subtotal * _discountRate;
  double get _total => _subtotal + _tax - _discount;

  void _showSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 2),
    ));
  }

  Future<void> _shareWhatsApp(bool ar) async {
    final text = Uri.encodeComponent(ar
        ? 'فاتورة إنتيلي سيلز - الإجمالي: ${formatSYP(_total, ar)}'
        : 'IntelliSales Invoice - Total: ${formatSYP(_total, ar)}');
    final uri = Uri.parse('https://wa.me/?text=$text');
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      _showSnack(context, ar ? 'تعذر فتح واتساب' : 'Could not open WhatsApp');
    }
  }

  Future<void> _shareTelegram(bool ar) async {
    final text = Uri.encodeComponent(ar
        ? 'فاتورة إنتيلي سيلز - الإجمالي: ${formatSYP(_total, ar)}'
        : 'IntelliSales Invoice - Total: ${formatSYP(_total, ar)}');
    final uri = Uri.parse('https://t.me/share/url?url=&text=$text');
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      _showSnack(context, ar ? 'تعذر فتح تلغرام' : 'Could not open Telegram');
    }
  }

  Future<Uint8List> _generatePdfBytes(bool ar) {
    return buildInvoicePdf(
      items: items,
      ar: ar,
      subtotal: _subtotal,
      tax: _tax,
      discount: _discount,
      total: _total,
    );
  }

  Future<void> _exportPdf(bool ar) async {
    final bytes = await _generatePdfBytes(ar);
    if (!mounted) return;
    await Printing.sharePdf(bytes: bytes, filename: 'invoice_INV-DRAFT.pdf');
  }

  Future<void> _printInvoice(bool ar) async {
    final bytes = await _generatePdfBytes(ar);
    await Printing.layoutPdf(onLayout: (_) async => bytes);
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFE8EEFF),
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.primary),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            ar ? 'معاينة الفاتورة' : 'Invoice Preview',
            style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 17,
                color: AppColors.primary),
          ),
          actions: [
            _saved
                ? PopupMenuButton<String>(
                    icon: const Icon(Icons.share_outlined, color: AppColors.onSurface),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onSelected: (value) {
                      switch (value) {
                        case 'pdf':
                          _exportPdf(ar);
                        case 'whatsapp':
                          _shareWhatsApp(ar);
                        case 'telegram':
                          _shareTelegram(ar);
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'pdf',
                        child: Row(
                          children: [
                            const Icon(Icons.picture_as_pdf_outlined, size: 18, color: AppColors.secondary),
                            const SizedBox(width: 10),
                            Text(ar ? 'تصدير PDF' : 'Export PDF'),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'whatsapp',
                        child: Row(
                          children: [
                            const Icon(Icons.chat_outlined, size: 18, color: AppColors.tertiary),
                            const SizedBox(width: 10),
                            Text(ar ? 'مشاركة على واتساب' : 'Share via WhatsApp'),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'telegram',
                        child: Row(
                          children: [
                            const Icon(Icons.send_outlined, size: 18, color: AppColors.primary),
                            const SizedBox(width: 10),
                            Text(ar ? 'مشاركة تلغرام' : 'Share via Telegram'),
                          ],
                        ),
                      ),
                    ],
                  )
                : IconButton(
                    icon: const Icon(Icons.share_outlined, color: AppColors.onSurfaceVariant),
                    onPressed: () => _showSnack(
                        context,
                        ar
                            ? 'يجب تأكيد وحفظ الفاتورة أولاً'
                            : 'Please confirm and save the invoice first'),
                  ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Status header ─────────────────────────────────────────
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: AppColors.outlineVariant.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  Icon(_saved ? Icons.verified : Icons.edit_document,
                      color: _saved ? AppColors.tertiary : AppColors.primary,
                      size: 22),
                  const SizedBox(width: 10),
                  Text(
                    _saved
                        ? (ar ? 'فاتورة مؤكدة' : 'Confirmed Invoice')
                        : (ar ? 'فاتورة مسودة' : 'Draft Invoice'),
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.onSurface),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: (_saved ? AppColors.tertiary : AppColors.primary)
                          .withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _saved
                          ? (ar ? 'مؤكدة' : 'CONFIRMED')
                          : (ar ? 'مسودة' : 'DRAFT'),
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _saved ? AppColors.tertiary : AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ── Visit info summary ──────────────────────────────────────
            if (widget.visitInfo != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: AppColors.outlineVariant.withValues(alpha: 0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.fact_check_outlined,
                            size: 18, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(ar ? 'معلومات الزيارة' : 'Visit Info',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: AppColors.onSurface)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            widget.visitInfo!.resultLabel(ar),
                            style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                    if (widget.visitInfo!.notes.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        widget.visitInfo!.notes,
                        style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.onSurfaceVariant,
                            height: 1.4),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Invoice document ──────────────────────────────────────
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Company header
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.insights,
                              color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('IntelliSales',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 18,
                                      color: AppColors.primary)),
                              Text(
                                ar
                                    ? 'حلول المبيعات الميدانية الذكية\nدمشق، سوريا'
                                    : 'Smart Field Sales Solutions\nDamascus, Syria',
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.onSurfaceVariant,
                                    height: 1.4),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('INVOICE',
                                style: TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.onSurface,
                                    letterSpacing: -0.5)),
                            const SizedBox(height: 4),
                            _DocRow(
                                label: ar ? 'الرقم:' : 'NUMBER:',
                                value: 'INV-DRAFT'),
                            _DocRow(
                                label: ar ? 'التاريخ:' : 'DATE:',
                                value: ar
                                    ? _todayAr()
                                    : _todayEn()),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),

                  // Bill to
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ar ? 'العميل' : 'BILL TO',
                                  style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                      letterSpacing: 0.8),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  widget.customer != null
                                      ? (ar
                                          ? widget.customer!.nameAr
                                          : widget.customer!.name)
                                      : (ar
                                          ? 'مؤسسة الخدمات اللوجستية العالمية'
                                          : 'Global Logistics Corp.'),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                      color: AppColors.onSurface,
                                      height: 1.3),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _billToSubtitle(ar),
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.onSurfaceVariant,
                                      height: 1.5),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ar ? 'طريقة الدفع' : 'PAYMENT',
                                style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.onSurfaceVariant,
                                    letterSpacing: 0.8),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                ar ? 'نقداً أو تحويل بنكي' : 'Cash / Bank Transfer',
                                style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.onSurface),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),

                  // Items table header
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 12),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Text(ar ? 'المنتج' : 'PRODUCT',
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5)),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text(ar ? 'الكمية' : 'QTY',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5)),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(ar ? 'سعر الوحدة' : 'UNIT PRICE',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5)),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(ar ? 'الإجمالي' : 'TOTAL',
                              textAlign: TextAlign.end,
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5)),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),

                  // الأصناف الفعلية أو رسالة فارغة
                  if (items.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.receipt_long_outlined,
                                size: 48,
                                color: AppColors.onSurfaceVariant
                                    .withValues(alpha: 0.4)),
                            const SizedBox(height: 12),
                            Text(
                              ar
                                  ? 'لا توجد أصناف في الفاتورة'
                                  : 'No items in this invoice',
                              style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ...items.asMap().entries.map((e) => _LineItem(
                          product: ar ? e.value.nameAr : e.value.name,
                          qty: e.value.qty.toString(),
                          unitPrice: formatSYP(e.value.unitPrice, ar),
                          total: formatSYP(e.value.total, ar),
                          isLast: e.key == items.length - 1,
                        )),

                  // Totals
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        _TotalRow(
                          label: ar ? 'المجموع الفرعي:' : 'SUBTOTAL',
                          value: formatSYP(_subtotal, ar),
                        ),
                        const SizedBox(height: 8),
                        _TotalRow(
                          label: ar ? 'الضريبة (8٪):' : 'TAX (8%)',
                          value: formatSYP(_tax, ar),
                        ),
                        const SizedBox(height: 8),
                        _TotalRow(
                          label: ar ? 'الخصم (10٪):' : 'DISCOUNT (10%)',
                          value: '-${formatSYP(_discount, ar)}',
                          isDiscount: true,
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 10),
                          child: Divider(
                              height: 1,
                              color: AppColors.outlineVariant),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              ar ? 'الإجمالي الكلي:' : 'TOTAL AMOUNT',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                  color: AppColors.onSurface),
                            ),
                            Text(
                              formatSYP(_total, ar),
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 18,
                                  color: AppColors.primary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Signature
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              Container(
                                height: 50,
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerLow,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Center(
                                  child: Icon(Icons.verified,
                                      size: 28,
                                      color: AppColors.outlineVariant),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                ar ? 'ختم الشركة' : 'Company Seal',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.onSurfaceVariant),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            children: [
                              Container(
                                height: 50,
                                decoration: const BoxDecoration(
                                  border: Border(
                                      bottom: BorderSide(
                                          color: AppColors.outline)),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                ar ? 'توقيع الزبون' : 'Customer Signature',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.onSurfaceVariant),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Footer
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: const BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                    ),
                    child: Text(
                      ar
                          ? 'صفحة 1 من 1 | تم إنشاؤها بواسطة IntelliSales'
                          : 'Page 1 of 1  |  Generated by IntelliSales',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.onSurfaceVariant,
                          letterSpacing: 0.2),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),

        // ── Bottom actions ─────────────────────────────────────────────
        bottomNavigationBar: Container(
          color: AppColors.surface,
          padding: EdgeInsets.fromLTRB(
              16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _saved
                      ? null
                      : () {
                          setState(() => _saved = true);
                          _showSnack(
                              context,
                              ar
                                  ? 'تم تأكيد وحفظ الفاتورة'
                                  : 'Invoice confirmed and saved');
                        },
                  icon: Icon(
                      _saved ? Icons.check_circle : Icons.check_circle_outline,
                      size: 18),
                  label: Text(
                    _saved
                        ? (ar ? 'تم الحفظ' : 'Saved')
                        : (ar ? 'تأكيد وحفظ' : 'Confirm & Save'),
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.tertiary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor:
                        AppColors.tertiary.withValues(alpha: 0.5),
                    disabledForegroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _saved ? () => _printInvoice(ar) : null,
                  icon: const Icon(Icons.print_outlined, size: 18),
                  label: Text(
                    _saved
                        ? (ar ? 'طباعة الفاتورة' : 'Print Invoice')
                        : (ar
                            ? 'احفظ الفاتورة أولاً للطباعة'
                            : 'Save the invoice first to print'),
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.outlineVariant,
                    disabledForegroundColor: AppColors.onSurfaceVariant,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _billToSubtitle(bool ar) {
    final customer = widget.customer;
    if (customer == null) {
      return ar
          ? '123 الطريق الصناعي، المبنى ب'
          : '123 Industrial Way, Building B';
    }
    if (customer.address.isNotEmpty) return customer.address;
    return ar
        ? '${customer.contactAr} • ${customer.roleAr}'
        : '${customer.contact} • ${customer.role}';
  }

  String _todayEn() {
    final now = DateTime.now();
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    return '${months[now.month - 1]} ${now.day}, ${now.year}';
  }

  String _todayAr() {
    final now = DateTime.now();
    const months = [
      'يناير','فبراير','مارس','أبريل','مايو','يونيو',
      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
    ];
    return '${now.day} ${months[now.month - 1]} ${now.year}';
  }
}

// ── Helper widgets ─────────────────────────────────────────────────────────────

class _DocRow extends StatelessWidget {
  final String label;
  final String value;
  const _DocRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onSurfaceVariant,
                  letterSpacing: 0.5)),
          const SizedBox(width: 6),
          Text(value,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface)),
        ],
      ),
    );
  }
}

class _LineItem extends StatelessWidget {
  final String product;
  final String qty;
  final String unitPrice;
  final String total;
  final bool isLast;

  const _LineItem({
    required this.product,
    required this.qty,
    required this.unitPrice,
    required this.total,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: Color(0xFFEEEEEE))),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(product,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.onSurface)),
          ),
          Expanded(
            flex: 1,
            child: Text(qty,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.onSurfaceVariant)),
          ),
          Expanded(
            flex: 2,
            child: Text(unitPrice,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.onSurfaceVariant)),
          ),
          Expanded(
            flex: 2,
            child: Text(total,
                textAlign: TextAlign.end,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onSurface)),
          ),
        ],
      ),
    );
  }
}

class _TotalRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDiscount;
  const _TotalRow(
      {required this.label, required this.value, this.isDiscount = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 13, color: AppColors.onSurfaceVariant)),
        Text(value,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isDiscount
                    ? AppColors.error
                    : AppColors.onSurface)),
      ],
    );
  }
}
