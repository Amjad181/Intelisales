import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// شريط تنبيه صغير يظهر أعلى الشاشة عندما يتعذّر الوصول للباك اند وتُعرض
/// بيانات تجريبية محلية بدلاً منها، حتى لا يظن المستخدم أنها بيانات حقيقية.
class DemoDataBanner extends StatelessWidget {
  final bool ar;

  const DemoDataBanner({super.key, required this.ar});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.secondaryContainer.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.cloud_off_outlined,
            size: 16,
            color: AppColors.onSecondaryContainer,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              ar
                  ? 'تعذّر الاتصال بالخادم — تُعرض بيانات تجريبية'
                  : 'Server unreachable — showing demo data',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.onSecondaryContainer,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
