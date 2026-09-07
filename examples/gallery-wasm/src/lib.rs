use std::{borrow::Cow, cell::RefCell};
use wasm_bindgen::prelude::*;

// This is the desktop gallery itself, not a browser recreation.
#[path = "../../gallery/app.rs"]
#[allow(dead_code)]
mod gallery;

thread_local! {
    static APPLICATION: RefCell<Option<gpui::ApplicationHandle>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub fn run() -> Result<(), JsValue> {
    gpui_platform::web_init();
    let application = gpui_platform::single_threaded_web();
    let handle = application.run_embedded(|cx| {
        cx.text_system()
            .add_fonts(vec![Cow::Borrowed(include_bytes!(
                "../fonts/Inter-Regular.ttf"
            ))])
            .expect("load gallery font");
        gallery::open_web_gallery(cx);
    });
    APPLICATION.with(|application| *application.borrow_mut() = Some(handle));
    Ok(())
}
