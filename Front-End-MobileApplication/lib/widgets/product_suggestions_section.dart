import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../utils/currency.dart';
import '../services/product_suggestion_service.dart';

/// قسم "قد يعجب الزبون أيضاً" — يُعرض ضمن شاشة الفاتورة أو الكتالوج،
/// ويُخفى تلقائياً عند عدم وجود اقتراحات.
class ProductSuggestionsSection extends StatelessWidget {
  final List<ProductSuggestion> suggestions;
  final bool ar;
  final bool loading;
  final void Function(ProductSuggestion) onAdd;

  const ProductSuggestionsSection({
    super.key,
    required this.suggestions,
    required this.ar,
    required this.onAdd,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (!loading && suggestions.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.tertiary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.tertiary.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.auto_awesome,
                size: 16,
                color: AppColors.tertiary,
              ),
              const SizedBox(width: 6),
              Text(
                ar ? 'قد يعجب الزبون أيضاً' : 'Customer might also like',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.tertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: SizedBox(
                height: 18,
                width: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: suggestions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final s = suggestions[i];
                  return _SuggestionCard(
                    suggestion: s,
                    ar: ar,
                    onAdd: () => onAdd(s),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _SuggestionCard extends StatelessWidget {
  final ProductSuggestion suggestion;
  final bool ar;
  final VoidCallback onAdd;

  const _SuggestionCard({
    required this.suggestion,
    required this.ar,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 132,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.outlineVariant.withValues(alpha: 0.4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(suggestion.icon, size: 18, color: AppColors.secondary),
              const Spacer(),
              InkWell(
                onTap: onAdd,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add, size: 14, color: Colors.white),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            ar ? suggestion.nameAr : suggestion.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            formatSYP(suggestion.price, ar),
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
