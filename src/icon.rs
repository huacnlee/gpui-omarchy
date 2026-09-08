//! Icons named by gpui-kit-assets, resolved against the current text color.
//!
//! [`IconName`] and the SVG paths behind it come from `gpui-kit-assets`, so an
//! application reaches the whole Lucide catalog and this crate carries no icon
//! of its own. The bytes are read through the application's `AssetSource`:
//! register `gpui_kit::assets::Assets` for the default bundle, `AllAssets` for
//! the full catalog, or compose either with `icon_assets!` for a few extras.
use gpui_kit::base::StyledExt;
use gpui_kit::rems;
use gpui_kit::{App, IntoElement, RenderOnce, StyleRefinement, Styled, Window, svg};

pub use gpui_kit::assets::IconName;

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
        svg()
            .path(self.name.path())
            .text_color(window.text_style().color)
            .refine_style(&self.style)
    }
}

/// A 16px icon from the application's asset source.
pub fn icon(name: IconName) -> Icon {
    Icon {
        name,
        style: StyleRefinement::default(),
    }
    .size(rems(1.))
    .flex_shrink_0()
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui_kit::AssetSource;

    #[test]
    fn the_icons_this_crate_draws_are_in_the_default_bundle() {
        // Components reach for these without the application asking, so they
        // must resolve against the bundle every gpui-kit application gets.
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
            let path = name.path();
            assert!(
                gpui_kit::assets::Assets.load(&path).unwrap().is_some(),
                "{path}"
            );
        }
    }
}
