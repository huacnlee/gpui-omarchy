// @ts-check

import { afterEach, describe, expect, test } from "bun:test";
import {
  alpha,
  applyOmarchyStyle,
  capSaturation,
  formatColor,
  mix,
  omarchyStyle,
  parseColor,
  parseHyprlandColor,
  parseShellToml,
  resolveSurfaceColor,
  style,
} from "../src/style.js";
import { applyOmarchyRoles } from "../src/theme.js";

const shell = `
# Omarchy shell surfaces.
[hyprland]
active-border = "#355f01"
active-border-foreground = "#141414"
[controls]
normal-fill-alpha = 0.04
normal-border-width = 1
selected-fill-alpha = 0.18
selected-border-width = 0
[spacing]
scale = 1.0
scale-with-font = true
# md = 6
[font]
base-size = 12
# heading = 16
[popups]
border = "hyprland.active-border"
`;

afterEach(() => {
  applyOmarchyRoles("");
  applyOmarchyStyle("");
});

describe("Bun harness", () => {
  test("maps gpui and gpui-base imports to the local recording stub", async () => {
    const [gpui, gpuiBase] = await Promise.all([import("gpui"), import("gpui-base")]);
    gpui.reset();
    gpui.record("div", "child");
    expect(gpui.calls).toEqual([{ name: "div", args: ["child"] }]);
    expect(gpuiBase.calls).toBe(gpui.calls);
  });
});

describe("style", () => {
  test("matches Omarchy's default structural tokens and control state", () => {
    const tokens = omarchyStyle(shell, {
      cornerRadius: 0,
      fontFamily: "JetBrainsMono Nerd Font",
    });

    expect(parseShellToml(shell)["controls.normal-fill-alpha"]).toBe("0.04");
    expect(parseShellToml(shell)["popups.border"]).toBe("hyprland.active-border");
    expect(parseShellToml(shell)["spacing.md"]).toBeUndefined();
    expect(parseShellToml("stray = 1")["stray"]).toBeUndefined();
    expect({
      xxs: tokens.spacing.xxs,
      xs: tokens.spacing.xs,
      sm: tokens.spacing.sm,
      md: tokens.spacing.md,
      lg: tokens.spacing.lg,
      xl: tokens.spacing.xl,
      xxl: tokens.spacing.xxl,
    }).toEqual({ xxs: 2, xs: 3, sm: 4, md: 6, lg: 8, xl: 10, xxl: 12 });
    expect(tokens.spacing.controlHeight).toBe(28);
    expect(tokens.spacing.rowPaddingX).toBe(12);
    expect(tokens.spacing.panelPadding).toBe(18);
    expect(tokens.spacing.hairline).toBe(1);
    expect(tokens.font).toMatchObject({
      body: 12,
      caption: 10,
      bodySmall: 11,
      title: 14,
      heading: 16,
      icon: 14,
    });
    expect(tokens.fontFamily).toBe("JetBrainsMono Nerd Font");
    expect(tokens.cornerRadius).toBe(0);
    expect(tokens.space(14)).toBe(14);
    expect(tokens.space(0)).toBe(0);
    expect(tokens.state).toMatchObject({
      normalBorderWidth: 1,
      normalFillAlpha: 0.04,
      selectedFillAlpha: 0.18,
      selectedBorderWidth: 0,
    });
    expect(tokens.surfaces).toMatchObject({
      popupBorder: "hyprland.active-border",
      hyprlandActiveBorder: "#355f01",
      hyprlandActiveBorderForeground: "#141414",
    });
  });

  test("scales shell values unless the theme pins the spacing scale", () => {
    const large = omarchyStyle(shell.replace("base-size = 12", "base-size = 18"));
    const pinned = omarchyStyle(
      shell
        .replace("base-size = 12", "base-size = 18")
        .replace("scale-with-font = true", "scale-with-font = false"),
    );
    const pinnedToken = omarchyStyle(shell.replace("# md = 6", "md = 9"));

    expect(large.font.body).toBe(18);
    expect(large.space(14)).toBe(21);
    expect(pinned.font.body).toBe(18);
    expect(pinned.space(14)).toBe(14);
    expect(pinnedToken.spacing.md).toBe(9);
    expect(pinnedToken.spacing.lg).toBe(8);
  });

  test("parses shell sections, quoted values, and comments", () => {
    expect(parseShellToml(`ignored = "value"\n[font]\nbase-size = "15" # comment\n[spacing]\nscale = 1.5`)).toEqual({
      "font.base-size": "15",
      "spacing.scale": "1.5",
    });
  });

  test("parses, formats, combines, and caps colors", () => {
    expect(parseColor("#abc")).toEqual({ r: 170 / 255, g: 187 / 255, b: 204 / 255, a: 1 });
    expect(parseColor("invalid")).toBeNull();
    expect(formatColor({ r: 1, g: 0.5, b: 0, a: 0.25 })).toBe("#ff800040");
    expect(alpha("#123456", 0.5)).toBe("#12345680");
    expect(mix("#000000", "#ffffff", 0.25)).toBe("#404040ff");
    expect(capSaturation("#ff0000", 0.5)).toBe("#bf4040ff");
    expect(alpha("#feffff", 0.08)).toBe("#feffff14");
    expect(alpha("#fff", 1)).toBe("#ffffffff");
    expect(alpha("not-a-colour", 0.5)).toBe("not-a-colour");
    expect(parseColor("#040404")).toEqual({ r: 4 / 255, g: 4 / 255, b: 4 / 255, a: 1 });
    expect(parseColor("#12345")).toBeNull();
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080ff");
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000ff");
    expect(capSaturation("#5da602", 0.55)).not.toBe("#5da602");
    expect(capSaturation("#808080", 0.55)).toBe("#808080ff");
  });

  test("derives shell tokens and replaces the active style", () => {
    const source = `[font]\nbase-size = 15\n[spacing]\nscale = 1.2\nscale-with-font = true\nmd = 9\n[controls]\nhover-cursor-fill-alpha = 2\n[popups]\nbackground = "hyprland.active-border"\nbackground-alpha = 0.4\n[hyprland]\nactive-border = "rgb(336699)"`;
    const tokens = omarchyStyle(source, { cornerRadius: 3, fontFamily: "Iosevka" });

    expect(tokens.spacingScale).toBe(1.5);
    expect(tokens.spacing.md).toBe(9);
    expect(tokens.font.title).toBe(18);
    expect(tokens.cornerRadius).toBe(3);
    expect(tokens.state.hoverFillAlpha).toBe(1);
    expect(tokens.surfaces.popupBackground).toBe("hyprland.active-border");
    expect(applyOmarchyStyle(source, { cornerRadius: 3 })).toBe(style());
    expect(omarchyStyle("[controls]\nnormal-fill-alpha = 4").state.normalFillAlpha).toBe(1);
  });

  test("parses Hyprland packed, CSS, and invalid colors", () => {
    expect(parseHyprlandColor("rgba(11223380) 45deg rgb(ffffff)")).toBe("#11223380");
    expect(parseHyprlandColor("rgba(6f1828e6) rgba(9c2331e6) 45deg")).toBe("#6f1828e6");
    expect(parseHyprlandColor("rgba(6f1828e6)")).toBe("#6f1828e6");
    expect(parseHyprlandColor("rgb(355f01)")).toBe("#355f01");
    expect(parseHyprlandColor("#355f01")).toBe("#355f01");
    expect(parseHyprlandColor("rgba(255, 0, 0, 0.5)")).toBe("#ff000080");
    expect(parseHyprlandColor("0x80112233")).toBe("#11223380");
    expect(parseHyprlandColor("")).toBeNull();
    expect(parseHyprlandColor("45deg")).toBeNull();
    expect(parseHyprlandColor("not-a-colour")).toBeNull();
  });

  test("resolves configured surfaces and their alpha companions", () => {
    const tokens = omarchyStyle(shell);
    const gradient = omarchyStyle(`
[hyprland]
active-border = "rgba(6f1828e6) rgba(9c2331e6) 45deg"
[popups]
background = "#0a0708"
background-alpha = 0.9
border = "hyprland.active-border"
border-alpha = 1.0
`);

    expect(resolveSurfaceColor(tokens, tokens.surfaces.popupBorder, "#000000")).toBe("#355f01");
    expect(resolveSurfaceColor(tokens, "#123456", "#000000")).toBe("#123456");
    expect(resolveSurfaceColor(tokens, "", "#000000")).toBe("#000000");
    expect(
      resolveSurfaceColor(
        gradient,
        gradient.surfaces.popupBorder,
        "#000000",
        gradient.surfaces.popupBorderAlpha,
      ),
    ).toBe("#6f1828ff");
    expect(
      resolveSurfaceColor(
        gradient,
        gradient.surfaces.popupBackground,
        "#000000",
        gradient.surfaces.popupBackgroundAlpha,
      ),
    ).toBe("#0a0708e6");
    expect(resolveSurfaceColor(gradient, "45deg", "#123456")).toBe("#123456");

    const bare = omarchyStyle("");
    expect(bare.spacing.md).toBe(6);
    expect(bare.font.body).toBe(12);
    expect(bare.fontFamily).toBe("monospace");
    expect(applyOmarchyStyle(shell, { cornerRadius: 7, fontFamily: "Iosevka" })).toBe(style());
    expect(style().cornerRadius).toBe(7);
    expect(style().fontFamily).toBe("Iosevka");
  });
});

describe("window controls", () => {
  afterEach(() => applyOmarchyStyle(""));

  test("a leading inset is reserved only where the host draws its own buttons", () => {
    // macOS puts close, minimise and zoom inside the window, so a title row
    // that started at its own inset would start underneath them.
    //
    // Under both its names: `gpui-shell` reports the platform the way Rust
    // does, so an application on the shell this kit is built for says `macos`,
    // and `darwin` is Node's name for the same system. Recognising one and not
    // the other fails silently -- the inset goes to zero and the buttons land
    // on the title bar's leading content.
    for (const platform of ["macos", "darwin"]) {
      expect(
        omarchyStyle("", { platform }).spacing.windowControlsInset,
      ).toBeGreaterThan(0);
    }

    // Omarchy's own desktop has no client-side decorations, and a host that
    // did not say is treated as one that draws nothing.
    for (const platform of ["linux", "win32", undefined]) {
      expect(omarchyStyle("", { platform }).spacing.windowControlsInset).toBe(0);
    }
  });

  test("the inset does not move with the spacing scale", () => {
    // Every other measurement here scales; this one is the system's, and the
    // buttons stay where the system draws them however large the interface is.
    const scaled = omarchyStyle(`[spacing]\nscale = 2\n`, { platform: "darwin" });
    const plain = omarchyStyle("", { platform: "darwin" });
    expect(scaled.spacing.windowControlsInset).toBe(plain.spacing.windowControlsInset);
    expect(scaled.space(14)).toBeGreaterThan(plain.space(14));
  });
});
