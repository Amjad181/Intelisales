import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../utils/currency.dart';
import '../services/voice_invoice_service.dart';
import '../services/product_suggestion_service.dart';
import '../widgets/product_suggestions_section.dart';
import 'invoice_pdf_screen.dart';
import 'product_catalog_screen.dart';

class NewInvoiceScreen extends StatefulWidget {
  final Customer? customer;
  final VisitInfo? visitInfo;

  const NewInvoiceScreen({super.key, this.customer, this.visitInfo});

  @override
  State<NewInvoiceScreen> createState() => _NewInvoiceScreenState();
}

class _NewInvoiceScreenState extends State<NewInvoiceScreen>
    with TickerProviderStateMixin {
  late AnimationController _rippleCtrl;
  late Animation<double> _rippleAnim;
  late AnimationController _micPulseCtrl;
  late Animation<double> _micPulseAnim;

  final SpeechToText _speech = SpeechToText();
  bool _speechEnabled = false;
  bool _listening = false;
  bool _processing = false;
  String _liveText = '';

  final List<InvoiceItem> _items = [];

  List<ProductSuggestion> _suggestions = [];
  bool _loadingSuggestions = false;

  static const double _taxRate = 0.0;
  static const double _discountRate = 0.0;

  double get _subtotal => _items.fold(0, (s, i) => s + i.total);
  double get _tax => _subtotal * _taxRate;
  double get _discount => _subtotal * _discountRate;
  double get _total => _subtotal + _tax - _discount;

  @override
  void initState() {
    super.initState();

    _rippleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _rippleAnim = Tween<double>(
      begin: 1.0,
      end: 1.7,
    ).animate(CurvedAnimation(parent: _rippleCtrl, curve: Curves.easeOut));

    _micPulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _micPulseAnim = Tween<double>(
      begin: 0.85,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _micPulseCtrl, curve: Curves.easeInOut));

    _initSpeech();
  }

  Future<void> _initSpeech() async {
    final enabled = await _speech.initialize(
      onError: (error) => debugPrint('Speech error: $error'),
      onStatus: (status) {
        if ((status == 'done' || status == 'notListening') && _listening) {
          setState(() => _listening = false);
          if (_liveText.trim().isNotEmpty) _processText(_liveText.trim());
        }
      },
    );
    setState(() => _speechEnabled = enabled);
  }

  @override
  void dispose() {
    _rippleCtrl.dispose();
    _micPulseCtrl.dispose();
    _speech.cancel();
    super.dispose();
  }

  Future<void> _toggleMic() async {
    if (_processing) return;

    if (_listening) {
      // ── إيقاف يدوي ─────────────────────────────────────────────────
      await _speech.stop();
      setState(() => _listening = false);
      if (_liveText.trim().isNotEmpty) _processText(_liveText.trim());
    } else {
      // ── بدء الاستماع ────────────────────────────────────────────────
      if (!_speechEnabled) {
        _showError('الميكروفون غير متاح، تحقق من الصلاحيات');
        return;
      }

      setState(() {
        _listening = true;
        _liveText = '';
      });

      // ignore: deprecated_member_use
      await _speech.listen(
        onResult: (result) {
          setState(() => _liveText = result.recognizedWords);
        },
        // ignore: deprecated_member_use
        listenFor: const Duration(seconds: 60),
        // ignore: deprecated_member_use
        pauseFor: const Duration(seconds: 3),
        // ignore: deprecated_member_use
        localeId: 'ar-SA',
        // ignore: deprecated_member_use
        cancelOnError: true,
        // ignore: deprecated_member_use
        partialResults: true,
      );
    }
  }

  Future<void> _processText(String text) async {
    setState(() => _processing = true);
    try {
      final newItems = await VoiceInvoiceService.parseItems(text);
      if (!mounted) return;
      if (newItems.isEmpty) {
        _showError('لم يُتعرف على أصناف، حاول مجدداً');
      } else {
        setState(() => _items.addAll(newItems));
        _showToast(newItems);
        _refreshSuggestions();
      }
    } catch (e) {
      if (!mounted) return;
      debugPrint('Parse error: $e');
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showToast(List<InvoiceItem> addedItems) {
    final ar = AppLocale.of(context).isArabic;
    final label = addedItems.length == 1
        ? (ar
              ? 'تمت الإضافة: ${addedItems[0].nameAr}'
              : 'Added: ${addedItems[0].name}')
        : (ar
              ? 'تمت إضافة ${addedItems.length} أصناف'
              : 'Added ${addedItems.length} items');

    final overlay = Overlay.of(context);
    final entry = OverlayEntry(
      builder: (_) => Positioned(
        top: MediaQuery.of(context).padding.top + 70,
        left: 24,
        right: 24,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.inverseSurface,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 12,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.check_circle,
                  color: AppColors.inversePrimary,
                  size: 18,
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.inverseOnSurface,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    overlay.insert(entry);
    Future.delayed(const Duration(seconds: 2), entry.remove);
  }

  void _deleteItem(int index) {
    setState(() => _items.removeAt(index));
    _refreshSuggestions();
  }

  Future<void> _openManualEntry() async {
    final added = await Navigator.push<List<InvoiceItem>>(
      context,
      MaterialPageRoute(builder: (_) => const ProductCatalogScreen()),
    );
    if (added != null && added.isNotEmpty && mounted) {
      setState(() => _items.addAll(added));
      _showToast(added);
      _refreshSuggestions();
    }
  }

  Future<void> _refreshSuggestions() async {
    if (_items.isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    setState(() => _loadingSuggestions = true);
    final result = await ProductSuggestionService.fetch(
      cartItems: _items,
      customerId: widget.customer?.id,
    );
    if (!mounted) return;
    setState(() {
      _suggestions = result;
      _loadingSuggestions = false;
    });
  }

  void _addSuggestion(ProductSuggestion s) {
    setState(() {
      _items.add(InvoiceItem(
        productId: s.productId,
        name: s.name,
        nameAr: s.nameAr,
        qty: 1,
        unitPrice: s.price,
        icon: s.icon,
      ));
    });
    _refreshSuggestions();
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final customer = widget.customer;
    final custName = customer != null
        ? (ar ? customer.nameAr : customer.name)
        : (ar ? 'مؤسسة الخدمات اللوجستية العالمية' : 'Global Logistics Corp.');
    final custSubtitle = customer != null
        ? (ar
              ? '${customer.contactAr} • ${customer.roleAr}'
              : '${customer.contact} • ${customer.role}')
        : (ar
              ? '123 الطريق الصناعي، المبنى ب'
              : '123 Industrial Way, Building B');

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: AppColors.primary),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            ar ? 'إنتيلي سيلز' : 'IntelliSales',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 17,
              color: AppColors.primary,
            ),
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Row(
                children: [
                  Text(
                    ar ? 'مسودة' : 'DRAFT',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: AppColors.surfaceContainerHigh,
                    child: Icon(
                      Icons.person,
                      size: 18,
                      color: AppColors.secondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Customer card ─────────────────────────────────────────
            _sectionCard(
              child: Column(
                children: [
                  Align(
                    alignment: ar
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Text(
                      ar ? 'العميل' : 'CUSTOMER',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.onSurfaceVariant,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer.withValues(
                            alpha: 0.1,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.corporate_fare,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              custName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              custSubtitle,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Voice command widget ──────────────────────────────────
            _sectionCard(
              child: Column(
                children: [
                  Text(
                    ar ? 'أمر صوتي' : 'VOICE COMMAND',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.onSurfaceVariant,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // زر الميكروفون
                  SizedBox(
                    width: 110,
                    height: 110,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        if (_listening)
                          AnimatedBuilder(
                            animation: _rippleAnim,
                            builder: (_, _) => Transform.scale(
                              scale: _rippleAnim.value,
                              child: Container(
                                width: 90,
                                height: 90,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.error.withValues(
                                    alpha:
                                        (1 - (_rippleAnim.value - 1) / 0.7) *
                                        0.18,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        AnimatedBuilder(
                          animation: _micPulseAnim,
                          builder: (_, _) => Transform.scale(
                            scale: _listening ? _micPulseAnim.value : 1.0,
                            child: GestureDetector(
                              onTap: _processing ? null : _toggleMic,
                              child: Container(
                                width: 82,
                                height: 82,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _processing
                                      ? AppColors.onSurfaceVariant.withValues(
                                          alpha: 0.3,
                                        )
                                      : _listening
                                      ? AppColors.error
                                      : AppColors.primaryContainer,
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          (_listening
                                                  ? AppColors.error
                                                  : AppColors.primary)
                                              .withValues(alpha: 0.3),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: _processing
                                    ? const Padding(
                                        padding: EdgeInsets.all(22),
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 3,
                                        ),
                                      )
                                    : Icon(
                                        _listening
                                            ? Icons.stop_rounded
                                            : Icons.mic,
                                        color: Colors.white,
                                        size: 36,
                                      ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  Text(
                    _processing
                        ? (ar ? 'جاري تحليل الكلام...' : 'Analyzing...')
                        : _listening
                        ? (ar
                              ? 'جاري الاستماع... اضغط للإيقاف'
                              : 'Listening... tap to stop')
                        : (ar ? 'اضغط لإضافة أصناف' : 'Tap to add items'),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: _listening
                          ? AppColors.error
                          : _processing
                          ? AppColors.onSurfaceVariant
                          : AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // النص المباشر أثناء الاستماع
                  if (_liveText.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer.withValues(
                          alpha: 0.15,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Text(
                        _liveText,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    )
                  else
                    Text(
                      _listening
                          ? (ar
                                ? '"أضف 5 خوذات أمان بسعر 50 ل.س"'
                                : 'Try: "Add 5 safety helmets at 50 SYP each"')
                          : (ar
                                ? '"أضف 3 طفايات حريق بسعر 80 ل.س"'
                                : '"Add 3 fire extinguishers at 80 SYP each"'),
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.onSurfaceVariant,
                        fontStyle: FontStyle.italic,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Invoice items ─────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  ar ? 'أصناف الفاتورة' : 'Invoice Items',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _openManualEntry,
                  icon: const Icon(Icons.playlist_add, size: 18),
                  label: Text(
                    ar ? 'إدخال يدوي' : 'Manual Entry',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    backgroundColor: AppColors.primaryContainer.withValues(
                      alpha: 0.08,
                    ),
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ..._items.asMap().entries.map(
              (e) => _ItemCard(
                item: e.value,
                ar: ar,
                onDelete: () => _deleteItem(e.key),
              ),
            ),
            const SizedBox(height: 12),

            // ── Product suggestions ──────────────────────────────────
            ProductSuggestionsSection(
              suggestions: _suggestions,
              ar: ar,
              loading: _loadingSuggestions,
              onAdd: _addSuggestion,
            ),

            // ── Summary ───────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppColors.outlineVariant.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                children: [
                  _SummaryRow(
                    label: ar ? 'المجموع الفرعي' : 'Subtotal',
                    value: formatSYP(_subtotal, ar),
                  ),
                  const SizedBox(height: 8),
                  _SummaryRow(
                    label: ar ? 'الضريبة (8٪)' : 'Tax (8%)',
                    value: formatSYP(_tax, ar),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            ar ? 'الخصم' : 'Discount',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.tertiary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'SALE10',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppColors.tertiary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '-${formatSYP(_discount, ar)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.error,
                        ),
                      ),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: Divider(height: 1, color: AppColors.outlineVariant),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        ar ? 'إجمالي المبلغ' : 'Total Amount',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                      Text(
                        formatSYP(_total, ar),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),

        // ── Bottom action bar ─────────────────────────────────────────
        bottomNavigationBar: Container(
          color: AppColors.surface,
          padding: EdgeInsets.fromLTRB(
            16,
            12,
            16,
            12 + MediaQuery.of(context).padding.bottom,
          ),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => InvoicePdfScreen(
                    items: _items,
                    customer: widget.customer,
                    visitInfo: widget.visitInfo,
                  ),
                ),
              ),
              icon: const Icon(Icons.send_outlined, size: 18),
              label: Text(
                ar ? 'معاينة وإرسال' : 'PREVIEW & SEND',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.outlineVariant.withValues(alpha: 0.4),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

// ── Item Card ──────────────────────────────────────────────────────────────────

class _ItemCard extends StatelessWidget {
  final InvoiceItem item;
  final bool ar;
  final VoidCallback onDelete;
  const _ItemCard({
    required this.item,
    required this.ar,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.outlineVariant.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(item.icon, color: AppColors.secondary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ar ? item.nameAr : item.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  ar
                      ? 'الكمية: ${item.qty} • ${formatSYP(item.unitPrice, ar)} / وحدة'
                      : 'Qty: ${item.qty}  •  ${formatSYP(item.unitPrice, ar)} / unit',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            formatSYP(item.total, ar),
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: AppColors.onSurface,
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            onPressed: onDelete,
            tooltip: ar ? 'إزالة' : 'Remove',
            icon: const Icon(Icons.close, size: 16, color: AppColors.error),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.errorContainer.withValues(alpha: 0.15),
              minimumSize: const Size(30, 30),
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Summary row ────────────────────────────────────────────────────────────────

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.onSurfaceVariant,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.onSurface,
          ),
        ),
      ],
    );
  }
}
