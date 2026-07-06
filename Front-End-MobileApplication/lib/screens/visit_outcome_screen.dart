import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../data/schedule_models.dart';
import 'new_invoice_screen.dart';

/// Lets the rep record what happened at a scheduled visit. The plan itself
/// (day / region / trade center / time) was set by the manager and is shown
/// read-only here — the rep can only choose an outcome and add notes.
class VisitOutcomeScreen extends StatefulWidget {
  final ScheduledVisit visit;

  const VisitOutcomeScreen({super.key, required this.visit});

  @override
  State<VisitOutcomeScreen> createState() => _VisitOutcomeScreenState();
}

class _VisitOutcomeScreenState extends State<VisitOutcomeScreen> {
  late final TextEditingController _notesCtrl;
  VisitOutcome? _selected;
  bool _showError = false;

  @override
  void initState() {
    super.initState();
    _selected = widget.visit.outcome;
    _notesCtrl = TextEditingController(text: widget.visit.notes);
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Customer _resolveCustomer() {
    final line = widget.visit.line;
    if (line.customerId != null) {
      final match = sampleCustomers.where((c) => c.id == line.customerId);
      if (match.isNotEmpty) return match.first;
    }
    final byName = sampleCustomers.where((c) =>
        c.name.trim().toLowerCase() == line.tradeCenterName.trim().toLowerCase() ||
        c.nameAr.trim() == line.tradeCenterName.trim());
    if (byName.isNotEmpty) return byName.first;

    return Customer(
      id: 'schedule-${line.id}',
      name: line.tradeCenterName,
      nameAr: line.tradeCenterName,
      contact: '',
      contactAr: '',
      role: '',
      roleAr: '',
      lastVisit: '',
      lastVisitAr: '',
      status: 'ACTIVE',
      region: line.region,
    );
  }

  void _save() {
    if (_selected == null) {
      setState(() => _showError = true);
      return;
    }
    widget.visit.outcome = _selected;
    widget.visit.notes = _notesCtrl.text.trim();

    if (_selected == VisitOutcome.effective) {
      final customer = _resolveCustomer();
      final visitInfo = VisitInfo(
        customer: customer,
        resultKey: 'ORDER_PLACED',
        notes: widget.visit.notes,
        date: widget.visit.date,
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => NewInvoiceScreen(customer: customer, visitInfo: visitInfo),
        ),
      );
    } else {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final line = widget.visit.line;

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
            ar ? 'تسجيل نتيجة الزيارة' : 'Record Visit Outcome',
            style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 17, color: AppColors.primary),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _sectionCard(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.storefront, color: AppColors.primary, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          line.tradeCenterName,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.onSurface),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          line.region,
                          style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(ar ? 'نتيجة الزيارة *' : 'VISIT OUTCOME *',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurfaceVariant,
                    letterSpacing: 0.6)),
            const SizedBox(height: 10),
            ...VisitOutcome.values.map((opt) {
              final selected = _selected == opt;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => setState(() {
                    _selected = opt;
                    _showError = false;
                  }),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.primaryContainer.withValues(alpha: 0.15)
                          : AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: selected
                            ? AppColors.primary
                            : AppColors.outlineVariant.withValues(alpha: 0.4),
                        width: selected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selected ? Icons.radio_button_checked : Icons.radio_button_off,
                          size: 20,
                          color: selected ? AppColors.primary : AppColors.outline,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            opt.label(ar),
                            style: TextStyle(
                                fontSize: 14,
                                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                                color: selected ? AppColors.primary : AppColors.onSurface),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            if (_showError)
              Padding(
                padding: const EdgeInsets.only(top: 4, right: 4, left: 4),
                child: Text(
                  ar ? 'يرجى اختيار نتيجة الزيارة للمتابعة' : 'Please select a visit outcome to continue',
                  style: const TextStyle(fontSize: 12, color: AppColors.error),
                ),
              ),
            const SizedBox(height: 20),
            Text(ar ? 'ملاحظات (اختياري)' : 'NOTES (OPTIONAL)',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurfaceVariant,
                    letterSpacing: 0.6)),
            const SizedBox(height: 10),
            TextField(
              controller: _notesCtrl,
              maxLines: 5,
              textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
              decoration: InputDecoration(
                hintText: ar ? 'أضف ملاحظاتك حول هذه الزيارة...' : 'Add your notes about this visit...',
                filled: true,
                fillColor: AppColors.surfaceContainerLowest,
                contentPadding: const EdgeInsets.all(14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.primary, width: 2),
                ),
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
        bottomNavigationBar: Container(
          color: AppColors.surface,
          padding:
              EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.check, size: 18),
              label: Text(ar ? 'حفظ نتيجة الزيارة' : 'SAVE OUTCOME',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: child,
    );
  }
}
