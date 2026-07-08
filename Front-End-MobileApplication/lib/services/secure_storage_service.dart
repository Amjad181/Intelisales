import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// تخزين آمن لبيانات الجلسة: التوكنات وبيانات المستخدم الحالي.
///
/// يدعم وضعين حسب "تذكرني" في شاشة الدخول:
/// - persistent (الافتراضي): يُكتب في التخزين الآمن ويبقى بعد إغلاق التطبيق.
/// - غير persistent: تُحفظ الجلسة في الذاكرة فقط وتزول بإغلاق التطبيق.
class SecureStorageService {
  static const _storage = FlutterSecureStorage();

  static const _accessTokenKey = 'intellisales_access_token';
  static const _refreshTokenKey = 'intellisales_refresh_token';
  static const _userKey = 'intellisales_user';

  static bool _persistent = true;
  static final Map<String, String> _memory = {};

  /// تُستدعى عند تسجيل الدخول حسب خيار "تذكرني". عند التحويل لوضع الذاكرة
  /// يُمسح أي أثر سابق من التخزين الدائم.
  static Future<void> setPersistent(bool persistent) async {
    _persistent = persistent;
    if (!persistent) {
      await _storage.delete(key: _accessTokenKey);
      await _storage.delete(key: _refreshTokenKey);
      await _storage.delete(key: _userKey);
    }
  }

  static Future<void> _write(String key, String value) async {
    if (_persistent) {
      await _storage.write(key: key, value: value);
    } else {
      _memory[key] = value;
    }
  }

  static Future<String?> _read(String key) async {
    if (_persistent) return _storage.read(key: key);
    return _memory[key];
  }

  static Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required Map<String, dynamic> user,
  }) async {
    await Future.wait([
      _write(_accessTokenKey, accessToken),
      _write(_refreshTokenKey, refreshToken),
      _write(_userKey, json.encode(user)),
    ]);
  }

  /// يحفظ زوج التوكنات المُدوَّر من /auth/refresh-token دفعة واحدة —
  /// الباك اند يبطل refreshToken القديم فلا يجوز حفظ أحدهما دون الآخر.
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _write(_accessTokenKey, accessToken),
      _write(_refreshTokenKey, refreshToken),
    ]);
  }

  static Future<void> saveUser(Map<String, dynamic> user) =>
      _write(_userKey, json.encode(user));

  static Future<String?> get accessToken => _read(_accessTokenKey);

  static Future<String?> get refreshToken => _read(_refreshTokenKey);

  static Future<Map<String, dynamic>?> get user async {
    final raw = await _read(_userKey);
    if (raw == null) return null;
    return json.decode(raw) as Map<String, dynamic>;
  }

  static Future<void> clear() async {
    _memory.clear();
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userKey),
    ]);
  }
}
