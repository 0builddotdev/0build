# Drop

## Usage

The Drop component (`<z-drop>`) positions floating menus and popovers using Floating UI (`@floating-ui/dom`). Its content lives inside `<template data-fn="template">` so zero drop DOM is rendered until opened, activates immediately on `pointerdown` in click mode, and animates with a fast directional curve (`data-side`).

Add `<z-drop>` directly after a trigger element such as a `<button>` — or bind it explicitly via `id` and `data-toggle="#ID"` / `data-open="#ID"` (which also allows a single `<z-drop>` to re-anchor dynamically across multiple triggers).

<span class="z-label z-label-primary">Note</span> By default, `<z-drop>` applies only layout positioning (`.z-drop`). Style your popover content using `.z-card.z-card-body`, or add the `dropdown` attribute for `.z-dropdown` menu styling.

```html
<!-- Preceding sibling binding -->
<button type="button">Open</button>
<z-drop>
  <template data-fn="template">
    <div class="z-card z-card-body"></div>
  </template>
</z-drop>

<!-- Or explicit ID + data-toggle binding -->
<button data-toggle="#my-drop" type="button">Open</button>
<z-drop id="my-drop">
  <template data-fn="template">...</template>
</z-drop>
```

```html
<div class="z-inline">
  <button class="z-button z-button-default" type="button">Hover / Click</button>
  <z-drop mode="click,hover">
    <template data-fn="template">
      <div class="z-card z-card-body">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.
      </div>
    </template>
  </z-drop>
</div>
```

## Dropdown

Add the `dropdown` attribute to `<z-drop>` to apply `.z-dropdown` surface styling (background, hairline border, shadow, and radius), and pair it with `<ul class="z-nav z-dropdown-nav">` inside `<template data-fn="template">`.

Links with `role="menuitem"`, `.z-drop-close`, or same-page `#hash` targets automatically close the menu on click. Add `.z-drop-parent-icon` inside the trigger button to rotate the indicator `180deg` when `aria-expanded="true"`.

```html
<button class="z-button z-button-default" data-toggle="#my-dropdown" type="button">
  Menu <span class="z-drop-parent-icon">▾</span>
</button>

<z-drop id="my-dropdown" dropdown>
  <template data-fn="template">
    <ul class="z-nav z-dropdown-nav">
      <li class="z-nav-header">Actions</li>
      <li><a href="#edit" role="menuitem">Edit</a></li>
      <li class="z-nav-divider"></li>
      <li><a href="#delete" role="menuitem">Delete</a></li>
    </ul>
  </template>
</z-drop>
```

```html
<button class="z-button z-button-default" data-toggle="#drop-menu" type="button">
  Actions
  <span class="z-drop-parent-icon">▾</span>
</button>

<z-drop id="drop-menu" dropdown>
  <template data-fn="template">
    <ul class="z-nav z-dropdown-nav">
      <li class="z-nav-header">Account</li>
      <li><a href="#profile" role="menuitem">Profile</a></li>
      <li><a href="#billing" role="menuitem">Billing</a></li>
      <li class="z-nav-divider"></li>
      <li><a href="#sign-out" role="menuitem">Sign out</a></li>
    </ul>
  </template>
</z-drop>
```

## Mode

By default, `<z-drop>` opens on click (`mode="click"`). Set the `mode` attribute to support hover or both.

| Mode          | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `click`       | Default. Opens immediately on mouse `pointerdown` and click/keyboard. |
| `hover`       | Opens on pointer enter and closes after `delay-hide` when leaving.    |
| `click,hover` | Combines both hover and click behavior.                               |

```html
<z-drop mode="hover" delay-show="100" delay-hide="150">...</z-drop>
```

```html
<div class="display-flex flex-wrap gap" style="--gap: 2">
  <div>
    <button class="z-button z-button-default" type="button">Hover</button>
    <z-drop mode="hover">
      <template data-fn="template">
        <div class="z-card z-card-body">Opens on hover with a 150ms leave grace period.</div>
      </template>
    </z-drop>
  </div>

  <div>
    <button class="z-button z-button-default" type="button">Click</button>
    <z-drop mode="click">
      <template data-fn="template">
        <div class="z-card z-card-body">
          Opens on instant <code>pointerdown</code> or keyboard activation.
        </div>
      </template>
    </z-drop>
  </div>
</div>
```

## Placement

By default, `<z-drop>` is positioned at `bottom-start`. Set the `placement` attribute to any Floating UI placement. When Floating UI flips the popover to the opposite side, `data-side` updates automatically so the entry animation slides from the matching direction.

| Placement      | Description                                              |
| -------------- | -------------------------------------------------------- |
| `top-start`    | Above the trigger, aligned to its left edge.             |
| `top`          | Above the trigger, centered.                             |
| `top-end`      | Above the trigger, aligned to its right edge.            |
| `bottom-start` | Default. Below the trigger, aligned to its left edge.    |
| `bottom`       | Below the trigger, centered.                             |
| `bottom-end`   | Below the trigger, aligned to its right edge.            |
| `left-start`   | To the left of the trigger, aligned to its top edge.     |
| `left`         | To the left of the trigger, vertically centered.         |
| `left-end`     | To the left of the trigger, aligned to its bottom edge.  |
| `right-start`  | To the right of the trigger, aligned to its top edge.    |
| `right`        | To the right of the trigger, vertically centered.        |
| `right-end`    | To the right of the trigger, aligned to its bottom edge. |

```html
<z-drop placement="top-end" dropdown>...</z-drop>
```

```html
<div class="display-flex flex-wrap gap" style="--gap: 2">
  <div>
    <button class="z-button z-button-default" type="button">Top End</button>
    <z-drop placement="top-end" dropdown>
      <template data-fn="template">
        <div class="p" style="--p: 3">Anchored at <code>top-end</code>.</div>
      </template>
    </z-drop>
  </div>

  <div>
    <button class="z-button z-button-default" type="button">Bottom Center</button>
    <z-drop placement="bottom" dropdown>
      <template data-fn="template">
        <div class="p" style="--p: 3">Anchored at <code>bottom</code>.</div>
      </template>
    </z-drop>
  </div>

  <div>
    <button class="z-button z-button-default" type="button">Right Start</button>
    <z-drop placement="right-start" dropdown>
      <template data-fn="template">
        <div class="p" style="--p: 3">Anchored at <code>right-start</code>.</div>
      </template>
    </z-drop>
  </div>
</div>
```

## Offset, flip, and shift

To set a custom gap in pixels between the trigger and the drop, use the `offset` attribute (otherwise it reads `--z-position-offset`, defaulting to `8px`). Automatic flipping and viewport shifting can be configured via the `floating` attribute.

```html
<z-drop offset="16" floating="flip: false; shiftPadding: 16">...</z-drop>
```

```html
<button class="z-button z-button-default" type="button">Offset 20px</button>
<z-drop offset="20" dropdown>
  <template data-fn="template">
    <div class="p" style="--p: 3">Positioned with <code>offset="20"</code>.</div>
  </template>
</z-drop>
```

## Stretch

Use the `stretch` attribute to size the floating container relative to its trigger or available viewport space:

- `stretch` or `stretch="trigger"`: Sets `min-width` to match the trigger width and constrains `max-height` to the available space.
- `stretch="fill"`: Expands `width` and `max-height` to fill available viewport space.

```html
<button class="z-button z-button-default" style="width: 16rem" type="button">
  Match Trigger Width
</button>
<z-drop stretch="trigger" dropdown>
  <template data-fn="template">
    <ul class="z-nav z-dropdown-nav">
      <li><a href="#one" role="menuitem">Option One</a></li>
      <li><a href="#two" role="menuitem">Option Two</a></li>
    </ul>
  </template>
</z-drop>
```

## Target and manual binding

By default, `<z-drop>` looks for an explicit `trigger` selector, any matching `[data-toggle="#ID"]` / `[data-open="#ID"]`, or falls back to its preceding sibling element.

- Set `trigger="#selector"` to anchor to a specific element elsewhere in the DOM.
- Set `manual` when you want `<z-drop>` to ignore its preceding sibling and open only via `data-toggle` / `data-open` or JavaScript.

```html
<button
  id="custom-anchor"
  class="z-button z-button-default"
  data-toggle="#targeted-drop"
  type="button"
>
  Anchor Button
</button>

<z-drop id="targeted-drop" trigger="#custom-anchor" dropdown>
  <template data-fn="template">
    <ul class="z-nav z-dropdown-nav">
      <li><a href="#action" role="menuitem">Anchored explicitly</a></li>
    </ul>
  </template>
</z-drop>
```

## Inside dialogs & opening dialogs

`<z-drop>` and `<z-dialog>` coordinate cleanly in both directions:

- **Drop inside a dialog**: When opened inside an active `<z-dialog>`, `<z-drop>` automatically computes a higher `z-index` than the modal overlay, keeps dialog <kbd>Tab</kbd> focus working inside the dropdown, and intercepts the first <kbd>Esc</kbd> press so only the dropdown closes.
- **Opening a dialog from a drop**: Placing `data-open="#dialog-id"` on a dropdown item closes the menu automatically and restores focus to the dropdown trigger once the dialog closes — without needing `.z-drop-close` workarounds.

```html
<button class="z-button z-button-default" data-toggle="#drop-dialog-menu" type="button">
  Item Actions
</button>

<z-drop id="drop-dialog-menu" dropdown>
  <template data-fn="template">
    <ul class="z-nav z-dropdown-nav">
      <li><a href="#rename" role="menuitem">Rename</a></li>
      <li><a href="#" data-open="#drop-confirm-dialog">Delete</a></li>
    </ul>
  </template>
</z-drop>

<z-dialog id="drop-confirm-dialog" center>
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Nested Drop Inside Dialog</h2>
    </div>
    <div class="z-modal-body">
      <button class="z-button z-button-default" type="button">Menu Inside Dialog</button>
      <z-drop dropdown>
        <template data-fn="template">
          <ul class="z-nav z-dropdown-nav">
            <li><a href="#opt-a" role="menuitem">Option A</a></li>
            <li><a href="#opt-b" role="menuitem">Option B</a></li>
          </ul>
        </template>
      </z-drop>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default" data-close type="button">Close</button>
    </div>
  </template>
</z-dialog>
```

## Component attributes

| Attribute         | Value                       | Default          | Description                                                                                             |
| ----------------- | --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `open`            | Boolean                     | `false`          | Controls or reflects the open state of the drop.                                                        |
| `dropdown`        | Boolean                     | `false`          | Adds `.z-dropdown` surface styling to the drop container.                                               |
| `placement`       | Floating UI `Placement`     | `'bottom-start'` | Preferred side and alignment relative to the anchor element.                                            |
| `mode`            | String                      | `'click'`        | Comma-separated trigger modes (`click`, `hover`, or `click,hover`).                                     |
| `trigger`         | CSS selector \| `'false'`   | `""`             | Explicit selector or element ID to bind as the anchor/trigger.                                          |
| `manual`          | Boolean                     | `false`          | Disables automatic binding to the preceding sibling element.                                            |
| `delay-show`      | Number                      | `0`              | Delay in milliseconds before opening in `hover` mode.                                                   |
| `delay-hide`      | Number                      | `150`            | Grace period in milliseconds before closing on pointer leave in `hover` mode.                           |
| `offset`          | Number                      | CSS variable     | Gap in pixels between anchor and drop (defaults to `--z-position-offset` or `8`).                       |
| `stretch`         | `'' \| 'trigger' \| 'fill'` | `""`             | Sizes width/max-height to match the trigger (`trigger`) or available viewport (`fill`).                 |
| `inline`          | Boolean                     | `false`          | Uses `position: absolute` in place instead of portaling to `document.body` with `fixed` positioning.    |
| `unmount`         | Boolean                     | `false`          | Clears mounted template DOM whenever the drop closes.                                                   |
| `close-on-scroll` | Boolean                     | `false`          | Closes the drop when an external scroll container scrolls.                                              |
| `no-esc-close`    | Boolean                     | `false`          | Prevents <kbd>Esc</kbd> from closing the drop.                                                          |
| `no-bg-close`     | Boolean                     | `false`          | Prevents outside pointer clicks from closing the drop.                                                  |
| `floating`        | String                      | —                | Floating UI options string (e.g. `placement`, `offset`, `flip: false`, `shift: false`, `shiftPadding`). |
| `cls`             | String                      | —                | Override classes for the `drop` part (or plain string).                                                 |
| `stl`             | String                      | —                | Inline CSS overrides for the `drop` part (or plain string).                                             |

## JavaScript

### Events

The following `CustomEvent`s bubble from `<z-drop>` (`composed: true`):

| Name                 | Cancelable | Description                                                              |
| -------------------- | ---------- | ------------------------------------------------------------------------ |
| `z-drop:before-show` | Yes        | Fires before opening. Call `event.preventDefault()` to abort.            |
| `z-drop:mount`       | No         | Fires when `<template data-fn="template">` mounts on first open.         |
| `z-drop:show`        | No         | Fires immediately after opening.                                         |
| `z-drop:shown`       | No         | Fires after positioning and opening complete.                            |
| `z-drop:before-hide` | Yes        | Fires before closing. Call `event.preventDefault()` to abort.            |
| `z-drop:hide`        | No         | Fires immediately after closing.                                         |
| `z-drop:hidden`      | No         | Fires after closing finishes and focus handling completes.               |
| `z-drop:destroy`     | No         | Fires after mounted DOM has been unmounted via `unmount` or `destroy()`. |

### Methods

```javascript
const drop = document.getElementById('my-drop');

await drop.show();
await drop.hide(true); // pass true to restore focus to anchor
await drop.toggle();
await drop.destroy(); // pass true to also remove <z-drop> from the DOM
```

## Accessibility

- Automatically initializes and keeps `aria-expanded="true" | "false"` in sync on the bound trigger element.
- Outside pointer presses close active drops without stealing focus from non-overlapping interactions, while nested child drops keep parent menus open.

### Keyboard interaction

- <kbd>Enter</kbd> / <kbd>Space</kbd>: Toggles click-mode drops from a button trigger.
- <kbd>↓</kbd> (on trigger): Opens the drop and focuses the first item inside `.z-dropdown-nav` or `[role="menuitem"]`.
- <kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> (inside dropdown): Moves focus across menu items without interfering when typing inside `<input>`, `<textarea>`, or `contenteditable` fields.
- <kbd>Esc</kbd>: Closes the topmost active drop and restores focus to its anchor trigger.
