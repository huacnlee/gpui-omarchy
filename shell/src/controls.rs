//! Controlled native inputs. Script state is passed at construction, and native
//! activation reports the next value without retaining a second script model.
use std::sync::Arc;

use gpui_kit::base::CheckboxState;
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentCallbackArgument,
    ComponentDescriptor, ComponentMaterializer, ComponentPayload, ComponentRegistry,
    ConstructorDescriptor, MaterializeRequest, MethodDescriptor, RegistryError, anyhow, gpui,
};

#[derive(Clone, Copy)]
enum Kind {
    Checkbox,
    Switch,
    Radio,
    Toggle,
}

#[derive(Clone)]
struct Value {
    id: String,
    label: String,
    checked: bool,
    indeterminate: bool,
}

#[derive(Clone)]
enum Operation {
    Change(ComponentArgument),
    Disabled,
}

struct Materializer(Kind);

impl ComponentMaterializer for Materializer {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<gpui::AnyElement> {
        let value = request
            .payload()
            .downcast_ref::<Value>()
            .ok_or_else(|| anyhow::anyhow!("control received incompatible arguments"))?
            .clone();
        let mut change = None;
        for method in request.methods() {
            if let Some(Operation::Change(argument)) = method.payload().downcast_ref::<Operation>()
            {
                change = Some(request.resolve_callback(argument)?);
            }
        }
        let disabled = request.disabled();
        macro_rules! boolean_control {
            ($constructor:path, $name:literal) => {{
                let mut control = request
                    .with_window_app(|_, cx| {
                        Ok($constructor(value.id, value.label, value.checked, cx))
                    })?
                    .disabled(disabled);
                if let Some(callback) = change {
                    control = control.on_change(move |checked, _, window, cx| {
                        callback.invoke_and_report_with(
                            concat!($name, ".on_change"),
                            &[ComponentCallbackArgument::Boolean(checked)],
                            window,
                            cx,
                        );
                    });
                }
                request.finish(control)
            }};
        }
        match self.0 {
            Kind::Checkbox => {
                let state = if value.indeterminate {
                    CheckboxState::Indeterminate
                } else if value.checked {
                    CheckboxState::Checked
                } else {
                    CheckboxState::Unchecked
                };
                let mut control = request
                    .with_window_app(|_, cx| {
                        Ok(gpui_omarchy::checkbox(value.id, value.label, state, cx))
                    })?
                    .disabled(disabled);
                if let Some(callback) = change {
                    control = control.on_change(move |state, _, window, cx| {
                        let state = match state {
                            CheckboxState::Checked => "checked",
                            CheckboxState::Unchecked => "unchecked",
                            CheckboxState::Indeterminate => "indeterminate",
                        };
                        callback.invoke_and_report_with(
                            "Checkbox.on_change",
                            &[ComponentCallbackArgument::String(state.into())],
                            window,
                            cx,
                        );
                    });
                }
                request.finish(control)
            }
            Kind::Switch => boolean_control!(gpui_omarchy::switch, "Switch"),
            Kind::Radio => boolean_control!(gpui_omarchy::radio, "Radio"),
            Kind::Toggle => boolean_control!(gpui_omarchy::toggle, "Toggle"),
        }
    }
}

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    for (name, kind) in [
        ("Checkbox", Kind::Checkbox),
        ("Switch", Kind::Switch),
        ("Radio", Kind::Radio),
        ("Toggle", Kind::Toggle),
    ] {
        let state_schema = if matches!(kind, Kind::Checkbox) {
            ArgumentSchema::Enum(&["unchecked", "checked", "indeterminate"])
        } else {
            ArgumentSchema::Boolean
        };
        let callback_schema = if matches!(kind, Kind::Checkbox) {
            "(state: 'unchecked' | 'checked' | 'indeterminate', cx: Context) => void"
        } else {
            "(checked: boolean, cx: Context) => void"
        };
        registry.register(ComponentDescriptor::new(name, Arc::new(Materializer(kind)))
            .with_documentation("Native Omarchy controlled input. JavaScript owns the current value and handles on_change.")
            .with_constructors(vec![ConstructorDescriptor::new(name, vec![
                ArgumentDescriptor::new("id", ArgumentSchema::String),
                ArgumentDescriptor::new("label", ArgumentSchema::String),
                ArgumentDescriptor::new("state", state_schema),
            ], move |arguments| {
                let [ComponentArgument::String(id), ComponentArgument::String(label), state] = arguments else {
                    return Err(format!("{name} expects an id, label and controlled state"));
                };
                if id.trim().is_empty() { return Err(format!("{name} requires a stable nonempty id")); }
                let (checked, indeterminate) = match (kind, state) {
                    (Kind::Checkbox, ComponentArgument::Enum(state)) => match state.as_str() {
                        "checked" => (true, false),
                        "unchecked" => (false, false),
                        "indeterminate" => (false, true),
                        _ => return Err("invalid Checkbox state".into()),
                    },
                    (_, ComponentArgument::Boolean(checked)) => (*checked, false),
                    _ => return Err(format!("invalid {name} state")),
                };
                Ok(ComponentPayload::new(Value { id: id.clone(), label: label.clone(), checked, indeterminate }))
            })])
            .with_methods(vec![
                MethodDescriptor::new("disabled", vec![ArgumentDescriptor::new("disabled", ArgumentSchema::Boolean)], |arguments| match arguments {
                    [ComponentArgument::Boolean(_)] => Ok(ComponentPayload::new(Operation::Disabled)),
                    _ => Err("disabled expects a boolean".into()),
                }).with_documentation("Disables pointer and keyboard activation while preserving the controlled value."),
                MethodDescriptor::new("on_change", vec![ArgumentDescriptor::new("callback", ArgumentSchema::Callback(callback_schema))], |arguments| match arguments {
                    [argument @ ComponentArgument::Callback(_)] => Ok(ComponentPayload::new(Operation::Change(argument.clone()))),
                    _ => Err("on_change expects a callback".into()),
                }).with_documentation("Reports the value requested by native pointer or keyboard activation."),
            ]))?;
    }
    Ok(())
}
