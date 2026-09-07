import { useEffect, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import './ThemeMenu.css';

const themes = [
  { id: 'tokyo-night', name: 'Tokyo Night' },
  { id: 'flexoki-light', name: 'Flexoki Light' },
  { id: 'catppuccin', name: 'Catppuccin' },
] as const;
type ThemeId = (typeof themes)[number]['id'];
const storageKey = 'gpui-omarchy-theme';
const isTheme = (value: string | undefined | null): value is ThemeId =>
  themes.some((theme) => theme.id === value);

export default function ThemeMenu() {
  const [theme, setTheme] = useState<ThemeId>('tokyo-night');

  useEffect(() => {
    const syncTheme = () => {
      const current = document.documentElement.dataset.theme;
      if (isTheme(current)) setTheme(current);
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  function selectTheme(value: string) {
    if (!isTheme(value)) return;
    const root = document.documentElement;
    root.setAttribute('data-theme-changing', '');
    root.dataset.theme = value;
    root.style.colorScheme = value === 'flexoki-light' ? 'light' : 'dark';
    setTheme(value);
    try { localStorage.setItem(storageKey, value); } catch { /* The theme still works when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent('gpui-omarchy-theme-change', { detail: value }));
    requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-changing')));
  }

  return (
    <Menu.Root>
      <Menu.Trigger className="theme-menu-trigger" aria-label={`Theme: ${themes.find((item) => item.id === theme)?.name}`}>
        <span>{themes.find((item) => item.id === theme)?.name}</span>
        <svg className="theme-menu-caret" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="theme-menu-positioner" align="end" sideOffset={8} collisionPadding={16}>
          <Menu.Popup className="theme-menu-popup">
            <Menu.RadioGroup value={theme} onValueChange={selectTheme}>
              <Menu.GroupLabel className="theme-menu-label">Website theme</Menu.GroupLabel>
              {themes.map((item) => (
                <Menu.RadioItem className="theme-menu-item" key={item.id} value={item.id} closeOnClick>
                  <span>{item.name}</span>
                  <Menu.RadioItemIndicator className="theme-menu-check" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
