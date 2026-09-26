//! Plotting for Omarchy charts.
//!
//! The unstyled primitives — scales, shapes, axes, grids, labels, [`Plot`],
//! [`PlotElement`] and hover tracking — come from `gpui_kit::base::plot` and are
//! re-exported here. This module adds the Omarchy-styled [`tooltip`] overlay.
//!
//! A custom plot implements [`Plot`] and becomes an element with
//! [`impl_into_plot!`](crate::impl_into_plot).
pub use gpui_kit::base::plot::*;

pub mod tooltip;

/// Make a [`Plot`] usable as a child element.
///
/// ```ignore
/// impl_into_plot!(impl<T> MyPlot<T> where T: 'static);
/// impl_into_plot!(impl<> Sparkline);
/// ```
#[macro_export]
macro_rules! impl_into_plot {
    (impl<$($generic:ident),*> $ty:ty $(where $($bound:tt)*)?) => {
        impl<$($generic),*> $crate::gpui_kit::IntoElement for $ty $(where $($bound)*)? {
            type Element = $crate::gpui_kit::base::plot::PlotElement<Self>;

            fn into_element(self) -> Self::Element {
                $crate::gpui_kit::base::plot::PlotElement::new(self)
            }
        }
    };
}
