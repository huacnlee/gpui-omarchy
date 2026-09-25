//! Dense, square surfaces and non-interactive information components.
use crate::ActiveTheme;
use gpui_kit::base::{Progress, ProgressIndicator, ProgressTrack};
use gpui_kit::rems;
use gpui_kit::{
    Action, App, Div, ElementId, FontWeight, Modifiers, ParentElement, SharedString, Styled,
    Window, div, relative,
};

pub fn panel(title: impl Into<SharedString>, cx: &App) -> Div {
    let t = cx.omarchy();
    div()
        .flex()
        .flex_col()
        .min_w_0()
        .gap(rems(0.875))
        .p(rems(1.125))
        .border_1()
        .border_color(t.border)
        .bg(t.background)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .text_color(t.foreground)
        .child(
            div()
                .text_size(rems(0.875))
                .font_weight(FontWeight::BOLD)
                .child(title.into()),
        )
}

pub fn separator(cx: &App) -> Div {
    div()
        .w_full()
        .h(rems(0.0625))
        .flex_shrink_0()
        .bg(cx.omarchy().divider())
}

/// A vertical rule for toolbars. Override height to fit a different row size.
pub fn vertical_separator(cx: &App) -> Div {
    div()
        .w(rems(0.0625))
        .h(rems(1.25))
        .flex_shrink_0()
        .bg(cx.omarchy().divider())
}

pub fn keycap(key: impl Into<SharedString>, cx: &App) -> Div {
    let t = cx.omarchy();
    div()
        .px(rems(0.25))
        .py(rems(0.125))
        .border_1()
        .border_color(t.border)
        .bg(t.inset)
        .font_family(t.mono_font.clone())
        .text_size(rems(0.6875))
        // Pin to the cap's own font size so an inherited line height can't inflate it.
        .line_height(relative(1.))
        .font_weight(FontWeight::BOLD)
        .text_color(t.foreground)
        .child(key.into())
}

/// A row of keycaps, one per keystroke, e.g. `["⌘q"]` or `["ctrl+k", "ctrl+s"]`.
pub fn keycaps(keys: impl IntoIterator<Item = impl Into<SharedString>>, cx: &App) -> Div {
    div()
        .flex()
        .items_center()
        .gap(rems(0.25))
        .children(keys.into_iter().map(|key| keycap(key, cx)))
}

/// The keycaps for whichever binding the keymap resolves for `action`, or
/// `None` when nothing is bound. The lookup reads the last rendered frame, so
/// context-scoped bindings show once their context has been painted.
pub fn keycap_for_action(action: &dyn Action, window: &Window, cx: &App) -> Option<Div> {
    let binding = window.highest_precedence_binding_for_action(action)?;
    let keys: Vec<_> = binding
        .keystrokes()
        .iter()
        .map(|stroke| keystroke_label(stroke.modifiers(), stroke.key()))
        .collect();
    (!keys.is_empty()).then(|| keycaps(keys, cx))
}

/// One keystroke as a single keycap label: `⌘q` on macOS, `ctrl+q` elsewhere.
pub fn keystroke_label(modifiers: &Modifiers, key: &str) -> SharedString {
    let separator = if cfg!(target_os = "macos") { "" } else { "+" };
    let labels = keystroke_labels(modifiers, key);
    let labels: Vec<&str> = labels.iter().map(AsRef::as_ref).collect();
    labels.join(separator).into()
}

/// Split a keystroke into the labels this platform prints on its keys, all
/// lowercase in Omarchy's style: symbols in macOS order (⌃⌥⇧⌘), words
/// elsewhere (ctrl alt shift super).
pub fn keystroke_labels(modifiers: &Modifiers, key: &str) -> Vec<SharedString> {
    let mac = cfg!(target_os = "macos");
    let pick = |symbol: &'static str, word: &'static str| if mac { symbol } else { word };
    let platform = pick(
        "⌘",
        if cfg!(target_os = "windows") {
            "win"
        } else {
            "super"
        },
    );
    let mut labels: Vec<SharedString> = [
        (modifiers.control, pick("⌃", "ctrl")),
        (modifiers.alt, pick("⌥", "alt")),
        (modifiers.shift, pick("⇧", "shift")),
        (modifiers.platform, platform),
        (modifiers.function, "fn"),
    ]
    .into_iter()
    .filter_map(|(held, label)| held.then(|| label.into()))
    .collect();
    let label = match key {
        "" => return labels,
        "ctrl" | "control" => pick("⌃", "ctrl"),
        "alt" => pick("⌥", "alt"),
        "shift" => pick("⇧", "shift"),
        "cmd" | "super" | "win" | "platform" => platform,
        "enter" => pick("⏎", "enter"),
        "escape" => pick("⎋", "esc"),
        "backspace" => pick("⌫", "backspace"),
        "delete" => pick("⌦", "delete"),
        "tab" => pick("⇥", "tab"),
        "left" => pick("←", "left"),
        "right" => pick("→", "right"),
        "up" => pick("↑", "up"),
        "down" => pick("↓", "down"),
        "pageup" => "page up",
        "pagedown" => "page down",
        key => {
            labels.push(key.to_lowercase().into());
            return labels;
        }
    };
    labels.push(label.into());
    labels
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Status {
    #[default]
    Neutral,
    Success,
    Warning,
    Error,
}
impl Status {
    /// The theme colour that carries this status.
    pub fn color(self, cx: &App) -> gpui_kit::Hsla {
        let t = cx.omarchy();
        match self {
            Status::Neutral => t.secondary,
            Status::Success => t.success,
            Status::Warning => t.warning,
            Status::Error => t.danger,
        }
    }
}

/// Inline feedback with square borders and semantic theme colors.
///
/// Unlike [`crate::alert_dialog`] this stays in the layout, so it suits
/// persistent conditions the reader can act on without leaving the view.
pub fn alert(message: impl Into<SharedString>, status: Status, cx: &App) -> Div {
    let t = cx.omarchy();
    let color = status.color(cx);
    div()
        .flex()
        .items_center()
        .gap(rems(0.625))
        .p(rems(0.625))
        .border_1()
        .border_color(color.opacity(0.35))
        .bg(color.opacity(0.06))
        .text_color(color)
        .font_family(t.font.clone())
        .child(
            crate::icon(match status {
                Status::Success => crate::IconName::Check,
                Status::Neutral => crate::IconName::Minus,
                Status::Warning | Status::Error => crate::IconName::TriangleAlert,
            })
            .size(rems(0.875))
            .flex_shrink_0()
            .text_color(color),
        )
        .child(div().flex_1().min_w_0().child(message.into()))
}

pub fn badge(label: impl Into<SharedString>, status: Status, cx: &App) -> Div {
    let t = cx.omarchy();
    let color = match status {
        Status::Neutral => t.secondary,
        Status::Success => t.success,
        Status::Warning => t.warning,
        Status::Error => t.danger,
    };
    div()
        .px(rems(0.375))
        .py(rems(0.125))
        .border_1()
        .border_color(color)
        .text_color(color)
        .font_family(t.font.clone())
        .text_size(rems(0.6875))
        .child(label.into())
}

pub fn empty_state(
    title: impl Into<SharedString>,
    description: impl Into<SharedString>,
    cx: &App,
) -> Div {
    let t = cx.omarchy();
    div()
        .flex()
        .flex_col()
        .gap(rems(0.5))
        .p(rems(1.125))
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .text_color(t.foreground)
        .child(div().font_weight(FontWeight::BOLD).child(title.into()))
        .child(div().text_color(t.secondary).child(description.into()))
}

/// Determinate progress, clamped to 0..=100; non-finite values become zero.
pub fn progress(id: impl Into<ElementId>, value: f32, cx: &App) -> Progress {
    let t = cx.omarchy();
    let value = normalized_progress(value);
    Progress::new(id).value(value).w_full().child(
        ProgressTrack::new()
            .w_full()
            .h(rems(0.375))
            .bg(t.border)
            .child(
                ProgressIndicator::new()
                    .h_full()
                    .w(relative(value / 100.))
                    .bg(t.accent),
            ),
    )
}

fn normalized_progress(value: f32) -> f32 {
    if value.is_finite() {
        value.clamp(0., 100.)
    } else {
        0.
    }
}

/// Notification surface; compose actions and use gpui-base's ToastManager for
/// application-owned stacking and timeout policy.
pub fn toast(id: impl Into<gpui_kit::ElementId>, cx: &App) -> gpui_kit::base::Toast {
    let t = cx.omarchy();
    gpui_kit::base::Toast::new(id)
        .flex()
        .flex_col()
        .gap(rems(0.625))
        .p(rems(0.875))
        .w_full()
        .border_1()
        .rounded_none()
        .border_color(t.border)
        .bg(t.background)
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
}

/// A square identity marker. Supply initials or an icon in the fallback slot;
/// callers can replace it with `avatar_image` through the base image builder.
pub fn avatar(initials: impl Into<SharedString>, cx: &App) -> gpui_kit::base::Avatar {
    let t = cx.omarchy();
    gpui_kit::base::Avatar::new()
        .size(rems(2.))
        .flex_shrink_0()
        .overflow_hidden()
        .rounded_none()
        .border_1()
        .border_color(t.control_border())
        .bg(t.hover_fill())
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .text_color(t.foreground)
        .fallback(
            gpui_kit::base::AvatarFallback::new()
                .size_full()
                .flex()
                .items_center()
                .justify_center()
                .child(initials.into()),
        )
}

/// An image slot sized to its avatar. Image loading and failure policy remain
/// with the application, matching gpui-base's explicit slot API.
pub fn avatar_image(source: impl Into<gpui_kit::ImageSource>) -> gpui_kit::base::AvatarImage {
    gpui_kit::base::AvatarImage::new(source).size_full()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn keystroke_labels_are_lowercase_and_platform_ordered() {
        let modifiers = Modifiers {
            platform: true,
            shift: true,
            ..Default::default()
        };
        let label = keystroke_label(&modifiers, "Q");
        if cfg!(target_os = "macos") {
            assert_eq!(label.as_ref(), "⇧⌘q");
        } else if cfg!(target_os = "windows") {
            assert_eq!(label.as_ref(), "shift+win+q");
        } else {
            assert_eq!(label.as_ref(), "shift+super+q");
        }
        assert_eq!(
            keystroke_labels(&Modifiers::none(), "pagedown"),
            ["page down"]
        );
    }
    #[test]
    fn progress_handles_invalid_and_out_of_range_values() {
        for (input, expected) in [
            (-1., 0.),
            (42., 42.),
            (150., 100.),
            (f32::NAN, 0.),
            (f32::INFINITY, 0.),
        ] {
            assert_eq!(normalized_progress(input), expected);
        }
    }
}
