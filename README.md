# gpui-omarchy

基于 **gpui-base 0.6.0** 的 Omarchy 风格 GPUI 组件库。使用系统字体、紧凑布局、默认直角与细边框，复用 base 的焦点、键盘、无障碍和文本编辑行为。

项目正在实现中，目前提供 48 类组件，在一个 Gallery 中演示。完整表单、导航、浮层和数据组件仍在扩展；当前状态不代表框架已全部完成。

## Gallery

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 1" src="https://github.com/user-attachments/assets/5ba0ed24-21e6-4397-83f9-e0cf10d8e329" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 2" src="https://github.com/user-attachments/assets/75f9fece-a4fa-4531-81fa-b686808c6b12" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 3" src="https://github.com/user-attachments/assets/bbb68b32-a259-405a-a1c2-09b8795e2870" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 4" src="https://github.com/user-attachments/assets/ba9ee7ff-7852-4c2d-9541-1ddd0e61c388" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 5" src="https://github.com/user-attachments/assets/225a1a69-054c-4fcb-ba3d-ee554286be5a" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 6" src="https://github.com/user-attachments/assets/ccf7e25e-130e-4b52-a0a2-7b69e945f56d" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 7" src="https://github.com/user-attachments/assets/7876c0d5-6bb8-401f-a608-f0d0a95178a8" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 8" src="https://github.com/user-attachments/assets/2bf47cc4-cd8f-48eb-bb8f-d63a0d567001" />

<img width="1172" height="872" alt="GPUI Omarchy Gallery 截图 9" src="https://github.com/user-attachments/assets/59eb5be5-d7cb-433a-a73d-ecb918e76d32" />

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

`toggle_group(id, cx)` 组合多个独立的 `toggle`，用于多选状态筛选；图标由调用方通过 child 添加。

`button_group(...)` 用于单选设置，`tab_list(...)` 用于切换内容页；都接受 `ChoiceItem`、当前选中索引和回调，返回真实的 base RadioGroup / Tabs。每组只有一个 Tab 停靠点，左右方向键（或 h/l）移动游标，Enter / Space 确认。`tabs` / `tab` 是用于自行组合的底层样式构造函数。

`with_tooltip(control, "说明")` 保留原控件类型并附加 400ms 悬停提示；`tooltip(text, cx)` 返回可继续设置样式的提示表面。图标按钮仍需显式无障碍名称。

`sheet(&focus, cx)` 返回 base Sheet，使用 `.surface(sheet_surface(cx).child(...))` 组合右侧面板。打开时聚焦稳定的 focus，关闭回调中恢复触发器焦点；base 负责焦点限制、Escape 和遮罩关闭。

`popover` 返回 base Popover，提供直角浮层与内部键盘隔离；Escape 关闭并恢复焦点。`collapsible(open, cx)` 返回 base Collapsible，普通 children 始终显示，content 仅在展开时显示。

`toast(id, cx)` 返回可组合的 base Toast 表面；应用控制生命周期，可配合 base ToastManager 使用。Gallery 在右下角展示通知和 Undo／Retry 操作：保存提示在 6 秒后关闭，悬停或焦点停留时暂停计时；错误提示保留至手动处理。

`selectable_text(id, text, cx)` 提供只读文本选择与主题选区背景。在窗口内容之后渲染一次 `gpui_base::TextSelectionLayer`，外层使用 `focus_scope` 接入系统 Copy 快捷键。

`avatar(initials, cx)` 返回方形 base Avatar；使用 `.image(avatar_image(source))` 设置图片插槽。图片加载失败时是否切换缩写由应用决定。

`calendar(id, &state, cx)` 使用 base CalendarState，支持月份／年份切换、单日或范围选择以及 disabled matcher。`separator` 和 `vertical_separator` 分别提供水平、垂直分隔线。

`scrollbar(id, axis, &handle, cx)` 返回主题化 base Scrollbar。与滚动内容共用 handle，并放在同一个 relative 容器的末尾；可配置纵向、横向或双轴。

`virtual_list(view, id, sizes, render, cx)` 返回 base VirtualList，只构建可见范围。sizes 中的高度须与对应行的实际高度一致；通过 `.track_scroll(&handle)` 保留位置或定位条目。Gallery 展示 1,000 条不同高度的活动记录。

`markdown(id, source, cx)` 与 `html(id, source, cx)` 返回 base TextView，支持可选中文本、链接和主题化文档排版。状态驱动的 TextView 可使用 `text_view_style(cx)`；文字选择沿用应用根节点的 TextSelectionLayer。

`tree(&state, cx)` 使用 base TreeState；`resizable(id, axis, cx)` 返回 base 分栏容器，拖动和尺寸限制由 base 处理。`nav_stack(&state, cx)` 保留 base 的 push／pop／forward 状态。

`color_picker(id, &state, window, cx)` 使用 base ColorPickerState，提供 Hex 输入与 HSLA 滑块。Hex 按 Enter 提交，Escape 放弃未提交的预览；滑块立即生效。应用通过观察 state 或订阅 ColorPickerEvent 更新预览。

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

Gallery 发生 panic 时会在系统临时目录写入 `gpui-omarchy-gallery-<PID>.panic.log`，
保留错误位置和完整调用栈；终端同时打印报告路径。此日志只用于示例程序的崩溃排查。

## License

[MIT](LICENSE) © 2026 Jason Lee (huacnlee).
