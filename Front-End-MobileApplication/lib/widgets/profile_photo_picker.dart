import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../main.dart';
import '../theme/app_colors.dart';

/// Opens the "change profile photo" flow: pick a source, then preview the
/// picked photo against the required guidelines (personal photo, face and
/// shoulders clearly visible) before it is saved to [UserSession].
Future<void> showProfilePhotoSheet(BuildContext context) async {
  final ar = AppLocale.of(context).isArabic;
  final hasPhoto = UserSession.of(context).photo != null;

  final source = await showModalBottomSheet<_PhotoAction>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => _SourceSheet(ar: ar, hasPhoto: hasPhoto),
  );

  if (source == null || !context.mounted) return;

  if (source == _PhotoAction.remove) {
    UserSession.of(context).setPhoto(null);
    return;
  }

  final picker = ImagePicker();
  XFile? picked;
  try {
    picked = await picker.pickImage(
      source: source == _PhotoAction.camera
          ? ImageSource.camera
          : ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
  } catch (_) {
    if (context.mounted) {
      _showMessage(context,
          ar ? 'تعذر فتح الكاميرا أو المعرض' : 'Could not open the camera or gallery');
    }
    return;
  }

  if (picked == null || !context.mounted) return;

  final bytes = await picked.readAsBytes();
  if (!context.mounted) return;

  await _showPreviewDialog(context, bytes);
}

enum _PhotoViewerResult { edit, remove }

/// Shows the current profile photo large on screen with actions to add,
/// edit (replace), or remove it, depending on whether a photo is set.
Future<void> showProfilePhotoViewer(BuildContext context) async {
  final ar = AppLocale.of(context).isArabic;
  final photo = UserSession.of(context).photo;

  final result = await showGeneralDialog<_PhotoViewerResult>(
    context: context,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black87,
    transitionDuration: const Duration(milliseconds: 200),
    pageBuilder: (dialogContext, _, _) => _PhotoViewer(ar: ar, photo: photo),
  );

  if (!context.mounted || result == null) return;

  if (result == _PhotoViewerResult.remove) {
    UserSession.of(context).setPhoto(null);
  } else if (result == _PhotoViewerResult.edit) {
    await showProfilePhotoSheet(context);
  }
}

void _showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(message),
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  ));
}

Future<void> _showPreviewDialog(BuildContext context, Uint8List bytes) async {
  final ar = AppLocale.of(context).isArabic;
  bool confirmed = false;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (dialogContext, setDialogState) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(ar ? 'معاينة الصورة' : 'Preview Photo'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(radius: 56, backgroundImage: MemoryImage(bytes)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  ar
                      ? 'شروط الصورة الشخصية:\n• صورتك الشخصية أنت فقط\n• يظهر فيها الوجه والأكتاف بوضوح'
                      : 'Photo requirements:\n• A personal photo of yourself only\n• Face and shoulders clearly visible',
                  style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant),
                ),
              ),
              const SizedBox(height: 10),
              CheckboxListTile(
                value: confirmed,
                onChanged: (v) => setDialogState(() => confirmed = v ?? false),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
                dense: true,
                activeColor: AppColors.primary,
                title: Text(
                  ar
                      ? 'أؤكد أن هذه صورتي الشخصية وتظهر وجهي وأكتافي بوضوح'
                      : 'I confirm this is my personal photo showing my face and shoulders clearly',
                  style: const TextStyle(fontSize: 12.5),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(ar ? 'إلغاء' : 'Cancel'),
          ),
          FilledButton(
            onPressed: !confirmed
                ? null
                : () {
                    UserSession.of(context).setPhoto(bytes);
                    Navigator.pop(dialogContext);
                  },
            child: Text(ar ? 'حفظ' : 'Save'),
          ),
        ],
      ),
    ),
  );
}

class _PhotoViewer extends StatelessWidget {
  final bool ar;
  final Uint8List? photo;

  const _PhotoViewer({required this.ar, required this.photo});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          Align(
            alignment: ar ? Alignment.topLeft : Alignment.topRight,
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 28),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          const Spacer(),
          Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white10,
              border: Border.all(color: Colors.white24, width: 2),
              image: photo != null
                  ? DecorationImage(image: MemoryImage(photo!), fit: BoxFit.cover)
                  : null,
            ),
            child: photo == null
                ? const Icon(Icons.person, size: 120, color: Colors.white54)
                : null,
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.only(bottom: 32, left: 24, right: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: photo != null
                  ? [
                      _ViewerActionButton(
                        icon: Icons.edit_outlined,
                        label: ar ? 'تعديل' : 'Edit',
                        onTap: () => Navigator.pop(context, _PhotoViewerResult.edit),
                      ),
                      const SizedBox(width: 32),
                      _ViewerActionButton(
                        icon: Icons.delete_outline,
                        label: ar ? 'إزالة' : 'Remove',
                        color: Colors.redAccent,
                        onTap: () => Navigator.pop(context, _PhotoViewerResult.remove),
                      ),
                    ]
                  : [
                      _ViewerActionButton(
                        icon: Icons.add_a_photo_outlined,
                        label: ar ? 'إضافة' : 'Add',
                        onTap: () => Navigator.pop(context, _PhotoViewerResult.edit),
                      ),
                    ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ViewerActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _ViewerActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Column(
            children: [
              Icon(icon, color: color, size: 26),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Tappable avatar that shows the user's photo (or a placeholder icon) and
/// opens [showProfilePhotoViewer] on tap, with a small edit badge to make it
/// discoverable.
class ProfileAvatar extends StatelessWidget {
  final double radius;
  final bool showEditBadge;

  const ProfileAvatar({super.key, this.radius = 16, this.showEditBadge = true});

  @override
  Widget build(BuildContext context) {
    final photo = UserSession.of(context).photo;
    final badgeSize = radius * 0.6;

    return GestureDetector(
      onTap: () => showProfilePhotoViewer(context),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CircleAvatar(
            radius: radius,
            backgroundColor: AppColors.surfaceContainerHigh,
            backgroundImage: photo != null ? MemoryImage(photo) : null,
            child: photo == null
                ? Icon(Icons.person, size: radius * 1.125, color: AppColors.secondary)
                : null,
          ),
          if (showEditBadge)
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                width: badgeSize,
                height: badgeSize,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.surfaceContainerLowest, width: 1.5),
                ),
                child: Icon(Icons.camera_alt, color: Colors.white, size: badgeSize * 0.6),
              ),
            ),
        ],
      ),
    );
  }
}

enum _PhotoAction { camera, gallery, remove }

class _SourceSheet extends StatelessWidget {
  final bool ar;
  final bool hasPhoto;

  const _SourceSheet({required this.ar, required this.hasPhoto});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              ar ? 'الصورة الشخصية' : 'Profile Photo',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              ar
                  ? 'يجب أن تكون صورة شخصية تظهر الوجه والأكتاف بوضوح'
                  : 'Must be a personal photo clearly showing the face and shoulders',
              style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined, color: AppColors.primary),
              title: Text(ar ? 'التقاط صورة' : 'Take a Photo'),
              onTap: () => Navigator.pop(context, _PhotoAction.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AppColors.primary),
              title: Text(ar ? 'اختيار من المعرض' : 'Choose from Gallery'),
              onTap: () => Navigator.pop(context, _PhotoAction.gallery),
            ),
            if (hasPhoto)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: AppColors.error),
                title: Text(ar ? 'إزالة الصورة' : 'Remove Photo',
                    style: const TextStyle(color: AppColors.error)),
                onTap: () => Navigator.pop(context, _PhotoAction.remove),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
