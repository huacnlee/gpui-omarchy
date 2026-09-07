use std::sync::Arc;

use gpui_omarchy::ButtonVariant;
use gpui_shell::gpui::ParentElement as _;
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentDescriptor,
    ComponentMaterializer, ComponentPayload, ComponentRegistry, ConstructorDescriptor,
    MaterializeRequest, MethodDescriptor, RegistryError, anyhow, gpui,
};

#[derive(Clone)]
struct Id(String);

#[derive(Clone)]
enum Operation {
    Label(String),
    Variant(ButtonVariant),
    Common,
}

struct Materializer;

impl ComponentMaterializer for Materializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        let id = request
            .payload()
            .downcast_ref::<Id>()
            .ok_or_else(|| anyhow::anyhow!("Button received an incompatible payload"))?
            .0
            .clone();
        let mut label = String::new();
        let mut variant = ButtonVariant::default();
        for method in request.methods() {
            match method.payload().downcast_ref::<Operation>() {
                Some(Operation::Label(value)) => label = value.clone(),
                Some(Operation::Variant(value)) => variant = *value,
                _ => {}
            }
        }
        let children = request.take_children()?;
        let mut button = request
            .with_window_app(|_, cx| {
                let caption = if children.is_empty() {
                    label.clone()
                } else {
                    String::new()
                };
                Ok(gpui_omarchy::button(id, caption, variant, cx).accessibility_label(label))
            })?
            .disabled(request.disabled())
            .selected(request.selected())
            .children(children);
        if let Some(callback) = request.on_click() {
            button = button.on_click(move |event, window, cx| callback.invoke(event, window, cx));
        }
        request.finish(button)
    }
}

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    let mut methods = vec![
        MethodDescriptor::new(
            "label",
            vec![ArgumentDescriptor::new("label", ArgumentSchema::String)],
            |args| match args {
                [ComponentArgument::String(label)] => {
                    Ok(ComponentPayload::new(Operation::Label(label.clone())))
                }
                _ => Err("Button.label expects a string".into()),
            },
        )
        .with_documentation("Sets the visible label and accessible name."),
        MethodDescriptor::new(
            "on_click",
            vec![ArgumentDescriptor::new(
                "callback",
                ArgumentSchema::Callback("(event: ClickEvent, cx: Context) => void"),
            )],
            |args| match args {
                [ComponentArgument::Callback(_)] => Ok(ComponentPayload::new(Operation::Common)),
                _ => Err("Button.on_click expects a callback".into()),
            },
        )
        .with_documentation("Runs on native pointer or keyboard activation."),
    ];
    for name in ["disabled", "selected"] {
        methods.push(
            MethodDescriptor::new(
                name,
                vec![ArgumentDescriptor::new("value", ArgumentSchema::Boolean)],
                move |args| match args {
                    [ComponentArgument::Boolean(_)] => Ok(ComponentPayload::new(Operation::Common)),
                    _ => Err(format!("Button.{name} expects a boolean")),
                },
            )
            .with_documentation("Sets the native control state."),
        );
    }
    for (name, variant) in [
        ("primary", ButtonVariant::Primary),
        ("secondary", ButtonVariant::Secondary),
        ("outline", ButtonVariant::Outline),
        ("danger", ButtonVariant::Danger),
    ] {
        methods.push(
            MethodDescriptor::new(name, vec![], move |_| {
                Ok(ComponentPayload::new(Operation::Variant(variant)))
            })
            .with_documentation("Uses the corresponding native Omarchy button variant."),
        );
    }
    registry.register(
        ComponentDescriptor::new("Button", Arc::new(Materializer))
            .with_documentation(
                "Omarchy's native button; JavaScript owns callbacks and controlled state.",
            )
            .with_constructors(vec![ConstructorDescriptor::new(
                "Button",
                vec![ArgumentDescriptor::new("id", ArgumentSchema::String)],
                |args| match args {
                    [ComponentArgument::String(id)] if !id.is_empty() => {
                        Ok(ComponentPayload::new(Id(id.clone())))
                    }
                    _ => Err("Button requires a nonempty stable string id".into()),
                },
            )])
            .with_methods(methods),
    )?;
    Ok(())
}
