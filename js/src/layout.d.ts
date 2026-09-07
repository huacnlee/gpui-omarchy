export declare class AppShell {
    #private;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    top(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    content(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    bottom(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class TitleBar {
    #private;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    brand(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    center(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    actions(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class StatusBar {
    #private;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    status(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    hints(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {boolean} [value] */
    leadsWithIcon(value?: boolean): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class ActionBar {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    actions(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    status(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class PanelHeader {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    heading(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    actions(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class CenteredWorkspace {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    content(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} _cx */
    build(_cx: import("gpui").Context): import("gpui").Element;
}
export declare class PageColumn {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    child(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
    children(elements: Array<import("gpui").Element | import("gpui").Entity>): this;
    /** @param {import("gpui").DefiniteLength} value */
    maxWidth(value: import("gpui").DefiniteLength): this;
    /** @param {import("gpui").Context} _cx */
    build(_cx: import("gpui").Context): import("gpui").Element;
}
export declare class Surface {
    #private;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    child(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
    children(elements: Array<import("gpui").Element | import("gpui").Entity>): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class PopupSurface {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    child(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
    children(elements: Array<import("gpui").Element | import("gpui").Entity>): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
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
export declare class Panel {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    title(text: string): this;
    /** @param {string} text */
    note(text: string): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    accessory(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    content(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {boolean} [value] */
    grow(value?: boolean): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * A row of controls attached to the content below it.
 *
 * Unlike `ActionBar` it draws no rule of its own and takes the row inset
 * rather than the panel inset, so a filter box, the first column heading and
 * the first cell under it share one content edge.
 */
export declare class Toolbar {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    leading(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    trailing(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} _cx */
    build(_cx: import("gpui").Context): import("gpui").Element;
}
