import 'api_client.dart';
import 'secure_storage_service.dart';

/// بيانات المستخدم الحالي بعد تسجيل الدخول، كما يرجعها الباك اند.
class AuthUser {
  final String id;
  final String name;
  final String email;
  final String role;

  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: (json['id'] ?? json['_id'] ?? '').toString(),
    name: (json['name'] as String?) ?? '',
    email: (json['email'] as String?) ?? '',
    role: (json['role'] as String?) ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
  };
}

class AuthResult {
  final AuthUser user;
  final String accessToken;
  final String refreshToken;

  const AuthResult({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });
}

/// تسجيل الدخول/الخروج والجلسة — تُبنى فوق ApiClient وتخزّن النتيجة في
/// SecureStorageService. لا يوجد أي مسار وهمي هنا: أي فشل بالاتصال بالباك
/// اند يظهر كخطأ حقيقي للمستخدم.
class AuthService {
  /// POST /auth/login — يفسّر data.user/accessToken/refreshToken حسب العقد.
  /// [rememberMe] يحدد إن كانت الجلسة تُحفظ دائماً (تخزين آمن) أو تزول
  /// بإغلاق التطبيق (ذاكرة فقط).
  static Future<AuthResult> login({
    required String email,
    required String password,
    bool rememberMe = true,
  }) async {
    final res = await ApiClient.post(
      '/auth/login',
      body: {'email': email, 'password': password},
    );
    final data = res.dataAsMap();
    final user = AuthUser.fromJson(
      (data['user'] as Map<String, dynamic>?) ?? const {},
    );
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    if (accessToken == null || refreshToken == null) {
      throw ApiException('استجابة غير متوقعة من الخادم (توكنات الدخول مفقودة)');
    }

    await SecureStorageService.setPersistent(rememberMe);
    await SecureStorageService.saveSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: user.toJson(),
    );

    return AuthResult(
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  /// GET /auth/me — العقد يرجع الكيان متداخلاً تحت data.user.
  static Future<AuthUser> me() async {
    final res = await ApiClient.get('/auth/me');
    return AuthUser.fromJson(res.entity('user'));
  }

  /// تحقّق غير مُعطِّل من صلاحية الجلسة عند الإقلاع: إن رفض الخادم الجلسة
  /// فسيتكفل ApiClient.onSessionExpired بإعادة المستخدم لشاشة الدخول؛
  /// وإن تعذّر الاتصال تبقى الجلسة المحلية كما هي.
  static Future<void> verifySession() async {
    try {
      final user = await me();
      await SecureStorageService.saveUser(user.toJson());
    } on ApiException {
      // فشل شبكة أو خطأ خادم — انتهاء الجلسة الفعلي يعالجه onSessionExpired
    }
  }

  static Future<void> logout() async {
    try {
      await ApiClient.post('/auth/logout');
    } catch (_) {
      // نمسح الجلسة محلياً بغض النظر عن نجاح نداء الخادم
    }
    await SecureStorageService.clear();
  }

  /// يحاول استرجاع جلسة محفوظة عند إقلاع التطبيق (بدون نداء شبكة إجباري):
  /// يقرأ المستخدم المخزَّن محلياً إن وُجد توكن دخول.
  static Future<AuthUser?> restoreSession() async {
    final token = await SecureStorageService.accessToken;
    if (token == null) return null;
    final storedUser = await SecureStorageService.user;
    if (storedUser == null) return null;
    return AuthUser.fromJson(storedUser);
  }
}
