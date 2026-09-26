//! Semantic palette and its projection into gpui-base.
use gpui_kit::base::motion::{Easing, Transition};
use gpui_kit::base::{ColorTokens, PlotMotion, PlotTheme, RadiusTokens, Spring, ThemeAppearance};
use gpui_kit::{App, Global, Hsla, Pixels, SharedString, px, rems, rgb};
use std::time::Duration;

// gpui-base 0.6 stores global typography tokens in pixels. This is the nominal
// 100% snapshot only; Omarchy layout uses rems resolved by each window.
const BASE_REM_SIZE: Pixels = px(16.);

#[derive(Clone, Debug, PartialEq)]
pub struct Theme {
    pub name: SharedString,
    pub appearance: ThemeAppearance,
    pub background: Hsla,
    pub surface: Hsla,
    pub inset: Hsla,
    pub foreground: Hsla,
    pub secondary: Hsla,
    pub bright: Hsla,
    pub accent: Hsla,
    pub on_accent: Hsla,
    pub selection: Hsla,
    pub border: Hsla,
    pub danger: Hsla,
    pub warning: Hsla,
    pub success: Hsla,
    /// Data-series colors in order of use. The first is the accent, so a
    /// single-series chart carries the screen's one accent; the rest come from
    /// the same palette's ANSI hues.
    pub chart: [Hsla; 5],
    pub font: SharedString,
    /// Fixed-width face for keycaps and code.
    pub mono_font: SharedString,
}
impl Global for Theme {}

impl Theme {
    /// Omarchy's semantic Tokyo Night palette (quattro/themes/tokyo-night/colors.toml).
    pub fn tokyo_night() -> Self {
        Self {
            name: "Tokyo Night".into(),
            appearance: ThemeAppearance::Dark,
            background: rgb(0x1a1b26).into(),
            surface: rgb(0x24283b).into(),
            inset: rgb(0x13141c).into(),
            foreground: rgb(0xa9b1d6).into(),
            secondary: rgb(0xa9b1d6).into(),
            bright: rgb(0xc0caf5).into(),
            accent: rgb(0x7aa2f7).into(),
            on_accent: rgb(0x13141c).into(),
            selection: rgb(0x292e42).into(),
            border: rgb(0x414868).into(),
            danger: rgb(0xf7768e).into(),
            warning: rgb(0xe0af68).into(),
            success: rgb(0x9ece6a).into(),
            chart: [
                rgb(0x7aa2f7).into(),
                rgb(0xbb9af7).into(),
                rgb(0x7dcfff).into(),
                rgb(0xe0af68).into(),
                rgb(0x9ece6a).into(),
            ],
            font: ".SystemUIFont".into(),
            mono_font: default_mono_font(),
        }
    }

    /// Warm light presentation; status colors are darkened for readable text.
    pub fn flexoki_light() -> Self {
        Self {
            name: "Flexoki Light".into(),
            appearance: ThemeAppearance::Light,
            background: rgb(0xfffcf0).into(),
            surface: rgb(0xf2f0e5).into(),
            inset: rgb(0xe6e4d9).into(),
            foreground: rgb(0x100f0f).into(),
            secondary: rgb(0x575653).into(),
            bright: rgb(0x100f0f).into(),
            accent: rgb(0x205ea6).into(),
            on_accent: rgb(0xfffcf0).into(),
            selection: rgb(0xdad8ce).into(),
            border: rgb(0xb7b5ac).into(),
            danger: rgb(0xaf3029).into(),
            warning: rgb(0x855b00).into(),
            success: rgb(0x526600).into(),
            chart: [
                rgb(0x205ea6).into(),
                rgb(0xa02f6f).into(),
                rgb(0x24837b).into(),
                rgb(0x855b00).into(),
                rgb(0x526600).into(),
            ],
            font: ".SystemUIFont".into(),
            mono_font: default_mono_font(),
        }
    }

    /// Shared shell control colors, separate from the palette's selection ramp.
    pub fn normal_fill(&self) -> Hsla {
        self.foreground.opacity(0.04)
    }
    pub fn hover_fill(&self) -> Hsla {
        self.foreground.opacity(0.08)
    }
    pub fn selected_fill(&self) -> Hsla {
        self.foreground.opacity(0.18)
    }
    pub fn pressed_fill(&self) -> Hsla {
        self.foreground.opacity(0.22)
    }
    pub fn control_border(&self) -> Hsla {
        self.foreground.opacity(0.4)
    }
    pub fn focus_border(&self) -> Hsla {
        self.foreground.opacity(0.25)
    }
    pub fn divider(&self) -> Hsla {
        self.foreground.opacity(0.12)
    }

    /// Shell editors use foreground at 35%, independently of colors.toml selection.
    pub fn input_style(&self) -> gpui_kit::base::input::InputEditorStyle {
        gpui_kit::base::input::InputEditorStyle {
            foreground: self.foreground,
            muted_foreground: self.foreground.opacity(0.55),
            background: self.normal_fill(),
            border: self.control_border(),
            selection: self.foreground.opacity(0.35),
            caret: self.foreground,
            ..Default::default()
        }
    }

    pub fn tokens(&self) -> ColorTokens {
        ColorTokens {
            background: self.background,
            foreground: self.foreground,
            surface: self.surface,
            surface_foreground: self.foreground,
            primary: self.accent,
            primary_foreground: self.on_accent,
            secondary: self.surface,
            secondary_foreground: self.foreground,
            muted: self.inset,
            muted_foreground: self.secondary,
            accent: self.selection,
            accent_foreground: self.bright,
            destructive: self.danger,
            destructive_foreground: self.background,
            border: self.border,
            input: self.border,
            ring: self.accent,
            selection: self.selection,
        }
    }

    /// Atomically update presentation and base tokens, then redraw all windows.
    /// Applying an explicit theme stops following system theme changes.
    pub fn apply(self, cx: &mut App) {
        crate::system_theme::stop_following(cx);
        self.apply_palette(cx);
    }

    pub(crate) fn apply_palette(self, cx: &mut App) {
        let base = gpui_kit::base::Theme::global_mut(cx);
        base.appearance = self.appearance;
        base.tokens.colors = self.tokens();
        base.tokens.radius = RadiusTokens {
            none: Pixels::ZERO,
            sm: Pixels::ZERO,
            md: Pixels::ZERO,
            lg: Pixels::ZERO,
            xl: Pixels::ZERO,
            full: Pixels::ZERO,
        };
        base.plot = plot_theme();
        let type_scale = &mut base.tokens.typography;
        type_scale.sans = self.font.clone();
        type_scale.mono = self.mono_font.clone();
        for (token, size) in [
            (&mut type_scale.xs, 0.625),
            (&mut type_scale.sm, 0.6875),
            (&mut type_scale.md, 0.75),
            (&mut type_scale.lg, 0.875),
            (&mut type_scale.xl, 1.),
            (&mut type_scale.mono_md, 0.75),
        ] {
            token.size = rems(size).to_pixels(BASE_REM_SIZE);
            token.line_height = token.size * 1.5;
        }
        cx.set_global(self);
        cx.refresh_windows();
    }
}

/// Chart hover timing: Omarchy's 120ms state-color duration (`Button.qml`) for
/// the fade and the pointer glide, easing out on enter and in on exit.
fn plot_theme() -> PlotTheme {
    let duration = Duration::from_millis(120);
    let curve = |x1, y1, x2, y2| Easing::cubic_bezier(x1, y1, x2, y2).expect("static curve");
    PlotTheme::new().with_motion(
        PlotMotion::default()
            .with_pointer(Spring::new(duration).with_epsilon(0.1))
            .with_enter(Transition::new(duration).easing(curve(0.16, 1., 0.3, 1.)))
            .with_exit(Transition::new(duration).easing(curve(0.4, 0., 1., 1.))),
    )
}

/// The system monospace face: macOS and Windows stock fonts, and on Linux the
/// family fontconfig resolves for `monospace`, which is where `omarchy font
/// set` records the user's choice (the same query as `omarchy-font-current`).
/// Resolved once per process.
pub(crate) fn default_mono_font() -> SharedString {
    static FONT: std::sync::OnceLock<SharedString> = std::sync::OnceLock::new();
    FONT.get_or_init(|| {
        if cfg!(target_os = "macos") {
            "Menlo".into()
        } else if cfg!(target_os = "windows") {
            "Consolas".into()
        } else {
            fontconfig_monospace().unwrap_or_else(|| "JetBrainsMono Nerd Font".into())
        }
    })
    .clone()
}

#[cfg(all(unix, not(target_os = "macos"), not(target_family = "wasm")))]
fn fontconfig_monospace() -> Option<SharedString> {
    let output = std::process::Command::new("fc-match")
        .args(["monospace", "-f", "%{family}"])
        .output()
        .ok()
        .filter(|output| output.status.success())?;
    // fc-match lists aliases, e.g. "JetBrainsMono Nerd Font,JetBrainsMono NF".
    let family = String::from_utf8(output.stdout).ok()?;
    let family = family.lines().next()?.split(',').next()?.trim();
    (!family.is_empty()).then(|| family.to_owned().into())
}

#[cfg(not(all(unix, not(target_os = "macos"), not(target_family = "wasm"))))]
fn fontconfig_monospace() -> Option<SharedString> {
    None
}

pub trait ActiveTheme {
    fn omarchy(&self) -> &Theme;
}
impl ActiveTheme for App {
    fn omarchy(&self) -> &Theme {
        self.global::<Theme>()
    }
}
