import type { APIContext } from 'astro';
import { publicUrl } from '../lib/urls';

export function GET({ site }: APIContext) {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${publicUrl(site, 'sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
