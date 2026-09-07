const loadingPanel = document.getElementById('loading');
// GPUI installs a platform input for keyboard and IME events. Keep startup
// focus in the parent page; clicking the gallery still activates that input.
if (window.parent !== window) {
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLInputElement && document.activeElement === node) node.blur();
      }
    }
  }).observe(document.body, { childList: true });
}
try {
  const gallery = await import('./wasm/gpui_omarchy_gallery_wasm.js');
  await gallery.default();
  const allowedThemes = new Set(['tokyo-night', 'flexoki-light']);
  let themeRoot = document.documentElement;
  try { if (parent !== window) themeRoot = parent.document.documentElement; } catch {}
  function syncTheme() {
    let name = themeRoot.dataset.theme;
    if (!allowedThemes.has(name)) {
      try { name = localStorage.getItem('gpui-omarchy-theme'); } catch {}
    }
    if (!allowedThemes.has(name)) name = 'tokyo-night';
    gallery.set_theme(name);
    document.documentElement.dataset.galleryTheme = name;
    document.body.style.background = name === 'flexoki-light' ? '#fffcf0' : '#1a1b26';
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(themeRoot, {attributes:true, attributeFilter:['data-theme']});
  window.addEventListener('storage', syncTheme);
  gallery.run();
  loadingPanel.remove();
  document.documentElement.dataset.galleryReady = 'true';
} catch (error) {
  console.error('GPUI Omarchy gallery failed to load:', error);
  loadingPanel.replaceChildren();
  const message = document.createElement('p');
  message.textContent = 'The gallery could not start. Try reloading, or run the native example with cargo run --example gallery.';
  const retry = document.createElement('button');
  retry.textContent = 'Reload gallery';
  retry.addEventListener('click', () => location.reload());
  loadingPanel.append(message, retry);
}

export {};
