/** Category slugs as stored in the CRM (singular) */
export type InventoryCategory = 'mouse' | 'keyboard' | 'mousepad' | 'iem' | 'other';

/** Category slugs as used in URLs (plural) */
export type CategorySlug = 'mice' | 'keyboards' | 'mousepads' | 'iems';

/** Mapping from CRM singular to URL plural */
export const CATEGORY_MAP: Record<InventoryCategory, CategorySlug | null> = {
  mouse: 'mice',
  keyboard: 'keyboards',
  mousepad: 'mousepads',
  iem: 'iems',
  other: null,
};

/** All valid category slugs */
export const CATEGORY_SLUGS: CategorySlug[] = ['mice', 'keyboards', 'mousepads', 'iems'];

/** Display names for categories */
export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  mice: 'Mice',
  keyboards: 'Keyboards',
  mousepads: 'Mousepads',
  iems: 'IEMs',
};

/** Mouse-specific specs */
export interface MouseSpecs {
  weight?: number;
  sensor?: string;
  dpi?: number;
  polling_rate?: number;
  battery_life?: string;
  connectivity?: string;
  shape?: string;
  dimensions?: string;
  switch_type?: string;
}

/** Keyboard-specific specs */
export interface KeyboardSpecs {
  switch_type?: string;
  layout?: string;
  connectivity?: string;
  actuation_point?: string;
  rapid_trigger?: boolean;
  analog_input?: boolean;
  keycap_type?: string;
}

/** Mousepad-specific specs */
export interface MousepadSpecs {
  surface_type?: string;
  speed_rating?: number;
  control_rating?: number;
  size?: string;
  thickness?: string;
  base_type?: string;
  humidity_resistance?: string;
}

/** IEM-specific specs */
export interface IemSpecs {
  driver_type?: string;
  impedance?: string;
  frequency_response?: string;
  connectivity?: string;
  microphone?: boolean;
}

export type ProductSpecs = MouseSpecs | KeyboardSpecs | MousepadSpecs | IemSpecs;

/** Product as returned by the public API */
export interface Product {
  id: number;
  product_name: string;
  category: InventoryCategory;
  category_slug: CategorySlug | null;
  image_url: string | null;
  retail_price: number | null;
  short_verdict: string | null;
  pros: string[] | null;
  cons: string[] | null;
  rating: number | null;
  slug: string;
  specs: ProductSpecs | null;
  video_url: string | null;
  pick_category: string | null;
  date_acquired: string | null;
  company_name: string | null;
  company_website: string | null;
  affiliate_link: string | null;
  affiliate_code: string | null;
}

/** Deal as returned by the public API */
export interface Deal {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  category_slug: CategorySlug | null;
  image_url: string | null;
  normal_price: number;
  sale_price: number;
  retailer: string;
  affiliate_link: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

/** Company as returned by the public API */
export interface Company {
  id: number;
  name: string;
  category: string;
  website: string | null;
  affiliate_link: string | null;
  affiliate_code: string | null;
}

/** Creator profile as returned by the public API */
export interface CreatorProfile {
  display_name: string;
  tagline: string | null;
  bio: string | null;
  photo_url: string | null;
  location: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  platform_stats: Record<string, unknown> | null;
  audience_demographics: Record<string, unknown> | null;
  content_niches: string[] | null;
}
