use anyhow::anyhow;
use gpui_kit::{AssetSource, Result, SharedString};
use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use wasm_bindgen::JsCast as _;
use wasm_bindgen_futures::spawn_local;

/// Icon asset loader for the WASM gallery.
///
/// Mirrors the on-demand fetch behaviour of `gpui_kit::assets::Assets` but
/// dispatches a `gpui:asset-loaded` `CustomEvent` on `window` after every
/// successful icon download. The JS bootstrap listens for that event and
/// calls `gallery.refresh()` so GPUI repaints exactly when an icon is ready,
/// with no polling or arbitrary timeouts.
pub struct GalleryAssets {
    endpoint: SharedString,
    cache: Arc<RwLock<HashMap<String, Vec<u8>>>>,
    pending: Arc<RwLock<HashSet<String>>>,
}

impl GalleryAssets {
    pub fn new(endpoint: impl Into<SharedString>) -> Self {
        Self {
            endpoint: endpoint.into(),
            cache: Arc::new(RwLock::new(HashMap::new())),
            pending: Arc::new(RwLock::new(HashSet::new())),
        }
    }
}

impl AssetSource for GalleryAssets {
    fn load(&self, path: &str) -> Result<Option<Cow<'static, [u8]>>> {
        if path.is_empty() || !path.starts_with("icons/") || !path.ends_with(".svg") {
            return Ok(None);
        }

        // Return cached bytes immediately if available.
        if let Ok(cache) = self.cache.read() {
            if let Some(data) = cache.get(path) {
                return Ok(Some(Cow::Owned(data.clone())));
            }
        }

        // Spawn exactly one fetch per path.
        let already_pending = self
            .pending
            .read()
            .map(|p| p.contains(path))
            .unwrap_or(false);

        if !already_pending {
            if let Ok(mut pending) = self.pending.write() {
                pending.insert(path.to_string());
            }

            let url = format!("{}/assets/{}", self.endpoint, path);
            let path_clone = path.to_string();
            let cache = self.cache.clone();
            let pending = self.pending.clone();

            spawn_local(async move {
                if let Some(window) = web_sys::window() {
                    let promise = window.fetch_with_str(&url);
                    if let Ok(response) = wasm_bindgen_futures::JsFuture::from(promise).await {
                        let response: web_sys::Response = response.unchecked_into();
                        if response.ok() {
                            if let Ok(buf_promise) = response.array_buffer() {
                                if let Ok(buf) = wasm_bindgen_futures::JsFuture::from(buf_promise).await {
                                    let bytes =
                                        js_sys::Uint8Array::new(&buf).to_vec();
                                    if let Ok(mut cache) = cache.write() {
                                        cache.insert(path_clone.clone(), bytes);
                                    }
                                    // Notify JS to call gallery.refresh() now that this icon is ready.
                                    if let Ok(event) = web_sys::CustomEvent::new("gpui:asset-loaded") {
                                        let _ = window.dispatch_event(&event);
                                    }
                                }
                            }
                        }
                    }
                }
                if let Ok(mut pending) = pending.write() {
                    pending.remove(&path_clone);
                }
            });
        }

        // Tell GPUI the asset is not yet ready; it will retry on the next render.
        Err(anyhow!("Wasm assets loading, will be available soon..."))
    }

    fn list(&self, _path: &str) -> Result<Vec<SharedString>> {
        Ok(Vec::new())
    }
}
