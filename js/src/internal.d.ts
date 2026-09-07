/** @param {string} component @param {unknown} id @returns {string} */
export declare function stableId(component: string, id: unknown): string;
/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @returns {string}
 */
export declare function requiredText(component: string, field: string, value: unknown): string;
/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @param {{allowEmpty?: boolean}} [options]
 * @returns {string | undefined}
 */
export declare function optionalText(component: string, field: string, value: unknown, options?: {
    allowEmpty?: boolean;
}): string | undefined;
/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @returns {any}
 */
export declare function requiredRenderable(component: string, field: string, value: unknown): any;
/**
 * Optional slots deliberately treat every falsy value as omitted.
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @returns {any}
 */
export declare function optionalRenderable(component: string, field: string, value: unknown): any;
/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} values
 * @returns {any[]}
 */
export declare function requiredRenderables(component: string, field: string, values: unknown): any[];
/**
 * @param {string} component
 * @param {string} field
 * @template {Function | undefined} T
 * @param {T} callback
 * @returns {T}
 */
export declare function optionalCallback<T extends Function | undefined>(component: string, field: string, callback: T): T;
