/** @param {string} source */
export declare function omarchyBaseColors(source: string): import("gpui").Color[];
/** @param {string} source */
export declare function omarchyStatusColors(source: string): {
    danger: import("gpui").Color;
    success: import("gpui").Color;
    warning: import("gpui").Color;
    info: import("gpui").Color;
};
/**
 * The four foundational roles plus the ones the app derives from them.
 *
 * Omarchy's palette is deliberately small — background, foreground, accent and
 * urgent — and every other tone in the window is a mix or an alpha of those,
 * which is what lets a theme change propagate without a second palette to keep
 * in sync. These are the same derivations `App.qml` declared at the top of the
 * window and passed down as required properties.
 * @param {string} source
 */
export declare function omarchyRoles(source: string): {
    background: import("gpui").Color;
    foreground: import("gpui").Color;
    accent: import("gpui").Color;
    urgent: import("gpui").Color;
    danger: import("gpui").Color;
    dim: import("gpui").Color;
    dimmer: import("gpui").Color;
    link: import("gpui").Color;
    separator: import("gpui").Color;
    selection: import("gpui").Color;
    lighterBackground: import("gpui").Color;
    darkBackground: import("gpui").Color;
    lightForeground: import("gpui").Color;
    brightForeground: import("gpui").Color;
    mutedForeground: import("gpui").Color;
};
/**
 * Project Omarchy colors into a complete gpui-base semantic theme snapshot.
 *
 * Spacing and radius come from the shell's structural tokens rather than from
 * gpui's own scale: Omarchy is a 12px monospace desktop whose corners follow
 * Hyprland's `decoration:rounding`, and an application window that rounds its own
 * corners or pads at gpui's default rhythm reads as a foreign application on
 * that desktop. `fallback` still supplies any color role Omarchy has no
 * opinion about.
 * @param {string} source
 * @param {any} fallback
 * @param {import("./style.js").OmarchyStyle} [tokens]
 * @returns {{appearance:"light"|"dark",tokens:{colors:any,spacing:any,radius:any}}|null}
 */
export declare function omarchyTheme(source: string, fallback: any, tokens?: import("./style.js").OmarchyStyle): {
    appearance: "light" | "dark";
    tokens: {
        colors: any;
        spacing: any;
        radius: any;
    };
} | null;
/** The derived palette roles. Null until the host has read a theme. */
export declare function roles(): {
    background: import("gpui").Color;
    foreground: import("gpui").Color;
    accent: import("gpui").Color;
    urgent: import("gpui").Color;
    danger: import("gpui").Color;
    dim: import("gpui").Color;
    dimmer: import("gpui").Color;
    link: import("gpui").Color;
    separator: import("gpui").Color;
    selection: import("gpui").Color;
    lighterBackground: import("gpui").Color;
    darkBackground: import("gpui").Color;
    lightForeground: import("gpui").Color;
    brightForeground: import("gpui").Color;
    mutedForeground: import("gpui").Color;
};
/**
 * Resolve one derived role, falling back to a theme token when no Omarchy
 * palette has been read — a test, or a desktop that is not Omarchy.
 * @param {"dim"|"dimmer"|"link"|"urgent"|"danger"|"accent"|"selection"|"separator"} name
 * @param {import("gpui").Color} fallback
 * @returns {import("gpui").Color}
 */
export declare function role(name: "dim" | "dimmer" | "link" | "urgent" | "danger" | "accent" | "selection" | "separator", fallback: import("gpui").Color): import("gpui").Color;
/** @param {string} source */
export declare function applyOmarchyRoles(source: string): {
    background: import("gpui").Color;
    foreground: import("gpui").Color;
    accent: import("gpui").Color;
    urgent: import("gpui").Color;
    danger: import("gpui").Color;
    dim: import("gpui").Color;
    dimmer: import("gpui").Color;
    link: import("gpui").Color;
    separator: import("gpui").Color;
    selection: import("gpui").Color;
    lighterBackground: import("gpui").Color;
    darkBackground: import("gpui").Color;
    lightForeground: import("gpui").Color;
    brightForeground: import("gpui").Color;
    mutedForeground: import("gpui").Color;
};
