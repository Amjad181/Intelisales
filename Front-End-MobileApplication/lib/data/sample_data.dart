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

  const Customer({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.contact,
    required
    this.contactAr,
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
  });
}

class Invoice {
  final String id;
  final String customer;
  final String customerAr;
  final double amount;
  final String date;
  final String dateAr;
  final String status; // 'PAID' | 'PENDING' | 'DRAFT' | 'OVERDUE' | 'SENT'

  const Invoice({
    required this.id,
    required this.customer,
    required this.customerAr,
    required this.amount,
    required this.date,
    required this.dateAr,
    required this.status,
  });
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
    final opt = visitResultOptions.firstWhere((o) => o.key == resultKey,
        orElse: () => visitResultOptions.last);
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

  const Product({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.price,
    required this.icon,
  });
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
