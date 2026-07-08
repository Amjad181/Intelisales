import 'package:flutter/material.dart';

// ── Models ──────────────────────────────────────────────────────────────────

class Customer {
  final String id;
  final String name;
  final String nameAr;
  final String contact;
  final String contactAr;
  final String role;
  final String roleAr;
  final String lastVisit;
  final String lastVisitAr;
  final String status; // 'ACTIVE' | 'PROSPECT' | 'AT RISK'
  final String shopName;
  final String phone1;
  final String phone2;
  final String address;
  final String region;
  final String assignedUser;
  final String paymentType;
  final String customerType;
  final String notes;
  final String email;

  const Customer({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.contact,
    required this.contactAr,
    required this.role,
    required this.roleAr,
    required this.lastVisit,
    required this.lastVisitAr,
    required this.status,
    this.shopName = '',
    this.phone1 = '',
    this.phone2 = '',
    this.address = '',
    this.region = '',
    this.assignedUser = '',
    this.paymentType = '',
    this.customerType = '',
    this.notes = '',
    this.email = '',
  });

  /// يبني عميلاً من استجابة الباك اند (GET/POST /customers). لا يوجد اسم
  /// عربي منفصل من الباك اند، فتُستخدم نفس القيمة للعرض بالعربي والإنجليزي
  /// حتى تبقى كل الشاشات التي تفرّق بين name/nameAr تعمل دون تعديل.
  ///
  /// العنوان في العقد كائن {line1,line2,city,state,postalCode,country}
  /// (تأكد بالفحص على الباك اند الحقيقي) — يُسطّح هنا لنص عرض واحد.
  factory Customer.fromApi(Map<String, dynamic> json) {
    final name = (json['name'] as String?) ?? '';
    final contactName = (json['contactName'] as String?) ?? '';
    final rawAddress = json['address'];
    String addressText = '';
    String city = '';
    if (rawAddress is Map<String, dynamic>) {
      city = (rawAddress['city'] as String?) ?? '';
      addressText = [
        rawAddress['line1'],
        rawAddress['line2'],
        city,
        rawAddress['state'],
        rawAddress['country'],
      ].whereType<String>().where((s) => s.isNotEmpty).join('، ');
    } else if (rawAddress is String) {
      addressText = rawAddress;
    }
    final assigned = json['assignedSalesRep'];
    return Customer(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: name,
      nameAr: name,
      contact: contactName,
      contactAr: contactName,
      role: '',
      roleAr: '',
      lastVisit: '',
      lastVisitAr: '',
      status: (json['status'] as String?) ?? '',
      phone1: (json['phone'] as String?) ?? '',
      address: addressText,
      region: city,
      assignedUser: assigned is Map<String, dynamic>
          ? (assigned['id'] ?? assigned['_id'] ?? '').toString()
          : (assigned?.toString() ?? ''),
      paymentType: (json['paymentType'] as String?) ?? '',
      customerType: (json['customerType'] as String?) ?? '',
      notes: (json['notes'] as String?) ?? '',
      email: (json['email'] as String?) ?? '',
    );
  }

  static final _objectIdPattern = RegExp(r'^[0-9a-fA-F]{24}$');

  /// الشكل الذي يتوقعه الباك اند عند الإنشاء (POST /customers): المخطط
  /// strict — تُرسل الحقول المدعومة فقط وتُحذف الفارغة، العنوان كائن،
  /// وassignedSalesRep فقط إن كان ObjectId صالحاً (المندوب يُعيَّن
  /// تلقائياً على الخادم خلاف ذلك).
  Map<String, dynamic> toApi() => {
    'name': name,
    if (contact.isNotEmpty) 'contactName': contact,
    if (phone1.isNotEmpty) 'phone': phone1,
    if (email.isNotEmpty) 'email': email,
    if (address.isNotEmpty || region.isNotEmpty)
      'address': {
        if (address.isNotEmpty) 'line1': address,
        if (region.isNotEmpty) 'city': region,
      },
    if (notes.isNotEmpty) 'notes': notes,
    if (_objectIdPattern.hasMatch(assignedUser))
      'assignedSalesRep': assignedUser,
    if (customerType.isNotEmpty) 'customerType': customerType,
    if (paymentType.isNotEmpty) 'paymentType': paymentType,
    if (status.isNotEmpty) 'status': status,
  };
}

class Invoice {
  final String id;
  final String customer;
  final String customerAr;
  final double amount;
  final String date;
  final String dateAr;
  final String status; // 'PAID' | 'PENDING' | 'DRAFT' | 'OVERDUE' | 'SENT'
  final List<InvoiceItem> items;
  final String? customerId;
  final String invoiceStatus;
  final String paymentStatus;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final String currency;

  const Invoice({
    required this.id,
    required this.customer,
    required this.customerAr,
    required this.amount,
    required this.date,
    required this.dateAr,
    required this.status,
    this.items = const [],
    this.customerId,
    this.invoiceStatus = '',
    this.paymentStatus = '',
    this.totalAmount = 0,
    this.paidAmount = 0,
    this.remainingAmount = 0,
    this.currency = 'SYP',
  });

  /// يبني فاتورة من استجابة الباك اند. القيم الدقيقة لـ invoiceStatus/
  /// paymentStatus لم تُحدَّد بالتفصيل في العقد، لذا تُشتق حالة عرض واحدة
  /// (status) بأفضل تخمين متوافق مع شاشات الفواتير الحالية — راجع
  /// INTEGRATION_NOTES.md لتأكيدها مع الباك اند لاحقاً.
  factory Invoice.fromApi(Map<String, dynamic> json) {
    final invoiceStatus = ((json['invoiceStatus'] as String?) ?? '')
        .toUpperCase();
    final paymentStatus = ((json['paymentStatus'] as String?) ?? '')
        .toUpperCase();
    final dueDate = DateTime.tryParse((json['dueDate'] as String?) ?? '');
    final isOverdue =
        dueDate != null &&
        dueDate.isBefore(DateTime.now()) &&
        paymentStatus != 'PAID';

    final String legacyStatus;
    if (invoiceStatus == 'DRAFT') {
      legacyStatus = 'DRAFT';
    } else if (paymentStatus == 'PAID') {
      legacyStatus = 'PAID';
    } else if (isOverdue) {
      legacyStatus = 'OVERDUE';
    } else {
      legacyStatus = 'SENT';
    }

    final customerSnapshot = json['customerSnapshot'] as Map<String, dynamic>?;
    final customerName = (customerSnapshot?['name'] as String?) ?? '';

    final rawItems = (json['items'] as List?) ?? [];
    final items = rawItems.map((e) {
      final m = e as Map<String, dynamic>;
      final name = (m['productName'] ?? m['name'] ?? '') as String;
      return InvoiceItem(
        productId: (m['productId'] ?? m['product'])?.toString(),
        name: name,
        nameAr: name,
        qty: ((m['quantity'] ?? m['qty']) as num?)?.toInt() ?? 0,
        unitPrice: ((m['unitPrice'] ?? m['price']) as num?)?.toDouble() ?? 0,
        icon: Icons.inventory_2_outlined,
      );
    }).toList();

    final total = ((json['totalAmount'] as num?) ?? 0).toDouble();

    return Invoice(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      customer: customerName,
      customerAr: customerName,
      amount: total,
      date: dueDate != null ? 'Due: ${dueDate.toLocal()}'.split(' ').first : '',
      dateAr: dueDate != null
          ? 'الاستحقاق: ${dueDate.toLocal()}'.split(' ').first
          : '',
      status: legacyStatus,
      items: items,
      customerId: (json['customerId'] ?? customerSnapshot?['id'])?.toString(),
      invoiceStatus: invoiceStatus,
      paymentStatus: paymentStatus,
      totalAmount: total,
      paidAmount: ((json['paidAmount'] as num?) ?? 0).toDouble(),
      remainingAmount: ((json['remainingAmount'] as num?) ?? 0).toDouble(),
      currency: (json['currency'] as String?) ?? 'SYP',
    );
  }
}

class VisitResultOption {
  final String key;
  final String label;
  final String labelAr;
  const VisitResultOption(this.key, this.label, this.labelAr);
}

const List<VisitResultOption> visitResultOptions = [
  VisitResultOption('ORDER_PLACED', 'Order placed', 'تم إتمام الطلب'),
  VisitResultOption('SAMPLE_GIVEN', 'Sample given', 'تم تسليم عينة'),
  VisitResultOption('FOLLOW_UP', 'Needs follow-up', 'تحتاج متابعة'),
  VisitResultOption('NO_ORDER', 'No order', 'لم يتم الطلب'),
  VisitResultOption('OTHER', 'Other', 'أخرى'),
];

class VisitInfo {
  final Customer customer;
  final String resultKey;
  final String notes;
  final DateTime date;

  const VisitInfo({
    required this.customer,
    required this.resultKey,
    this.notes = '',
    required this.date,
  });

  String resultLabel(bool ar) {
    final opt = visitResultOptions.firstWhere(
      (o) => o.key == resultKey,
      orElse: () => visitResultOptions.last,
    );
    return ar ? opt.labelAr : opt.label;
  }
}

class InvoiceItem {
  final String? productId;
  final String name;
  final String nameAr;
  final int qty;
  final double unitPrice;
  final IconData icon;

  InvoiceItem({
    this.productId,
    required this.name,
    required this.nameAr,
    required this.qty,
    required this.unitPrice,
    required this.icon,
  });

  double get total => qty * unitPrice;
}

class Product {
  final String id;
  final String name;
  final String nameAr;
  final double price;
  final IconData icon;
  final String productCode;
  final String unit;
  final String currency;
  final double taxRate;
  final String status;

  const Product({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.price,
    required this.icon,
    this.productCode = '',
    this.unit = '',
    this.currency = 'SYP',
    this.taxRate = 0,
    this.status = '',
  });

  /// يبني منتجاً من استجابة الباك اند (GET /products أو /products/price-list).
  /// لا يوجد أيقونة من الباك اند، فتُستخدم أيقونة افتراضية للعرض فقط.
  factory Product.fromApi(Map<String, dynamic> json) {
    final name = (json['name'] as String?) ?? '';
    return Product(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: name,
      nameAr: name,
      price: ((json['basePrice'] ?? json['price']) as num?)?.toDouble() ?? 0,
      icon: Icons.inventory_2_outlined,
      productCode: (json['productCode'] ?? json['sku'] ?? '').toString(),
      unit: (json['unit'] as String?) ?? '',
      currency: (json['currency'] as String?) ?? 'SYP',
      taxRate: (json['taxRate'] as num?)?.toDouble() ?? 0,
      status: (json['status'] as String?) ?? '',
    );
  }

  /// يبني منتجاً من عنصر priceList.items (مسار
  /// GET /price-lists/customer-type/:customerType): العنصر يحمل المنتج
  /// متداخلاً تحت product مع سعر نوع العميل على مستوى العنصر نفسه.
  factory Product.fromPriceListItem(Map<String, dynamic> item) {
    final productJson = (item['product'] is Map<String, dynamic>)
        ? item['product'] as Map<String, dynamic>
        : item;
    final base = Product.fromApi(productJson);
    final itemPrice = (item['price'] as num?)?.toDouble();
    final itemCurrency = item['currency'] as String?;
    final itemTaxRate = (item['taxRate'] as num?)?.toDouble();
    return Product(
      id: base.id,
      name: base.name,
      nameAr: base.nameAr,
      price: itemPrice ?? base.price,
      icon: base.icon,
      productCode: base.productCode,
      unit: base.unit,
      currency: itemCurrency ?? base.currency,
      taxRate: itemTaxRate ?? base.taxRate,
      status: base.status,
    );
  }
}

// ── قيم الباك اند الثابتة (Customer.customerType / Customer.paymentType) ─────
//
// هذه القيم جزء من عقد الباك اند (وليست نصوصاً محلية قابلة للترجمة فقط)،
// لذا تُخزَّن كقيمة ثابتة (apiValue) بينما تُترجم فقط للعرض عبر label(ar).

enum CustomerType { retail, wholesale, keyAccount }

extension CustomerTypeApi on CustomerType {
  String get apiValue => switch (this) {
    CustomerType.retail => 'Retail',
    CustomerType.wholesale => 'Wholesale',
    CustomerType.keyAccount => 'KeyAccount',
  };

  String label(bool ar) => switch (this) {
    CustomerType.retail => ar ? 'تجزئة' : 'Retail',
    CustomerType.wholesale => ar ? 'جملة' : 'Wholesale',
    CustomerType.keyAccount => ar ? 'حساب رئيسي' : 'Key Account',
  };
}

enum PaymentType { cash, credit }

extension PaymentTypeApi on PaymentType {
  String get apiValue => switch (this) {
    PaymentType.cash => 'Cash',
    PaymentType.credit => 'Credit',
  };

  String label(bool ar) => switch (this) {
    PaymentType.cash => ar ? 'نقدي' : 'Cash',
    PaymentType.credit => ar ? 'آجل' : 'Credit',
  };
}

// ── Sample Data ──────────────────────────────────────────────────────────────

final List<Customer> sampleCustomers = [
  const Customer(
    id: '1',
    name: 'مؤسسة النور للتجارة العامة',
    nameAr: 'مؤسسة النور للتجارة العامة',
    contact: 'أحمد المحمد',
    contactAr: 'أحمد المحمد',
    role: 'مدير المشتريات',
    roleAr: 'مدير المشتريات',
    lastVisit: '24 أكتوبر 2023',
    lastVisitAr: '24 أكتوبر 2023',
    status: 'ACTIVE',
  ),
  const Customer(
    id: '2',
    name: 'شركة الخليج للنقل والتوزيع',
    nameAr: 'شركة الخليج للنقل والتوزيع',
    contact: 'سامر العلي',
    contactAr: 'سامر العلي',
    role: 'رئيس العمليات',
    roleAr: 'رئيس العمليات',
    lastVisit: '18 أكتوبر 2023',
    lastVisitAr: '18 أكتوبر 2023',
    status: 'PROSPECT',
  ),
  const Customer(
    id: '3',
    name: 'مصنع الشرق للصناعات الغذائية',
    nameAr: 'مصنع الشرق للصناعات الغذائية',
    contact: 'خالد إبراهيم',
    contactAr: 'خالد إبراهيم',
    role: 'مشرف الموقع',
    roleAr: 'مشرف الموقع',
    lastVisit: '12 سبتمبر 2023',
    lastVisitAr: '12 سبتمبر 2023',
    status: 'AT RISK',
  ),
];

final List<Invoice> sampleInvoices = [
  const Invoice(
    id: 'INV-8821',
    customer: 'Northside Industrial Hub',
    customerAr: 'مركز نورث سايد الصناعي',
    amount: 2450.00,
    date: 'Due: Oct 12, 2023',
    dateAr: 'الاستحقاق: 12 أكتوبر 2023',
    status: 'OVERDUE',
  ),
  const Invoice(
    id: 'INV-8822',
    customer: 'Skyline Logistics',
    customerAr: 'سكاي لاين للخدمات اللوجستية',
    amount: 1120.50,
    date: 'Sent: Oct 20, 2023',
    dateAr: 'تاريخ الإرسال: 20 أكتوبر 2023',
    status: 'SENT',
  ),
  const Invoice(
    id: 'INV-8823',
    customer: 'Green Horizon Farms',
    customerAr: 'مزارع جرين هورايزن',
    amount: 5680.00,
    date: 'Modified: Today',
    dateAr: 'آخر تعديل: اليوم',
    status: 'DRAFT',
  ),
  const Invoice(
    id: 'INV-8819',
    customer: 'Apex Retail Solutions',
    customerAr: 'أبيكس لحلول التجزئة',
    amount: 890.00,
    date: 'Paid: Oct 18, 2023',
    dateAr: 'تاريخ الدفع: 18 أكتوبر 2023',
    status: 'PAID',
  ),
];

List<InvoiceItem> defaultInvoiceItems() => [
  InvoiceItem(
    name: 'Industrial Storage Rack',
    nameAr: 'رف تخزين صناعي',
    qty: 2,
    unitPrice: 240.00,
    icon: Icons.inventory_2_outlined,
  ),
  InvoiceItem(
    name: 'Installation Fee',
    nameAr: 'رسوم التركيب',
    qty: 1,
    unitPrice: 150.00,
    icon: Icons.construction_outlined,
  ),
];

final List<Product> sampleProducts = [
  const Product(
    id: '1',
    name: 'Industrial Storage Rack',
    nameAr: 'رف تخزين صناعي',
    price: 240.00,
    icon: Icons.inventory_2_outlined,
  ),
  const Product(
    id: '2',
    name: 'Installation Fee',
    nameAr: 'رسوم التركيب',
    price: 150.00,
    icon: Icons.construction_outlined,
  ),
  const Product(
    id: '3',
    name: 'Safety Helmet',
    nameAr: 'خوذة أمان',
    price: 50.00,
    icon: Icons.engineering_outlined,
  ),
  const Product(
    id: '4',
    name: 'Fire Extinguisher',
    nameAr: 'طفاية حريق',
    price: 80.00,
    icon: Icons.local_fire_department_outlined,
  ),
  const Product(
    id: '5',
    name: 'First Aid Kit',
    nameAr: 'حقيبة إسعافات أولية',
    price: 35.00,
    icon: Icons.medical_services_outlined,
  ),
  const Product(
    id: '6',
    name: 'Safety Vest',
    nameAr: 'سترة سلامة',
    price: 25.00,
    icon: Icons.checkroom_outlined,
  ),
  const Product(
    id: '7',
    name: 'Tool Kit',
    nameAr: 'طقم عدة',
    price: 95.00,
    icon: Icons.hardware_outlined,
  ),
  const Product(
    id: '8',
    name: 'Delivery Fee',
    nameAr: 'رسوم التوصيل',
    price: 20.00,
    icon: Icons.local_shipping_outlined,
  ),
];
