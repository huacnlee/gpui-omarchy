# Omarchy Web Design

These rules govern omarchy.org and any Omarchy-branded website, documentation site, or marketing page. Read them alongside the brand definitions in [design-system.md](design-system.md).

Source baseline: [`omacom/omarchy-site`](https://github.com/omacom/omarchy-site) at commit [`263afda`](https://github.com/omacom/omarchy-site/tree/263afda6fe2f46ea3d455a8bba02cad67d2b6f9f), inspected 2026-09-07. **Source facts** describe that revision; **design guidance** applies them to new work. Recheck the site before relying on remembered values, and inspect a local checkout when the user supplies one.

The web system is deliberately **not** the shell system. The shell is dense, monospaced, foreground-tinted and fill-averse; see [design-guides.md](design-guides.md). The website is a themed marketing and documentation surface with its own type pairing, its own button recipe and a solid brand fill. Do not transplant one set of rules into the other.

## Contents

1. [The pixel lattice](#1-the-pixel-lattice)
2. [Themes and tokens](#2-themes-and-tokens)
3. [Typography](#3-typography)
4. [Layout](#4-layout)
5. [Surfaces, edges and elevation](#5-surfaces-edges-and-elevation)
6. [Controls](#6-controls)
7. [Prose and documentation](#7-prose-and-documentation)
8. [Motion and accessibility](#8-motion-and-accessibility)
9. [Checklist](#9-checklist)

## 1. The pixel lattice

**Source fact.** The wordmark is an **81 × 19 pixel bitmap**. The brand asset draws it as 211 rects on a `51 × 50` cell; the operating system's `logo.svg` draws the same bitmap on a square `15 × 15` cell. Everything on the homepage is measured in that lattice:

```css
/* The wordmark slot is 88% of the padded container, capped at 896px,
   divided into the wordmark's own 81 columns. */
--pxc: calc(min((100cqw - 48px) * 0.88, 896px) / 81);
--pxr: calc(var(--pxc) * 50 / 51); /* rows are 50/51 of a column */
```

**Design guidance:** derive hero geometry, spacing and element widths from `--pxc` multiples rather than round numbers, so headline, wordmark, buttons and the background field share one grid. Elements marked for snapping are translated onto the nearest cell line **after** layout — position only, never size. Rounding box sizes to whole cells feeds back into the grid and makes the page settle visibly on load.

This is the reason the site reads as pixel-native without drawing a single decorative pixel. Do not imitate it with a CSS background grid.

## 2. Themes and tokens

**Source fact.** The site ships **22 themes**, each derived from an official palette in `omacom/omarchy` `themes/<id>/colors.toml`, with intermediate shades mixed. A visitor switches themes from the bar; `data-theme` on the root element selects the palette.

Two layers:

- `--t-*` — the runtime theme values. Only these change between themes.
- semantic color tokens (`--color-bg`, `--color-text`, `--color-brand`, …) — aliases the components use. Components never name a hex value.

| Token | Role |
|---|---|
| `--t-bg-deep` / `--t-bg` | Deepest ground (code blocks, hero field) and page canvas |
| `--t-surface` / `--t-surface-2` | Raised card and secondary/hover surface |
| `--t-border-subtle` / `--t-border-strong` | Hairline separators and visible control edges |
| `--t-text` / `--t-text-secondary` / `--t-text-muted` | Three text levels, in that order of prominence |
| `--t-brand` / `--t-brand-soft` / `--t-brand-ink` | Theme accent, its 12%-alpha wash, and text on a filled accent |
| `--t-selection` | Text selection ground |
| `--t-field-dim` … `--t-field-crest` | Five-step brand ramp for the hero field and brand artwork |

**The brand color is per theme.** Tokyo Night — the default — sets `--t-brand: #9ece6a`, the Omarchy green. Catppuccin sets `#89b4fa`, Gruvbox `#7daea3`, Matte Black `#e68e0d`. Green is the default brand color, not a permanent one; a page must read correctly in every theme.

**Design guidance:** never hard-code a hex value in a component. Adding a color to a page means adding it to all themes or expressing it as a token. `--color-ring` is the brand color, chosen so the focus indicator meets the 3:1 contrast requirement in every palette.

### The five-band ramp

`--t-field-{dim,mid,lit,hover,crest}` form a dark-to-light ramp of the brand hue. As a vertical gradient with **hard stops** at `0 / 26.316 / 36.842 / 57.895 / 73.684 / 100%` — 5, 2, 4, 3 and 5 wordmark rows out of 19 — it is the official brand gradient. It dresses the wordmark on page headers, fills the OMA mark, and is what the brand page bakes into themed asset downloads.

Use it only on brand artwork. It is not a decorative gradient for cards, buttons or headlines.

## 3. Typography

**Source fact.** Two families, with the roles reversed from the usual pairing:

| Family | Role |
|---|---|
| `JetBrains Mono Variable` | `--font-mono`, and the family on `html`, `body` and all body copy, UI labels and controls |
| `Geist Variable` | `--font-sans`, applied to `h1`–`h6` only |

Monospace is the voice of the page; the sans-serif exists to keep headings from shouting in a typewriter face. **Do not invert this.** A site that sets body copy in Geist and headings in JetBrains Mono is not the Omarchy website, and neither is one that is monospaced throughout.

| Role | Value |
|---|---|
| Section heading | `1.5rem`, `1.75rem` from the `sm` breakpoint, weight 600, `tracking-tight` |
| Section description | `15px`, relaxed leading, secondary text, `text-wrap: pretty` |
| Prose body | `15px` / `1.65`, secondary text |
| Prose `h2` / `h3` | `1.25rem` / `1.05rem`, weight 600, `letter-spacing: -0.01em` |
| Code | `0.86em` inline, `13px` in a block |
| Page subtitle under a wordmark | `12px`, `14px` from `sm`, weight 500, `letter-spacing: 0.18em`, uppercase, brand color |

Headings use `text-wrap: balance`. `font-synthesis` is off — never rely on a faux bold or faux italic.

Uppercase with wide tracking is the brand's display device: a wordmark with a letterspaced uppercase label beneath it. Add left padding equal to the tracking so the optical center stays true — a trailing letter-space otherwise pushes the line left.

## 4. Layout

**Source fact.**

| Measure | Value |
|---|---|
| Sticky bar height | `3.5rem` plus the top safe-area inset, published as `--nav-h` |
| Content column | `69rem` max, gutters `1rem`, `1.5rem` from `40rem` |
| Prose measure | `--measure: 48rem`, applied per block so structural layouts keep full width |
| Anchor offset | `scroll-margin-top: var(--nav-h)` on every `[id]` |
| `z-index` | nav 100, dropdown 200, modal 300, tooltip 400 — a fixed scale, with no arbitrary values elsewhere |

**Design guidance:** a full-bleed carousel keeps its inner padding aligned to the content column so slides line up with the section heading above them, and hides its own scrollbar so the page does not get a window-wide one. Section headings carry an optional trailing action that moves below the section on narrow screens; only one copy is ever visible.

Respect the safe-area insets. The bar includes the notch rather than sitting below it.

## 5. Surfaces, edges and elevation

**Source fact.** Every radius token in the scale is `0px`. The component library keeps its `rounded-*` classes; the scale zeroes them. Square is enforced centrally, so a component cannot opt out by accident.

**Elevation is a hairline ring, not a shadow.** Dark themes use `box-shadow: 0 0 0 1px oklch(1 0 0 / .07)`, rising to `.13` on hover, over a `150ms ease-out` transition. Light themes are the exception and may add a soft drop shadow beneath that ring.

Other edges:

- Images take a `1px` inset outline in a 10%-alpha ink, not a border — it never changes the layout box.
- Scrollbars are `8px`, the thumb in the **brand** color, lightening to `--t-field-hover` and `--t-field-crest` on hover and press. Code blocks use a neutral thumb instead.
- Text selection uses `--t-selection` with normal text color.

## 6. Controls

**Source fact — the website button.** This recipe is the site's, not the shell's.

| Size | Height | Padding | Text | Icon |
|---|---:|---:|---|---:|
| `xs` | 32 | 10 | 12 | 16 |
| `sm` | 36 | 12 | 14 | 16 |
| default | 40 | 16 | 14 | 20 |
| `lg` | 44 | 20 | 15 | 20 |

Icon-only buttons are square at the same four heights. Gaps are `6` on the small pair and `8` on the large pair, tightened on the side that holds an icon.

| Variant | Treatment |
|---|---|
| default | **Solid brand fill** with `--t-brand-ink` text; hover mixes 14% white into the fill |
| outline | Strong border on `surface`; hover moves to `surface-2` |
| secondary | `surface-2` fill; hover mixes 8% text color in |
| ghost | No chrome until hover |
| destructive | Destructive color at 10% with destructive text |
| link | Brand text with a hover underline |

Press feedback is `scale(0.96)`; transitions run `150ms ease-out` over background, border, color and transform. Disabled drops to 50% opacity and stops pointer events. Focus is a `2px` brand outline offset by `2px`, inset to `-2px` inside a scroll container so it is not clipped.

Fills are **opaque** on purpose: the animated hero field sits behind the controls and must not show through them.

**Design guidance:** the solid brand button is the site's primary action and is correct here. It is not the shell recipe — a desktop application still expresses priority through edges, per [Application Design § 3](application-design.md#3-emphasis-without-fills).

Badges are `20px` tall with `8px` of horizontal padding, `12px` text and `12px` icons.

## 7. Prose and documentation

**Source fact.**

- Links are **body-colored with a strong-border underline**; hover changes only the underline to the brand color. Underline offset `3px`, `skip-ink` on, transition `150ms`. Do not color documentation links with the accent.
- Unordered lists use `list-style: square`; markers are muted.
- Inline code and `kbd` sit on `surface-2` with `0.15em / 0.4em` padding and no radius.
- Code blocks sit on `bg-deep` with the elevation ring, `1em / 1.25em` padding, and scroll horizontally.
- Blockquotes take a `2px` left border in the brand color with muted text.
- Rules are a `1px` subtle border with `2em` of space.
- Heading anchors reveal a muted `#` on hover or focus, with the underline reserved at rest so hovering changes color only.

**Design guidance:** reserve hover-state geometry at rest. A link that gains an underline on hover, or a heading that gains a visible anchor that shifts the line, moves text under the reader's cursor.

## 8. Motion and accessibility

- Transitions are `150ms ease-out` on color, border, box-shadow and transform. There is no page-level animation budget beyond that.
- **Theme switches must not animate.** Every color would tween independently and the page would visibly smear. Suppress all transitions for the duration of the swap.
- `prefers-reduced-motion` disables smooth scrolling and the caret blink, and must never remove information.
- Focus is always visible, always the brand outline, and is inset rather than removed where a container would clip it.
- Interactive elements set `touch-action: manipulation` so a press has no 300 ms tap delay.
- The typed caret is `0.1em` wide and blinks on a `1.06s` step, stopping while text is actually being typed.
- Decorative brand artwork is `aria-hidden`; a wordmark that carries meaning gets `role="img"` and a label.

## 9. Checklist

- [ ] The page reads correctly in the default theme and in at least one light theme and one non-green theme.
- [ ] No component names a hex value; every color resolves through a token.
- [ ] Headings are the sans family, body and controls are the mono family, and neither is faux-bolded.
- [ ] Radius is zero everywhere; elevation is a ring, not a drop shadow, except in a light theme.
- [ ] Focus is visible on every interactive element, including inside scroll containers.
- [ ] Documentation links are body-colored with a brand underline on hover, not accent text.
- [ ] Hover states change color only; nothing resizes, reflows or shifts.
- [ ] Theme switching produces no transition smear.
- [ ] Brand artwork uses the official asset — masked, never redrawn — and the five-band ramp only where the brand calls for it.
