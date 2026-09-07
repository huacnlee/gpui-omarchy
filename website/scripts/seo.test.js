import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const base = process.env.SEO_EXPECTED_BASE || 'https://huacnlee.github.io/gpui-omarchy/';
const url = path => new URL(path, base).href;
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(([tag]) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value.replaceAll('&amp;', '&')])));
const meta = (html, name) => tags(html, 'meta').filter(tag => tag.name === name || tag.property === name).map(tag => tag.content);

for (const [path, file, type] of [['', 'index.html', 'WebPage'], ['guides/', 'guides/index.html', 'TechArticle']]) {
  test(`${file} has unique crawlable metadata and valid structured data`, () => {
    const html = read(`dist/${file}`);
    expect(tags(html, 'link').filter(t => t.rel === 'canonical').map(t => t.href)).toEqual([url(path)]);
    expect([...html.matchAll(/<title>([^<]+)<\/title>/g)]).toHaveLength(1);
    expect([...html.matchAll(/<h1\b/g)]).toHaveLength(1);
    expect(meta(html, 'description')).toHaveLength(1);
    expect(meta(html, 'description')[0].length).toBeGreaterThan(70);
    expect(meta(html, 'robots').join()).not.toContain('noindex');
    expect(meta(html, 'og:url')).toEqual([url(path)]);
    expect(meta(html, 'og:image')).toEqual([url('social.png')]);
    expect(meta(html, 'og:title')).toEqual(meta(html, 'twitter:title'));
    expect(meta(html, 'og:description')).toEqual(meta(html, 'description'));
    expect(meta(html, 'twitter:card')).toEqual(['summary']);
    const structured = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    expect(structured).toHaveLength(1);
    const graph = JSON.parse(structured[0][1])['@graph'];
    expect(graph.find(node => node['@type'] === type)?.url).toBe(url(path));
    expect(graph.find(node => node['@type'] === 'SoftwareSourceCode')?.codeRepository).toBe('https://github.com/huacnlee/gpui-omarchy');
    expect(tags(html, 'link').find(t => t.rel === 'sitemap')?.href).toBe(url('sitemap.xml'));
    expect(html).toContain('class="site-logo"');
    expect(html).not.toContain('feat/omarchy-components-gallery');
  });
}

test('sitemap only includes indexable HTML pages and robots discovers it', () => {
  expect([...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])).toEqual([url(''), url('guides/')]);
  expect(read('dist/robots.txt')).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${url('sitemap.xml')}\n`);
  const gallery = read('dist/gallery/index.html');
  expect(meta(gallery, 'robots')).toEqual(['noindex, follow']);
  expect(gallery).toContain('href="../guides/"');
  expect(gallery).toContain('<noscript>');
});

test('Markdown export stays identical to source and is discoverable for AI readers', () => {
  const markdown = read('src/pages/guides.md').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trimStart();
  expect(read('dist/guides.md')).toBe(markdown);
  expect(markdown.startsWith('# Guides\n')).toBe(true);
  const html = read('dist/guides/index.html');
  expect(tags(html, 'link').find(t => t.type === 'text/markdown')?.href).toBe(url('guides.md'));
  expect(html).toContain('download="gpui-omarchy-guides.md"');
  expect(read('dist/llms.txt')).toContain(url('guides.md'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  expect(new Set(ids).size).toBe(ids.length);
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) expect(ids).toContain(anchor);
  for (const [, anchor] of read('dist/index.html').matchAll(/href="[^"]*guides\/#([^"]+)"/g)) expect(ids).toContain(anchor);
});

test('sharing images exist at advertised dimensions', () => {
  for (const [name, size] of [['social.png', 512], ['icon.png', 192]]) {
    const png = readFileSync(new URL(`../dist/${name}`, import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
});
