// @ts-check

import { div } from "gpui";
import { h_flex, v_flex } from "gpui-base";
import { optionalText, requiredText, stableId } from "./internal.js";
import { alpha, style } from "./style.js";
import { Label, MutedText } from "./text.js";

export class EmptyState {
  /** @type {string | undefined} */
  #heading;

  /** @type {string | undefined} */
  #hint;

  /** @param {string} value */
  heading(value) {
    this.#heading = value;
    return this;
  }

  /** @param {string} value */
  hint(value) {
    this.#hint = value;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    const heading = requiredText("EmptyState", "heading", this.#heading);
    const hint = requiredText("EmptyState", "hint", this.#hint);
    return v_flex()
      .flex_1()
      .items_center()
      .justify_center()
      .gap(tokens.spacing.labelGap)
      .p(tokens.spacing.panelPadding)
      .child(new Label(heading).build(cx))
      .child(new MutedText(hint).build(cx));
  }
}

export class StatusItem {
  /** @type {string | undefined} */
  #label;

  /** @type {string | undefined} */
  #loadingLabel;

  /** @type {"ready" | "loading" | "error"} */
  #state = "ready";

  /** @param {string} value */
  label(value) {
    this.#label = value;
    return this;
  }

  /** @param {string} value */
  loadingLabel(value) {
    this.#loadingLabel = value;
    return this;
  }

  /** @param {"ready" | "loading" | "error"} value */
  state(value) {
    if (!["ready", "loading", "error"].includes(value)) {
      throw new Error("StatusItem state must be one of: ready, loading, error.");
    }
    this.#state = value;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    // A window at rest is often a window with nothing to report, and the bar
    // that carries this keeps its height either way — so `""` is a deliberate
    // blank line here, the same exception the text classes make for a fixed
    // row. Loading and error are not at rest: a report of either that says
    // nothing is a report that has lost its sentence.
    const label =
      this.#state === "ready"
        ? optionalText("StatusItem", "label", this.#label, {
            allowEmpty: true,
          }) ?? ""
        : requiredText("StatusItem", "label", this.#label);
    if (this.#state !== "loading") {
      optionalText("StatusItem", "loading label", this.#loadingLabel);
    }
    const visibleLabel = this.#state === "loading"
      ? requiredText(
          "StatusItem",
          "loading label",
          this.#loadingLabel,
        )
      : label;
    const run = new Label(visibleLabel).size("caption");
    const element = this.#state === "error"
      ? run.tone(cx.theme().colors.destructive).build(cx)
      : new MutedText(visibleLabel).size("caption").build(cx);
    return element
      .role("status")
      .when(this.#state === "loading", (status) =>
        status.accessibility_label(visibleLabel),
      );
  }
}

const TONES = /** @type {const} */ ([
  "neutral",
  "accent",
  "success",
  "warning",
  "danger",
]);

/** @typedef {typeof TONES[number]} FeedbackTone */

/** @param {string} component @param {unknown} value @returns {FeedbackTone} */
function feedbackTone(component, value) {
  if (!TONES.includes(/** @type {FeedbackTone} */ (value))) {
    throw new Error(
      `${component} tone must be one of ${TONES.join(", ")}; received ${JSON.stringify(value)}`,
    );
  }
  return /** @type {FeedbackTone} */ (value);
}

/**
 * Resolve a tone to a colour.
 *
 * `success` and `warning` are readings rather than interface roles, and gpui's
 * seventeen semantic tokens carry neither. A caller who has a palette for them
 * — an ANSI row, a brand's status colours — passes it as `.color(value)`; a
 * caller who has not gets the muted foreground, which is honest about the
 * library not knowing.
 * @param {FeedbackTone} tone
 * @param {import("gpui").Context} cx
 */
function toneColor(tone, cx) {
  if (tone === "danger") return cx.theme().colors.destructive;
  if (tone === "accent") return cx.theme().colors.primary;
  return cx.theme().colors.muted_foreground;
}

/**
 * A compact state marker: an optional dot and a word.
 *
 * The dot is never the whole signal — the word beside it says the same thing —
 * because a badge that reports a state in colour alone reports nothing to a
 * reader who cannot separate the two hues.
 */
export class Badge {
  #id;
  #label;
  /** @type {FeedbackTone} */
  #tone = "neutral";
  /** @type {import("gpui").Color | undefined} */
  #color;
  #dot = false;
  #quiet = false;
  #description;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("Badge", id);
  }

  /** @param {string} text */
  label(text) {
    this.#label = text;
    return this;
  }

  /** @param {string} value */
  tone(value) {
    this.#tone = feedbackTone("Badge", value);
    return this;
  }

  /** @param {import("gpui").Color | undefined} value a palette the tokens cannot supply */
  color(value) {
    if (value !== undefined && typeof value !== "string") {
      throw new Error("Badge color must be a colour string when supplied");
    }
    this.#color = value;
    return this;
  }

  /** @param {boolean} [value] draw the leading state dot */
  dot(value = true) {
    this.#dot = value === true;
    return this;
  }

  /** @param {boolean} [value] a transitional state, held back from full emphasis */
  quiet(value = true) {
    this.#quiet = value === true;
    return this;
  }

  /** @param {string} text the tooltip and accessible detail */
  description(text) {
    this.#description = text;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const label = requiredText("Badge", "label", this.#label);
    const description = optionalText("Badge", "description", this.#description);
    const tokens = style();
    const color = this.#color ?? toneColor(this.#tone, cx);
    return h_flex()
      .id(this.#id)
      .flex_none()
      .items_center()
      .gap(tokens.spacing.xs)
      .when(Boolean(description), (element) =>
        element.tooltip(String(description)).accessibility_label(
          `${label}: ${description}`,
        ),
      )
      .when(this.#quiet, (element) => element.opacity(0.72))
      .when(this.#dot, (element) =>
        element.child(
          div()
            .flex_none()
            .w(tokens.space(6))
            .h(tokens.space(6))
            .rounded(tokens.cornerRadius)
            .bg(color),
        ),
      )
      .child(new MutedText(label).size("bodySmall").build(cx));
  }
}

/**
 * A message the caller must read before carrying on.
 *
 * The rail down the leading edge is what separates an alert from a paragraph
 * that happens to be red: colour alone puts the whole burden on hue, and a
 * bordered block with no mark reads as a quote. The copy wraps — an error from
 * a server is a sentence, not a label, and truncating it hides the half that
 * says what to do.
 */
export class Alert {
  #id;
  #message;
  /** @type {FeedbackTone} */
  #tone = "danger";
  /** @type {import("gpui").Color | undefined} */
  #color;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("Alert", id);
  }

  /** @param {string} text */
  message(text) {
    this.#message = text;
    return this;
  }

  /** @param {string} value */
  tone(value) {
    this.#tone = feedbackTone("Alert", value);
    return this;
  }

  /** @param {import("gpui").Color | undefined} value */
  color(value) {
    if (value !== undefined && typeof value !== "string") {
      throw new Error("Alert color must be a colour string when supplied");
    }
    this.#color = value;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const message = requiredText("Alert", "message", this.#message);
    const tokens = style();
    const color = this.#color ?? toneColor(this.#tone, cx);
    return h_flex()
      .id(this.#id)
      .role("alert")
      .w_full()
      .gap(tokens.spacing.sm)
      .p(tokens.spacing.sm)
      .rounded(tokens.cornerRadius)
      .border(tokens.state.normalBorderWidth)
      .border_color(color)
      .bg(alpha(color, tokens.state.normalFillAlpha))
      .child(div().flex_none().w(tokens.space(3)).self_stretch().bg(color))
      .child(
        div()
          .flex_1()
          .min_w_0()
          .whitespace_normal()
          .text_size(tokens.font.body)
          .line_height(1.35)
          .text_color(cx.theme().colors.foreground)
          .child(message),
      );
  }
}

/**
 * One place in a numbered errand.
 *
 * A task with three parts — open a page, type a code, approve it — says so,
 * rather than leaving the count to be inferred from the order of the controls
 * under it.
 */
export class Step {
  #index;
  #title;

  /** @param {number} index the step's one-based place */
  constructor(index) {
    if (!Number.isInteger(index) || Number(index) < 1) {
      throw new Error("Step index must be a positive integer");
    }
    this.#index = Number(index);
  }

  /** @param {string} text */
  title(text) {
    this.#title = text;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const title = requiredText("Step", "title", this.#title);
    const tokens = style();
    const extent = tokens.space(16);
    return h_flex()
      .items_center()
      .gap(tokens.spacing.sm)
      .child(
        h_flex()
          .items_center()
          .justify_center()
          .w(extent)
          .h(extent)
          .flex_none()
          .rounded(tokens.cornerRadius)
          .bg(cx.theme().colors.secondary)
          .child(
            new Label(String(this.#index))
              .size("caption")
              .tone(cx.theme().colors.secondary_foreground)
              .build(cx),
          ),
      )
      .child(new MutedText(title).build(cx));
  }
}
