declare const SIZES: readonly ["caption", "bodySmall", "body", "subtitle", "title", "heading", "display", "displayLarge"];
export type TextSize = typeof SIZES[number];
/** @typedef {typeof SIZES[number]} TextSize */
/**
 * @param {string} component
 * @param {unknown} value
 * @returns {TextSize}
 */
export declare function textSize(component: string, value: unknown): TextSize;
/**
 * The shared body of every text class.
 *
 * The four roles differ only in their default step and their resting colour,
 * so both arrive through the constructor and the builders and `build` are
 * written once. A subclass adds no method of its own, which is what keeps the
 * four roles from drifting into four slightly different text elements.
 */
declare class TextRun {
    #private;
    /**
     * @param {string} component
     * @param {TextSize} size
     * @param {(cx: import("gpui").Context) => import("gpui").Color} resting
     * @param {string} [value]
     */
    constructor(component: string, size: TextSize, resting: (cx: import("gpui").Context) => import("gpui").Color, value?: string);
    /** @param {string} value */
    text(value: string): this;
    /** @param {string} value one step of the shared type scale */
    size(value: string): this;
    /** @param {boolean} [value] */
    strong(value?: boolean): this;
    /** @param {boolean} [value] clip to one line rather than wrapping */
    truncate(value?: boolean): this;
    /**
     * A colour the semantic tokens cannot supply — a reading, not a state.
     * @param {import("gpui").Color | undefined} value
     */
    tone(value: import("gpui").Color | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/** Body copy in the foreground token: a name, a figure, a row's subject. */
export declare class Label extends TextRun {
    /** @param {string} [value] */
    constructor(value?: string);
}
/** Secondary copy: a field label, a hint, a reading's unit. */
export declare class MutedText extends TextRun {
    /** @param {string} [value] */
    constructor(value?: string);
}
/** The name of a page, a card or a dialog. */
export declare class Title extends TextRun {
    /** @param {string} [value] */
    constructor(value?: string);
}
/**
 * The heading over a group of rows or a column of figures.
 *
 * Small, muted and bold — the way a terminal writes small caps. The casing is
 * the caller's: a section label is often a column title that other code looks
 * up by the words as they were written, and folding it here would make the
 * drawn text and the key disagree.
 */
export declare class SectionLabel extends TextRun {
    /** @param {string} [value] */
    constructor(value?: string);
}
/**
 * A run of text built from a plain string, for the slots inside other
 * components that take copy rather than an element.
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @param {import("gpui").Context} cx
 * @param {{muted?: boolean, size?: TextSize, strong?: boolean, optional?: boolean}} [options]
 */
export declare function copy(component: string, field: string, value: unknown, cx: import("gpui").Context, options?: {
    muted?: boolean;
    size?: TextSize;
    strong?: boolean;
    optional?: boolean;
}): import("gpui").Element;
export {};
