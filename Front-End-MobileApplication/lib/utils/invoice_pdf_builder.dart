import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../data/sample_data.dart';
import 'currency.dart';

const _brand = PdfColor.fromInt(0xFF004EE8);

Future<Uint8List> buildInvoicePdf({
  required List<InvoiceItem> items,
  required bool ar,
  required double subtotal,
  required double tax,
  required double discount,
  required double total,
}) async {
  final regular = await PdfGoogleFonts.cairoRegular();
  final bold = await PdfGoogleFonts.cairoBold();
  final doc = pw.Document();

  final now = DateTime.now();
  final dateText = ar ? _todayAr(now) : _todayEn(now);

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      theme: pw.ThemeData.withFont(base: regular, bold: bold),
      textDirection: ar ? pw.TextDirection.rtl : pw.TextDirection.ltr,
      margin: const pw.EdgeInsets.all(28),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          // ── Header ──────────────────────────────────────────────
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'IntelliSales',
                      style: pw.TextStyle(
                        font: bold,
                        fontSize: 20,
                        color: _brand,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      ar
                          ? 'حلول المبيعات الميدانية الذكية\nدمشق، سوريا'
                          : 'Smart Field Sales Solutions\nDamascus, Syria',
                      style: const pw.TextStyle(
                        fontSize: 9,
                        color: PdfColors.grey700,
                      ),
                    ),
                  ],
                ),
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    'INVOICE',
                    style: pw.TextStyle(font: bold, fontSize: 22),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Text(
                    '${ar ? "الرقم: " : "NUMBER: "}INV-DRAFT',
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                  pw.Text(
                    '${ar ? "التاريخ: " : "DATE: "}$dateText',
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 20),
          pw.Divider(color: PdfColors.grey300),
          pw.SizedBox(height: 16),

          // ── Bill to / Payment ───────────────────────────────────
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: pw.BorderRadius.circular(8),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        ar ? 'العميل' : 'BILL TO',
                        style: pw.TextStyle(
                          font: bold,
                          fontSize: 9,
                          color: _brand,
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        ar
                            ? 'مؤسسة الخدمات اللوجستية العالمية'
                            : 'Global Logistics Corp.',
                        style: pw.TextStyle(font: bold, fontSize: 12),
                      ),
                      pw.SizedBox(height: 2),
                      pw.Text(
                        ar
                            ? '123 الطريق الصناعي، المبنى ب'
                            : '123 Industrial Way, Building B',
                        style: const pw.TextStyle(
                          fontSize: 9,
                          color: PdfColors.grey700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              pw.SizedBox(width: 12),
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      ar ? 'طريقة الدفع' : 'PAYMENT',
                      style: pw.TextStyle(
                        font: bold,
                        fontSize: 9,
                        color: PdfColors.grey700,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      ar ? 'نقداً أو تحويل بنكي' : 'Cash / Bank Transfer',
                      style: pw.TextStyle(font: bold, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 20),

          // ── Items table ─────────────────────────────────────────
          if (items.isEmpty)
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(vertical: 24),
              child: pw.Center(
                child: pw.Text(
                  ar ? 'لا توجد أصناف في الفاتورة' : 'No items in this invoice',
                  style: const pw.TextStyle(
                    fontSize: 12,
                    color: PdfColors.grey700,
                  ),
                ),
              ),
            )
          else
            pw.Table(
              border: const pw.TableBorder(
                horizontalInside: pw.BorderSide(
                  color: PdfColors.grey300,
                  width: 0.5,
                ),
              ),
              columnWidths: const {
                0: pw.FlexColumnWidth(3),
                1: pw.FlexColumnWidth(1),
                2: pw.FlexColumnWidth(2),
                3: pw.FlexColumnWidth(2),
              },
              children: [
                pw.TableRow(
                  decoration: const pw.BoxDecoration(
                    border: pw.Border(
                      bottom: pw.BorderSide(color: PdfColors.grey400),
                    ),
                  ),
                  children: [
                    _headerCell(
                      ar ? 'المنتج' : 'PRODUCT',
                      bold,
                      pw.TextAlign.start,
                    ),
                    _headerCell(
                      ar ? 'الكمية' : 'QTY',
                      bold,
                      pw.TextAlign.center,
                    ),
                    _headerCell(
                      ar ? 'سعر الوحدة' : 'UNIT PRICE',
                      bold,
                      pw.TextAlign.center,
                    ),
                    _headerCell(
                      ar ? 'الإجمالي' : 'TOTAL',
                      bold,
                      pw.TextAlign.end,
                    ),
                  ],
                ),
                for (final item in items)
                  pw.TableRow(
                    children: [
                      _cell(ar ? item.nameAr : item.name, pw.TextAlign.start),
                      _cell('${item.qty}', pw.TextAlign.center),
                      _cell(formatSYP(item.unitPrice, ar), pw.TextAlign.center),
                      _cell(
                        formatSYP(item.total, ar),
                        pw.TextAlign.end,
                        font: bold,
                      ),
                    ],
                  ),
              ],
            ),
          pw.SizedBox(height: 20),

          // ── Totals ──────────────────────────────────────────────
          pw.Container(
            padding: const pw.EdgeInsets.all(14),
            decoration: pw.BoxDecoration(
              color: PdfColors.grey100,
              borderRadius: pw.BorderRadius.circular(10),
            ),
            child: pw.Column(
              children: [
                _totalRow(
                  ar ? 'المجموع الفرعي:' : 'SUBTOTAL',
                  formatSYP(subtotal, ar),
                ),
                pw.SizedBox(height: 6),
                _totalRow(
                  ar ? 'الضريبة (8٪):' : 'TAX (8%)',
                  formatSYP(tax, ar),
                ),
                pw.SizedBox(height: 6),
                _totalRow(
                  ar ? 'الخصم (10٪):' : 'DISCOUNT (10%)',
                  '-${formatSYP(discount, ar)}',
                  color: PdfColors.red700,
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 8),
                  child: pw.Divider(color: PdfColors.grey400),
                ),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      ar ? 'الإجمالي الكلي:' : 'TOTAL AMOUNT',
                      style: pw.TextStyle(font: bold, fontSize: 13),
                    ),
                    pw.Text(
                      formatSYP(total, ar),
                      style: pw.TextStyle(
                        font: bold,
                        fontSize: 16,
                        color: _brand,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 30),

          // ── Signature ───────────────────────────────────────────
          pw.Row(
            children: [
              pw.Expanded(
                child: pw.Column(
                  children: [
                    pw.Container(height: 1, color: PdfColors.grey500),
                    pw.SizedBox(height: 6),
                    pw.Text(
                      ar ? 'ختم الشركة' : 'Company Seal',
                      style: const pw.TextStyle(
                        fontSize: 9,
                        color: PdfColors.grey700,
                      ),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(width: 24),
              pw.Expanded(
                child: pw.Column(
                  children: [
                    pw.Container(height: 1, color: PdfColors.grey500),
                    pw.SizedBox(height: 6),
                    pw.Text(
                      ar ? 'توقيع الزبون' : 'Customer Signature',
                      style: const pw.TextStyle(
                        fontSize: 9,
                        color: PdfColors.grey700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 20),
          pw.Text(
            ar
                ? 'صفحة 1 من 1 | تم إنشاؤها بواسطة IntelliSales'
                : 'Page 1 of 1  |  Generated by IntelliSales',
            textAlign: pw.TextAlign.center,
            style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
          ),
        ],
      ),
    ),
  );

  return doc.save();
}

pw.Widget _headerCell(String text, pw.Font bold, pw.TextAlign align) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 8),
    child: pw.Text(
      text,
      textAlign: align,
      style: pw.TextStyle(font: bold, fontSize: 9, color: _brand),
    ),
  );
}

pw.Widget _cell(String text, pw.TextAlign align, {pw.Font? font}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 8),
    child: pw.Text(
      text,
      textAlign: align,
      style: pw.TextStyle(font: font, fontSize: 10),
    ),
  );
}

pw.Widget _totalRow(String label, String value, {PdfColor? color}) {
  return pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
    children: [
      pw.Text(
        label,
        style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
      ),
      pw.Text(
        value,
        style: pw.TextStyle(fontSize: 10, color: color ?? PdfColors.black),
      ),
    ],
  );
}

String _todayEn(DateTime now) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[now.month - 1]} ${now.day}, ${now.year}';
}

String _todayAr(DateTime now) {
  const months = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  return '${now.day} ${months[now.month - 1]} ${now.year}';
}
