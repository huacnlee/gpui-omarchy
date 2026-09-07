// @ts-check

// One presentation for every run of interface text.
//
// A component library that exposes only "body foreground" and "body muted"
// pushes every other size back onto the application, and an application that
// writes `text_size(13)` at a call site has left the type scale. These four
// classes are the whole vocabulary — a run of text is a role (`Label`,
// `MutedText`, `Title`, `SectionLabel`), a step on the shared scale, an
// optional emphasis, and an optional tone that only the caller can know.
//
// `tone` is the one escape hatch, and it exists because some colours are
// readings rather than interface states: a price that moved up, a feed that
// went stale. gpui's semantic tokens carry neither, so a library that refused
// an explicit colour would force the application to rebuild the text element
// out of `div()` to paint one.

import { div } from "gpui";
import { optionalText, requiredText } from "./internal.js";
import { style } from "./style.js";

const SIZES = /** @type {const} */ ([
  "caption",
  "bodySmall",
  "body",
  "subtitle",
  "title",
  "heading",
  "display",
  "displayLarge",
]);

/** @typedef {typeof SIZES[number]} TextSize */

/**
 * @param {string} component
 * @param {unknown} value
 * @returns {TextSize}
 */
export function textSize(component, value) {
  if (!SIZES.includes(/** @type {TextSize} */ (value))) {
    throw new Error(
      `${component} size must be one of ${SIZES.join(", ")}; received ${JSON.stringify(value)}`,
    );
  }
  return /** @type {TextSize} */ (value);
}

/**
 * The shared body of every text class.
 *
 * The four roles differ only in their default step and their resting colour,
 * so both arrive through the constructor and the builders and `build` are
 * written once. A subclass adds no method of its own, which is what keeps the
 * four roles from drifting into four slightly different text elements.
 */
class TextRun {
  /** @type {string} */
  #component;

  /** @type {TextSize} */
  #size;

  /** @type {(cx: import("gpui").Context) => import("gpui").Color} */
  #resting;

  /** @type {unknown} */
  #text;

  #strong = false;

  #truncate = false;

  /** @type {import("gpui").Color | undefined} */
  #tone;

  /**
   * @param {string} component
   * @param {TextSize} size
   * @param {(cx: import("gpui").Context) => import("gpui").Color} resting
   * @param {string} [value]
   */
  constructor(component, size, resting, value) {
    this.#component = component;
    this.#size = size;
    this.#resting = resting;
    this.#text = value;
  }

  /** @param {string} value */
  text(value) {
    this.#text = value;
    return this;
  }

  /** @param {string} value one step of the shared type scale */
  size(value) {
    this.#size = textSize(this.#component, value);
    return this;
  }

  /** @param {boolean} [value] */
  strong(value = true) {
    this.#strong = value === true;
    return this;
  }

  /** @param {boolean} [value] clip to one line rather than wrapping */
  truncate(value = true) {
    this.#truncate = value === true;
    return this;
  }

  /**
   * A colour the semantic tokens cannot supply — a reading, not a state.
   * @param {import("gpui").Color | undefined} value
   */
  tone(value) {
    if (value !== undefined && typeof value !== "string") {
      throw new Error(
        `${this.#component} tone must be a colour string when supplied`,
      );
    }
    this.#tone = value;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    // An empty string is the one blank this accepts, and it is deliberate: a
    // fixed-height row keeps its second line even when there is nothing to say
    // on it, and a run that refused would force the caller to rebuild the text
    // element out of `div()` to draw the gap. Whitespace-only text stays an
    // error, because that is always an accident.
    const text =
      this.#text === ""
        ? ""
        : requiredText(this.#component, "text", this.#text);
    return div()
      .text_size(style().font[this.#size])
      .line_height(1.35)
      .text_color(this.#tone ?? this.#resting(cx))
      .when(this.#strong, (element) => element.font_weight(700))
      .when(this.#truncate, (element) => element.truncate())
      .child(text);
  }
}

/** Body copy in the foreground token: a name, a figure, a row's subject. */
export class Label extends TextRun {
  /** @param {string} [value] */
  constructor(value) {
    super("Label", "body", (cx) => cx.theme().colors.foreground, value);
  }
}

/** Secondary copy: a field label, a hint, a reading's unit. */
export class MutedText extends TextRun {
  /** @param {string} [value] */
  constructor(value) {
    super(
      "MutedText",
      "body",
      (cx) => cx.theme().colors.muted_foreground,
      value,
    );
  }
}

/** The name of a page, a card or a dialog. */
export class Title extends TextRun {
  /** @param {string} [value] */
  constructor(value) {
    super("Title", "title", (cx) => cx.theme().colors.foreground, value);
  }
}

/**
 * The heading over a group of rows or a column of figures.
 *
 * Small, muted and bold — the way a terminal writes small caps. The casing is
 * the caller's: a section label is often a column title that other code looks
 * up by the words as they were written, and folding it here would make the
 * drawn text and the key disagree.
 */
export class SectionLabel extends TextRun {
  /** @param {string} [value] */
  constructor(value) {
    super(
      "SectionLabel",
      "caption",
      (cx) => cx.theme().colors.muted_foreground,
      value,
    );
    this.strong();
  }
}

/**
 * A run of text built from a plain string, for the slots inside other
 * components that take copy rather than an element.
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @param {import("gpui").Context} cx
 * @param {{muted?: boolean, size?: TextSize, strong?: boolean, optional?: boolean}} [options]
 */
export function copy(component, field, value, cx, options = {}) {
  const text =
    options.optional === true
      ? optionalText(component, field, value)
      : requiredText(component, field, value);
  if (text === undefined) return undefined;
  const run = options.muted === true ? new MutedText(text) : new Label(text);
  if (options.size) run.size(options.size);
  if (options.strong === true) run.strong();
  return run.build(cx);
}
