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
export { Label, MutedText, SectionLabel, Title } from "./text.js";
export {
  ActionBar,
  AppShell,
  CenteredWorkspace,
  PageColumn,
  Panel,
  PanelHeader,
  PopupSurface,
  StatusBar,
  Surface,
  TitleBar,
  Toolbar,
} from "./layout.js";
export {
  AvatarButton,
  Button,
  ExternalLink,
  FieldRow,
  FormField,
  GlyphButton,
  IconButton,
  KeyHints,
  Keycap,
  MenuItem,
  MenuSeparator,
  NumberInput,
  Separator,
  Tabs,
  TextField,
} from "./controls.js";
export {
  Avatar,
  CodeBlock,
  DefinitionList,
  ListRow,
  Metric,
  MetricGrid,
} from "./data.js";
export {
  CellStack,
  TableHeaderRow,
  TableRow,
  tableHeaderHeight,
} from "./table.js";
export { AccordionGroup, AccordionSection } from "./disclosure.js";
export { Alert, Badge, EmptyState, StatusItem, Step } from "./feedback.js";
