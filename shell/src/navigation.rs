//! Adapters for the existing native navigation controls.
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentDescriptor,
    ComponentMaterializer, ComponentPayload, ComponentRegistry, ConstructorDescriptor,
    MaterializeRequest, MethodDescriptor, RegistryError, anyhow, gpui,
};
use std::sync::Arc;

#[derive(Clone)]
struct TabValue {
    id: String,
    label: String,
    selected: bool,
}

struct TabMaterializer;

impl ComponentMaterializer for TabMaterializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        let value = request
            .payload()
            .downcast_ref::<TabValue>()
            .ok_or_else(|| anyhow::anyhow!("Tab received incompatible arguments"))?
            .clone();
        let mut tab = request
            .with_window_app(|_, cx| {
                Ok(gpui_omarchy::tab(value.id, value.label, value.selected, cx))
            })?
            .disabled(request.disabled());
        if let Some(callback) = request.on_click() {
            tab = tab.on_click(move |event, window, cx| callback.invoke(event, window, cx));
        }
        request.finish(tab)
    }
}

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    registry.register(ComponentDescriptor::new("Tab", Arc::new(TabMaterializer))
        .with_documentation("Native controlled tab with pointer activation. This primitive does not implement compound keyboard navigation.")
        .with_constructors(vec![ConstructorDescriptor::new("Tab", vec![
            ArgumentDescriptor::new("id", ArgumentSchema::String),
            ArgumentDescriptor::new("label", ArgumentSchema::String),
            ArgumentDescriptor::new("selected", ArgumentSchema::Boolean),
        ], |args| match args {
            [ComponentArgument::String(id), ComponentArgument::String(label), ComponentArgument::Boolean(selected)] if !id.trim().is_empty() =>
                Ok(ComponentPayload::new(TabValue { id: id.clone(), label: label.clone(), selected: *selected })),
            _ => Err("Tab requires a nonempty stable id, label and selected state".into()),
        })])
        .with_methods(vec![
            MethodDescriptor::new("disabled", vec![ArgumentDescriptor::new("disabled", ArgumentSchema::Boolean)], |_| Ok(ComponentPayload::new(())))
                .with_documentation("Disables native pointer activation."),
            MethodDescriptor::new("on_click", vec![ArgumentDescriptor::new("callback", ArgumentSchema::Callback("(event: ClickEvent, cx: Context) => void"))], |_| Ok(ComponentPayload::new(())))
                .with_documentation("Handles native tab activation; JavaScript owns the selected value."),
        ]))?;
    Ok(())
}
