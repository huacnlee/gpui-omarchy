//! Corners follow Hyprland's `decoration:rounding`, as the shell's
//! `Style.cornerRadius` does (`Commons/Style.qml`): read at startup and again
//! whenever Hyprland announces `configreloaded`, which covers themes, the
//! `omarchy` corner toggles and the user's own config. Without Hyprland the
//! corners stay square, like Omarchy's default.
use gpui_kit::base::RadiusTokens;
use gpui_kit::{App, Global, Pixels, px};

/// The rounding of the desktop's windows, shared by every control and surface.
/// Separate from the palette, so an explicitly applied theme keeps it.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub(crate) struct CornerRadius(pub(crate) Pixels);
impl Global for CornerRadius {}

/// Projects the rounding into gpui-base's radius tokens, which components read:
/// `md` (and `lg`, `xl`) is the rounding itself, for controls and surfaces;
/// `sm` is half of it, for small marks such as the checkbox box in
/// `MultiSelect.qml`; `full` makes pills only when windows are rounded, as
/// `ToggleSwitch.qml` does, and stays square on sharp corners.
pub(crate) fn project(radius: Pixels, tokens: &mut RadiusTokens) {
    tokens.none = Pixels::ZERO;
    tokens.sm = radius / 2.;
    tokens.md = radius;
    tokens.lg = radius;
    tokens.xl = radius;
    tokens.full = if radius > Pixels::ZERO {
        px(9999.)
    } else {
        Pixels::ZERO
    };
}

pub(crate) fn current(cx: &App) -> Pixels {
    cx.try_global::<CornerRadius>()
        .map_or(Pixels::ZERO, |corners| corners.0)
}

#[cfg_attr(not(unix), allow(dead_code))]
pub(crate) fn set(radius: Pixels, cx: &mut App) {
    if cx.try_global::<CornerRadius>() == Some(&CornerRadius(radius)) {
        return;
    }
    cx.set_global(CornerRadius(radius));
    project(
        radius,
        &mut gpui_kit::base::Theme::global_mut(cx).tokens.radius,
    );
    cx.refresh_windows();
}

/// Starts following Hyprland's rounding when the app runs under Hyprland.
pub(crate) fn follow_hyprland(cx: &mut App) {
    #[cfg(unix)]
    if let Some(sockets) = hyprland::sockets() {
        follow(sockets, cx);
    }
    #[cfg(not(unix))]
    let _ = cx;
}

#[cfg(unix)]
fn follow(sockets: std::path::PathBuf, cx: &mut App) {
    // Listen before reading so a reload during startup is not missed.
    let (sender, reloads) = async_channel::bounded(1);
    let listening = hyprland::listen(&sockets, sender);
    if let Some(rounding) = hyprland::rounding(&sockets) {
        set(px(rounding as f32), cx);
    }
    if let Err(error) = listening {
        eprintln!("Cannot follow Hyprland's corners: {error}");
        return;
    }
    cx.spawn(async move |cx| {
        while reloads.recv().await.is_ok() {
            let sockets = sockets.clone();
            let rounding = cx
                .background_executor()
                .spawn(async move { hyprland::rounding(&sockets) })
                .await;
            if let Some(rounding) = rounding {
                cx.update(|cx| set(px(rounding as f32), cx));
            }
        }
    })
    .detach();
}

/// Hyprland's IPC: `.socket.sock` answers requests the way `hyprctl` sends them,
/// and `.socket2.sock` streams `event>>data` lines.
#[cfg(unix)]
mod hyprland {
    use std::io::{BufRead, BufReader, Read, Write};
    use std::os::unix::net::UnixStream;
    use std::path::{Path, PathBuf};
    use std::time::Duration;

    /// A Hyprland that stops answering must not hold up startup for long.
    const TIMEOUT: Duration = Duration::from_millis(250);

    pub(super) fn sockets() -> Option<PathBuf> {
        let runtime = std::env::var_os("XDG_RUNTIME_DIR")?;
        let instance = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE")?;
        (!runtime.is_empty() && !instance.is_empty())
            .then(|| PathBuf::from(runtime).join("hypr").join(instance))
    }

    /// `hyprctl -j getoption decoration:rounding`, without starting hyprctl.
    pub(super) fn rounding(sockets: &Path) -> Option<u32> {
        let mut socket = UnixStream::connect(sockets.join(".socket.sock")).ok()?;
        socket.set_read_timeout(Some(TIMEOUT)).ok()?;
        socket.set_write_timeout(Some(TIMEOUT)).ok()?;
        socket.write_all(b"j/getoption decoration:rounding").ok()?;
        let mut reply = String::new();
        socket.read_to_string(&mut reply).ok()?;
        parse_rounding(&reply)
    }

    /// `{"option": "decoration:rounding", "int": 6, "set": true }`
    pub(super) fn parse_rounding(reply: &str) -> Option<u32> {
        let reply: serde_json::Value = serde_json::from_str(reply).ok()?;
        u32::try_from(reply.get("int")?.as_i64()?).ok()
    }

    /// Signals each finished config reload until the receiver is gone or
    /// Hyprland exits. Hyprland only announces a reload once its new values
    /// are in effect, so the rounding can be read right away.
    pub(super) fn listen(
        sockets: &Path,
        reloads: async_channel::Sender<()>,
    ) -> std::io::Result<()> {
        let socket = UnixStream::connect(sockets.join(".socket2.sock"))?;
        std::thread::Builder::new()
            .name("hyprland-events".into())
            .spawn(move || {
                // Bytes, not lines of text: other events carry window titles,
                // which needn't be valid UTF-8.
                for event in BufReader::new(socket).split(b'\n') {
                    let Ok(event) = event else { break };
                    if is_reload(&event) {
                        // A full channel already holds a reload to act on.
                        let _ = reloads.try_send(());
                    }
                    if reloads.is_closed() {
                        break;
                    }
                }
            })?;
        Ok(())
    }

    pub(super) fn is_reload(event: &[u8]) -> bool {
        event.starts_with(b"configreloaded>>")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sharp_corners_project_to_square_tokens() {
        let mut tokens = RadiusTokens::default();
        project(Pixels::ZERO, &mut tokens);
        for token in [
            tokens.none,
            tokens.sm,
            tokens.md,
            tokens.lg,
            tokens.xl,
            tokens.full,
        ] {
            assert_eq!(token, Pixels::ZERO);
        }
    }

    #[test]
    fn rounded_corners_project_by_role() {
        let mut tokens = RadiusTokens::default();
        project(px(6.), &mut tokens);
        assert_eq!(tokens.none, Pixels::ZERO);
        assert_eq!(tokens.sm, px(3.), "small marks take half");
        assert_eq!(tokens.md, px(6.));
        assert_eq!(tokens.lg, px(6.));
        assert_eq!(tokens.xl, px(6.));
        assert!(tokens.full >= px(9999.), "switches become pills");
    }

    #[gpui_kit::test]
    fn an_explicit_theme_keeps_the_corners(cx: &mut gpui_kit::TestAppContext) {
        cx.update(|cx| {
            gpui_kit::base::init(cx);
            crate::Theme::tokyo_night().apply(cx);
            assert_eq!(
                gpui_kit::base::Theme::global(cx).tokens.radius.md,
                Pixels::ZERO,
                "square until the desktop says otherwise"
            );
            set(px(6.), cx);
            crate::Theme::flexoki_light().apply(cx);
            assert_eq!(gpui_kit::base::Theme::global(cx).tokens.radius.md, px(6.));
        });
    }

    #[cfg(unix)]
    mod hyprland {
        use super::super::hyprland::*;
        use super::super::*;
        use std::io::{Read, Write};
        use std::os::unix::net::{UnixListener, UnixStream};
        use std::sync::{Arc, Mutex};
        use std::thread;
        use std::time::{Duration, Instant};

        #[test]
        fn rounding_is_read_from_the_json_reply() {
            assert_eq!(
                parse_rounding(r#"{"option": "decoration:rounding", "int": 6, "set": true }"#),
                Some(6)
            );
            assert_eq!(
                parse_rounding(r#"{"option": "decoration:rounding", "int": 0, "set": false }"#),
                Some(0)
            );
            assert_eq!(parse_rounding(r#"{"int": -1}"#), None);
            assert_eq!(parse_rounding("no such option"), None);
            assert_eq!(parse_rounding(""), None);
        }

        #[test]
        fn only_a_finished_reload_counts() {
            assert!(is_reload(b"configreloaded>>"));
            assert!(!is_reload(b"activewindow>>kitty,configreloaded>>"));
            assert!(!is_reload(b"activewindow>>\xff\xfe"));
            assert!(!is_reload(b""));
        }

        /// A stand-in for Hyprland's two sockets: requests are answered with
        /// the current rounding, and events are written on demand.
        struct FakeHyprland {
            dir: tempfile::TempDir,
            rounding: Arc<Mutex<i64>>,
            requests: Arc<Mutex<Vec<String>>>,
            listener: Arc<Mutex<Option<UnixStream>>>,
        }

        impl FakeHyprland {
            fn start(rounding: i64) -> Self {
                // Socket paths are limited to about a hundred bytes.
                let dir = tempfile::Builder::new().tempdir_in("/tmp").unwrap();
                let rounding = Arc::new(Mutex::new(rounding));
                let requests = Arc::new(Mutex::new(Vec::new()));
                let listener = Arc::new(Mutex::new(None));
                let control = UnixListener::bind(dir.path().join(".socket.sock")).unwrap();
                let events = UnixListener::bind(dir.path().join(".socket2.sock")).unwrap();
                let (answer, log) = (rounding.clone(), requests.clone());
                thread::spawn(move || {
                    for mut stream in control.incoming().flatten() {
                        let mut request = [0; 256];
                        let n = stream.read(&mut request).unwrap_or(0);
                        log.lock()
                            .unwrap()
                            .push(String::from_utf8_lossy(&request[..n]).into_owned());
                        let reply = format!(
                            r#"{{"option": "decoration:rounding", "int": {}, "set": true }}"#,
                            answer.lock().unwrap()
                        );
                        let _ = stream.write_all(reply.as_bytes());
                    }
                });
                let accepted = listener.clone();
                thread::spawn(move || {
                    if let Ok((stream, _)) = events.accept() {
                        *accepted.lock().unwrap() = Some(stream);
                    }
                });
                Self {
                    dir,
                    rounding,
                    requests,
                    listener,
                }
            }

            fn sockets(&self) -> std::path::PathBuf {
                self.dir.path().to_path_buf()
            }

            fn set_rounding(&self, rounding: i64) {
                *self.rounding.lock().unwrap() = rounding;
            }

            fn requests(&self) -> Vec<String> {
                self.requests.lock().unwrap().clone()
            }

            fn announce(&self, event: &[u8]) {
                let deadline = Instant::now() + Duration::from_secs(5);
                loop {
                    if let Some(stream) = self.listener.lock().unwrap().as_mut() {
                        stream.write_all(event).unwrap();
                        return;
                    }
                    assert!(Instant::now() < deadline, "nothing listens to events");
                    thread::sleep(Duration::from_millis(10));
                }
            }
        }

        fn wait_for_radius(cx: &mut gpui_kit::TestAppContext, expected: Pixels) {
            let deadline = Instant::now() + Duration::from_secs(5);
            loop {
                cx.run_until_parked();
                if cx.update(|cx| current(cx)) == expected {
                    return;
                }
                assert!(
                    Instant::now() < deadline,
                    "the corners did not follow Hyprland"
                );
                // The event arrives on a real thread; leave GPUI's clock alone.
                thread::sleep(Duration::from_millis(10));
            }
        }

        fn md(cx: &mut gpui_kit::TestAppContext) -> Pixels {
            cx.update(|cx| gpui_kit::base::Theme::global(cx).tokens.radius.md)
        }

        #[gpui_kit::test]
        fn corners_follow_hyprland_reloads(cx: &mut gpui_kit::TestAppContext) {
            cx.background_executor.allow_parking();
            let hyprland = FakeHyprland::start(8);
            cx.update(|cx| {
                gpui_kit::base::init(cx);
                follow(hyprland.sockets(), cx);
            });
            assert_eq!(md(cx), px(8.), "read before the first frame");
            assert_eq!(hyprland.requests(), ["j/getoption decoration:rounding"]);

            hyprland.set_rounding(0);
            hyprland.announce(b"configreloaded>>\n");
            wait_for_radius(cx, Pixels::ZERO);
            assert_eq!(md(cx), Pixels::ZERO);

            hyprland.set_rounding(10);
            hyprland.announce(b"activewindow>>kitty,~\nconfigreloaded>>\n");
            wait_for_radius(cx, px(10.));
            assert_eq!(md(cx), px(10.));
        }

        #[gpui_kit::test]
        fn without_a_running_hyprland_corners_stay_square(cx: &mut gpui_kit::TestAppContext) {
            let gone = tempfile::Builder::new().tempdir_in("/tmp").unwrap();
            cx.update(|cx| {
                gpui_kit::base::init(cx);
                crate::Theme::tokyo_night().apply(cx);
                follow(gone.path().join("hypr"), cx);
            });
            cx.run_until_parked();
            assert_eq!(md(cx), Pixels::ZERO);
        }
    }
}
