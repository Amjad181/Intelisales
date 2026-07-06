import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'main_shell.dart';

// ── New invoice: every invoice must be backed by a visit outcome ────────────
//
// Invoices are never created ad-hoc. The rep is always routed to the
// Activity/Visits screen first, picks the relevant scheduled visit, and only
// recording its outcome as "Effective" (sale made) opens the invoice screen.

void startNewInvoiceFlow(BuildContext context, bool ar) {
  MainShell.of(context)?.goToActivity();
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(
      ar
          ? 'اختر الزيارة من المخطط وسجّل نتيجتها كـ"فعّالة" لإنشاء الفاتورة'
          : 'Pick the visit from the plan and record its outcome as "Effective" to create the invoice',
    ),
    backgroundColor: AppColors.primary,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    duration: const Duration(seconds: 4),
  ));
}
