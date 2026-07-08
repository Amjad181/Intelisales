import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';
import '../utils/currency.dart';
import '../services/api_client.dart';
import '../services/product_service.dart';
import '../services/product_suggestion_service.dart';
import '../widgets/demo_data_banner.dart';
import '../widgets/error_retry_view.dart';
import '../widgets/product_suggestions_section.dart';

class ProductCatalogScreen extends StatefulWidget {
  final String? customerType;

  const ProductCatalogScreen({super.key, this.customerType});

  @override
  State<ProductCatalogScreen> createState() => _ProductCatalogScreenState();
}

class _ProductCatalogScreenState extends State<ProductCatalogScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  final Map<int, int> _qty = {};

  List<Product> _products = const [];
  bool _loadingProducts = true;
  String? _productsError;
  bool _usingDemoData = false;

  List<ProductSuggestion> _suggestions = [];
  bool _loadingSuggestions = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() {
      _loadingProducts = true;
      _productsError = null;
    });
    try {
      // نوع عميل معروف → التسعير الدقيق من /price-lists/customer-type/:type
      // (data.priceList.items حسب العقد)؛ وإلا مسار المُنتقي /products/price-list.
      final customerType = widget.customerType;
      final products = customerType != null && customerType.isNotEmpty
          ? await ProductService.priceListByCustomerType(customerType)
          : (await ProductService.priceList()).items;
      if (!mounted) return;
      setState(() {
        _products = products;
        _usingDemoData = false;
        _loadingProducts = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        if (ApiConfig.demoMode) {
          _products = sampleProducts;
          _usingDemoData = true;
        } else {
          _products = const [];
          _productsError = e.message;
        }
        _loadingProducts = false;
      });
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<int> _filteredIndexes() {
    if (_query.isEmpty) {
      return List.generate(_products.length, (i) => i);
    }
    final q = _query.toLowerCase();
    final result = <int>[];
    for (var i = 0; i < _products.length; i++) {
      final p = _products[i];
      if (p.name.toLowerCase().contains(q) || p.nameAr.contains(_query)) {
        result.add(i);
      }
    }
    return result;
  }

  void _changeQty(int index, int delta) {
    setState(() {
      final next = ((_qty[index] ?? 0) + delta).clamp(0, 99);
      if (next == 0) {
        _qty.remove(index);
      } else {
        _qty[index] = next;
      }
    });
    _refreshSuggestions();
  }

  List<InvoiceItem> _selectedAsItems() => _qty.entries.map((e) {
    final p = _products[e.key];
    return InvoiceItem(
      productId: p.id,
      name: p.name,
      nameAr: p.nameAr,
      qty: e.value,
      unitPrice: p.price,
      icon: p.icon,
    );
  }).toList();

  Future<void> _refreshSuggestions() async {
    final selected = _selectedAsItems();
    if (selected.isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    setState(() => _loadingSuggestions = true);
    final result = await ProductSuggestionService.fetch(cartItems: selected);
    if (!mounted) return;
    setState(() {
      _suggestions = result;
      _loadingSuggestions = false;
    });
  }

  void _addSuggestion(ProductSuggestion s) {
    final index = _products.indexWhere((p) => p.id == s.productId);
    if (index == -1) return;
    _changeQty(index, 1);
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;
    final indexes = _filteredIndexes();
    final totalSelected = _qty.values.fold(0, (s, q) => s + q);

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
            ar ? 'اختيار المنتجات' : 'Select Products',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 17,
              color: AppColors.primary,
            ),
          ),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
                onChanged: (v) => setState(() => _query = v),
                decoration: InputDecoration(
                  hintText: ar ? 'ابحث عن منتج...' : 'Search products...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: AppColors.outline,
                  ),
                  filled: true,
                  fillColor: AppColors.surfaceContainerLowest,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: AppColors.outlineVariant.withValues(alpha: 0.5),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: AppColors.outlineVariant.withValues(alpha: 0.5),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: AppColors.primary,
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: ProductSuggestionsSection(
                suggestions: _suggestions,
                ar: ar,
                loading: _loadingSuggestions,
                onAdd: _addSuggestion,
              ),
            ),
            Expanded(
              child: _loadingProducts
                  ? const Center(child: CircularProgressIndicator())
                  : _productsError != null
                  ? ErrorRetryView(
                      message: _productsError!,
                      ar: ar,
                      onRetry: _loadProducts,
                    )
                  : indexes.isEmpty
                  ? Center(
                      child: Text(
                        ar ? 'لا توجد منتجات' : 'No products found',
                        style: const TextStyle(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      itemCount: indexes.length + (_usingDemoData ? 1 : 0),
                      itemBuilder: (_, i) {
                        if (_usingDemoData) {
                          if (i == 0) return DemoDataBanner(ar: ar);
                          i -= 1;
                        }
                        final idx = indexes[i];
                        final product = _products[idx];
                        final qty = _qty[idx] ?? 0;
                        return _ProductRow(
                          product: product,
                          ar: ar,
                          qty: qty,
                          onIncrement: () => _changeQty(idx, 1),
                          onDecrement: () => _changeQty(idx, -1),
                        );
                      },
                    ),
            ),
          ],
        ),
        bottomNavigationBar: totalSelected == 0
            ? null
            : SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () =>
                          Navigator.pop(context, _selectedAsItems()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        ar
                            ? 'إضافة ($totalSelected) إلى الفاتورة'
                            : 'Add $totalSelected to Invoice',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final Product product;
  final bool ar;
  final int qty;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _ProductRow({
    required this.product,
    required this.ar,
    required this.qty,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final selected = qty > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected
              ? AppColors.primary
              : AppColors.outlineVariant.withValues(alpha: 0.4),
          width: selected ? 1.5 : 1,
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
            child: Icon(product.icon, color: AppColors.secondary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ar ? product.nameAr : product.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  formatSYP(product.price, ar),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (!selected)
            IconButton.filled(
              onPressed: onIncrement,
              icon: const Icon(Icons.add, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primaryContainer,
                foregroundColor: AppColors.onPrimaryContainer,
                minimumSize: const Size(34, 34),
              ),
            )
          else
            Container(
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.remove,
                      color: Colors.white,
                      size: 16,
                    ),
                    onPressed: onDecrement,
                    constraints: const BoxConstraints(
                      minWidth: 32,
                      minHeight: 32,
                    ),
                    padding: EdgeInsets.zero,
                  ),
                  SizedBox(
                    width: 22,
                    child: Text(
                      '$qty',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add, color: Colors.white, size: 16),
                    onPressed: onIncrement,
                    constraints: const BoxConstraints(
                      minWidth: 32,
                      minHeight: 32,
                    ),
                    padding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
