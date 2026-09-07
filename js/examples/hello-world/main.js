// @ts-check

import { View } from "gpui";
import { set_theme } from "gpui-base";
import {
  composition,
  applyOmarchyRoles,
  applyOmarchyStyle,
  omarchyTheme,
  style,
} from "gpui-omarchy";
const { AppShell, Button, MutedText, PageColumn, Surface, Title } = composition;

const OMARCHY_COLORS = `
mode = "dark"
background = "#1a1b26"
foreground = "#c0caf5"
accent = "#7aa2f7"
red = "#f7768e"
green = "#9ece6a"
yellow = "#e0af68"
blue = "#7aa2f7"
magenta = "#bb9af7"
cyan = "#7dcfff"
`;

const OMARCHY_SHELL = `
[font]
base-size = 12
[spacing]
scale = 1
scale-with-font = true
`;

export default class HelloWorld extends View {
  /** @param {Record<string, unknown>} _props @param {import("gpui").Context} cx */
  init(_props, cx) {
    const tokens = applyOmarchyStyle(OMARCHY_SHELL, {
      cornerRadius: 0,
      fontFamily: "monospace",
    });
    applyOmarchyRoles(OMARCHY_COLORS);
    const theme = omarchyTheme(OMARCHY_COLORS, cx.theme(), tokens);
    if (theme) set_theme(theme);
  }

  /** @param {import("gpui").Context} cx */
  render(cx) {
    const tokens = style();
    const card = new Surface()
      .children([
        new Title("Hello, Omarchy UI").build(cx),
        new MutedText(
          "A minimal gpui-shell application using the shared UI components.",
        ).build(cx),
        new Button("hello-world-button")
          .label("Say hello")
          .bordered()
          .onClick((_event, context) => context.notify())
          .build(cx),
      ])
      .build(cx)
      .p(tokens.spacing.panelPadding)
      .gap(tokens.spacing.md);
    const content = new PageColumn("hello-world-page")
      .child(card)
      .build(cx);

    return new AppShell().content(content).build(cx);
  }
}
