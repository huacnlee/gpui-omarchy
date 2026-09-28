# Omarchy Illustration Design Guide

Use this reference for posters, event covers, wallpapers, website artwork, interface illustrations, editorial graphics, campaign art, city illustrations, and image-generation prompts. It specializes the broader [design system](design-system.md); the brand rules in that document remain authoritative.

Read [example-quality.md](example-quality.md) when calibrating finish, detail density, or series consistency.

## Core idea

An Omarchy illustration is a themed desktop world translated into a still image: beautiful, opinionated, keyboard-first, hackable, and locally specific. It is not a generic technology poster with green text added afterward.

The artwork must communicate in this order:

1. Omarchy;
2. the city or community;
3. the illustration's idea;
4. optional event facts.

The hierarchy above adapts to context. A wallpaper may contain no words; an interface illustration must support the surrounding state before expressing a city or narrative; an editorial image may prioritize its subject over visible branding.

## Delivery contexts

Choose the context before choosing a visual mode. City-cover conventions do not automatically apply to other illustration work.

| Context | Primary job | Branding and text | Composition constraints |
|---|---|---|---|
| Event or city cover | Establish identity at thumbnail size | Follow the brief; official wordmark when required | Strong vertical hierarchy and one dominant city narrative |
| Wallpaper | Create atmosphere without obstructing the desktop | Usually no text; logo only when explicitly requested | Protect likely panel, launcher, notification, and terminal zones; support common crops and aspect ratios |
| Website hero | Establish tone while leaving room for live HTML copy and actions | Generate artwork without embedded copy; compose brand assets separately | Reserve intentional negative space; provide desktop and mobile crop logic |
| Website section or editorial image | Explain or reinforce one idea | Usually text-free | Match the content column, reading direction, and surrounding background; avoid poster-like title bands |
| Interface illustration | Clarify an empty, loading, success, error, or onboarding state | No decorative slogans; UI copy remains native text | Small silhouette, low distraction, accessible contrast, and graceful scaling at compact sizes |
| Icon-like spot illustration | Provide a compact visual cue | No embedded text | One subject, minimal depth, simplified palette, recognizable at 64–256 px |

Do not force the official wordmark into every illustration. Use it when the artifact itself represents Omarchy—such as an official cover, campaign graphic, or branded wallpaper—not when the illustration sits inside an already branded website or interface. Never rasterize important UI labels or explanatory copy into generated artwork.

## Visual modes

Choose exactly one primary mode.

| Mode | Best for | Image language | Texture |
|---|---|---|---|
| Pixel linework | Architecture, skylines, icons, mirrored water | One- or two-color outlines on a dark field | Sparse ordered dithering |
| Low-resolution pixel illustration | Characters, animals, community scenes, landscapes | Large intentional pixel clusters and clear silhouettes | Controlled dithering in sky and shadow |
| Retro-futurist pixel scene | Roads, sunsets, night cities, vehicles, dramatic geography | Cinematic composition with a limited theme palette | Scanlines or low-resolution gradients built from pixels |
| Low-light scene with pixel typography | Authentic meetups and workspaces | Real dark environment, screen light, honest people and devices | Natural grain; no HDR treatment |

Use photography only when authenticity is the point. A request for a stylized community cover defaults to pixel illustration, not photorealism.

## Composition contract

For a square community cover, organize the canvas vertically:

- **12–25% Brand band:** official wordmark at 68–90% width with at least `2x` clear space.
- **5–10% Identity band:** city and meetup label, shorter and quieter than the wordmark.
- **50–68% Story field:** one dominant subject plus at most one supporting local anchor.
- **0–10% Fact band:** only facts the user wants embedded. Luma-style covers omit this band by default.

When no dimensions are supplied for an event cover, use a 1:1 square.

Keep a strict grid. One controlled overlap or offset may create energy, but illustration, wordmark, and event text never collide.

## Character and animal illustration

Characters should behave like participants in the community, not pasted mascots.

- Preserve recognizable anatomy and silhouette at thumbnail size.
- Pixel-stylize form through clusters, planes, linework, and dithering—not through malformed geometry.
- Give the subject one clear action: working, meeting, traveling, observing, or building.
- Use humor through behavior and composition, not exaggerated cuteness.
- A globally recognized local symbol may dominate the frame; supporting landmarks then become small factual anchors.

For Chengdu, a panda may be the hero. Keep it graphic rather than photorealistic, and pair it with a verified Chengdu cue such as the full Tianfu Twin Towers complex or the snow-mountain city horizon.

## Local identity

Research before drawing. Separate four categories:

| Category | Use |
|---|---|
| City-exclusive symbol | Preferred primary anchor |
| Strong city association | Good subject when paired with a local anchor |
| Regional symbol | Supporting detail only |
| Generic national trope | Usually omit |

Use one anchor and one supporting cue. A symbol pileup reads like a souvenir shop. Preserve the identifying geometry of landmarks; a named building reduced to generic rectangles does not count as local identity.

Use this source order: official city or cultural institution, landmark owner or architect, museum or conservation body, then reputable editorial sources for visual corroboration. Image search may locate references, but a search-result caption alone is not verification. Store reusable findings in `references/research/<city>-visual-identity.md` with direct links.

### Positive regional representation

Select local material that residents can recognize with pride: civic spaces, architecture, ecology, arts, science, transport, craft, food culture, or everyday community life. Show people and places with dignity and agency.

Do not use hardship, danger, disorder, pollution, political conflict, ethnic or religious caricature, stigmatized districts, or exoticized poverty as visual shorthand for a place. Avoid turning cultural dress, sacred symbols, or living traditions into decorative costume. If a brief explicitly concerns a difficult subject, research it separately and frame it accurately rather than importing it into ordinary community artwork.

## Pixel craft

- Work from a low logical resolution and scale by integer multiples.
- Use hard edges and nearest-neighbor scaling.
- Build curves from deliberate stair steps, not softened vector edges.
- Limit each material to a small number of tones.
- Dither only to bridge intentional value steps or create atmosphere.
- Keep texture away from wordmark and important text.
- Test the silhouette in pure black and white before adding color.

### Asset output

Image models return 24-bit files carrying paper grain, sensor noise, and hundreds of thousands of near-duplicate colors. None of that survives as pixel art, and PNG cannot compress high-frequency noise — a single unprocessed cover ran to 3.1 MB. Normalize before committing:

- deliver 1024x1024, resampled with nearest-neighbor so pixel edges stay hard;
- quantize to a palette of 16-32 colors, up to 48 for a dense scene;
- quantize with dithering **off** — Floyd-Steinberg sprays random noise across flat areas, which both looks wrong and defeats compression;
- clear paper grain and dark-area speckle with an edge-preserving blur, never a plain or median blur, which turns foliage into smears and erases small subjects;
- keep every asset under 150 KB, and re-run the whole chain from the original file rather than recompressing an already-processed one, since repeated quantization compounds its own losses.

Reference material carrying an authoritative palette keeps its native resolution; upscaling blurs the very benchmark it exists to define.

```bash
magick in.png -filter Point -resize 1024x1024 \
  -selective-blur 0x2+12% -dither None -colors 24 PNG8:out.png
optipng -quiet -o2 out.png
```

## Color

Select a mother theme, then assign semantic roles:

- `background` for the canvas;
- `foreground` and `bright_foreground` for structure and hierarchy;
- one `accent` for focus, cursor, selected state, and the key visual beat;
- `muted` for depth and secondary lines;
- at most two status colors when they carry actual meaning.

Black and green is one valid theme, not the definition of Omarchy. Tokyo Night blue, sunset magenta-orange, regional night colors, or a strict light theme are valid when the semantic hierarchy remains intact.

### Color provenance

The mother theme must have a stated local or product basis. Derive it from one of:

- an official city or cultural identity system;
- characteristic local architecture, materials, landscape, climate, or night environment;
- a verified artwork, craft, transit, or civic color strongly associated with the place;
- an official Omarchy theme chosen deliberately for the series.

Do not assign synthwave, neon, national-flag, or “regional” colors by stereotype. Record the palette rationale beside each concept. When an otherwise strong composition uses an arbitrary palette, keep it as a composition reference and recolor it from researched sources before approval.

## Typography and branding

- Compose with an official asset — the brand [`omarchy-wordmark.svg`](https://omarchy.org/brand/omarchy-wordmark.svg), or [the bundled OS SVG](../../../assets/logo.svg) for desktop-reproducing work. Do not ask an image model to invent the wordmark. To recolor, mask the asset over the fill rather than editing it.
- Keep the wordmark sharp, unwarped, and isolated from imagery, in one solid color or the official five-band ramp (design system § 3.4). No other gradient, glow, or bevel.
- Set the city or event label (`CHENGDU MEETUP`) and any short headline in [Omarchy Font](https://github.com/markcuda/Omarchy-Font), uppercase, one color, at an integer pixel size smaller than the wordmark, per design system § 2.5. It shares the wordmark's construction, so the brand band and identity band read as one system.
- Use JetBrains Mono or JetBrainsMono Nerd Font for every other Latin line: facts, credits, URLs, rails.
- Use a tested monospaced or stable CJK fallback for Chinese; Omarchy Font covers ASCII only, so a bilingual label pairs it with the CJK face on a shared baseline.
- Never let the image model letter any of these; compose text after generation.
- Keep copy direct. Prefer `CHENGDU MEETUP` over invented slogans.

### Local display typography

Keep the official Omarchy wordmark exact. Omarchy Font is the default for place names; secondary place names may instead carry a locally grounded typographic voice when the brief benefits from it.

- Preserve the real structural features of the local writing system rather than forcing every script into a Latin monospace skeleton.
- Translate those features into Omarchy's hard edges, square grid, restrained palette, and terminal-like rhythm.
- Localize arrangement as well as glyph shape: Japanese may use vertical native text; Hong Kong may use a compact vertical signboard rhythm; New York may use a stacked slab label; a city with an athletic-lettering tradition may support a restrained arch.
- Use orientation and layout only when they are readable and culturally plausible. Do not treat vertical writing, calligraphy, seals, varsity letters, or signage as universal regional decoration.
- Avoid copying protected team, school, transit, venue, or commercial wordmarks. Extract broad construction principles and redraw an original city label.
- Keep local display type subordinate to the official wordmark and deterministic: generated imagery should not be responsible for final spelling or glyph construction.

## Image-generation workflow

Use image generation for the story field, not for exact brand geometry or final typography.

1. Supply verified visual references and label their roles.
2. Prompt for a text-free illustration with reserved brand and identity bands.
3. Specify the chosen visual mode, logical pixel scale, palette roles, composition, and avoid list.
4. Inspect anatomy, landmark geometry, local accuracy, palette, and edge treatment.
5. Compose the official logo and exact text deterministically: an official wordmark asset, Omarchy Font for the city label, JetBrains Mono for facts.
6. Verify the final at thumbnail size, 1×, and 2×.

### Prompt shape

```text
Asset: square Omarchy community cover illustration
Local references: <image roles and factual invariants>
Primary subject: <one subject and one action>
Supporting anchor: <one verified local cue>
Mode: <pixel linework | low-resolution pixel illustration | retro-futurist pixel scene | low-light scene>
Composition: reserve top brand band and identity band; describe story field
Theme roles: background, foreground, accent, muted
Pixel craft: hard integer edges, controlled dithering, nearest-neighbor character
Text: none; branding and typography added after generation
Avoid: photorealism unless requested, malformed mascot anatomy, generic skyline, tourist-symbol pileup, fake terminal text, glow, glossy 3D, watermark
```

## Multi-city series

Lock these invariants across the set:

- canvas ratio and export dimensions;
- official wordmark size and position;
- city-label baseline and type scale;
- safe margins and story-field bounds;
- logical pixel size and edge treatment;
- semantic palette structure.

Vary these per city:

- primary local subject;
- one supporting landmark or cultural cue;
- composition inside the story field;
- mother theme when the series intentionally allows multiple themes.

Do not create a series by replacing the city name and recoloring the same scene.

Produce 1–3 covers for each requested city. Default to two distinct visual modes. Use one when evidence supports a single strong concept; use three when multiple verified anchors produce clearly different stories. Existing examples may contain date or venue text from earlier briefs; they demonstrate visual modes, not the current cover-copy contract.

## Detail and finish

Community posters target a visual density of 6–9/10. Richness comes from structured layers, not miscellaneous objects.

A finished narrative cover normally includes:

- clear foreground, midground, and background separation;
- identifying architectural geometry rather than icon-like shorthand;
- secondary environmental rhythm such as trees, water, tracks, rooflines, clouds, or street furniture;
- material detail expressed through pixel clusters, windows, masonry, foliage, reflection, shadow, or controlled dithering;
- at least one small discovery that rewards close viewing without competing with the main subject;
- consistent micro-typography or icon rails only when the brief allows supporting information.

At thumbnail size the main silhouette must remain clear. At full size, the image should reveal deliberate structure and texture. Sparse linework is acceptable only when negative space is visibly intentional and the remaining geometry is exceptionally precise.

### Reference-level density test

Use the Melbourne reference as the minimum benchmark for a narrative city cover. Before approval, the story field should pass all four checks:

1. **Depth:** a dominant foreground device or character, a locally identifying midground, and an atmospheric background are visibly separated by scale, value, and overlap.
2. **Construction:** the main landmark contains enough truthful substructure—windows, bays, arches, roof rhythm, rails, trusses, facade modules, or planting—to remain identifiable without its caption.
3. **Surface:** at least three material families receive distinct pixel treatment, such as masonry, glass, metal, foliage, water, snow, or asphalt. Reusing one dither texture everywhere fails this check.
4. **Continuity:** secondary marks connect the frame instead of floating independently: tracks lead to the city, reflections continue vertical lights, tree lines bridge architecture, and clouds or mountain ridges carry the eye laterally.

Allocate detail by hierarchy rather than uniformly: about 50% around the primary subject and local anchor, 30% in connective environment, and 20% in atmosphere and discoveries. Keep the brand band nearly texture-free. A city silhouette made from plain rectangles, a landmark reduced to an icon, or large untreated empty areas is a draft even when the color and typography are correct.

For no-logistics Luma covers, replace the reference poster's lower information rail with a composed environmental ending—foreground pavement, water, table edge, transit track, planting, or a restrained terminal rule. Do not fill the empty band with invented metadata.

## Common failures

| Failure | Correction |
|---|---|
| Beautiful but not Omarchy | Restore official wordmark, monospace hierarchy, grid, semantic accent, and terminal-native structure |
| Omarchy-looking but generic city | Replace decorative skyline with a verified local anchor whose geometry is preserved |
| Photorealistic mascot poster | Return to one of the pixel modes and stylize through clusters or linework |
| Correct symbols but no beauty | Reduce to one dominant subject, increase negative space, and establish scale contrast |
| Image model misspells branding | Generate the story field without text and compose official assets afterward |
| Too many terminal decorations | Keep only terminal elements that explain hierarchy, focus, or action |
| Tourist collage | Keep one city-exclusive anchor and one supporting cue |

## Final review

The cover passes when it is recognizable as Omarchy without reading the event name, recognizable as its city without relying only on the city name, and visually strong at Luma thumbnail size.
