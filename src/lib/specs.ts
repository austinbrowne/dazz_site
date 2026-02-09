import type { ProductSpecs } from './types';

/** Units for spec fields that need them */
const SPEC_UNITS: Record<string, string> = {
  weight: 'g',
  dpi: ' DPI',
  polling_rate: ' Hz',
  speed_rating: '/10',
  control_rating: '/10',
};

/** Brand/abbreviation overrides for title-casing */
const BRAND_NAMES: Record<string, string> = {
  dpi: 'DPI',
  iem: 'IEM',
  usb: 'USB',
};

/** Convert an underscore_key to a human-readable label */
function formatSpecLabel(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((word) => BRAND_NAMES[word.toLowerCase()] ?? (word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

/** Format a spec value for display. Returns null for non-renderable values. */
function formatSpecValue(value: unknown, key: string): string | null {
  if (value == null) return null;

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    const unit = SPEC_UNITS[key] ?? '';
    return `${value.toLocaleString()}${unit}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return null;
}

export interface SpecEntry {
  label: string;
  value: string;
}

/** Get renderable spec entries for a product, filtering nulls and formatting values. */
export function getSpecEntries(specs: ProductSpecs | null): SpecEntry[] {
  if (!specs) return [];

  return Object.entries(specs)
    .filter(([key]) => key.trim().length > 0)
    .map(([key, value]) => {
      const formatted = formatSpecValue(value, key);
      if (!formatted) return null;
      return { label: formatSpecLabel(key), value: formatted };
    })
    .filter((entry): entry is SpecEntry => entry !== null);
}
