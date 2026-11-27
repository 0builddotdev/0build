# Drawer

## Usage

The Drawer component (`<z-drawer>`) is a slide-out sheet/offcanvas panel supporting `bottom` (default), `top`, `left`, and `right` placements with a centered drag handle bar and swipe-to-dismiss physics. Its markup lives inside a `<template data-fn="template">` element so zero drawer DOM is rendered on initial page load.

You can use any element to toggle a drawer by adding `data-toggle="#ID"` or `data-open="#ID"` targeting the `<z-drawer>` element's `id`. Inside the template, add `data-close`, `.z-modal-close`, or `.z-drawer-close` to an `<a>` or `<button>` element to close the drawer.

Use the following Kit section classes inside `<template data-fn="template">`:

| Class                                | Description                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `.z-modal-header`                    | Creates the fixed drawer header section.                                                         |
| `.z-modal-body`                      | Creates padded drawer content; pair with `.z-overflow-auto` for independently scrollable bodies. |
| `.z-modal-footer`                    | Creates the fixed drawer footer section.                                                         |
| `.z-modal-title` / `.z-drawer-title` | Marks the drawer heading and automatically wires `aria-labelledby`.                              |
| `.z-drawer-close` / `.z-modal-close` | Closes the drawer when clicked (also works with `data-close`).                                   |

<span class="z-label z-label-primary">Note</span> `<z-drawer>` automatically creates the `.z-modal.z-drawer-overlay` backdrop, `.z-drawer` panel, centered `.z-drawer-handle` + `.z-drawer-handle-bar`, and `.z-drawer-content` wrapper when first opened, and appends itself to `document.body` (unless `inline` is set). If your `<template data-fn="template">` contains a single `.z-drawer` or `.z-offcanvas-bar` wrapper, `<z-drawer>` adopts its extra classes, inline styles, and `role` onto the panel automatically.

```html
<!-- Trigger -->
<button data-toggle="#my-drawer" type="button">Open Drawer</button>

<!-- Bottom sheet drawer (default placement) -->
<z-drawer id="my-drawer">
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Edit Profile</h2>
    </div>
    <div class="z-modal-body">
      <p>Drag the centered handle bar down or swipe to dismiss.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default" data-close type="button">Close</button>
    </div>
  </template>
</z-drawer>
```

## Placement

Set the `placement` attribute to position the drawer on any viewport edge. Defaults to `bottom`.

| Placement | Behavior                                                                       |
| --------- | ------------------------------------------------------------------------------ |
| `bottom`  | Default. Bottom sheet with rounded top corners and horizontal top handle bar.  |
| `top`     | Top sheet with rounded bottom corners and horizontal bottom handle bar.        |
| `left`    | Left offcanvas drawer with full viewport height and vertical right handle bar. |
| `right`   | Right offcanvas drawer with full viewport height and vertical left handle bar. |

```html
<div class="display-flex flex-wrap gap" style="--gap: 2">
  <button class="z-button z-button-default" data-toggle="#drawer-bottom" type="button">
    Bottom
  </button>
  <button class="z-button z-button-default" data-toggle="#drawer-top" type="button">Top</button>
  <button class="z-button z-button-default" data-toggle="#drawer-left" type="button">Left</button>
  <button class="z-button z-button-default" data-toggle="#drawer-right" type="button">Right</button>
</div>

<z-drawer id="drawer-bottom" placement="bottom">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Bottom Sheet</h2>
      <p class="mt" style="--mt: 3">Drag the handle bar downward to dismiss.</p>
    </div>
  </template>
</z-drawer>

<z-drawer id="drawer-top" placement="top">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Top Sheet</h2>
      <p class="mt" style="--mt: 3">Drag the handle bar upward to dismiss.</p>
    </div>
  </template>
</z-drawer>

<z-drawer id="drawer-left" placement="left">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Left Drawer</h2>
      <p class="mt" style="--mt: 3">Drag the handle bar to the left to dismiss.</p>
    </div>
  </template>
</z-drawer>

<z-drawer id="drawer-right" placement="right">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Right Drawer</h2>
      <p class="mt" style="--mt: 3">Drag the handle bar to the right to dismiss.</p>
    </div>
  </template>
</z-drawer>
```

## Drag handle & swipe-to-dismiss

By default, `<z-drawer>` renders a centered drag handle bar (`.z-drawer-handle` / `.z-drawer-handle-bar`) aligned along the inner edge of the panel:

- **Mouse & pointer drag**: Grabbing the handle bar tracks the pointer 1:1 along the dismiss axis (`transform: translate3d(...)`) while fading the backdrop opacity proportionally. Releasing past `35%` (up to `160px`) or flicking fast (`>= 0.45 px/ms`) dismisses the drawer; otherwise it snaps smoothly back into place.
- **Touch / pen swipe**: Swiping anywhere on non-interactive drawer content also drags to dismiss, while automatically yielding to scrollable content (for example, swiping down inside `.z-overflow-auto` scrolls back to `scrollTop === 0` first before pulling the sheet down).
- **Custom handle**: Add `data-drawer-handle` to any custom header or grip element inside your template to make it draggable with mouse and touch.
- **Modifiers**: Add `no-handle` to hide the built-in centered handle bar, or `no-swipe` to disable pointer/touch dragging entirely.

```html
<!-- Built-in handle hidden, swipe still enabled on touch or custom [data-drawer-handle] -->
<z-drawer id="drawer-custom-handle" no-handle>
  <template data-fn="template">
    <div class="z-modal-header" data-drawer-handle style="cursor: grab">
      <h2 class="z-modal-title">Drag Header</h2>
    </div>
    <div class="z-modal-body">
      <p>This header acts as a custom drag handle via <code>data-drawer-handle</code>.</p>
    </div>
  </template>
</z-drawer>

<!-- Static drawer with no handle and no swipe -->
<z-drawer id="drawer-static" placement="right" no-handle no-swipe>
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Static Drawer</h2>
      <button class="z-button z-button-default mt" style="--mt: 4" data-close type="button">
        Close
      </button>
    </div>
  </template>
</z-drawer>
```

## Close button

To create a close button inside the drawer, add `data-close` (or `.z-drawer-close` / `.z-modal-close`) to a `<button>` or `<a>` element. Pair it with `<z-icon icon="x"></z-icon>` and `.z-focus-visible` for keyboard focus outlines.

```html
<z-drawer id="drawer-close" placement="right">
  <template data-fn="template">
    <div class="z-modal-header">
      <button
        class="z-drawer-close absolute right top z-focus-visible"
        style="--right: 4; --top: 4"
        type="button"
        data-close
        aria-label="Close"
      >
        <z-icon icon="x"></z-icon>
      </button>
      <h2 class="z-modal-title">Settings</h2>
    </div>
    <div class="z-modal-body">
      <p>Drawer content with an explicit close button.</p>
    </div>
  </template>
</z-drawer>
```

## Scrollable body, container & full modifiers

- **Scrollable body**: Combine fixed `.z-modal-header` and `.z-modal-footer` sections with `.z-modal-body.z-overflow-auto`. Inside `bottom` and `top` drawers, `.z-drawer-content` keeps the header and footer pinned while the body scrolls independently.
- **Container (`container`)**: Constrains `bottom`/`top` sheets to `max-width: 75rem` (`1200px`) centered horizontally, and widens `left`/`right` drawers to `--z-drawer-width: 40rem`.
- **Full (`full`)**: Expands the drawer to cover the entire viewport (`100%` × `100dvh`) with zero border radius.

```html
<z-drawer id="drawer-container" placement="bottom" container>
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Container Bottom Sheet</h2>
    </div>
    <div class="z-modal-body z-overflow-auto" style="max-height: 50vh">
      <p>Constrained to 1200px max width with a scrollable body.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default" data-close type="button">Close</button>
    </div>
  </template>
</z-drawer>
```

## Backdrop blur

Backdrop blur is opt-in so default transitions stay lightweight. Add the `blur` attribute directly on `<z-drawer>` (or append `.z-modal-blur` to `cls="overlay: ..."`).

```html
<z-drawer id="drawer-blur" blur>
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Blurred Backdrop</h2>
      <p class="mt" style="--mt: 3">Uses <code>--z-modal-overlay-blur</code>.</p>
    </div>
  </template>
</z-drawer>
```

## Groups, stacking & dropdown handoff

`<z-drawer>` shares the active overlay stack with `<z-dialog>` and `<z-cmd>`:

- Opening another drawer or dialog with `data-open="#ID"` closes the current overlay first by default.
- Add `stack` to layer a drawer or dialog above the currently open one.
- Opening `<z-drawer>` from a `<z-drop>` menu item closes the dropdown automatically and restores focus to the dropdown trigger on close.

## Unmount and state persistence

Like `<z-dialog>`, `<z-drawer>` mounts lazily on first open and keeps its rendered DOM across closes so in-progress form state persists. Add `unmount` to tear down DOM on every close, or call `element.destroy()` manually.

## Component attributes

| Attribute         | Value                                    | Default    | Description                                                                                                                |
| ----------------- | ---------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `open`            | Boolean                                  | `false`    | Controls or reflects the open state of the drawer.                                                                         |
| `placement`       | `'bottom' \| 'top' \| 'left' \| 'right'` | `'bottom'` | Viewport edge the drawer slides out from.                                                                                  |
| `no-handle`       | Boolean                                  | `false`    | Omits the centered drag handle bar.                                                                                        |
| `no-swipe`        | Boolean                                  | `false`    | Disables pointer/touch drag and swipe-to-dismiss.                                                                          |
| `blur`            | Boolean                                  | `false`    | Enables opt-in `.z-modal-blur` on the backdrop overlay.                                                                    |
| `container`       | Boolean                                  | `false`    | Constrains `bottom`/`top` drawers to `75rem` max width or widens `left`/`right` drawers to `40rem`.                        |
| `full`            | Boolean                                  | `false`    | Expands the drawer to fill the entire viewport.                                                                            |
| `stack`           | Boolean                                  | `false`    | Layers the drawer above any active dialog/drawer instead of closing previous overlays first.                               |
| `inline`          | Boolean                                  | `false`    | Keeps `<z-drawer>` in place instead of moving it to `document.body` when opened.                                           |
| `no-bg-close`     | Boolean                                  | `false`    | Prevents closing the drawer when clicking the backdrop overlay.                                                            |
| `no-esc-close`    | Boolean                                  | `false`    | Prevents closing the drawer when pressing <kbd>Esc</kbd>.                                                                  |
| `unmount`         | Boolean                                  | `false`    | Unmounts the cloned template DOM after the close transition completes.                                                     |
| `dialog-role`     | `'dialog' \| 'alertdialog'`              | `'dialog'` | ARIA role applied to the drawer panel (overridden if the template wrapper specifies `role`).                               |
| `aria-label`      | String                                   | `""`       | Accessible label when no visible title or `aria-labelledby` is provided.                                                   |
| `aria-labelledby` | String                                   | `""`       | Explicit ID reference for the accessible drawer title (auto-generated from `.z-modal-title` when omitted).                 |
| `cls`             | String                                   | —          | Override classes by part (`overlay`, `drawer`, `handle`, `handle-bar`, `content`) or pass a plain string for `drawer`.     |
| `stl`             | String                                   | —          | Inline CSS overrides by part (`overlay`, `drawer`, `handle`, `handle-bar`, `content`) or pass a plain string for `drawer`. |

## CSS custom properties

Customize `.z-drawer` via Tier-2 variables (inline, via `stl`, or in CSS):

| Variable                       | Default                                         | Description                                              |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------------- |
| `--z-drawer-width`             | `24rem`                                         | Width for `left` and `right` drawers.                    |
| `--z-drawer-max-width`         | `calc(100vw - 2rem)`                            | Maximum width for `left` and `right` drawers.            |
| `--z-drawer-max-height`        | `85dvh`                                         | Maximum height for `bottom` and `top` sheets.            |
| `--z-drawer-radius`            | `calc(var(--z-global-radius) * 2)`              | Inner-edge corner radius for `bottom` and `top` sheets.  |
| `--z-drawer-side-radius`       | `0px`                                           | Inner-edge corner radius for `left` and `right` drawers. |
| `--z-drawer-bg`                | `var(--z-bg)`                                   | Drawer surface background color.                         |
| `--z-drawer-color`             | `var(--z-bg-f)`                                 | Drawer text color.                                       |
| `--z-drawer-shadow`            | `0 20px 25px -5px rgb(0 0 0 / 0.1), ...`        | Drawer elevation shadow.                                 |
| `--z-drawer-transition`        | `transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)` | Slide transition curve and duration.                     |
| `--z-drawer-handle-length`     | `5rem`                                          | Length of the centered drag handle pill.                 |
| `--z-drawer-handle-thickness`  | `0.375rem`                                      | Thickness of the centered drag handle pill.              |
| `--z-drawer-handle-radius`     | `9999px`                                        | Border radius of the centered drag handle pill.          |
| `--z-drawer-handle-bg`         | `var(--z-border)`                               | Base color for the drag handle pill.                     |
| `--z-drawer-handle-bg-o`       | `calc(var(--z-border-o) * 1.25)`                | Resting opacity percentage for the drag handle pill.     |
| `--z-drawer-handle-hover-bg-o` | `calc(var(--z-border-o) * 2.25)`                | Hover/dragging opacity percentage for the handle pill.   |

## JavaScript

### Events

The following `CustomEvent`s bubble from `<z-drawer>` (`composed: true`):

| Name                   | Cancelable | Description                                                              |
| ---------------------- | ---------- | ------------------------------------------------------------------------ |
| `z-drawer:before-show` | Yes        | Fires before opening. Call `event.preventDefault()` to abort.            |
| `z-drawer:mount`       | No         | Fires the first time `<template data-fn="template">` is mounted.         |
| `z-drawer:show`        | No         | Fires when the open transition starts.                                   |
| `z-drawer:shown`       | No         | Fires after the open transition completes.                               |
| `z-drawer:before-hide` | Yes        | Fires before closing. Call `event.preventDefault()` to abort.            |
| `z-drawer:hide`        | No         | Fires when the close transition starts.                                  |
| `z-drawer:hidden`      | No         | Fires after the close transition completes and focus is restored.        |
| `z-drawer:destroy`     | No         | Fires after mounted DOM has been unmounted via `unmount` or `destroy()`. |

### Methods

```javascript
const drawer = document.getElementById('my-drawer');
await drawer.show();
await drawer.hide();
await drawer.toggle();
await drawer.destroy(); // pass true to also remove <z-drawer> from the DOM
```

## Accessibility

- Sets `role="dialog"` (or `alertdialog` via `dialog-role`) and `aria-modal="true"` on the drawer panel.
- Automatically binds `aria-labelledby` to `.z-modal-title` or `.z-drawer-title` when neither `aria-label` nor `aria-labelledby` is provided.
- Traps <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> inside the topmost open drawer/dialog, dismisses on <kbd>Esc</kbd> (unless `no-esc-close` is set), and restores focus to the trigger on close.
- The visual handle bar is marked `aria-hidden="true"` so screen readers focus directly on meaningful controls while keyboard users dismiss with <kbd>Esc</kbd> or an explicit close button.
