import '../data/sample_data.dart';
import 'api_client.dart';

/// كتالوج المنتجات:
/// - GET /products: القائمة العامة (المندوب يستلم المنتجات النشطة فقط).
/// - GET /products/price-list: مسار المُنتقي الصالح، يرجع قائمة data علوية.
/// - GET /price-lists/customer-type/:customerType: التسعير الدقيق حسب نوع
///   العميل — يرجع data.priceList ثم priceList.items حسب العقد.
class ProductService {
  static Future<PagedResult<Product>> list({
    int? page,
    int? limit,
    String? search,
  }) async {
    final res = await ApiClient.get(
      '/products',
      query: {
        if (page != null) 'page': '$page',
        if (limit != null) 'limit': '$limit',
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return res.pagedList(Product.fromApi);
  }

  static Future<PagedResult<Product>> priceList({String? search}) async {
    final res = await ApiClient.get(
      '/products/price-list',
      query: {if (search != null && search.isNotEmpty) 'search': search},
    );
    return res.pagedList(Product.fromApi);
  }

  /// GET /price-lists/customer-type/:customerType — يفسّر data.priceList
  /// ويحوّل priceList.items إلى منتجات بسعر نوع العميل الدقيق.
  static Future<List<Product>> priceListByCustomerType(
    String customerType,
  ) async {
    final res = await ApiClient.get('/price-lists/customer-type/$customerType');
    final priceList = res.entity('priceList');
    final items = (priceList['items'] as List?) ?? const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(Product.fromPriceListItem)
        .toList();
  }
}
