use std::{env, fs, path::PathBuf};

fn main() {
    let source = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../js/src");
    println!("cargo:rerun-if-changed={}", source.display());
    let mut files = fs::read_dir(&source)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| path.is_file())
        .collect::<Vec<_>>();
    files.sort();
    let mut output = String::from("pub const JAVASCRIPT_FILES: &[(&str, &str)] = &[\n");
    for path in files {
        output.push_str(&format!(
            "({:?}, include_str!({:?})),\n",
            path.file_name().unwrap().to_str().unwrap(),
            path
        ));
    }
    output.push_str(&format!(
        "(\"LICENSE\", include_str!({:?})),\n",
        source.parent().unwrap().join("LICENSE")
    ));
    println!(
        "cargo:rerun-if-changed={}",
        source.parent().unwrap().join("LICENSE").display()
    );
    output.push_str("];\n");
    fs::write(
        PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("javascript.rs"),
        output,
    )
    .unwrap();
}
