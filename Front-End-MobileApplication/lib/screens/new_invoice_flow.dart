import 'package:flutter/material.dart';
import '../data/sample_data.dart';
import 'customer_picker_screen.dart';
import 'new_invoice_screen.dart';

// ── New invoice: direct draft creation ──────────────────────────────────────
//
// حسب خطة التكامل (P1): إنشاء مسودة الفاتورة مباشرة باختيار عميل ثم
// المنتجات، دون اشتراط زيارة أولاً. مسار الزيارات ما زال متاحاً كاختصار من
// شاشة النشاط (تسجيل نتيجة "فعّالة" يفتح الفاتورة كما كان).

Future<void> startNewInvoiceFlow(BuildContext context, bool ar) async {
  final customer = await Navigator.push<Customer>(
    context,
    MaterialPageRoute(builder: (_) => const CustomerPickerScreen()),
  );
  if (customer == null || !context.mounted) return;
  await Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => NewInvoiceScreen(customer: customer)),
  );
}
