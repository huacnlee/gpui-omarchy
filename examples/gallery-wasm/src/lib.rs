use std::{borrow::Cow, cell::RefCell};
use wasm_bindgen::prelude::*;

// This is the desktop gallery itself, not a browser recreation.
#[path = "../../gallery/app.rs"]
#[allow(dead_code)]
mod gallery;

thread_local! {
    static REQUESTED_THEME: RefCell<String> = RefCell::new("tokyo-night".into());
    static READY: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    static APPLICATION: RefCell<Option<gpui::ApplicationHandle>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub fn run() -> Result<(), JsValue> {
    gpui_platform::web_init();
    let application = gpui_platform::single_threaded_web();
    let handle = application.run_embedded(|cx| {
        cx.text_system()
            .add_fonts(vec![
                Cow::Borrowed(include_bytes!("../fonts/Inter-Regular.ttf")),
                // GPUI Web maps `.SystemUIFont` to IBM Plex Sans. Hidden
                // inputs and detached surfaces can measure text before they
                // inherit the gallery's explicitly configured Inter style.
                Cow::Borrowed(include_bytes!("../fonts/IBMPlexSans-Regular.ttf")),
            ])
            .expect("load gallery font");
        let theme = REQUESTED_THEME.with(|name| web_theme(&name.borrow()).unwrap());
        gallery::open_web_gallery(theme, cx);
        READY.set(true);
    });
    APPLICATION.with(|application| *application.borrow_mut() = Some(handle));
    Ok(())
}

fn web_theme(name: &str) -> Option<gpui_omarchy::Theme> {
    use gpui_omarchy::Theme;
    let mut theme = match name {
        "tokyo-night" => Theme::tokyo_night(),
        "flexoki-light" => Theme::flexoki_light(),
        "catppuccin" => {
            Theme::from_colors_toml("Catppuccin", include_str!("../themes/catppuccin.toml"))
                .expect("bundled palette")
        }
        _ => return None,
    };
    theme.font = "Inter Variable".into();
    Some(theme)
}

/// Update the existing app without rebuilding its controls or losing state.
#[wasm_bindgen]
pub fn set_theme(name: &str) -> Result<(), JsValue> {
    let theme = web_theme(name).ok_or_else(|| JsValue::from_str("Unknown gallery theme"))?;
    REQUESTED_THEME.with(|current| *current.borrow_mut() = name.into());
    if READY.get() {
        APPLICATION.with(|application| {
            if let Some(application) = application.borrow().as_ref() {
                application.update(|cx| theme.apply(cx));
                // Flush refresh effects even when the embedded window is idle.
                application.to_async().refresh();
            }
        });
    }
    Ok(())
}
