import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/app_colors.dart';
import 'screens/login_screen.dart';

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
  final Uint8List? photo;
  final ValueChanged<String> setName;
  final ValueChanged<Uint8List?> setPhoto;

  const UserSession({
    super.key,
    required this.name,
    required this.photo,
    required this.setName,
    required this.setPhoto,
    required super.child,
  });

  static UserSession of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<UserSession>()!;

  @override
  bool updateShouldNotify(UserSession old) =>
      name != old.name || photo != old.photo;
}

// ── Root App ─────────────────────────────────────────────────────────────────

class IntelliSalesApp extends StatefulWidget {
  const IntelliSalesApp({super.key});

  @override
  State<IntelliSalesApp> createState() => _IntelliSalesAppState();
}

class _IntelliSalesAppState extends State<IntelliSalesApp> {
  bool _isArabic = true;
  String _userName = '';
  Uint8List? _userPhoto;

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
          side: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
        photo: _userPhoto,
        setName: _setUserName,
        setPhoto: _setUserPhoto,
        child: MaterialApp(
          title: 'IntelliSales',
          debugShowCheckedModeBanner: false,
          locale: _isArabic ? const Locale('ar') : const Locale('en'),
          theme: _buildTheme(),
          home: const LoginScreen(),
        ),
      ),
    );
  }
}
