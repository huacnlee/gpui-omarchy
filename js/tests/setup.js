// @ts-check

const stubUrl = new URL("./gpui-stub.js", import.meta.url).href;
const libraryUrl = new URL("../src/index.js", import.meta.url).href;
// This only lets composition tests link the native package entry. Real native
// rendering and interaction are exercised by the Rust shell integration tests.
const nativeSource = await Bun.file(new URL("../src/native.js", import.meta.url)).text();
const nativeNames = nativeSource.match(/export\s*\{([^}]+)\}/)[1].split(",").map(name => name.trim()).filter(Boolean);

Bun.plugin({
  name: "local-gpui-stub",
  setup(build) {
    build.module("gpui-component", () => ({
      contents: `import { element } from ${JSON.stringify(stubUrl)};\n` + nativeNames.map(name =>
        `export function ${name}(...args) { return element(${JSON.stringify(`Native${name}`)}, args); }`
      ).join("\n"),
      loader: "js",
    }));
    for (const specifier of ["gpui", "gpui-base"]) {
      build.module(specifier, () => ({
        contents: `export * from ${JSON.stringify(stubUrl)};`,
        loader: "js",
      }));
    }
    build.module("gpui-omarchy", () => ({
      contents: `export * from ${JSON.stringify(libraryUrl)};`,
      loader: "js",
    }));
  },
});
