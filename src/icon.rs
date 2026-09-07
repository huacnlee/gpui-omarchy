//! GPUI Kit's bundled icons, resolved against the current text color at render time.
use gpui::{App, IntoElement, RenderOnce, StyleRefinement, Styled, Window, px, svg};
use gpui_base::StyledExt;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IconName {
    Check,
    Minus,
    Plus,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Calendar,
    Star,
    ExternalLink,
    Close,
    Search,
    Menu,
    Settings,
    TriangleAlert,
}
impl IconName {
    pub fn path(self) -> &'static str {
        match self {
            Self::Check => "icons/check.svg",
            Self::Minus => "icons/minus.svg",
            Self::Plus => "icons/plus.svg",
            Self::ChevronDown => "icons/chevron-down.svg",
            Self::Calendar => "icons/calendar.svg",
            Self::ChevronLeft => "icons/chevron-left.svg",
            Self::ChevronRight => "icons/chevron-right.svg",
            Self::Star => "icons/star.svg",
            Self::ExternalLink => "icons/external-link.svg",
            Self::Close => "icons/close.svg",
            Self::Search => "icons/search.svg",
            Self::Menu => "icons/menu.svg",
            Self::Settings => "icons/settings.svg",
            Self::TriangleAlert => "icons/triangle-alert.svg",
        }
    }
}

#[derive(IntoElement)]
pub struct Icon {
    name: IconName,
    style: StyleRefinement,
}
impl Styled for Icon {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}
impl RenderOnce for Icon {
    fn render(self, window: &mut Window, _: &mut App) -> impl IntoElement {
        // Svg only paints when its own text color is set. Resolve inheritance here,
        // then apply caller refinements so explicit size and color still win.
        let data = gpui_kit_assets::Assets::get(self.name.path()).expect("bundled icon exists");
        svg()
            .data(&data.data)
            .text_color(window.text_style().color)
            .refine_style(&self.style)
    }
}
/// A 16px GPUI Kit icon. No application AssetSource replacement is needed.
pub fn icon(name: IconName) -> Icon {
    Icon {
        name,
        style: StyleRefinement::default(),
    }
    .size(px(16.))
    .flex_shrink_0()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn all_named_icons_exist_in_kit_assets() {
        for name in [
            IconName::Check,
            IconName::Minus,
            IconName::Plus,
            IconName::ChevronDown,
            IconName::ChevronRight,
            IconName::ChevronLeft,
            IconName::Calendar,
            IconName::Star,
            IconName::ExternalLink,
            IconName::Close,
            IconName::Search,
            IconName::Menu,
            IconName::Settings,
            IconName::TriangleAlert,
        ] {
            assert!(
                gpui_kit_assets::Assets::get(name.path()).is_some(),
                "{}",
                name.path()
            );
        }
    }
}
