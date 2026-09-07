import { expect, test } from "bun:test";
import * as ui from "../src/index.js";
import * as native from "gpui-component";

test("the package entry exposes native controls separately from composition helpers", () => {
  for (const [name, constructor] of Object.entries(native)) {
    expect(ui[name]).toBe(constructor);
  }
  expect(ui.Button).not.toBe(ui.composition.Button);
  expect(ui.Panel).not.toBe(ui.composition.Panel);
});
