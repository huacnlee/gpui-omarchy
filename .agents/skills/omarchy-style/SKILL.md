---
name: omarchy-style
description: Use when designing, reviewing, or rewriting Omarchy-branded UI, websites, themes, posters, illustrations, logos, icons, product copy, menus, keyboard shortcuts, or community artifacts that must match Omarchy's official visual and interaction language.
---

# Omarchy Style

Apply Omarchy's official community design system across visual, interaction, and language work. Preserve the brand core while allowing themes and local community expression to vary.

## Required foundation

Read [references/design-system.md](references/design-system.md) completely before changing or creating an Omarchy artifact.

Never redraw the wordmark, typeset it in a font, or ask an image model to reproduce it. Use an official asset and recolor it by masking, per design system § 2.1:

- [`omarchy-wordmark.svg`](https://omarchy.org/brand/omarchy-wordmark.svg) — the canonical brand and web wordmark. Also [`omarchy-logo.svg`](https://omarchy.org/brand/omarchy-logo.svg) and the Foundation's [`oma-logo.svg`](https://omarchy.org/brand/oma-logo.svg).
- [assets/logo.svg](../../assets/logo.svg) — the same 81 × 19 bitmap on the operating system's square cell, for artifacts that reproduce the desktop.

External fonts complete the type and icon system; fetch them from their sources when a task needs them:

- [Omarchy Font](https://github.com/markcuda/Omarchy-Font) (community, MIT) for wordmark-style display lines such as city labels and short headlines (design system § 2.5).
- `JetBrainsMono Nerd Font` for text and every functional UI icon; Omarchy has no SVG icon set (design system § 6).
- The official [`omarchy.ttf`](https://github.com/omacom/omarchy/tree/quattro/default/fonts/omarchy) icon font for the Omarchy mark and agent brand glyphs, `U+E900`–`U+E908` (design system § 6).
- `Geist` for web headings only; body copy and controls on the site stay in `JetBrains Mono` (design system § 4.1).

## UI foundation

For any application, component, layout, sizing, spacing, typography, state, or theme-integration work, read [Design Guides](references/design-guides.md) in full before designing. Use its source revision and component formulas; do not reduce Omarchy to palette + 28px controls + square borders. Evaluate the complete composition, not only individual tokens.

When the artifact is a **native application** rather than the shell itself, also read [Application Design](references/application-design.md). It covers reading the user's system theme and deriving missing roles, the application role model, emphasis without solid fills, per-component baseline geometry, state ownership, and the keyboard and focus contract.

Distinguish upstream facts, design recommendations, and explicit platform/user adaptations. Honor the user's font, icon and corner choices while preserving hierarchy and proportions. When the user supplies a local Omarchy checkout, inspect that revision before relying on remembered defaults.

## Route by task

| Task | Required guidance |
|---|---|
| UI, settings, shell, panels, states | Design Guides in full, then design system §§ 3–7 and 13–15 |
| Desktop application, component library, gallery | Design Guides, then Application Design in full |
| Reading or deriving a theme from `colors.toml` | Application Design § 1, then design system § 3 |
| Website or documentation layout | [Web Design](references/web-design.md) in full, then design system §§ 3–4, 8, 10 and 13–15 |
| Product copy, labels, menus, naming | Design system §§ 10–11 |
| Keyboard shortcuts or hint rails | Design system § 12; verify existing bindings before proposing new ones |
| Logo, icon, or glyph | Design system §§ 2, 3.4 and 6; use an official brand asset, Nerd Font glyphs, and `omarchy.ttf`, never an icon CDN or a redraw |
| Poster, illustration, city cover | Read [references/illustration-design.md](references/illustration-design.md) in addition to the design system |
| Theme or palette | Design Guides theme resolution and scaling, then design system § 3 and Application Design § 1; include shell surface/state/size overrides and derived roles, not only colors |

For city artwork, verify unsupported local claims against authoritative sources during the task. Keep research notes outside the distributable Skill; include only the short rationale needed to explain the delivered concept.

## Shared contract

An Omarchy artifact must preserve:

- the official sharp wordmark or approved ASCII/icon form;
- the configured shell typography and Nerd Font / `omarchy` icon glyphs for faithful shell reproduction; explicit application font and icon choices are allowed as documented platform adaptations;
- terminal-native, keyboard-first structure;
- strict grids, recommended square geometry (`radius: 0` by default; deliberate slight rounding is allowed), thin borders, and restrained effects;
- one primary semantic accent per screen or cover;
- concise, specific copy with honest paths, commands, states, and consequences;
- factual product behavior, local identity, branding, and shortcuts;
- positive, respectful regional representation built from locally meaningful landmarks, imagery, culture, and color;
- accessible contrast, visible focus, and usable responsive behavior where interactive.

Do not reduce Omarchy to black plus neon green. Do not substitute generic SaaS, cyberpunk, glassmorphism, rounded-card, or marketing-copy conventions.

## Community cover defaults

For Luma-style event covers, default to a 1:1 square. Omit dates, times, venues, URLs, QR codes, and organizer details unless explicitly requested. Default cover text is the official wordmark plus `<CITY> MEETUP`.

The official fallback cover is the baseline to depart from deliberately, not to ignore. On a square canvas: the deep background, everything in the theme's brand color, the wordmark and its label centered as one stack with a gap of about `8%` and side padding of `10%`. The label is monospaced uppercase at `0.28em` tracking, padded left by that same amount so it stays optically centered, and sized to the canvas rather than fixed. Decoration is two nested corner rules in opposite corners at roughly `22%` and `35%` opacity, plus a few small squares stepping diagonally at `20%`. Nothing else.

For multi-city sets, keep wordmark scale, safe area, city-label baseline, logical pixel scale, and semantic palette structure consistent. Preserve the user's city labels. Create 1–3 genuinely different covers per city:

- one when references support one dominant idea;
- two by default, using different visual modes and compositions;
- three when multiple verified anchors support equally strong stories.

Different styles are not recolors or crops. Save approved demonstrations under `assets/meetup/<city>-<mode>.<ext>`, and keep the example asset index at `assets/meetup/INDEX.md` current.

Meetups are community events. The official rules are that anyone may organize one anywhere, no city is owned, and `Omarchy <City>` is an acceptable name — but artwork and copy must not imply that the event is Omarchy itself, the Omacom Foundation, or an authorized representative, and must not present a community meetup as an official or endorsed event. Do not add Foundation marks, sponsorship claims, or official-sounding badges that were not requested.

Every delivered city concept must include a short **local rationale**: the verified anchor, supporting cultural cue, and source of its palette. Prefer affirmative civic, cultural, natural, architectural, scientific, or community narratives. Exclude poverty spectacle, danger, disorder, political conflict, ethnic caricature, stigmatizing neighborhoods, and other negative regional framing unless the user explicitly requests critical documentary work.

## Delivery check

Before declaring completion, verify the relevant checklist in the design system plus these invariants:

- official assets are exact and unobstructed, and display lettering is Omarchy Font or JetBrains Mono, not an image-model rendering;
- the wordmark is an official asset recolored by masking — one solid theme color or the five-band ramp, never a redraw or an invented gradient;
- a web artifact resolves every color through a theme token, sets headings in Geist and everything else in JetBrains Mono, and reads correctly in a light theme and a non-green theme;
- text, names, dates, behavior, and shortcuts are accurate;
- theme colors have semantic roles;
- composition, intrinsic control sizes, scale, and state hierarchy follow the Design Guides; square corners remain recommended and explicit theme/user overrides are respected;
- an application resolves the user's theme, derives missing roles from that same palette, and falls back atomically to one complete theme; states stay foreground-tinted rather than accent-coated;
- every interactive component is reachable and operable by keyboard, keeps stable bounds across states, and carries an explicit accessible name;
- local symbols and landmarks are verified;
- decorative effects do not weaken hierarchy or readability;
- examples demonstrate the Skill without becoming mandatory templates;
- every committed image is 1024x1024, palette-quantized, and under 150 KB — see the asset output rules in [references/illustration-design.md](references/illustration-design.md).
