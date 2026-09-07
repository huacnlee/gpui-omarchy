use gpui::{AppContext, Context, IntoElement, ParentElement, Render, Window, WindowOptions};
use gpui_omarchy::{ButtonVariant, button, focus_scope, panel};

struct Hello;

impl Render for Hello {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        focus_scope("hello").child(
            panel("Welcome to Omarchy", cx).child(
                button("hello", "Say hello", ButtonVariant::Primary, cx)
                    .on_click(|_, _, _| println!("Hello, Omarchy!")),
            ),
        )
    }
}

fn main() {
    gpui_platform::application().run(|cx| {
        gpui_omarchy::init(cx);
        cx.open_window(WindowOptions::default(), |_, cx| cx.new(|_| Hello))
            .expect("open window");
        cx.activate(true);
    });
}
