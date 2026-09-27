# AGENTS.md

Guidance for coding agents working in this repository. `CLAUDE.md` imports this
file.

gpui-omarchy is a component library for Omarchy built on gpui-base, without the
gpui-component facade. Read [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/design.md](docs/design.md) before changing code.

## Pull requests

Follow the pull request rules in [CONTRIBUTING.md](CONTRIBUTING.md#pull-requests).
In short:

- Title `<area>: <what changes>`, matching earlier titles (`chart: add …`,
  `fix: keep …`); check `gh pr list --state all` first.
- Description sections: Summary, Design (with the Omarchy source for each
  decision), Public API (every added, changed or removed item with its signature
  and one line on its purpose, or `None.`), Breaking Changes (with `diff`
  blocks), Dependencies, Test plan (real results; unverified items unchecked),
  and a note on AI assistance.
- One change per pull request; no unrelated refactors or formatting.
- A dependency on an unreleased gpui-kit branch must name the pull request it
  waits for and say the crate must not be published until it is released.

## Design

Base visual and interaction choices on Omarchy's own shell
(`/usr/share/omarchy/shell`) and the user's theme, and cite the file. Do not
add motion, color or chrome the shell does not have.
