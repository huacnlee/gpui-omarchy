# Omarchy UI Hello World

This example is the smallest gpui-shell application that installs an Omarchy
theme and composes its entire visible shell through the public class API.

Its `gpui-shell.json` keeps the Git shorthand:

```json
"gpui-omarchy": "huacnlee/gpui-omarchy"
```

The repository's `package.json` keeps `"main": "src/index.js"`, which is the
public entry selected for that shorthand. The application requests no
capabilities.

During `init`, the view calls `applyOmarchyStyle`, `applyOmarchyRoles`, and
`omarchyTheme`, then installs the result with gpui-shell's `set_theme`. During
`render`, it composes `Surface`, `Title`, `MutedText`, and `Button`, places the
surface in `PageColumn`, and supplies that element to `AppShell`:

```js
const card = new Surface()
  .children([
    new Title("Hello, Omarchy UI").build(cx),
    new MutedText("A minimal gpui-shell application").build(cx),
    new Button("hello-world-button")
      .label("Say hello")
      .bordered()
      .onClick((_event, context) => context.notify())
      .build(cx),
  ])
  .build(cx);

const content = new PageColumn("hello-world-page").child(card).build(cx);
return new AppShell().content(content).build(cx);
```

The stable button and page IDs belong to the application. A control with an
icon would likewise receive a complete application-root-relative path, for
example `.icon("assets/icons/wave.svg")`.

`jsconfig.json` is what turns checking on; it is the file gpui-shell scaffolds
into an application that has none, kept here verbatim. The rest of what an
editor needs is generated on every run and never committed: `gpui.d.ts` beside
this file, and a `node_modules/gpui-omarchy` link into the resolved checkout,
which is how a bare `import ... from "gpui-omarchy"` is answered.

From this example's location, validate or run it with:

```bash
gpui-shell check .
gpui-shell .
```
