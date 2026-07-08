import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/api_config.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../services/api_client.dart';
import '../services/customer_service.dart';
import '../widgets/demo_data_banner.dart';
import '../widgets/error_retry_view.dart';
import 'new_invoice_screen.dart';

void _showAlert(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 3),
    ),
  );
}

Future<void> _callCustomer(
  BuildContext context,
  Customer customer,
  bool ar,
) async {
  final phone = customer.phone1.trim();
  if (phone.isEmpty) {
    _showAlert(
      context,
      ar
          ? 'لا يوجد رقم هاتف مسجل لهذا العميل'
          : 'No phone number registered for this customer',
    );
    return;
  }
  final uri = Uri(scheme: 'tel', path: phone);
  final ok = await launchUrl(uri);
  if (!ok && context.mounted) {
    _showAlert(
      context,
      ar ? 'تعذر فتح تطبيق الاتصال' : 'Could not open the phone app',
    );
  }
}

Future<void> _messageCustomer(
  BuildContext context,
  Customer customer,
  bool ar,
) async {
  final phone = customer.phone1.trim();
  if (phone.isEmpty) {
    _showAlert(
      context,
      ar
          ? 'لا يوجد رقم هاتف مسجل لهذا العميل'
          : 'No phone number registered for this customer',
    );
    return;
  }
  final uri = Uri(scheme: 'sms', path: phone);
  final ok = await launchUrl(uri);
  if (!ok && context.mounted) {
    _showAlert(
      context,
      ar ? 'تعذر فتح تطبيق الرسائل' : 'Could not open the messaging app',
    );
  }
}

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  static CustomersScreenState? of(BuildContext context) =>
      context.findAncestorStateOfType<CustomersScreenState>();

  @override
  State<CustomersScreen> createState() => CustomersScreenState();
}

class CustomersScreenState extends State<CustomersScreen> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  int _requestSeq = 0;

  bool _loading = true;
  String? _error;
  bool _usingDemoData = false;
  List<Customer> _customers = const [];

  @override
  void initState() {
    super.initState();
    refresh();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  /// بحث خادمي مُخفَّف حسب الخطة: بعد حرفين وبتأخير ~350ms يُستدعى
  /// GET /customers?search=...؛ مسح الحقل يعيد الصفحة الأولى كاملة.
  void _onQueryChanged(String value) {
    _debounce?.cancel();
    final query = value.trim();
    if (query.isNotEmpty && query.length < 2) return;
    _debounce = Timer(const Duration(milliseconds: 350), refresh);
  }

  Future<void> refresh() async {
    final seq = ++_requestSeq;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await CustomerService.list(
        search: _searchCtrl.text.trim(),
        page: 1,
      );
      if (!mounted || seq != _requestSeq) return; // تجاهل استجابة قديمة
      setState(() {
        _customers = result.items;
        _usingDemoData = false;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted || seq != _requestSeq) return;
      setState(() {
        if (ApiConfig.demoMode) {
          // وضع العرض التجريبي الصريح فقط — مع شريط تنبيه ظاهر
          _customers = sampleCustomers;
          _usingDemoData = true;
        } else {
          _customers = const [];
          _error = e.message;
        }
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final filtered = _customers;

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
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
              onChanged: _onQueryChanged,
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
                    color: AppColors.outlineVariant.withValues(alpha: 0.5),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide(
                    color: AppColors.outlineVariant.withValues(alpha: 0.5),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: const BorderSide(
                    color: AppColors.primary,
                    width: 2,
                  ),
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
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorRetryView(message: _error!, ar: ar, onRetry: refresh)
                : RefreshIndicator(
                    onRefresh: refresh,
                    child: ListView(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      children: [
                        if (_usingDemoData) DemoDataBanner(ar: ar),
                        if (filtered.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: Center(
                              child: Text(
                                ar
                                    ? 'لا توجد نتائج مطابقة'
                                    : 'No matching customers',
                                style: const TextStyle(
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                            ),
                          ),
                        for (final c in filtered)
                          _CustomerCard(customer: c, ar: ar),
                      ],
                    ),
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
          // Name + status
          Row(
            children: ar
                ? [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: _statusBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _statusColor,
                        ),
                      ),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: _statusBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _statusColor,
                        ),
                      ),
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
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.onSurfaceVariant,
            ),
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
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => NewInvoiceScreen(customer: customer),
                  ),
                ),
                icon: const Icon(Icons.receipt_long_outlined, size: 16),
                label: Text(
                  ar ? 'فاتورة جديدة' : 'New Invoice',
                  style: const TextStyle(fontSize: 13),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
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
