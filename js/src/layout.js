// @ts-check

import { div } from "gpui";
import { h_flex, v_flex } from "gpui-base";
import {
  optionalRenderable,
  optionalText,
  requiredRenderable,
  requiredRenderables,
  requiredText,
  stableId,
} from "./internal.js";
import { resolveSurfaceColor, style } from "./style.js";
import { Label, MutedText } from "./text.js";
import { role } from "./theme.js";

/** @param {string} component @param {Array<[string, unknown]>} entries */
function optionalSlots(component, entries) {
  return entries
    .filter(([, value]) => Boolean(value))
    .map(([field, value]) => optionalRenderable(component, field, value));
}

export class AppShell {
  #top;
  #content;
  #bottom;

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  top(element) {
    this.#top = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  content(element) {
    this.#content = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  bottom(element) {
    this.#bottom = element;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const contentElement = requiredRenderable(
      "AppShell",
      "content",
      this.#content,
    );
    const content = v_flex()
      .id("application-content")
      .flex_1()
      .min_w_0()
      .min_h_0()
      .overflow_hidden()
      .child(contentElement);

    return v_flex()
      .id("application-frame")
      .size_full()
      .min_w_0()
      .min_h_0()
      .font_family(style().fontFamily)
      .text_size(style().font.body)
      .bg(cx.theme().colors.background)
      .text_color(cx.theme().colors.foreground)
      .children(optionalSlots("AppShell", [["top", this.#top]]))
      .child(content)
      .children(optionalSlots("AppShell", [["bottom", this.#bottom]]));
  }
}

export class TitleBar {
  #brand;
  #center;
  #actions;

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  brand(element) {
    this.#brand = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  center(element) {
    this.#center = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  actions(element) {
    this.#actions = element;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    const inset = tokens.space(14);
    return h_flex()
      .id("application-top-bar")
      .h(tokens.space(48))
      .flex_none()
      .items_center()
      .justify_between()
      .gap(inset)
      // The leading edge yields to the host's own window buttons where it has
      // any: on macOS the brand would otherwise start underneath the close,
      // minimise and zoom controls. `max` rather than a replacement, so a
      // large spacing scale still gets its own inset when that is the wider
      // of the two.
      .pl(Math.max(inset, tokens.spacing.windowControlsInset))
      .pr(inset)
      .border_b(style().spacing.hairline)
      .border_color(role("separator", cx.theme().colors.border))
      .bg(cx.theme().colors.background)
      .children(optionalSlots("TitleBar", [
        ["brand", this.#brand],
        ["center", this.#center],
        ["actions", this.#actions],
      ]));
  }
}

export class StatusBar {
  #status;
  #hints;
  #leadsWithIcon = false;

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  status(element) {
    this.#status = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  hints(element) {
    this.#hints = element;
    return this;
  }

  /** @param {boolean} [value] */
  leadsWithIcon(value = true) {
    this.#leadsWithIcon = value;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    return h_flex()
      .id("application-bottom-bar")
      .h(style().space(28))
      .flex_none()
      .items_center()
      .justify_between()
      .gap(style().spacing.controlGap)
      .pl(style().space(this.#leadsWithIcon === true ? 8 : 14))
      .pr(style().space(12))
      .border_t(style().spacing.hairline)
      .border_color(role("separator", cx.theme().colors.border))
      .bg(cx.theme().colors.background)
      .children(optionalSlots("StatusBar", [
        ["status", this.#status],
        ["hints", this.#hints],
      ]));
  }
}

export class ActionBar {
  #id;
  #actions;
  #status;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("ActionBar", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  actions(element) {
    this.#actions = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  status(element) {
    this.#status = element;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    return h_flex()
      .id(this.#id)
      .role("toolbar")
      .flex_none()
      .items_center()
      .gap(style().spacing.controlGap)
      .px(style().spacing.panelPadding)
      .py(style().spacing.sm)
      .border_t(style().spacing.hairline)
      .border_color(role("separator", cx.theme().colors.border))
      .children(optionalSlots("ActionBar", [["actions", this.#actions]]))
      .child(div().flex_1())
      .children(optionalSlots("ActionBar", [["status", this.#status]]));
  }
}

export class PanelHeader {
  #id;
  #heading;
  #actions;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("PanelHeader", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  heading(element) {
    this.#heading = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  actions(element) {
    this.#actions = element;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const heading = requiredRenderable(
      "PanelHeader",
      "heading",
      this.#heading,
    );
    return h_flex()
      .id(this.#id)
      .role("section_header")
      .flex_none()
      .items_center()
      .justify_between()
      .gap(style().spacing.controlGap)
      .h(style().space(34))
      .px(style().spacing.rowPaddingX)
      .border_b(style().spacing.hairline)
      .border_color(role("separator", cx.theme().colors.border))
      .child(heading)
      .children(optionalSlots("PanelHeader", [["actions", this.#actions]]));
  }
}

export class CenteredWorkspace {
  #id;
  #content;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("CenteredWorkspace", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  content(element) {
    this.#content = element;
    return this;
  }

  /** @param {import("gpui").Context} _cx */
  build(_cx) {
    const content = requiredRenderable(
      "CenteredWorkspace",
      "content",
      this.#content,
    );
    return h_flex()
      .id(this.#id)
      .items_start()
      .size_full()
      .min_w_0()
      .min_h_0()
      .justify_center()
      .overflow_y_scroll()
      .child(content);
  }
}

export class PageColumn {
  #id;
  #children = [];
  #maxWidth;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("PageColumn", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("PageColumn", "child", element));
    return this;
  }

  /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
  children(elements) {
    this.#children.push(...requiredRenderables("PageColumn", "children", elements));
    return this;
  }

  /** @param {import("gpui").DefiniteLength} value */
  maxWidth(value) {
    this.#maxWidth = value;
    return this;
  }

  /** @param {import("gpui").Context} _cx */
  build(_cx) {
    return v_flex()
      .id(this.#id)
      .w_full()
      .max_w(this.#maxWidth ?? style().space(560))
      .gap(style().spacing.panelGap)
      .p(style().spacing.panelPadding)
      .children([...this.#children]);
  }
}

export class Surface {
  #children = [];

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("Surface", "child", element));
    return this;
  }

  /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
  children(elements) {
    this.#children.push(...requiredRenderables("Surface", "children", elements));
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    return v_flex()
      .min_w_0()
      .min_h_0()
      .bg(cx.theme().colors.surface)
      .border(style().spacing.hairline)
      .border_color(cx.theme().colors.border)
      .rounded(style().cornerRadius)
      .overflow_hidden()
      .children([...this.#children]);
  }
}

export class PopupSurface {
  #id;
  #children = [];

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("PopupSurface", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  child(element) {
    this.#children.push(requiredRenderable("PopupSurface", "child", element));
    return this;
  }

  /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
  children(elements) {
    this.#children.push(...requiredRenderables("PopupSurface", "children", elements));
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const tokens = style();
    return v_flex()
      .id(this.#id)
      .flex_none()
      .p(tokens.space(4))
      .gap(tokens.space(2))
      .rounded(tokens.cornerRadius)
      // A popup is a raised surface, so with nothing named it takes the
      // surface token rather than the window's ground. Omarchy's own themes
      // set the two to the same colour on purpose -- the window is one
      // surface, separated by hairlines -- so this changes nothing there and
      // stops a menu reading as a hole under any theme that separates them.
      .bg(
        resolveSurfaceColor(
          tokens,
          tokens.surfaces.popupBackground,
          cx.theme().colors.surface,
          tokens.surfaces.popupBackgroundAlpha,
        ),
      )
      .border(tokens.state.normalBorderWidth)
      // A theme that names `popups.border` usually points it at Hyprland's
      // active-border, so a menu's edge matches the frame the compositor
      // draws. With nothing named, the fallback is the border every other
      // surface uses -- not the focus ring, which would frame a resting menu
      // in the one colour that is supposed to mean "the keyboard is here".
      .border_color(
        resolveSurfaceColor(
          tokens,
          tokens.surfaces.popupBorder,
          cx.theme().colors.border,
          tokens.surfaces.popupBorderAlpha,
        ),
      )
      .text_color(
        resolveSurfaceColor(
          tokens,
          tokens.surfaces.popupText,
          cx.theme().colors.foreground,
        ),
      )
      .children([...this.#children]);
  }
}

/**
 * A titled region of a workspace: a `Surface` whose first row is a
 * `PanelHeader`, and whose body is the caller's content.
 *
 * `note` is what the title alone cannot say — a count, a currency, a window of
 * days. It sits *with* the heading rather than across the row from it, because
 * it qualifies the title; opposite the title it reads as a second control.
 *
 * `grow` is how the body is sized. A pane whose content fills whatever it is
 * given — a table, a plot, a tape — grows into the panel; a pane that is a
 * fixed block of readings takes its own height instead, because a block of
 * readings stretched to fill a tall window leaves a band of empty panel under
 * its last row.
 */
export class Panel {
  #id;
  #title;
  #note;
  #accessory;
  #content;
  #grow = true;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("Panel", id);
  }

  /** @param {string} text */
  title(text) {
    this.#title = text;
    return this;
  }

  /** @param {string} text */
  note(text) {
    this.#note = text;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  accessory(element) {
    this.#accessory = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  content(element) {
    this.#content = element;
    return this;
  }

  /** @param {boolean} [value] */
  grow(value = true) {
    this.#grow = value === true;
    return this;
  }

  /** @param {import("gpui").Context} cx */
  build(cx) {
    const title = requiredText("Panel", "title", this.#title);
    const note = optionalText("Panel", "note", this.#note);
    const content = requiredRenderable("Panel", "content", this.#content);
    const tokens = style();

    const heading = h_flex()
      .items_baseline()
      .min_w_0()
      .gap(tokens.spacing.labelGap)
      .child(new Label(title).size("subtitle").strong().build(cx))
      // One step down from the title it qualifies: a note that matched the
      // heading would read as a second heading.
      .when(Boolean(note), (element) =>
        element.child(
          new MutedText(String(note)).size("bodySmall").truncate().build(cx),
        ),
      );

    const header = new PanelHeader(`${this.#id}-header`).heading(heading);
    if (this.#accessory) header.actions(this.#accessory);

    return new Surface()
      .child(header.build(cx))
      .child(
        this.#grow
          ? v_flex()
              .id(`${this.#id}-content`)
              .flex_1()
              .min_h_0()
              .child(content.flex_1().min_h_0())
          : content.flex_none(),
      )
      .build(cx)
      .id(this.#id)
      .min_w_0()
      .min_h_0();
  }
}

/**
 * A row of controls attached to the content below it.
 *
 * Unlike `ActionBar` it draws no rule of its own and takes the row inset
 * rather than the panel inset, so a filter box, the first column heading and
 * the first cell under it share one content edge.
 */
export class Toolbar {
  #id;
  #leading;
  #trailing;

  /** @param {string} id */
  constructor(id) {
    this.#id = stableId("Toolbar", id);
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  leading(element) {
    this.#leading = element;
    return this;
  }

  /** @param {import("gpui").Element | import("gpui").Entity} element */
  trailing(element) {
    this.#trailing = element;
    return this;
  }

  /** @param {import("gpui").Context} _cx */
  build(_cx) {
    const tokens = style();
    return h_flex()
      .id(this.#id)
      .role("toolbar")
      .flex_none()
      .items_center()
      .justify_between()
      .gap(tokens.spacing.controlGap)
      .px(tokens.spacing.rowPaddingX)
      .py(tokens.spacing.sm)
      .children(
        optionalSlots("Toolbar", [
          ["leading", this.#leading],
          ["trailing", this.#trailing],
        ]),
      );
  }
}
