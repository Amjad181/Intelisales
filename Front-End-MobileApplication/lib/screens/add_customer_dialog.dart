import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_colors.dart';
import '../data/sample_data.dart';

class AddCustomerDialog extends StatefulWidget {
  const AddCustomerDialog({super.key});

  @override
  State<AddCustomerDialog> createState() => _AddCustomerDialogState();
}

class _AddCustomerDialogState extends State<AddCustomerDialog> {
  final _nameCtrl = TextEditingController();
  final _shopCtrl = TextEditingController();
  final _phone1Ctrl = TextEditingController();
  final _phone2Ctrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String? _nameError;
  String? _shopError;
  String? _phoneError;

  static const _regionsEn = ['Cairo', 'Alexandria', 'Giza', 'Other'];
  static const _regionsAr = ['القاهرة', 'الإسكندرية', 'الجيزة', 'أخرى'];
  static const _assignedUsers = ['Ahmed Salah', 'Sara Ali', 'Khaled Ibrahim'];
  static const _paymentTypesEn = ['Cash', 'Credit', 'Bank Transfer'];
  static const _paymentTypesAr = ['نقدي', 'آجل', 'تحويل بنكي'];
  static const _customerTypesEn = ['Retail', 'Wholesale'];
  static const _customerTypesAr = ['تجزئة', 'جملة'];

  int _regionIndex = 0;
  String _assignedUser = _assignedUsers.first;
  int _paymentIndex = 0;
  int _customerTypeIndex = 0;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _shopCtrl.dispose();
    _phone1Ctrl.dispose();
    _phone2Ctrl.dispose();
    _addressCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _submit(bool ar) {
    final name = _nameCtrl.text.trim();
    final shop = _shopCtrl.text.trim();
    final phone1 = _phone1Ctrl.text.trim();

    setState(() {
      _nameError = name.isEmpty
          ? (ar ? 'الرجاء إدخال اسم الزبون' : 'Please enter the customer name')
          : null;
      _shopError = shop.isEmpty
          ? (ar ? 'الرجاء إدخال اسم المحل' : 'Please enter the shop name')
          : null;
      _phoneError = phone1.isEmpty
          ? (ar ? 'الرجاء إدخال رقم الهاتف' : 'Please enter a phone number')
          : null;
    });
    if (_nameError != null || _shopError != null || _phoneError != null) {
      return;
    }

    final newCustomer = Customer(
      id: (sampleCustomers.length + 1).toString(),
      name: name,
      nameAr: name,
      contact: shop,
      contactAr: shop,
      role: _assignedUser,
      roleAr: _assignedUser,
      lastVisit: 'No visits yet',
      lastVisitAr: 'لا توجد زيارات بعد',
      status: 'PROSPECT',
      shopName: shop,
      phone1: phone1,
      phone2: _phone2Ctrl.text.trim(),
      address: _addressCtrl.text.trim(),
      region: ar ? _regionsAr[_regionIndex] : _regionsEn[_regionIndex],
      assignedUser: _assignedUser,
      paymentType:
          ar ? _paymentTypesAr[_paymentIndex] : _paymentTypesEn[_paymentIndex],
      customerType: ar
          ? _customerTypesAr[_customerTypeIndex]
          : _customerTypesEn[_customerTypeIndex],
      notes: _notesCtrl.text.trim(),
    );

    Navigator.pop(context, newCustomer);
  }

  @override
  Widget build(BuildContext context) {
    final ar = AppLocale.of(context).isArabic;

    return Directionality(
      textDirection: ar ? TextDirection.rtl : TextDirection.ltr,
      child: Dialog(
        backgroundColor: Colors.white,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420, maxHeight: 640),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(ar ? 'إضافة عميل' : 'Add customer',
                        style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.onSurface)),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                Text(
                  ar
                      ? 'سيتم توليد رقم تعريف جديد تلقائياً.'
                      : 'New ID will be Auto-generated.',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Field(
                          label: ar ? 'اسم الزبون' : 'Customer Name',
                          controller: _nameCtrl,
                          errorText: _nameError,
                        ),
                        const SizedBox(height: 14),
                        _Field(
                          label: ar ? 'اسم المحل' : 'Shop Name',
                          controller: _shopCtrl,
                          errorText: _shopError,
                        ),
                        const SizedBox(height: 14),
                        _Field(
                          label: ar ? 'هاتف 1' : 'Phone 1',
                          controller: _phone1Ctrl,
                          keyboardType: TextInputType.phone,
                          errorText: _phoneError,
                        ),
                        const SizedBox(height: 14),
                        _Field(
                          label: ar ? 'هاتف 2' : 'Phone 2',
                          controller: _phone2Ctrl,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 14),
                        _Field(
                          label: ar ? 'العنوان' : 'Address',
                          controller: _addressCtrl,
                        ),
                        const SizedBox(height: 14),
                        _Dropdown(
                          label: ar ? 'المنطقة' : 'Region',
                          value: _regionIndex,
                          items: ar ? _regionsAr : _regionsEn,
                          onChanged: (i) => setState(() => _regionIndex = i),
                        ),
                        const SizedBox(height: 14),
                        _Dropdown(
                          label: ar ? 'المستخدم المسؤول' : 'Assigned User',
                          value: _assignedUsers.indexOf(_assignedUser),
                          items: _assignedUsers,
                          onChanged: (i) =>
                              setState(() => _assignedUser = _assignedUsers[i]),
                        ),
                        const SizedBox(height: 14),
                        _Dropdown(
                          label: ar ? 'نوع الدفع' : 'Payment Type',
                          value: _paymentIndex,
                          items: ar ? _paymentTypesAr : _paymentTypesEn,
                          onChanged: (i) => setState(() => _paymentIndex = i),
                        ),
                        const SizedBox(height: 14),
                        _Dropdown(
                          label: ar ? 'نوع الزبون' : 'Customer Type',
                          value: _customerTypeIndex,
                          items: ar ? _customerTypesAr : _customerTypesEn,
                          onChanged: (i) =>
                              setState(() => _customerTypeIndex = i),
                        ),
                        const SizedBox(height: 14),
                        _Field(
                          label: ar ? 'ملاحظات' : 'Notes',
                          controller: _notesCtrl,
                          maxLines: 2,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.onSurfaceVariant,
                        side: const BorderSide(
                            color: AppColors.outlineVariant),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(ar ? 'إلغاء' : 'Cancel'),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () => _submit(ar),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(ar ? 'إنشاء' : 'Create'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? errorText;
  final TextInputType keyboardType;
  final int maxLines;

  const _Field({
    required this.label,
    required this.controller,
    this.errorText,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          decoration: InputDecoration(
            isDense: true,
            errorText: errorText,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }
}

class _Dropdown extends StatelessWidget {
  final String label;
  final int value;
  final List<String> items;
  final ValueChanged<int> onChanged;

  const _Dropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.outlineVariant),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: value,
              isExpanded: true,
              items: [
                for (var i = 0; i < items.length; i++)
                  DropdownMenuItem(value: i, child: Text(items[i])),
              ],
              onChanged: (v) {
                if (v != null) onChanged(v);
              },
            ),
          ),
        ),
      ],
    );
  }
}
