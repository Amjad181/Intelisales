import '../data/sample_data.dart';

/// نتيجة تحليل النص الصوتي: أصناف مطابقة لمنتجات حقيقية من الباك اند،
/// وعبارات لم يُتعرف عليها ليؤكدها/يصححها المستخدم يدوياً.
class VoiceParseResult {
  final List<InvoiceItem> items;
  final List<String> unmatched;

  const VoiceParseResult({required this.items, required this.unmatched});
}

/// تحويل نص عربي مُملى (من speech_to_text المحلي) إلى أصناف فاتورة —
/// **دون أي خدمة خارجية أو مفتاح سري** (Phase 8 من خطة التكامل):
/// - التفريغ الصوتي يتم محلياً على الجهاز (speech_to_text).
/// - المطابقة تتم على منتجات محمّلة من الباك اند (وليس sampleProducts)،
///   فتحمل الأصناف productId صالحاً يقبله POST /invoices.
/// - أي عبارة غير مطابقة تُعاد ضمن unmatched ليؤكدها المستخدم من الكتالوج،
///   ولا تُضاف تلقائياً أبداً.
class VoiceInvoiceService {
  /// كلمات الأعداد العربية الشائعة في الإملاء (مع صيغ المذكر/المؤنث والمثنى).
  static const Map<String, int> _arabicNumbers = {
    'واحد': 1,
    'واحدة': 1,
    'اثنان': 2,
    'اثنين': 2,
    'اثنتان': 2,
    'اثنتين': 2,
    'ثلاث': 3,
    'ثلاثة': 3,
    'أربع': 4,
    'أربعة': 4,
    'اربع': 4,
    'اربعة': 4,
    'خمس': 5,
    'خمسة': 5,
    'ست': 6,
    'ستة': 6,
    'سبع': 7,
    'سبعة': 7,
    'ثمان': 8,
    'ثمانية': 8,
    'ثماني': 8,
    'تسع': 9,
    'تسعة': 9,
    'عشر': 10,
    'عشرة': 10,
  };

  /// كلمات حشو تُهمل عند المطابقة ("أضف خمس علب ...").
  static const Set<String> _fillerWords = {
    'أضف',
    'اضف',
    'ضيف',
    'أريد',
    'اريد',
    'بدي',
    'اعطني',
    'أعطني',
    'من',
    'الى',
    'إلى',
    'على',
    'في',
    'لو',
    'سمحت',
    'فضلك',
    'قطعة',
    'قطع',
    'حبة',
    'حبات',
    'علبة',
    'علب',
  };

  static VoiceParseResult parseItems(
    String transcription, {
    required List<Product> catalog,
  }) {
    final items = <InvoiceItem>[];
    final unmatched = <String>[];

    // تقسيم الجملة إلى مقاطع على حرف العطف "و" والفواصل.
    final segments = transcription
        .split(RegExp(r'[،,]| و '))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    for (final segment in segments) {
      final (qty, remainder) = _extractQuantity(segment);
      final product = _matchProduct(remainder, catalog);
      if (product != null) {
        items.add(
          InvoiceItem(
            productId: product.id,
            name: product.name,
            nameAr: product.nameAr,
            qty: qty,
            unitPrice: product.price,
            icon: product.icon,
          ),
        );
      } else {
        unmatched.add(segment);
      }
    }

    return VoiceParseResult(items: items, unmatched: unmatched);
  }

  /// يستخرج الكمية من بداية المقطع (أرقاماً أو كلمات) ويرجعها مع بقية النص.
  static (int, String) _extractQuantity(String segment) {
    final words = segment.split(RegExp(r'\s+'));
    var qty = 1;
    final rest = <String>[];
    var quantityFound = false;

    for (final word in words) {
      final raw = word.trim();
      final normalized = _normalize(word);
      if (!quantityFound) {
        final digits = int.tryParse(_westernDigits(raw));
        if (digits != null && digits > 0) {
          qty = digits;
          quantityFound = true;
          continue;
        }
        // تُفحص الكلمة الخام قبل المطبَّعة (التطبيع يحوّل ة→ه فيغيّر
        // صيغاً مثل "ثلاثة")
        final wordNumber = _arabicNumbers[raw] ?? _arabicNumbers[normalized];
        if (wordNumber != null) {
          qty = wordNumber;
          quantityFound = true;
          continue;
        }
      }
      if (_fillerWords.contains(normalized) || _fillerWords.contains(raw)) {
        continue;
      }
      rest.add(word);
    }
    return (qty, rest.join(' '));
  }

  /// مطابقة نص المقطع على أسماء منتجات الكتالوج (عربي/إنجليزي): تطابق كامل
  /// أولاً ثم تضمين متبادل. عند غياب أي تطابق يُرجع null (لا تخمين).
  static Product? _matchProduct(String text, List<Product> catalog) {
    final needle = _normalize(text);
    if (needle.isEmpty) return null;

    for (final p in catalog) {
      if (_normalize(p.nameAr) == needle || _normalize(p.name) == needle) {
        return p;
      }
    }
    Product? partial;
    for (final p in catalog) {
      final nameAr = _normalize(p.nameAr);
      final nameEn = _normalize(p.name);
      if (nameAr.isNotEmpty &&
              (needle.contains(nameAr) || nameAr.contains(needle)) ||
          nameEn.isNotEmpty &&
              (needle.contains(nameEn) || nameEn.contains(needle))) {
        if (partial != null) return null; // تطابق غامض — يقرره المستخدم يدوياً
        partial = p;
      }
    }
    return partial;
  }

  /// توحيد بسيط للنص العربي: إزالة "ال" التعريف والتشكيل وتوحيد الألف/التاء.
  static String _normalize(String input) {
    var s = input.trim().toLowerCase();
    s = s.replaceAll(RegExp(r'[ً-ٟ]'), ''); // تشكيل
    s = s.replaceAll(RegExp('[أإآ]'), 'ا');
    s = s.replaceAll('ة', 'ه');
    s = s.replaceAll('ى', 'ي');
    s = s
        .split(RegExp(r'\s+'))
        .map((w) {
          return w.startsWith('ال') && w.length > 3 ? w.substring(2) : w;
        })
        .join(' ');
    return s.trim();
  }

  /// يحول الأرقام العربية الشرقية (٠-٩) إلى غربية ليقرأها int.tryParse.
  static String _westernDigits(String s) {
    const eastern = '٠١٢٣٤٥٦٧٨٩';
    final buffer = StringBuffer();
    for (final rune in s.runes) {
      final ch = String.fromCharCode(rune);
      final idx = eastern.indexOf(ch);
      buffer.write(idx >= 0 ? '$idx' : ch);
    }
    return buffer.toString();
  }
}
