/** Resolve public URLs from deployment configuration, never the request host. */
export function publicUrl(site: URL | undefined, path = '') {
  if (!site) throw new Error('Configure Astro site before generating public URLs.');
  const siteRoot = new URL(site.href.replace(/\/?$/, '/'));
  const base = import.meta.env.BASE_URL;
  const root = base === '/' ? siteRoot : new URL(`${base.replace(/\/$/, '')}/`, siteRoot);
  return new URL(path, root).href;
}
