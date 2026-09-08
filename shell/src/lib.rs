//! Optional native component adapter. Enable the `gpui-shell` feature to use it.
//!
//! The catalog registers under [`COMPONENT_MODULE`]. The `gpui-omarchy`
//! JavaScript package re-exports it from there, so an application declares that
//! package as a gpui-shell dependency and imports one specifier.

/// The specifier this catalog's components resolve under.
///
/// A registry names its own module, and a catalog may not claim a name the
/// runtime already answers to. It also may not be `gpui-omarchy`: the component
/// module resolves before application files and Git dependencies, so taking the
/// JavaScript package's name would hide the package rather than complete it.
pub const COMPONENT_MODULE: &str = "gpui-omarchy-native";

/// Initialize the runtime and the native Omarchy presentation layer.
#[cfg(feature = "gpui-shell")]
pub fn init(cx: &mut gpui_shell::gpui::App) {
    initialize_catalog(cx);
    gpui_shell::init(cx);
}

#[cfg(feature = "gpui-shell")]
fn initialize_catalog(cx: &mut gpui_shell::gpui::App) {
    gpui_omarchy::init(cx);
    // Shell applications can replace base tokens with set_theme(). Keep the
    // native presentation in the same palette when that happens.
    cx.observe_global::<gpui_kit::base::Theme>(|cx| {
        use gpui_omarchy::ActiveTheme;
        let base = gpui_kit::base::Theme::global(cx);
        let colors = &base.tokens.colors;
        let mut theme = cx.omarchy().clone();
        theme.appearance = base.appearance;
        theme.background = colors.background;
        theme.surface = colors.surface;
        theme.inset = colors.muted;
        theme.foreground = colors.foreground;
        theme.secondary = colors.muted_foreground;
        theme.bright = colors.accent_foreground;
        theme.accent = colors.primary;
        theme.on_accent = colors.primary_foreground;
        theme.selection = colors.selection;
        theme.border = colors.border;
        theme.danger = colors.destructive;
        if &theme != cx.omarchy() {
            cx.set_global(theme);
            cx.refresh_windows();
        }
    })
    .detach();
}

/// Create the application's runtime with the Omarchy native component catalog.
#[cfg(feature = "gpui-shell")]
pub fn new_runtime(
    cx: &mut gpui_shell::gpui::App,
) -> gpui_shell::anyhow::Result<std::rc::Rc<gpui_shell::ShellRuntime>> {
    gpui_shell::ShellRuntime::new_with_components(cx, components()?)
}

#[cfg(feature = "gpui-shell")]
mod button;
#[cfg(feature = "gpui-shell")]
mod choice;
#[cfg(feature = "gpui-shell")]
mod controls;
#[cfg(feature = "gpui-shell")]
mod display;
#[cfg(feature = "gpui-shell")]
mod element;
#[cfg(feature = "gpui-shell")]
mod input;
#[cfg(feature = "gpui-shell")]
mod navigation;
#[cfg(feature = "gpui-shell")]
mod retained;
#[cfg(feature = "gpui-shell")]
mod surface;

/// Build the native Omarchy catalog before creating the shell runtime.
#[cfg(feature = "gpui-shell")]
pub fn components() -> Result<gpui_shell::FrozenComponentRegistry, gpui_shell::RegistryError> {
    let mut registry = gpui_shell::ComponentRegistry::new(
        gpui_shell::COMPONENT_REGISTRY_API_VERSION,
        COMPONENT_MODULE,
    )?
    .with_initializer(initialize_catalog);
    button::register(&mut registry)?;
    surface::register(&mut registry)?;
    controls::register(&mut registry)?;
    display::register(&mut registry)?;
    navigation::register(&mut registry)?;
    input::register(&mut registry)?;
    retained::register(&mut registry)?;
    choice::register(&mut registry)?;
    registry.freeze()
}
