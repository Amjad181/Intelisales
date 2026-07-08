import 'dart:async';
import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../services/api_client.dart';
import '../services/customer_service.dart';
import '../widgets/error_retry_view.dart';

/// اختيار عميل لإنشاء فاتورة مباشرة (دون المرور بزيارة): قائمة عملاء
/// المندوب الحقيقية من الباك اند مع بحث خادمي مُخفَّف (debounce ~350ms).
/// يرجع العميل المختار عبر Navigator.pop.
class CustomerPickerScreen extends StatefulWidget {
  const CustomerPickerScreen({super.key});

  @override
  State<CustomerPickerScreen> createState() => _CustomerPickerScreenState();
}

class _CustomerPickerScreenState extends State<CustomerPickerScreen> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  int _requestSeq = 0;

  bool _loading = true;
  String? _error;
  List<Customer> _customers = const [];

  @override
  void initState() {
    super.initState();
    _load('');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    final query = value.trim();
    // حسب الخطة: البحث الخادمي بعد حرفين وبتأخير ~350ms؛ ومسح الحقل يعيد
    // القائمة الكاملة (الصفحة الأولى).
    if (query.isNotEmpty && query.length < 2) return;
    _debounce = Timer(const Duration(milliseconds: 350), () => _load(query));
  }

  Future<void> _load(String search) async {
    final seq = ++_requestSeq;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await CustomerService.list(search: search, page: 1);
      if (!mounted || seq != _requestSeq) return; // تجاهل استجابة قديمة
      setState(() {
        _customers = result.items;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted || seq != _requestSeq) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: AppColors.primary),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            ar ? 'اختيار العميل' : 'Select Customer',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 17,
              color: AppColors.primary,
            ),
          ),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
                onChanged: _onQueryChanged,
                decoration: InputDecoration(
                  hintText: ar ? 'ابحث عن عميل...' : 'Search customers...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: AppColors.outline,
                  ),
                  filled: true,
                  fillColor: AppColors.surfaceContainerLowest,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: AppColors.outlineVariant.withValues(alpha: 0.5),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: AppColors.outlineVariant.withValues(alpha: 0.5),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: AppColors.primary,
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                  ? ErrorRetryView(
                      message: _error!,
                      ar: ar,
                      onRetry: () => _load(_searchCtrl.text.trim()),
                    )
                  : _customers.isEmpty
                  ? Center(
                      child: Text(
                        ar ? 'لا يوجد عملاء' : 'No customers found',
                        style: const TextStyle(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      itemCount: _customers.length,
                      itemBuilder: (_, i) {
                        final c = _customers[i];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: AppColors.outlineVariant.withValues(
                                alpha: 0.4,
                              ),
                            ),
                          ),
                          child: ListTile(
                            leading: Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: AppColors.primaryContainer.withValues(
                                  alpha: 0.1,
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.storefront,
                                color: AppColors.primary,
                                size: 22,
                              ),
                            ),
                            title: Text(
                              ar ? c.nameAr : c.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: c.contact.isEmpty
                                ? null
                                : Text(
                                    ar ? c.contactAr : c.contact,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                            trailing: Icon(
                              ar ? Icons.chevron_left : Icons.chevron_right,
                              color: AppColors.outline,
                            ),
                            onTap: () => Navigator.pop(context, c),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
