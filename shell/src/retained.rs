//! Stateful native widgets over the shell's existing entity handles.
use gpui::{IntoElement as _, Refineable as _, Styled as _};
use gpui_kit::base::{CalendarState, OtpState, slider::SliderState};
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentDescriptor,
    ComponentMaterializer, ComponentPayload, ComponentRegistry, ConstructorDescriptor,
    MaterializeRequest, MethodDescriptor, RegistryError, anyhow, gpui,
};
use std::sync::Arc;

#[derive(Clone, Copy)]
enum Kind {
    Calendar,
    Slider,
    OtpInput,
}
struct Materializer(Kind);

impl ComponentMaterializer for Materializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        let argument = request
            .payload()
            .downcast_ref::<ComponentArgument>()
            .ok_or_else(|| anyhow::anyhow!("widget received incompatible state"))?;
        let disabled = request.disabled();
        match self.0 {
            Kind::Calendar => {
                let state = request.native_state::<CalendarState>(argument)?;
                let mut element = request.with_window_app(|_, cx| {
                    Ok(gpui_omarchy::calendar(
                        format!("omarchy-calendar-{}", state.entity_id()),
                        &state,
                        cx,
                    ))
                })?;
                anyhow::ensure!(
                    request.children_len() == 0,
                    "Calendar does not accept ordinary children"
                );
                element.style().refine(&request.take_style());
                Ok(element.into_any_element())
            }
            Kind::Slider => {
                let state = request.native_state::<SliderState>(argument)?;
                let element = request.with_window_app(|window, cx| {
                    Ok(gpui_omarchy::slider(&state, disabled, window, cx))
                })?;
                request.finish(element)
            }
            Kind::OtpInput => {
                let state = request.native_state::<OtpState>(argument)?;
                let element = request.with_window_app(|window, cx| {
                    Ok(gpui_omarchy::otp_input(&state, window, cx).disabled(disabled))
                })?;
                request.finish(element)
            }
        }
    }
}

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    for (name, state, kind) in [
        ("Calendar", "CalendarState", Kind::Calendar),
        ("Slider", "SliderState", Kind::Slider),
        ("OtpInput", "OtpState", Kind::OtpInput),
    ] {
        let mut descriptor = ComponentDescriptor::new(name, Arc::new(Materializer(kind)))
            .with_documentation("Native Omarchy widget using an existing shell state. Create state once in init and subscribe through its existing event API.")
            .with_constructors(vec![ConstructorDescriptor::new(name,
                vec![ArgumentDescriptor::new("state", ArgumentSchema::Entity(state))],
                |args| match args {
                    [argument @ ComponentArgument::Entity { .. }] => Ok(ComponentPayload::new(argument.clone())),
                    _ => Err("widget expects a native state entity".into()),
                })]);
        if !matches!(kind, Kind::Calendar) {
            descriptor = descriptor.with_methods(vec![
                MethodDescriptor::new(
                    "disabled",
                    vec![ArgumentDescriptor::new("disabled", ArgumentSchema::Boolean)],
                    |_| Ok(ComponentPayload::new(())),
                )
                .with_documentation("Disables pointer and keyboard editing."),
            ]);
        }
        registry.register(descriptor)?;
    }
    Ok(())
}
