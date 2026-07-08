import 'api_client.dart';

/// دورة حياة الزيارة حسب العقد:
/// - POST /visits: إنشاء زيارة مخططة **بدون outcome** (مخطط الإنشاء الصارم
///   لا يقبله).
/// - PATCH /visits/:id/complete: إكمالها بنتيجة outcome إلزامية.
/// - PATCH /visits/:id/cancel: إلغاؤها بملاحظات اختيارية.
///
/// ملاحظة: خطة الزيارات الأسبوعية المعروضة في ActivityScreen (المخطط الذي
/// يضعه المدير حسب الأيام) لا يقابلها أي endpoint في عقد الباك اند الحالي
/// (فقط /visits المسطّحة) — لذا تبقى تلك الشاشة محلية حالياً. راجع
/// INTEGRATION_NOTES.md.
class VisitService {
  /// ينشئ زيارة مخططة ويرجع معرّفها (data.visit حسب العقد).
  static Future<String> create({
    required String customerId,
    required DateTime visitDate,
    String? purpose,
    String? notes,
    String? nextAction,
    DateTime? nextVisitDate,
    String? location,
  }) async {
    final res = await ApiClient.post(
      '/visits',
      body: {
        'customer': customerId,
        'visitDate': visitDate.toIso8601String(),
        'purpose': ?(purpose?.isNotEmpty == true ? purpose : null),
        'notes': ?(notes?.isNotEmpty == true ? notes : null),
        'nextAction': ?(nextAction?.isNotEmpty == true ? nextAction : null),
        'nextVisitDate': ?nextVisitDate?.toIso8601String(),
        'location': ?(location?.isNotEmpty == true ? location : null),
      },
    );
    final visit = res.entity('visit');
    return (visit['id'] ?? visit['_id'] ?? '').toString();
  }

  /// يكمل زيارة بنتيجتها — outcome إلزامي حسب العقد.
  static Future<void> complete(
    String visitId, {
    required String outcome,
    String? notes,
    String? nextAction,
    DateTime? nextVisitDate,
  }) async {
    await ApiClient.patch(
      '/visits/$visitId/complete',
      body: {
        'outcome': outcome,
        'notes': ?(notes?.isNotEmpty == true ? notes : null),
        'nextAction': ?(nextAction?.isNotEmpty == true ? nextAction : null),
        'nextVisitDate': ?nextVisitDate?.toIso8601String(),
      },
    );
  }

  /// يلغي زيارة مخططة (لم تتم) بملاحظات اختيارية.
  static Future<void> cancel(String visitId, {String? notes}) async {
    await ApiClient.patch(
      '/visits/$visitId/cancel',
      body: {'notes': ?(notes?.isNotEmpty == true ? notes : null)},
    );
  }

  /// مسار مركّب للاستخدام من شاشة نتيجة الزيارة: بما أن المخطط الأسبوعي
  /// محلي (لا endpoint له)، تُنشأ الزيارة على الباك اند لحظة تسجيل نتيجتها
  /// ثم تُكمل/تُلغى فوراً حسب النتيجة — بديل recordOutcome القديم الذي كان
  /// يرسل outcome في POST /visits مخالفاً للمخطط.
  static Future<void> recordOutcome({
    required String customerId,
    required DateTime visitDate,
    required String outcome,
    bool completed = true,
    String? notes,
  }) async {
    final id = await create(
      customerId: customerId,
      visitDate: visitDate,
      notes: notes,
    );
    if (id.isEmpty) {
      throw ApiException('استجابة غير متوقعة من الخادم (معرّف الزيارة مفقود)');
    }
    if (completed) {
      await complete(id, outcome: outcome, notes: notes);
    } else {
      await cancel(id, notes: notes);
    }
  }
}
