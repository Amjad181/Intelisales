import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import 'main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _nameCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _rememberMe = false;
  bool _obscurePass = true;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    UserSession.of(context).setName(_nameCtrl.text.trim());
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainShell()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocale.of(context);
    final ar = loc.isArabic;

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Stack(
          children: [
            // Decorative background blobs
            Positioned(
              top: -100,
              right: -100,
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: 0.06),
                ),
              ),
            ),
            Positioned(
              bottom: -100,
              left: -100,
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.secondaryContainer.withValues(alpha: 0.25),
                ),
              ),
            ),
            // Main content
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Column(
                  children: [
                    const SizedBox(height: 48),
                    // Logo
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Image.asset('assets/icon/icon.png', fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      ar ? 'إنتيلي سيلز' : 'IntelliSales',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    if (ar)
                      const Text(
                        'IntelliSales',
                        style: TextStyle(fontSize: 14, color: AppColors.onSurfaceVariant),
                      ),
                    const SizedBox(height: 36),
                    // Login card
                    Container(
                      constraints: const BoxConstraints(maxWidth: 420),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.5)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            ar ? 'مرحباً بك مجدداً' : 'Welcome back',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.onSurface,
                            ),
                            textAlign: ar ? TextAlign.right : TextAlign.left,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ar
                                ? 'سجل دخولك لمتابعة مبيعاتك الميدانية'
                                : 'Sign in to track your field sales',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Representative name label
                          _Label(text: ar ? 'اسم المندوب' : 'Representative Name'),
                          const SizedBox(height: 8),
                          _InputField(
                            controller: _nameCtrl,
                            hint: ar ? 'أدخل اسمك' : 'Enter your name',
                            prefixIcon: Icons.person_outline,
                            keyboardType: TextInputType.name,
                            textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
                          ),
                          const SizedBox(height: 16),

                          // Password label row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: ar
                                ? [
                                    GestureDetector(
                                      onTap: () {},
                                      child: const Text(
                                        'نسيت كلمة المرور؟',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    const _Label(text: 'كلمة المرور'),
                                  ]
                                : [
                                    const _Label(text: 'Password'),
                                    GestureDetector(
                                      onTap: () {},
                                      child: const Text(
                                        'Forgot password?',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                          ),
                          const SizedBox(height: 8),
                          _InputField(
                            controller: _passCtrl,
                            hint: '••••••••',
                            prefixIcon: Icons.lock_outline,
                            obscureText: _obscurePass,
                            textDirection: TextDirection.ltr,
                            suffix: IconButton(
                              icon: Icon(
                                _obscurePass
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                color: AppColors.outline,
                                size: 20,
                              ),
                              onPressed: () =>
                                  setState(() => _obscurePass = !_obscurePass),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Remember me
                          Row(
                            children: ar
                                ? [
                                    Checkbox(
                                      value: _rememberMe,
                                      onChanged: (v) =>
                                          setState(() => _rememberMe = v!),
                                      activeColor: AppColors.primary,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(4)),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'تذكرني على هذا الجهاز',
                                      style: TextStyle(
                                          fontSize: 14,
                                          color: AppColors.onSurfaceVariant),
                                    ),
                                  ]
                                : [
                                    Checkbox(
                                      value: _rememberMe,
                                      onChanged: (v) =>
                                          setState(() => _rememberMe = v!),
                                      activeColor: AppColors.primary,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(4)),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Remember me on this device',
                                      style: TextStyle(
                                          fontSize: 14,
                                          color: AppColors.onSurfaceVariant),
                                    ),
                                  ],
                          ),
                          const SizedBox(height: 20),

                          // Login button
                          SizedBox(
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _login,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              child: _loading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2),
                                    )
                                  : Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          ar ? 'تسجيل الدخول' : 'Sign In',
                                          style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600),
                                        ),
                                        const SizedBox(width: 8),
                                        Icon(
                                          ar
                                              ? Icons.arrow_back
                                              : Icons.arrow_forward,
                                          size: 20,
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Contact admin
                    RichText(
                      text: TextSpan(
                        text: ar ? 'ليس لديك حساب؟ ' : "Don't have an account? ",
                        style: const TextStyle(
                            fontSize: 14, color: AppColors.onSurfaceVariant),
                        children: [
                          WidgetSpan(
                            child: GestureDetector(
                              onTap: () {},
                              child: Text(
                                ar ? 'اتصل بمدير النظام' : 'Contact Admin',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Footer
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.language,
                            size: 16, color: AppColors.onSurfaceVariant),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: loc.toggleLanguage,
                          child: Text(
                            ar ? 'العربية' : 'Arabic',
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.onSurfaceVariant),
                          ),
                        ),
                        const SizedBox(width: 20),
                        const Icon(Icons.help_outline,
                            size: 16, color: AppColors.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          ar ? 'مركز المساعدة' : 'Help Center',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.onSurfaceVariant),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '© 2024 IntelliSales. ${ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}',
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared sub-widgets ────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.onSurfaceVariant,
        letterSpacing: 0.4,
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData prefixIcon;
  final TextInputType keyboardType;
  final bool obscureText;
  final TextDirection textDirection;
  final Widget? suffix;

  const _InputField({
    required this.controller,
    required this.hint,
    required this.prefixIcon,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.textDirection = TextDirection.ltr,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Icon(prefixIcon, color: AppColors.outline, size: 20),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              obscureText: obscureText,
              textDirection: textDirection,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle:
                    const TextStyle(color: AppColors.outlineVariant, fontSize: 15),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                isDense: true,
              ),
              style: const TextStyle(color: AppColors.onSurface, fontSize: 15),
            ),
          ),
          ?suffix,
        ],
      ),
    );
  }
}
