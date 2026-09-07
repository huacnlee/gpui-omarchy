//! Native input presentation over the shell's existing editing entities.
use gpui_kit::base::input::{InputState, TextareaState};
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentDescriptor,
    ComponentMaterializer, ComponentPayload, ComponentRegistry, ConstructorDescriptor,
    MaterializeRequest, RegistryError, anyhow, gpui,
};
use std::sync::Arc;

#[derive(Clone, Copy)]
enum Kind {
    Input,
    Textarea,
    NumberInput,
}

struct Materializer(Kind);

impl ComponentMaterializer for Materializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        let argument = request
            .payload()
            .downcast_ref::<ComponentArgument>()
            .ok_or_else(|| anyhow::anyhow!("input received incompatible state"))?;
        match self.0 {
            Kind::Input => {
                let state = request.native_state::<InputState>(argument)?;
                let element = request.with_window_app(|window, cx| {
                    Ok(gpui_omarchy::input(
                        format!("omarchy-input-{}", state.entity_id()),
                        &state,
                        window,
                        cx,
                    ))
                })?;
                request.finish(element)
            }
            Kind::Textarea => {
                let state = request.native_state::<TextareaState>(argument)?;
                let element = request.with_window_app(|window, cx| {
                    Ok(gpui_omarchy::textarea(
                        format!("omarchy-textarea-{}", state.entity_id()),
                        &state,
                        window,
                        cx,
                    ))
                })?;
                request.finish(element)
            }
            Kind::NumberInput => {
                let state = request.native_state::<InputState>(argument)?;
                let element =
                    request.with_window_app(|_, cx| Ok(gpui_omarchy::number_input(&state, cx)))?;
                request.finish(element)
            }
        }
    }
}

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    for (name, state, kind) in [
        ("Input", "InputState", Kind::Input),
        ("Textarea", "TextareaState", Kind::Textarea),
        ("NumberInput", "InputState", Kind::NumberInput),
    ] {
        registry.register(ComponentDescriptor::new(name, Arc::new(Materializer(kind)))
            .with_documentation("Native Omarchy editor using the shell's existing retained state. Create state in init; its value, focus and event methods remain available.")
            .with_constructors(vec![ConstructorDescriptor::new(name,
                vec![ArgumentDescriptor::new("state", ArgumentSchema::Entity(state))],
                |args| match args {
                    [argument @ ComponentArgument::Entity { .. }] => Ok(ComponentPayload::new(argument.clone())),
                    _ => Err("editor expects a native editing state".into()),
                })]))?;
    }
    Ok(())
}
