//! Watch directories rather than files so atomic saves and symlink swaps survive.
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

pub(super) struct PaletteWatcher {
    watcher: RecommendedWatcher,
    paths: BTreeMap<PathBuf, Identity>,
}

// A deleted directory can be recreated at the same path before events are read.
// Its old OS watch then refers to a different inode and must be replaced.
#[cfg(unix)]
type Identity = (u64, u64);
#[cfg(not(unix))]
type Identity = Option<std::time::SystemTime>;

fn identity(metadata: &fs::Metadata) -> Identity {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        (metadata.dev(), metadata.ino())
    }
    #[cfg(not(unix))]
    metadata.created().ok()
}

impl PaletteWatcher {
    pub(super) fn new(home: &Path) -> notify::Result<(Self, async_channel::Receiver<()>)> {
        // Coalesce bursts without blocking the OS callback or growing a queue.
        let (sender, receiver) = async_channel::bounded(1);
        let watcher = notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
            // Reading the palette must not trigger another reload on Linux.
            if !matches!(&event, Ok(event) if event.kind.is_access()) {
                if let Err(error) = event {
                    eprintln!("Omarchy theme watcher error: {error}");
                }
                let _ = sender.try_send(());
            }
        })?;
        let mut watcher = Self {
            watcher,
            paths: BTreeMap::new(),
        };
        watcher.refresh(home);
        Ok((watcher, receiver))
    }

    pub(super) fn refresh(&mut self, home: &Path) {
        let mut desired = BTreeMap::new();
        // Start at both consumed files so file symlinks are followed too;
        // retaining their lexical ancestors also catches link replacement.
        for relative in [
            ".local/state/omarchy/current/theme/colors.toml",
            ".local/state/omarchy/current/theme.name",
            ".config/omarchy/current/theme/colors.toml",
            ".config/omarchy/current/theme.name",
        ] {
            let path = home.join(relative);
            for ancestor in path.ancestors() {
                add_directory(ancestor, &mut desired);
                // Also watch a dangling link's target parents for later creation.
                if let Ok(target) = fs::read_link(ancestor) {
                    let target = ancestor.parent().unwrap_or(home).join(target);
                    for parent in target.ancestors() {
                        if parent.is_dir() {
                            add_directory(parent, &mut desired);
                            if let Some(grandparent) = parent.parent() {
                                add_directory(grandparent, &mut desired);
                            }
                            break;
                        }
                    }
                }
                if ancestor == home {
                    break;
                }
            }
        }
        self.paths.retain(|path, old| {
            if desired.get(path) == Some(old) {
                true
            } else {
                let _ = self.watcher.unwatch(path);
                false
            }
        });
        for (path, identity) in desired {
            if !self.paths.contains_key(&path) {
                match self.watcher.watch(&path, RecursiveMode::NonRecursive) {
                    Ok(()) => {
                        self.paths.insert(path, identity);
                    }
                    Err(error) => {
                        eprintln!("Cannot watch Omarchy path {}: {error}", path.display())
                    }
                }
            }
        }
    }
}

fn add_directory(path: &Path, paths: &mut BTreeMap<PathBuf, Identity>) {
    if let Ok(path) = fs::canonicalize(path) {
        if let Ok(metadata) = fs::metadata(&path) {
            if metadata.is_dir() {
                paths.insert(path, identity(&metadata));
            }
        }
    }
}
