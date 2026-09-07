export type OmarchyStyle = import("./style.js").OmarchyStyle;
/** @typedef {import("./style.js").OmarchyStyle} OmarchyStyle */
export { alpha, applyOmarchyStyle, capSaturation, formatColor, mix, omarchyStyle, parseColor, parseHyprlandColor, parseShellToml, resolveSurfaceColor, style, } from "./style.js";
export { applyOmarchyRoles, omarchyBaseColors, omarchyRoles, omarchyStatusColors, omarchyTheme, role, roles, } from "./theme.js";
export * from "./native.js";
export * as composition from "./composition.js";
