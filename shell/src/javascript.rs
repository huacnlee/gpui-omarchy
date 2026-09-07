//! Build-time distribution of the JavaScript composition helpers.
use std::{fs, io, path::Path};

include!(concat!(env!("OUT_DIR"), "/javascript.rs"));

/// Materialize the bundled JS package inside an application's resource root.
/// Available without GPUI so applications can call this from `build.rs`.
pub fn write_javascript(directory: impl AsRef<Path>) -> io::Result<()> {
    let directory = directory.as_ref();
    fs::create_dir_all(directory)?;
    for (name, source) in JAVASCRIPT_FILES {
        let path = directory.join(name);
        if fs::read_to_string(&path).ok().as_deref() != Some(source) {
            fs::write(path, source)?;
        }
    }
    Ok(())
}
