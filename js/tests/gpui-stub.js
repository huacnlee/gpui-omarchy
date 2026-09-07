// @ts-check

/** @type {Array<{name: string, args: unknown[]}>} */
export const calls = [];

export function record(name, ...args) {
  calls.push({ name, args });
  return { name, args };
}

export function reset() {
  calls.length = 0;
}

/** @typedef {{method: string, args: unknown[], style?: any}} ElementCall */

/**
 * A chainable element recording only the gpui operations our component tests
 * observe. It deliberately models the library boundary, not gpui itself.
 * @param {string} name
 * @param {unknown[]} [args]
 */
export function element(name, args = []) {
  /** @type {ElementCall[]} */
  const elementCalls = [];
  const target = { name, args, calls: elementCalls };
  /** @type {any} */
  let proxy;
  proxy = new Proxy(target, {
    get(value, property) {
      if (property in value) return value[/** @type {keyof typeof value} */ (property)];
      return (...methodArgs) => {
        /** @type {ElementCall} */
        const call = { method: String(property), args: methodArgs };
        if (property === "when") {
          // Only the condition is recorded. The callback is a fresh closure on
          // every build, so keeping it would make two structurally identical
          // builds compare unequal and hide the repeatability the tests check.
          const [condition, callback] = methodArgs;
          call.args = [Boolean(condition)];
          elementCalls.push(call);
          if (condition && typeof callback === "function") {
            return callback(proxy);
          }
          return proxy;
        }
        elementCalls.push(call);
        if (["hover", "active", "focus"].includes(String(property))) {
          const [callback] = methodArgs;
          if (typeof callback === "function") {
            call.style = element(`${String(property)}_style`);
            callback(call.style);
          }
        }
        return proxy;
      };
    },
  });
  return proxy;
}

/**
 * Resolve the style visible in one runtime interaction state. Base declarations
 * are applied first and the requested state declarations override them, which
 * catches composed-state regressions that inspecting a detached style alone
 * cannot detect.
 * @param {any} value
 * @param {"hover" | "active" | "focus"} state
 */
export function resolvedStyle(value, state) {
  /** @type {Record<string, unknown>} */
  const resolved = {};
  const stateCall = value.calls.find((call) => call.method === state);
  for (const call of value.calls) {
    if (["bg", "border", "border_color", "text_color", "opacity"].includes(call.method)) {
      resolved[call.method] = call.args[0];
    }
  }
  for (const call of stateCall?.style?.calls ?? []) {
    if (["bg", "border", "border_color", "text_color", "opacity"].includes(call.method)) {
      resolved[call.method] = call.args[0];
    }
  }
  return resolved;
}

export const div = () => element("div");
/** @param {string} asset */
export const svg = (asset) => element("svg", [asset]);
export const h_flex = () => element("h_flex");
export const v_flex = () => element("v_flex");
export const Button = { new: (id) => element("Button", [id]) };
export const Input = { new: (state) => element("Input", [state]) };
export const InputState = { new: (options) => ({ ...options }) };
export const TextareaState = { new: (options) => ({ ...options }) };
export const CalendarState = { new: (options) => ({ ...options }) };
export const SliderState = { new: (options) => ({ ...options }) };
export const OtpState = { new: (length) => ({ length }) };
export const NumberInput = { new: (state) => element("NumberInput", [state]) };
export class View {}
export const set_theme = (theme) => record("set_theme", theme);
export const Link = { new: (id) => element("Link", [id]) };
export const Avatar = { new: () => element("Avatar") };
export const AvatarFallback = { new: () => element("AvatarFallback") };
export const TableHeader = { new: (id) => element("TableHeader", [id]) };
export const TableHead = { new: (id, column) => element("TableHead", [id, column]) };
export const Tab = { new: (id) => element("Tab", [id]) };
export const Tabs = { new: (id) => element("Tabs", [id]) };
export const TableRow = { new: (id, index) => element("TableRow", [id, index]) };
export const TableCell = { new: (id, column) => element("TableCell", [id, column]) };
export const Accordion = { new: (id) => element("Accordion", [id]) };
export const AccordionItem = { new: () => element("AccordionItem") };
export const AccordionHeader = { new: (trigger) => element("AccordionHeader", [trigger]) };
export const AccordionTrigger = { new: (id) => element("AccordionTrigger", [id]) };
export const AccordionPanel = { new: () => element("AccordionPanel") };
