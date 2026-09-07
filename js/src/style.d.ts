/**
 * `section.key` → raw string, matching the dict `Style.applyShellValues`
 * consumes. Comments and quotes are stripped; sections without a header are
 * ignored, because every key in shell.toml lives under one.
 * @param {string} source
 * @returns {Record<string, string>}
 */
export declare function parseShellToml(source: string): Record<string, string>;
/**
 * `#rgb`, `#rrggbb` and `#rrggbbaa` in; `{r,g,b,a}` in 0..1 out. Returns null
 * for anything else so callers can fall back rather than paint transparent
 * black.
 * @param {string} value
 */
export declare function parseColor(value: string): {
    r: number;
    g: number;
    b: number;
    a: number;
};
/** @param {{r:number,g:number,b:number,a:number}} color @returns {import("gpui").Color} */
export declare function formatColor(color: {
    r: number;
    g: number;
    b: number;
    a: number;
}): import("gpui").Color;
/**
 * The shell's `Util.alpha`: the same color at a new opacity. Every control
 * fill and border in Omarchy is a foreground or accent at an alpha rather than
 * a literal gray, which is what keeps a light theme from getting a dark
 * "muted" and a dark theme a light one.
 * @param {import("gpui").Color|string} color @param {number} value
 * @returns {import("gpui").Color}
 */
export declare function alpha(color: import("gpui").Color | string, value: number): import("gpui").Color;
/**
 * Mix `color` toward `toward` by `amount`. Secondary text mixes the
 * foreground toward the *background* — on a light theme, darkening an
 * almost-black foreground makes "secondary" text heavier than body text,
 * which is the opposite of what it means.
 * @param {import("gpui").Color|string} color
 * @param {import("gpui").Color|string} toward
 * @param {number} amount
 * @returns {import("gpui").Color}
 */
export declare function mix(color: import("gpui").Color | string, toward: import("gpui").Color | string, amount: number): import("gpui").Color;
/**
 * The same hue and lightness at a capped saturation. Omarchy's palette has no
 * separate "primary": `accent` is it, and an accent near full saturation is
 * right for a compact status indicator and wrong for a link inside a paragraph.
 * @param {import("gpui").Color|string} color @param {number} maximum
 * @returns {import("gpui").Color}
 */
export declare function capSaturation(color: import("gpui").Color | string, maximum: number): import("gpui").Color;
declare const DEFAULT_SPACING: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    huge: number;
    controlGap: number;
    controlPaddingX: number;
    controlPaddingY: number;
    inputPaddingY: number;
    controlHeight: number;
    popupRowHeight: number;
    dropdownWidth: number;
    searchableDropdownWidth: number;
    numberFieldWidth: number;
    searchablePopupMinHeight: number;
    rowGap: number;
    rowPaddingX: number;
    labelGap: number;
    panelGap: number;
    panelPadding: number;
    popupPadding: number;
};
declare const FONT_SCALE: {
    caption: number;
    bodySmall: number;
    body: number;
    subtitle: number;
    title: number;
    heading: number;
    display: number;
    displayLarge: number;
};
/**
 * Build the token set from the shell's own two sources.
 * @param {string} shellSource contents of `theme/shell.toml`
 * @param {{ cornerRadius?: number, fontFamily?: string, platform?: string }} [host]
 */
export declare function omarchyStyle(shellSource: string, host?: {
    cornerRadius?: number;
    fontFamily?: string;
    platform?: string;
}): {
    cornerRadius: number;
    fontFamily: string;
    spacingScale: number;
    space: (px: number) => number;
    spaceReal: (px: number) => number;
    spacing: typeof DEFAULT_SPACING & {
        hairline: number;
        windowControlsInset: number;
    };
    font: Record<keyof typeof FONT_SCALE | "baseSize" | "icon" | "iconSmall" | "iconLarge" | "advance", number>;
    state: {
        normalBorderWidth: number;
        hoverBorderWidth: number;
        selectedBorderWidth: number;
        focusBorderWidth: number;
        normalFillAlpha: number;
        hoverFillAlpha: number;
        selectedFillAlpha: number;
        pressedFillAlpha: number;
        focusFillAlpha: number;
        selectionFillAlpha: number;
        normalBorderAlpha: number;
        hoverBorderAlpha: number;
        selectedBorderAlpha: number;
        focusBorderAlpha: number;
    };
    surfaces: {
        popupBackground: string;
        popupBackgroundAlpha: number;
        popupBorder: string;
        popupBorderAlpha: number;
        popupText: string;
        tooltipBackground: string;
        tooltipBackgroundAlpha: number;
        tooltipBorder: string;
        tooltipBorderAlpha: number;
        tooltipText: string;
        hyprlandActiveBorder: string;
        hyprlandActiveBorderForeground: string;
    };
};
export type OmarchyStyle = ReturnType<typeof omarchyStyle>;
/** The live token set. Views read this the way QML read the `Style` singleton. */
export declare function style(): {
    cornerRadius: number;
    fontFamily: string;
    spacingScale: number;
    space: (px: number) => number;
    spaceReal: (px: number) => number;
    spacing: typeof DEFAULT_SPACING & {
        hairline: number;
        windowControlsInset: number;
    };
    font: Record<keyof typeof FONT_SCALE | "baseSize" | "icon" | "iconSmall" | "iconLarge" | "advance", number>;
    state: {
        normalBorderWidth: number;
        hoverBorderWidth: number;
        selectedBorderWidth: number;
        focusBorderWidth: number;
        normalFillAlpha: number;
        hoverFillAlpha: number;
        selectedFillAlpha: number;
        pressedFillAlpha: number;
        focusFillAlpha: number;
        selectionFillAlpha: number;
        normalBorderAlpha: number;
        hoverBorderAlpha: number;
        selectedBorderAlpha: number;
        focusBorderAlpha: number;
    };
    surfaces: {
        popupBackground: string;
        popupBackgroundAlpha: number;
        popupBorder: string;
        popupBorderAlpha: number;
        popupText: string;
        tooltipBackground: string;
        tooltipBackgroundAlpha: number;
        tooltipBorder: string;
        tooltipBorderAlpha: number;
        tooltipText: string;
        hyprlandActiveBorder: string;
        hyprlandActiveBorderForeground: string;
    };
};
/**
 * Replace the live tokens. Called once at startup with the host's sources, and
 * again if the theme changes underneath a running window.
 * @param {string} shellSource
 * @param {{cornerRadius?:number,fontFamily?:string,platform?:string}} [host]
 */
export declare function applyOmarchyStyle(shellSource: string, host?: {
    cornerRadius?: number;
    fontFamily?: string;
    platform?: string;
}): {
    cornerRadius: number;
    fontFamily: string;
    spacingScale: number;
    space: (px: number) => number;
    spaceReal: (px: number) => number;
    spacing: typeof DEFAULT_SPACING & {
        hairline: number;
        windowControlsInset: number;
    };
    font: Record<keyof typeof FONT_SCALE | "baseSize" | "icon" | "iconSmall" | "iconLarge" | "advance", number>;
    state: {
        normalBorderWidth: number;
        hoverBorderWidth: number;
        selectedBorderWidth: number;
        focusBorderWidth: number;
        normalFillAlpha: number;
        hoverFillAlpha: number;
        selectedFillAlpha: number;
        pressedFillAlpha: number;
        focusFillAlpha: number;
        selectionFillAlpha: number;
        normalBorderAlpha: number;
        hoverBorderAlpha: number;
        selectedBorderAlpha: number;
        focusBorderAlpha: number;
    };
    surfaces: {
        popupBackground: string;
        popupBackgroundAlpha: number;
        popupBorder: string;
        popupBorderAlpha: number;
        popupText: string;
        tooltipBackground: string;
        tooltipBackgroundAlpha: number;
        tooltipBorder: string;
        tooltipBorderAlpha: number;
        tooltipText: string;
        hyprlandActiveBorder: string;
        hyprlandActiveBorderForeground: string;
    };
};
/**
 * Hyprland's own colour syntax, as `shell.toml` writes it, in hex.
 *
 * A window border in Hyprland may be a **gradient** — two or more colours and
 * an angle — and the shell's surface sections reference it verbatim so a menu's
 * edge matches the frame the compositor draws. gpui paints one colour, so the
 * first stop is taken and the angle dropped: the alternative is refusing to
 * draw the card at all, which is what happens if the string is passed through.
 *
 * The colours themselves are `rgba(RRGGBBAA)` / `rgb(RRGGBB)` — Hyprland's own
 * spelling, with the hex digits inside the parentheses rather than the CSS
 * comma-separated form — or `0xAARRGGBB`, or a plain `#` literal.
 * @param {string} value
 * @returns {import("gpui").Color|null}
 */
export declare function parseHyprlandColor(value: string): import("gpui").Color | null;
/**
 * Resolve a `section.key` reference like `"hyprland.active-border"` to the
 * color it points at, leaving a literal color alone.
 * @param {OmarchyStyle} tokens @param {string} value
 * @param {import("gpui").Color} fallback
 * @param {number} [opacity] the section's `*-alpha` companion
 * @returns {import("gpui").Color}
 */
export declare function resolveSurfaceColor(tokens: OmarchyStyle, value: string, fallback: import("gpui").Color, opacity?: number): import("gpui").Color;
export {};
