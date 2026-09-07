// @ts-check

import { describe, expect, test } from "bun:test";
import { omarchyStyle } from "../src/style.js";
import {
  applyOmarchyRoles,
  omarchyBaseColors,
  omarchyRoles,
  omarchyStatusColors,
  omarchyTheme,
  role,
  roles,
} from "../src/theme.js";

const palette = `background = "#101010"\nforeground = "#eeeeee"\naccent = "#3366ff"\nred = "#ff3366"\ngreen = "#22cc88"\nyellow = "#ffcc00"\nblue = "#3366ff"\nmagenta = "#bb55dd"\ncyan = "#22ccdd"\nlighter_background = "#202020"\nmode = "light"`;

const samplePalette = `
mode = "light"
background = "#f8f7f2"
foreground = "#242424"
accent = "#3465a4"
selection = "#d9e4f2"
lighter_background = "#ffffff"
dark_foreground = "#666666"
light_foreground = "#eeeeee"
bright_foreground = "#ffffff"
red = "#a40000"
green = "#4e9a06"
yellow = "#c4a000"
blue = "#3465a4"
magenta = "#75507b"
cyan = "#06989a"
`;

const fallback = {
  appearance: "dark",
  colors: {
    unexpected: "#abcdef",
    background: "fallback-background",
    foreground: "fallback-foreground",
    destructive: "fallback-destructive",
  },
  spacing: { md: 12 },
  radius: { md: 8 },
};

describe("theme", () => {
  test("selects base and status colors from the palette", () => {
    expect(omarchyBaseColors(palette)).toEqual([
      "#ff3366",
      "#22cc88",
      "#ffcc00",
      "#3366ff",
      "#bb55dd",
      "#22ccdd",
    ]);
    expect(omarchyStatusColors(palette)).toEqual({ danger: "#ff3366", success: "#22cc88", warning: "#ffcc00", info: "#22ccdd" });
  });

  test("derives Omarchy roles and rejects incomplete palettes", () => {
    const derived = omarchyRoles(palette);
    expect(derived).toMatchObject({ background: "#101010", foreground: "#eeeeee", accent: "#3366ff", danger: "#ff3366", separator: "#2b2b2bff" });
    expect(omarchyRoles('background = "#000000"')).toBeNull();
  });

  test("projects a complete Omarchy semantic theme", () => {
    const theme = omarchyTheme(samplePalette, fallback, omarchyStyle("", { cornerRadius: 6 }));

    expect(theme).toEqual({
      appearance: "light",
      tokens: {
        spacing: { xxs: 2, xs: 3, sm: 4, md: 6, lg: 8, xl: 10, xxl: 12 },
        radius: { none: 0, sm: 6, md: 6, lg: 6, xl: 6, full: 9999 },
        colors: {
          unexpected: "#abcdef",
          background: "#f8f7f2",
          foreground: "#242424",
          surface: "#f8f7f2",
          surface_foreground: "#242424",
          primary: "#3465a4",
          primary_foreground: "#ffffff",
          secondary: "#ffffff",
          secondary_foreground: "#eeeeee",
          muted: "#e7e6e2ff",
          muted_foreground: "#686866ff",
          accent: "#d5dde4ff",
          accent_foreground: "#242424",
          destructive: "#a40000",
          destructive_foreground: "#ffffff",
          border: "#a3a3a0ff",
          input: "#a3a3a0ff",
          ring: "#3465a4",
          selection: "#d9e4f2",
        },
      },
    });
  });

  test("preserves fallback roles and gives every projected color an opaque alpha", () => {
    const theme = omarchyTheme(samplePalette, fallback, omarchyStyle("", { cornerRadius: 6 }));

    expect(theme.tokens.colors.unexpected).toBe("#abcdef");
    // `link` and `popover` are roles gpui's token set has no name for, so they
    // stay out of the theme and are read from `role()` instead. `selection` is
    // a name it does have, and one it requires.
    expect(theme.tokens.colors.link).toBeUndefined();
    expect(theme.tokens.colors.popover).toBeUndefined();
    expect(theme.tokens.colors.selection).toBe("#d9e4f2");
    for (const value of Object.values(theme.tokens.colors)) {
      if (typeof value === "string" && value.startsWith("#")) {
        expect(value.length === 9 ? value.slice(-2) : "ff").toBe("ff");
      }
    }
  });

  test("projects complete semantic theme tokens", () => {
    const fallback = { colors: { unexpected: "#abcdef" } };
    const theme = omarchyTheme(palette, fallback, omarchyStyle("", { cornerRadius: 2 }));
    expect(theme).toMatchObject({
      appearance: "light",
      tokens: {
        radius: { sm: 2, full: 9999 },
        colors: { unexpected: "#abcdef", background: "#101010", surface: "#101010", primary: "#3366ff", border: "#696969ff" },
      },
    });
  });

  test("stores and resolves the live derived roles", () => {
    expect(applyOmarchyRoles(palette)).toBe(roles());
    expect(role("link", "#000000ff")).toBe("#617dd1ff");
    applyOmarchyRoles("");
    expect(role("link", "#000000ff")).toBe("#000000ff");
  });

  test("keeps derived roles beside the semantic theme and honors radius variants", () => {
    const derived = omarchyRoles(samplePalette);
    const theme = omarchyTheme(samplePalette, fallback, omarchyStyle("", { cornerRadius: 6 }));

    expect(omarchyBaseColors(samplePalette)).toEqual([
      "#a40000",
      "#4e9a06",
      "#c4a000",
      "#3465a4",
      "#75507b",
      "#06989a",
    ]);
    expect(omarchyStatusColors(samplePalette)).toEqual({
      danger: "#a40000",
      success: "#4e9a06",
      warning: "#c4a000",
      info: "#06989a",
    });
    expect(derived.link).not.toBe(derived.accent);
    expect(derived.dim).toBe("#686866ff");
    expect(derived.separator).toBe("#dfded9ff");
    expect(derived.separator).not.toBe(theme.tokens.colors.border);
    expect(theme.tokens.radius).toEqual({ none: 0, sm: 6, md: 6, lg: 6, xl: 6, full: 9999 });
    expect(omarchyTheme(samplePalette, fallback, omarchyStyle("")).tokens.radius.sm).toBe(0);
    expect(role("link", "#000000")).toBe("#000000");
    applyOmarchyRoles(samplePalette);
    expect(role("link", "#000000")).toBe(derived.link);
    expect(role("dim", "#000000")).toBe(derived.dim);
    expect(role("separator", "#000000")).toBe(derived.separator);
    expect(omarchyTheme("red = '#a40000'", fallback, omarchyStyle(""))).toBeNull();
    applyOmarchyRoles("");
  });
});
