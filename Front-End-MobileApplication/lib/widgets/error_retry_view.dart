import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// حالة "تعذّر الاتصال بالخادم" الموحّدة: رسالة الخطأ + زر إعادة محاولة.
/// تُعرض بدل القوائم في وضع التكامل عند فشل الباك اند — مختلفة بصرياً
/// وبوضوح عن حالة "لا توجد نتائج" الفارغة (بوابة تحقق المرحلة 4).
class ErrorRetryView extends StatelessWidget {
  final String message;
  final bool ar;
  final VoidCallback onRetry;

  const ErrorRetryView({
    super.key,
    required this.message,
    required this.ar,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.errorContainer.withValues(alpha: 0.3),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_outlined,
                size: 30,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              ar ? 'تعذّر الاتصال بالخادم' : 'Could not reach the server',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: Text(ar ? 'إعادة المحاولة' : 'Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
