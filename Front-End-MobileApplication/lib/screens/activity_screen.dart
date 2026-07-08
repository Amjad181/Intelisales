import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/schedule_models.dart';
import '../widgets/profile_photo_picker.dart';
import 'visit_outcome_screen.dart';

class ActivityScreen extends StatefulWidget {
  final String? initialQuery;

  const ActivityScreen({super.key, this.initialQuery});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  late final WeeklySchedule _schedule;
  late final List<ScheduledVisit> _visits;
  late int _selectedWeekday;
  late bool _searching;
  late final TextEditingController _searchCtrl;
  late String _query;

  @override
  void initState() {
    super.initState();
    _schedule = buildSampleWeeklySchedule();
    _visits = buildScheduledVisits(_schedule);
    _query = widget.initialQuery ?? '';
    _searching = _query.isNotEmpty;
    _searchCtrl = TextEditingController(text: _query);

    _selectedWeekday = DateTime.now().weekday;
    if (_query.isNotEmpty) {
      final q = _query.toLowerCase();
      final match = _visits.where(
        (v) => v.line.tradeCenterName.toLowerCase().contains(q),
      );
      if (match.isNotEmpty) _selectedWeekday = match.first.line.weekday;
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<ScheduledVisit> _visitsForSelectedDay() {
    final dayVisits = _visits.where((v) => v.line.weekday == _selectedWeekday);
    if (_query.isEmpty) return dayVisits.toList();
    final q = _query.toLowerCase();
    return dayVisits
        .where((v) => v.line.tradeCenterName.toLowerCase().contains(q))
        .toList();
  }

  Future<void> _openOutcome(ScheduledVisit visit) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => VisitOutcomeScreen(visit: visit)),
    );
    if (mounted) setState(() {});
  }

  Future<void> _openDirections(ScheduledVisit visit, bool ar) async {
    final query = Uri.encodeComponent(
      '${visit.line.tradeCenterName}, ${visit.line.region}',
    );
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$query',
    );
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ar ? 'تعذر فتح تطبيق الخرائط' : 'Could not open the maps app',
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;

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
                  hintText: ar ? 'ابحث عن زيارة...' : 'Search visits...',
                  border: InputBorder.none,
                ),
              )
            : Row(
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
        actions: [
          IconButton(
            icon: Icon(
              _searching ? Icons.close : Icons.search,
              color: AppColors.primary,
            ),
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
      body: ListView(
        children: [
          // ── Weekly day strip (plan set by the manager — not editable here) ──
          Container(
            color: AppColors.surfaceContainerLowest,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      ar ? 'المخطط الأسبوعي' : 'Weekly Plan',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.onSurface,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _schedule.status.label(ar),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children:
                      (ar
                              ? weekDisplayOrder.reversed.toList()
                              : weekDisplayOrder)
                          .map((weekday) {
                            final labels = weekdayLabels[weekday]!;
                            final date = dateForWeekday(
                              _schedule.weekStart,
                              weekday,
                            );
                            final isSelected = weekday == _selectedWeekday;
                            return GestureDetector(
                              onTap: () =>
                                  setState(() => _selectedWeekday = weekday),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 46,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 8,
                                  horizontal: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primaryContainer
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: AppColors.primary.withValues(
                                              alpha: 0.25,
                                            ),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Column(
                                  children: [
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        ar
                                            ? weekdayShortLabelAr[weekday]!
                                            : labels.$1,
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: isSelected
                                              ? AppColors.onPrimaryContainer
                                              : AppColors.onSurfaceVariant,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${date.day}',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: isSelected
                                            ? FontWeight.w700
                                            : FontWeight.w400,
                                        color: isSelected
                                            ? AppColors.onPrimaryContainer
                                            : AppColors.onSurface,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          })
                          .toList(),
                ),
              ],
            ),
          ),

          // ── Timeline ─────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
            child: _DayVisits(
              visits: _visitsForSelectedDay(),
              ar: ar,
              onRecordOutcome: _openOutcome,
              onDirections: (v) => _openDirections(v, ar),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Visit list for the selected day ──────────────────────────────────────────

class _DayVisits extends StatelessWidget {
  final List<ScheduledVisit> visits;
  final bool ar;
  final ValueChanged<ScheduledVisit> onRecordOutcome;
  final ValueChanged<ScheduledVisit> onDirections;

  const _DayVisits({
    required this.visits,
    required this.ar,
    required this.onRecordOutcome,
    required this.onDirections,
  });

  @override
  Widget build(BuildContext context) {
    if (visits.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Text(
            ar
                ? 'لا توجد زيارات مجدولة في هذا اليوم'
                : 'No visits scheduled for this day',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return Stack(
      children: [
        Positioned(
          left: ar ? null : 19,
          right: ar ? 19 : null,
          top: 0,
          bottom: 0,
          child: Container(width: 2, color: AppColors.outlineVariant),
        ),
        Column(
          children: visits
              .map(
                (v) => _VisitCard(
                  visit: v,
                  ar: ar,
                  onRecordOutcome: () => onRecordOutcome(v),
                  onDirections: () => onDirections(v),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _VisitCard extends StatelessWidget {
  final ScheduledVisit visit;
  final bool ar;
  final VoidCallback onRecordOutcome;
  final VoidCallback onDirections;

  const _VisitCard({
    required this.visit,
    required this.ar,
    required this.onRecordOutcome,
    required this.onDirections,
  });

  static const _warning = Color(0xFFB25E00);

  (Color bg, Color fg, IconData icon) get _dotStyle {
    final outcome = visit.outcome;
    if (outcome == VisitOutcome.effective) {
      return (AppColors.tertiary, AppColors.onTertiary, Icons.check_circle);
    }
    if (outcome == VisitOutcome.notEffective) {
      return (_warning, Colors.white, Icons.remove_circle);
    }
    if (outcome == VisitOutcome.notCompleted) {
      return (AppColors.error, AppColors.onError, Icons.cancel);
    }
    if (visit.isToday) {
      return (
        AppColors.primaryContainer,
        AppColors.onPrimaryContainer,
        Icons.location_on,
      );
    }
    if (visit.isPast) {
      return (
        AppColors.errorContainer,
        AppColors.onErrorContainer,
        Icons.error_outline,
      );
    }
    return (
      AppColors.secondaryContainer,
      AppColors.onSecondaryContainer,
      Icons.schedule,
    );
  }

  (Color bg, Color fg, String label) get _badge {
    final outcome = visit.outcome;
    if (outcome != null) {
      final color = outcome == VisitOutcome.effective
          ? AppColors.tertiary
          : outcome == VisitOutcome.notEffective
          ? _warning
          : AppColors.error;
      return (color.withValues(alpha: 0.12), color, outcome.label(ar));
    }
    if (visit.isPast) {
      return (
        AppColors.errorContainer.withValues(alpha: 0.8),
        AppColors.onErrorContainer,
        ar ? 'بحاجة لتسجيل النتيجة' : 'Needs outcome',
      );
    }
    return (
      AppColors.secondary.withValues(alpha: 0.1),
      AppColors.secondary,
      ar ? 'مجدولة' : 'SCHEDULED',
    );
  }

  String get _timeRangeAr {
    final line = visit.line;
    if (line.estimatedStart == null) return '';
    final start = formatTimeOfDay(line.estimatedStart!, true);
    if (line.estimatedEnd == null) return start;
    return '$start - ${formatTimeOfDay(line.estimatedEnd!, true)}';
  }

  String get _timeRangeEn {
    final line = visit.line;
    if (line.estimatedStart == null) return '';
    final start = formatTimeOfDay(line.estimatedStart!, false);
    if (line.estimatedEnd == null) return start;
    return '$start - ${formatTimeOfDay(line.estimatedEnd!, false)}';
  }

  @override
  Widget build(BuildContext context) {
    final dot = _dotStyle;
    final badge = _badge;
    final line = visit.line;
    final canRecord = visit.isToday || visit.isPast;

    final dotWidget = Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: dot.$1,
        border: Border.all(color: AppColors.background, width: 3),
      ),
      child: Icon(dot.$3, color: dot.$2, size: 18),
    );

    final headerTexts = Column(
      crossAxisAlignment: ar
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: [
        Text(
          ar ? _timeRangeAr : _timeRangeEn,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.outline,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          line.tradeCenterName,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: AppColors.onSurface,
          ),
        ),
      ],
    );

    final badgeChip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: badge.$1,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        badge.$3,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: badge.$2,
        ),
      ),
    );

    final card = Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: visit.isToday && visit.outcome == null
              ? AppColors.primaryContainer
              : AppColors.outlineVariant.withValues(alpha: 0.4),
          width: visit.isToday && visit.outcome == null ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: ar ? [badgeChip, headerTexts] : [headerTexts, badgeChip],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.place_outlined,
                size: 14,
                color: AppColors.onSurfaceVariant,
              ),
              const SizedBox(width: 4),
              Text(
                line.region,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
            ],
          ),
          if (visit.notes.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              visit.notes,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              if (canRecord)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onRecordOutcome,
                    icon: Icon(
                      visit.outcome == null ? Icons.edit_note : Icons.edit,
                      size: 16,
                    ),
                    label: Text(
                      visit.outcome == null
                          ? (ar ? 'تسجيل نتيجة الزيارة' : 'Record Outcome')
                          : (ar ? 'تعديل النتيجة' : 'Edit Outcome'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              if (canRecord) const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onDirections,
                  icon: const Icon(Icons.directions_outlined, size: 16),
                  label: Text(
                    ar ? 'الاتجاهات' : 'Directions',
                    style: const TextStyle(fontSize: 13),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.onSurfaceVariant,
                    side: const BorderSide(color: AppColors.outline),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: ar
          ? [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: card,
                ),
              ),
              dotWidget,
            ]
          : [
              dotWidget,
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: card,
                ),
              ),
            ],
    );
  }
}
