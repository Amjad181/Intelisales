import 'package:flutter/material.dart';

// ── Weekly visit schedule set by the manager (read-only for the rep) ────────
//
// Mirrors the "Add visit" form on the manager's admin dashboard:
// week start date, status, assigned rep, created by, and per-day schedule
// lines (day of week -> region + trade center + estimated visit time).

enum ScheduleStatus { planned, confirmed, completed }

extension ScheduleStatusLabel on ScheduleStatus {
  String label(bool ar) => switch (this) {
        ScheduleStatus.planned => ar ? 'مخطط' : 'Planned',
        ScheduleStatus.confirmed => ar ? 'معتمد' : 'Confirmed',
        ScheduleStatus.completed => ar ? 'مكتمل' : 'Completed',
      };
}

/// One line of the weekly plan: a single day, with the place the rep must
/// visit that day. `weekday` follows [DateTime.weekday] (Monday = 1 .. Sunday = 7).
class ScheduleLine {
  final String id;
  final int weekday;
  final String region;
  final String tradeCenterName;
  final String? customerId;
  final TimeOfDay? estimatedStart;
  final TimeOfDay? estimatedEnd;

  const ScheduleLine({
    required this.id,
    required this.weekday,
    required this.region,
    required this.tradeCenterName,
    this.customerId,
    this.estimatedStart,
    this.estimatedEnd,
  });
}

class WeeklySchedule {
  final String id;
  final DateTime weekStart;
  final ScheduleStatus status;
  final String repName;
  final String createdBy;
  final List<ScheduleLine> lines;

  const WeeklySchedule({
    required this.id,
    required this.weekStart,
    required this.status,
    required this.repName,
    required this.createdBy,
    required this.lines,
  });
}

/// What actually happened when the rep visited (or didn't).
enum VisitOutcome { effective, notEffective, notCompleted }

extension VisitOutcomeLabel on VisitOutcome {
  String label(bool ar) => switch (this) {
        VisitOutcome.effective => ar ? 'فعّالة (تم البيع)' : 'Effective (sale made)',
        VisitOutcome.notEffective =>
          ar ? 'غير فعّالة (لم يشترِ الزبون)' : 'Not effective (no purchase)',
        VisitOutcome.notCompleted => ar ? 'لم تتم الزيارة' : 'Visit not completed',
      };

  IconData get icon => switch (this) {
        VisitOutcome.effective => Icons.check_circle,
        VisitOutcome.notEffective => Icons.remove_circle_outline,
        VisitOutcome.notCompleted => Icons.cancel_outlined,
      };
}

/// A concrete occurrence of a [ScheduleLine] on a specific calendar date,
/// carrying the rep's recorded outcome. This is the only part of a visit
/// the rep is allowed to edit — the plan itself (day/region/place/time)
/// comes from the manager and is never mutated here.
class ScheduledVisit {
  final String id;
  final ScheduleLine line;
  final DateTime date;
  VisitOutcome? outcome;
  String notes;

  ScheduledVisit({
    required this.id,
    required this.line,
    required this.date,
    this.outcome,
    this.notes = '',
  });

  bool get isToday {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  bool get isPast {
    final today = DateTime.now();
    final d0 = DateTime(today.year, today.month, today.day);
    final v0 = DateTime(date.year, date.month, date.day);
    return v0.isBefore(d0);
  }
}

String formatTimeOfDay(TimeOfDay t, bool ar) {
  final hour = t.hourOfPeriod == 0 ? 12 : t.hourOfPeriod;
  final minute = t.minute.toString().padLeft(2, '0');
  final period = t.period == DayPeriod.am
      ? (ar ? 'ص' : 'AM')
      : (ar ? 'م' : 'PM');
  return '$hour:$minute $period';
}

// ── Day-of-week helpers (week displayed Sunday -> Saturday) ─────────────────

const List<int> weekDisplayOrder = [7, 1, 2, 3, 4, 5, 6]; // Sun..Sat

const Map<int, (String, String)> weekdayLabels = {
  1: ('MON', 'الإثنين'),
  2: ('TUE', 'الثلاثاء'),
  3: ('WED', 'الأربعاء'),
  4: ('THU', 'الخميس'),
  5: ('FRI', 'الجمعة'),
  6: ('SAT', 'السبت'),
  7: ('SUN', 'الأحد'),
};

/// Short Arabic day labels for tight UI spots (e.g. the weekly day strip).
/// These are curated by hand rather than truncated from [weekdayLabels],
/// since blindly slicing the first few characters off some Arabic day names
/// (e.g. "الأحد" and "الأربعاء") produces identical, unreadable prefixes.
const Map<int, String> weekdayShortLabelAr = {
  1: 'إثنين',
  2: 'ثلاثاء',
  3: 'أربعاء',
  4: 'خميس',
  5: 'جمعة',
  6: 'سبت',
  7: 'أحد',
};

DateTime _mostRecentSunday(DateTime from) {
  final offsetFromSunday = from.weekday == 7 ? 0 : from.weekday;
  final d = DateTime(from.year, from.month, from.day);
  return d.subtract(Duration(days: offsetFromSunday));
}

DateTime dateForWeekday(DateTime weekStart, int weekday) {
  final offsetFromSunday = weekday == 7 ? 0 : weekday;
  return weekStart.add(Duration(days: offsetFromSunday));
}

List<ScheduledVisit> buildScheduledVisits(WeeklySchedule schedule) {
  return schedule.lines
      .map((line) => ScheduledVisit(
            id: 'sv-${line.id}',
            line: line,
            date: dateForWeekday(schedule.weekStart, line.weekday),
          ))
      .toList()
    ..sort((a, b) => a.date.compareTo(b.date));
}

// ── Sample data (stand-in for the schedule pulled from the manager's backend) ─

WeeklySchedule buildSampleWeeklySchedule() {
  final weekStart = _mostRecentSunday(DateTime.now());
  final today = DateTime.now().weekday;

  return WeeklySchedule(
    id: 'WS-1',
    weekStart: weekStart,
    status: ScheduleStatus.confirmed,
    repName: 'Ahmed Salah',
    createdBy: 'Ahmed Salah',
    lines: [
      ScheduleLine(
        id: 'L1',
        weekday: 7, // Sunday
        region: 'Cairo',
        tradeCenterName: 'City Mall',
        estimatedStart: const TimeOfDay(hour: 9, minute: 0),
        estimatedEnd: const TimeOfDay(hour: 10, minute: 0),
      ),
      ScheduleLine(
        id: 'L2',
        weekday: 1, // Monday
        region: 'Giza',
        tradeCenterName: 'Green Valley Bistro',
        estimatedStart: const TimeOfDay(hour: 11, minute: 30),
        estimatedEnd: const TimeOfDay(hour: 12, minute: 30),
      ),
      ScheduleLine(
        id: 'L3',
        weekday: 3, // Wednesday
        region: 'Cairo',
        tradeCenterName: 'Northside Hospital Pharmacy',
        estimatedStart: const TimeOfDay(hour: 10, minute: 0),
        estimatedEnd: const TimeOfDay(hour: 11, minute: 0),
      ),
      ScheduleLine(
        id: 'L4',
        weekday: 4, // Thursday
        region: 'Alexandria',
        tradeCenterName: 'Urban Wellness Collective',
        estimatedStart: const TimeOfDay(hour: 14, minute: 0),
        estimatedEnd: const TimeOfDay(hour: 15, minute: 0),
      ),
      // Always guarantee a visit for "today" so the app is testable any day.
      ScheduleLine(
        id: 'L-today',
        weekday: today,
        region: 'Cairo',
        tradeCenterName: 'Downtown Care Center',
        estimatedStart: const TimeOfDay(hour: 13, minute: 0),
        estimatedEnd: const TimeOfDay(hour: 14, minute: 0),
      ),
    ],
  );
}
