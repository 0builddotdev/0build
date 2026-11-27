# Dialog

## Usage

The Dialog component (`<z-dialog>`) consists of an overlay, a dialog panel, and optional close triggers. Its markup lives inside a `<template data-fn="template">` element so zero dialog DOM is rendered on initial page load.

You can use any element to toggle a dialog by adding the `data-toggle="#ID"` or `data-open="#ID"` attribute targeting the `<z-dialog>` element's `id`. Inside the template, add `data-close` or `.z-modal-close` to an `<a>` or `<button>` element to close the dialog.

Use the following classes to define the dialog's sections inside `<template data-fn="template">`.

| Class             | Description                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `.z-modal-body`   | Add this class to create padding between the dialog and its content.                                     |
| `.z-modal-header` | Add this class to a `<div>` element to create the dialog header.                                         |
| `.z-modal-footer` | Add this class to a `<div>` element to create the dialog footer.                                         |
| `.z-modal-title`  | Add this class to a heading element to create the dialog title and automatically wire `aria-labelledby`. |
| `.z-modal-close`  | Add this class to an `<a>` or `<button>` element to close the dialog when clicked.                       |

<span class="z-label z-label-primary">Note</span> `<z-dialog>` automatically creates the `.z-modal` overlay and `.z-modal-dialog` wrapper when first opened and appends itself to `document.body` (unless `inline` is set). If your `<template data-fn="template">` contains a single `.z-modal-dialog` wrapper, `<z-dialog>` adopts its extra classes, inline styles, and `role` onto the panel automatically.

```html
<!-- This is a button toggling the dialog -->
<button data-toggle="#my-dialog" type="button"></button>

<!-- This is the dialog -->
<z-dialog id="my-dialog">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title"></h2>
      <button class="z-button z-button-default" data-close type="button">Close</button>
    </div>
  </template>
</z-dialog>
```

```html
<button
  class="z-button z-button-default mr"
  style="--mr: 2"
  type="button"
  data-toggle="#dialog-example"
>
  Open
</button>

<a href="#" data-open="#dialog-example">Open</a>

<z-dialog id="dialog-example">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Headline</h2>
      <p class="my" style="--my: 4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <p class="z-text-right">
        <button class="z-button z-button-default mr" style="--mr: 2" type="button" data-close>
          Cancel
        </button>
        <button class="z-button z-button-primary" type="button">Save</button>
      </p>
    </div>
  </template>
</z-dialog>
```

## Close button

To create a close button inside the dialog, add `data-close` (or `.z-modal-close`) to a `<button>` or `<a>` element. Pair it with `<z-icon icon="x"></z-icon>` and `.z-focus-visible` for keyboard focus outlines.

You can also target a specific dialog from outside by passing a selector to `data-close="#ID"`.

```html
<z-dialog id="my-dialog">
  <template data-fn="template">
    <div class="z-modal-body">
      <button
        class="z-modal-close absolute right top z-focus-visible"
        style="--right: 4; --top: 4"
        type="button"
        data-close
        aria-label="Close"
      >
        <z-icon icon="x"></z-icon>
      </button>
    </div>
  </template>
</z-dialog>
```

```html
<!-- This is a button toggling the dialog with a close button -->
<button class="z-button z-button-default" type="button" data-toggle="#dialog-close-default">
  Open
</button>

<!-- This is the dialog with the close button -->
<z-dialog id="dialog-close-default">
  <template data-fn="template">
    <div class="z-modal-body">
      <button
        class="z-modal-close absolute right top z-focus-visible"
        style="--right: 4; --top: 4"
        type="button"
        data-close
        aria-label="Close"
      >
        <z-icon icon="x"></z-icon>
      </button>
      <h2 class="z-modal-title">Heading</h2>
      <p class="mt" style="--mt: 4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  </template>
</z-dialog>
```

## Center dialog

To vertically center the dialog within the viewport, add the `center` attribute to `<z-dialog>`.

```html
<z-dialog id="my-dialog" center>
  <template data-fn="template">
    <div class="z-modal-body"></div>
  </template>
</z-dialog>
```

```html
<button class="z-button z-button-default" type="button" data-toggle="#dialog-center">Open</button>

<z-dialog id="dialog-center" center>
  <template data-fn="template">
    <div class="z-modal-body">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  </template>
</z-dialog>
```

## Header and footer

To divide the dialog into distinct content sections, use `.z-modal-header`, `.z-modal-body`, and `.z-modal-footer`.

| Class             | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `.z-modal-header` | Add this class to a `<div>` element to create the modal header. |
| `.z-modal-body`   | Add this class to a `<div>` element to create the modal body.   |
| `.z-modal-footer` | Add this class to a `<div>` element to create the modal footer. |

```html
<z-dialog id="my-dialog">
  <template data-fn="template">
    <button
      class="z-modal-close absolute right top z-focus-visible"
      style="--right: 4; --top: 4"
      type="button"
      data-close
      aria-label="Close"
    >
      <z-icon icon="x"></z-icon>
    </button>
    <div class="z-modal-header">
      <h2 class="z-modal-title"></h2>
    </div>
    <div class="z-modal-body"></div>
    <div class="z-modal-footer"></div>
  </template>
</z-dialog>
```

```html
<button class="z-button z-button-default" type="button" data-toggle="#dialog-sections">Open</button>

<z-dialog id="dialog-sections">
  <template data-fn="template">
    <button
      class="z-modal-close absolute right top z-focus-visible"
      style="--right: 4; --top: 4"
      type="button"
      data-close
      aria-label="Close"
    >
      <z-icon icon="x"></z-icon>
    </button>
    <div class="z-modal-header">
      <h2 class="z-modal-title">Dialog Title</h2>
    </div>
    <div class="z-modal-body">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default mr" style="--mr: 2" type="button" data-close>
        Cancel
      </button>
      <button class="z-button z-button-primary" type="button">Save</button>
    </div>
  </template>
</z-dialog>
```

## Container modifier

Add the `container` attribute to expand the dialog panel to the default `.z-modal-container` width (`1200px`).

```html
<z-dialog id="my-dialog" container>...</z-dialog>
```

```html
<button class="z-button z-button-default" type="button" data-toggle="#dialog-container">
  Open
</button>

<z-dialog id="dialog-container" container>
  <template data-fn="template">
    <div class="z-modal-body">
      <button
        class="z-modal-close absolute right top z-focus-visible"
        style="--right: 4; --top: 4"
        type="button"
        data-close
        aria-label="Close"
      >
        <z-icon icon="x"></z-icon>
      </button>
      <h2 class="z-modal-title">Headline</h2>
      <p class="mt" style="--mt: 4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  </template>
</z-dialog>
```

## Full modifier

To create a dialog that fills the entire viewport, add the `full` attribute to `<z-dialog>`.

```html
<z-dialog id="my-dialog" full>
  <template data-fn="template">
    <button class="z-modal-close z-focus-visible" type="button" data-close aria-label="Close">
      <z-icon icon="x"></z-icon>
    </button>
  </template>
</z-dialog>
```

```html
<button class="z-button z-button-default" type="button" data-toggle="#dialog-full">Open</button>

<z-dialog id="dialog-full" full>
  <template data-fn="template">
    <button
      class="z-modal-close absolute right top p z-focus-visible"
      style="--right: 0; --top: 0; --p: 8"
      type="button"
      data-close
      aria-label="Close"
    >
      <z-icon icon="x"></z-icon>
    </button>
    <div class="display-grid md:grid-cols" style="--md-grid-cols: 2">
      <div
        class="h-screen bg-cover bg-image"
        style='--bg-image: url("https://0build.dev/images/photo.jpg")'
      ></div>
      <div class="p" style="--p: 8">
        <h1 class="z-h1">Headline</h1>
        <p class="mt" style="--mt: 4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
          est laborum.
        </p>
      </div>
    </div>
  </template>
</z-dialog>
```

## Backdrop blur

Backdrop blur is opt-in so default modal transitions remain crisp and GPU-lightweight. To blur the backdrop behind the dialog, append `.z-modal-blur` to the `overlay` part via `cls`.

```html
<z-dialog cls="overlay: z-modal z-modal-blur">...</z-dialog>
```

```html
<button class="z-button z-button-default" type="button" data-toggle="#dialog-blur">
  Open with Blur
</button>

<z-dialog id="dialog-blur" center cls="overlay: z-modal z-modal-blur">
  <template data-fn="template">
    <div class="z-modal-body">
      <h2 class="z-modal-title">Blurred Backdrop</h2>
      <p class="mt" style="--mt: 4">
        Uses <code>--z-modal-overlay-blur</code> (defaults to <code>var(--z-global-blur)</code>)
        when <code>.z-modal-blur</code> is applied to the overlay.
      </p>
    </div>
  </template>
</z-dialog>
```

## Overflow

By default, the overlay scrolls when the dialog content exceeds the viewport height. To keep the header and footer fixed while scrolling inside the body, add `.z-overflow-auto` and a constrained height (for example `max-h` or `overflow-y: auto`) to `.z-modal-body`.

```html
<z-dialog id="my-dialog">
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Headline</h2>
    </div>
    <div class="z-modal-body z-overflow-auto" style="max-height: 60vh"></div>
    <div class="z-modal-footer"></div>
  </template>
</z-dialog>
```

```html
<button class="z-button z-button-default" type="button" data-toggle="#dialog-overflow">Open</button>

<z-dialog id="dialog-overflow" center>
  <template data-fn="template">
    <button
      class="z-modal-close absolute right top z-focus-visible"
      style="--right: 4; --top: 4"
      type="button"
      data-close
      aria-label="Close"
    >
      <z-icon icon="x"></z-icon>
    </button>

    <div class="z-modal-header">
      <h2 class="z-modal-title">Headline</h2>
    </div>

    <div class="z-modal-body z-overflow-auto space-y" style="--space-y: 4; max-height: 55vh">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>

    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default mr" style="--mr: 2" type="button" data-close>
        Cancel
      </button>
      <button class="z-button z-button-primary" type="button">Save</button>
    </div>
  </template>
</z-dialog>
```

## Groups and stacking

You can link between multiple dialogs using `data-open="#ID"`. By default, opening another dialog closes the currently active one automatically, which works well for multi-step wizards. Add the `stack` attribute to the second `<z-dialog>` if you want it to layer on top of the active dialog instead of replacing it.

```html
<z-dialog id="dialog-step-1">
  <template data-fn="template">
    <div class="z-modal-body">
      <button type="button" data-open="#dialog-step-2">Next</button>
    </div>
  </template>
</z-dialog>

<z-dialog id="dialog-step-2" stack>
  <template data-fn="template">
    <div class="z-modal-body">
      <button type="button" data-close>Close top dialog</button>
    </div>
  </template>
</z-dialog>
```

```html
<div class="display-flex flex-wrap gap" style="--gap: 2">
  <button class="z-button z-button-default" type="button" data-toggle="#dialog-group-1">
    Wizard Step 1
  </button>
  <button class="z-button z-button-default" type="button" data-toggle="#dialog-stack-1">
    Stacked Dialogs
  </button>
</div>

<z-dialog id="dialog-group-1" center>
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Step 1</h2>
    </div>
    <div class="z-modal-body">
      <p>Opening Step 2 closes Step 1 automatically.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default mr" style="--mr: 2" type="button" data-close>
        Cancel
      </button>
      <button class="z-button z-button-primary" type="button" data-open="#dialog-group-2">
        Next
      </button>
    </div>
  </template>
</z-dialog>

<z-dialog id="dialog-group-2" center>
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Step 2</h2>
    </div>
    <div class="z-modal-body">
      <p>Use <code>data-open="#dialog-group-1"</code> to return to Step 1.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button
        class="z-button z-button-default mr"
        style="--mr: 2"
        type="button"
        data-open="#dialog-group-1"
      >
        Previous
      </button>
      <button class="z-button z-button-primary" type="button" data-close>Done</button>
    </div>
  </template>
</z-dialog>

<z-dialog id="dialog-stack-1" center>
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Parent Dialog</h2>
    </div>
    <div class="z-modal-body">
      <p>This dialog stays open behind the stacked confirmation dialog.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-danger" type="button" data-open="#dialog-stack-2">
        Open Stacked Confirmation
      </button>
    </div>
  </template>
</z-dialog>

<z-dialog id="dialog-stack-2" center stack dialog-role="alertdialog">
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Stacked Confirmation</h2>
    </div>
    <div class="z-modal-body">
      <p>Pressing Esc closes only this topmost dialog first.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default" type="button" data-close>Close Top Dialog</button>
    </div>
  </template>
</z-dialog>
```

## Opening from a dropdown

When a menu item inside `<z-drop>` triggers a dialog with `data-open="#ID"` or `data-toggle="#ID"`, `<z-dialog>` automatically closes any unrelated open dropdowns and restores focus to the original dropdown trigger button once the dialog closes.

```html
<button class="z-button z-button-default" data-toggle="#actions-menu" type="button">Actions</button>

<z-drop id="actions-menu" dropdown>
  <template data-fn="template">
    <ul class="z-nav z-dropdown-nav">
      <li><a href="#edit" role="menuitem">Edit</a></li>
      <li><a href="#" data-open="#dialog-from-drop">Delete</a></li>
    </ul>
  </template>
</z-drop>

<z-dialog id="dialog-from-drop" center dialog-role="alertdialog">
  <template data-fn="template">
    <div class="z-modal-header">
      <h2 class="z-modal-title">Delete Item?</h2>
    </div>
    <div class="z-modal-body">
      <p>The dropdown closed automatically and focus returns to Actions on close.</p>
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default mr" style="--mr: 2" type="button" data-close>
        Cancel
      </button>
      <button class="z-button z-button-danger" type="button" data-close>Delete</button>
    </div>
  </template>
</z-dialog>
```

## Unmount and state persistence

By default, `<z-dialog>` follows a mount-once lifecycle:

- **Before first open**: Only `<template data-fn="template">` sits in the DOM. Nothing inside it is parsed or rendered.
- **After closing**: The rendered panel stays mounted (hidden) so in-progress form fields keep their state if the user accidentally closes and reopens the dialog.
- **On-demand or automatic teardown**: Add the `unmount` attribute to clear the mounted DOM after every close, or call `document.getElementById('my-dialog').destroy()` explicitly (for example, after a successful submit or reset action).

```html
<!-- Clears mounted DOM after every close -->
<z-dialog id="ephemeral-dialog" unmount>
  <template data-fn="template">...</template>
</z-dialog>

<!-- Keeps mounted DOM across closes, destroys on demand -->
<z-dialog id="draft-dialog">
  <template data-fn="template">
    <div class="z-modal-body">
      <input class="z-input" type="text" placeholder="Preserved across reopen" />
    </div>
    <div class="z-modal-footer z-text-right">
      <button class="z-button z-button-default" type="button" data-close>Keep Draft</button>
      <button
        class="z-button z-button-primary"
        type="button"
        onclick="document.getElementById('draft-dialog').destroy()"
      >
        Submit &amp; Reset
      </button>
    </div>
  </template>
</z-dialog>
```

## Component attributes

All options are standard HTML attributes on `<z-dialog>`.

| Attribute         | Value                       | Default    | Description                                                                                                |
| ----------------- | --------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `open`            | Boolean                     | `false`    | Controls or reflects the open state of the dialog.                                                         |
| `center`          | Boolean                     | `false`    | Vertically centers the dialog in the viewport (`.z-flex` + `.z-margin-auto-vertical`).                     |
| `container`       | Boolean                     | `false`    | Expands the dialog to the container width (`.z-modal-container`).                                          |
| `full`            | Boolean                     | `false`    | Expands the dialog to fill the entire viewport (`.z-modal-full`).                                          |
| `stack`           | Boolean                     | `false`    | Layers the dialog above any already open dialog instead of closing previous dialogs first.                 |
| `inline`          | Boolean                     | `false`    | Keeps `<z-dialog>` in place instead of moving it to `document.body` when opened.                           |
| `no-bg-close`     | Boolean                     | `false`    | Prevents closing the dialog when clicking the backdrop overlay.                                            |
| `no-esc-close`    | Boolean                     | `false`    | Prevents closing the dialog when pressing the <kbd>Esc</kbd> key.                                          |
| `unmount`         | Boolean                     | `false`    | Unmounts the cloned template DOM after the close transition completes.                                     |
| `dialog-role`     | `'dialog' \| 'alertdialog'` | `'dialog'` | ARIA role applied to the dialog panel (overridden if the template wrapper specifies `role`).               |
| `aria-label`      | String                      | `""`       | Accessible label when no visible `.z-modal-title` or `aria-labelledby` is provided.                        |
| `aria-labelledby` | String                      | `""`       | Explicit ID reference for the accessible dialog title (auto-generated from `.z-modal-title` when omitted). |
| `cls`             | String                      | —          | Override classes by part (`overlay`, `dialog`) or pass a plain string to target `dialog`.                  |
| `stl`             | String                      | —          | Inline CSS overrides by part (`overlay`, `dialog`) or pass a plain string to target `dialog`.              |

## JavaScript

### Events

The following `CustomEvent`s bubble from `<z-dialog>` (`composed: true`):

| Name                   | Cancelable | Description                                                              |
| ---------------------- | ---------- | ------------------------------------------------------------------------ |
| `z-dialog:before-show` | Yes        | Fires before opening. Call `event.preventDefault()` to abort.            |
| `z-dialog:mount`       | No         | Fires the first time `<template data-fn="template">` is mounted.         |
| `z-dialog:show`        | No         | Fires when the open transition starts.                                   |
| `z-dialog:shown`       | No         | Fires after the open transition completes.                               |
| `z-dialog:before-hide` | Yes        | Fires before closing. Call `event.preventDefault()` to abort.            |
| `z-dialog:hide`        | No         | Fires when the close transition starts.                                  |
| `z-dialog:hidden`      | No         | Fires after the close transition completes and focus is restored.        |
| `z-dialog:destroy`     | No         | Fires after mounted DOM has been unmounted via `unmount` or `destroy()`. |

### Methods

The following async methods are available on the `<z-dialog>` element:

#### `show(trigger?)`

```javascript
const dialog = document.getElementById('my-dialog');
await dialog.show();
```

Mounts (if needed) and opens the dialog, optionally specifying the trigger element to restore focus to on close.

#### `hide()`

```javascript
await dialog.hide();
```

Closes the dialog, waits for the transition, removes page scroll lock if no dialogs remain, and restores focus to the trigger.

#### `toggle(trigger?)`

```javascript
await dialog.toggle();
```

Toggles the dialog between open and closed states.

#### `destroy(removeHost = false)`

```javascript
await dialog.destroy();
// Or unmount DOM and remove <z-dialog> itself:
await dialog.destroy(true);
```

Closes the dialog (if open), tears down the mounted template DOM, and optionally removes the `<z-dialog>` host element from the document.

## Accessibility

The Dialog component adheres to the [Dialog (Modal) WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/):

- The panel sets `role="dialog"` (or `alertdialog` via `dialog-role`) and `aria-modal="true"`.
- If `.z-modal-title` is present inside the template and neither `aria-label` nor `aria-labelledby` is provided, `<z-dialog>` automatically assigns an ID to `.z-modal-title` and binds `aria-labelledby` to it.
- On open, focus moves to the first `[autofocus]` element, otherwise the first visible focusable descendant, or the dialog panel itself (`tabindex="-1"`).
- On close, focus returns to the triggering control (or the parent `<z-drop>` trigger when opened from a dropdown menu).

### Keyboard interaction

- <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd>: Cycles focus cleanly inside the topmost open dialog panel (while allowing focus inside an open child `<z-drop>`).
- <kbd>Esc</kbd>: Closes any open `<z-drop>` first; otherwise closes the topmost open dialog unless `no-esc-close` is set.
