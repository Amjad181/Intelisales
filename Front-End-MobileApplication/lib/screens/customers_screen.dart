import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import 'main_shell.dart';

void _showAlert(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(message),
    backgroundColor: AppColors.error,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    duration: const Duration(seconds: 3),
  ));
}

Future<void> _callCustomer(BuildContext context, Customer customer, bool ar) async {
  final phone = customer.phone1.trim();
  if (phone.isEmpty) {
    _showAlert(context,
        ar ? 'لا يوجد رقم هاتف مسجل لهذا العميل' : 'No phone number registered for this customer');
    return;
  }
  final uri = Uri(scheme: 'tel', path: phone);
  final ok = await launchUrl(uri);
  if (!ok && context.mounted) {
    _showAlert(context, ar ? 'تعذر فتح تطبيق الاتصال' : 'Could not open the phone app');
  }
}

Future<void> _messageCustomer(BuildContext context, Customer customer, bool ar) async {
  final phone = customer.phone1.trim();
  if (phone.isEmpty) {
    _showAlert(context,
        ar ? 'لا يوجد رقم هاتف مسجل لهذا العميل' : 'No phone number registered for this customer');
    return;
  }
  final uri = Uri(scheme: 'sms', path: phone);
  final ok = await launchUrl(uri);
  if (!ok && context.mounted) {
    _showAlert(context, ar ? 'تعذر فتح تطبيق الرسائل' : 'Could not open the messaging app');
  }
}

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Customer> _filtered() {
    if (_query.isEmpty) return sampleCustomers;
    return sampleCustomers
        .where((c) =>
            c.name.toLowerCase().contains(_query.toLowerCase()) ||
            c.nameAr.contains(_query) ||
            c.contact.toLowerCase().contains(_query.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final filtered = _filtered();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Row(
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
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: ar
                    ? 'ابحث عن العملاء، جهات الاتصال...'
                    : 'Search customers, contacts, or zip codes...',
                prefixIcon: const Icon(Icons.search, color: AppColors.outline),
                filled: true,
                fillColor: AppColors.surfaceContainerLowest,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide(
                      color: AppColors.outlineVariant.withValues(alpha: 0.5)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide(
                      color: AppColors.outlineVariant.withValues(alpha: 0.5)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Header row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              ar
                  ? '${filtered.length} عملاء بالقرب منك'
                  : '${filtered.length} CUSTOMERS NEARBY',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.secondary,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Customer list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              itemCount: filtered.length,
              itemBuilder: (ctx, i) =>
                  _CustomerCard(customer: filtered[i], ar: ar),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Customer Card ─────────────────────────────────────────────────────────────

class _CustomerCard extends StatelessWidget {
  final Customer customer;
  final bool ar;

  const _CustomerCard({required this.customer, required this.ar});

  Color get _statusColor => switch (customer.status) {
        'ACTIVE' => AppColors.tertiary,
        'AT RISK' => AppColors.error,
        _ => AppColors.secondary,
      };

  Color get _statusBg => switch (customer.status) {
        'ACTIVE' => AppColors.tertiaryContainer.withValues(alpha: 0.15),
        'AT RISK' => AppColors.errorContainer.withValues(alpha: 0.2),
        _ => AppColors.secondaryContainer.withValues(alpha: 0.2),
      };

  String get _statusLabel => switch (customer.status) {
        'ACTIVE' => ar ? 'نشط' : 'ACTIVE',
        'AT RISK' => ar ? 'في خطر' : 'AT RISK',
        _ => ar ? 'محتمل' : 'PROSPECT',
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
          // Name + status
          Row(
            children: ar
                ? [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _statusBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(_statusLabel,
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _statusColor)),
                    ),
                    const Spacer(),
                    Text(
                      ar ? customer.nameAr : customer.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppColors.onSurface,
                      ),
                    ),
                  ]
                : [
                    Text(
                      customer.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _statusBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(_statusLabel,
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _statusColor)),
                    ),
                  ],
          ),
          const SizedBox(height: 4),
          Text(
            customer.shopName.isNotEmpty
                ? '${customer.shopName} • ${customer.phone1}'
                : (ar
                    ? '${customer.contactAr} • ${customer.roleAr}'
                    : '${customer.contact} • ${customer.role}'),
            style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.access_time, size: 14, color: AppColors.outline),
              const SizedBox(width: 4),
              Text(
                ar
                    ? 'آخر زيارة: ${customer.lastVisitAr}'
                    : 'Last visit: ${customer.lastVisit}',
                style: const TextStyle(fontSize: 12, color: AppColors.outline),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0x1A000000)),
          const SizedBox(height: 12),

          // Action row
          Row(
            children: [
              _IconCircleBtn(
                icon: Icons.phone_outlined,
                onTap: () => _callCustomer(context, customer, ar),
              ),
              const SizedBox(width: 8),
              _IconCircleBtn(
                icon: Icons.near_me_outlined,
                onTap: () => _messageCustomer(context, customer, ar),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () =>
                    MainShell.of(context)?.goToActivity(searchQuery: customer.name),
                icon: const Icon(Icons.receipt_long_outlined, size: 16),
                label: Text(ar ? 'فاتورة جديدة' : 'New Invoice',
                    style: const TextStyle(fontSize: 13)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _IconCircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconCircleBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.outlineVariant),
          color: AppColors.surfaceContainerLow,
        ),
        child: Icon(icon, size: 18, color: AppColors.primary),
      ),
    );
  }
}

