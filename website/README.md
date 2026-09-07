# GPUI Omarchy website

An Astro website presenting the relationship between GPUI Kit, gpui-base and Omarchy Style. Tailwind CSS supplies the token and utility layer; Base UI powers React islands for the workspace preview and theme menu. The interactive preview is a browser demonstration, separate from the native Rust gallery.

## Development

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

The page follows Omarchy Style's web-specific rules: the official masked wordmark, Geist headings, JetBrains Mono body text, square geometry and semantic theme colors. Tokyo Night is the default; Flexoki Light and Catppuccin demonstrate light and non-green themes. The primary website action uses the web brand fill, while the component workbench retains outlined native-style actions.

The Omarchy wordmark is the original asset from https://omarchy.org/brand/omarchy-wordmark.svg. The gallery image is a user-provided native screenshot from the repository README. Fonts are self-hosted through Fontsource packages. This is an independent community project, not the official Omarchy website.
