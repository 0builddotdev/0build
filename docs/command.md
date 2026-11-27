# Command

## Usage

The Command component (`<z-cmd>`) is a lazy-mounted modal command palette with live search filtering, grouped actions, optional descriptions, keyboard shortcut keycaps, and a footer hint bar.

Commands are declared inside a hidden `<select data-fn="data-source" hidden>` element using standard `<option>` and `<optgroup>` tags. Nothing is rendered into the DOM until the command palette is opened via `data-toggle="#ID"`, `data-open="#ID"`, a global keyboard `shortcut`, or `element.show()`.

Use the following HTML elements and `data-*` attributes inside `<select data-fn="data-source" hidden>`:

| Element / Attribute    | Description                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `<optgroup label="…">` | Groups commands under a header and inserts an edge-to-edge separator before subsequent groups.             |
| `value`                | Command identifier emitted in `event.detail.value` on selection.                                           |
| `data-description`     | Secondary muted description shown next to the command label (also included in search matching).            |
| `data-keywords`        | Comma-separated extra search terms (for example, `data-keywords="billing, invoices, receipts"`).           |
| `data-icon`            | Icon key resolved via the `$icons` repository (`<template id="z-icons">` or `<template data-fn="icons">`). |
| `data-kbd`             | Shortcut hint displayed on the right (`⌘+K` renders multiple keys; `G S` renders spaced keycaps).          |
| `disabled`             | Marks an `<option>` or `<optgroup>` as non-selectable and skips it during keyboard navigation.             |

<span class="z-label z-label-primary">Note</span> Search matches across every word in your query (`value`, label text, group label, `data-description`, and `data-keywords`).

```html
<button data-toggle="#my-cmd" type="button">Command</button>

<z-cmd id="my-cmd" shortcut="mod+k">
  <select data-fn="data-source" hidden>
    <optgroup label="Suggestions">
      <option value="calendar" data-kbd="⌘+J">Calendar</option>
      <option value="settings" data-description="Workspace preferences" data-kbd="⌘+,">
        Settings
      </option>
    </optgroup>
  </select>
</z-cmd>
```

```html
<div class="display-flex items-center gap" style="--gap: 3">
  <button class="z-button z-button-default" data-toggle="#cmd-example" type="button">
    Open Command (<kbd class="z-kbd">Ctrl+K</kbd>)
  </button>
  <span id="cmd-example-output" class="z-text-small z-text-muted"></span>
</div>

<z-cmd id="cmd-example" shortcut="mod+k" placeholder="Search for apps and commands...">
  <template data-fn="icons">
    <svg
      data-key="globe"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
    <svg
      data-key="settings"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      />
    </svg>
  </template>

  <select data-fn="data-source" hidden>
    <optgroup label="Suggestions">
      <option value="linear" data-keywords="issues, tasks" data-kbd="⌘+L">Linear</option>
      <option value="figma" data-keywords="design, ui" data-kbd="⌘+F">Figma</option>
    </optgroup>
    <optgroup label="Navigation">
      <option
        value="/dns"
        data-icon="globe"
        data-description="Manage DNS records and zones"
        data-keywords="domain, nameserver"
        data-kbd="G+D"
      >
        DNS
      </option>
      <option value="/billing" data-description="View billing history" disabled>
        Billing (Disabled)
      </option>
      <option
        value="/settings"
        data-icon="settings"
        data-description="Workspace preferences"
        data-kbd="G+S"
      >
        Settings
      </option>
    </optgroup>
  </select>
</z-cmd>

<script>
  document.getElementById('cmd-example')?.addEventListener('z-cmd:select', e => {
    const out = document.getElementById('cmd-example-output');
    if (out) {
      out.textContent = `Selected: ${e.detail.text} (${e.detail.value})`;
    }
  });
</script>
```

## Global shortcut

Set the `shortcut` attribute to toggle the command menu from anywhere on the page.

| Token              | Meaning                                                         |
| ------------------ | --------------------------------------------------------------- |
| `mod`              | <kbd>⌘</kbd> on macOS/iOS and <kbd>Ctrl</kbd> on Windows/Linux. |
| `ctrl` / `control` | <kbd>Ctrl</kbd> modifier.                                       |
| `meta` / `cmd`     | <kbd>⌘</kbd> / Windows key modifier.                            |
| `alt` / `option`   | <kbd>Alt</kbd> / <kbd>Option</kbd> modifier.                    |
| `shift`            | <kbd>Shift</kbd> modifier.                                      |

<span class="z-label z-label-primary">Note</span> Unmodified shortcuts (such as `shortcut="/"`) are automatically ignored when focus is inside an `<input>`, `<textarea>`, `<select>`, or `contenteditable` element so typing is never interrupted.

```html
<z-cmd id="cmd-shortcut" shortcut="mod+k">...</z-cmd>
```

```html
<button class="z-button z-button-default" data-toggle="#cmd-slash" type="button">
  Press <kbd class="z-kbd">/</kbd> or Click
</button>

<z-cmd id="cmd-slash" shortcut="/" placeholder="Jump to page...">
  <select data-fn="data-source" hidden>
    <option value="/docs">Documentation</option>
    <option value="/changelog">Changelog</option>
    <option value="/status">System Status</option>
  </select>
</z-cmd>
```

## Icons

Command items resolve `data-icon="KEY"` through 0build's standard `$icons()` system:

1. Global icons defined inside `<template id="z-icons">` on the page.
2. Instance-specific icons defined inside `<template data-fn="icons">` inside `<z-cmd>`.
3. Built-in fallbacks (`search`, `arrow-up`, `arrow-down`, `corner-down-left`).

You can also customize the search input icon key via the `icon` attribute (for example `icon="sparkles"` when a `data-key="sparkles"` SVG is present in your icon template).

```html
<template id="z-icons">
  <svg
    data-key="terminal"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
</template>

<z-cmd id="cmd-icons">
  <select data-fn="data-source" hidden>
    <option value="cli" data-icon="terminal" data-description="Open web terminal">Terminal</option>
  </select>
</z-cmd>
```

```html
<button class="z-button z-button-default" data-toggle="#cmd-custom-icons" type="button">
  Open with Custom Icons
</button>

<z-cmd id="cmd-custom-icons" icon="sparkles" placeholder="Ask or run an action...">
  <template data-fn="icons">
    <svg
      data-key="sparkles"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
    </svg>
    <svg
      data-key="file-plus"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  </template>

  <select data-fn="data-source" hidden>
    <option value="new-file" data-icon="file-plus" data-description="Create a blank document">
      New Document
    </option>
    <option value="ask-ai" data-icon="sparkles" data-description="Generate from prompt">
      Generate Draft
    </option>
  </select>
</z-cmd>
```

## Footer and close behavior

By default, `<z-cmd>` renders a recessed footer showing keyboard hints (<kbd>↑</kbd> <kbd>↓</kbd> Navigate, <kbd>↵</kbd> Open) and an interactive <kbd>Esc</kbd> Close button.

- Add `no-footer` to omit the footer bar.
- Add `prevent-close` (or call `event.preventDefault()` inside a `z-cmd:select` listener) to keep the command dialog open after an option is selected.

```html
<z-cmd id="my-cmd" no-footer prevent-close>...</z-cmd>
```

```html
<button class="z-button z-button-default" data-toggle="#cmd-compact" type="button">
  Compact Command (No Footer)
</button>

<z-cmd id="cmd-compact" no-footer prevent-close center>
  <select data-fn="data-source" hidden>
    <option value="theme-light" data-description="Stays open when picked">Theme: Light</option>
    <option value="theme-dark" data-description="Stays open when picked">Theme: Dark</option>
    <option value="theme-system" data-description="Stays open when picked">Theme: System</option>
  </select>
</z-cmd>
```

## Internationalization

Translate any built-in label globally via `<script id="z-i18n" type="application/json">` or per component using the `i18n` attribute.

| Key                  | Default                             | Description                                        |
| -------------------- | ----------------------------------- | -------------------------------------------------- |
| `dialog-label`       | `'Command menu'`                    | `aria-label` applied to the modal dialog element.  |
| `search-placeholder` | `'Search for apps and commands...'` | Placeholder and `aria-label` for the search input. |
| `list-label`         | `'Commands'`                        | `aria-label` applied to the `listbox` element.     |
| `empty-message`      | `'No results found.'`               | Message rendered when no commands match the query. |
| `navigate-label`     | `'Navigate'`                        | Footer hint text beside the arrow keys.            |
| `select-label`       | `'Open'`                            | Footer hint text beside the enter key.             |
| `close-label`        | `'Close'`                           | Label for the footer close button.                 |
| `close-hint`         | `'Esc'`                             | Keycap label inside the footer close button.       |

```html
<z-cmd
  id="cmd-es"
  i18n="search-placeholder: Buscar comandos...; empty-message: Sin resultados.; close-label: Cerrar"
>
  <select data-fn="data-source" hidden>
    <option value="home">Inicio</option>
  </select>
</z-cmd>
```

## Component attributes

`<z-cmd>` inherits all dialog attributes (`open`, `center`, `container`, `full`, `stack`, `inline`, `no-bg-close`, `no-esc-close`, `unmount`) in addition to command-specific attributes:

| Attribute       | Value   | Default | Description                                                                         |
| --------------- | ------- | ------- | ----------------------------------------------------------------------------------- |
| `placeholder`   | String  | `""`    | Overrides the default `i18n` search input placeholder.                              |
| `shortcut`      | String  | `""`    | Global keyboard shortcut to toggle the palette (e.g. `mod+k`, `/`).                 |
| `icon`          | String  | `""`    | Custom icon key from `$icons` replacing the default `search` icon.                  |
| `prevent-close` | Boolean | `false` | Keeps `<z-cmd>` open when an item is selected.                                      |
| `no-footer`     | Boolean | `false` | Hides the bottom keyboard hint and close bar.                                       |
| `cls`           | String  | —       | Override classes by part (`panel`, `search`, `search-input`, `list`, `item`, etc.). |
| `stl`           | String  | —       | Override inline styles by part.                                                     |
| `i18n`          | String  | —       | Per-instance translations for built-in UI strings.                                  |

Customizable `cls` / `stl` part keys: `overlay`, `dialog`, `panel`, `search`, `search-icon`, `search-input`, `divider`, `list`, `separator`, `item`, `item-active`, `item-disabled`, `item-header`, `item-link`, `item-wrapper`, `item-icon`, `item-content`, `item-text`, `item-subtitle`, `item-shortcut`, `kbd`, `empty`, `footer`, `footer-group`, `footer-item`, `footer-kbd`, and `footer-close`.

## JavaScript

### Events

| Name                | Cancelable | Detail / Description                                                                                                         |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `z-cmd:select`      | Yes        | Fires when an item is selected. Detail: `{ value, text, group, item, originalEvent }`. Call `preventDefault()` to keep open. |
| `z-cmd:search`      | No         | Fires when the search query changes. Detail: `{ value }`.                                                                    |
| `z-cmd:before-show` | Yes        | Fires before opening. Call `preventDefault()` to abort.                                                                      |
| `z-cmd:mount`       | No         | Fires when `<z-cmd>` mounts its DOM on first open.                                                                           |
| `z-cmd:show`        | No         | Fires when the open transition starts.                                                                                       |
| `z-cmd:shown`       | No         | Fires after the open transition completes.                                                                                   |
| `z-cmd:before-hide` | Yes        | Fires before closing. Call `preventDefault()` to abort.                                                                      |
| `z-cmd:hide`        | No         | Fires when the close transition starts.                                                                                      |
| `z-cmd:hidden`      | No         | Fires after the close transition completes and search state stays ready or resets per `unmount`.                             |
| `z-cmd:destroy`     | No         | Fires after mounted DOM has been unmounted via `unmount` or `destroy()`.                                                     |

```javascript
const cmd = document.getElementById('cmd-example');

cmd.addEventListener('z-cmd:select', event => {
  const { value, text, group } = event.detail;
  console.log({ value, text, group });
});
```

### Methods

```javascript
const cmd = document.getElementById('my-cmd');
await cmd.show();
await cmd.hide();
await cmd.toggle();
await cmd.destroy(); // unmount rendered DOM; pass true to also remove host element
```

## Accessibility

- Uses a modal dialog container (`role="dialog"`, `aria-modal="true"`), a `role="combobox"` search input with `aria-autocomplete="list"` and `aria-controls`, and a `role="listbox"` option list updating `aria-activedescendant`.
- Disabled options receive `aria-disabled="true"` and are skipped when navigating with arrow keys.
- When search returns zero items, an `aria-live="polite"` status region (`role="status"`) announces the empty message.

### Keyboard interaction

- <kbd>↓</kbd> / <kbd>↑</kbd>: Moves focus to the next or previous enabled command item (wrapping around ends).
- <kbd>Home</kbd> / <kbd>End</kbd>: Jumps to the first or last enabled command item.
- <kbd>Enter</kbd>: Triggers `z-cmd:select` on the currently active command item.
- <kbd>Esc</kbd>: Closes the command palette and restores focus to the opener.
