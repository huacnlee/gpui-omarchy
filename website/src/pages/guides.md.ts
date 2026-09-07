import source from './guides.md?raw';

// Publish the same guide as plain Markdown without Astro's layout metadata.
export function GET() {
  const markdown = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trimStart();
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
