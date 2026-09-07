# gpui-omarchy

基于 **gpui-base 0.6.0** 的 Omarchy 风格 GPUI 组件库。使用系统字体、紧凑布局、默认直角与细边框，复用 base 的焦点、键盘、无障碍和文本编辑行为。

项目正在实现中，目前提供 41 类组件，在一个 Gallery 中演示。完整表单、导航、浮层和数据组件仍在扩展；当前状态不代表框架已全部完成。

## 运行

需要 Rust 与 GPUI 对应平台的构建依赖；使用 `.SystemUIFont` 系统字体，无需额外安装字体。图标使用 `gpui-kit-assets` 的内嵌 SVG，并在渲染时解析继承颜色，无需替换应用的 AssetSource。

```sh
cargo run --example gallery
```

只有一个 `gallery` example。通过左侧 Sidebar 按 Actions、Forms、Navigation、Display 分类切换组件，右侧查看和操作当前组件。Sidebar 支持 ↑/↓、j/k、Home/End；Tab 进入控件。顶部 Menu 可重新读取系统主题、预览深浅配色或关闭 Gallery。

## 主题

`gpui_omarchy::init(cx)` 初始化 base，并优先读取：

```text
$HOME/.local/state/omarchy/current/theme/colors.toml
$HOME/.local/state/omarchy/current/theme.name
```

新版目录不存在时兼容旧版 `$HOME/.config/omarchy/current`。新版目录已存在但主题损坏时直接回退 Tokyo Night，不加载升级遗留的旧主题。

兼容 ANSI `color0..15` 与语义颜色两种 Omarchy 格式。文件不存在、权限不足、格式错误或缺少必要颜色时，整体回退到 Tokyo Night。非 Omarchy 系统无需配置。

主题文件的目录与名称文件对应 [Omarchy 官方 theme-set 脚本](https://github.com/basecamp/omarchy/blob/master/bin/omarchy-theme-set)。颜色格式参考 [ANSI 主题](https://github.com/basecamp/omarchy/blob/master/themes/tokyo-night/colors.toml) 和 [语义主题](https://github.com/basecamp/omarchy/blob/quattro/themes/tokyo-night/colors.toml)。

当前在启动时读取；应用可再次调用 `Theme::system_or_default().apply(cx)` 重新加载。尚未实现文件变更自动监听，也尚未读取 `shell.toml` 的尺寸和状态覆盖。示例中的浅色预览仅用于检查配色，默认仍跟随系统主题。

## 使用

在应用启动时调用一次 `gpui_omarchy::init(cx)`。在 `Render` 中创建组件：

```rust,ignore
use gpui::ParentElement;
use gpui_omarchy::{button, panel, ButtonVariant};

panel("Workspace", cx).child(
    button("save", "Save", ButtonVariant::Primary, cx)
        .on_click(cx.listener(|this, _, _, cx| {
            this.save();
            cx.notify();
        })),
)
```

构造函数返回可组合的 gpui-base 元素，支持原生 builder API。复选框、开关、单选和 toggle 的状态由应用持有；每次渲染传入当前状态，再在 `on_change` 中更新。不要在构造之后覆盖这些状态，否则标记与传入值可能不一致。组件 ID 在同一父节点内必须唯一。

Select 和 Combobox 使用应用持有的 `Entity<ChoiceState>`，选项为 `ChoiceItem`；通过 `cx.observe` 响应选择变化，再从 `state.selected()` 读取选项的稳定 `value`。两个构造函数分别返回可继续设置样式的 `gpui_base::Select` 和 `gpui_base::Combobox`。Combobox 在弹层内搜索已有选项，不创建自由文本值。

窗口或表单外层使用 `focus_scope("root")` 连接 Tab / Shift+Tab 焦点遍历。编辑器仍可优先处理缩进，弹层保留自己的键盘处理。

`button_group(...)` 用于单选设置，`tab_list(...)` 用于切换内容页；都接受 `ChoiceItem`、当前选中索引和回调，返回真实的 base RadioGroup / Tabs。每组只有一个 Tab 停靠点，左右方向键（或 h/l）移动游标，Enter / Space 确认。`tabs` / `tab` 是用于自行组合的底层样式构造函数。

`with_tooltip(control, "说明")` 保留原控件类型并附加 400ms 悬停提示；`tooltip(text, cx)` 返回可继续设置样式的提示表面。图标按钮仍需显式无障碍名称。

`popover` 返回 base Popover，提供直角浮层与内部键盘隔离；Escape 关闭并恢复焦点。`collapsible(open, cx)` 返回 base Collapsible，普通 children 始终显示，content 仅在展开时显示。

`toast(id, cx)` 返回可组合的 base Toast 表面；应用控制生命周期，可配合 base ToastManager 使用。Gallery 在右下角展示可关闭通知和 Undo／Retry 操作，当前示例采用手动关闭。

`avatar(initials, cx)` 返回方形 base Avatar；使用 `.image(avatar_image(source))` 设置图片插槽。图片加载失败时是否切换缩写由应用决定。

`calendar(id, &state, cx)` 使用 base CalendarState，支持月份／年份切换、单日或范围选择以及 disabled matcher。`separator` 和 `vertical_separator` 分别提供水平、垂直分隔线。

`tree(&state, cx)` 使用 base TreeState；`resizable(id, axis, cx)` 返回 base 分栏容器，拖动和尺寸限制由 base 处理。`nav_stack(&state, cx)` 保留 base 的 push／pop／forward 状态。

`date_picker(id, &state, cx)` 使用 DatePickerState，公开的 calendar 可配置范围或不可选日期。选择完成后关闭弹层，Escape 取消并恢复焦点。`otp_input` 使用 base OtpState；`editor` 使用 EditorState，支持行号、缩进与文本编辑。

`hover_card` 提供延时出现的辅助预览；重要内容应同时在普通页面可访问。`dock_area` 安装 Omarchy 的 DockAreaRenderer，示例展示标签面板的拖放、合并和拆分。仅提供标签与分栏布局，不提供浮动布局。

输入状态使用 `gpui_base::input::{InputState, TextareaState}`；具体创建方式见 [Gallery](examples/gallery/app.rs)。

## 验证

```sh
cargo fmt --check
cargo check --all-targets
cargo test --lib --test interaction --example gallery
```

实现边界与后续工作记录在 [设计说明](docs/design.md)。
