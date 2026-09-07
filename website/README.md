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

## Deployment

The Website workflow builds pull requests and automatically deploys pushes to `main` to GitHub Pages at https://huacnlee.github.io/gpui-omarchy/. Manual runs deploy only when run against `main`. GitHub Pages uses GitHub Actions as its publishing source.

CI sets `SITE_URL=https://huacnlee.github.io` and `BASE_PATH=/gpui-omarchy`. Local development stays at `/`; generated asset URLs respect the deployment base path. Deployment uses the built-in GitHub token and OIDC, with no additional secret.
