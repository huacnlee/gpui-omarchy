#[test]
fn javascript_catalog_exposes_native_buttons() {
    let runtime = gpui_shell::ShellRuntime::new_isolated_with_components(
        gpui_omarchy_shell::components().unwrap(),
    )
    .unwrap();
    let declarations = runtime.type_declarations();
    assert!(declarations.contains("declare module \"gpui-component\""));
    assert!(declarations.contains("new(id: string): ButtonElement"));
    assert!(declarations.contains("primary(): ButtonElement"));
}

#[test]
fn javascript_catalog_exposes_native_surfaces_and_tables() {
    let catalog = gpui_omarchy_shell::components().unwrap();
    let exports: Vec<_> = catalog
        .descriptors()
        .flat_map(|descriptor| {
            descriptor
                .constructors()
                .iter()
                .map(|constructor| constructor.export())
        })
        .collect();
    for name in [
        "Panel",
        "Separator",
        "VerticalSeparator",
        "Keycap",
        "Badge",
        "EmptyState",
        "Progress",
        "Toast",
        "Table",
        "TableRow",
        "TableHead",
        "TableCell",
        "DialogBackdrop",
        "DialogPopup",
        "DialogTitle",
        "DialogDescription",
        "SheetSurface",
        "PopoverSurface",
        "AccordionPanel",
    ] {
        assert!(exports.contains(&name), "missing native export {name}");
    }
}

#[test]
fn controlled_native_controls_publish_change_callbacks() {
    let catalog = gpui_omarchy_shell::components().unwrap();
    for name in ["Checkbox", "Switch", "Radio", "Toggle"] {
        let descriptor = catalog
            .descriptors()
            .find(|descriptor| descriptor.name() == name)
            .unwrap_or_else(|| panic!("missing native export {name}"));
        for method in ["on_change", "disabled"] {
            assert!(
                descriptor
                    .methods()
                    .iter()
                    .any(|descriptor| descriptor.name() == method)
            );
        }
    }
}

#[test]
fn javascript_catalog_exposes_native_media() {
    let catalog = gpui_omarchy_shell::components().unwrap();
    for name in ["Avatar", "AvatarImage", "Icon", "Markdown", "Html"] {
        assert!(
            catalog
                .descriptors()
                .any(|descriptor| descriptor.name() == name),
            "missing native export {name}"
        );
    }
}

#[test]
fn javascript_catalog_exposes_native_navigation() {
    let runtime = gpui_shell::ShellRuntime::new_isolated_with_components(
        gpui_omarchy_shell::components().unwrap(),
    )
    .unwrap();
    let declarations = runtime.type_declarations();
    for name in [
        "Tabs",
        "Tab",
        "ToggleGroup",
        "FocusScope",
        "Tooltip",
        "ChoiceItem",
        "ButtonGroup",
        "TabList",
    ] {
        assert!(
            declarations.contains(&format!("{name}Element")),
            "missing {name}"
        );
    }
    assert!(declarations.contains("new(id: string, label: string, selected: boolean): TabElement"));
}

#[test]
fn javascript_editors_accept_the_shells_existing_state_types() {
    let runtime = gpui_shell::ShellRuntime::new_isolated_with_components(
        gpui_omarchy_shell::components().unwrap(),
    )
    .unwrap();
    let declarations = runtime.type_declarations();
    for name in [
        "Input",
        "Textarea",
        "NumberInput",
        "Calendar",
        "Slider",
        "OtpInput",
    ] {
        assert!(
            declarations.contains(&format!("{name}Element")),
            "missing {name}"
        );
    }
    // The adapter must not replace the built-in editing states with opaque
    // component states that lack value/focus/event methods.
    assert_eq!(gpui_omarchy_shell::components().unwrap().states().len(), 0);
}
