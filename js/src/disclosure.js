// @ts-check

// A section that folds away, and the group it lives in.
//
// `gpui-base`'s five accordion parts carry the semantics — the group, the
// heading and its level, the button and the expanded state it reports, and the
// region that button controls — and draw nothing at all. So the chevron, the
// rule, the trigger's hover and the panel's inset are presentation, which is
// what this module supplies.
//
// One detail is not decoration: the hover lands on a plain element *inside*
// the trigger rather than on the trigger itself. A component is rebuilt from
// its description as a value, so there is no retained interactive element on
// the trigger for a hover style to attach to; the row inside fills it, so the
// lit area is identical either way.

import { div } from "gpui";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  h_flex,
} from "gpui-base";
import {
  optionalText,
  requiredRenderable,
  requiredText,
  stableId,
} from "./internal.js";
import { alpha, style } from "./style.js";
import { Label, MutedText } from "./text.js";
import { role } from "./theme.js";

/** The container one or more `AccordionSection`s sit in. */
export class AccordionGroup {
  #id;
  /** @type {Array<import("gpui").Element | import("gpui").Entity>} */
  #children = [];

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("AccordionGroup", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("AccordionGroup", "child", element));
    return this;
  }

  /** @param {import("gpui").Context} _cx */
  build(_cx) {
    return Accordion.new(this.#id)
      .flex()
      .flex_col()
      .w_full()
      .children([...this.#children]);
  }
}

/**
 * One collapsible section.
 *
 * `open` and `onToggle` are the application's, not the section's: a disclosure
 * that remembered its own state would forget it the next time the data under
 * it changed and the view rebuilt.
 *
 * `keepMounted` is for a body that is a retained child view — a chart, an
 * editor — which a collapse that unmounted would tear down and rebuild.
 *
 * `inset` is the trigger row's horizontal padding, so a disclosure can line its
 * chevron up with whatever content it sits under rather than with whatever this
 * module happened to choose.
 */
export class AccordionSection {
  #id;
  #title;
  #detail;
  #open = false;
  #level = 3;
  #keepMounted = false;
  /** @type {number | undefined} */
  #inset;
  #body;
  /** @type {((open: boolean, cx: import("gpui").Context) => void) | undefined} */
  #onToggle;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("AccordionSection", id);
  }

  /** @param {string} text */
  title(text) {
    this.#title = text;
    return this;
  }

  /** @param {string} text a reading that belongs with the title, not under it */
  detail(text) {
    this.#detail = text;
    return this;
  }

  /** @param {boolean} [value] */
  open(value = true) {
    this.#open = value === true;
    return this;
  }

  /** @param {number} value the heading level this section announces */
  level(value) {
    if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 6) {
      throw new Error("AccordionSection level must be an integer from 1 to 6");
    }
    this.#level = Number(value);
    return this;
  }

  /** @param {boolean} [value] */
  keepMounted(value = true) {
    this.#keepMounted = value === true;
    return this;
  }

  /** @param {number} value */
  inset(value) {
    if (!Number.isFinite(value) || Number(value) < 0) {
      throw new Error("AccordionSection inset must be a non-negative number");
    }
    this.#inset = Number(value);
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  body(element) {
    this.#body = element;
    return this;
  }

  /** @param {((open: boolean, cx: import("gpui").Context) => void) | undefined} callback */
  onToggle(callback) {
    if (callback !== undefined && typeof callback !== "function") {
      throw new Error(
        "AccordionSection onToggle must be a function when supplied",
      );
    }
    this.#onToggle = callback;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const title = requiredText("AccordionSection", "title", this.#title);
    const detail = optionalText("AccordionSection", "detail", this.#detail);
    const body = requiredRenderable("AccordionSection", "body", this.#body);
    const tokens = style();
    const inset = this.#inset ?? tokens.spacing.rowPaddingX;

    return AccordionItem.new()
      .open(this.#open)
      .w_full()
      .header(
        AccordionHeader.new(
          AccordionTrigger.new(`${this.#id}-trigger`)
            .when(typeof this.#onToggle === "function", (element) =>
              element.on_change(this.#onToggle),
            )
            .flex()
            .w_full()
            .child(
              h_flex()
                .id(`${this.#id}-trigger-surface`)
                .w_full()
                .items_center()
                .justify_between()
                .gap(tokens.spacing.sm)
                .px(inset)
                .py(tokens.spacing.sm)
                .hover((appearance) =>
                  appearance.bg(
                    alpha(
                      cx.theme().colors.foreground,
                      tokens.state.hoverFillAlpha,
                    ),
                  ),
                )
                .child(
                  h_flex()
                    .items_center()
                    .gap(tokens.spacing.xs)
                    .child(
                      div()
                        .w(tokens.space(14))
                        .flex_none()
                        .text_size(tokens.font.title)
                        .line_height(1)
                        .text_color(cx.theme().colors.foreground)
                        .child(this.#open ? "▾" : "▸"),
                    )
                    .child(new Label(title).build(cx)),
                )
                .when(Boolean(detail), (element) =>
                  element.child(new MutedText(String(detail)).build(cx)),
                ),
            ),
        ).aria_level(this.#level),
      )
      .panel(
        AccordionPanel.new()
          .keep_mounted(this.#keepMounted)
          .w_full()
          .when(this.#open, (element) =>
            element.child(
              div()
                .w_full()
                .h(tokens.spacing.hairline)
                .bg(role("separator", cx.theme().colors.border)),
            ),
          )
          .child(body),
      );
  }
}
