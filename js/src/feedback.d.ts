export declare class EmptyState {
    #private;
    /** @param {string} value */
    heading(value: string): this;
    /** @param {string} value */
    hint(value: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export declare class StatusItem {
    #private;
    /** @param {string} value */
    label(value: string): this;
    /** @param {string} value */
    loadingLabel(value: string): this;
    /** @param {"ready" | "loading" | "error"} value */
    state(value: "ready" | "loading" | "error"): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
declare const TONES: readonly ["neutral", "accent", "success", "warning", "danger"];
export type FeedbackTone = typeof TONES[number];
/**
 * A compact state marker: an optional dot and a word.
 *
 * The dot is never the whole signal — the word beside it says the same thing —
 * because a badge that reports a state in colour alone reports nothing to a
 * reader who cannot separate the two hues.
 */
export declare class Badge {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    label(text: string): this;
    /** @param {string} value */
    tone(value: string): this;
    /** @param {import("gpui").Color | undefined} value a palette the tokens cannot supply */
    color(value: import("gpui").Color | undefined): this;
    /** @param {boolean} [value] draw the leading state dot */
    dot(value?: boolean): this;
    /** @param {boolean} [value] a transitional state, held back from full emphasis */
    quiet(value?: boolean): this;
    /** @param {string} text the tooltip and accessible detail */
    description(text: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * A message the caller must read before carrying on.
 *
 * The rail down the leading edge is what separates an alert from a paragraph
 * that happens to be red: colour alone puts the whole burden on hue, and a
 * bordered block with no mark reads as a quote. The copy wraps — an error from
 * a server is a sentence, not a label, and truncating it hides the half that
 * says what to do.
 */
export declare class Alert {
    #private;
    /** @param {string} id */
    constructor(id: string);
    /** @param {string} text */
    message(text: string): this;
    /** @param {string} value */
    tone(value: string): this;
    /** @param {import("gpui").Color | undefined} value */
    color(value: import("gpui").Color | undefined): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
/**
 * One place in a numbered errand.
 *
 * A task with three parts — open a page, type a code, approve it — says so,
 * rather than leaving the count to be inferred from the order of the controls
 * under it.
 */
export declare class Step {
    #private;
    /** @param {number} index the step's one-based place */
    constructor(index: number);
    /** @param {string} text */
    title(text: string): this;
    /** @param {import("gpui").Context} cx */
    build(cx: import("gpui").Context): import("gpui").Element;
}
export {};
