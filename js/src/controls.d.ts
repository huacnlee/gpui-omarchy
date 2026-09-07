declare const SIZES: readonly ["xsmall", "small", "medium", "large"];
export type ControlSize = typeof SIZES[number];
export declare class Button {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    label(text: string): this;
    /** @param {string} asset complete application-root-relative asset path */
    icon(asset: string): this;
    /**
     * What the label alone cannot say -- most often the keyboard route to the
     * same action. A compact command carries this in its `description`, which is
     * also its accessible name; a labelled button already has an accessible name
     * and needs only the hint.
     * @param {string} text
     */
    tooltip(text: string): this;
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
    tone(color: import("gpui").Color | undefined): this;
    outlined(): this;
    /** @param {boolean} [value] */
    bordered(value?: boolean): this;
    /** @param {boolean} [value] */
    selected(value?: boolean): this;
    /** @param {boolean} [value] the one control a screen wants pressed */
    accent(value?: boolean): this;
    /** @param {boolean} [value] */
    danger(value?: boolean): this;
    /** @param {boolean} [value] */
    disabled(value?: boolean): this;
    /** @param {boolean} [value] */
    loading(value?: boolean): this;
    /** @param {string} text */
    loadingLabel(text: string): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class IconButton {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} asset complete application-root-relative asset path */
    icon(asset: string): this;
    /** @param {string} text */
    description(text: string): this;
    outlined(): this;
    /** @param {boolean} [value] */
    bordered(value?: boolean): this;
    /** @param {boolean} [value] */
    selected(value?: boolean): this;
    /** @param {boolean} [value] supporting chrome: muted until pointed at */
    quiet(value?: boolean): this;
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
    tone(color: import("gpui").Color | undefined): this;
    /** @param {boolean} [value] */
    disabled(value?: boolean): this;
    /** @param {boolean} [value] */
    loading(value?: boolean): this;
    /** @param {string} text */
    loadingLabel(text: string): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class GlyphButton {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    glyph(text: string): this;
    /** @param {string} text */
    description(text: string): this;
    outlined(): this;
    /** @param {boolean} [value] */
    bordered(value?: boolean): this;
    /** @param {boolean} [value] */
    selected(value?: boolean): this;
    /** @param {boolean} [value] supporting chrome: muted until pointed at */
    quiet(value?: boolean): this;
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
    tone(color: import("gpui").Color | undefined): this;
    /** @param {boolean} [value] */
    disabled(value?: boolean): this;
    /** @param {boolean} [value] */
    loading(value?: boolean): this;
    /** @param {string} text */
    loadingLabel(text: string): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class MenuItem {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    label(text: string): this;
    /** @param {string} text */
    detail(text: string): this;
    /** @param {string} asset complete application-root-relative asset path */
    icon(asset: string): this;
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
    selected(value?: boolean): this;
    /** @param {boolean} [value] */
    danger(value?: boolean): this;
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
    tone(color: import("gpui").Color | undefined): this;
    /** @param {boolean} [value] */
    disabled(value?: boolean): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
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
export declare class Tabs {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /**
     * Encloses the choices and fills the current one: a value, not a place.
     *
     * First in the chain, because it is what this run of tabs *is*. What
     * follows -- the choices, which one is current, what to do when it changes
     * -- is the same either way, and a shape declared after them reads as an
     * afterthought rather than as the decision it is.
     */
    segmented(value?: boolean): this;
    /** @param {{ value: string, label: string }[]} items */
    items(items: {
        value: string;
        label: string;
    }[]): this;
    /** @param {string} value the item currently chosen */
    value(value: string): this;
    /** @param {(value: string, cx: import("gpui").Context) => void} callback */
    onChange(callback: (value: string, cx: import("gpui").Context) => void): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {string} text what this run of tabs is choosing, for a screen reader */
    accessibilityLabel(text: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class FieldRow {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    label(text: string): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    control(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class FormField {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    label(text: string): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    control(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {string} text */
    helper(text: string): this;
    /** @param {string} message */
    error(message: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class Separator {
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class MenuSeparator {
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class Keycap {
    #private;
    /** @param {string} value */
    constructor(value: string);
    /**
     * The key is physically down. A cap that reports this is reporting the
     * keyboard, not the interface, so it takes the focus chrome rather than the
     * selected chrome: nothing here is selectable.
     * @param {boolean} [value]
     */
    pressed(value?: boolean): this;
    /**
     * Supporting metadata rather than a control — a hint strip along the bottom
     * of a window. Only the resting fill fades; the label and the border stay
     * fully legible, and a pressed cap keeps its full-strength response.
     * @param {boolean} [value]
     */
    quiet(value?: boolean): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class KeyHints {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} key @param {string} label */
    hint(key: string, label: string): this;
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
    hints(entries: Array<{
        key: string;
        label: string;
    }>): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * A link out of the application.
 *
 * Underlined as well as tinted, because a link identified by colour alone is
 * not a link to a reader who cannot separate it from the body text around it.
 */
export declare class ExternalLink {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    label(text: string): this;
    /** @param {string} url */
    href(url: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
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
export declare class TextField {
    #private;
    /** @param {import("gpui-base").InputState} value */
    state(value: import("gpui-base").InputState): this;
    /** @param {string} text the unit this field's value is in */
    suffix(text: string): this;
    /** @param {string | number} value */
    width(value: string | number): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
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
export declare class NumberInput {
    #private;
    /** @param {import("gpui-base").InputState} value */
    state(value: import("gpui-base").InputState): this;
    /** @param {string} text what a screen reader announces for the step up */
    incrementLabel(text: string): this;
    /** @param {string} text what a screen reader announces for the step down */
    decrementLabel(text: string): this;
    /** @param {string} text the unit this value is in */
    suffix(text: string): this;
    /** @param {string | number} value defaults to the shell's number-field width */
    width(value: string | number): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class AvatarButton {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text one or two characters */
    initials(text: string): this;
    /** @param {string} asset complete application-root-relative asset path */
    icon(asset: string): this;
    /** @param {string} text the accessible name and the tooltip */
    description(text: string): this;
    /** @param {import("gpui").Color | undefined} color */
    tint(color: import("gpui").Color | undefined): this;
    /** @param {boolean} [value] the menu this trigger opens is showing */
    selected(value?: boolean): this;
    /** @param {boolean} [value] supporting chrome: muted until pointed at */
    quiet(value?: boolean): this;
    /** @param {boolean} [value] */
    disabled(value?: boolean): this;
    /** @param {string} value */
    size(value: string): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export {};
