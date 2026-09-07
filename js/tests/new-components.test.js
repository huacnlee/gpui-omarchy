// @ts-check

import { expect, test } from "bun:test";
import { element as gpuiElement } from "./gpui-stub.js";
import { Panel, Toolbar } from "../src/layout.js";
import {
  AvatarButton,
  ExternalLink,
  Keycap,
  NumberInput,
  TextField,
} from "../src/controls.js";
import { Avatar, CodeBlock, DefinitionList, Metric, MetricGrid } from "../src/data.js";
import { AccordionGroup, AccordionSection } from "../src/disclosure.js";
import { Alert, Badge, Step } from "../src/feedback.js";
import { style } from "../src/style.js";

const theme = {
  colors: {
    accent: "#2233aaff",
    accent_foreground: "#ffffffff",
    background: "#101010ff",
    border: "#777777ff",
    destructive: "#ff3344ff",
    foreground: "#eeeeeeff",
    muted: "#333333ff",
    muted_foreground: "#999999ff",
    primary: "#2233aaff",
    ring: "#2233aaff",
    secondary: "#242424ff",
    secondary_foreground: "#dddddddd",
    surface: "#181818ff",
  },
  spacing: { md: 6, sm: 4 },
};

const cx = { theme: () => theme };

/** @param {any} element @param {string} method */
function callsTo(element, method) {
  return element.calls.filter((call) => call.method === method);
}

/** @param {any} element */
function childArgs(element) {
  return callsTo(element, "child").map((call) => call.args[0]);
}

test("every new ID-bearing component rejects a blank id", () => {
  const factories = [
    ["Panel", (id) => new Panel(id)],
    ["Toolbar", (id) => new Toolbar(id)],
    ["ExternalLink", (id) => new ExternalLink(id)],
    ["AvatarButton", (id) => new AvatarButton(id)],
    ["MetricGrid", (id) => new MetricGrid(id)],
    ["DefinitionList", (id) => new DefinitionList(id)],
    ["CodeBlock", (id) => new CodeBlock(id)],
    ["Badge", (id) => new Badge(id)],
    ["Alert", (id) => new Alert(id)],
    ["AccordionGroup", (id) => new AccordionGroup(id)],
    ["AccordionSection", (id) => new AccordionSection(id)],
  ];
  for (const [name, create] of factories) {
    for (const id of [undefined, null, "", "   ", 42, {}]) {
      expect(() => create(/** @type {any} */ (id))).toThrow(
        `${name} id must be a non-blank string`,
      );
    }
  }
});

test("a panel is a surface whose first row is its header", () => {
  const content = gpuiElement("table");
  const accessory = gpuiElement("filter");
  const panel = new Panel("holdings")
    .title("Holdings")
    .note("12 positions")
    .accessory(accessory)
    .content(content);

  const element = panel.build(cx);
  expect(callsTo(element, "id")[0].args).toEqual(["holdings"]);
  expect(callsTo(element, "bg")[0].args).toEqual([theme.colors.surface]);

  // A `Surface` collects its children and places them in one call.
  const [header, body] = callsTo(element, "children")[0].args[0];
  expect(callsTo(header, "id")[0].args).toEqual(["holdings-header"]);
  expect(callsTo(header, "role")[0].args).toEqual(["section_header"]);
  // A growing panel passes its available height through a column flex box.
  expect(body.name).toEqual("v_flex");
  expect(callsTo(body, "id")[0].args).toEqual(["holdings-content"]);
  expect(callsTo(body, "flex_1")).toHaveLength(1);
  expect(callsTo(body, "min_h_0")).toHaveLength(1);
  expect(callsTo(body, "cached")).toHaveLength(0);
  expect(childArgs(body)).toEqual([content]);
  // The wrapper's flex context has to reach the content itself, or a table
  // whose body sizes off `flex_1().min_h(0)` collapses to zero height.
  expect(callsTo(content, "flex_1")).toHaveLength(1);
  expect(callsTo(content, "min_h_0")).toHaveLength(1);
});

test("a panel that does not grow lets its content keep its own height", () => {
  const content = gpuiElement("readings");
  new Panel("summary").title("Summary").grow(false).content(content).build(cx);
  expect(callsTo(content, "flex_1")).toHaveLength(0);
  expect(callsTo(content, "flex_none")).toHaveLength(1);
});

test("a panel requires a title and content, and names the missing one", () => {
  expect(() => new Panel("p").content(gpuiElement("x")).build(cx)).toThrow(
    "Panel title must be a non-blank string",
  );
  expect(() => new Panel("p").title("Holdings").build(cx)).toThrow(
    "Panel content must be a GPUI element or entity",
  );
  expect(() =>
    new Panel("p")
      .title("Holdings")
      .note("   ")
      .content(gpuiElement("x"))
      .build(cx),
  ).toThrow("Panel note must be a non-blank string when supplied");
});

test("a toolbar omits the slot it was not given", () => {
  const filter = gpuiElement("filter");
  const element = new Toolbar("orders-toolbar").leading(filter).build(cx);
  expect(callsTo(element, "role")[0].args).toEqual(["toolbar"]);
  expect(callsTo(element, "children")[0].args).toEqual([[filter]]);
  expect(
    callsTo(new Toolbar("empty").build(cx), "children")[0].args,
  ).toEqual([[]]);
});

test("an avatar takes initials or an icon, and never both", () => {
  const initials = new Avatar().initials("A").tint("#00aa00ff").extent(26);
  const element = initials.build(cx);
  expect(callsTo(element, "w")[0].args).toEqual([26]);
  const fallback = callsTo(element, "fallback")[0].args[0];
  expect(callsTo(fallback, "child")[0].args).toEqual(["A"]);
  expect(callsTo(fallback, "text_color")[0].args).toEqual(["#00aa00ff"]);

  const icon = new Avatar().icon("assets/user.svg").build(cx);
  const iconFallback = callsTo(icon, "fallback")[0].args[0];
  expect(callsTo(iconFallback, "child")[0].args[0].name).toBe("svg");

  expect(() => new Avatar().build(cx)).toThrow(
    "Avatar requires initials or an icon",
  );
  expect(() =>
    new Avatar().initials("A").icon("assets/user.svg").build(cx),
  ).toThrow("Avatar takes initials or an icon, not both");
  expect(() => new Avatar().tint(/** @type {any} */ (12))).toThrow(
    "Avatar tint must be a colour string when supplied",
  );
  expect(() => new Avatar().extent(0)).toThrow(
    "Avatar extent must be a positive number",
  );
});

test("an avatar button carries the avatar as its content and needs a description", () => {
  const element = new AvatarButton("user-menu")
    .icon("assets/user.svg")
    .description("Session menu")
    .selected()
    .build(cx);
  expect(callsTo(element, "accessibility_label")[0].args).toEqual([
    "Session menu",
  ]);
  expect(callsTo(element, "tooltip")[0].args).toEqual(["Session menu"]);
  expect(callsTo(element, "selected")[0].args).toEqual([true]);
  expect(childArgs(element)[0].name).toBe("Avatar");

  expect(() =>
    new AvatarButton("user-menu").icon("assets/user.svg").build(cx),
  ).toThrow("AvatarButton description must be a non-blank string");
});

test("a metric labels its figure and rewraps on a basis rather than a width", () => {
  const element = new Metric("Net assets")
    .value("1,204.55 USD")
    .size("heading")
    .tone("#00aa00ff")
    .basis(170)
    .build(cx);
  expect(callsTo(element, "flex_basis")[0].args).toEqual([170]);
  expect(callsTo(element, "flex_grow")[0].args).toEqual([1]);

  const [title, figure] = childArgs(element);
  expect(callsTo(title, "child")[0].args).toEqual(["Net assets"]);
  expect(callsTo(figure, "child")[0].args).toEqual(["1,204.55 USD"]);
  expect(callsTo(figure, "text_size")[0].args).toEqual([style().font.heading]);
  expect(callsTo(figure, "text_color")[0].args).toEqual(["#00aa00ff"]);

  expect(() => new Metric("Net assets").build(cx)).toThrow(
    "Metric value must be a non-blank string",
  );
  expect(() => new Metric("Net assets").basis(0)).toThrow(
    "Metric basis must be a positive number",
  );
});

test("a metric grid wraps and keeps its children in order", () => {
  const one = gpuiElement("one");
  const two = gpuiElement("two");
  const element = new MetricGrid("summary").child(one).children([two]).build(cx);
  expect(callsTo(element, "flex_wrap")).toHaveLength(1);
  expect(callsTo(element, "children")[0].args).toEqual([[one, two]]);
});

test("a definition list pairs each label with its value", () => {
  const element = new DefinitionList("order-detail")
    .entry("Quantity", "100")
    .entry("Price", "188.00", "#00aa00ff")
    .build(cx);
  const rows = callsTo(element, "children")[0].args[0];
  expect(rows).toHaveLength(2);
  const [label, value] = childArgs(rows[1]);
  expect(callsTo(label, "child")[0].args).toEqual(["Price"]);
  expect(callsTo(value, "text_color")[0].args).toEqual(["#00aa00ff"]);

  expect(() => new DefinitionList("d").entry("Quantity", "")).toThrow(
    "DefinitionList entry value must be a non-blank string",
  );
});

test("a code block spaces its value so it can be transcribed", () => {
  const element = new CodeBlock("device-code").value("WDJB").build(cx);
  const figure = childArgs(element)[0];
  expect(callsTo(figure, "child")[0].args).toEqual(["W D J B"]);
  expect(callsTo(figure, "text_size")[0].args).toEqual([
    style().font.displayLarge,
  ]);
});

test("a badge says its state in a word, and only optionally in a dot", () => {
  const element = new Badge("connection")
    .label("Live")
    .dot()
    .color("#00aa00ff")
    .description("Quote stream: connected")
    .build(cx);
  const [dot, word] = childArgs(element);
  expect(callsTo(dot, "bg")[0].args).toEqual(["#00aa00ff"]);
  expect(callsTo(word, "child")[0].args).toEqual(["Live"]);
  expect(callsTo(element, "accessibility_label")[0].args).toEqual([
    "Live: Quote stream: connected",
  ]);

  // Without a dot the word stands alone, which is the whole signal either way.
  expect(childArgs(new Badge("c").label("Offline").build(cx))).toHaveLength(1);
  expect(() => new Badge("c").tone(/** @type {any} */ ("info"))).toThrow(
    /Badge tone must be one of/,
  );
});

test("a badge falls back to the muted foreground for a reading it cannot name", () => {
  // `success` and `warning` are not semantic tokens. A library that invented a
  // green would be guessing at the theme's palette.
  const warning = new Badge("c").label("Connecting").tone("warning").dot().build(cx);
  expect(callsTo(childArgs(warning)[0], "bg")[0].args).toEqual([
    theme.colors.muted_foreground,
  ]);
  const danger = new Badge("c").label("Error").tone("danger").dot().build(cx);
  expect(callsTo(childArgs(danger)[0], "bg")[0].args).toEqual([
    theme.colors.destructive,
  ]);
});

test("an alert marks itself with a rail as well as a colour", () => {
  const element = new Alert("error").message("The request timed out.").build(cx);
  expect(callsTo(element, "role")[0].args).toEqual(["alert"]);
  expect(callsTo(element, "border_color")[0].args).toEqual([
    theme.colors.destructive,
  ]);
  const [rail, copy] = childArgs(element);
  expect(callsTo(rail, "bg")[0].args).toEqual([theme.colors.destructive]);
  // The copy wraps: an error from a server is a sentence, not a label.
  expect(callsTo(copy, "whitespace_normal")).toHaveLength(1);
  expect(callsTo(copy, "child")[0].args).toEqual(["The request timed out."]);
});

test("a step is a numbered place in an errand", () => {
  const element = new Step(2).title("Type the code").build(cx);
  const [marker, title] = childArgs(element);
  expect(callsTo(childArgs(marker)[0], "child")[0].args).toEqual(["2"]);
  expect(callsTo(title, "child")[0].args).toEqual(["Type the code"]);

  for (const index of [0, -1, 1.5, "2", null]) {
    expect(() => new Step(/** @type {any} */ (index))).toThrow(
      "Step index must be a positive integer",
    );
  }
});

test("a key cap draws the keyboard, not the interface", () => {
  const resting = new Keycap("Ctrl + K").build(cx);
  const pressed = new Keycap("Ctrl + K").pressed().build(cx);
  const quiet = new Keycap("Ctrl + K").quiet().build(cx);

  // A pressed cap takes the focus chrome: nothing here is selectable.
  expect(callsTo(pressed, "bg")[0].args).not.toEqual(
    callsTo(resting, "bg")[0].args,
  );
  // Only the resting fill fades in a hint strip; the label stays legible.
  expect(callsTo(quiet, "bg")[0].args).not.toEqual(
    callsTo(resting, "bg")[0].args,
  );
  expect(callsTo(quiet, "text_color")[0].args).toEqual([
    theme.colors.muted_foreground,
  ]);
});

test("an external link is underlined as well as tinted", () => {
  const element = new ExternalLink("docs")
    .label("Open the guide")
    .href("https://example.com")
    .build(cx);
  expect(callsTo(element, "href")[0].args).toEqual(["https://example.com"]);
  expect(callsTo(element, "border_b")).toHaveLength(1);
  expect(callsTo(element, "text_color")[0].args).toEqual([
    callsTo(element, "border_color")[0].args[0],
  ]);

  expect(() => new ExternalLink("docs").label("Open").build(cx)).toThrow(
    "ExternalLink href must be a non-blank string",
  );
});

test("a filter field styles a control the application owns", () => {
  const state = { id: "input-state" };
  const element = new TextField().state(state).width(180).build(cx);
  expect(element.args).toEqual([state]);
  expect(callsTo(element, "w")[0].args).toEqual([180]);
  expect(callsTo(element, "focus")).toHaveLength(1);

  expect(() => new TextField().build(cx)).toThrow(
    "TextField state must be an application-owned InputState",
  );
  expect(() => new TextField().size("tiny")).toThrow(
    /TextField size must be one of/,
  );
});

test("a number input supplies the look of the step buttons the base layer builds", () => {
  const state = { id: "quantity-state" };
  const element = new NumberInput()
    .state(state)
    .incrementLabel("Increase quantity")
    .decrementLabel("Decrease quantity")
    .suffix("shares")
    .build(cx);

  expect(element.name).toBe("NumberInput");
  expect(element.args).toEqual([state]);
  // Stacked at one edge, and as wide as the shell reserved for a number field.
  expect(callsTo(element, "controls_right")).toHaveLength(1);
  expect(callsTo(element, "w")[0].args).toEqual([style().spacing.numberFieldWidth]);
  expect(callsTo(element, "focus")).toHaveLength(1);

  // The base layer's step buttons carry no size and no content, so an
  // undecorated one cannot be seen or pressed. Each slot gets an element that
  // draws a mark and announces what pressing it does.
  for (const [slot, label] of [
    ["decrement_button", "Decrease quantity"],
    ["increment_button", "Increase quantity"],
  ]) {
    const [button] = callsTo(element, slot)[0].args;
    expect(callsTo(button, "accessibility_label")[0].args).toEqual([label]);
    expect(callsTo(button, "hover")).toHaveLength(1);
    expect(childArgs(button)).toHaveLength(1);
  }
  expect(callsTo(element, "decrement_button")[0].args[0].calls).not.toEqual(
    callsTo(element, "increment_button")[0].args[0].calls,
  );

  expect(new NumberInput().state(state).width(96).incrementLabel("Up").decrementLabel("Down"))
    .toBeDefined();
});

test("a number input requires the state and the copy it cannot write", () => {
  const state = { id: "quantity-state" };

  expect(() =>
    new NumberInput().incrementLabel("Up").decrementLabel("Down").build(cx),
  ).toThrow("NumberInput state must be an application-owned InputState");
  expect(() =>
    new NumberInput().state(state).decrementLabel("Down").build(cx),
  ).toThrow(/NumberInput increment label/);
  expect(() =>
    new NumberInput().state(state).incrementLabel("Up").build(cx),
  ).toThrow(/NumberInput decrement label/);
  expect(() => new NumberInput().size("tiny")).toThrow(
    /NumberInput size must be one of/,
  );
});

test("a disclosure reports its state and never keeps it", () => {
  const body = gpuiElement("readings");
  const toggles = [];
  const section = new AccordionSection("more")
    .title("More detail")
    .detail("Trading")
    .open()
    .level(3)
    .keepMounted()
    .body(body)
    .onToggle((open) => toggles.push(open));

  // Repeatable: a view rebuilt on every tick builds the same configuration
  // again. Compared by the operations applied rather than by their arguments,
  // because the arguments are nested stub proxies and deep-comparing one
  // records the comparison's own reads on it.
  const operations = (built) => built.calls.map((call) => call.method);
  expect(operations(section.build(cx))).toEqual(operations(section.build(cx)));

  const element = section.build(cx);
  expect(callsTo(element, "open")[0].args).toEqual([true]);

  const header = callsTo(element, "header")[0].args[0];
  expect(callsTo(header, "aria_level")[0].args).toEqual([3]);

  const panel = callsTo(element, "panel")[0].args[0];
  expect(callsTo(panel, "keep_mounted")[0].args).toEqual([true]);
  expect(childArgs(panel).at(-1)).toBe(body);
});

test("a disclosure requires a title and a body, and checks its level", () => {
  expect(() => new AccordionSection("s").body(gpuiElement("b")).build(cx)).toThrow(
    "AccordionSection title must be a non-blank string",
  );
  expect(() => new AccordionSection("s").title("More").build(cx)).toThrow(
    "AccordionSection body must be a GPUI element or entity",
  );
  for (const level of [0, 7, 2.5, "3"]) {
    expect(() => new AccordionSection("s").level(/** @type {any} */ (level))).toThrow(
      "AccordionSection level must be an integer from 1 to 6",
    );
  }
  expect(() => new AccordionSection("s").onToggle(/** @type {any} */ (1))).toThrow(
    "AccordionSection onToggle must be a function when supplied",
  );
});

test("an accordion group carries its sections in order", () => {
  const first = gpuiElement("one");
  const second = gpuiElement("two");
  const element = new AccordionGroup("sections")
    .child(first)
    .child(second)
    .build(cx);
  expect(element.args).toEqual(["sections"]);
  expect(callsTo(element, "children")[0].args).toEqual([[first, second]]);
});
