# Switcher

## Usage

The Switcher component (`<z-switcher>`) is an **in-flow scoped controller** that coordinates a tablist or navigation list (`.z-tab`, `.z-tab-alt`, `.z-subnav`, `.z-nav`) with one or more `.z-switcher` content containers.

Unlike out-of-flow overlays (`<z-dialog>`, `<z-drawer>`), `<z-switcher>` wraps **live HTML directly** (`noChange` render) so Kit CSS paints the active tab and active panel on frame 0 with **zero CLS**.

Place both the trigger list and `.z-switcher` inside `<z-switcher>`, or link external `.z-switcher` containers via `connect="#selector"`.

```html
<!-- Self-contained (trigger list + .z-switcher inside <z-switcher>) -->
<z-switcher>
  <ul class="z-tab">
    <li class="z-active"><a href="#">Account</a></li>
    <li><a href="#">Security</a></li>
    <li><a href="#">Notifications</a></li>
  </ul>
  <div class="z-switcher mt" style="--mt: 4">
    <div class="z-active">Account settings content.</div>
    <div>Security settings content.</div>
    <div>Notification preferences content.</div>
  </div>
</z-switcher>

<!-- External target via connect -->
<z-switcher connect="#settings-panels">
  <ul class="z-tab-alt">
    <li class="z-active"><button type="button">General</button></li>
    <li><button type="button">Billing</button></li>
  </ul>
</z-switcher>

<div id="settings-panels" class="z-switcher mt" style="--mt: 4">
  <div class="z-active">General panel</div>
  <div>Billing panel</div>
</div>
```

<span class="z-label z-label-primary">Note</span> If `connect` is omitted and no `.z-switcher` exists inside `<z-switcher>`, it automatically connects to an immediately following `.z-switcher` sibling if present. Pass `no-connect` when using `<z-switcher>` solely to manage `.z-active` and keyboard navigation on a tab bar (for example, navigation links).

## Visual styles (Kit CSS)

Tabs and pills are pure Kit CSS classes — `<z-switcher>` works identically across all of them:

| Class                             | Style                                                         |
| --------------------------------- | ------------------------------------------------------------- |
| `.z-tab`                          | Classic underlined tabs with sliding active indicator.        |
| `.z-tab.z-tab-bottom`             | Bottom-aligned tabs with top border indicator.                |
| `.z-tab.z-tab-left` / `-right`    | Vertical left/right tab rail (`aria-orientation="vertical"`). |
| `.z-tab-alt`                      | Segmented pill tabs with sliding elevated pill indicator.     |
| `.z-subnav` / `.z-subnav-primary` | Pill sub-navigation without underline/pill indicator.         |

Both `<a>` and `<button type="button">` triggers are styled and focusable (`:focus-visible`).

```html
<!-- Segmented Pill Tabs (.z-tab-alt) -->
<z-switcher>
  <ul class="z-tab-alt">
    <li class="z-active"><button type="button">Overview</button></li>
    <li><button type="button">Analytics</button></li>
    <li class="z-disabled"><button type="button" disabled>Reports</button></li>
  </ul>
  <div class="z-switcher mt" style="--mt: 4">
    <div class="z-active">Overview panel</div>
    <div>Analytics panel</div>
    <div>Disabled panel</div>
  </div>
</z-switcher>
```

## Responsive side tabs (`media`)

When using `.z-tab-left` or `.z-tab-right`, add `media="md"` (or any shorthand `sm`, `md`, `lg`, `xl`, `2xl`, pixel width like `768`, or CSS media query) to collapse the vertical rail into a horizontal tab bar below that breakpoint. `<z-switcher>` updates `aria-orientation` and recalculates the sliding indicator automatically.

```html
<div class="display-grid md:grid-cols gap" style="--md-grid-cols: 4; --gap: 6">
  <z-switcher connect="#side-panels" media="md">
    <ul class="z-tab z-tab-left">
      <li class="z-active"><a href="#">Profile</a></li>
      <li><a href="#">Team</a></li>
      <li><a href="#">API Keys</a></li>
    </ul>
  </z-switcher>
  <div id="side-panels" class="z-switcher md:col-span" style="--md-col-span: 3">
    <div class="z-active">Profile settings</div>
    <div>Team members</div>
    <div>API keys</div>
  </div>
</div>
```

## Animated indicator & panel transitions

- **Active tab indicator**: Enabled automatically on `.z-tab` and `.z-tab-alt` via GPU-accelerated `transform: translate3d(...)` on `::after` (`--z-tab-indicator-*`), synchronized via `ResizeObserver` so tabs inside initially hidden `<z-dialog>` or `<z-drawer>` panels snap accurately once opened. Add `no-indicator` to fall back to static CSS borders/backgrounds.
- **Panel animations**: Add `animation="fade"`, `animation="scale"`, `animation="slide"` (direction-aware forward/backward), or any `.z-animation-*` class name (optionally comma-separated `forwardClass, backwardClass`). Control timing with `duration` (default `150` ms).

```html
<z-switcher animation="slide" duration="180">
  <ul class="z-tab">
    <li class="z-active"><button type="button">Step 1</button></li>
    <li><button type="button">Step 2</button></li>
    <li><button type="button">Step 3</button></li>
  </ul>
  <div class="z-switcher mt" style="--mt: 4">
    <div class="z-active">Step 1 content</div>
    <div>Step 2 content</div>
    <div>Step 3 content</div>
  </div>
</z-switcher>
```

## Keyboard modes, collapsible & in-panel controls

- **`manual`**: By default, arrow keys move focus and activate the tab immediately. Add `manual` so arrow keys only move focus and <kbd>Enter</kbd> / <kbd>Space</kbd> activates the tab.
- **`collapsible`**: Allows clicking or pressing <kbd>Enter</kbd> / <kbd>Space</kbd> on the active tab to collapse all panels (`active="-1"`).
- **`data-switcher-item`**: Place `data-switcher-item="next"`, `data-switcher-item="previous"`, a 0-based index, or a tab `data-value` on buttons inside panels to navigate between tabs.

## Deferred `<template>` panels

Active panels should always render live HTML so there is zero CLS on initial load. For heavy **inactive** panels (charts, editors, iframes), you may wrap that panel's inner content in `<template data-fn="template">` — `<z-switcher>` unwraps it once on first activation and emits `z-switcher:mount`.

```html
<z-switcher>
  <ul class="z-tab">
    <li class="z-active"><button type="button">Summary</button></li>
    <li><button type="button">Heavy Chart</button></li>
  </ul>
  <div class="z-switcher mt" style="--mt: 4">
    <div class="z-active">Immediate summary content (zero CLS).</div>
    <div>
      <template data-fn="template">
        <p>Mounted lazily on first switch to Heavy Chart.</p>
      </template>
    </div>
  </div>
</z-switcher>
```

## Component attributes

| Attribute      | Value                        | Default | Description                                                                                     |
| -------------- | ---------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `active`       | Number                       | `-1`    | 0-based active index (auto-detects `.z-active` or first enabled tab when omitted).              |
| `connect`      | String (CSS selector)        | `""`    | Connects one or more external `.z-switcher` containers.                                         |
| `no-connect`   | Boolean                      | `false` | Disables panel switching (manages tab active state and keyboard nav only).                      |
| `manual`       | Boolean                      | `false` | Requires <kbd>Enter</kbd> / <kbd>Space</kbd> to activate focused tab during arrow nav.          |
| `collapsible`  | Boolean                      | `false` | Allows toggling the active tab off (`-1`).                                                      |
| `orientation`  | `'horizontal' \| 'vertical'` | `""`    | Overrides inferred `aria-orientation` (`vertical` for `.z-tab-left`, `.z-tab-right`, `.z-nav`). |
| `media`        | String                       | `""`    | Breakpoint (`sm`, `md`, `lg`, `xl`, `2xl`, px, or media query) for `.z-tab-left`/`-right`.      |
| `animation`    | String                       | `""`    | Panel entrance preset (`fade`, `scale`, `slide`) or `.z-animation-*` class name(s).             |
| `duration`     | Number (ms)                  | `150`   | Duration for panel entrance animations.                                                         |
| `no-indicator` | Boolean                      | `false` | Disables the animated `::after` sliding indicator on `.z-tab` / `.z-tab-alt`.                   |

## JavaScript

### Events

| Name                       | Cancelable | Detail / Description                                                                                                      |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `z-switcher:before-change` | Yes        | Fires before switching tabs. Detail: `{ index, previousIndex, item, trigger, value }`. Call `preventDefault()` to cancel. |
| `z-switcher:change`        | No         | Fires after switching tabs. Detail: `{ index, previousIndex, item, trigger, value }`.                                     |
| `z-switcher:mount`         | No         | Fires when a deferred `<template>` inside an inactive panel is unwrapped. Detail: `{ index, panel }`.                     |

### Methods

```javascript
const switcher = document.getElementById('my-switcher');
switcher.show(2); // activate index 2
switcher.show('next'); // activate next enabled tab (wraps around)
switcher.show('previous'); // activate previous enabled tab
switcher.index(); // current active 0-based index (or -1)
switcher.refresh(); // re-scan dynamically added/removed tabs or panels
```

## Accessibility

- Sets `role="tablist"` and `aria-orientation` (`horizontal` or `vertical`) on the trigger list, `role="presentation"` on wrapper `<li>` elements, `role="tab"` + `aria-selected` + `aria-controls` + `aria-disabled` on triggers, and `role="tabpanel"` + `aria-labelledby` on panels.
- Uses roving `tabindex="0"` / `"-1"` so <kbd>Tab</kbd> enters/exits the tablist in one stop.
- <kbd>←</kbd> / <kbd>→</kbd> (RTL-aware) navigate horizontal tablists; <kbd>↑</kbd> / <kbd>↓</kbd> navigate vertical tablists; <kbd>Home</kbd> / <kbd>End</kbd> jump to first/last enabled tab; <kbd>Enter</kbd> / <kbd>Space</kbd> activate (or toggle when `collapsible`).
