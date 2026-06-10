/**
 * Convert an arbitrary string (e.g. an organization name) into a URL/DB-safe slug.
 * "Acme Properties, Inc." -> "acme-properties-inc"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .slice(0, 40);
}
