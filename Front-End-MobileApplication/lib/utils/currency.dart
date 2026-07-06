String formatSYP(double amount, bool ar) {
  final fixed = amount.toStringAsFixed(2);
  final parts = fixed.split('.');
  final intPart = parts[0];
  final buffer = StringBuffer();
  for (var i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 == 0) buffer.write(',');
    buffer.write(intPart[i]);
  }
  final formatted = '${buffer.toString()}.${parts[1]}';
  return ar ? '$formatted ل.س' : '$formatted SYP';
}
