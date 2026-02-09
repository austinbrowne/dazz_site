import type { Product } from './types';

/**
 * Get related products: same category, optionally filtered by ±30% price range.
 * Returns up to `limit` products. If fewer than 3 price-filtered matches,
 * backfills with other same-category products.
 */
export function getRelatedProducts(current: Product, allProducts: Product[], limit = 4): Product[] {
  const categorySlug = current.category_slug ?? 'other';

  // Same category, exclude current product
  const sameCategory = allProducts.filter(
    (p) => (p.category_slug ?? 'other') === categorySlug && p.id !== current.id
  );

  if (sameCategory.length === 0) return [];

  const displayPrice = current.retail_price && current.retail_price > 0 ? current.retail_price : null;

  if (!displayPrice) {
    return sameCategory.slice(0, limit);
  }

  // Filter to ±30% price range
  const minPrice = displayPrice * 0.7;
  const maxPrice = displayPrice * 1.3;
  const priceFiltered = sameCategory.filter((p) => {
    const price = p.retail_price && p.retail_price > 0 ? p.retail_price : null;
    return price !== null && price >= minPrice && price <= maxPrice;
  });

  if (priceFiltered.length >= 3) {
    return priceFiltered.slice(0, limit);
  }

  // Backfill: start with price matches, add other same-category products
  const priceMatchIds = new Set(priceFiltered.map((p) => p.id));
  const backfill = sameCategory.filter((p) => !priceMatchIds.has(p.id));
  return [...priceFiltered, ...backfill].slice(0, limit);
}
