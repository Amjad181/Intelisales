import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../utils/currency.dart';
import 'invoice_pdf_screen.dart';
import 'main_shell.dart';
import 'add_customer_dialog.dart';
import 'new_invoice_flow.dart';
import '../widgets/profile_photo_picker.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final userName = UserSession.of(context).name;
    final displayName =
        userName.isEmpty ? (ar ? 'المندوب' : 'Representative') : userName;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Row(
          children: [
            const ProfileAvatar(radius: 16),
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
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          // Welcome
          Text(
            ar ? 'نظرة عامة يومية' : 'DAILY OVERVIEW',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.secondary,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            ar ? 'مرحباً، $displayName' : 'Hello, $displayName',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: AppColors.onBackground,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 20),

          // Bento metrics grid
          Row(
            children: [
              Expanded(child: _MetricCard(
                icon: Icons.task_alt,
                iconBg: AppColors.primary.withValues(alpha: 0.1),
                iconColor: AppColors.primary,
                value: '8/12',
                label: ar ? 'زيارات اليوم' : 'Visits Today',
                onTap: () => MainShell.of(context)?.goTo(2),
              )),
              const SizedBox(width: 12),
              Expanded(child: _MetricCard(
                icon: Icons.pending_actions,
                iconBg: AppColors.error.withValues(alpha: 0.1),
                iconColor: AppColors.error,
                value: formatSYP(1420, ar),
                label: ar ? 'فواتير معلقة' : 'Pending Invoices',
                onTap: () => MainShell.of(context)?.goToInvoices('OVERDUE'),
              )),
            ],
          ),
          const SizedBox(height: 12),

          // Sales target card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryContainer.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      ar ? 'هدف المبيعات' : 'Sales Target',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 16),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        ar ? '٧٢٪ من التقدم' : '72% Progress',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: 0.72,
                    backgroundColor: Colors.white.withValues(alpha: 0.25),
                    valueColor:
                        const AlwaysStoppedAnimation<Color>(Colors.white),
                    minHeight: 10,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      ar
                          ? 'تم تحقيق ${formatSYP(18000, ar)}'
                          : '${formatSYP(18000, ar)} achieved',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 12),
                    ),
                    Text(
                      ar
                          ? 'الهدف ${formatSYP(25000, ar)}'
                          : '${formatSYP(25000, ar)} goal',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Quick Actions
          Text(
            ar ? 'إجراءات سريعة' : 'Quick Actions',
            style: const TextStyle(
                fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.onBackground),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _ActionButton(
                  icon: Icons.add_location_alt_outlined,
                  iconColor: AppColors.primary,
                  iconBg: AppColors.primaryContainer.withValues(alpha: 0.1),
                  label: ar ? 'زيارة جديدة' : 'New Visit',
                  onTap: () => MainShell.of(context)?.goTo(2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActionButton(
                  icon: Icons.person_add_outlined,
                  iconColor: AppColors.tertiary,
                  iconBg: AppColors.tertiaryContainer.withValues(alpha: 0.1),
                  label: ar ? 'عميل جديد' : 'New Customer',
                  onTap: () => _startAddCustomer(context),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActionButton(
                  icon: Icons.post_add_outlined,
                  iconColor: AppColors.secondary,
                  iconBg: AppColors.secondaryContainer.withValues(alpha: 0.15),
                  label: ar ? 'فاتورة جديدة' : 'New Invoice',
                  onTap: () => startNewInvoiceFlow(context, ar),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Recent Invoices
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                ar ? 'الفواتير الأخيرة' : 'Recent Invoices',
                style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onBackground),
              ),
              TextButton(
                onPressed: () => MainShell.of(context)?.goTo(3),
                child: Text(
                  ar ? 'كل الفواتير' : 'All Invoices',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
            ),
            child: Column(
              children: [
                _InvoiceRow(
                  icon: Icons.receipt_long,
                  iconBg: AppColors.secondaryContainer.withValues(alpha: 0.3),
                  iconColor: AppColors.secondary,
                  id: 'INV-8821',
                  customer: ar ? 'مترو للخدمات اللوجستية' : 'BrightHome Supplies',
                  amount: formatSYP(3450.00, ar),
                  status: 'PAID',
                  statusLabel: ar ? 'مدفوع' : 'Paid',
                  isLast: false,
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const InvoicePdfScreen(items: []))),
                ),
                _InvoiceRow(
                  icon: Icons.timer_outlined,
                  iconBg: AppColors.errorContainer.withValues(alpha: 0.3),
                  iconColor: AppColors.error,
                  id: 'INV-8822',
                  customer: ar ? 'فيلوسيتي بارتنرز' : 'PureClean Corp',
                  amount: formatSYP(1420.00, ar),
                  status: 'PENDING',
                  statusLabel: ar ? 'معلق' : 'Pending',
                  isLast: true,
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── New customer: prompt for customer details ────────────────────────────────

Future<void> _startAddCustomer(BuildContext context) async {
  final ar = AppLocale.of(context).isArabic;
  final newCustomer = await showDialog<Customer>(
    context: context,
    builder: (_) => const AddCustomerDialog(),
  );

  if (newCustomer != null && context.mounted) {
    sampleCustomers.add(newCustomer);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ar
          ? 'تمت إضافة العميل "${newCustomer.nameAr}" بنجاح'
          : 'Customer "${newCustomer.name}" added successfully'),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 2),
    ));
    MainShell.of(context)?.goTo(1);
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _MetricCard extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String value;
  final String label;
  final VoidCallback? onTap;

  const _MetricCard({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.value,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
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
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppColors.onSurface,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.secondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String label;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.5)),
        ),
        child: Column(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: AppColors.onSurface),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _InvoiceRow extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String id;
  final String customer;
  final String amount;
  final String status;
  final String statusLabel;
  final bool isLast;
  final VoidCallback onTap;

  const _InvoiceRow({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.id,
    required this.customer,
    required this.amount,
    required this.status,
    required this.statusLabel,
    required this.isLast,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg) = switch (status) {
      'PAID' => (AppColors.tertiaryContainer.withValues(alpha: 0.15), AppColors.tertiary),
      'PENDING' => (AppColors.errorContainer.withValues(alpha: 0.2), AppColors.error),
      'OVERDUE' => (AppColors.errorContainer.withValues(alpha: 0.2), AppColors.error),
      'SENT' => (AppColors.secondaryContainer.withValues(alpha: 0.3), AppColors.secondary),
      _ => (AppColors.surfaceContainer, AppColors.onSurfaceVariant),
    };

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : const Border(
                  bottom: BorderSide(
                      color: Color(0x1A000000))),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(shape: BoxShape.circle, color: iconBg),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(id,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: AppColors.onSurface)),
                  Text(customer,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.secondary)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(amount,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppColors.onSurface)),
                const SizedBox(height: 2),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                      color: bg, borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    statusLabel.toUpperCase(),
                    style: TextStyle(
                        fontSize: 10, fontWeight: FontWeight.w700, color: fg),
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
