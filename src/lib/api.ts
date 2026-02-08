import type { Product, Company, CreatorProfile } from './types';

const API_BASE = import.meta.env.API_BASE_URL || 'http://mouse-domination:5000/api/v1/public';
const API_KEY = import.meta.env.API_KEY || '';

async function apiFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText} for ${endpoint}`);
      return null;
    }

    return await res.json() as T;
  } catch (err) {
    console.error(`API fetch failed for ${endpoint}:`, err);
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  return (await apiFetch<Product[]>('/products')) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(`Invalid slug: ${slug}`);
    return null;
  }
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
}

export async function getPicks(): Promise<Product[]> {
  const all = await getProducts();
  return all.filter(p => p.pick_category);
}

export async function getCompanies(): Promise<Company[]> {
  return (await apiFetch<Company[]>('/companies')) ?? [];
}

export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  return apiFetch<CreatorProfile>('/creator-profile');
}
