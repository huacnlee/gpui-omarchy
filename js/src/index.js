// @ts-check

// The one type an application has to be able to name: `style()` answers it,
// `resolveSurfaceColor` takes it, and a view that holds the tokens between
// renders needs a word for what it is holding. The rest of the library's
// typedefs describe arguments the builders take as plain strings and validate
// at run time, so an application never spells them.
/** @typedef {import("./style.js").OmarchyStyle} OmarchyStyle */

export {
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
} from "./style.js";
export {
  applyOmarchyRoles,
  omarchyBaseColors,
  omarchyRoles,
  omarchyStatusColors,
  omarchyTheme,
  role,
  roles,
} from "./theme.js";
export * from "./native.js";
export * as composition from "./composition.js";
