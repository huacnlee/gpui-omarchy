# GPUI Omarchy website

An Astro website presenting the relationship between GPUI Kit, gpui-base and Omarchy Style. Tailwind CSS supplies the token and utility layer; Base UI powers the theme menu. The homepage embeds the actual Rust gallery compiled to WebAssembly, using the root gpui-omarchy library and gpui-base.

## Development

The single-page [Guides](src/pages/guides.md) lives at `/guides/`. Edit that Markdown file for all guide content; its Astro layout derives the chapter directory from its level-two headings. The build also exports `/guides.md` from the same source, without Astro frontmatter, for the page's Download Markdown link. API details live alongside the relevant usage guide. The page uses the site's themes and works with the GitHub Pages base path.

Build the gallery first using [the WASM build instructions](../examples/gallery-wasm/README.md).

```sh
bun install
bun run dev
```

Open http://127.0.0.1:4321. Scripts run Astro with Bun directly.

## Validation

```sh
bun run build
bun --bun x playwright install chromium
bun --bun x playwright test
```

The static site builds into `dist/`. It has no backend or deployment-specific adapter. Copy `dist/` to any static host.

## Design

The favicon is a custom GPUI Omarchy G: it combines the open letterform of https://gpui-kit.com/logo.svg with the square steps and interlocking strokes of https://omarchy.org/brand/omarchy-logo.svg. It is a project mark, not the official logo of either project. The dark website theme uses omarchy.org's green brand accent (`#9ece6a`) and dark button ink (`#0c0e10`); the native Tokyo Night theme retains its blue accent.

The page follows Omarchy Style's web-specific rules: the Omarchy display font, Geist headings, JetBrains Mono body text, square geometry and semantic theme colors. Tokyo Night is the default; Flexoki Light provides the light theme. The primary website action uses the web brand fill, while the native library uses outlined actions.

The Omarchy display font comes from https://github.com/markcuda/Omarchy-Font and its MIT license is retained in `public/fonts/OMARCHY-LICENSE`. Fonts are self-hosted through Fontsource packages. This is an independent community project, not the official Omarchy website.

## Deployment

The Website workflow builds pull requests and automatically deploys pushes to `main` to GitHub Pages at https://huacnlee.github.io/gpui-omarchy/. Manual runs deploy only when run against `main`. GitHub Pages uses GitHub Actions as its publishing source.

The workflow also runs Chromium interaction tests against the production build before uploading the Pages artifact.

CI sets `SITE_URL=https://huacnlee.github.io` and `BASE_PATH=/gpui-omarchy`. Local development stays at `/`; generated asset URLs respect the deployment base path. Deployment uses the built-in GitHub token and OIDC, with no additional secret.

## Search and AI documentation

The homepage and Guides share server-rendered canonical URLs, unique titles/descriptions, Open Graph and Twitter metadata, and JSON-LD describing the project and guide. `social.png` (512px) and `icon.png` (192px) are raster exports of the existing `favicon.svg` project mark. The canvas-only gallery is `noindex, follow` and links readers to Guides when JavaScript is disabled.

The build publishes `sitemap.xml`, `robots.txt`, `guides.md` and an `llms.txt` discovery index. The sitemap lists only the two indexable HTML pages; the Markdown and AI index remain directly readable and downloadable. `llms.txt` is a convenience for supporting tools, not a search ranking or automatic ingestion guarantee.

On GitHub Pages project hosting, `/gpui-omarchy/robots.txt` is **not** the domain-root robots file. Crawlers use `https://huacnlee.github.io/robots.txt`, which this repository does not control. Submit the project's `sitemap.xml` URL in Search Console, or reference it from that host-root file if you manage it. HTML also links the sitemap. No Search Console verification, indexing or ranking is implied by a successful build. See [Google's robots.txt location rules](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt) and [canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

`bun run build` checks the generated SEO metadata, sitemap scope, chapter links, Markdown parity and image dimensions. For a different public deployment, set `SITE_URL` and `BASE_PATH`, plus `SEO_EXPECTED_BASE` to its complete URL with a trailing slash so those checks validate the intended destination. Without deployment overrides, public metadata targets the project's GitHub Pages URL while the dev server serves at `/`.
