// @ts-check

import { expect, test } from "bun:test";
import { element as gpuiElement } from "./gpui-stub.js";
import {
  CellStack,
  TableHeaderRow,
  TableRow,
  tableHeaderHeight,
} from "../src/table.js";
import { style } from "../src/style.js";

const theme = {
  colors: {
    accent: "#2233aaff",
    accent_foreground: "#ffffffff",
    background: "#101010ff",
    border: "#777777ff",
    foreground: "#eeeeeeff",
    surface: "#181818ff",
  },
};

const cx = { theme: () => theme };

/** @param {any} element @param {string} method */
function callsTo(element, method) {
  return element.calls.filter((call) => call.method === method);
}

/** @param {any} element */
function children(element) {
  return callsTo(element, "children")[0]?.args[0] ?? [];
}

test("both row classes reject non-string and blank ids", () => {
  for (const id of [undefined, null, "", "   ", 42, {}, []]) {
    expect(() => new TableHeaderRow(/** @type {any} */ (id))).toThrow(
      "TableHeaderRow id must be a non-blank string",
    );
    expect(() => new TableRow(/** @type {any} */ (id), 0)).toThrow(
      "TableRow id must be a non-blank string",
    );
  }
});

test("a body row's index is its place below the header, never below zero", () => {
  for (const index of [-1, 1.5, "2", null, undefined]) {
    expect(() => new TableRow("quote", /** @type {any} */ (index))).toThrow(
      "TableRow index must be a non-negative integer",
    );
  }
  // The header is row one, so the first body row announces itself as row two.
  expect(new TableRow("quote", 0).build(cx).args).toEqual(["quote", 2]);
  expect(new TableRow("quote", 7).build(cx).args).toEqual(["quote", 9]);
});

test("a header numbers its columns and carries each hint on a hoverable box", () => {
  const header = new TableHeaderRow("watchlist").columns([
    { title: "Instrument", width: "31%" },
    { title: "Last", width: "19%", align: "end", hint: "Most recent price" },
    { title: "Session" },
  ]);

  const group = header.build(cx);
  expect(group.args).toEqual(["watchlist-header"]);

  const row = callsTo(group, "child")[0].args[0];
  expect(row.args).toEqual(["watchlist-header-row", 1]);
  expect(callsTo(row, "h")[0].args).toEqual([tableHeaderHeight()]);

  const heads = children(row);
  expect(heads).toHaveLength(3);
  expect(heads[0].args).toEqual(["watchlist-head-1", 1]);
  expect(heads[1].args).toEqual(["watchlist-head-2", 2]);
  expect(callsTo(heads[0], "w")[0].args).toEqual(["31%"]);

  // A column with no width takes what the fixed ones leave.
  expect(callsTo(heads[2], "w")).toHaveLength(0);
  expect(callsTo(heads[2], "flex_1")).toHaveLength(1);

  // The head keeps the table semantics; the full-size box inside it is what
  // the alignment and the pointer's tooltip land on.
  const box = (head) => callsTo(head, "child")[0].args[0];
  expect(callsTo(box(heads[1]), "justify_end")).toHaveLength(1);
  expect(callsTo(box(heads[0]), "justify_end")).toHaveLength(0);

  // The hint is the pointer's affordance only; a column without one gets no
  // tooltip rather than a tooltip repeating its visible title.
  expect(callsTo(box(heads[1]), "tooltip")[0].args).toEqual([
    "Most recent price",
  ]);
  expect(callsTo(box(heads[0]), "tooltip")).toHaveLength(0);
});

test("a header rejects a column without a title or with an unknown alignment", () => {
  expect(() => new TableHeaderRow("t").column({ title: "" })).toThrow(
    "TableHeaderRow column title must be a non-blank string",
  );
  expect(() =>
    new TableHeaderRow("t").column({
      title: "Last",
      align: /** @type {any} */ ("right"),
    }),
  ).toThrow(/TableHeaderRow column align must be one of/);
  expect(() =>
    new TableHeaderRow("t").columns(/** @type {any} */ ("Last")),
  ).toThrow("TableHeaderRow columns must be an array");
});

test("a body row numbers its cells in the order they were added", () => {
  const first = gpuiElement("code");
  const second = gpuiElement("price");
  const row = new TableRow("quote-AAPL", 0)
    .height(44)
    .cell({ width: "31%" }, first)
    .cell({ width: "19%", align: "end" }, second);

  const element = row.build(cx);
  expect(callsTo(element, "h")[0].args).toEqual([44]);

  const cells = children(element);
  expect(cells[0].args).toEqual(["quote-AAPL-cell-1", 1]);
  expect(cells[1].args).toEqual(["quote-AAPL-cell-2", 2]);
  expect(callsTo(cells[0], "child")[0].args).toEqual([first]);
  expect(callsTo(cells[1], "justify_end")).toHaveLength(1);
});

test("a row without a click handler still shows selection", () => {
  const selected = new TableRow("quote-AAPL", 0).selected().build(cx);
  expect(callsTo(selected, "bg")[0].args).toEqual([theme.colors.accent]);
  expect(callsTo(selected, "text_color")[0].args).toEqual([
    theme.colors.accent_foreground,
  ]);
  expect(callsTo(selected, "on_click")).toHaveLength(0);

  const plain = new TableRow("quote-AAPL", 0).build(cx);
  expect(callsTo(plain, "bg")[0].args).toEqual([theme.colors.surface]);
});

test("a dimmed row is the one whose data has not arrived", () => {
  expect(
    callsTo(new TableRow("quote-AAPL", 0).dimmed().build(cx), "opacity"),
  ).toHaveLength(1);
  expect(
    callsTo(new TableRow("quote-AAPL", 0).build(cx), "opacity"),
  ).toHaveLength(0);
});

test("a row rejects a non-function click handler and a non-positive height", () => {
  expect(() =>
    new TableRow("quote", 0).onClick(/** @type {any} */ ("open")),
  ).toThrow("TableRow onClick must be a function when supplied");
  for (const height of [0, -4, "44", null]) {
    expect(() => new TableRow("quote", 0).height(/** @type {any} */ (height))).toThrow(
      "TableRow height must be a positive number",
    );
  }
});

test("a cell stack aligns its lines and keeps them on the spacing scale", () => {
  const top = gpuiElement("last");
  const bottom = gpuiElement("change");
  const stack = new CellStack().align("end").child(top).child(bottom);

  const element = stack.build(cx);
  expect(callsTo(element, "items_end")).toHaveLength(1);
  expect(callsTo(element, "gap")[0].args).toEqual([style().spacing.xxs]);
  expect(children(element)).toEqual([top, bottom]);

  expect(() => new CellStack().align(/** @type {any} */ ("bottom"))).toThrow(
    /CellStack column align must be one of/,
  );
  expect(() => new CellStack().child(/** @type {any} */ ("text"))).toThrow(
    "CellStack child must be a GPUI element or entity",
  );
});
