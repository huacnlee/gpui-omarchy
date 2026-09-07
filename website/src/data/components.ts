export interface ComponentItem {
  label: string;
  id: string;
  description: string;
  sourcePath: string;
}

export interface ComponentGroup {
  name: string;
  items: ComponentItem[];
}

// Mirrors the component previews in examples/gallery/app.rs.
export const componentGroups: ComponentGroup[] = [
  {
    "name": "Actions",
    "items": [
      {
        "label": "Button",
        "id": "button",
        "description": "Content-sized actions with quiet hover, focus and pressed states.",
        "sourcePath": "src/controls.rs"
      },
      {
        "label": "Button group",
        "id": "button-group",
        "description": "Choose one setting from a row of mutually exclusive options.",
        "sourcePath": "src/button_group.rs"
      },
      {
        "label": "Link",
        "id": "link",
        "description": "Open a named destination.",
        "sourcePath": "src/controls.rs"
      },
      {
        "label": "Toggle",
        "id": "toggle",
        "description": "Keep a command active until it is pressed again.",
        "sourcePath": "src/controls.rs"
      },
      {
        "label": "Toggle group",
        "id": "toggle-group",
        "description": "Combine independent filters to show more than one status.",
        "sourcePath": "src/controls.rs"
      }
    ]
  },
  {
    "name": "Forms",
    "items": [
      {
        "label": "Input",
        "id": "input",
        "description": "Single-line editing with selection, clipboard and IME support.",
        "sourcePath": "src/input.rs"
      },
      {
        "label": "Textarea",
        "id": "textarea",
        "description": "Multi-line notes with native text editing.",
        "sourcePath": "src/input.rs"
      },
      {
        "label": "Number input",
        "id": "number-input",
        "description": "A compact numeric field with keyboard and button stepping.",
        "sourcePath": "src/input.rs"
      },
      {
        "label": "Select",
        "id": "select",
        "description": "Choose one value from a fixed set of options.",
        "sourcePath": "src/select.rs"
      },
      {
        "label": "Combobox",
        "id": "combobox",
        "description": "Search a collection, then choose a matching option.",
        "sourcePath": "src/select.rs"
      },
      {
        "label": "Calendar",
        "id": "calendar",
        "description": "Choose a date with month and year navigation.",
        "sourcePath": "src/calendar.rs"
      },
      {
        "label": "Date picker",
        "id": "date-picker",
        "description": "Choose a date from a calendar anchored to a field.",
        "sourcePath": "src/date_picker.rs"
      },
      {
        "label": "Color picker",
        "id": "color-picker",
        "description": "Choose a label color with Hex and HSLA controls.",
        "sourcePath": "src/color_picker.rs"
      },
      {
        "label": "OTP input",
        "id": "otp-input",
        "description": "Enter a six-digit verification code.",
        "sourcePath": "src/otp_input.rs"
      },
      {
        "label": "Slider",
        "id": "slider",
        "description": "Adjust one value or a range with the pointer or keyboard.",
        "sourcePath": "src/slider.rs"
      },
      {
        "label": "Checkbox",
        "id": "checkbox",
        "description": "Independent choices, including a mixed selection.",
        "sourcePath": "src/controls.rs"
      },
      {
        "label": "Switch",
        "id": "switch",
        "description": "An immediate on/off choice with a visible track and thumb.",
        "sourcePath": "src/controls.rs"
      },
      {
        "label": "Radio",
        "id": "radio",
        "description": "Choose one option from a group.",
        "sourcePath": "src/controls.rs"
      }
    ]
  },
  {
    "name": "Navigation",
    "items": [
      {
        "label": "Menu",
        "id": "menu",
        "description": "An anchored action menu with one pointer and keyboard cursor.",
        "sourcePath": "src/menu.rs"
      },
      {
        "label": "Tabs",
        "id": "tabs",
        "description": "Switch between related views while keeping context.",
        "sourcePath": "src/controls.rs"
      },
      {
        "label": "Accordion",
        "id": "accordion",
        "description": "Reveal supporting content when it is needed.",
        "sourcePath": "src/navigation.rs"
      },
      {
        "label": "Collapsible",
        "id": "collapsible",
        "description": "Expand a single region for additional settings.",
        "sourcePath": "src/navigation.rs"
      },
      {
        "label": "NavStack",
        "id": "nav-stack",
        "description": "Navigate between persistent pages and return to where you left off.",
        "sourcePath": "src/navigation.rs"
      },
      {
        "label": "Pagination",
        "id": "pagination",
        "description": "Move through a paged collection.",
        "sourcePath": "src/navigation.rs"
      }
    ]
  },
  {
    "name": "Overlays",
    "items": [
      {
        "label": "Sheet",
        "id": "sheet",
        "description": "Inspect project details in an edge-attached panel.",
        "sourcePath": "src/sheet.rs"
      },
      {
        "label": "Dialog",
        "id": "dialog",
        "description": "A focused task with confirmation, cancellation and focus return.",
        "sourcePath": "src/dialog.rs"
      },
      {
        "label": "Alert dialog",
        "id": "alert-dialog",
        "description": "An explicit decision that cannot be dismissed by clicking the backdrop.",
        "sourcePath": "src/dialog.rs"
      },
      {
        "label": "Popover",
        "id": "popover",
        "description": "Adjust contextual settings while keeping the workspace in view.",
        "sourcePath": "src/popover.rs"
      },
      {
        "label": "Tooltip",
        "id": "tooltip",
        "description": "A short explanation for an action, shown on hover.",
        "sourcePath": "src/tooltip.rs"
      },
      {
        "label": "Hover card",
        "id": "hover-card",
        "description": "Preview supporting details without leaving the page.",
        "sourcePath": "src/hover_card.rs"
      },
      {
        "label": "Toast",
        "id": "toast",
        "description": "Brief feedback that leaves your current task in place.",
        "sourcePath": "src/surface.rs"
      }
    ]
  },
  {
    "name": "Display",
    "items": [
      {
        "label": "Icon",
        "id": "icon",
        "description": "Monochrome SVG icons that inherit the surrounding text color.",
        "sourcePath": "src/icon.rs"
      },
      {
        "label": "Avatar",
        "id": "avatar",
        "description": "Identify people and workspaces with a square image or initials.",
        "sourcePath": "src/surface.rs"
      },
      {
        "label": "TextView",
        "id": "text-view",
        "description": "Read structured documents with selectable text and links.",
        "sourcePath": "src/text.rs"
      },
      {
        "label": "Panel",
        "id": "panel",
        "description": "A surface for a related group of settings or information.",
        "sourcePath": "src/surface.rs"
      },
      {
        "label": "Virtual list",
        "id": "virtual-list",
        "description": "Browse a large activity log with variable-height rows.",
        "sourcePath": "src/list.rs"
      },
      {
        "label": "Scrollbar",
        "id": "scrollbar",
        "description": "Drag the scroll thumb to move through a long activity log.",
        "sourcePath": "src/list.rs"
      },
      {
        "label": "Table",
        "id": "table",
        "description": "Aligned columns for comparing records.",
        "sourcePath": "src/table.rs"
      },
      {
        "label": "Tree",
        "id": "tree",
        "description": "Explore nested folders and select a workspace document.",
        "sourcePath": "src/tree.rs"
      },
      {
        "label": "Resizable",
        "id": "resizable",
        "description": "Drag the divider to adjust space between panes.",
        "sourcePath": "src/resizable.rs"
      },
      {
        "label": "Dock",
        "id": "dock",
        "description": "Rearrange document panels by dragging their tabs.",
        "sourcePath": "src/dock.rs"
      },
      {
        "label": "Separator",
        "id": "separator",
        "description": "A quiet boundary between distinct sections.",
        "sourcePath": "src/surface.rs"
      },
      {
        "label": "Keycap",
        "id": "keycap",
        "description": "Compact, readable keyboard hints.",
        "sourcePath": "src/surface.rs"
      },
      {
        "label": "Badge",
        "id": "badge",
        "description": "Short labels for neutral and semantic status.",
        "sourcePath": "src/surface.rs"
      },
      {
        "label": "Empty state",
        "id": "empty-state",
        "description": "Explain an empty collection and its next step.",
        "sourcePath": "src/surface.rs"
      },
      {
        "label": "Progress",
        "id": "progress",
        "description": "Show how much of a known task is complete.",
        "sourcePath": "src/surface.rs"
      }
    ]
  }
];

export const componentCount = componentGroups.reduce((count, group) => count + group.items.length, 0);
