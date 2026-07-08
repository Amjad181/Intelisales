import '../data/sample_data.dart';
import 'api_client.dart';

/// عملاء الباك اند: GET/POST /customers، GET /customers/:id.
/// المندوب يرى فقط عملاءه المُعيَّنين تلقائياً (الباك اند يقيّد ذلك بنفسه —
/// لا يُضاف أي فلتر تعيين محلي حسب الخطة).
class CustomerService {
  /// GET /customers مع كل معاملات الاستعلام المدعومة في العقد.
  static Future<PagedResult<Customer>> list({
    int? page,
    int? limit,
    String? search,
    String? status,
    String? customerType,
    String? paymentType,
    String? assignedSalesRep,
    String? city,
    String? sortBy,
    String? sortOrder,
  }) async {
    final res = await ApiClient.get(
      '/customers',
      query: {
        if (page != null) 'page': '$page',
        if (limit != null) 'limit': '$limit',
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null && status.isNotEmpty) 'status': status,
        if (customerType != null && customerType.isNotEmpty)
          'customerType': customerType,
        if (paymentType != null && paymentType.isNotEmpty)
          'paymentType': paymentType,
        if (assignedSalesRep != null && assignedSalesRep.isNotEmpty)
          'assignedSalesRep': assignedSalesRep,
        if (city != null && city.isNotEmpty) 'city': city,
        if (sortBy != null && sortBy.isNotEmpty) 'sortBy': sortBy,
        if (sortOrder != null && sortOrder.isNotEmpty) 'sortOrder': sortOrder,
      },
    );
    return res.pagedList(Customer.fromApi);
  }

  /// GET /customers/:id — الكيان متداخل تحت data.customer.
  static Future<Customer> getById(String id) async {
    final res = await ApiClient.get('/customers/$id');
    return Customer.fromApi(res.entity('customer'));
  }

  /// POST /customers — الكيان المُنشأ يعود متداخلاً تحت data.customer.
  static Future<Customer> create(Customer customer) async {
    final res = await ApiClient.post('/customers', body: customer.toApi());
    return Customer.fromApi(res.entity('customer'));
  }
}
