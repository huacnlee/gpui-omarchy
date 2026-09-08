//! GPUI Kit's bundled icons, resolved against the current text color at render time.
//!
//! [`IconName`] names every icon shipped by `gpui-kit-assets`, so applications
//! can reach the whole set without carrying SVG files of their own.
use gpui_kit::base::StyledExt;
use gpui_kit::rems;
use gpui_kit::{App, IntoElement, RenderOnce, StyleRefinement, Styled, Window, svg};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IconName {
    ALargeSmall,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Asterisk,
    BatteryCharging,
    BatteryFull,
    BatteryLow,
    BatteryMedium,
    BatteryWarning,
    Battery,
    Bell,
    BookOpen,
    Bot,
    Building2,
    Calendar,
    CaseSensitive,
    ChartPie,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsUpDown,
    CircleCheck,
    CircleUser,
    CircleX,
    Close,
    Copy,
    Cpu,
    Dash,
    Delete,
    EllipsisVertical,
    Ellipsis,
    ExternalLink,
    EyeOff,
    Eye,
    FileText,
    File,
    FolderClosed,
    FolderOpen,
    Folder,
    Frame,
    GalleryVerticalEnd,
    Github,
    Globe,
    HardDrive,
    HeartOff,
    Heart,
    Inbox,
    Info,
    Inspector,
    LayoutDashboard,
    LoaderCircle,
    Loader,
    Map,
    Maximize,
    MemoryStick,
    Menu,
    Minimize,
    Minus,
    Moon,
    Network,
    Palette,
    PanelBottomOpen,
    PanelBottom,
    PanelLeftClose,
    PanelLeftOpen,
    PanelLeft,
    PanelRightClose,
    PanelRightOpen,
    PanelRight,
    Pause,
    Play,
    Plus,
    Redo2,
    Redo,
    Replace,
    ResizeCorner,
    RotateCw,
    Search,
    Settings2,
    Settings,
    SortAscending,
    SortDescending,
    SquareTerminal,
    StarFill,
    StarOff,
    Star,
    Sun,
    ThumbsDown,
    ThumbsUp,
    TriangleAlert,
    Undo2,
    Undo,
    User,
    WindowClose,
    WindowMaximize,
    WindowMinimize,
    WindowRestore,
}
impl IconName {
    pub fn path(self) -> &'static str {
        match self {
            Self::ALargeSmall => "icons/a-large-small.svg",
            Self::ArrowDown => "icons/arrow-down.svg",
            Self::ArrowLeft => "icons/arrow-left.svg",
            Self::ArrowRight => "icons/arrow-right.svg",
            Self::ArrowUp => "icons/arrow-up.svg",
            Self::Asterisk => "icons/asterisk.svg",
            Self::BatteryCharging => "icons/battery-charging.svg",
            Self::BatteryFull => "icons/battery-full.svg",
            Self::BatteryLow => "icons/battery-low.svg",
            Self::BatteryMedium => "icons/battery-medium.svg",
            Self::BatteryWarning => "icons/battery-warning.svg",
            Self::Battery => "icons/battery.svg",
            Self::Bell => "icons/bell.svg",
            Self::BookOpen => "icons/book-open.svg",
            Self::Bot => "icons/bot.svg",
            Self::Building2 => "icons/building-2.svg",
            Self::Calendar => "icons/calendar.svg",
            Self::CaseSensitive => "icons/case-sensitive.svg",
            Self::ChartPie => "icons/chart-pie.svg",
            Self::Check => "icons/check.svg",
            Self::ChevronDown => "icons/chevron-down.svg",
            Self::ChevronLeft => "icons/chevron-left.svg",
            Self::ChevronRight => "icons/chevron-right.svg",
            Self::ChevronUp => "icons/chevron-up.svg",
            Self::ChevronsUpDown => "icons/chevrons-up-down.svg",
            Self::CircleCheck => "icons/circle-check.svg",
            Self::CircleUser => "icons/circle-user.svg",
            Self::CircleX => "icons/circle-x.svg",
            Self::Close => "icons/close.svg",
            Self::Copy => "icons/copy.svg",
            Self::Cpu => "icons/cpu.svg",
            Self::Dash => "icons/dash.svg",
            Self::Delete => "icons/delete.svg",
            Self::EllipsisVertical => "icons/ellipsis-vertical.svg",
            Self::Ellipsis => "icons/ellipsis.svg",
            Self::ExternalLink => "icons/external-link.svg",
            Self::EyeOff => "icons/eye-off.svg",
            Self::Eye => "icons/eye.svg",
            Self::FileText => "icons/file-text.svg",
            Self::File => "icons/file.svg",
            Self::FolderClosed => "icons/folder-closed.svg",
            Self::FolderOpen => "icons/folder-open.svg",
            Self::Folder => "icons/folder.svg",
            Self::Frame => "icons/frame.svg",
            Self::GalleryVerticalEnd => "icons/gallery-vertical-end.svg",
            Self::Github => "icons/github.svg",
            Self::Globe => "icons/globe.svg",
            Self::HardDrive => "icons/hard-drive.svg",
            Self::HeartOff => "icons/heart-off.svg",
            Self::Heart => "icons/heart.svg",
            Self::Inbox => "icons/inbox.svg",
            Self::Info => "icons/info.svg",
            Self::Inspector => "icons/inspector.svg",
            Self::LayoutDashboard => "icons/layout-dashboard.svg",
            Self::LoaderCircle => "icons/loader-circle.svg",
            Self::Loader => "icons/loader.svg",
            Self::Map => "icons/map.svg",
            Self::Maximize => "icons/maximize.svg",
            Self::MemoryStick => "icons/memory-stick.svg",
            Self::Menu => "icons/menu.svg",
            Self::Minimize => "icons/minimize.svg",
            Self::Minus => "icons/minus.svg",
            Self::Moon => "icons/moon.svg",
            Self::Network => "icons/network.svg",
            Self::Palette => "icons/palette.svg",
            Self::PanelBottomOpen => "icons/panel-bottom-open.svg",
            Self::PanelBottom => "icons/panel-bottom.svg",
            Self::PanelLeftClose => "icons/panel-left-close.svg",
            Self::PanelLeftOpen => "icons/panel-left-open.svg",
            Self::PanelLeft => "icons/panel-left.svg",
            Self::PanelRightClose => "icons/panel-right-close.svg",
            Self::PanelRightOpen => "icons/panel-right-open.svg",
            Self::PanelRight => "icons/panel-right.svg",
            Self::Pause => "icons/pause.svg",
            Self::Play => "icons/play.svg",
            Self::Plus => "icons/plus.svg",
            Self::Redo2 => "icons/redo-2.svg",
            Self::Redo => "icons/redo.svg",
            Self::Replace => "icons/replace.svg",
            Self::ResizeCorner => "icons/resize-corner.svg",
            Self::RotateCw => "icons/rotate-cw.svg",
            Self::Search => "icons/search.svg",
            Self::Settings2 => "icons/settings-2.svg",
            Self::Settings => "icons/settings.svg",
            Self::SortAscending => "icons/sort-ascending.svg",
            Self::SortDescending => "icons/sort-descending.svg",
            Self::SquareTerminal => "icons/square-terminal.svg",
            Self::StarFill => "icons/star-fill.svg",
            Self::StarOff => "icons/star-off.svg",
            Self::Star => "icons/star.svg",
            Self::Sun => "icons/sun.svg",
            Self::ThumbsDown => "icons/thumbs-down.svg",
            Self::ThumbsUp => "icons/thumbs-up.svg",
            Self::TriangleAlert => "icons/triangle-alert.svg",
            Self::Undo2 => "icons/undo-2.svg",
            Self::Undo => "icons/undo.svg",
            Self::User => "icons/user.svg",
            Self::WindowClose => "icons/window-close.svg",
            Self::WindowMaximize => "icons/window-maximize.svg",
            Self::WindowMinimize => "icons/window-minimize.svg",
            Self::WindowRestore => "icons/window-restore.svg",
        }
    }
}

/// Every icon, in the order the assets are named. Useful for galleries and pickers.
pub const ICON_NAMES: &[IconName] = &[
    IconName::ALargeSmall,
    IconName::ArrowDown,
    IconName::ArrowLeft,
    IconName::ArrowRight,
    IconName::ArrowUp,
    IconName::Asterisk,
    IconName::BatteryCharging,
    IconName::BatteryFull,
    IconName::BatteryLow,
    IconName::BatteryMedium,
    IconName::BatteryWarning,
    IconName::Battery,
    IconName::Bell,
    IconName::BookOpen,
    IconName::Bot,
    IconName::Building2,
    IconName::Calendar,
    IconName::CaseSensitive,
    IconName::ChartPie,
    IconName::Check,
    IconName::ChevronDown,
    IconName::ChevronLeft,
    IconName::ChevronRight,
    IconName::ChevronUp,
    IconName::ChevronsUpDown,
    IconName::CircleCheck,
    IconName::CircleUser,
    IconName::CircleX,
    IconName::Close,
    IconName::Copy,
    IconName::Cpu,
    IconName::Dash,
    IconName::Delete,
    IconName::EllipsisVertical,
    IconName::Ellipsis,
    IconName::ExternalLink,
    IconName::EyeOff,
    IconName::Eye,
    IconName::FileText,
    IconName::File,
    IconName::FolderClosed,
    IconName::FolderOpen,
    IconName::Folder,
    IconName::Frame,
    IconName::GalleryVerticalEnd,
    IconName::Github,
    IconName::Globe,
    IconName::HardDrive,
    IconName::HeartOff,
    IconName::Heart,
    IconName::Inbox,
    IconName::Info,
    IconName::Inspector,
    IconName::LayoutDashboard,
    IconName::LoaderCircle,
    IconName::Loader,
    IconName::Map,
    IconName::Maximize,
    IconName::MemoryStick,
    IconName::Menu,
    IconName::Minimize,
    IconName::Minus,
    IconName::Moon,
    IconName::Network,
    IconName::Palette,
    IconName::PanelBottomOpen,
    IconName::PanelBottom,
    IconName::PanelLeftClose,
    IconName::PanelLeftOpen,
    IconName::PanelLeft,
    IconName::PanelRightClose,
    IconName::PanelRightOpen,
    IconName::PanelRight,
    IconName::Pause,
    IconName::Play,
    IconName::Plus,
    IconName::Redo2,
    IconName::Redo,
    IconName::Replace,
    IconName::ResizeCorner,
    IconName::RotateCw,
    IconName::Search,
    IconName::Settings2,
    IconName::Settings,
    IconName::SortAscending,
    IconName::SortDescending,
    IconName::SquareTerminal,
    IconName::StarFill,
    IconName::StarOff,
    IconName::Star,
    IconName::Sun,
    IconName::ThumbsDown,
    IconName::ThumbsUp,
    IconName::TriangleAlert,
    IconName::Undo2,
    IconName::Undo,
    IconName::User,
    IconName::WindowClose,
    IconName::WindowMaximize,
    IconName::WindowMinimize,
    IconName::WindowRestore,
];

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
        icon_svg(self.name)
            .text_color(window.text_style().color)
            .refine_style(&self.style)
    }
}

// Native builds read the icon straight out of gpui-kit-assets, so no
// application AssetSource is required and no SVG is duplicated here.
#[cfg(not(target_family = "wasm"))]
fn icon_svg(name: IconName) -> gpui_kit::Svg {
    svg().data(
        &gpui_kit::assets::Assets::get(name.path())
            .expect("bundled icon exists")
            .data,
    )
}

// On the web gpui-kit-assets fetches icons on demand rather than embedding
// them, so go through the application's AssetSource instead.
#[cfg(target_family = "wasm")]
fn icon_svg(name: IconName) -> gpui_kit::Svg {
    svg().path(name.path())
}

/// A 16px GPUI Kit icon, drawn from the gpui-kit-assets collection.
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
    #[test]
    fn every_named_icon_exists_in_kit_assets() {
        for name in ICON_NAMES {
            assert!(
                gpui_kit::assets::Assets::get(name.path()).is_some(),
                "{}",
                name.path()
            );
        }
    }

    #[test]
    fn names_and_paths_are_unique() {
        let mut paths: Vec<_> = ICON_NAMES.iter().map(|name| name.path()).collect();
        paths.sort_unstable();
        let total = paths.len();
        paths.dedup();
        assert_eq!(paths.len(), total, "duplicate icon path");
    }
}
