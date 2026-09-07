// @ts-check

import { expect, test } from "bun:test";
import { Label, MutedText, SectionLabel, Title } from "../src/text.js";
import { style } from "../src/style.js";

const theme = {
  colors: {
    foreground: "#eeeeeeff",
    muted_foreground: "#999999ff",
  },
};

const cx = { theme: () => theme };

/** @param {any} element @param {string} method */
function callsTo(element, method) {
  return element.calls.filter((call) => call.method === method);
}

test("each role resolves its own default step and colour", () => {
  const tokens = style();
  const cases = [
    [new Label("Apple"), tokens.font.body, theme.colors.foreground],
    [new MutedText("Apple"), tokens.font.body, theme.colors.muted_foreground],
    [new Title("Apple"), tokens.font.title, theme.colors.foreground],
    [
      new SectionLabel("Apple"),
      tokens.font.caption,
      theme.colors.muted_foreground,
    ],
  ];

  for (const [run, size, color] of cases) {
    const element = run.build(cx);
    expect(callsTo(element, "text_size")[0].args).toEqual([size]);
    expect(callsTo(element, "text_color")[0].args).toEqual([color]);
    expect(callsTo(element, "child")[0].args).toEqual(["Apple"]);
  }
});

test("a section label is bold without folding the caller's casing", () => {
  const element = new SectionLabel("Last / Cost").build(cx);
  expect(callsTo(element, "font_weight")[0].args).toEqual([700]);
  expect(callsTo(element, "child")[0].args).toEqual(["Last / Cost"]);
});

test("size names one step of the shared scale and rejects everything else", () => {
  const tokens = style();
  expect(
    callsTo(new Label("x").size("heading").build(cx), "text_size")[0].args,
  ).toEqual([tokens.font.heading]);

  for (const value of [12, "12px", "huge", "", null, undefined]) {
    expect(() => new Label("x").size(/** @type {any} */ (value))).toThrow(
      /Label size must be one of/,
    );
  }
});

test("tone overrides the role's resting colour and rejects non-colours", () => {
  const element = new Label("+4.44%").tone("#00aa00ff").build(cx);
  expect(callsTo(element, "text_color")[0].args).toEqual(["#00aa00ff"]);

  // Omitting a tone is how a caller says "whatever the role resolves to",
  // which is what lets a call site pass an optional market colour straight
  // through without branching.
  const plain = new Label("+4.44%").tone(undefined).build(cx);
  expect(callsTo(plain, "text_color")[0].args).toEqual([theme.colors.foreground]);

  expect(() => new Label("x").tone(/** @type {any} */ (12))).toThrow(
    "Label tone must be a colour string when supplied",
  );
});

test("strong and truncate are applied only when asked for", () => {
  const plain = new Label("Apple").build(cx);
  expect(callsTo(plain, "font_weight")).toHaveLength(0);
  expect(callsTo(plain, "truncate")).toHaveLength(0);

  const marked = new Label("Apple").strong().truncate().build(cx);
  expect(callsTo(marked, "font_weight")[0].args).toEqual([700]);
  expect(callsTo(marked, "truncate")).toHaveLength(1);

  const cleared = new SectionLabel("Apple").strong(false).build(cx);
  expect(callsTo(cleared, "font_weight")).toHaveLength(0);
});

test("required copy is checked at build, naming the component", () => {
  for (const value of [undefined, null, "   ", 12, {}, []]) {
    expect(() => new MutedText(/** @type {any} */ (value)).build(cx)).toThrow(
      "MutedText text must be a non-blank string",
    );
  }
  expect(new MutedText().text("Apple").build(cx).calls).toBeTruthy();
});

test("an empty run is a deliberate blank line, not a mistake", () => {
  // A fixed-height row keeps its second line even when there is nothing to
  // say on it. Whitespace-only text is still an error.
  const blank = new MutedText("").build(cx);
  expect(callsTo(blank, "child")[0].args).toEqual([""]);
  expect(() => new MutedText(" ").build(cx)).toThrow(
    "MutedText text must be a non-blank string",
  );
});

test("build is repeatable and resolves against each supplied context", () => {
  const run = new Label("Apple").size("title").strong();
  const first = run.build(cx);
  const second = run.build(cx);
  expect(second).not.toBe(first);
  expect(second.calls).toEqual(first.calls);

  const light = { theme: () => ({ colors: { foreground: "#111111ff" } }) };
  expect(callsTo(run.build(light), "text_color")[0].args).toEqual(["#111111ff"]);
});
