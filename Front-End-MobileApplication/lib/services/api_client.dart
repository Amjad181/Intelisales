import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'secure_storage_service.dart';

/// خطأ موحّد لكل فشل في نداء الباك اند — رسالة جاهزة للعرض للمستخدم،
/// مع أخطاء التحقق الحقلية إن وُجدت (errors[]).
class ApiException implements Exception {
  final String message;
  final List<dynamic>? errors;
  final int? statusCode;

  ApiException(this.message, {this.errors, this.statusCode});

  @override
  String toString() => message;
}

/// نموذج ترقيم الصفحات كما يرجعه الباك اند أعلى استجابات القوائم.
class Pagination {
  final int page;
  final int limit;
  final int total;
  final int pages;

  const Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) => Pagination(
    page: (json['page'] as num?)?.toInt() ?? 1,
    limit: (json['limit'] as num?)?.toInt() ?? 0,
    total: (json['total'] as num?)?.toInt() ?? 0,
    pages: (json['pages'] as num?)?.toInt() ?? 1,
  );
}

/// نتيجة قائمة مُرقّمة: العناصر + pagination/count العلويين إن وُجدا.
class PagedResult<T> {
  final List<T> items;
  final Pagination? pagination;
  final int? count;

  const PagedResult({required this.items, this.pagination, this.count});
}

/// الشكل الموحّد لاستجابة الباك اند: success/message/data + count/pagination
/// الاختياريين للقوائم المُرقّمة.
class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;
  final int? count;
  final Map<String, dynamic>? pagination;
  final List<dynamic>? errors;

  const ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.count,
    this.pagination,
    this.errors,
  });
}

/// مستخرجات مُنمّطة لعقد الباك اند — ترمي ApiException بوصف واضح عند مخالفة
/// الشكل المتوقع بدل الانهيار على cast غير آمن (Phase 3 من خطة التكامل).
extension ApiResponseExtractors on ApiResponse {
  /// data ككائن (خريطة). يُستخدم للاستجابات المفردة.
  Map<String, dynamic> dataAsMap() {
    final d = data;
    if (d is Map<String, dynamic>) return d;
    throw ApiException('استجابة غير متوقعة من الخادم (data ليست كائناً)');
  }

  /// data كقائمة. يُستخدم لاستجابات القوائم حيث data هي القائمة نفسها.
  List<dynamic> dataAsList() {
    final d = data;
    if (d == null) return const [];
    if (d is List) return d;
    throw ApiException('استجابة غير متوقعة من الخادم (data ليست قائمة)');
  }

  /// الكيان المتداخل تحت data حسب العقد:
  /// data.customer / data.product / data.priceList / data.user /
  /// data.invoice / data.visit / data.summary ...
  Map<String, dynamic> entity(String key) {
    final e = dataAsMap()[key];
    if (e is Map<String, dynamic>) return e;
    throw ApiException('استجابة غير متوقعة من الخادم (data.$key مفقود)');
  }

  /// يحوّل قائمة data إلى نتيجة مُرقّمة منمّطة.
  PagedResult<T> pagedList<T>(T Function(Map<String, dynamic>) fromApi) {
    final items = dataAsList()
        .whereType<Map<String, dynamic>>()
        .map(fromApi)
        .toList();
    return PagedResult<T>(
      items: items,
      pagination: pagination != null ? Pagination.fromJson(pagination!) : null,
      count: count,
    );
  }
}

/// عميل HTTP مركزي لكل نداءات الباك اند: يرفق Authorization: Bearer، يفكّ
/// شكل الاستجابة الموحّد، يجدّد التوكنات تلقائياً مرة واحدة عند 401 (بقفل
/// واحد يمنع تجديدات متوازية)، ويدعم استقبال bytes ثنائية (استثناء PDF).
class ApiClient {
  static const _timeout = Duration(seconds: 15);

  /// يُستدعى عند تعذّر تجديد الجلسة (Refresh Token مرفوض من الخادم) — يُربط
  /// بتسجيل خروج المستخدم من main.dart عند تهيئة التطبيق.
  static Future<void> Function()? onSessionExpired;

  static Uri _uri(String path, [Map<String, String>? query]) {
    final clean = path.startsWith('/') ? path : '/$path';
    return Uri.parse(
      '${ApiConfig.baseUrl}$clean',
    ).replace(queryParameters: (query == null || query.isEmpty) ? null : query);
  }

  static Future<Map<String, String>> _headers() async {
    final headers = {'Content-Type': 'application/json; charset=utf-8'};
    final token = await SecureStorageService.accessToken;
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  static Future<ApiResponse> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  static Future<ApiResponse> post(String path, {Map<String, dynamic>? body}) =>
      _send('POST', path, body: body);

  static Future<ApiResponse> patch(String path, {Map<String, dynamic>? body}) =>
      _send('PATCH', path, body: body);

  static Future<ApiResponse> delete(String path) => _send('DELETE', path);

  /// لجلب محتوى ثنائي (PDF الفاتورة). حسب استثناء العقد: النجاح
  /// application/pdf، والخطأ يبقى JSON عادياً.
  static Future<Uint8List> getBytes(String path) async {
    final uri = _uri(path);
    http.Response res;
    try {
      res = await _request('GET', uri, headers: await _headers());
    } catch (_) {
      throw ApiException('تعذّر الاتصال بالخادم');
    }

    if (res.statusCode == 401) {
      final retried = await _retryAfterRefresh('GET', uri, null);
      if (retried != null) res = retried;
    }
    return _extractBytes(res);
  }

  static Uint8List _extractBytes(http.Response res) {
    final contentType = res.headers['content-type'] ?? '';
    if (contentType.contains('application/pdf')) return res.bodyBytes;
    final parsed = _parseBody(res);
    throw ApiException(
      parsed.message,
      errors: parsed.errors,
      statusCode: res.statusCode,
    );
  }

  static Future<ApiResponse> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
  }) async {
    final uri = _uri(path, query);
    http.Response res;
    try {
      res = await _request(method, uri, headers: await _headers(), body: body);
    } catch (_) {
      throw ApiException('تعذّر الاتصال بالخادم');
    }

    if (res.statusCode == 401) {
      final retried = await _retryAfterRefresh(method, uri, body);
      if (retried != null) res = retried;
    }

    final parsed = _parseBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success) {
      return parsed;
    }
    throw ApiException(
      parsed.message,
      errors: parsed.errors,
      statusCode: res.statusCode,
    );
  }

  static Future<http.Response> _request(
    String method,
    Uri uri, {
    required Map<String, String> headers,
    Map<String, dynamic>? body,
  }) {
    final encodedBody = body != null ? utf8.encode(json.encode(body)) : null;
    switch (method) {
      case 'GET':
        return http.get(uri, headers: headers).timeout(_timeout);
      case 'POST':
        return http
            .post(uri, headers: headers, body: encodedBody)
            .timeout(_timeout);
      case 'PATCH':
        return http
            .patch(uri, headers: headers, body: encodedBody)
            .timeout(_timeout);
      case 'DELETE':
        return http.delete(uri, headers: headers).timeout(_timeout);
      default:
        throw ArgumentError('Unsupported method $method');
    }
  }

  /// يحاول تجديد التوكنات مرة واحدة ثم يعيد الطلب الأصلي. يرجع null إذا
  /// تعذّر التجديد. تسجيل الخروج يحدث فقط عندما يرفض الخادم refreshToken
  /// فعلياً — تعطّل الشبكة أثناء التجديد لا يُسقط الجلسة.
  static Future<http.Response?> _retryAfterRefresh(
    String method,
    Uri uri,
    Map<String, dynamic>? body,
  ) async {
    final result = await _refreshTokens();
    if (result == _RefreshResult.rejected) {
      await onSessionExpired?.call();
      return null;
    }
    if (result == _RefreshResult.network) return null;
    try {
      return await _request(method, uri, headers: await _headers(), body: body);
    } catch (_) {
      return null;
    }
  }

  /// قفل تجديد واحد: طلبات 401 المتزامنة تنتظر نفس عملية التجديد بدل إطلاق
  /// تجديدات متوازية (الباك اند يدوّر refreshToken فالتوازي يبطل الجلسة).
  static Future<_RefreshResult>? _refreshInFlight;

  static Future<_RefreshResult> _refreshTokens() {
    return _refreshInFlight ??= _doRefresh().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  static Future<_RefreshResult> _doRefresh() async {
    final refreshToken = await SecureStorageService.refreshToken;
    if (refreshToken == null) return _RefreshResult.rejected;
    http.Response res;
    try {
      res = await http
          .post(
            _uri('/auth/refresh-token'),
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: json.encode({'refreshToken': refreshToken}),
          )
          .timeout(_timeout);
    } catch (_) {
      // الباك اند غير متاح — لا نُسقط الجلسة، يظهر خطأ اتصال للمستخدم
      return _RefreshResult.network;
    }

    final parsed = _parseBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success) {
      // العقد: /auth/refresh-token يرجع user وaccessToken وrefreshToken
      // مُدوَّرين — تُحفظ القيم المُعادة كلها (Phase 2 من خطة التكامل).
      final data = parsed.data;
      if (data is Map<String, dynamic>) {
        final newAccessToken = data['accessToken'] as String?;
        final newRefreshToken = data['refreshToken'] as String?;
        final user = data['user'];
        if (newAccessToken != null && newRefreshToken != null) {
          await SecureStorageService.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );
          if (user is Map<String, dynamic>) {
            await SecureStorageService.saveUser(user);
          }
          return _RefreshResult.refreshed;
        }
      }
    }
    return _RefreshResult.rejected;
  }

  static ApiResponse _parseBody(http.Response res) {
    Map<String, dynamic>? decoded;
    try {
      decoded =
          json.decode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>?;
    } catch (_) {
      decoded = null;
    }
    if (decoded == null) {
      return const ApiResponse(
        success: false,
        message: 'تعذّر الاتصال بالخادم',
      );
    }
    return ApiResponse(
      success: decoded['success'] == true,
      message: (decoded['message'] as String?) ?? 'حدث خطأ غير متوقع',
      data: decoded['data'],
      count: decoded['count'] as int?,
      pagination: decoded['pagination'] as Map<String, dynamic>?,
      errors: decoded['errors'] as List<dynamic>?,
    );
  }
}

enum _RefreshResult { refreshed, rejected, network }
