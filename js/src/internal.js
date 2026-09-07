// @ts-check

/** @param {string} component @param {unknown} id @returns {string} */
export function stableId(component, id) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error(`${component} id must be a non-blank string`);
  }
  return id;
}

/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @returns {string}
 */
export function requiredText(component, field, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${component} ${field} must be a non-blank string`);
  }
  return value;
}

/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @param {{allowEmpty?: boolean}} [options]
 * @returns {string | undefined}
 */
export function optionalText(component, field, value, options = {}) {
  if (value === undefined) return undefined;
  if (options.allowEmpty === true && value === "") return "";
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${component} ${field} must be a non-blank string when supplied`,
    );
  }
  return value;
}

/** @param {unknown} value */
function isRenderable(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = /** @type {Record<string, unknown>} */ (value);
  const elementLike =
    typeof candidate.map === "function" && typeof candidate.child === "function";
  const entityLike =
    typeof candidate.set_props === "function" &&
    typeof candidate.release === "function";
  return elementLike || entityLike;
}

/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @returns {any}
 */
export function requiredRenderable(component, field, value) {
  if (!isRenderable(value)) {
    throw new Error(`${component} ${field} must be a GPUI element or entity`);
  }
  return value;
}

/**
 * Optional slots deliberately treat every falsy value as omitted.
 * @param {string} component
 * @param {string} field
 * @param {unknown} value
 * @returns {any}
 */
export function optionalRenderable(component, field, value) {
  return value ? requiredRenderable(component, field, value) : value;
}

/**
 * @param {string} component
 * @param {string} field
 * @param {unknown} values
 * @returns {any[]}
 */
export function requiredRenderables(component, field, values) {
  if (!Array.isArray(values)) {
    throw new Error(
      `${component} ${field} must be an array of GPUI elements or entities`,
    );
  }
  return values.map((value, index) =>
    requiredRenderable(component, `${field}[${index}]`, value),
  );
}

/**
 * @param {string} component
 * @param {string} field
 * @template {Function | undefined} T
 * @param {T} callback
 * @returns {T}
 */
export function optionalCallback(component, field, callback) {
  if (callback !== undefined && typeof callback !== "function") {
    throw new Error(`${component} ${field} must be a function when supplied`);
  }
  return callback;
}
