import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../data/sample_data.dart';

class VoiceInvoiceService {
  static const String _groqUrl =
      'https://api.groq.com/openai/v1/chat/completions';

  /// يأخذ النص العربي المحوّل من الصوت ويستخرج منه أصناف الفاتورة
  static Future<List<InvoiceItem>> parseItems(String transcription) async {
    final response = await http
        .post(
          Uri.parse(_groqUrl),
          headers: {
            'Authorization': 'Bearer ${ApiConfig.groqKey}',
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: utf8.encode(json.encode({
            'model': 'llama-3.3-70b-versatile',
            'temperature': 0.1,
            'response_format': {'type': 'json_object'},
            'messages': [
              {
                'role': 'system',
                'content': '''
أنت مساعد لإنشاء فواتير. استخرج الأصناف من النص وأعد JSON بهذا الشكل فقط:
{"items":[{"name":"English name","nameAr":"الاسم بالعربي","qty":1,"unitPrice":0.0}]}
قواعد:
- إذا لم يُذكر السعر اجعله 0.0
- إذا لم تُذكر الكمية اجعلها 1
- أعد JSON فقط بدون أي نص إضافي
''',
              },
              {'role': 'user', 'content': transcription},
            ],
          })),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw Exception('Groq error ${response.statusCode}: ${response.body}');
    }

    final content = json.decode(
        response.body)['choices'][0]['message']['content'] as String;
    final parsed = json.decode(content) as Map<String, dynamic>;
    final rawItems = (parsed['items'] as List?) ?? [];

    return rawItems.map((e) {
      final name = (e['name'] ?? 'Item') as String;
      final nameAr = (e['nameAr'] ?? 'صنف') as String;
      return InvoiceItem(
        productId: _matchProductId(name, nameAr),
        name: name,
        nameAr: nameAr,
        qty: (e['qty'] as num).toInt(),
        unitPrice: (e['unitPrice'] as num).toDouble(),
        icon: Icons.inventory_outlined,
      );
    }).toList();
  }

  /// يحاول ربط الصنف المُستخرج من الصوت بمنتج حقيقي من الكتالوج (لو تطابق
  /// الاسم)، حتى تعمل عليه لاحقاً ميزات مثل اقتراحات المنتجات.
  static String? _matchProductId(String name, String nameAr) {
    for (final p in sampleProducts) {
      if (p.nameAr == nameAr || p.name.toLowerCase() == name.toLowerCase()) {
        return p.id;
      }
    }
    for (final p in sampleProducts) {
      if (nameAr.contains(p.nameAr) ||
          p.nameAr.contains(nameAr) ||
          name.toLowerCase().contains(p.name.toLowerCase())) {
        return p.id;
      }
    }
    return null;
  }
}
