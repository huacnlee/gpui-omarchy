//! Shared adapters for stateless native constructors.
use std::sync::Arc;

use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentDescriptor,
    ComponentMaterializer, ComponentPayload, ComponentRegistry, ConstructorDescriptor,
    MaterializeRequest, RegistryError, anyhow,
    gpui::{AnyElement, App, IntoElement, ParentElement, Refineable, Styled},
};

type Arguments = Vec<ComponentArgument>;

struct LeafMaterializer<E> {
    build: fn(&[ComponentArgument], &mut App) -> anyhow::Result<E>,
}

impl<E: Styled + IntoElement + 'static> ComponentMaterializer for LeafMaterializer<E> {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<AnyElement> {
        let arguments = request
            .payload()
            .downcast_ref::<Arguments>()
            .ok_or_else(|| anyhow::anyhow!("native leaf received incompatible arguments"))?
            .clone();
        if !request.take_children()?.is_empty() {
            anyhow::bail!("this native component does not accept ordinary children");
        }
        let mut element = request.with_window_app(|_, cx| (self.build)(&arguments, cx))?;
        element.style().refine(&request.take_style());
        Ok(element.into_any_element())
    }
}

pub(super) fn register_leaf<E: Styled + IntoElement + 'static>(
    registry: &mut ComponentRegistry,
    name: &'static str,
    documentation: &'static str,
    arguments: Vec<ArgumentDescriptor>,
    build: fn(&[ComponentArgument], &mut App) -> anyhow::Result<E>,
) -> Result<(), RegistryError> {
    registry.register(
        ComponentDescriptor::new(name, Arc::new(LeafMaterializer { build }))
            .with_documentation(documentation)
            .with_constructors(vec![constructor(name, arguments)]),
    )?;
    Ok(())
}

struct Materializer<E> {
    build: fn(&[ComponentArgument], &mut App) -> anyhow::Result<E>,
}

impl<E: Styled + ParentElement + IntoElement + 'static> ComponentMaterializer for Materializer<E> {
    fn materialize(&self, mut request: MaterializeRequest<'_>) -> anyhow::Result<AnyElement> {
        let arguments = request
            .payload()
            .downcast_ref::<Arguments>()
            .ok_or_else(|| anyhow::anyhow!("native surface received incompatible arguments"))?
            .clone();
        let element = request.with_window_app(|_, cx| (self.build)(&arguments, cx))?;
        request.finish(element)
    }
}

pub(super) fn register_container<E: Styled + ParentElement + IntoElement + 'static>(
    registry: &mut ComponentRegistry,
    name: &'static str,
    documentation: &'static str,
    arguments: Vec<ArgumentDescriptor>,
    build: fn(&[ComponentArgument], &mut App) -> anyhow::Result<E>,
) -> Result<(), RegistryError> {
    registry.register(
        ComponentDescriptor::new(name, Arc::new(Materializer { build }))
            .with_documentation(documentation)
            .with_constructors(vec![constructor(name, arguments)]),
    )?;
    Ok(())
}

fn constructor(name: &'static str, arguments: Vec<ArgumentDescriptor>) -> ConstructorDescriptor {
    let fields: Vec<_> = arguments.iter().map(|argument| argument.name()).collect();
    ConstructorDescriptor::new(name, arguments, move |arguments| {
        for (field, argument) in fields.iter().zip(arguments) {
            if matches!(*field, "asset" | "image") {
                validate_asset(argument)?;
            }
            match (*field, argument) {
                ("id", ComponentArgument::String(id)) if id.trim().is_empty() => {
                    return Err(format!("{name} requires a nonempty stable id"));
                }
                ("index", ComponentArgument::Number(index))
                    if !index.is_finite()
                        || index.fract() != 0.
                        || *index < 1.
                        || *index > 9_007_199_254_740_991. =>
                {
                    return Err(format!(
                        "{name} index must be a positive safe integer (one-based)"
                    ));
                }
                _ => {}
            }
        }
        Ok(ComponentPayload::new(arguments.to_vec()))
    })
}

fn validate_asset(argument: &ComponentArgument) -> Result<(), String> {
    use std::path::{Component, Path};
    match argument {
        ComponentArgument::Optional(None) => Ok(()),
        ComponentArgument::Optional(Some(value)) => validate_asset(value),
        ComponentArgument::String(path)
            if !path.trim().is_empty()
                && !path.contains([':', '\\'])
                && !Path::new(path).components().any(|component| {
                    matches!(
                        component,
                        Component::ParentDir | Component::RootDir | Component::Prefix(_)
                    )
                }) =>
        {
            Ok(())
        }
        _ => Err(
            "image must use a relative application asset path; URLs and traversal are not accepted"
                .into(),
        ),
    }
}

pub(super) fn string(arguments: &[ComponentArgument], index: usize) -> anyhow::Result<String> {
    match arguments.get(index) {
        Some(ComponentArgument::String(value) | ComponentArgument::Enum(value)) => {
            Ok(value.clone())
        }
        _ => anyhow::bail!("expected a string at argument {index}"),
    }
}

pub(super) fn number(arguments: &[ComponentArgument], index: usize) -> anyhow::Result<f64> {
    match arguments.get(index) {
        Some(ComponentArgument::Number(value)) => Ok(*value),
        _ => anyhow::bail!("expected a number at argument {index}"),
    }
}

pub(super) fn text(name: &'static str) -> ArgumentDescriptor {
    ArgumentDescriptor::new(name, ArgumentSchema::String)
}

pub(super) fn numeric(name: &'static str) -> ArgumentDescriptor {
    ArgumentDescriptor::new(name, ArgumentSchema::Number)
}
