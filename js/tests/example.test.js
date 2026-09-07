// @ts-check

import { afterEach, expect, test } from "bun:test";
import HelloWorld from "../examples/hello-world/main.js";
import { calls, reset } from "./gpui-stub.js";
import {
  applyOmarchyRoles,
  applyOmarchyStyle,
  roles,
  style,
} from "../src/index.js";

const exampleRoot = new URL("../examples/hello-world/", import.meta.url);

afterEach(() => {
  applyOmarchyRoles("");
  applyOmarchyStyle("");
});

test("Hello World resolves gpui-omarchy from the Git shorthand dependency", async () => {
  const manifest = JSON.parse(
    await Bun.file(new URL("gpui-shell.json", exampleRoot)).text(),
  );
  const packageManifest = JSON.parse(
    await Bun.file(new URL("../package.json", import.meta.url)).text(),
  );

  expect(manifest.dependencies).toEqual({
    "gpui-omarchy": "huacnlee/gpui-omarchy",
  });
  expect(manifest.dependencies["gpui-omarchy"]).toBe("huacnlee/gpui-omarchy");
  expect(manifest).not.toHaveProperty("capabilities");
  expect(packageManifest.main).toBe("src/index.js");
  expect(packageManifest).not.toHaveProperty("dependencies");
  expect(packageManifest).not.toHaveProperty("devDependencies");
});

test("Hello World imports gpui-omarchy as a bare module without local package paths", async () => {
  const source = await Bun.file(new URL("main.js", exampleRoot)).text();

  expect(source).toMatch(/from\s+["']gpui-omarchy["']/);
  expect(source).not.toMatch(/from\s+["'](?:\.\/|\.\.\/)[^"']*(?:gpui-omarchy|src\/index\.js)[^"']*["']/);
});

test("Hello World contains only approved top-level source directories", () => {
  // node_modules is gpui-shell's, not the application's: every load links the
  // manifest's Git dependencies into it so an editor can answer a bare import.
  // It is generated the way gpui.d.ts is, and ignored the same way.
  const approved = new Set(["assets/", "node_modules/"]);
  const directories = [
    ...new Bun.Glob("*/").scanSync({
      cwd: exampleRoot.pathname,
      onlyFiles: false,
    }),
  ].sort();

  expect(directories.filter((path) => !approved.has(path))).toEqual([]);
});

test("Hello World initializes and installs an Omarchy theme before rendering", () => {
  reset();
  const fallback = {
    colors: {
      background: "fallback-background",
      foreground: "fallback-foreground",
    },
  };
  const cx = { theme: () => fallback, notify: () => {} };
  const view = new HelloWorld();

  view.init({}, cx);

  const installed = calls.filter((call) => call.name === "set_theme");
  expect(installed).toHaveLength(1);
  expect(installed[0].args[0]).toMatchObject({
    appearance: "dark",
    tokens: {
      colors: {
        background: "#1a1b26",
        foreground: "#c0caf5",
        ring: "#7aa2f7",
      },
    },
  });
  expect(style().font.baseSize).toBe(12);
  expect(roles()).toMatchObject({
    background: "#1a1b26",
    foreground: "#c0caf5",
    accent: "#7aa2f7",
  });
  expect(view.render(cx).name).toBe("v_flex");
});

test("Hello World's generated editor files are ignored by Git", async () => {
  for (const path of [
    "examples/hello-world/gpui.d.ts",
    "examples/hello-world/node_modules/gpui-omarchy/package.json",
  ]) {
    const result = Bun.spawnSync(["git", "check-ignore", "-q", path]);

    expect(result.exitCode).toBe(0);
  }
});
