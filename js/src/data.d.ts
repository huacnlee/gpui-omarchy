export declare class ListRow {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {boolean} [value] */
    selected(value?: boolean): this;
    /** @param {boolean} [value] */
    disabled(value?: boolean): this;
    /** @param {((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined} callback */
    onClick(callback: ((event: import("gpui").ClickEvent, cx: import("gpui").Context) => void) | undefined): this;
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    child(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
    children(elements: Array<import("gpui").Element | import("gpui").Entity>): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * The badge that opens a row, or stands in for an account in a title bar.
 *
 * `gpui-base`'s `Avatar` picks between an image and a fallback and draws
 * nothing else, so the shape, the size and the type all belong to a
 * presentation layer. This one is a square block rather than a disc: the
 * Omarchy kit has no circles in it, and initials in a filled square is what a
 * terminal writes a badge as.
 *
 * `.initials(text)` and `.icon(asset)` are the two fallbacks, and exactly one
 * is required — an avatar with neither has nothing to draw.
 *
 * `.tint(color)` supplies a categorical hue the semantic tokens cannot know,
 * such as one derived from the subject's own name, and it is also what decides
 * whether the badge draws a box at all. A tinted avatar is a filled square:
 * the fill *is* the identity, which is what makes a column of them scannable.
 * An untinted one draws only its mark, because it has no identity to fill and
 * is almost always sitting inside something that already frames it — an
 * `AvatarButton`, a row, a header. Two nested boxes is one box too many.
 */
export declare class Avatar {
    #private;
    /** @param {string} text one or two characters */
    initials(text: string): this;
    /** @param {string} asset complete application-root-relative asset path */
    icon(asset: string): this;
    /** @param {string} text the accessible name */
    description(text: string): this;
    /** @param {import("gpui").Color | undefined} color */
    tint(color: import("gpui").Color | undefined): this;
    /** @param {number} value the badge's drawn extent, in scaled pixels */
    extent(value: number): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * One reading: a muted field label above its figure.
 *
 * A basis rather than a width is what makes a row of these responsive without
 * a media query — two fit a narrow pane, four fit a wide one, and the row
 * rewraps instead of squeezing every figure into the same few pixels.
 */
export declare class Metric {
    #private;
    /** @param {string} [title] */
    constructor(title?: string);
    /** @param {string} text */
    title(text: string): this;
    /** @param {string} text */
    value(text: string): this;
    /** @param {import("gpui").Color | undefined} color a reading, not a state */
    tone(color: import("gpui").Color | undefined): this;
    /** @param {string} value the figure's step on the shared type scale */
    size(value: string): this;
    /** @param {number} value the wrapping basis, in scaled pixels */
    basis(value: number): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/** A wrapping row of `Metric`s: the same readings at any pane width. */
export declare class MetricGrid {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {import("gpui").Element | import("gpui").Entity} element */
    child(element: import("gpui").Element | import("gpui").Entity): this;
    /** @param {Array<import("gpui").Element | import("gpui").Entity>} elements */
    children(elements: Array<import("gpui").Element | import("gpui").Entity>): this;
    /** @param {import("gpui").Context} _cx */
    build(_cx: import("gpui").Context): import("gpui").Element;
}
/**
 * Label-and-value rows: the same pairs a `MetricGrid` draws as tiles, drawn as
 * a list instead, for a narrow column where a wrapping grid would be one tile
 * per line anyway.
 */
export declare class DefinitionList {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /**
     * @param {string} title
     * @param {string} value
     * @param {import("gpui").Color} [tone]
     */
    entry(title: string, value: string, tone?: import("gpui").Color): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * A value meant to be read aloud or typed somewhere else: a pairing code, a
 * fingerprint, a one-time token. Set large, spaced and boxed, because the
 * whole job of the element is that someone can transcribe it without making a
 * mistake.
 */
export declare class CodeBlock {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    value(text: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
