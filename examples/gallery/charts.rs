//! Chart previews: one realistic data set per chart, drawn in the theme's series colors.
use gpui_kit::{App, Div, Hsla, IntoElement, SharedString, div, prelude::*, rems};
use gpui_omarchy::chart::{SankeyLabel, SankeyLink};
use gpui_omarchy::*;

/// Render the preview for a chart page into the gallery's content column.
pub(super) fn render(page: &str, content: Div, cx: &App) -> Div {
    match page {
        "line_chart" => line_chart(content, cx),
        "bar_chart" => bar_chart(content, cx),
        "area_chart" => area_chart(content, cx),
        "pie_chart" => pie_chart(content, cx),
        "radar_chart" => radar_chart(content, cx),
        "candlestick_chart" => candlestick_chart(content, cx),
        "sankey_chart" => sankey_chart(content, cx),
        _ => content,
    }
}

/// A fixed-height, full-width region; charts fill their container.
fn region(chart: impl IntoElement) -> Div {
    div().w_full().h(rems(15.)).child(chart)
}

fn caption(text: impl Into<SharedString>, cx: &App) -> Div {
    div().text_color(cx.omarchy().secondary).child(text.into())
}

/// Series names beside square swatches in their chart colors.
fn legend(series: &[(&'static str, Hsla)], cx: &App) -> Div {
    let t = cx.omarchy();
    div()
        .flex()
        .flex_wrap()
        .items_center()
        .gap(rems(0.875))
        .children(series.iter().map(|(name, color)| {
            div()
                .flex()
                .items_center()
                .gap(rems(0.375))
                .child(div().flex_shrink_0().size(rems(0.5)).bg(*color))
                .child(div().text_color(t.secondary).child(*name))
        }))
}

fn line_chart(content: Div, cx: &App) -> Div {
    let memory = [
        ("08:00", 5.2),
        ("09:00", 6.8),
        ("10:00", 8.1),
        ("11:00", 9.4),
        ("12:00", 8.7),
        ("13:00", 7.9),
        ("14:00", 10.2),
        ("15:00", 11.6),
        ("16:00", 11.1),
        ("17:00", 9.8),
        ("18:00", 7.4),
        ("19:00", 6.1),
    ];
    content
        .child(caption("Memory in use today, in GB", cx))
        .child(region(
            LineChart::new(memory)
                .id("memory-line")
                .name("Memory (GB)")
                .x(|(hour, _)| *hour)
                .y(|(_, used)| *used)
                .tick_margin(2)
                .dot(),
        ))
}

fn bar_chart(content: Div, cx: &App) -> Div {
    let updates = [
        ("Mon", 42.),
        ("Tue", 18.),
        ("Wed", 27.),
        ("Thu", 9.),
        ("Fri", 64.),
        ("Sat", 12.),
        ("Sun", 5.),
    ];
    content
        .child(caption("Packages updated each day this week", cx))
        .child(region(
            BarChart::new(updates)
                .id("updates-bar")
                .name("Packages")
                .band(|(day, _)| *day)
                .value(|(_, count)| *count)
                .label(|(_, count)| format!("{count}")),
        ))
}

fn area_chart(content: Div, cx: &App) -> Div {
    let t = cx.omarchy();
    let traffic = [
        ("10:00", 12.4, 1.8),
        ("10:05", 18.9, 2.6),
        ("10:10", 42.1, 3.9),
        ("10:15", 38.6, 5.2),
        ("10:20", 21.3, 4.1),
        ("10:25", 9.7, 1.2),
        ("10:30", 15.2, 7.8),
        ("10:35", 27.8, 9.4),
        ("10:40", 33.5, 6.3),
        ("10:45", 19.1, 2.2),
    ];
    content
        .child(caption("Network throughput on wlan0, in MB/s", cx))
        .child(legend(
            &[("Download", t.chart[0]), ("Upload", t.chart[1])],
            cx,
        ))
        .child(region(
            AreaChart::new(traffic)
                .id("network-area")
                .x(|(time, _, _)| *time)
                .y(|(_, down, _)| *down)
                .name("Download")
                .y(|(_, _, up)| *up)
                .name("Upload")
                .tick_margin(2),
        ))
}

fn pie_chart(content: Div, cx: &App) -> Div {
    let usage = [
        ("~/Videos", 182.),
        ("~/Code", 96.),
        ("~/Pictures", 64.),
        ("~/.cache", 38.),
        ("Other", 22.),
    ];
    content
        .child(caption("Disk usage by directory, 402 GB of 512 GB", cx))
        .child(region(
            PieChart::new(usage)
                .id("disk-pie")
                .name("Used (GB)")
                .value(|(_, gb)| *gb as f32)
                .inner_radius(56.)
                .outer_radius(88.)
                .pad_angle(0.02)
                .label(|(directory, gb)| format!("{directory} {gb:.0} GB").into()),
        ))
}

fn radar_chart(content: Div, cx: &App) -> Div {
    let t = cx.omarchy();
    let hours = [
        ("Terminal", 9., 6.),
        ("Editor", 12., 8.),
        ("Browser", 7., 10.),
        ("Chat", 3., 5.),
        ("Media", 2., 4.),
        ("Docs", 5., 3.),
    ];
    content
        .child(caption("Hours per workspace", cx))
        .child(legend(
            &[("This week", t.chart[0]), ("Last week", t.chart[1])],
            cx,
        ))
        .child(region(
            RadarChart::new(hours)
                .id("workspace-radar")
                .label(|(workspace, _, _)| *workspace)
                .value(|(_, this_week, _)| *this_week)
                .name("This week")
                .value(|(_, _, last_week)| *last_week)
                .name("Last week")
                .dot(),
        ))
}

fn candlestick_chart(content: Div, cx: &App) -> Div {
    // (session, open, high, low, close)
    let sessions = [
        ("Sep 1", 182.4, 186.1, 180.9, 185.2),
        ("Sep 2", 185.2, 187.8, 183.6, 184.0),
        ("Sep 3", 184.0, 184.9, 179.2, 180.1),
        ("Sep 4", 180.1, 183.5, 178.8, 183.0),
        ("Sep 5", 183.0, 189.4, 182.7, 188.6),
        ("Sep 8", 188.6, 191.2, 186.9, 190.4),
        ("Sep 9", 190.4, 190.9, 185.3, 186.2),
        ("Sep 10", 186.2, 188.0, 183.1, 187.5),
        ("Sep 11", 187.5, 193.6, 187.1, 192.8),
        ("Sep 12", 192.8, 194.0, 189.5, 190.1),
        ("Sep 15", 190.1, 191.7, 186.4, 187.0),
        ("Sep 16", 187.0, 190.3, 185.8, 189.9),
    ];
    content
        .child(caption("Daily share price in USD", cx))
        .child(region(
            CandlestickChart::new(sessions)
                .id("price-candlestick")
                .x(|(session, ..)| *session)
                .open(|(_, open, ..)| *open)
                .high(|(_, _, high, ..)| *high)
                .low(|(_, _, _, low, _)| *low)
                .close(|(.., close)| *close)
                .tick_margin(2),
        ))
}

fn sankey_chart(content: Div, cx: &App) -> Div {
    let nodes = [
        "Salary",
        "Freelance",
        "Budget",
        "Rent",
        "Groceries",
        "Transport",
        "Savings",
    ];
    let links = [
        SankeyLink::new(0, 2, 4200.),
        SankeyLink::new(1, 2, 900.),
        SankeyLink::new(2, 3, 1800.),
        SankeyLink::new(2, 4, 650.),
        SankeyLink::new(2, 5, 250.),
        SankeyLink::new(2, 6, 2400.),
    ];
    content
        .child(caption("Monthly budget in USD", cx))
        .child(region(
            SankeyChart::new(nodes, links)
                .id("budget-sankey")
                .labels(|name, value| {
                    vec![
                        SankeyLabel::new(*name),
                        SankeyLabel::new(format!("{value:.0}")),
                    ]
                }),
        ))
}
