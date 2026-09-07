// @ts-check

import { expect, test } from "bun:test";
import {
  ActionBar,
  AppShell,
  StatusBar,
  CenteredWorkspace,
  PageColumn,
  Panel,
  PanelHeader,
  PopupSurface,
  Surface,
  Toolbar,
  TitleBar,
} from "../src/layout.js";
import { Label, MutedText, SectionLabel, Title } from "../src/text.js";
import { element } from "./gpui-stub.js";
import { applyOmarchyStyle, resolveSurfaceColor, style } from "../src/style.js";

const theme = {
  colors: {
    background: "#101010ff",
    border: "#777777ff",
    foreground: "#eeeeeeff",
    muted_foreground: "#999999ff",
    ring: "#2233aaff",
    surface: "#181818ff",
  },
};

const cx = { theme: () => theme };
const alternateTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: "#202020ff",
    foreground: "#fafafaff",
    surface: "#282828ff",
  },
};
const alternateCx = { theme: () => alternateTheme };

/** @param {any} element @param {string} method */
function callsTo(element, method) {
  return element.calls.filter((call) => call.method === method);
}

/** @param {any} element */
function childrenOf(element) {
  return element.calls
    .filter((call) => call.method === "child" || call.method === "children")
    .flatMap((call) =>
      call.method === "child" ? [call.args[0]] : call.args[0],
    );
}

/** @param {any} element */
function idOf(element) {
  return callsTo(element, "id")[0]?.args[0];
}

test("every ID-bearing layout class rejects non-string and blank ids", () => {
  const factories = [
    ["ActionBar", (id) => new ActionBar(id)],
    ["PanelHeader", (id) => new PanelHeader(id)],
    ["CenteredWorkspace", (id) => new CenteredWorkspace(id)],
    ["PageColumn", (id) => new PageColumn(id)],
    ["PopupSurface", (id) => new PopupSurface(id)],
  ];
  const invalidIds = [
    undefined,
    null,
    "",
    "   ",
    0,
    42,
    false,
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

test("named slot builders chain and preserve semantic child order", () => {
  const brand = element("brand");
  const center = element("center");
  const actions = element("actions");
  const status = element("status");
  const hints = element("hints");
  const heading = element("heading");
  const content = element("content");
  const top = new TitleBar();
  const bottom = new StatusBar();
  const action = new ActionBar("action");
  const panel = new PanelHeader("panel");
  const shell = new AppShell();
  const workspace = new CenteredWorkspace("workspace");

  expect(top.brand(brand)).toBe(top);
  expect(top.center(center)).toBe(top);
  expect(top.actions(actions)).toBe(top);
  expect(bottom.status(status)).toBe(bottom);
  expect(bottom.hints(hints)).toBe(bottom);
  expect(bottom.leadsWithIcon()).toBe(bottom);
  expect(action.actions(actions)).toBe(action);
  expect(action.status(status)).toBe(action);
  expect(panel.heading(heading)).toBe(panel);
  expect(panel.actions(actions)).toBe(panel);
  expect(shell.top(brand)).toBe(shell);
  expect(shell.content(content)).toBe(shell);
  expect(shell.bottom(hints)).toBe(shell);
  expect(workspace.content(content)).toBe(workspace);

  expect(
    childrenOf(
      new TitleBar().brand(brand).center(center).actions(actions).build(cx),
    ),
  ).toEqual([brand, center, actions]);
  expect(childrenOf(new StatusBar().status(status).hints(hints).build(cx))).toEqual([
    status,
    hints,
  ]);

  const actionChildren = childrenOf(
    new ActionBar("action").actions(actions).status(status).build(cx),
  );
  expect(actionChildren[0]).toBe(actions);
  expect(actionChildren[1].name).toBe("div");
  expect(callsTo(actionChildren[1], "flex_1")).toHaveLength(1);
  expect(actionChildren[2]).toBe(status);

  expect(
    childrenOf(
      new PanelHeader("panel").heading(heading).actions(actions).build(cx),
    ),
  ).toEqual([heading, actions]);

  const shellChildren = childrenOf(
    new AppShell().top(brand).content(content).bottom(hints).build(cx),
  );
  expect(shellChildren[0]).toBe(brand);
  expect(idOf(shellChildren[1])).toBe("application-content");
  expect(childrenOf(shellChildren[1])).toEqual([content]);
  expect(shellChildren[2]).toBe(hints);
});

test("optional named slots omit every falsy value", () => {
  const content = element("content");
  const heading = element("heading");

  for (const value of [undefined, null, false, "", 0, Number.NaN]) {
    expect(childrenOf(new TitleBar().brand(value).build(cx))).toEqual([]);
  }

  expect(
    childrenOf(new TitleBar().brand(false).center("").actions(0).build(cx)),
  ).toEqual([]);
  expect(childrenOf(new StatusBar().status(false).hints("").build(cx))).toEqual(
    [],
  );

  const actionChildren = childrenOf(
    new ActionBar("action").actions(0).status(false).build(cx),
  );
  expect(actionChildren).toHaveLength(1);
  expect(actionChildren[0].name).toBe("div");

  expect(
    childrenOf(new PanelHeader("panel").heading(heading).actions("").build(cx)),
  ).toEqual([heading]);

  const shellChildren = childrenOf(
    new AppShell().top(false).content(content).bottom(0).build(cx),
  );
  expect(shellChildren).toHaveLength(1);
  expect(idOf(shellChildren[0])).toBe("application-content");
  expect(childrenOf(shellChildren[0])).toEqual([content]);
});

test("open-ended container builders append children in call order", () => {
  const one = element("one");
  const two = element("two");
  const three = element("three");
  const four = element("four");

  const containers = [
    new PageColumn("page"),
    new Surface(),
    new PopupSurface("popup"),
  ];

  for (const container of containers) {
    expect(container.child(one)).toBe(container);
    expect(container.children([two, three])).toBe(container);
    expect(container.child(four)).toBe(container);
    expect(childrenOf(container.build(cx))).toEqual([one, two, three, four]);
  }

  const page = new PageColumn("sized-page");
  expect(page.maxWidth(720)).toBe(page);
});

test("build validates required semantic content", () => {
  const cases = [
    [new AppShell(), "AppShell content must be a GPUI element or entity"],
    [
      new CenteredWorkspace("workspace"),
      "CenteredWorkspace content must be a GPUI element or entity",
    ],
    [new PanelHeader("panel"), "PanelHeader heading must be a GPUI element or entity"],
    [new Label(), "Label text must be a non-blank string"],
    [new MutedText(), "MutedText text must be a non-blank string"],
    [new Title(), "Title text must be a non-blank string"],
    [new SectionLabel(), "SectionLabel text must be a non-blank string"],
  ];

  for (const [component, message] of cases) {
    expect(() => component.build(cx)).toThrow(message);
  }
});

test("every required layout text accepts only non-blank strings", () => {
  // `""` is absent on purpose: an empty run is a deliberate blank line, which
  // `tests/text.test.js` covers. Whitespace-only text stays an error.
  const invalidText = [
    undefined,
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
  ];
  const factories = [
    ["Label", (value) => new Label(value)],
    ["MutedText", (value) => new MutedText(value)],
    ["Title", (value) => new Title(value)],
    ["SectionLabel", (value) => new SectionLabel(value)],
  ];

  for (const [name, create] of factories) {
    for (const value of invalidText) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} text must be a non-blank string`,
      );
    }
  }
});

test("required layout slots accept only GPUI elements or entities", () => {
  const invalidContent = [
    undefined,
    null,
    false,
    "copy",
    0,
    42,
    true,
    {},
    [],
    Symbol("content"),
    () => {},
  ];
  const factories = [
    ["AppShell", "content", (value) => new AppShell().content(value)],
    [
      "PanelHeader",
      "heading",
      (value) => new PanelHeader("panel").heading(value),
    ],
    [
      "CenteredWorkspace",
      "content",
      (value) => new CenteredWorkspace("workspace").content(value),
    ],
  ];

  for (const [name, field, create] of factories) {
    for (const value of invalidContent) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} ${field} must be a GPUI element or entity`,
      );
    }
  }

  const entity = { set_props() {}, release() {} };
  expect(() => new AppShell().content(entity).build(cx)).not.toThrow();
});

test("truthy optional layout slots reject non-renderables", () => {
  const factories = [
    ["AppShell", "top", (value) => new AppShell().top(value).content(element("content"))],
    ["AppShell", "bottom", (value) => new AppShell().content(element("content")).bottom(value)],
    ["TitleBar", "brand", (value) => new TitleBar().brand(value)],
    ["TitleBar", "center", (value) => new TitleBar().center(value)],
    ["TitleBar", "actions", (value) => new TitleBar().actions(value)],
    ["StatusBar", "status", (value) => new StatusBar().status(value)],
    ["StatusBar", "hints", (value) => new StatusBar().hints(value)],
    ["ActionBar", "actions", (value) => new ActionBar("action").actions(value)],
    ["ActionBar", "status", (value) => new ActionBar("action").status(value)],
    ["PanelHeader", "actions", (value) => new PanelHeader("panel").heading(element("heading")).actions(value)],
  ];

  for (const [name, field, create] of factories) {
    for (const value of ["copy", 1, true, {}, [], () => {}]) {
      expect(() => create(value).build(cx)).toThrow(
        `${name} ${field} must be a GPUI element or entity`,
      );
    }
  }
});

test("open layout containers reject invalid child input at the builder boundary", () => {
  const factories = [
    ["PageColumn", () => new PageColumn("page")],
    ["Surface", () => new Surface()],
    ["PopupSurface", () => new PopupSurface("popup")],
  ];

  for (const [name, create] of factories) {
    for (const value of [
      undefined,
      null,
      false,
      "copy",
      0,
      42,
      true,
      {},
      [],
      Symbol("child"),
      () => {},
    ]) {
      expect(() => create().child(value)).toThrow(
        `${name} child must be a GPUI element or entity`,
      );
    }
    expect(() => create().children("copy")).toThrow(
      `${name} children must be an array of GPUI elements or entities`,
    );
    expect(() => create().children([element("valid"), {}])).toThrow(
      `${name} children[1] must be a GPUI element or entity`,
    );
  }
});

test("text builders accept constructor values, chain, and preserve text styling", () => {
  const tokens = style();
  const changedText = [
    [new Label("old"), "Label", "Label"],
    [new MutedText("old"), "Muted", "Muted"],
    [new Title("old"), "Title", "Title"],
    [new SectionLabel("old"), "Section", "Section"],
  ];
  for (const [component, value, expected] of changedText) {
    expect(component.text(value)).toBe(component);
    expect(childrenOf(component.build(cx))).toEqual([expected]);
  }

  const label = new Label("42").build(cx);
  expect(callsTo(label, "text_size")[0].args).toEqual([tokens.font.body]);
  expect(callsTo(label, "line_height")[0].args).toEqual([1.35]);
  expect(callsTo(label, "text_color")[0].args).toEqual(["#eeeeeeff"]);
  expect(childrenOf(label)).toEqual(["42"]);

  const muted = new MutedText("Secondary").build(cx);
  expect(callsTo(muted, "text_size")[0].args).toEqual([tokens.font.body]);
  expect(callsTo(muted, "line_height")[0].args).toEqual([1.35]);
  expect(callsTo(muted, "text_color")[0].args).toEqual(["#999999ff"]);

  const title = new Title("Settings").build(cx);
  expect(callsTo(title, "text_size")[0].args).toEqual([tokens.font.title]);
  expect(callsTo(title, "text_color")[0].args).toEqual(["#eeeeeeff"]);

  const section = new SectionLabel("General settings").build(cx);
  expect(callsTo(section, "text_size")[0].args).toEqual([tokens.font.caption]);
  expect(callsTo(section, "text_color")[0].args).toEqual(["#999999ff"]);
  expect(childrenOf(section)).toEqual(["General settings"]);
});

test("build is repeatable and does not consume component configuration", () => {
  const child = element("stable");
  const components = [
    new AppShell().content(child),
    new TitleBar().center(child),
    new StatusBar().status(child),
    new ActionBar("action").actions(child),
    new PanelHeader("panel").heading(child),
    new CenteredWorkspace("workspace").content(child),
    new PageColumn("page").child(child),
    new Surface().child(child),
    new PopupSurface("popup").child(child),
    new Label("Label"),
    new MutedText("Muted"),
    new Title("Title"),
    new SectionLabel("Section"),
  ];

  for (const component of components) {
    const first = component.build(cx);
    const second = component.build(cx);
    expect(second).not.toBe(first);
    expect(second.name).toBe(first.name);
    expect(second.calls).toEqual(first.calls);
  }
});

test("repeat builds resolve against each supplied context", () => {
  const child = element("stable");
  const surface = new Surface().child(child);

  const first = surface.build(cx);
  const second = surface.build(alternateCx);

  expect(first).not.toBe(second);
  expect(callsTo(first, "bg")[0].args).toEqual([theme.colors.surface]);
  expect(callsTo(second, "bg")[0].args).toEqual([
    alternateTheme.colors.surface,
  ]);
  expect(childrenOf(first)).toEqual([child]);
  expect(childrenOf(second)).toEqual([child]);
});

test("layout classes preserve stable ids", () => {
  const child = element("child");
  const shell = new AppShell().content(child).build(cx);
  expect(idOf(shell)).toBe("application-frame");
  expect(idOf(childrenOf(shell)[0])).toBe("application-content");
  expect(idOf(new TitleBar().build(cx))).toBe("application-top-bar");
  expect(idOf(new StatusBar().build(cx))).toBe("application-bottom-bar");
  expect(idOf(new ActionBar("actions-id").build(cx))).toBe("actions-id");
  expect(idOf(new PanelHeader("panel-id").heading(child).build(cx))).toBe("panel-id");
  expect(
    idOf(new CenteredWorkspace("workspace-id").content(child).build(cx)),
  ).toBe("workspace-id");
  expect(idOf(new PageColumn("page-id").build(cx))).toBe("page-id");
  expect(idOf(new PopupSurface("popup-id").build(cx))).toBe("popup-id");
});

test("shell and bar classes preserve resolved layout and surface styling", () => {
  const tokens = style();
  const shell = new AppShell().content(element("content")).build(cx);
  expect(callsTo(shell, "size_full")).toHaveLength(1);
  expect(callsTo(shell, "min_w_0")).toHaveLength(1);
  expect(callsTo(shell, "min_h_0")).toHaveLength(1);
  expect(callsTo(shell, "font_family")[0].args).toEqual([tokens.fontFamily]);
  expect(callsTo(shell, "text_size")[0].args).toEqual([tokens.font.body]);
  expect(callsTo(shell, "bg")[0].args).toEqual(["#101010ff"]);
  expect(callsTo(shell, "text_color")[0].args).toEqual(["#eeeeeeff"]);

  const content = childrenOf(shell)[0];
  expect(callsTo(content, "flex_1")).toHaveLength(1);
  expect(callsTo(content, "min_w_0")).toHaveLength(1);
  expect(callsTo(content, "min_h_0")).toHaveLength(1);
  expect(callsTo(content, "overflow_hidden")).toHaveLength(1);

  const top = new TitleBar().build(cx);
  expect(callsTo(top, "h")[0].args).toEqual([tokens.space(48)]);
  expect(callsTo(top, "flex_none")).toHaveLength(1);
  expect(callsTo(top, "items_center")).toHaveLength(1);
  expect(callsTo(top, "justify_between")).toHaveLength(1);
  expect(callsTo(top, "gap")[0].args).toEqual([tokens.space(14)]);
  // The trailing inset is the kit's own; the leading one yields to whatever
  // the host draws over that edge, which is nothing on a desktop without
  // client-side decorations.
  expect(callsTo(top, "pr")[0].args).toEqual([tokens.space(14)]);
  expect(callsTo(top, "pl")[0].args).toEqual([tokens.space(14)]);
  expect(callsTo(top, "border_b")[0].args).toEqual([
    tokens.spacing.hairline,
  ]);
  expect(callsTo(top, "border_color")[0].args).toEqual(["#777777ff"]);
  expect(callsTo(top, "bg")[0].args).toEqual(["#101010ff"]);

  const bottom = new StatusBar().build(cx);
  expect(callsTo(bottom, "h")[0].args).toEqual([tokens.space(28)]);
  expect(callsTo(bottom, "flex_none")).toHaveLength(1);
  expect(callsTo(bottom, "items_center")).toHaveLength(1);
  expect(callsTo(bottom, "justify_between")).toHaveLength(1);
  expect(callsTo(bottom, "gap")[0].args).toEqual([
    tokens.spacing.controlGap,
  ]);
  expect(callsTo(bottom, "pl")[0].args).toEqual([tokens.space(14)]);
  expect(callsTo(new StatusBar().leadsWithIcon().build(cx), "pl")[0].args).toEqual([
    tokens.space(8),
  ]);
  expect(callsTo(bottom, "pr")[0].args).toEqual([tokens.space(12)]);
  expect(callsTo(bottom, "border_t")[0].args).toEqual([
    tokens.spacing.hairline,
  ]);
  expect(callsTo(bottom, "border_color")[0].args).toEqual(["#777777ff"]);
  expect(callsTo(bottom, "bg")[0].args).toEqual(["#101010ff"]);

  const action = new ActionBar("action").build(cx);
  expect(callsTo(action, "role")[0].args).toEqual(["toolbar"]);
  expect(callsTo(action, "flex_none")).toHaveLength(1);
  expect(callsTo(action, "items_center")).toHaveLength(1);
  expect(callsTo(action, "gap")[0].args).toEqual([
    tokens.spacing.controlGap,
  ]);
  expect(callsTo(action, "px")[0].args).toEqual([
    tokens.spacing.panelPadding,
  ]);
  expect(callsTo(action, "py")[0].args).toEqual([tokens.spacing.sm]);
  expect(callsTo(action, "border_t")[0].args).toEqual([
    tokens.spacing.hairline,
  ]);
  expect(callsTo(action, "border_color")[0].args).toEqual(["#777777ff"]);

  const header = new PanelHeader("panel").heading(element("heading")).build(cx);
  expect(callsTo(header, "role")[0].args).toEqual(["section_header"]);
  expect(callsTo(header, "flex_none")).toHaveLength(1);
  expect(callsTo(header, "items_center")).toHaveLength(1);
  expect(callsTo(header, "justify_between")).toHaveLength(1);
  expect(callsTo(header, "gap")[0].args).toEqual([
    tokens.spacing.controlGap,
  ]);
  expect(callsTo(header, "h")[0].args).toEqual([tokens.space(34)]);
  expect(callsTo(header, "px")[0].args).toEqual([
    tokens.spacing.rowPaddingX,
  ]);
  expect(callsTo(header, "border_b")[0].args).toEqual([
    tokens.spacing.hairline,
  ]);
  expect(callsTo(header, "border_color")[0].args).toEqual(["#777777ff"]);
});

test("workspace and surface classes preserve resolved layout and styling", () => {
  const tokens = style();
  const workspace = new CenteredWorkspace("workspace").content(element("content")).build(cx);
  expect(callsTo(workspace, "items_start")).toHaveLength(1);
  expect(callsTo(workspace, "size_full")).toHaveLength(1);
  expect(callsTo(workspace, "min_w_0")).toHaveLength(1);
  expect(callsTo(workspace, "min_h_0")).toHaveLength(1);
  expect(callsTo(workspace, "justify_center")).toHaveLength(1);
  expect(callsTo(workspace, "overflow_y_scroll")).toHaveLength(1);

  const page = new PageColumn("page").build(cx);
  expect(callsTo(page, "w_full")).toHaveLength(1);
  expect(callsTo(page, "max_w")[0].args).toEqual([tokens.space(560)]);
  expect(callsTo(new PageColumn("wide").maxWidth(720).build(cx), "max_w")[0].args).toEqual([
    720,
  ]);
  expect(callsTo(page, "gap")[0].args).toEqual([
    tokens.spacing.panelGap,
  ]);
  expect(callsTo(page, "p")[0].args).toEqual([
    tokens.spacing.panelPadding,
  ]);

  const surface = new Surface().build(cx);
  expect(callsTo(surface, "min_w_0")).toHaveLength(1);
  expect(callsTo(surface, "min_h_0")).toHaveLength(1);
  expect(callsTo(surface, "bg")[0].args).toEqual(["#181818ff"]);
  expect(callsTo(surface, "border")[0].args).toEqual([
    tokens.spacing.hairline,
  ]);
  expect(callsTo(surface, "border_color")[0].args).toEqual(["#777777ff"]);
  expect(callsTo(surface, "rounded")[0].args).toEqual([tokens.cornerRadius]);
  expect(callsTo(surface, "overflow_hidden")).toHaveLength(1);

  const popup = new PopupSurface("popup").build(cx);
  expect(callsTo(popup, "flex_none")).toHaveLength(1);
  expect(callsTo(popup, "p")[0].args).toEqual([tokens.space(4)]);
  expect(callsTo(popup, "gap")[0].args).toEqual([tokens.space(2)]);
  expect(callsTo(popup, "rounded")[0].args).toEqual([tokens.cornerRadius]);
  // A popup is a raised surface, not the window's ground.
  expect(callsTo(popup, "bg")[0].args).toEqual([
    resolveSurfaceColor(
      tokens,
      tokens.surfaces.popupBackground,
      theme.colors.surface,
      tokens.surfaces.popupBackgroundAlpha,
    ),
  ]);
  expect(callsTo(popup, "border")[0].args).toEqual([
    tokens.state.normalBorderWidth,
  ]);
  // With no `popups.border` named, a resting menu takes the ordinary border
  // rather than the focus ring.
  expect(callsTo(popup, "border_color")[0].args).toEqual([
    resolveSurfaceColor(
      tokens,
      tokens.surfaces.popupBorder,
      theme.colors.border,
      tokens.surfaces.popupBorderAlpha,
    ),
  ]);
  expect(callsTo(popup, "text_color")[0].args).toEqual([
    resolveSurfaceColor(
      tokens,
      tokens.surfaces.popupText,
      theme.colors.foreground,
    ),
  ]);
});

test("a title bar yields its leading edge to the host's own window buttons", () => {
  const cx = { theme: () => theme };
  const brand = () => element("brand");

  applyOmarchyStyle("", { platform: "darwin" });
  const mac = new TitleBar().brand(brand()).build(cx);
  const reserved = style().spacing.windowControlsInset;
  expect(callsTo(mac, "pl")[0].args).toEqual([reserved]);
  // Only the leading edge moves: the trailing one is the kit's own inset, and
  // nothing is drawn over it.
  expect(callsTo(mac, "pr")[0].args).toEqual([style().space(14)]);

  applyOmarchyStyle("", { platform: "linux" });
  const hyprland = new TitleBar().brand(brand()).build(cx);
  expect(callsTo(hyprland, "pl")[0].args).toEqual([style().space(14)]);

  // `max`, not a replacement: a spacing scale wide enough to exceed what the
  // host reserves keeps its own inset.
  applyOmarchyStyle(`[spacing]\nscale = 12\n`, { platform: "darwin" });
  const wide = new TitleBar().brand(brand()).build(cx);
  expect(style().space(14)).toBeGreaterThan(reserved);
  expect(callsTo(wide, "pl")[0].args).toEqual([style().space(14)]);

  applyOmarchyStyle("");
});
