import type { Product, MousepadSpecs } from './types';

/** Surface type filter options */
export const SURFACE_TYPES = ['Speed', 'Control', 'Hybrid'] as const;
export type SurfaceType = (typeof SURFACE_TYPES)[number];

/** Mousepad size filter options */
export const MOUSEPAD_SIZES = ['Small', 'Medium', 'Large', 'XL', 'Desk Mat'] as const;
export type MousepadSize = (typeof MOUSEPAD_SIZES)[number];

/** Mousepad specs with guaranteed non-null defaults for filtering and display */
export interface ResolvedMousepadSpecs {
  surface_type: string;
  speed_rating: number;
  control_rating: number;
  size: string;
  thickness: string;
  base_type: string;
  humidity_resistance: string;
}

/**
 * Extract typed mousepad specs from a Product's specs field.
 * Returns all fields with safe defaults so callers never need null checks.
 *
 * Default values:
 *  - surface_type: '' (unknown / unspecified)
 *  - speed_rating / control_rating: 0
 *  - size / thickness / base_type / humidity_resistance: ''
 */
export function resolveMousepadSpecs(product: Product): ResolvedMousepadSpecs {
  const raw = (product.category === 'mousepad' ? product.specs : null) as MousepadSpecs | null;

  return {
    surface_type: raw?.surface_type?.trim() ?? '',
    speed_rating: clampRating(raw?.speed_rating),
    control_rating: clampRating(raw?.control_rating),
    size: raw?.size?.trim() ?? '',
    thickness: raw?.thickness?.trim() ?? '',
    base_type: raw?.base_type?.trim() ?? '',
    humidity_resistance: raw?.humidity_resistance?.trim() ?? '',
  };
}

/**
 * Clamp a rating value to the 0-10 range, returning 0 for non-finite or
 * out-of-range values.
 */
function clampRating(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 10) return 10;
  return value;
}

/**
 * Check whether a product's surface_type matches one of the known filter
 * values. Comparison is case-insensitive to handle inconsistent API data.
 */
export function matchesSurfaceType(
  resolved: ResolvedMousepadSpecs,
  filter: SurfaceType | '',
): boolean {
  if (filter === '') return true;
  return resolved.surface_type.toLowerCase() === filter.toLowerCase();
}

/**
 * Check whether a product's size matches one of the known filter values.
 * Comparison is case-insensitive.
 */
export function matchesMousepadSize(
  resolved: ResolvedMousepadSpecs,
  filter: MousepadSize | '',
): boolean {
  if (filter === '') return true;
  return resolved.size.toLowerCase() === filter.toLowerCase();
}

/**
 * Check whether a product's rating falls within a range (inclusive).
 * A min of 0 means "no filter" -- products with unset ratings (0) are
 * still included.
 */
export function matchesRatingRange(
  value: number,
  min: number,
  max: number,
): boolean {
  if (min <= 0 && max >= 10) return true;
  // Products with unset rating (0) pass only if the min is also 0
  if (value === 0) return min <= 0;
  return value >= min && value <= max;
}
