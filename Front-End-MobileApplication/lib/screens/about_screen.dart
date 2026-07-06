import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  static const String _version = '1.0.0';

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;

    final features = ar
        ? const [
            ('إدارة العملاء والزيارات الميدانية', Icons.group_outlined),
            ('إنشاء فواتير بأمر صوتي مدعوم بالذكاء الاصطناعي', Icons.mic_none_outlined),
            ('اقتراحات منتجات ذكية أثناء بناء الفاتورة', Icons.auto_awesome_outlined),
            ('معاينة الفواتير وإرسالها كملف PDF', Icons.picture_as_pdf_outlined),
          ]
        : const [
            ('Manage customers and field visits', Icons.group_outlined),
            ('Build invoices with AI-powered voice commands', Icons.mic_none_outlined),
            ('Smart product suggestions while building invoices', Icons.auto_awesome_outlined),
            ('Preview and send invoices as PDF', Icons.picture_as_pdf_outlined),
          ];

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.primary),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            ar ? 'حول التطبيق' : 'About',
            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.asset('assets/icon/icon.png', fit: BoxFit.cover),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              ar ? 'إنتيلي سيلز' : 'IntelliSales',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              ar ? 'الإصدار $_version' : 'Version $_version',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
              ),
              child: Text(
                ar
                    ? 'رفيق مندوب المبيعات الميداني — يساعدك على متابعة العملاء وزياراتهم، وبناء الفواتير بسرعة، وزيادة المبيعات باقتراحات ذكية.'
                    : 'A companion app for field sales reps — track customers and visits, build invoices quickly, and boost sales with smart suggestions.',
                style: const TextStyle(fontSize: 14, height: 1.6, color: AppColors.onSurface),
              ),
            ),
            const SizedBox(height: 16),
            ...features.map(
              (f) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    Icon(f.$2, size: 20, color: AppColors.secondary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        f.$1,
                        style: const TextStyle(fontSize: 13.5, color: AppColors.onSurface),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '© 2024 ${ar ? 'إنتيلي سيلز' : 'IntelliSales'} — v$_version',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
