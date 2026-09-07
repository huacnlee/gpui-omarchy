// @ts-check

import { svg } from "gpui";
import {
  Avatar as BaseAvatar,
  AvatarFallback,
  Button as BaseButton,
  h_flex,
  v_flex,
} from "gpui-base";
import {
  optionalCallback,
  optionalText,
  requiredRenderable,
  requiredRenderables,
  requiredText,
  stableId,
} from "./internal.js";
import { alpha, style } from "./style.js";
import { Label, MutedText } from "./text.js";

export class ListRow {
  /** @type {string} */
  #id;

  #selected = false;

  #disabled = false;

  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;

  /** @type {Array<import("gpui").Element | import("gpui").Entity>} */
  #children = [];

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("ListRow", id);
  }

  /** @param {boolean} [value] */
  selected(value = true) {
    this.#selected = value;
    return this;
  }

  /** @param {boolean} [value] */
  disabled(value = true) {
    this.#disabled = value;
    return this;
  }

  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    this.#onClick = optionalCallback("ListRow", "onClick", callback);
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("ListRow", "child", element));
    return this;
  }

  /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
  children(elements) {
    this.#children.push(...requiredRenderables("ListRow", "children", elements));
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const interactive = typeof this.#onClick === "function";
    const tokens = style();
    const foreground = this.#disabled
      ? cx.theme().colors.muted_foreground
      : this.#selected
        ? cx.theme().colors.accent_foreground
        : cx.theme().colors.foreground;
    const row = interactive
      ? BaseButton.new(this.#id)
          .disabled(this.#disabled)
          .selected(this.#selected)
      : h_flex().id(this.#id);

    return row
      .items_center()
      .w_full()
      .min_w_0()
      .gap(cx.theme().spacing.sm)
      .px(cx.theme().spacing.md)
      .py(cx.theme().spacing.md)
      .bg(this.#selected ? cx.theme().colors.accent : cx.theme().colors.surface)
      .text_color(foreground)
      .when(interactive && !this.#disabled, (element) =>
        element.on_click(this.#onClick),
      )
      .when(interactive && !this.#disabled, (element) =>
        element.hover((appearance) =>
          appearance.bg(
            this.#selected
              ? cx.theme().colors.accent
              : cx.theme().colors.muted,
          ),
        ),
      )
      .when(interactive && !this.#disabled, (element) =>
        element.active((appearance) =>
          appearance.bg(
            this.#selected
              ? cx.theme().colors.accent
              : alpha(foreground, tokens.state.pressedFillAlpha),
          ),
        ),
      )
      .when(interactive && !this.#disabled, (element) =>
        element.focus((appearance) =>
          appearance
            .bg(
              this.#selected
                ? cx.theme().colors.accent
                : alpha(foreground, tokens.state.focusFillAlpha),
            )
            .border(tokens.state.focusBorderWidth)
            .border_color(
              alpha(
                cx.theme().colors.ring,
                tokens.state.focusBorderAlpha,
              ),
            ),
        ),
      )
      .children(this.#children);
  }
}

/**
 * The badge that opens a row, or stands in for an account in a title bar.
 *
 * `gpui-base`'s `Avatar` picks between an image and a fallback and draws
 * nothing else, so the shape, the size and the type all belong to a
 * presentation layer. This one is a square block rather than a disc: the
 * Omarchy kit has no circles in it, and initials in a filled square is what a
 * terminal writes a badge as.
 *
 * `.initials(text)` and `.icon(asset)` are the two fallbacks, and exactly one
 * is required — an avatar with neither has nothing to draw.
 *
 * `.tint(color)` supplies a categorical hue the semantic tokens cannot know,
 * such as one derived from the subject's own name, and it is also what decides
 * whether the badge draws a box at all. A tinted avatar is a filled square:
 * the fill *is* the identity, which is what makes a column of them scannable.
 * An untinted one draws only its mark, because it has no identity to fill and
 * is almost always sitting inside something that already frames it — an
 * `AvatarButton`, a row, a header. Two nested boxes is one box too many.
 */
export class Avatar {
  #initials;
  #asset;
  #description;
  /** @type {import("gpui").Color | undefined} */
  #tint;
  /** @type {number | undefined} */
  #extent;

  /** @param {string} text one or two characters */
  initials(text) {
    this.#initials = text;
    return this;
  }

  /** @param {string} asset complete application-root-relative asset path */
  icon(asset) {
    this.#asset = asset;
    return this;
  }

  /** @param {string} text the accessible name */
  description(text) {
    this.#description = text;
    return this;
  }

  /** @param {import("gpui").Color | undefined} color */
  tint(color) {
    if (color !== undefined && typeof color !== "string") {
      throw new Error("Avatar tint must be a colour string when supplied");
    }
    this.#tint = color;
    return this;
  }

  /** @param {number} value the badge's drawn extent, in scaled pixels */
  extent(value) {
    if (!Number.isFinite(value) || Number(value) <= 0) {
      throw new Error("Avatar extent must be a positive number");
    }
    this.#extent = Number(value);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const initials = optionalText("Avatar", "initials", this.#initials);
    const asset = optionalText("Avatar", "icon", this.#asset);
    if (!initials && !asset) {
      throw new Error("Avatar requires initials or an icon");
    }
    if (initials && asset) {
      throw new Error("Avatar takes initials or an icon, not both");
    }
    const description = optionalText(
      "Avatar",
      "description",
      this.#description,
    );
    const tokens = style();
    const extent = this.#extent ?? tokens.space(26);
    const tint = this.#tint;
    const own = tint ?? cx.theme().colors.foreground;

    return BaseAvatar.new()
      .flex_none()
      .w(extent)
      .h(extent)
      .rounded(tokens.cornerRadius)
      .overflow_hidden()
      // A badge is a filled mark, not a resting control surface, so it takes
      // the selected fill rather than the four percent a button rests at: a
      // tint you cannot see is a tint that identifies nothing.
      .when(Boolean(tint), (element) =>
        element
          .border(tokens.state.normalBorderWidth)
          .border_color(alpha(own, tokens.state.normalBorderAlpha))
          .bg(alpha(own, tokens.state.selectedFillAlpha)),
      )
      .when(Boolean(description), (element) =>
        element.accessibility_label(String(description)),
      )
      .fallback(
        AvatarFallback.new()
          .size_full()
          .flex()
          .items_center()
          .justify_center()
          .text_size(tokens.font.body)
          .line_height(1)
          .font_weight(700)
          .text_color(own)
          .child(
            initials
              ? initials
              // Sized from the box rather than from the type scale: an avatar
              // is drawn at whatever extent its container gives it, and a mark
              // pinned to one size would swim in a large one and overflow a
              // small one.
              : svg(String(asset))
                  .flex_none()
                  .size(Math.max(1, Math.round(extent * 0.6))),
          ),
      );
  }
}

/**
 * One reading: a muted field label above its figure.
 *
 * A basis rather than a width is what makes a row of these responsive without
 * a media query — two fit a narrow pane, four fit a wide one, and the row
 * rewraps instead of squeezing every figure into the same few pixels.
 */
export class Metric {
  #title;
  #value;
  /** @type {import("gpui").Color | undefined} */
  #tone;
  /** @type {number | undefined} */
  #basis;
  /** @type {string} */
  #size = "subtitle";

  /** @param {string} [title] */
  constructor(title) {
    this.#title = title;
  }

  /** @param {string} text */
  title(text) {
    this.#title = text;
    return this;
  }

  /** @param {string} text */
  value(text) {
    this.#value = text;
    return this;
  }

  /** @param {import("gpui").Color | undefined} color a reading, not a state */
  tone(color) {
    this.#tone = color;
    return this;
  }

  /** @param {string} value the figure's step on the shared type scale */
  size(value) {
    this.#size = value;
    return this;
  }

  /** @param {number} value the wrapping basis, in scaled pixels */
  basis(value) {
    if (!Number.isFinite(value) || Number(value) <= 0) {
      throw new Error("Metric basis must be a positive number");
    }
    this.#basis = Number(value);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const title = requiredText("Metric", "title", this.#title);
    const value = requiredText("Metric", "value", this.#value);
    const tokens = style();
    return v_flex()
      .min_w_0()
      .flex_basis(this.#basis ?? tokens.space(104))
      .flex_grow(1)
      .gap(tokens.spacing.xxs)
      .child(new MutedText(title).truncate().build(cx))
      .child(
        new Label(value)
          .size(this.#size)
          .tone(this.#tone)
          .truncate()
          .build(cx),
      );
  }
}

/** A wrapping row of `Metric`s: the same readings at any pane width. */
export class MetricGrid {
  #id;
  /** @type {Array<import("gpui").Element | import("gpui").Entity>} */
  #children = [];

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("MetricGrid", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("MetricGrid", "child", element));
    return this;
  }

  /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
  children(elements) {
    this.#children.push(
      ...requiredRenderables("MetricGrid", "children", elements),
    );
    return this;
  }

  /** @param {import("gpui").Context} _cx */
  build(_cx) {
    const tokens = style();
    return h_flex()
      .id(this.#id)
      .flex_wrap()
      .items_start()
      .px(tokens.spacing.rowPaddingX)
      .py(tokens.spacing.sm)
      .gap_x(tokens.spacing.lg)
      .gap_y(tokens.spacing.sm)
      .children([...this.#children]);
  }
}

/**
 * Label-and-value rows: the same pairs a `MetricGrid` draws as tiles, drawn as
 * a list instead, for a narrow column where a wrapping grid would be one tile
 * per line anyway.
 */
export class DefinitionList {
  #id;
  /** @type {Array<{title: string, value: string, tone?: import("gpui").Color}>} */
  #entries = [];

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("DefinitionList", id);
  }

  /**
   * @param {string} title
   * @param {string} value
   * @param {import("gpui").Color} [tone]
   */
  entry(title, value, tone) {
    this.#entries.push({
      title: requiredText("DefinitionList", "entry title", title),
      value: requiredText("DefinitionList", "entry value", value),
      tone,
    });
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    return v_flex()
      .id(this.#id)
      .gap(tokens.spacing.sm)
      .children(
        this.#entries.map((entry) =>
          h_flex()
            .items_center()
            .justify_between()
            .gap(tokens.spacing.lg)
            .child(new MutedText(entry.title).build(cx))
            .child(new Label(entry.value).tone(entry.tone).build(cx)),
        ),
      );
  }
}

/**
 * A value meant to be read aloud or typed somewhere else: a pairing code, a
 * fingerprint, a one-time token. Set large, spaced and boxed, because the
 * whole job of the element is that someone can transcribe it without making a
 * mistake.
 */
export class CodeBlock {
  #id;
  #value;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("CodeBlock", id);
  }

  /** @param {string} text */
  value(text) {
    this.#value = text;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const value = requiredText("CodeBlock", "value", this.#value);
    const tokens = style();
    return h_flex()
      .id(this.#id)
      .items_center()
      .justify_center()
      .w_full()
      .py(tokens.spacing.lg)
      .px(tokens.spacing.rowPaddingX)
      .rounded(tokens.cornerRadius)
      .border(tokens.state.normalBorderWidth)
      .border_color(
        alpha(cx.theme().colors.foreground, tokens.state.normalBorderAlpha),
      )
      .bg(alpha(cx.theme().colors.foreground, tokens.state.normalFillAlpha))
      .child(
        new Label(value.split("").join(" "))
          .size("displayLarge")
          .strong()
          .build(cx),
      );
  }
}
