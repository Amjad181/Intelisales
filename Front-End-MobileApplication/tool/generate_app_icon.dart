// أداة توليد أيقونة التطبيق برمجياً باستخدام dart:ui، بدل الاعتماد على أداة
// تصميم خارجية. تُشغَّل عبر: flutter test tool/generate_app_icon.dart
// وتكتب الصور المصدر في assets/icon/، ثم flutter_launcher_icons يبني منها
// أيقونات كل المنصات.
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';

const int _kSize = 1024;

// ألوان مأخوذة من lib/theme/app_colors.dart للحفاظ على هوية بصرية موحدة.
const ui.Color _primary = ui.Color(0xFF0047D3);
const ui.Color _primaryDeep = ui.Color(0xFF001C5C);
const ui.Color _primaryContainer = ui.Color(0xFF1E5EFF);
const ui.Color _tertiary = ui.Color(0xFF006338);
const ui.Color _tertiaryContainer = ui.Color(0xFF157E4C);
const ui.Color _paperLine = ui.Color(0xFFC3C5D9);
const ui.Color _fold = ui.Color(0xFFE6EEFF);
const ui.Color _white = ui.Color(0xFFFFFFFF);

void _paintIcon(ui.Canvas canvas, {required bool withBackground}) {
  final size = _kSize.toDouble();
  final center = ui.Offset(size / 2, size / 2);

  if (withBackground) {
    canvas.drawRect(
      ui.Rect.fromLTWH(0, 0, size, size),
      ui.Paint()
        ..shader = ui.Gradient.linear(
          ui.Offset.zero,
          ui.Offset(size, size),
          [_primaryDeep, _primary, _primaryContainer],
          [0, 0.55, 1],
        ),
    );
    // لمعة خفيفة أعلى اليسار لإعطاء عمق بصري بسيط.
    canvas.drawCircle(
      ui.Offset(size * 0.28, size * 0.24),
      size * 0.42,
      ui.Paint()..color = _white.withValues(alpha: 0.07),
    );
  }

  canvas.save();
  canvas.translate(center.dx - 26, center.dy - 14);
  canvas.rotate(-0.045);

  // ── ورقة الفاتورة ─────────────────────────────────────────────
  const docW = 430.0;
  const docH = 560.0;
  final docRect = ui.Rect.fromCenter(center: ui.Offset.zero, width: docW, height: docH);
  final docRRect = ui.RRect.fromRectAndRadius(docRect, const ui.Radius.circular(34));

  canvas.drawRRect(
    docRRect.shift(const ui.Offset(0, 22)),
    ui.Paint()
      ..color = _primaryDeep.withValues(alpha: 0.35)
      ..maskFilter = const ui.MaskFilter.blur(ui.BlurStyle.normal, 28),
  );
  canvas.drawRRect(docRRect, ui.Paint()..color = _white);

  // الزاوية المطوية أعلى اليمين.
  final trX = docRect.right;
  final trY = docRect.top;
  const foldSize = 84.0;
  final foldPath = ui.Path()
    ..moveTo(trX - foldSize, trY)
    ..lineTo(trX, trY)
    ..lineTo(trX, trY + foldSize)
    ..close();
  canvas.drawPath(foldPath, ui.Paint()..color = _fold);
  canvas.drawLine(
    ui.Offset(trX - foldSize, trY),
    ui.Offset(trX, trY + foldSize),
    ui.Paint()
      ..color = _paperLine
      ..strokeWidth = 3,
  );

  // شريط العنوان.
  final headerRect = ui.Rect.fromLTWH(
    docRect.left + 46, docRect.top + 66, docW - 150, 30,
  );
  canvas.drawRRect(
    ui.RRect.fromRectAndRadius(headerRect, const ui.Radius.circular(15)),
    ui.Paint()..color = _primary.withValues(alpha: 0.85),
  );

  // أسطر نصية.
  double lineY = docRect.top + 132;
  for (final w in [docW - 100, docW - 150, docW - 190]) {
    final r = ui.Rect.fromLTWH(docRect.left + 46, lineY, w, 20);
    canvas.drawRRect(
      ui.RRect.fromRectAndRadius(r, const ui.Radius.circular(10)),
      ui.Paint()..color = _paperLine.withValues(alpha: 0.9),
    );
    lineY += 44;
  }

  // شريط الإجمالي (تلميح لونه أخضر كإشارة لإتمام العملية).
  final totalRect = ui.Rect.fromLTWH(
    docRect.left + 46, docRect.bottom - 104, docW - 100, 44,
  );
  canvas.drawRRect(
    ui.RRect.fromRectAndRadius(totalRect, const ui.Radius.circular(14)),
    ui.Paint()..color = _tertiary.withValues(alpha: 0.14),
  );

  canvas.restore();

  // ── شارة صح خضراء (إتمام الفاتورة/عملية بيع ناجحة) ──────────
  final badgeCenter = ui.Offset(center.dx + 168, center.dy + 176);
  const badgeRadius = 158.0;

  canvas.drawCircle(badgeCenter, badgeRadius + 20, ui.Paint()..color = _white);
  canvas.drawCircle(
    badgeCenter,
    badgeRadius,
    ui.Paint()
      ..shader = ui.Gradient.linear(
        badgeCenter - const ui.Offset(badgeRadius, badgeRadius),
        badgeCenter + const ui.Offset(badgeRadius, badgeRadius),
        [_tertiaryContainer, _tertiary],
      ),
  );

  final checkPaint = ui.Paint()
    ..color = _white
    ..style = ui.PaintingStyle.stroke
    ..strokeWidth = 36
    ..strokeCap = ui.StrokeCap.round
    ..strokeJoin = ui.StrokeJoin.round;
  final checkPath = ui.Path()
    ..moveTo(badgeCenter.dx - 70, badgeCenter.dy + 4)
    ..lineTo(badgeCenter.dx - 20, badgeCenter.dy + 58)
    ..lineTo(badgeCenter.dx + 80, badgeCenter.dy - 62);
  canvas.drawPath(checkPath, checkPaint);
}

Future<Uint8List> _renderPng({required bool withBackground}) async {
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  _paintIcon(canvas, withBackground: withBackground);
  final picture = recorder.endRecording();
  final image = await picture.toImage(_kSize, _kSize);
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  return byteData!.buffer.asUint8List();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('generate app icon sources', () async {
    final dir = Directory('assets/icon');
    if (!dir.existsSync()) dir.createSync(recursive: true);

    File('assets/icon/icon.png').writeAsBytesSync(await _renderPng(withBackground: true));
    File('assets/icon/icon_foreground.png')
        .writeAsBytesSync(await _renderPng(withBackground: false));
  });
}
