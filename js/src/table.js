// @ts-check

// Columns, and the two rows that line up under them.
//
// `ListRow` is a row of one thing. A table is a row of *columns*, and the
// header and the body have to agree about them or the figures stop lining up —
// which is a class of bug that no amount of care at one call site prevents,
// because the two halves are written in different places. So a column is a
// value here: one width, one alignment, one title, declared once and used by
// both `TableHeaderRow` and `TableRow`.
//
// The row semantics come from `gpui-base`'s table elements rather than from
// plain flex containers, because a screen reader reads a grid by its row and
// column indices. The header is row one; body rows count from two, which is
// why `TableRow` takes the body index and adds the offset itself instead of
// asking every caller to remember it.

import { div } from "gpui";
import {
  TableCell as BaseTableCell,
  TableHead as BaseTableHead,
  TableHeader as BaseTableHeader,
  TableRow as BaseTableRow,
  v_flex,
} from "gpui-base";
import {
  optionalText,
  requiredRenderable,
  requiredText,
  stableId,
} from "./internal.js";
import { alpha, style } from "./style.js";
import { SectionLabel } from "./text.js";
import { role } from "./theme.js";

const ALIGNMENTS = /** @type {const} */ (["start", "center", "end"]);

/** @typedef {"start" | "center" | "end"} ColumnAlignment */

/**
 * @typedef {{
 *   title: string,
 *   width?: string | number,
 *   align?: ColumnAlignment,
 *   hint?: string,
 * }} ColumnSpec
 */

/** @param {string} component @param {unknown} value @returns {ColumnAlignment} */
function alignment(component, value) {
  if (value === undefined) return "start";
  if (!ALIGNMENTS.includes(/** @type {ColumnAlignment} */ (value))) {
    throw new Error(
      `${component} column align must be one of ${ALIGNMENTS.join(", ")}; received ${JSON.stringify(value)}`,
    );
  }
  return /** @type {ColumnAlignment} */ (value);
}

/**
 * `width` is a share of the row (`"31%"`), a fixed extent (`96`), or omitted to
 * take whatever the fixed columns leave.
 * @param {import("gpui").Element} element
 * @param {string | number | undefined} width
 */
function sized(element, width) {
  if (width === undefined || width === "fill") return element.flex_1();
  return element.w(width);
}

/** @param {import("gpui").Element} element @param {ColumnAlignment} align */
function aligned(element, align) {
  if (align === "end") return element.justify_end();
  if (align === "center") return element.justify_center();
  return element;
}

/** @param {string} component @param {unknown} value @returns {ColumnSpec} */
function columnSpec(component, value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${component} column must be an object`);
  }
  const spec = /** @type {Record<string, unknown>} */ (value);
  return {
    title: requiredText(component, "column title", spec.title),
    width: /** @type {string | number | undefined} */ (spec.width),
    align: alignment(component, spec.align),
    hint: optionalText(component, "column hint", spec.hint),
  };
}

/** The height a table's header row is drawn at, on the shared spacing scale. */
export function tableHeaderHeight() {
  return style().space(24);
}

/**
 * A table's header row group.
 *
 * `hint` is the pointer's affordance only: the accessible name is the visible
 * title, so a hint that repeats it adds nothing and a hint that contradicts it
 * is a bug. Use it where a column is abbreviated for width and the full
 * reading will not fit.
 */
export class TableHeaderRow {
  #id;
  /** @type {ColumnSpec[]} */
  #columns = [];

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("TableHeaderRow", id);
  }

  /** @param {ColumnSpec} spec */
  column(spec) {
    this.#columns.push(columnSpec("TableHeaderRow", spec));
    return this;
  }

  /** @param {ColumnSpec[]} specs */
  columns(specs) {
    if (!Array.isArray(specs)) {
      throw new Error("TableHeaderRow columns must be an array");
    }
    for (const spec of specs) this.column(spec);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    return BaseTableHeader.new(`${this.#id}-header`).child(
      BaseTableRow.new(`${this.#id}-header-row`, 1)
        .flex()
        .items_center()
        .h(tableHeaderHeight())
        .gap(tokens.spacing.sm)
        .px(tokens.spacing.sm)
        .bg(cx.theme().colors.background)
        .border_b(tokens.spacing.hairline)
        .border_color(role("separator", cx.theme().colors.border))
        .children(
          this.#columns.map((column, index) =>
            sized(
              BaseTableHead.new(`${this.#id}-head-${index + 1}`, index + 1)
                .flex()
                .items_center(),
              column.width,
            ).child(
              // The head keeps the column's table semantics; the full-size div
              // inside it is what a pointer can hover for the tooltip.
              aligned(
                div()
                  .size_full()
                  .flex()
                  .items_center()
                  .when(Boolean(column.hint), (element) =>
                    element.tooltip(String(column.hint)),
                  ),
                column.align ?? "start",
              ).child(
                // Folded on the way to the screen, the way a terminal writes
                // small caps. Only the drawn text is folded: `title` stays as
                // it was written, so a lookup keyed by a column's name — a
                // hint, a sort order, a saved layout — still finds it.
                new SectionLabel(column.title.toUpperCase()).build(cx),
              ),
            ),
          ),
        ),
    );
  }
}

/**
 * One body row of a table.
 *
 * The row registers no click handler unless one is given: a virtualized list
 * rebuilds its rows every scrolled frame, and a per-row callback there
 * accumulates one unreachable function per row per frame. Lists that scroll
 * carry a single item-click handler instead and leave this one presentational,
 * which is why `selected` still lights the row without `onClick`.
 */
export class TableRow {
  #id;
  #index;
  /** @type {number | undefined} */
  #height;
  #selected = false;
  #dimmed = false;
  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;
  /** @type {Array<{width?: string|number, align: ColumnAlignment, element: any}>} */
  #cells = [];

  /** @param {string} id @param {number} index the row's zero-based body position */
  constructor(id, index) {
    this.#id = stableId("TableRow", id);
    if (!Number.isInteger(index) || Number(index) < 0) {
      throw new Error("TableRow index must be a non-negative integer");
    }
    this.#index = Number(index);
  }

  /** @param {number} value */
  height(value) {
    if (!Number.isFinite(value) || Number(value) <= 0) {
      throw new Error("TableRow height must be a positive number");
    }
    this.#height = Number(value);
    return this;
  }

  /** @param {boolean} [value] */
  selected(value = true) {
    this.#selected = value === true;
    return this;
  }

  /** @param {boolean} [value] the row's data has not arrived yet */
  dimmed(value = true) {
    this.#dimmed = value === true;
    return this;
  }

  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    if (callback !== undefined && typeof callback !== "function") {
      throw new Error("TableRow onClick must be a function when supplied");
    }
    this.#onClick = callback;
    return this;
  }

  /**
   * @param {{width?: string | number, align?: ColumnAlignment}} options
   * @param {import("gpui").Element | import("gpui").Entity} element
   */
  cell(options, element) {
    const config =
      typeof options === "object" && options !== null && !Array.isArray(options)
        ? /** @type {Record<string, unknown>} */ (options)
        : {};
    this.#cells.push({
      width: /** @type {string | number | undefined} */ (config.width),
      align: alignment("TableRow", config.align),
      element: requiredRenderable("TableRow", "cell", element),
    });
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    const foreground = this.#selected
      ? cx.theme().colors.accent_foreground
      : cx.theme().colors.foreground;
    return BaseTableRow.new(this.#id, this.#index + 2)
      .flex()
      .items_center()
      .w_full()
      .when(this.#height !== undefined, (element) =>
        element.h(Number(this.#height)),
      )
      .gap(tokens.spacing.sm)
      .px(tokens.spacing.sm)
      .py(tokens.spacing.xs)
      .border_b(tokens.spacing.hairline)
      .border_color(role("separator", cx.theme().colors.border))
      .bg(this.#selected ? cx.theme().colors.accent : cx.theme().colors.surface)
      .text_color(foreground)
      .when(this.#dimmed, (element) => element.opacity(0.68))
      .when(typeof this.#onClick === "function", (element) =>
        element.on_click(this.#onClick),
      )
      // The same chrome every other neutral surface takes: the theme names its
      // hover and its selection, and a row that re-derived them from the
      // foreground would disagree with the buttons sitting in it.
      .hover((appearance) =>
        appearance
          .bg(
            this.#selected
              ? cx.theme().colors.accent
              : cx.theme().colors.muted,
          )
          .text_color(
            this.#selected ? cx.theme().colors.accent_foreground : foreground,
          ),
      )
      .active((appearance) =>
        appearance.bg(
          this.#selected
            ? cx.theme().colors.accent
            : alpha(
                cx.theme().colors.foreground,
                tokens.state.pressedFillAlpha,
              ),
        ),
      )
      .children(
        this.#cells.map((cell, index) =>
          aligned(
            sized(
              BaseTableCell.new(`${this.#id}-cell-${index + 1}`, index + 1)
                .flex()
                .items_center()
                .min_w_0(),
              cell.width,
            ),
            cell.align,
          ).child(cell.element),
        ),
      );
  }
}

/**
 * A stack inside one cell: two lines of type where the column has room for a
 * value and the reading under it. Nothing but a pre-aligned column, but it is
 * the shape every dense table row reaches for, and writing it once keeps the
 * gap between the lines on the spacing scale.
 */
export class CellStack {
  /** @type {ColumnAlignment} */
  #align = "start";
  /** @type {Array<import("gpui").Element | import("gpui").Entity>} */
  #children = [];

  /** @param {ColumnAlignment} value */
  align(value) {
    this.#align = alignment("CellStack", value);
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("CellStack", "child", element));
    return this;
  }

  /** @param {import("gpui").Context} _cx */
  build(_cx) {
    const tokens = style();
    // `v_flex`, not `h_flex().flex_col()`: `h_flex` centers on its cross axis,
    // and turning a centered row on its side centers the *text* — which is how
    // a column of tickers ends up ragged on both edges. Every alignment is
    // written out rather than left to a default, because the default is what
    // went wrong.
    const column = v_flex().min_w_0().gap(tokens.spacing.xxs);
    const placed =
      this.#align === "end"
        ? column.items_end()
        : this.#align === "center"
          ? column.items_center()
          : column.items_start();
    return placed.children([...this.#children]);
  }
}
