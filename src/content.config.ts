import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Best-of guides (Issue #9): ranked product lists with embedded product cards.
 * Files live in src/content/guides/*.mdx
 */
const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.coerce.date(),
    /** Product slugs referenced in this guide (used for build-time product resolution) */
    products: z.array(z.string()).default([]),
    /** Optional category filter (e.g. 'mice', 'keyboards') */
    category: z.string().optional(),
    /** Sort order for listing pages (lower = first) */
    order: z.number().optional(),
  }),
});

/**
 * Educational articles (Issue #10): HE/TMR explainer hub content.
 * Files live in src/content/learn/*.mdx
 */
const learn = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/learn' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Sort order within its section (lower = first) */
    order: z.number(),
    /** Sidebar grouping label (e.g. 'Hall Effect', 'TMR', 'Buying') */
    section: z.string(),
  }),
});

export const collections = { guides, learn };
