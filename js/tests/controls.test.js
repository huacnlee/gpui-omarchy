// @ts-check

import { beforeEach, expect, test } from "bun:test";
import { element, resolvedStyle } from "./gpui-stub.js";
import * as controls from "../src/controls.js";
import { applyOmarchyStyle } from "../src/style.js";

// A neutral control takes the chrome the theme names, so the fixture names all
// of it. The values are deliberately unrelated to any alpha of the foreground:
// a test that passed with either would not tell the two routes apart.
const theme = {
  colors: {
    accent: "#445566ff",
    border: "#777777ff",
    destructive: "#ff3344ff",
    foreground: "#eeeeeeff",
    muted: "#333333ff",
    muted_foreground: "#999999ff",
    ring: "#2233aaff",
    surface: "#181818ff",
  },
};

const cx = { theme: () => theme };

beforeEach(() => {
  applyOmarchyStyle("");
});

/** @param {any} value @param {string} method */
function callsTo(value, method) {
  return value.calls.filter((call) => call.method === method);
}

/** @param {any} value @param {string} method */
function oneCall(value, method) {
  const calls = callsTo(value, method);
  expect(calls, `expected one ${method} call`).toHaveLength(1);
  return calls[0];
}

test("exports exactly the control value classes", () => {
  expect(Object.keys(controls).sort()).toEqual([
    "AvatarButton",
    "Button",
    "ExternalLink",
    "FieldRow",
    "FormField",
    "GlyphButton",
    "IconButton",
    "KeyHints",
    "Keycap",
    "MenuItem",
    "MenuSeparator",
    "NumberInput",
    "Separator",
    "Tabs",
    "TextField",
  ]);

  for (const name of Object.keys(controls)) {
    expect(typeof controls[name]).toBe("function");
  }
});

test("every ID-bearing component accepts only non-blank string ids", () => {
  const factories = [
    ["Button", (id) => new controls.Button(id)],
    ["IconButton", (id) => new controls.IconButton(id)],
    ["GlyphButton", (id) => new controls.GlyphButton(id)],
    ["MenuItem", (id) => new controls.MenuItem(id)],
    ["FieldRow", (id) => new controls.FieldRow(id)],
    ["FormField", (id) => new controls.FormField(id)],
    ["KeyHints", (id) => new controls.KeyHints(id)],
  ];
  const invalidIds = [
    undefined,
    null,
    "",
    "   ",
    0,
    42,
    false,
    true,
    {},
    [],
    Symbol("id"),
    () => "id",
  ];

  for (const [name, create] of factories) {
    expect(() => create(`${String(name).toLowerCase()}-id`)).not.toThrow();
    for (const id of invalidIds) {
      expect(() => create(id)).toThrow(
        `${name} id must be a non-blank string`,
      );
    }
  }
});

test("fluent builders mutate private configuration and return the same value", () => {
  const callback = () => {};
  const button = new controls.Button("save");
  expect(button.label("Save")).toBe(button);
  expect(button.icon("consumer/icons/save.svg")).toBe(button);
  expect(button.outlined()).toBe(button);
  expect(button.bordered()).toBe(button);
  expect(button.selected()).toBe(button);
  expect(button.danger()).toBe(button);
  expect(button.disabled(false)).toBe(button);
  expect(button.loading(false)).toBe(button);
  expect(button.loadingLabel("Saving changes")).toBe(button);
  expect(button.size("large")).toBe(button);
  expect(button.onClick(callback)).toBe(button);

  for (const compact of [
    new controls.IconButton("refresh")
      .icon("consumer/icons/refresh.svg")
      .description("Refresh"),
    new controls.GlyphButton("more").glyph("…").description("More actions"),
  ]) {
    expect(compact.outlined()).toBe(compact);
    expect(compact.bordered()).toBe(compact);
    expect(compact.selected()).toBe(compact);
    expect(compact.disabled(false)).toBe(compact);
    expect(compact.loading(false)).toBe(compact);
    expect(compact.loadingLabel("Working")).toBe(compact);
    expect(compact.size("small")).toBe(compact);
    expect(compact.onClick(callback)).toBe(compact);
  }

  const menuItem = new controls.MenuItem("rename");
  expect(menuItem.label("Rename")).toBe(menuItem);
  expect(menuItem.detail("Return")).toBe(menuItem);
  expect(menuItem.icon("consumer/icons/rename.svg")).toBe(menuItem);
  expect(menuItem.selected()).toBe(menuItem);
  expect(menuItem.danger()).toBe(menuItem);
  expect(menuItem.disabled(false)).toBe(menuItem);
  expect(menuItem.onClick(callback)).toBe(menuItem);

  const field = new controls.FieldRow("name");
  expect(field.label("Name")).toBe(field);
  expect(field.control(element("Input"))).toBe(field);

  const formField = new controls.FormField("email");
  expect(formField.label("Email")).toBe(formField);
  expect(formField.control(element("Input"))).toBe(formField);
  expect(formField.helper("Used for notifications")).toBe(formField);
  expect(formField.error("Email is invalid")).toBe(formField);

  expect(Object.keys(button)).toEqual([]);
  expect(Object.keys(menuItem)).toEqual([]);
  expect(Object.keys(field)).toEqual([]);
});

test("build reports each missing semantic field", () => {
  expect(() => new controls.Button("save").build(cx)).toThrow(
    "Button label must be a non-blank string",
  );
  expect(() => new controls.IconButton("refresh").description("Refresh").build(cx)).toThrow(
    "IconButton icon must be a non-blank string",
  );
  expect(() =>
    new controls.IconButton("refresh").icon("consumer/icons/refresh.svg").build(cx),
  ).toThrow("IconButton description must be a non-blank string");
  expect(() => new controls.GlyphButton("more").description("More actions").build(cx)).toThrow(
    "GlyphButton glyph must be a non-blank string",
  );
  expect(() => new controls.GlyphButton("more").glyph("…").build(cx)).toThrow(
    "GlyphButton description must be a non-blank string",
  );
  expect(() => new controls.MenuItem("rename").build(cx)).toThrow(
    "MenuItem label must be a non-blank string",
  );
  expect(() => new controls.FieldRow("name").control(element("Input")).build(cx)).toThrow(
    "FieldRow label must be a non-blank string",
  );
  expect(() => new controls.FieldRow("name").label("Name").build(cx)).toThrow(
    "FieldRow control must be a GPUI element or entity",
  );
  expect(() => new controls.FormField("email").control(element("Input")).build(cx)).toThrow(
    "FormField label must be a non-blank string",
  );
  expect(() => new controls.FormField("email").label("Email").build(cx)).toThrow(
    "FormField control must be a GPUI element or entity",
  );
  expect(() => new controls.Keycap("").build(cx)).toThrow(
    "Keycap value must be a non-blank string",
  );
});

test("loading controls require caller-owned non-blank loading labels", () => {
  const factories = [
    [
      "Button",
      (value) => new controls.Button("save")
        .label("Save")
        .loadingLabel(value)
        .loading(),
    ],
    [
      "IconButton",
      (value) => new controls.IconButton("refresh")
        .icon("consumer/icons/refresh.svg")
        .description("Refresh")
        .loadingLabel(value)
        .loading(),
    ],
    [
      "GlyphButton",
      (value) => new controls.GlyphButton("more")
        .glyph("…")
        .description("More actions")
        .loadingLabel(value)
        .loading(),
    ],
  ];

  for (const [name, create] of factories) {
    for (const value of [undefined, null, "", "   ", 42, false, {}, []]) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} loading label must be a non-blank string`,
      );
    }
  }
});

test("every required control text accepts only non-blank strings", () => {
  const invalidText = [
    undefined,
    null,
    "",
    "   ",
    0,
    42,
    false,
    true,
    {},
    [],
    Symbol("text"),
    () => "text",
  ];
  const factories = [
    ["Button", "label", (value) => new controls.Button("button").label(value)],
    [
      "IconButton",
      "icon",
      (value) => new controls.IconButton("icon").icon(value).description("Open"),
    ],
    [
      "IconButton",
      "description",
      (value) => new controls.IconButton("icon").icon("icons/open.svg").description(value),
    ],
    [
      "GlyphButton",
      "glyph",
      (value) => new controls.GlyphButton("glyph").glyph(value).description("More"),
    ],
    [
      "GlyphButton",
      "description",
      (value) => new controls.GlyphButton("glyph").glyph("…").description(value),
    ],
    ["MenuItem", "label", (value) => new controls.MenuItem("menu").label(value)],
    [
      "FieldRow",
      "label",
      (value) => new controls.FieldRow("field").label(value).control(element("Input")),
    ],
    [
      "FormField",
      "label",
      (value) => new controls.FormField("form").label(value).control(element("Input")),
    ],
    ["Keycap", "value", (value) => new controls.Keycap(value)],
  ];

  for (const [name, field, create] of factories) {
    for (const value of invalidText) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} ${field} must be a non-blank string`,
      );
    }
  }
});

test("optional control copy is non-blank when configured", () => {
  const factories = [
    ["Button", "icon", (value) => new controls.Button("button").label("Save").icon(value)],
    ["Button", "loading label", (value) => new controls.Button("button").label("Save").loadingLabel(value)],
    ["IconButton", "loading label", (value) => new controls.IconButton("icon").icon("icons/open.svg").description("Open").loadingLabel(value)],
    ["GlyphButton", "loading label", (value) => new controls.GlyphButton("glyph").glyph("…").description("More").loadingLabel(value)],
    ["MenuItem", "detail", (value) => new controls.MenuItem("menu").label("Open").detail(value)],
    ["MenuItem", "icon", (value) => new controls.MenuItem("menu").label("Open").icon(value)],
    ["FormField", "helper", (value) => new controls.FormField("form").label("Name").control(element("Input")).helper(value)],
  ];

  for (const [name, field, create] of factories) {
    for (const value of [
      null,
      "",
      "   ",
      0,
      42,
      false,
      true,
      {},
      [],
      Symbol("text"),
      () => "text",
    ]) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} ${field} must be a non-blank string when supplied`,
      );
    }
  }

  expect(() =>
    new controls.FormField("form")
      .label("Name")
      .control(element("Input"))
      .error("")
      .build(cx),
  ).not.toThrow();
  for (const value of [
    null,
    "   ",
    0,
    42,
    false,
    true,
    {},
    [],
    Symbol("text"),
    () => "text",
  ]) {
    expect(() =>
      new controls.FormField("form")
        .label("Name")
        .control(element("Input"))
        .error(value)
        .build(cx),
    ).toThrow("FormField error must be a non-blank string when supplied");
  }
});

test("field controls accept only GPUI elements or entities", () => {
  const factories = [
    ["FieldRow", (value) => new controls.FieldRow("field").label("Name").control(value)],
    ["FormField", (value) => new controls.FormField("form").label("Name").control(value)],
  ];

  for (const [name, create] of factories) {
    for (const value of [
      undefined,
      null,
      false,
      "input",
      0,
      42,
      true,
      {},
      [],
      Symbol("control"),
      () => {},
    ]) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} control must be a GPUI element or entity`,
      );
    }
  }

  const entity = { set_props() {}, release() {} };
  expect(() => new controls.FieldRow("field").label("Name").control(entity).build(cx)).not.toThrow();
});

test("control callback builders accept only functions or undefined", () => {
  const factories = [
    ["Button", () => new controls.Button("button")],
    ["IconButton", () => new controls.IconButton("icon")],
    ["GlyphButton", () => new controls.GlyphButton("glyph")],
    ["MenuItem", () => new controls.MenuItem("menu")],
  ];

  for (const [name, create] of factories) {
    expect(() => create().onClick(undefined)).not.toThrow();
    expect(() => create().onClick(() => {})).not.toThrow();
    for (const value of [null, false, 0, "callback", {}, []]) {
      expect(() => create().onClick(value)).toThrow(
        `${name} onClick must be a function when supplied`,
      );
    }
  }
});

test("KeyHints validates every appended key and label", () => {
  for (const value of [undefined, null, "", "   ", 0, false, {}, []]) {
    expect(() => new controls.KeyHints("hints").hint(value, "Open").build(cx)).toThrow(
      "KeyHints key must be a non-blank string",
    );
    expect(() => new controls.KeyHints("hints").hint("Enter", value).build(cx)).toThrow(
      "KeyHints label must be a non-blank string",
    );
  }
});

test("size rejects unknown values at the builder call", () => {
  for (const control of [
    new controls.Button("save"),
    new controls.IconButton("refresh"),
    new controls.GlyphButton("more"),
  ]) {
    expect(() => control.size("giant")).toThrow(
      `${control.constructor.name} size must be one of xsmall, small, medium, large; received "giant"`,
    );
  }
});

test("build is repeatable and preserves stable identity and callbacks", () => {
  const callback = () => {};
  const value = new controls.Button("save").label("Save").onClick(callback);

  const first = value.build(cx);
  const second = value.build(cx);

  expect(first).not.toBe(second);
  expect(first.args).toEqual(["save"]);
  expect(second.args).toEqual(["save"]);
  expect(oneCall(first, "on_click").args).toEqual([callback]);
  expect(oneCall(second, "on_click").args).toEqual([callback]);
  expect(oneCall(first, "child").args).toEqual(["Save"]);
  expect(oneCall(second, "child").args).toEqual(["Save"]);
});

test("buttons wire callbacks only while actionable", () => {
  const callback = () => {};
  const enabled = new controls.Button("enabled").label("Save").onClick(callback).build(cx);
  const disabled = new controls.Button("disabled")
    .label("Save")
    .disabled()
    .onClick(callback)
    .build(cx);
  const loading = new controls.Button("loading")
    .label("Save")
    .loadingLabel("Saving changes")
    .loading()
    .onClick(callback)
    .build(cx);

  expect(oneCall(enabled, "on_click").args).toEqual([callback]);
  expect(callsTo(disabled, "on_click")).toHaveLength(0);
  expect(callsTo(loading, "on_click")).toHaveLength(0);
  expect(oneCall(disabled, "disabled").args).toEqual([true]);
  expect(oneCall(loading, "disabled").args).toEqual([true]);
  expect(oneCall(loading, "accessibility_label").args).toEqual([
    "Saving changes",
  ]);
  expect(oneCall(loading, "child").args).toEqual(["Saving changes"]);
});

test("icon, glyph, and menu callbacks survive repeated builds and stay disabled when inactive", () => {
  const callback = () => {};
  const values = [
    new controls.IconButton("refresh")
      .icon("consumer/icons/refresh.svg")
      .description("Refresh")
      .onClick(callback),
    new controls.GlyphButton("more")
      .glyph("…")
      .description("More actions")
      .onClick(callback),
    new controls.MenuItem("rename").label("Rename").onClick(callback),
  ];

  for (const value of values) {
    const first = value.build(cx);
    const second = value.build(cx);
    expect(first).not.toBe(second);
    expect(oneCall(first, "on_click").args).toEqual([callback]);
    expect(oneCall(second, "on_click").args).toEqual([callback]);
  }

  const inactive = [
    new controls.IconButton("disabled-icon")
      .icon("consumer/icons/refresh.svg")
      .description("Refresh")
      .disabled()
      .onClick(callback)
      .build(cx),
    new controls.GlyphButton("loading-glyph")
      .glyph("…")
      .description("More actions")
      .loadingLabel("Loading more actions")
      .loading()
      .onClick(callback)
      .build(cx),
    new controls.MenuItem("disabled-menu")
      .label("Rename")
      .disabled()
      .onClick(callback)
      .build(cx),
  ];

  for (const control of inactive) {
    expect(callsTo(control, "on_click")).toHaveLength(0);
  }
});

test("consumer asset paths pass through unchanged", () => {
  const button = new controls.Button("save")
    .label("Save")
    .icon("consumer/brand/save-mark.svg")
    .build(cx);
  const iconButton = new controls.IconButton("refresh")
    .icon("plugins/calendar/refresh.svg")
    .description("Refresh")
    .build(cx);
  const menuItem = new controls.MenuItem("rename")
    .label("Rename")
    .icon("outside-the-library/rename.svg")
    .build(cx);

  expect(callsTo(button, "child")[0].args[0].args).toEqual([
    "consumer/brand/save-mark.svg",
  ]);
  expect(oneCall(iconButton, "child").args[0].args).toEqual(["plugins/calendar/refresh.svg"]);
  const leading = oneCall(menuItem, "child").args[0];
  expect(callsTo(leading, "child")[0].args[0].args).toEqual([
    "outside-the-library/rename.svg",
  ]);
});

test("composed selected hover and focus preserve selection while using exact state tokens", () => {
  applyOmarchyStyle(`
[controls]
normal-border-width = 1
hover-cursor-border-width = 2
selected-border-width = 3
focus-border-width = 4
selected-border-alpha = 0.6
hover-cursor-border-alpha = 0.25
focus-fill-alpha = 0.12
focus-border-alpha = 0.7
`);

  const selected = new controls.Button("save").label("Save").selected().build(cx);
  expect(oneCall(selected, "selected").args).toEqual([true]);
  expect(oneCall(selected, "bg").args).toEqual([theme.colors.accent]);
  expect(oneCall(selected, "border").args).toEqual([3]);
  expect(oneCall(selected, "border_color").args).toEqual([theme.colors.accent]);

  expect(resolvedStyle(selected, "hover")).toMatchObject({
    bg: theme.colors.accent,
    border: 3,
    border_color: theme.colors.accent,
  });
  expect(resolvedStyle(selected, "focus")).toMatchObject({
    bg: theme.colors.accent,
    border: 4,
    border_color: theme.colors.ring,
  });
  expect(resolvedStyle(selected, "active").bg).toBe("#eeeeee38");

  const unselected = new controls.Button("edit").label("Edit").build(cx);
  expect(resolvedStyle(unselected, "hover")).toMatchObject({
    bg: theme.colors.muted,
    border: 2,
    border_color: theme.colors.border,
  });
  expect(resolvedStyle(unselected, "focus")).toMatchObject({
    bg: theme.colors.muted,
    border: 4,
    border_color: theme.colors.ring,
  });

  const selectedControls = [
    new controls.IconButton("refresh")
      .icon("consumer/icons/refresh.svg")
      .description("Refresh")
      .selected()
      .build(cx),
    new controls.GlyphButton("more")
      .glyph("…")
      .description("More actions")
      .selected()
      .build(cx),
  ];

  for (const control of selectedControls) {
    expect(resolvedStyle(control, "hover").bg).toBe(theme.colors.accent);
    expect(resolvedStyle(control, "focus")).toMatchObject({
      bg: theme.colors.accent,
      border: 4,
      border_color: theme.colors.ring,
    });
  }

  // A menu row is not in this group. Its active state *is* the pointer's own
  // fill, because a row is activated rather than chosen — so hover has nothing
  // further to say, and focus reports the keyboard without promoting the row.
  const activeRow = new controls.MenuItem("rename").label("Rename").selected().build(cx);
  expect(resolvedStyle(activeRow, "hover").bg).toBe(theme.colors.muted);
  expect(resolvedStyle(activeRow, "focus")).toMatchObject({
    bg: theme.colors.muted,
    border: 4,
    border_color: theme.colors.ring,
  });
});

test("outlined, disabled, and loading states remain visibly distinct", () => {
  const outlined = new controls.Button("outlined").label("Edit").outlined().build(cx);
  const disabled = new controls.Button("disabled").label("Edit").disabled().build(cx);
  const loading = new controls.IconButton("loading")
    .icon("consumer/icons/sync.svg")
    .description("Sync")
    .loadingLabel("Synchronizing calendar")
    .loading()
    .build(cx);

  expect(oneCall(outlined, "border_color").args).toEqual([theme.colors.border]);
  expect(oneCall(outlined, "bg").args).toEqual(["#00000000"]);
  expect(oneCall(disabled, "text_color").args).toEqual(["#999999ff"]);
  expect(callsTo(disabled, "opacity")).toHaveLength(0);
  expect(callsTo(disabled, "hover")).toHaveLength(0);
  expect(callsTo(disabled, "active")).toHaveLength(0);
  expect(oneCall(loading, "accessibility_label").args).toEqual([
    "Synchronizing calendar",
  ]);
  expect(oneCall(loading, "tooltip").args).toEqual([
    "Synchronizing calendar",
  ]);
  expect(oneCall(loading, "text_color").args).toEqual(["#999999ff"]);
  expect(callsTo(loading, "opacity")).toHaveLength(0);
  const indicator = oneCall(loading, "child").args[0];
  expect(indicator.name).toBe("div");
  expect(oneCall(indicator, "role").args).toEqual(["progress_indicator"]);
  expect(oneCall(indicator, "accessibility_label").args).toEqual([
    "Synchronizing calendar",
  ]);
});

test("compact loading replaces an ellipsis glyph with a semantic activity marker", () => {
  const loading = new controls.GlyphButton("more")
    .glyph("…")
    .description("More actions")
    .loadingLabel("Loading more actions")
    .loading()
    .build(cx);

  expect(oneCall(loading, "accessibility_label").args).toEqual([
    "Loading more actions",
  ]);
  const indicator = oneCall(loading, "child").args[0];
  expect(indicator).not.toBe("…");
  expect(oneCall(indicator, "role").args).toEqual(["progress_indicator"]);
  expect(oneCall(indicator, "accessibility_label").args).toEqual([
    "Loading more actions",
  ]);
});

test("compact commands and menu items expose focus, hover, press, selection, and disabled states", () => {
  const compact = new controls.GlyphButton("more")
    .glyph("…")
    .description("More actions")
    .selected()
    .build(cx);
  const menuItem = new controls.MenuItem("rename").label("Rename").selected().build(cx);
  const disabledMenuItem = new controls.MenuItem("remove")
    .label("Remove")
    .disabled()
    .build(cx);

  expect(oneCall(compact, "selected").args).toEqual([true]);
  expect(oneCall(compact, "bg").args).toEqual([theme.colors.accent]);
  expect(oneCall(compact, "hover").style).toBeDefined();
  expect(oneCall(compact, "active").style).toBeDefined();
  expect(oneCall(compact, "focus").style).toBeDefined();

  expect(oneCall(menuItem, "selected").args).toEqual([true]);
  expect(oneCall(menuItem, "bg").args).toEqual([theme.colors.muted]);
  expect(oneCall(menuItem, "hover").style).toBeDefined();
  expect(oneCall(menuItem, "active").style).toBeDefined();
  expect(oneCall(menuItem, "focus").style).toBeDefined();

  expect(oneCall(disabledMenuItem, "text_color").args).toEqual(["#999999ff"]);
  expect(callsTo(disabledMenuItem, "opacity")).toHaveLength(0);
  expect(callsTo(disabledMenuItem, "hover")).toHaveLength(0);
  expect(callsTo(disabledMenuItem, "active")).toHaveLength(0);
});

test("danger Button reduces disabled emphasis from the destructive token", () => {
  const danger = new controls.Button("delete")
    .label("Delete")
    .icon("consumer/icons/delete.svg")
    .danger()
    .build(cx);
  const disabled = new controls.Button("delete-disabled")
    .label("Delete")
    .icon("consumer/icons/delete.svg")
    .danger()
    .disabled()
    .build(cx);
  const cleared = new controls.Button("delete-cleared")
    .label("Delete")
    .danger()
    .danger(false)
    .build(cx);

  expect(oneCall(danger, "text_color").args).toEqual(["#ff3344ff"]);
  expect(resolvedStyle(danger, "hover").bg).toBe("#ff334414");
  expect(resolvedStyle(danger, "active").bg).toBe("#ff334438");
  expect(resolvedStyle(danger, "focus")).toMatchObject({
    bg: "#ff334414",
    border: 1,
    border_color: "#ff334440",
  });
  const dangerIcon = callsTo(danger, "child")[0].args[0];
  expect(oneCall(dangerIcon, "text_color").args).toEqual(["#ff3344ff"]);

  expect(oneCall(disabled, "disabled").args).toEqual([true]);
  expect(oneCall(disabled, "text_color").args).toEqual(["#ff334466"]);
  const disabledIcon = callsTo(disabled, "child")[0].args[0];
  expect(oneCall(disabledIcon, "text_color").args).toEqual(["#ff334466"]);
  expect(callsTo(disabled, "hover")).toHaveLength(0);
  expect(callsTo(disabled, "active")).toHaveLength(0);
  expect(oneCall(cleared, "text_color").args).toEqual(["#eeeeeeff"]);
});

test("danger MenuItem reduces disabled root, label, and icon emphasis", () => {
  const danger = new controls.MenuItem("delete")
    .label("Delete")
    .icon("consumer/icons/delete.svg")
    .danger()
    .build(cx);
  const disabled = new controls.MenuItem("delete-disabled")
    .label("Delete")
    .icon("consumer/icons/delete.svg")
    .danger()
    .disabled()
    .build(cx);
  const cleared = new controls.MenuItem("delete-cleared")
    .label("Delete")
    .danger()
    .danger(false)
    .build(cx);

  expect(oneCall(danger, "text_color").args).toEqual(["#ff3344ff"]);
  expect(resolvedStyle(danger, "hover").bg).toBe("#ff334414");
  expect(resolvedStyle(danger, "active").bg).toBe("#ff334438");
  expect(resolvedStyle(danger, "focus")).toMatchObject({
    bg: "#ff334414",
    border: 1,
    border_color: "#ff334440",
  });
  const leading = oneCall(danger, "child").args[0];
  const icon = callsTo(leading, "child")[0].args[0];
  const label = callsTo(leading, "child")[1].args[0];
  expect(oneCall(icon, "text_color").args).toEqual(["#ff3344ff"]);
  expect(callsTo(label, "text_color").at(-1).args).toEqual(["#ff3344ff"]);

  expect(oneCall(disabled, "disabled").args).toEqual([true]);
  expect(oneCall(disabled, "text_color").args).toEqual(["#ff334466"]);
  const disabledLeading = oneCall(disabled, "child").args[0];
  const disabledIcon = callsTo(disabledLeading, "child")[0].args[0];
  const disabledLabel = callsTo(disabledLeading, "child")[1].args[0];
  expect(oneCall(disabledIcon, "text_color").args).toEqual(["#ff334466"]);
  expect(callsTo(disabledLabel, "text_color").at(-1).args).toEqual([
    "#ff334466",
  ]);
  expect(callsTo(disabled, "hover")).toHaveLength(0);
  expect(callsTo(disabled, "active")).toHaveLength(0);
  expect(oneCall(cleared, "text_color").args).toEqual(["#eeeeeeff"]);
});

test("semantic sizes change the complete control frame", () => {
  const small = new controls.Button("small").label("Small").size("small").build(cx);
  const medium = new controls.Button("medium").label("Medium").build(cx);
  const large = new controls.Button("large").label("Large").size("large").build(cx);
  const compactSmall = new controls.IconButton("compact-small")
    .icon("consumer/icons/a.svg")
    .description("Small")
    .size("small")
    .build(cx);
  const compactLarge = new controls.IconButton("compact-large")
    .icon("consumer/icons/a.svg")
    .description("Large")
    .size("large")
    .build(cx);

  expect(oneCall(small, "h").args).toEqual([24]);
  expect(oneCall(medium, "h").args).toEqual([28]);
  expect(oneCall(large, "h").args).toEqual([32]);
  expect(oneCall(small, "text_size").args).toEqual([11]);
  expect(oneCall(medium, "text_size").args).toEqual([12]);
  expect(oneCall(large, "text_size").args).toEqual([14]);
  expect(oneCall(compactSmall, "size").args).toEqual([24]);
  expect(oneCall(compactLarge, "size").args).toEqual([32]);
});

test("field wrappers retain supplied controls, labels, helper copy, and stable ids", () => {
  const rowControl = element("Input", ["row-state"]);
  const formControl = element("Input", ["form-state"]);
  const row = new controls.FieldRow("name").label("Name").control(rowControl).build(cx);
  const form = new controls.FormField("email")
    .label("Email")
    .control(formControl)
    .helper("Used for notifications")
    .build(cx);

  expect(oneCall(row, "id").args).toEqual(["name"]);
  expect(callsTo(row, "child").at(-1).args).toEqual([rowControl]);
  expect(oneCall(form, "id").args).toEqual(["email"]);
  expect(callsTo(form, "child").at(1).args).toEqual([formControl]);
  expect(callsTo(form, "child").at(2).args[0].name).toBe("div");
});

test("FormField error replaces helper text with semantic danger feedback", () => {
  const control = element("Input", ["email-state"]);
  const invalid = new controls.FormField("email")
    .label("Email")
    .control(control)
    .helper("Used for notifications")
    .error("Enter a valid email address")
    .build(cx);
  const cleared = new controls.FormField("email-cleared")
    .label("Email")
    .control(control)
    .helper("Used for notifications")
    .error("")
    .build(cx);

  const invalidFeedback = callsTo(invalid, "child").at(2).args[0];
  expect(oneCall(invalidFeedback, "child").args).toEqual([
    "Enter a valid email address",
  ]);
  expect(callsTo(invalidFeedback, "text_color").at(-1).args).toEqual([
    "#ff3344ff",
  ]);
  expect(oneCall(invalidFeedback, "role").args).toEqual(["alert"]);

  const helper = callsTo(cleared, "child").at(2).args[0];
  expect(oneCall(helper, "child").args).toEqual(["Used for notifications"]);
  expect(callsTo(helper, "text_color").at(-1).args).toEqual(["#999999ff"]);
  expect(callsTo(helper, "role")).toHaveLength(0);
});

test("separator and keyboard hint values build fresh token-driven descriptions", () => {
  const separator = new controls.Separator();
  const menuSeparator = new controls.MenuSeparator();
  const keycap = new controls.Keycap("Return");
  const hints = new controls.KeyHints("editor-hints")
    .hint("j", "next")
    .hint("k", "previous");

  expect(separator.build(cx)).not.toBe(separator.build(cx));
  expect(oneCall(menuSeparator.build(cx), "child").args[0].name).toBe("v_flex");
  expect(oneCall(keycap.build(cx), "child").args).toEqual(["Return"]);

  const builtHints = hints.build(cx);
  expect(oneCall(builtHints, "id").args).toEqual(["editor-hints"]);
  expect(oneCall(builtHints, "children").args[0]).toHaveLength(2);
});
