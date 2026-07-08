import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/app_colors.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/secure_storage_service.dart';

void main() {
  runApp(const IntelliSalesApp());
}

// ── App-level locale state shared via InheritedWidget ────────────────────────

class AppLocale extends InheritedWidget {
  final bool isArabic;
  final VoidCallback toggleLanguage;
  final ValueChanged<bool> setArabic;

  const AppLocale({
    super.key,
    required this.isArabic,
    required this.toggleLanguage,
    required this.setArabic,
    required super.child,
  });

  static AppLocale of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppLocale>()!;

  @override
  bool updateShouldNotify(AppLocale old) => isArabic != old.isArabic;
}

// ── App-level user session state shared via InheritedWidget ──────────────────

class UserSession extends InheritedWidget {
  final String name;
  final String email;
  final String role;
  final bool isLoggedIn;
  final Uint8List? photo;
  final ValueChanged<String> setName;
  final ValueChanged<Uint8List?> setPhoto;
  final Future<AuthResult> Function(
    String email,
    String password, {
    bool rememberMe,
  })
  login;
  final Future<void> Function() logout;

  const UserSession({
    super.key,
    required this.name,
    required this.email,
    required this.role,
    required this.isLoggedIn,
    required this.photo,
    required this.setName,
    required this.setPhoto,
    required this.login,
    required this.logout,
    required super.child,
  });

  static UserSession of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<UserSession>()!;

  @override
  bool updateShouldNotify(UserSession old) =>
      name != old.name ||
      photo != old.photo ||
      email != old.email ||
      role != old.role ||
      isLoggedIn != old.isLoggedIn;
}

// ── Root App ─────────────────────────────────────────────────────────────────

class IntelliSalesApp extends StatefulWidget {
  const IntelliSalesApp({super.key});

  @override
  State<IntelliSalesApp> createState() => _IntelliSalesAppState();
}

class _IntelliSalesAppState extends State<IntelliSalesApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();

  bool _isArabic = true;
  String _userName = '';
  String _userEmail = '';
  String _userRole = '';
  bool _isLoggedIn = false;
  bool _restoringSession = true;
  Uint8List? _userPhoto;

  @override
  void initState() {
    super.initState();
    ApiClient.onSessionExpired = _forceLogout;
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final user = await AuthService.restoreSession();
    if (!mounted) return;
    setState(() {
      if (user != null) {
        _userName = user.name;
        _userEmail = user.email;
        _userRole = user.role;
        _isLoggedIn = true;
      }
      _restoringSession = false;
    });
    // تحقّق غير مُعطِّل عبر GET /auth/me: جلسة مرفوضة من الخادم تُنهى عبر
    // onSessionExpired تلقائياً؛ تعذّر الاتصال لا يمس الجلسة المحلية.
    if (user != null) await AuthService.verifySession();
  }

  Future<AuthResult> _login(
    String email,
    String password, {
    bool rememberMe = true,
  }) async {
    final result = await AuthService.login(
      email: email,
      password: password,
      rememberMe: rememberMe,
    );
    setState(() {
      _userName = result.user.name;
      _userEmail = result.user.email;
      _userRole = result.user.role;
      _isLoggedIn = true;
    });
    return result;
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (!mounted) return;
    setState(() {
      _userName = '';
      _userEmail = '';
      _userRole = '';
      _isLoggedIn = false;
      _userPhoto = null;
    });
  }

  /// يُستدعى من ApiClient عندما يفشل تجديد التوكن (جلسة منتهية فعلياً) —
  /// يمسح الجلسة ويعيد المستخدم لشاشة الدخول من أي مكان في التطبيق.
  Future<void> _forceLogout() async {
    await SecureStorageService.clear();
    if (!mounted) return;
    setState(() {
      _userName = '';
      _userEmail = '';
      _userRole = '';
      _isLoggedIn = false;
    });
    _navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  void _toggleLanguage() => setState(() => _isArabic = !_isArabic);
  void _setArabic(bool value) => setState(() => _isArabic = value);
  void _setUserName(String name) => setState(() => _userName = name);
  void _setUserPhoto(Uint8List? photo) => setState(() => _userPhoto = photo);

  ThemeData _buildTheme() {
    final base = GoogleFonts.cairoTextTheme(ThemeData.light().textTheme);
    return ThemeData(
      useMaterial3: true,
      textTheme: base,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: AppColors.primary,
        onPrimary: AppColors.onPrimary,
        primaryContainer: AppColors.primaryContainer,
        onPrimaryContainer: AppColors.onPrimaryContainer,
        secondary: AppColors.secondary,
        onSecondary: AppColors.onSecondary,
        secondaryContainer: AppColors.secondaryContainer,
        onSecondaryContainer: AppColors.onSecondaryContainer,
        tertiary: AppColors.tertiary,
        onTertiary: AppColors.onTertiary,
        tertiaryContainer: AppColors.tertiaryContainer,
        onTertiaryContainer: AppColors.onTertiaryContainer,
        error: AppColors.error,
        onError: AppColors.onError,
        errorContainer: AppColors.errorContainer,
        onErrorContainer: AppColors.onErrorContainer,
        surface: AppColors.surface,
        onSurface: AppColors.onSurface,
        onSurfaceVariant: AppColors.onSurfaceVariant,
        outline: AppColors.outline,
        outlineVariant: AppColors.outlineVariant,
        inverseSurface: AppColors.inverseSurface,
        onInverseSurface: AppColors.inverseOnSurface,
        inversePrimary: AppColors.inversePrimary,
        surfaceTint: Color(0xFF004EE8),
      ),
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: AppColors.outlineVariant.withValues(alpha: 0.4),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.secondary,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppLocale(
      isArabic: _isArabic,
      toggleLanguage: _toggleLanguage,
      setArabic: _setArabic,
      child: UserSession(
        name: _userName,
        email: _userEmail,
        role: _userRole,
        isLoggedIn: _isLoggedIn,
        photo: _userPhoto,
        setName: _setUserName,
        setPhoto: _setUserPhoto,
        login: _login,
        logout: _logout,
        child: MaterialApp(
          navigatorKey: _navigatorKey,
          title: 'IntelliSales',
          debugShowCheckedModeBanner: false,
          locale: _isArabic ? const Locale('ar') : const Locale('en'),
          theme: _buildTheme(),
          home: _restoringSession
              ? const _SplashScreen()
              : (_isLoggedIn ? const MainShell() : const LoginScreen()),
        ),
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
    );
  }
}
