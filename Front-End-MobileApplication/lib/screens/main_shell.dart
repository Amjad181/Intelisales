import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import 'dashboard_screen.dart';
import 'customers_screen.dart';
import 'activity_screen.dart';
import 'invoices_screen.dart';
import 'about_screen.dart';
import 'login_screen.dart';
import '../widgets/profile_photo_picker.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  static MainShellState? of(BuildContext context) =>
      context.findAncestorStateOfType<MainShellState>();

  @override
  State<MainShell> createState() => MainShellState();
}

class MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  String? _invoicesFilter;
  String? _activityQuery;

  void goTo(int index) => setState(() {
        _currentIndex = index;
        if (index == 3) _invoicesFilter = null;
        if (index == 2) _activityQuery = null;
      });

  void goToInvoices(String filter) => setState(() {
        _currentIndex = 3;
        _invoicesFilter = filter;
      });

  void goToActivity({String? searchQuery}) => setState(() {
        _currentIndex = 2;
        _activityQuery = searchQuery;
      });

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;

    final screens = [
      const DashboardScreen(),
      const CustomersScreen(),
      ActivityScreen(key: ValueKey(_activityQuery), initialQuery: _activityQuery),
      InvoicesScreen(
          key: ValueKey(_invoicesFilter), initialFilter: _invoicesFilter),
      _MoreScreen(),
    ];

    final labels = ar
        ? ['الرئيسية', 'العملاء', 'النشاط', 'الفواتير', 'المزيد']
        : ['Home', 'Customers', 'Activity', 'Invoices', 'More'];

    final icons = [
      Icons.home_outlined,
      Icons.group_outlined,
      Icons.assignment_outlined,
      Icons.receipt_long_outlined,
      Icons.menu,
    ];

    final activeIcons = [
      Icons.home,
      Icons.group,
      Icons.assignment,
      Icons.receipt_long,
      Icons.menu,
    ];

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: screens,
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.secondary,
          backgroundColor: AppColors.surface,
          type: BottomNavigationBarType.fixed,
          elevation: 8,
          selectedLabelStyle:
              const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: List.generate(
            5,
            (i) => BottomNavigationBarItem(
              icon: Icon(icons[i]),
              activeIcon: Icon(activeIcons[i]),
              label: labels[i],
            ),
          ),
        ),
      ),
    );
  }
}

// ── More / Settings tab ───────────────────────────────────────────────────────

class _MoreScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final loc = AppLocale.of(context);
    final ar = loc.isArabic;
    final userName = UserSession.of(context).name;
    final displayName =
        userName.isEmpty ? (ar ? 'المندوب' : 'Representative') : userName;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          ar ? 'المزيد' : 'More',
          style: const TextStyle(
              fontWeight: FontWeight.w700, color: AppColors.primary),
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
            ),
            child: Row(
              children: [
                const ProfileAvatar(radius: 28),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: AppColors.onSurface),
                      ),
                      Text(
                        ar ? 'مندوب مبيعات ميداني' : 'Field Sales Representative',
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Language selector
          _LanguageTile(ar: ar, onSelect: loc.setArabic),
          _MoreTile(
            icon: Icons.info_outline,
            label: ar ? 'حول التطبيق' : 'About',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutScreen()),
            ),
          ),
          const SizedBox(height: 8),
          _MoreTile(
            icon: Icons.logout,
            label: ar ? 'تسجيل الخروج' : 'Sign Out',
            color: AppColors.error,
            onTap: () => _confirmSignOut(context, ar),
          ),
          const SizedBox(height: 24),
          Text(
            '© 2024 IntelliSales v1.0.0',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext context, bool ar) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(ar ? 'تسجيل الخروج' : 'Sign Out'),
        content: Text(
          ar
              ? 'هل أنت متأكد من رغبتك بتسجيل الخروج؟'
              : 'Are you sure you want to sign out?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(ar ? 'إلغاء' : 'Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(ar ? 'تسجيل الخروج' : 'Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    UserSession.of(context).setName('');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }
}

class _LanguageTile extends StatelessWidget {
  final bool ar;
  final ValueChanged<bool> onSelect;

  const _LanguageTile({required this.ar, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: PopupMenuButton<bool>(
          onSelected: onSelect,
          offset: const Offset(0, 44),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          itemBuilder: (context) => [
            _langItem(value: true, label: 'العربية', selected: ar),
            _langItem(value: false, label: 'English', selected: !ar),
          ],
          child: ListTile(
            leading: const Icon(Icons.language, color: AppColors.onSurface),
            title: Text(ar ? 'اللغة' : 'Language',
                style: const TextStyle(
                    color: AppColors.onSurface, fontWeight: FontWeight.w500)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  ar ? 'العربية' : 'English',
                  style: const TextStyle(color: AppColors.primary, fontSize: 14),
                ),
                const Icon(Icons.arrow_drop_down, color: AppColors.outline),
              ],
            ),
          ),
        ),
      ),
    );
  }

  PopupMenuItem<bool> _langItem(
      {required bool value, required String label, required bool selected}) {
    return PopupMenuItem<bool>(
      value: value,
      child: Row(
        children: [
          Expanded(
            child: Text(label,
                style: TextStyle(
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                    color: selected
                        ? AppColors.primary
                        : AppColors.onSurface)),
          ),
          if (selected)
            const Icon(Icons.check, size: 18, color: AppColors.primary),
        ],
      ),
    );
  }
}

class _MoreTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _MoreTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = AppColors.onSurface,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          leading: Icon(icon, color: color),
          title: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
          trailing: const Icon(Icons.chevron_right, color: AppColors.outline),
          onTap: onTap,
        ),
      ),
    );
  }
}
