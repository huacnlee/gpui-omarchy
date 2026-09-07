// @ts-check

import { div, svg } from "gpui";
import {
  Button as BaseButton,
  Input,
  Link,
  NumberInput as BaseNumberInput,
  Tab as BaseTab,
  Tabs as BaseTabs,
  h_flex,
  v_flex,
} from "gpui-base";
import {
  optionalCallback,
  optionalText,
  requiredRenderable,
  requiredText,
  stableId,
} from "./internal.js";
import { Avatar } from "./data.js";
import { alpha, style } from "./style.js";
import { Label, MutedText } from "./text.js";
import { role } from "./theme.js";

const NO_FILL = /** @type {import("gpui").Color} */ ("#00000000");
const SIZES = /** @type {const} */ (["xsmall", "small", "medium", "large"]);

/** @typedef {typeof SIZES[number]} ControlSize */

/**
 * @param {import("gpui").Context} cx
 * @param {import("gpui").Color} [color]
 * @param {import("gpui").Color} [focusColor]
 */
/**
 * A control's chrome, in every state it can be in.
 *
 * There are two ways to arrive at these colours and the difference matters.
 *
 * A **tinted** control -- destructive, accent -- has no token for "destructive
 * at eight percent", so its chrome is derived: the role's own colour at the
 * theme's alphas. That derivation is Omarchy's model, and it is what keeps a
 * light theme from getting a dark "muted" and a dark theme a light one.
 *
 * A **neutral** control takes the chrome the semantic theme already names.
 * `surface` is a resting control's fill, `muted` its hover, `accent` its
 * selection, `border` its edge, `ring` its focus. `omarchyTheme` builds those
 * four tokens out of exactly the alphas below, so on an Omarchy desktop the
 * two routes agree by construction -- and a theme written by hand rather than
 * derived means its tokens literally, which is the case re-deriving would
 * override. A window whose palette says its rules are `#cecdc3` should not get
 * forty percent of its foreground instead.
 *
 * @param {import("gpui").Context} cx
 * @param {import("gpui").Color} [tint] a role colour, for a tinted control
 */
function surfaceStates(cx, tint) {
  const state = style().state;
  const colors = cx.theme().colors;
  if (tint) {
    return {
      normalFill: alpha(tint, state.normalFillAlpha),
      hoverFill: alpha(tint, state.hoverFillAlpha),
      selectedFill: alpha(tint, state.selectedFillAlpha),
      pressedFill: alpha(tint, state.pressedFillAlpha),
      normalBorder: alpha(tint, state.normalBorderAlpha),
      hoverBorder: alpha(tint, state.hoverBorderAlpha),
      selectedBorder: alpha(tint, state.selectedBorderAlpha),
      focusFill: alpha(tint, state.focusFillAlpha),
      focusBorder: alpha(tint, state.focusBorderAlpha),
      ...widths(state),
    };
  }
  return {
    normalFill: colors.surface,
    hoverFill: colors.muted,
    selectedFill: colors.accent,
    // No token names a pressed fill, and none should: it is the hover fill
    // pushed one step, which is a derivation rather than a colour a theme has
    // an opinion about.
    pressedFill: alpha(colors.foreground, state.pressedFillAlpha),
    normalBorder: colors.border,
    hoverBorder: colors.border,
    selectedBorder: colors.accent,
    focusFill: colors.muted,
    focusBorder: colors.ring,
    ...widths(state),
  };
}

/** @param {ReturnType<typeof style>["state"]} state */
function widths(state) {
  return {
    normalBorderWidth: state.normalBorderWidth,
    hoverBorderWidth: state.hoverBorderWidth,
    selectedBorderWidth: state.selectedBorderWidth,
    focusBorderWidth: state.focusBorderWidth,
  };
}

/** @param {string} component @param {string} value @returns {ControlSize} */
function controlSize(component, value) {
  if (!SIZES.includes(/** @type {ControlSize} */ (value))) {
    throw new Error(
      `${component} size must be one of ${SIZES.join(", ")}; received ${JSON.stringify(value)}`,
    );
  }
  return /** @type {ControlSize} */ (value);
}

/** @param {ControlSize} size */
function sizeStyle(size) {
  const tokens = style();
  // A control inside a run of text rather than in a row of its own: a
  // segmented reading picker, a chip on an attachment, the toggle at the end
  // of a caption. `small` is one step of the type scale under the body, which
  // is the right ramp for a row of controls; a control sitting *in* a caption
  // has to reach the caption or it stands taller than the words around it.
  if (size === "xsmall") {
    return {
      extent: tokens.space(20),
      fontSize: tokens.font.caption,
      iconSize: tokens.font.iconSmall,
      paddingX: tokens.spacing.md,
    };
  }
  if (size === "small") {
    return {
      extent: tokens.space(24),
      fontSize: tokens.font.bodySmall,
      iconSize: tokens.font.iconSmall,
      paddingX: tokens.spacing.lg,
    };
  }
  if (size === "large") {
    return {
      extent: tokens.space(32),
      fontSize: tokens.font.title,
      iconSize: tokens.font.iconLarge,
      paddingX: tokens.spacing.xxl,
    };
  }
  return {
    extent: tokens.spacing.controlHeight,
    fontSize: tokens.font.body,
    iconSize: tokens.font.icon,
    paddingX: tokens.spacing.controlPaddingX,
  };
}

/** @param {string} value @param {import("gpui").Context} cx */
function labelElement(value, cx) {
  return new Label(value).build(cx);
}

/** @param {string} value @param {import("gpui").Context} cx */
function mutedElement(value, cx) {
  return new MutedText(value).build(cx);
}

/**
 * @param {{id:string, label:string, asset:string, outlined:boolean, bordered:boolean,
 * selected:boolean, accent:boolean, danger:boolean, disabled:boolean, loading:boolean,
 * loadingLabel:string, size:ControlSize, tooltip:string,
 * tone?: import("gpui").Color,
 * onClick?: (event: import("gpui").ClickEvent, cx: import("gpui").Context) => void}} config
 * @param {import("gpui").Context} cx
 */
function buildButton(config, cx) {
  const tokens = style();
  const dimensions = sizeStyle(config.size);
  const inactive = config.disabled || config.loading;
  const hasBorder = config.outlined || config.bordered || config.selected;
  // Emphasis is carried by the label and the border, never by a solid block of
  // colour: an Omarchy control is an alpha of a role over the window's own
  // ground, and one filled rectangle in a window of them reads as a different
  // application. `accent` and `danger` are the two roles a control can take.
  const emphasis = config.danger
    ? cx.theme().colors.destructive
    : config.accent
      ? role("accent", cx.theme().colors.primary)
      : undefined;
  // Disabled first: a control that cannot be pressed has to look like one,
  // whatever it would otherwise have been coloured. Then the caller's tone,
  // which is a reading no token names, then the role, then the plain
  // foreground.
  const foreground = inactive
    ? emphasis
      ? alpha(emphasis, tokens.state.normalBorderAlpha)
      : cx.theme().colors.muted_foreground
    : (config.tone ?? emphasis ?? cx.theme().colors.foreground);
  const states = surfaceStates(cx, emphasis);
  const restBorderWidth = config.selected
    ? states.selectedBorderWidth
    : states.normalBorderWidth;
  const restBorderColor = config.selected
    ? states.selectedBorderWidth > 0
      ? states.selectedBorder
      : NO_FILL
    : hasBorder
      ? states.normalBorder
      : NO_FILL;

  return BaseButton.new(config.id)
    .disabled(inactive)
    .selected(config.selected)
    .flex()
    .items_center()
    .justify_center()
    .gap(tokens.spacing.md)
    .h(dimensions.extent)
    .px(dimensions.paddingX)
    .rounded(tokens.cornerRadius)
    .border(restBorderWidth)
    .border_color(restBorderColor)
    .bg(
      config.selected
        ? states.selectedFill
        : config.bordered && !config.outlined
          ? states.normalFill
          : NO_FILL,
    )
    .text_size(dimensions.fontSize)
    .text_color(foreground)
    .when(Boolean(config.tooltip), (element) =>
      element.tooltip(config.tooltip),
    )
    .when(config.loading, (element) =>
      element.accessibility_label(config.loadingLabel),
    )
    .when(Boolean(config.asset) && !config.loading, (element) =>
      element.child(
        svg(config.asset)
          .flex_none()
          .size(dimensions.iconSize)
          .text_color(foreground),
      ),
    )
    .when(!inactive && typeof config.onClick === "function", (element) =>
      element.on_click(config.onClick),
    )
    .when(!inactive, (element) =>
      element.hover((appearance) =>
        appearance
          .bg(config.selected ? states.selectedFill : states.hoverFill)
          .border(
            config.selected
              ? states.selectedBorderWidth
              : states.hoverBorderWidth,
          )
          .border_color(
            config.selected
              ? states.selectedBorderWidth > 0
                ? states.selectedBorder
                : NO_FILL
              : states.hoverBorder,
          ),
      ),
    )
    .when(!inactive, (element) =>
      element.active((appearance) => appearance.bg(states.pressedFill)),
    )
    .focus((appearance) =>
      appearance
        .bg(config.selected ? states.selectedFill : states.focusFill)
        .border(states.focusBorderWidth)
        .border_color(states.focusBorder),
    )
    .child(config.loading ? config.loadingLabel : config.label);
}

/**
 * @param {string} label
 * @param {{iconSize:number}} dimensions
 * @param {import("gpui").Color} foreground
 */
function activityMarker(label, dimensions, foreground) {
  const tokens = style();
  return div()
    .role("progress_indicator")
    .accessibility_label(label)
    .flex_none()
    .size(dimensions.iconSize)
    .rounded(dimensions.iconSize)
    .border(tokens.spacing.hairline)
    .border_color(foreground)
    .bg(alpha(foreground, tokens.state.normalFillAlpha));
}

/**
 * @param {{id:string, content:any, description:string, outlined:boolean,
 * bordered:boolean, selected:boolean, quiet:boolean, disabled:boolean,
 * loading:boolean, loadingLabel:string, size:ControlSize,
 * tone?: import("gpui").Color,
 * onClick?: (event: import("gpui").ClickEvent,
 * cx: import("gpui").Context) => void}} config
 * @param {import("gpui").Context} cx
 */
function buildCompactCommand(config, cx) {
  const tokens = style();
  const dimensions = sizeStyle(config.size);
  const inactive = config.disabled || config.loading;
  const hasBorder = config.outlined || config.bordered || config.selected;
  // A quiet command is supporting chrome -- the marks in a window's title row
  // or a panel's heading -- so it rests in the muted foreground and comes up
  // to full strength only when it is pointed at, focused or on. Two icons at
  // full weight beside a heading read as the point of the panel rather than as
  // the way out of it.
  const emphatic = !config.quiet || config.selected;
  // Full strength is the caller's tone where there is one, and the foreground
  // otherwise. `quiet` decides when the command reaches it, not what it is, so
  // the two compose: a quiet toned command rests muted and arrives at its own
  // colour under the pointer.
  const strength = config.tone ?? cx.theme().colors.foreground;
  const foreground = inactive
    ? cx.theme().colors.muted_foreground
    : emphatic
      ? strength
      : cx.theme().colors.muted_foreground;
  const states = surfaceStates(cx);
  const restBorderWidth = config.selected
    ? states.selectedBorderWidth
    : states.normalBorderWidth;
  const restBorderColor = config.selected
    ? states.selectedBorderWidth > 0
      ? states.selectedBorder
      : NO_FILL
    : hasBorder
      ? states.normalBorder
      : NO_FILL;

  return BaseButton.new(config.id)
    .disabled(inactive)
    .selected(config.selected)
    .accessibility_label(
      config.loading ? config.loadingLabel : config.description,
    )
    .tooltip(config.loading ? config.loadingLabel : config.description)
    .flex()
    .items_center()
    .justify_center()
    .flex_none()
    .size(dimensions.extent)
    .p(tokens.space(2))
    .rounded(tokens.cornerRadius)
    .border(restBorderWidth)
    .border_color(restBorderColor)
    .bg(
      config.selected
        ? states.selectedFill
        : config.bordered && !config.outlined
          ? states.normalFill
          : NO_FILL,
    )
    .text_size(dimensions.fontSize)
    .text_color(foreground)
    .when(!inactive && typeof config.onClick === "function", (element) =>
      element.on_click(config.onClick),
    )
    .when(!inactive, (element) =>
      element.hover((appearance) =>
        appearance
          .bg(config.selected ? states.selectedFill : states.hoverFill)
          .border(
            config.selected
              ? states.selectedBorderWidth
              : states.hoverBorderWidth,
          )
          .border_color(
            config.selected
              ? states.selectedBorderWidth > 0
                ? states.selectedBorder
                : NO_FILL
              : states.hoverBorder,
          )
          .text_color(inactive ? foreground : strength),
      ),
    )
    .when(!inactive, (element) =>
      element.active((appearance) => appearance.bg(states.pressedFill)),
    )
    .focus((appearance) =>
      appearance
        .bg(config.selected ? states.selectedFill : states.focusFill)
        .border(states.focusBorderWidth)
        .border_color(states.focusBorder),
    )
    .child(
      config.loading
        ? activityMarker(config.loadingLabel, dimensions, foreground)
        : config.content,
    );
}

export class Button {
  #id;
  #label;
  #asset;
  #tooltip;
  /** @type {import("gpui").Color | undefined} */
  #tone;
  #outlined = false;
  #bordered = false;
  #selected = false;
  #accent = false;
  #danger = false;
  #disabled = false;
  #loading = false;
  #loadingLabel;
  /** @type {ControlSize} */
  #size = "medium";
  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("Button", id); }
  /** @param {string} text */
  label(text) { this.#label = text; return this; }
  /** @param {string} asset complete application-root-relative asset path */
  icon(asset) { this.#asset = asset; return this; }
  /**
   * What the label alone cannot say -- most often the keyboard route to the
   * same action. A compact command carries this in its `description`, which is
   * also its accessible name; a labelled button already has an accessible name
   * and needs only the hint.
   * @param {string} text
   */
  tooltip(text) { this.#tooltip = text; return this; }
  /**
   * A colour this control is a *reading* in, rather than an interface role.
   *
   * `accent` and `danger` are roles and the theme owns their colours. A tone
   * is a meaning the caller worked out -- a direction, a category, a mark that
   * is on -- that no token can name. It reaches the label and the icon
   * together, because a control half in one colour reads as a rendering bug.
   *
   * Disabled still wins: a control that cannot be pressed has to look like one.
   *
   * @param {import("gpui").Color | undefined} color
   */
  tone(color) { this.#tone = color; return this; }
  outlined() { this.#outlined = true; return this; }
  /** @param {boolean} [value] */
  bordered(value = true) { this.#bordered = value; return this; }
  /** @param {boolean} [value] */
  selected(value = true) { this.#selected = value; return this; }
  /** @param {boolean} [value] the one control a screen wants pressed */
  accent(value = true) { this.#accent = value; return this; }
  /** @param {boolean} [value] */
  danger(value = true) { this.#danger = value; return this; }
  /** @param {boolean} [value] */
  disabled(value = true) { this.#disabled = value; return this; }
  /** @param {boolean} [value] */
  loading(value = true) { this.#loading = value; return this; }
  /** @param {string} text */
  loadingLabel(text) { this.#loadingLabel = text; return this; }
  /** @param {string} value */
  size(value) { this.#size = controlSize("Button", value); return this; }
  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    this.#onClick = optionalCallback("Button", "onClick", callback);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const label = requiredText("Button", "label", this.#label);
    const asset = optionalText("Button", "icon", this.#asset) ?? "";
    const loadingLabel = this.#loading
      ? requiredText("Button", "loading label", this.#loadingLabel)
      : optionalText("Button", "loading label", this.#loadingLabel) ?? "";
    const tooltip = optionalText("Button", "tooltip", this.#tooltip) ?? "";
    return buildButton({
      id: this.#id,
      label,
      asset,
      tooltip,
      tone: this.#tone,
      outlined: this.#outlined,
      bordered: this.#bordered,
      selected: this.#selected,
      accent: this.#accent,
      danger: this.#danger,
      disabled: this.#disabled,
      loading: this.#loading,
      loadingLabel,
      size: this.#size,
      onClick: this.#onClick,
    }, cx);
  }
}

export class IconButton {
  #id;
  #asset;
  #description;
  /** @type {import("gpui").Color | undefined} */
  #tone;
  #outlined = false;
  #bordered = false;
  #selected = false;
  #quiet = false;
  #disabled = false;
  #loading = false;
  #loadingLabel;
  /** @type {ControlSize} */
  #size = "medium";
  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("IconButton", id); }
  /** @param {string} asset complete application-root-relative asset path */
  icon(asset) { this.#asset = asset; return this; }
  /** @param {string} text */
  description(text) { this.#description = text; return this; }
  outlined() { this.#outlined = true; return this; }
  /** @param {boolean} [value] */
  bordered(value = true) { this.#bordered = value; return this; }
  /** @param {boolean} [value] */
  selected(value = true) { this.#selected = value; return this; }
  /** @param {boolean} [value] supporting chrome: muted until pointed at */
  quiet(value = true) { this.#quiet = value; return this; }
  /**
   * A colour this command is a *reading* in, rather than an interface role.
   *
   * It is the command's full strength, and `quiet` decides when the command
   * reaches it: on its own the tone shows at rest, and with `quiet` the mark
   * rests muted and arrives at its own colour under the pointer. A starred
   * message keeps its mark lit; the star on every other row does not.
   *
   * Disabled still wins: a command that cannot be pressed has to look like one.
   *
   * @param {import("gpui").Color | undefined} color
   */
  tone(color) { this.#tone = color; return this; }
  /** @param {boolean} [value] */
  disabled(value = true) { this.#disabled = value; return this; }
  /** @param {boolean} [value] */
  loading(value = true) { this.#loading = value; return this; }
  /** @param {string} text */
  loadingLabel(text) { this.#loadingLabel = text; return this; }
  /** @param {string} value */
  size(value) { this.#size = controlSize("IconButton", value); return this; }
  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    this.#onClick = optionalCallback("IconButton", "onClick", callback);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const asset = requiredText("IconButton", "icon", this.#asset);
    const description = requiredText(
      "IconButton",
      "description",
      this.#description,
    );
    const loadingLabel = this.#loading
      ? requiredText("IconButton", "loading label", this.#loadingLabel)
      : optionalText("IconButton", "loading label", this.#loadingLabel) ?? "";
    return buildCompactCommand({
      id: this.#id,
      content: svg(asset).size(sizeStyle(this.#size).iconSize).flex_none(),
      description,
      outlined: this.#outlined,
      bordered: this.#bordered,
      selected: this.#selected,
      quiet: this.#quiet,
      tone: this.#tone,
      disabled: this.#disabled,
      loading: this.#loading,
      loadingLabel,
      size: this.#size,
      onClick: this.#onClick,
    }, cx);
  }
}

export class GlyphButton {
  #id;
  #glyph;
  #description;
  /** @type {import("gpui").Color | undefined} */
  #tone;
  #outlined = false;
  #bordered = false;
  #selected = false;
  #quiet = false;
  #disabled = false;
  #loading = false;
  #loadingLabel;
  /** @type {ControlSize} */
  #size = "medium";
  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("GlyphButton", id); }
  /** @param {string} text */
  glyph(text) { this.#glyph = text; return this; }
  /** @param {string} text */
  description(text) { this.#description = text; return this; }
  outlined() { this.#outlined = true; return this; }
  /** @param {boolean} [value] */
  bordered(value = true) { this.#bordered = value; return this; }
  /** @param {boolean} [value] */
  selected(value = true) { this.#selected = value; return this; }
  /** @param {boolean} [value] supporting chrome: muted until pointed at */
  quiet(value = true) { this.#quiet = value; return this; }
  /**
   * A colour this command is a *reading* in, rather than an interface role.
   *
   * It is the command's full strength, and `quiet` decides when the command
   * reaches it: on its own the tone shows at rest, and with `quiet` the mark
   * rests muted and arrives at its own colour under the pointer. A starred
   * message keeps its mark lit; the star on every other row does not.
   *
   * Disabled still wins: a command that cannot be pressed has to look like one.
   *
   * @param {import("gpui").Color | undefined} color
   */
  tone(color) { this.#tone = color; return this; }
  /** @param {boolean} [value] */
  disabled(value = true) { this.#disabled = value; return this; }
  /** @param {boolean} [value] */
  loading(value = true) { this.#loading = value; return this; }
  /** @param {string} text */
  loadingLabel(text) { this.#loadingLabel = text; return this; }
  /** @param {string} value */
  size(value) { this.#size = controlSize("GlyphButton", value); return this; }
  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    this.#onClick = optionalCallback("GlyphButton", "onClick", callback);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const glyph = requiredText("GlyphButton", "glyph", this.#glyph);
    const description = requiredText(
      "GlyphButton",
      "description",
      this.#description,
    );
    const loadingLabel = this.#loading
      ? requiredText("GlyphButton", "loading label", this.#loadingLabel)
      : optionalText("GlyphButton", "loading label", this.#loadingLabel) ?? "";
    return buildCompactCommand({
      id: this.#id,
      content: glyph,
      description,
      outlined: this.#outlined,
      bordered: this.#bordered,
      selected: this.#selected,
      quiet: this.#quiet,
      tone: this.#tone,
      disabled: this.#disabled,
      loading: this.#loading,
      loadingLabel,
      size: this.#size,
      onClick: this.#onClick,
    }, cx);
  }
}

export class MenuItem {
  #id;
  #label;
  #detail;
  #asset;
  #selected = false;
  #danger = false;
  #disabled = false;
  /** @type {import("gpui").Color | undefined} */
  #tone;
  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("MenuItem", id); }
  /** @param {string} text */
  label(text) { this.#label = text; return this; }
  /** @param {string} text */
  detail(text) { this.#detail = text; return this; }
  /** @param {string} asset complete application-root-relative asset path */
  icon(asset) { this.#asset = asset; return this; }
  /**
   * The active row: where the arrow keys have got to.
   *
   * A menu row has one such state and not two. Nothing in a menu is *chosen* --
   * a row is activated and the menu closes -- so there is no membership for a
   * heavier treatment to outrank, which is why this is the same fill the
   * pointer draws and no edge at all. A rule around the active row turns an
   * open menu into a stack of buttons with one pressed in it.
   *
   * @param {boolean} [value]
   */
  selected(value = true) { this.#selected = value; return this; }
  /** @param {boolean} [value] */
  danger(value = true) { this.#danger = value; return this; }
  /**
   * A colour this row's text is a *reading* in, rather than an interface role.
   *
   * `danger` is a role and the theme owns its colour. A tone is a meaning the
   * caller worked out -- a direction, a rising or falling value -- that no
   * token can name. It reaches the label, the icon and the detail together,
   * because a row half in one colour reads as a rendering bug.
   *
   * Disabled still wins: a row that cannot be pressed has to look like one.
   *
   * @param {import("gpui").Color | undefined} color
   */
  tone(color) { this.#tone = color; return this; }
  /** @param {boolean} [value] */
  disabled(value = true) { this.#disabled = value; return this; }
  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    this.#onClick = optionalCallback("MenuItem", "onClick", callback);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const label = requiredText("MenuItem", "label", this.#label);
    const detail = optionalText("MenuItem", "detail", this.#detail) ?? "";
    const asset = optionalText("MenuItem", "icon", this.#asset) ?? "";
    const tokens = style();
    // Disabled first: a row that cannot be pressed has to look like one,
    // whatever it would otherwise have been coloured. Then the caller's tone,
    // which is a reading no token names, then the theme's own role.
    const foreground = this.#disabled
      ? this.#danger
        ? alpha(cx.theme().colors.destructive, tokens.state.normalBorderAlpha)
        : cx.theme().colors.muted_foreground
      : (this.#tone ??
        (this.#danger ? cx.theme().colors.destructive : cx.theme().colors.foreground));
    const states = surfaceStates(
      cx,
      this.#danger ? cx.theme().colors.destructive : undefined,
    );
    // No edge in any state, active or not: the popup is already a bordered
    // surface, and a rule around every row inside it turns a list into a stack
    // of buttons. The width is still declared so the row does not change size
    // when a theme gives its controls one.
    const restBorderWidth = states.normalBorderWidth;
    const restBorderColor = NO_FILL;
    return BaseButton.new(this.#id)
      .role("menu_item")
      .disabled(this.#disabled)
      .selected(this.#selected)
      .accessibility_label(detail ? `${label}, ${detail}` : label)
      .flex()
      .items_center()
      .justify_between()
      .w_full()
      .h(tokens.spacing.popupRowHeight)
      .gap(tokens.spacing.controlGap)
      .px(tokens.space(9))
      .rounded(tokens.cornerRadius)
      .border(restBorderWidth)
      .border_color(restBorderColor)
      .bg(this.#selected ? states.hoverFill : NO_FILL)
      .text_size(tokens.font.bodySmall)
      .text_color(foreground)
      .when(!this.#disabled && typeof this.#onClick === "function", (element) => element.on_click(this.#onClick))
      // A menu row lights as a band, not as a control that grows an edge: the
      // popup is already a bordered surface, and a rule around every row
      // inside it turns a list into a stack of buttons.
      .when(!this.#disabled, (element) => element.hover((appearance) => appearance
        .bg(states.hoverFill)
        .border(restBorderWidth)
        .border_color(restBorderColor)))
      .when(!this.#disabled, (element) => element.active((appearance) => appearance.bg(states.pressedFill)))
      // Focus is the one state that does draw an edge: it reports where the
      // keyboard is, which a fill alone cannot say when the pointer is
      // hovering a different row.
      .focus((appearance) => appearance
        .bg(this.#selected ? states.hoverFill : states.focusFill)
        .border(states.focusBorderWidth)
        .border_color(states.focusBorder))
      .child(
        h_flex()
          .items_center()
          .gap(tokens.spacing.md)
          .min_w_0()
          .when(Boolean(asset), (element) => element.child(svg(asset).flex_none().size(tokens.font.iconSmall).text_color(foreground)))
          .child(labelElement(label, cx).text_color(foreground).truncate()),
      )
      .when(Boolean(detail), (element) => element.child(
        mutedElement(detail, cx)
          .flex_none()
          .text_size(tokens.font.bodySmall)
          .when(this.#danger, (detail) => detail.text_color(foreground)),
      ));
  }
}

/**
 * One choice out of a few, laid out flat.
 *
 * Two shapes, because a run of tabs answers two different questions and the
 * answers do not look alike:
 *
 * - **`underline`** is navigation. The choices sit on the surface they belong
 *   to and the current one is marked beneath, the way a set of pages is marked
 *   in a window that is showing one of them.
 * - **`segmented`** is a value. The choices are enclosed together, because
 *   they are one field's worth of answer rather than places to go, and the
 *   current one is filled.
 *
 * ```js
 * new Tabs("interval").items(intervals).value(mode).onChange(setMode)
 * new Tabs("validity").segmented().items(options).value(tif).onChange(setTif)
 * ```
 *
 * The selection is the caller's, as it is on the base primitive: `value(...)`
 * in, `onChange(...)` out. Nothing here remembers which tab was pressed.
 *
 * Focus order is the base `Tab`'s own -- it owns that part of its focus and
 * accessibility, and `tab_index` written onto one is refused with a warning.
 * A run of tabs is therefore walked in the order it was built, which is the
 * order it is read in.
 *
 * **Every state keeps the same size.** A segment's border is drawn on the
 * enclosure, never on the segments, and the underline's is reserved on all of
 * them and coloured on one. A control that grows an edge on hover is a control
 * that resizes on hover, and its neighbours move with it.
 */
export class Tabs {
  #id;
  /** @type {{ value: string, label: string }[]} */
  #items = [];
  #value = "";
  /** @type {"underline" | "segmented"} */
  #variant = "underline";
  /** @type {ControlSize} */
  #size = "small";
  /** @type {((value: string, cx: import("gpui").Context) => void) | undefined} */
  #onChange;
  #label = "";

  /** @param {string} id */
  constructor(id) { this.#id = stableId("Tabs", id); }

  /**
   * Encloses the choices and fills the current one: a value, not a place.
   *
   * First in the chain, because it is what this run of tabs *is*. What
   * follows -- the choices, which one is current, what to do when it changes
   * -- is the same either way, and a shape declared after them reads as an
   * afterthought rather than as the decision it is.
   */
  segmented(value = true) { this.#variant = value ? "segmented" : "underline"; return this; }

  /** @param {{ value: string, label: string }[]} items */
  items(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Tabs items must be a non-empty array of { value, label }");
    }
    this.#items = items.map((item) => ({
      value: requiredText("Tabs", "item value", item?.value),
      label: requiredText("Tabs", "item label", item?.label),
    }));
    return this;
  }

  /** @param {string} value the item currently chosen */
  value(value) { this.#value = optionalText("Tabs", "value", value) ?? ""; return this; }

  /** @param {(value: string, cx: import("gpui").Context) => void} callback */
  onChange(callback) {
    this.#onChange = optionalCallback("Tabs", "onChange", callback);
    return this;
  }


  /** @param {string} value */
  size(value) { this.#size = controlSize("Tabs", value); return this; }

  /** @param {string} text what this run of tabs is choosing, for a screen reader */
  accessibilityLabel(text) {
    this.#label = optionalText("Tabs", "accessibilityLabel", text) ?? "";
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    if (this.#items.length === 0) {
      throw new Error("Tabs must be given items before it is built");
    }
    const tokens = style();
    const dimensions = sizeStyle(this.#size);
    const states = surfaceStates(cx);
    const segmented = this.#variant === "segmented";
    const onChange = this.#onChange;
    const tabs = this.#items.map((item, index) => {
      const selected = item.value === this.#value;
      const tab = BaseTab.new(`${this.#id}-${item.value}`)
        .selected(selected)
        .flex()
        .items_center()
        .justify_center()
        .h(dimensions.extent)
        .px(tokens.spacing.sm)
        .text_size(dimensions.fontSize)
        .when(typeof onChange === "function", (element) =>
          element.on_click((_event, cx) => onChange(item.value, cx)),
        )
        .child(item.label);
      if (segmented) {
        return (
          tab
            .flex_1()
            .rounded(tokens.cornerRadius)
            // The fill is the whole of the mark. The enclosure draws the edge,
            // so a segment has none to grow or lose and the run cannot change
            // width as the pointer crosses it.
            .bg(selected ? states.selectedFill : NO_FILL)
            .text_color(selected ? cx.theme().colors.foreground : cx.theme().colors.muted_foreground)
            .when(!selected, (element) =>
              element.hover((appearance) => appearance.bg(states.hoverFill)),
            )
            .focus((appearance) =>
              appearance.bg(selected ? states.selectedFill : states.focusFill),
            )
        );
      }
      return tab
        .flex_none()
        // Reserved on every tab and coloured on one: an underline that appears
        // would move the row it is in by its own width.
        .border_b(states.selectedBorderWidth || tokens.spacing.hairline * 2)
        .border_color(selected ? role("accent", cx.theme().colors.primary) : NO_FILL)
        .text_color(selected ? cx.theme().colors.foreground : cx.theme().colors.muted_foreground)
        .when(!selected, (element) =>
          element.hover((appearance) => appearance.text_color(cx.theme().colors.foreground)),
        );
    });
    return BaseTabs.new(this.#id)
      .axis("horizontal")
      .when(Boolean(this.#label), (element) => element.accessibility_label(this.#label))
      .flex_none()
      .min_w(0)
      .child(
        h_flex()
          .flex_none()
          .when(segmented, (element) =>
            element
              .w_full()
              .gap(tokens.spacing.xxs)
              .p(tokens.spacing.xxs)
              .rounded(tokens.cornerRadius)
              .border(states.normalBorderWidth)
              .border_color(states.normalBorder),
          )
          .children(tabs),
      );
  }
}

export class FieldRow {
  #id;
  #label;
  #control;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("FieldRow", id); }
  /** @param {string} text */
  label(text) { this.#label = text; return this; }
  /** @param {import("gpui").Element | import("gpui").Entity} element */
  control(element) { this.#control = element; return this; }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const label = requiredText("FieldRow", "label", this.#label);
    const control = requiredRenderable("FieldRow", "control", this.#control);
    const tokens = style();
    return h_flex()
      .id(this.#id)
      .flex_none()
      .items_center()
      .gap(tokens.spacing.controlGap)
      .px(tokens.spacing.panelPadding)
      .py(tokens.spacing.xs)
      .border_b(tokens.spacing.hairline)
      .border_color(cx.theme().colors.border)
      .child(h_flex().w(tokens.space(52)).flex_none().child(labelElement(label, cx).text_color(cx.theme().colors.muted_foreground)))
      .child(control);
  }
}

export class FormField {
  #id;
  #label;
  #control;
  #helper;
  #error;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("FormField", id); }
  /** @param {string} text */
  label(text) { this.#label = text; return this; }
  /** @param {import("gpui").Element | import("gpui").Entity} element */
  control(element) { this.#control = element; return this; }
  /** @param {string} text */
  helper(text) { this.#helper = text; return this; }
  /** @param {string} message */
  error(message) { this.#error = message; return this; }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const label = requiredText("FormField", "label", this.#label);
    const control = requiredRenderable("FormField", "control", this.#control);
    const helper = optionalText("FormField", "helper", this.#helper) ?? "";
    const error = optionalText("FormField", "error", this.#error, {
      allowEmpty: true,
    }) ?? "";
    const tokens = style();
    const hasError = Boolean(error);
    const feedback = hasError ? error : helper;
    return v_flex()
      .id(this.#id)
      .min_w_0()
      .gap(tokens.spacing.labelGap)
      .child(labelElement(label, cx))
      .child(control)
      .when(Boolean(feedback), (element) => element.child(
        mutedElement(feedback, cx)
          .text_size(tokens.font.bodySmall)
          .when(hasError, (message) =>
            message
              .role("alert")
              .text_color(cx.theme().colors.destructive),
          ),
      ));
  }
}

export class Separator {
  /** @param {import("gpui").Context} cx */
  build(cx) {
    // A panel rule, which is not a control border: `separator` is the derived
    // role for it, and a theme that has not been read falls back to its own
    // border token rather than to a hard-coded fraction of the foreground.
    return v_flex()
      .flex_none()
      .h(style().spacing.hairline)
      .w_full()
      .bg(role("separator", cx.theme().colors.border));
  }
}

export class MenuSeparator {
  /** @param {import("gpui").Context} cx */
  build(cx) {
    return v_flex().flex_none().h(style().space(7)).w_full().justify_center().child(new Separator().build(cx));
  }
}

export class Keycap {
  #value;
  #pressed = false;
  #quiet = false;

  /** @param {string} value */
  constructor(value) { this.#value = value; }

  /**
   * The key is physically down. A cap that reports this is reporting the
   * keyboard, not the interface, so it takes the focus chrome rather than the
   * selected chrome: nothing here is selectable.
   * @param {boolean} [value]
   */
  pressed(value = true) { this.#pressed = value === true; return this; }

  /**
   * Supporting metadata rather than a control — a hint strip along the bottom
   * of a window. Only the resting fill fades; the label and the border stay
   * fully legible, and a pressed cap keeps its full-strength response.
   * @param {boolean} [value]
   */
  quiet(value = true) { this.#quiet = value === true; return this; }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const value = requiredText("Keycap", "value", this.#value);
    const tokens = style();
    const states = surfaceStates(cx);
    return h_flex()
      .flex_none()
      .items_center()
      .justify_center()
      .px(tokens.space(3))
      .py(tokens.space(1))
      .rounded(tokens.cornerRadius)
      .border(
        this.#pressed ? states.focusBorderWidth : states.normalBorderWidth,
      )
      .border_color(this.#pressed ? states.focusBorder : states.normalBorder)
      // A cap that is physically down takes the selected fill, which is the
      // strongest one a control has -- it is reporting the keyboard, and the
      // keyboard is unambiguous. A quiet cap takes the muted fill, so a hint
      // strip reads as metadata rather than as a row of buttons.
      .bg(
        this.#pressed
          ? states.selectedFill
          : this.#quiet
            ? cx.theme().colors.muted
            : states.normalFill,
      )
      .text_size(tokens.font.caption)
      .text_color(
        this.#pressed
          ? cx.theme().colors.foreground
          : this.#quiet
            ? cx.theme().colors.muted_foreground
            : cx.theme().colors.foreground,
      )
      .child(value);
  }
}

export class KeyHints {
  #id;
  /** @type {Array<{key:string, label:string}>} */
  #hints = [];
  /** @param {string} id */
  constructor(id) { this.#id = stableId("KeyHints", id); }
  /** @param {string} key @param {string} label */
  hint(key, label) { this.#hints.push({ key, label }); return this; }
  /**
   * Append a whole strip at once, in order.
   *
   * The pair matches the open containers' `child`/`children`: a caller
   * building a strip by hand names each hint, and one rendering a strip it was
   * handed -- a keymap, a table of routes -- passes the list it already has
   * rather than reducing over it at every call site.
   *
   * @param {Array<{key: string, label: string}>} entries
   */
  hints(entries) {
    if (!Array.isArray(entries)) {
      throw new Error("KeyHints hints must be an array of {key, label} entries");
    }
    for (const entry of entries) this.hint(entry?.key, entry?.label);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    return h_flex()
      .id(this.#id)
      .flex_none()
      .items_center()
      .gap(tokens.space(7))
      .children(this.#hints.map((hint) => {
        const key = requiredText("KeyHints", "key", hint.key);
        const label = requiredText("KeyHints", "label", hint.label);
        return h_flex()
        .items_center()
        .gap(tokens.space(3))
        .child(new Keycap(key).build(cx))
        .child(mutedElement(label, cx).text_size(tokens.font.caption).flex_none());
      }));
  }
}

/**
 * A link out of the application.
 *
 * Underlined as well as tinted, because a link identified by colour alone is
 * not a link to a reader who cannot separate it from the body text around it.
 */
export class ExternalLink {
  #id;
  #label;
  #href;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("ExternalLink", id); }

  /** @param {string} text */
  label(text) { this.#label = text; return this; }

  /** @param {string} url */
  href(url) { this.#href = url; return this; }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const label = requiredText("ExternalLink", "label", this.#label);
    const href = requiredText("ExternalLink", "href", this.#href);
    const tokens = style();
    const color = role("link", cx.theme().colors.primary);
    return Link.new(this.#id)
      .href(href)
      .cursor_pointer()
      .text_size(tokens.font.body)
      .text_color(color)
      .border_b(tokens.state.normalBorderWidth)
      .border_color(color)
      .focus((appearance) =>
        appearance
          .bg(alpha(color, tokens.state.focusFillAlpha))
          .border_color(
            alpha(cx.theme().colors.ring, tokens.state.focusBorderAlpha),
          ),
      )
      .child(label);
  }
}

/**
 * A text field the application owns the state of, wearing the kit's chrome.
 *
 * `InputState` needs a live host call and belongs to the view that retains it,
 * so this class arranges and styles the control rather than creating it — the
 * same division `FormField` follows. What it adds is the chrome: one height
 * shared with every other control in a row, and a focus ring drawn on the
 * border, so the field does not resize when the keyboard reaches it.
 *
 * `suffix` is the unit the value is in — a currency, `shares`, `ms`. It sits
 * *inside* the field's own edge, because beside it a reader has to work out
 * whether the word belongs to this control or labels the next one, and the
 * answer moves with the width of whatever column they are in:
 *
 *     Price                      Price
 *     [ 141.500        ] USD  →  [ 141.500    USD ]
 *
 * `Input` is a leaf and takes no children, so the unit is drawn over the
 * field's trailing edge and the field is given room for it out of its trailing
 * padding — the digits stop before the word rather than running under it. The
 * room a word needs is its length times `font.advance`, because the window is
 * monospaced. The border and the focus ring stay on the `Input`: it is what
 * actually takes the keyboard, and a wrapper carrying them would have to know
 * when its child was focused, which there is no `focus_within` to ask. With no
 * suffix there is nothing to wrap, so nothing is wrapped.
 */
export class TextField {
  #state;
  #suffix = "";
  /** @type {string | number | undefined} */
  #width;
  /** @type {ControlSize} */
  #size = "medium";

  /** @param {import("gpui-base").InputState} value */
  state(value) { this.#state = value; return this; }

  /** @param {string} text the unit this field's value is in */
  suffix(text) { this.#suffix = optionalText("TextField", "suffix", text) ?? ""; return this; }

  /** @param {string | number} value */
  width(value) { this.#width = value; return this; }

  /** @param {string} value */
  size(value) { this.#size = controlSize("TextField", value); return this; }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    if (!this.#state || typeof this.#state !== "object") {
      throw new Error("TextField state must be an application-owned InputState");
    }
    const tokens = style();
    const dimensions = sizeStyle(this.#size);
    const states = surfaceStates(cx);
    const suffix = this.#suffix;
    const room = suffix
      ? Math.round(dimensions.fontSize * tokens.font.advance * suffix.length) +
        tokens.spacing.sm * 2
      : 0;
    const field = Input.new(this.#state)
      .h(dimensions.extent)
      .pl(tokens.spacing.xs)
      .pr(suffix ? room : tokens.spacing.xs)
      .rounded(tokens.cornerRadius)
      .border(states.normalBorderWidth)
      .border_color(states.normalBorder)
      .bg(states.normalFill)
      .text_size(dimensions.fontSize)
      .text_color(cx.theme().colors.foreground)
      .focus((appearance) =>
        appearance
          .border(states.focusBorderWidth)
          .border_color(states.focusBorder),
      );
    if (!suffix) {
      return field.when(this.#width !== undefined, (element) =>
        element.w(/** @type {any} */ (this.#width)),
      );
    }
    return h_flex()
      .relative()
      .when(this.#width !== undefined, (element) =>
        element.w(/** @type {any} */ (this.#width)),
      )
      .child(field.flex_1())
      .child(
        h_flex()
          .absolute()
          .right(tokens.spacing.sm)
          .top(0)
          .h(dimensions.extent)
          .items_center()
          .child(mutedElement(suffix, cx).text_size(dimensions.fontSize)),
      );
  }
}

/**
 * The trigger an account menu hangs from: a compact command whose content is
 * an `Avatar` rather than an icon.
 *
 * Distinct from `IconButton` because the mark inside is a *subject* — a person,
 * an account, an organisation — and carries the subject's own initials or
 * tint. A trigger that drew the same glyph for everyone would not need one.
 */
/**
 * A number a person steps as well as types.
 *
 * gpui-base owns the behaviour — the step, the bounds, the numeric mask, the
 * Up and Down keys — and owns none of the look. The two step buttons it builds
 * carry no size and no content, so a number input that supplies nothing has a
 * decrement control that can be neither seen nor pressed. That half is what
 * this class is.
 *
 * The step and the bounds are fields on the `InputState`, so they belong to the
 * application the way the value does. What arrives here is that state and the
 * two labels a screen reader reads out: a step button draws a mark rather than
 * a word, and the library does not write copy.
 */
export class NumberInput {
  #state;
  #incrementLabel;
  #decrementLabel;
  #suffix = "";
  /** @type {string | number | undefined} */
  #width;
  /** @type {ControlSize} */
  #size = "medium";

  /** @param {import("gpui-base").InputState} value */
  state(value) { this.#state = value; return this; }

  /** @param {string} text what a screen reader announces for the step up */
  incrementLabel(text) { this.#incrementLabel = text; return this; }

  /** @param {string} text what a screen reader announces for the step down */
  decrementLabel(text) { this.#decrementLabel = text; return this; }

  /** @param {string} text the unit this value is in */
  suffix(text) { this.#suffix = optionalText("NumberInput", "suffix", text) ?? ""; return this; }

  /** @param {string | number} value defaults to the shell's number-field width */
  width(value) { this.#width = value; return this; }

  /** @param {string} value */
  size(value) { this.#size = controlSize("NumberInput", value); return this; }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    if (!this.#state || typeof this.#state !== "object") {
      throw new Error("NumberInput state must be an application-owned InputState");
    }
    const incrementLabel = requiredText(
      "NumberInput",
      "increment label",
      this.#incrementLabel,
    );
    const decrementLabel = requiredText(
      "NumberInput",
      "decrement label",
      this.#decrementLabel,
    );
    const tokens = style();
    const dimensions = sizeStyle(this.#size);
    const states = surfaceStates(cx);
    const colors = cx.theme().colors;

    // Replayed rather than rendered: the base layer moves these styles, state
    // styles, accessibility label and children onto the button it already
    // built and identified, which is what receives the press. So this is an
    // `h_flex` with children rather than a `Button`, and it declares no
    // `disabled` or `on_click` — the number input owns both.
    const stepButton = (/** @type {string} */ glyph, /** @type {string} */ label) =>
      h_flex()
        .flex_1()
        .w(tokens.space(16))
        .items_center()
        .justify_center()
        .border_l(tokens.spacing.hairline)
        .border_color(states.normalBorder)
        .text_size(tokens.font.caption)
        .text_color(colors.muted_foreground)
        .accessibility_label(label)
        .hover((appearance) =>
          appearance.bg(states.hoverFill).text_color(colors.foreground),
        )
        .active((appearance) => appearance.bg(states.pressedFill))
        .child(glyph);

    return BaseNumberInput.new(this.#state)
      // Stacked at one edge rather than one button on each side of the value:
      // the figure stays where the eye returns to it while stepping, and the
      // control keeps the width the shell reserved for it.
      .controls_right()
      .h(dimensions.extent)
      .w(this.#width ?? tokens.spacing.numberFieldWidth)
      .pl(tokens.spacing.xs)
      .rounded(tokens.cornerRadius)
      .border(states.normalBorderWidth)
      .border_color(states.normalBorder)
      .bg(states.normalFill)
      .text_size(dimensions.fontSize)
      .text_color(colors.foreground)
      .focus((appearance) =>
        appearance
          .border(states.focusBorderWidth)
          .border_color(states.focusBorder),
      )
      // An adornment beside the editor, which is what the frame takes a plain
      // child as. The `input` slot is left empty so the frame draws the bare
      // editor for the state it was built from.
      .when(this.#suffix !== "", (element) =>
        element.child(
          mutedElement(this.#suffix, cx)
            .flex_none()
            .pr(tokens.spacing.sm)
            .text_size(dimensions.fontSize),
        ),
      )
      .decrement_button(stepButton("▼", decrementLabel))
      .increment_button(stepButton("▲", incrementLabel));
  }
}

export class AvatarButton {
  #id;
  #initials;
  #asset;
  #description;
  /** @type {import("gpui").Color | undefined} */
  #tint;
  #selected = false;
  #quiet = false;
  #disabled = false;
  /** @type {ControlSize} */
  #size = "medium";
  /** @type {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} */
  #onClick;

  /** @param {string} id */
  constructor(id) { this.#id = stableId("AvatarButton", id); }

  /** @param {string} text one or two characters */
  initials(text) { this.#initials = text; return this; }

  /** @param {string} asset complete application-root-relative asset path */
  icon(asset) { this.#asset = asset; return this; }

  /** @param {string} text the accessible name and the tooltip */
  description(text) { this.#description = text; return this; }

  /** @param {import("gpui").Color | undefined} color */
  tint(color) { this.#tint = color; return this; }

  /** @param {boolean} [value] the menu this trigger opens is showing */
  selected(value = true) { this.#selected = value; return this; }

  /** @param {boolean} [value] supporting chrome: muted until pointed at */
  quiet(value = true) { this.#quiet = value; return this; }

  /** @param {boolean} [value] */
  disabled(value = true) { this.#disabled = value; return this; }

  /** @param {string} value */
  size(value) { this.#size = controlSize("AvatarButton", value); return this; }

  /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
  onClick(callback) {
    this.#onClick = optionalCallback("AvatarButton", "onClick", callback);
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const description = requiredText(
      "AvatarButton",
      "description",
      this.#description,
    );
    // The compact command's own padding, so the mark sits inside the button's
    // box rather than fighting it for the same edge.
    const inset = style().space(2);
    const avatar = new Avatar().extent(
      Math.max(1, sizeStyle(this.#size).extent - inset * 2),
    );
    if (this.#initials) avatar.initials(this.#initials);
    if (this.#asset) avatar.icon(this.#asset);
    if (this.#tint) avatar.tint(this.#tint);
    return buildCompactCommand(
      {
        id: this.#id,
        content: avatar.build(cx),
        description,
        outlined: false,
        bordered: true,
        selected: this.#selected,
        quiet: this.#quiet,
        disabled: this.#disabled,
        loading: false,
        loadingLabel: "",
        size: this.#size,
        onClick: this.#onClick,
      },
      cx,
    );
  }
}
