export type ColumnAlignment = "start" | "center" | "end";
export type ColumnSpec = {
    title: string;
    width?: string | number;
    align?: ColumnAlignment;
    hint?: string;
};
/** The height a table's header row is drawn at, on the shared spacing scale. */
export declare function tableHeaderHeight(): number;
/**
 * A table's header row group.
 *
 * `hint` is the pointer's affordance only: the accessible name is the visible
 * title, so a hint that repeats it adds nothing and a hint that contradicts it
 * is a bug. Use it where a column is abbreviated for width and the full
 * reading will not fit.
 */
export declare class TableHeaderRow {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {ColumnSpec} spec */
    column(spec: ColumnSpec): this;
    /** @param {ColumnSpec[]} specs */
    columns(specs: ColumnSpec[]): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * One body row of a table.
 *
 * The row registers no click handler unless one is given: a virtualized list
 * rebuilds its rows every scrolled frame, and a per-row callback there
 * accumulates one unreachable function per row per frame. Lists that scroll
 * carry a single item-click handler instead and leave this one presentational,
 * which is why `selected` still lights the row without `onClick`.
 */
export declare class TableRow {
    #private;
    /** @param {string} id @param {number} index the row's zero-based body position */
    constructor(id: string, index: number);
    /** @param {number} value */
    height(value: number): this;
    /** @param {boolean} [value] */
    selected(value?: boolean): this;
    /** @param {boolean} [value] the row's data has not arrived yet */
    dimmed(value?: boolean): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /**
     * @param {{width?: string | number, align?: ColumnAlignment}} options
     * @param {import("gpui").Element | import("gpui").Entity} element
     */
    cell(options: {
        width?: string | number;
        align?: ColumnAlignment;
    }, element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * A stack inside one cell: two lines of type where the column has room for a
 * value and the reading under it. Nothing but a pre-aligned column, but it is
 * the shape every dense table row reaches for, and writing it once keeps the
 * gap between the lines on the spacing scale.
 */
export declare class CellStack {
    #private;
    /** @param {ColumnAlignment} value */
    align(value: ColumnAlignment): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    child(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {import("gpui").Context} _cx */
    build(_cx: import("gpui").Context): import("gpui").Element;
}
