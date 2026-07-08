import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// إعدادات التطبيق وقت الترجمة — تُمرَّر عبر --dart-define دون تعديل المصدر:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:5000/api/v1  (جهاز حقيقي)
///   flutter run --dart-define=DEMO_MODE=true                                (عرض تجريبي بلا باك اند)
///
/// راجع INTEGRATION_NOTES.md لتفاصيل تشغيل الباك اند (HOST=0.0.0.0 للجهاز الحقيقي).
class ApiConfig {
  /// عنوان الـ API الأساسي من --dart-define=API_BASE_URL. عند عدم تمريره
  /// تُستخدم القيم الافتراضية الآمنة الموثقة في العقد:
  /// - محاكي أندرويد: http://10.0.2.2:5000/api/v1
  /// - محاكي iOS / سطح مكتب / ويب: http://localhost:5000/api/v1
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_definedBaseUrl.isNotEmpty) return _definedBaseUrl;
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api/v1';
    }
    return 'http://localhost:5000/api/v1';
  }

  /// وضع العرض التجريبي الصريح (مطفأ افتراضياً): فقط عند تفعيله يُسمح
  /// للشاشات بعرض بيانات محلية عند فشل الباك اند (مع شريط تنبيه ظاهر).
  /// في وضع التكامل الافتراضي يُعرض خطأ/إعادة محاولة بدلاً من أي بيانات وهمية.
  static const bool demoMode = bool.fromEnvironment('DEMO_MODE');
}
