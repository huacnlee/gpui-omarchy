// @ts-check

import { expect, test } from "bun:test";
import * as ui from "../src/composition.js";

const root = new URL("../", import.meta.url);

/** @param {string} path */
async function read(path) {
  return await Bun.file(new URL(path, root)).text();
}

/** @param {string} directory */
function names(directory, pattern) {
  return [
    ...new Bun.Glob(pattern).scanSync({ cwd: new URL(directory, root).pathname }),
  ].sort();
}

/**
 * The names an application can import from a declaration file, taken from its
 * re-export lists. `src/index.d.ts` is generated, so this reads what it says
 * rather than what it was expected to say.
 * @param {string} source
 */
function declaredExports(source) {
  /** @type {Set<string>} */
  const found = new Set();
  for (const clause of source.matchAll(/export\s*\{([^}]*)\}/g))
    for (const entry of clause[1].split(",")) {
      const name = entry.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) found.add(name);
    }
  for (const declared of source.matchAll(
    /export\s+declare\s+(?:function|class|const)\s+([A-Za-z0-9_$]+)/g,
  ))
    found.add(declared[1]);
  return [...found].sort();
}

// gpui-shell fetches this repository as a Git dependency and runs no build step
// in it, so an application reads the checked-in declarations and nothing else.
// A generated file a commit behind its source is worse than no file: it
// type-checks the wrong API.
test("the committed declarations cover the public API", async () => {
  expect(declaredExports(await read("src/composition.d.ts"))).toEqual(
    Object.keys(ui).sort(),
  );
});

// Beside the sources rather than in a directory of their own, because that is
// where both of gpui-shell's editor links look. A symlinked checkout resolves
// `types` from package.json; the re-export package written where a platform
// refuses a symlink names `src/index.js` by path, and an editor answers that
// with the declaration file next to it.
test("every source module has its declaration beside it", () => {
  expect(names("src/", "*.d.ts")).toEqual(
    names("src/", "*.js").map((name) => name.replace(/\.js$/, ".d.ts")),
  );
});

test("package.json points applications at the declarations", async () => {
  const manifest = JSON.parse(await read("package.json"));

  expect(manifest.types).toBe("src/index.d.ts");
  expect(manifest.main).toBe("src/index.js");
  expect(await Bun.file(new URL(manifest.types, root)).exists()).toBe(true);
});

// typings/gpui.d.ts stands in for gpui-shell's own generated declarations while
// the types are emitted. Shipping a second `declare module "gpui"` would
// collide with the one an application already has beside its sources, so the
// emitted files may only refer to that module, never declare it.
test("the declarations refer to gpui without declaring it", async () => {
  for (const name of names("src/", "*.d.ts"))
    expect(await read(`src/${name}`)).not.toMatch(/declare\s+module\s+["']gpui/);
});
