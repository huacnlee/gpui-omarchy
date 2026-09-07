//! Typed choices and native single-selection groups.
use gpui::{
    Element, IntoElement as _, Refineable as _, StatefulInteractiveElement as _, Styled as _,
};
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentCallbackArgument,
    ComponentDescriptor, ComponentMaterializer, ComponentPayload, ComponentRegistry,
    ConstructorDescriptor, MaterializeRequest, MethodDescriptor, RegistryError, anyhow, gpui,
};
use std::sync::Arc;

// A ChoiceItem is configuration for a native parent, never an independently
// painted row. The concrete element lets the parent recover its Rust value.
struct Choice(gpui_omarchy::ChoiceItem);
impl gpui::IntoElement for Choice {
    type Element = Self;
    fn into_element(self) -> Self {
        self
    }
}
impl Element for Choice {
    type RequestLayoutState = ();
    type PrepaintState = ();
    fn id(&self) -> Option<gpui::ElementId> {
        None
    }
    fn source_location(&self) -> Option<&'static std::panic::Location<'static>> {
        None
    }
    fn request_layout(
        &mut self,
        _: Option<&gpui::GlobalElementId>,
        _: Option<&gpui::InspectorElementId>,
        window: &mut gpui::Window,
        cx: &mut gpui::App,
    ) -> (gpui::LayoutId, ()) {
        (window.request_layout(gpui::Style::default(), [], cx), ())
    }
    fn prepaint(
        &mut self,
        _: Option<&gpui::GlobalElementId>,
        _: Option<&gpui::InspectorElementId>,
        _: gpui::Bounds<gpui::Pixels>,
        _: &mut (),
        _: &mut gpui::Window,
        _: &mut gpui::App,
    ) {
    }
    fn paint(
        &mut self,
        _: Option<&gpui::GlobalElementId>,
        _: Option<&gpui::InspectorElementId>,
        _: gpui::Bounds<gpui::Pixels>,
        _: &mut (),
        _: &mut (),
        _: &mut gpui::Window,
        _: &mut gpui::App,
    ) {
    }
}

struct ItemMaterializer;
impl ComponentMaterializer for ItemMaterializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        anyhow::ensure!(
            request.children_len() == 0,
            "ChoiceItem does not accept children"
        );
        anyhow::ensure!(
            request.take_style() == Default::default(),
            "ChoiceItem is option data; style the group instead"
        );
        let item = request
            .payload()
            .downcast_ref::<gpui_omarchy::ChoiceItem>()
            .ok_or_else(|| anyhow::anyhow!("ChoiceItem received incompatible data"))?
            .clone();
        Ok(Choice(item.disabled(request.disabled())).into_any_element())
    }
}

#[derive(Clone)]
struct Group {
    id: String,
    selected: Option<String>,
}
#[derive(Clone)]
enum Operation {
    Change(ComponentArgument),
    Label(String),
}
struct GroupMaterializer {
    tabs: bool,
}

impl ComponentMaterializer for GroupMaterializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        let group = request
            .payload()
            .downcast_ref::<Group>()
            .ok_or_else(|| anyhow::anyhow!("choice group received incompatible data"))?
            .clone();
        let mut items = Vec::new();
        for mut child in request.take_typed_children()? {
            anyhow::ensure!(
                child.component_name() == Some("ChoiceItem"),
                "choice groups accept only ChoiceItem children"
            );
            let mut child = request.materialize_child(&mut child)?;
            items.push(
                child
                    .downcast_mut::<Choice>()
                    .ok_or_else(|| {
                        anyhow::anyhow!("ChoiceItem materialized an incompatible value")
                    })?
                    .0
                    .clone(),
            );
        }
        if request.disabled() {
            for item in &mut items {
                item.disabled = true;
            }
        }
        let mut values = std::collections::HashSet::new();
        for item in &items {
            anyhow::ensure!(
                values.insert(item.value.clone()),
                "choice values must be unique"
            );
        }
        let selected = group.selected.as_ref().and_then(|selected| {
            items
                .iter()
                .position(|item| item.value.as_ref() == selected)
        });
        let mut callback = None;
        let mut label = String::new();
        for method in request.methods() {
            match method.payload().downcast_ref::<Operation>() {
                Some(Operation::Change(argument)) => {
                    callback = Some(request.resolve_callback(argument)?)
                }
                Some(Operation::Label(value)) => label = value.clone(),
                _ => {}
            }
        }
        let values: Vec<_> = items.iter().map(|item| item.value.to_string()).collect();
        let change = move |index: usize, window: &mut gpui::Window, cx: &mut gpui::App| {
            if let (Some(callback), Some(value)) = (&callback, values.get(index)) {
                callback.invoke_and_report_with(
                    "choice.on_change",
                    &[ComponentCallbackArgument::String(value.clone())],
                    window,
                    cx,
                );
            }
        };
        let style = request.take_style();
        macro_rules! build {
            ($constructor:path) => {{
                let mut element = request.with_window_app(|window, cx| {
                    Ok($constructor(group.id, items, selected, change, window, cx))
                })?;
                if !label.is_empty() {
                    element = element.aria_label(label);
                }
                element.style().refine(&style);
                Ok(element.into_any_element())
            }};
        }
        if self.tabs {
            build!(gpui_omarchy::tab_list)
        } else {
            build!(gpui_omarchy::button_group)
        }
    }
}

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    registry.register(
        ComponentDescriptor::new("ChoiceItem", Arc::new(ItemMaterializer))
            .with_documentation(
                "An option for ButtonGroup or TabList, identified by its stable string value.",
            )
            .with_constructors(vec![ConstructorDescriptor::new(
                "ChoiceItem",
                vec![
                    ArgumentDescriptor::new("value", ArgumentSchema::String),
                    ArgumentDescriptor::new("label", ArgumentSchema::String),
                ],
                |args| match args {
                    [
                        ComponentArgument::String(value),
                        ComponentArgument::String(label),
                    ] if !value.trim().is_empty() && !label.trim().is_empty() => {
                        Ok(ComponentPayload::new(gpui_omarchy::ChoiceItem::new(
                            value.clone(),
                            label.clone(),
                        ))
                        .with_debug_label(format!("{value}: {label}")))
                    }
                    _ => Err("ChoiceItem requires a nonempty value and a label".into()),
                },
            )])
            .with_methods(vec![
                MethodDescriptor::new(
                    "disabled",
                    vec![ArgumentDescriptor::new("disabled", ArgumentSchema::Boolean)],
                    |_| Ok(ComponentPayload::new(())),
                )
                .with_documentation("Skips this option during pointer and keyboard activation."),
            ]),
    )?;
    for (name, tabs) in [("ButtonGroup", false), ("TabList", true)] {
        registry.register(ComponentDescriptor::new(name, Arc::new(GroupMaterializer { tabs }))
            .with_documentation("Native single-selection group. Arrow keys move focus, Enter/Space commit. JavaScript owns the selected string value.")
            .with_constructors(vec![ConstructorDescriptor::new(name, vec![
                ArgumentDescriptor::new("id", ArgumentSchema::String),
                ArgumentDescriptor::new("selected", ArgumentSchema::Optional(Box::new(ArgumentSchema::String))),
            ], |args| match args {
                [ComponentArgument::String(id), ComponentArgument::Optional(selected)] if !id.trim().is_empty() => {
                    let selected = match selected.as_deref() {
                        Some(ComponentArgument::String(value)) => Some(value.clone()),
                        None => None,
                        _ => return Err("selected expects a string".into()),
                    };
                    Ok(ComponentPayload::new(Group { id: id.clone(), selected }).with_debug_label(id.clone()))
                }
                _ => Err("choice group requires a nonempty id and optional selected value".into()),
            })])
            .with_methods(vec![
                MethodDescriptor::new("disabled", vec![ArgumentDescriptor::new("disabled", ArgumentSchema::Boolean)], |_| Ok(ComponentPayload::new(())))
                    .with_documentation("Disables every option in this group."),
                MethodDescriptor::new("on_change", vec![ArgumentDescriptor::new("callback", ArgumentSchema::Callback("(value: string, cx: Context) => void"))], |args| match args {
                    [argument @ ComponentArgument::Callback(_)] => Ok(ComponentPayload::new(Operation::Change(argument.clone()))),
                    _ => Err("on_change expects a callback".into()),
                }).with_documentation("Reports the requested option value."),
                MethodDescriptor::new("accessibility_label", vec![ArgumentDescriptor::new("label", ArgumentSchema::String)], |args| match args {
                    [ComponentArgument::String(label)] => Ok(ComponentPayload::new(Operation::Label(label.clone()))),
                    _ => Err("accessibility_label expects text".into()),
                }).with_documentation("Names the choice group for assistive technology."),
            ]))?;
    }
    Ok(())
}
