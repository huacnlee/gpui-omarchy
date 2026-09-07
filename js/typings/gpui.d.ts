// The gpui surface this library touches, as declarations, for generation only.
//
// gpui-shell writes a complete `gpui.d.ts` into every directory that imports a
// built-in module, from the runtime that is about to run — which is why that
// file is never committed anywhere, including here. A library cannot depend on
// it: `bun run types` has to emit the same declarations on a machine with no
// gpui-shell installed, and emit them the same way twice.
//
// So this file names the handful of gpui and gpui-base entries `src/` actually
// imports, and nothing else. It is not shipped: the declarations in `types/`
// only ever *refer* to `import("gpui").Color` and friends, and those names
// resolve, in an application, against the real generated `gpui.d.ts` sitting
// beside the application's own sources. Two `declare module "gpui"` blocks in
// one program would collide, which is the other reason this one stays home.
//
// Elements are deliberately loose. Reproducing GPUI's style surface here would
// be reproducing twenty thousand lines that the runtime already generates, and
// the only thing declaration emit needs from an element is that a chain of
// style calls is still an element — so `build()` says `Element` rather than
// `any` in the file an application reads.

declare module "gpui" {
  /** Any style or content call on an element answers the element. */
  export interface Element {
    [method: string]: (...args: any[]) => Element;
  }

  /** A retained child view. Placed like an element, built like a view. */
  export interface Entity {
    readonly __entity?: unique symbol;
  }

  /** The render context a component is built against. */
  export interface Context {
    [method: string]: any;
  }

  /** A click, as delivered to an `onClick` callback. */
  export interface ClickEvent {
    [field: string]: any;
  }

  /** A semantic color token or a `#rrggbbaa` literal. */
  export type Color = import("gpui-base").ColorToken | `#${string}`;

  /** A length that must resolve to a size: pixels, rems or a percentage. */
  export type DefiniteLength = number | `${number}px` | `${number}rem` | `${number}%`;

  export function div(): Element;
  export function svg(path: string): Element;
}

declare module "gpui-base" {
  import { Element } from "gpui";

  /** A component identified across renders by `new(id)`. */
  export interface ComponentType {
    new: (id: string | number) => Element;
  }

  /** A sub-part with no identity of its own, constructed with `new()`. */
  export interface PartType {
    new: () => Element;
  }

  /** Every semantic color token a Base palette defines. */
  export type ColorToken =
    | "background"
    | "foreground"
    | "surface"
    | "surface_foreground"
    | "primary"
    | "primary_foreground"
    | "secondary"
    | "secondary_foreground"
    | "muted"
    | "muted_foreground"
    | "accent"
    | "accent_foreground"
    | "destructive"
    | "destructive_foreground"
    | "border"
    | "input"
    | "ring";

  /** A text field's state, owned by the application and passed in. */
  export interface InputState {
    [field: string]: any;
  }

  export function h_flex(): Element;
  export function v_flex(): Element;

  export const Accordion: ComponentType;
  // The generated declarations spell this one as a construct signature, which
  // puts `.new(trigger)` out of reach of a checker; the runtime takes the call.
  export const AccordionHeader: { new: (trigger: Element) => Element };
  export const AccordionItem: PartType;
  export const AccordionPanel: PartType;
  export const AccordionTrigger: ComponentType;
  export const Avatar: PartType;
  export const AvatarFallback: PartType;
  export const Button: ComponentType;
  export const Input: { new: (state: InputState) => Element };
  export const Link: ComponentType;
  export const NumberInput: { new: (state: InputState) => Element };
  export const Tab: ComponentType;
  export const Tabs: ComponentType;
  export const TableCell: { new: (id: string | number, column_index: number) => Element };
  export const TableHead: { new: (id: string | number, column_index: number) => Element };
  export const TableHeader: ComponentType;
  export const TableRow: { new: (id: string | number, row_index: number) => Element };
}
