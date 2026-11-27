# Accordion

## Usage

The Accordion component (`<z-accordion>`) is an **in-flow scoped controller** over live `.z-accordion` or `.z-nav` HTML.

Unlike out-of-flow overlays (`<z-dialog>`, `<z-drawer>`), `<z-accordion>` wraps **live HTML directly** (`noChange` render) so initially open items (`.z-open`) and collapsed panels (`hidden`) paint accurately on frame 0 with **zero CLS**.

Place `.z-accordion` inside `<z-accordion>`, or apply `class="z-accordion"` directly on `<z-accordion>`.

```html
<!-- Self-contained .z-accordion inside <z-accordion> -->
<z-accordion>
  <ul class="z-accordion">
    <li class="z-open">
      <button class="z-accordion-title" type="button">
        <span>Item 1</span>
        <z-icon class="z-accordion-icon" icon="chevron-down"></z-icon>
      </button>
      <div class="z-accordion-content">
        <p>Visible immediately on initial paint with zero CLS.</p>
      </div>
    </li>
    <li>
      <button class="z-accordion-title" type="button">
        <span>Item 2</span>
        <z-icon class="z-accordion-icon" icon="chevron-down"></z-icon>
      </button>
      <div class="z-accordion-content" hidden>
        <p>Collapsed on frame 0 via the native hidden attribute.</p>
      </div>
    </li>
    <li>
      <button class="z-accordion-title" type="button">
        <span>Item 3</span>
        <z-icon class="z-accordion-icon" icon="chevron-down"></z-icon>
      </button>
      <div class="z-accordion-content" hidden>
        <p>Smooth Web Animations API height transition on toggle.</p>
      </div>
    </li>
  </ul>
</z-accordion>

<!-- Or apply .z-accordion directly on the <z-accordion> host -->
<z-accordion class="z-accordion">
  <div class="z-open">
    <button class="z-accordion-title" type="button">
      <span>Direct Host Item 1</span>
      <z-icon class="z-accordion-icon" icon="chevron-down"></z-icon>
    </button>
    <div class="z-accordion-content">
      <p>Supports both &lt;li&gt; and &lt;div&gt; items.</p>
    </div>
  </div>
  <div>
    <button class="z-accordion-title" type="button">
      <span>Direct Host Item 2</span>
      <z-icon class="z-accordion-icon" icon="chevron-down"></z-icon>
    </button>
    <div class="z-accordion-content" hidden>
      <p>Second panel content.</p>
    </div>
  </div>
</z-accordion>
```

## Single, multiple, and non-collapsible modes

- **Single (default)**: Opening an item automatically collapses any open sibling.
- **`multiple`**: Allows multiple sections to remain open simultaneously. You can pre-open multiple items with `.z-open` or `active="0, 2"`.
- **`no-collapsible`**: Prevents collapsing the last remaining open item (and opens the first enabled item if none start open).

```html
<!-- Multiple open sections -->
<z-accordion multiple active="0, 2">
  <ul class="z-accordion">
    <li class="z-open">
      <a class="z-accordion-title" href="#">Section A</a>
      <div class="z-accordion-content"><p>Open by default.</p></div>
    </li>
    <li>
      <a class="z-accordion-title" href="#">Section B</a>
      <div class="z-accordion-content" hidden><p>Collapsed initially.</p></div>
    </li>
    <li class="z-open">
      <a class="z-accordion-title" href="#">Section C</a>
      <div class="z-accordion-content"><p>Also open by default.</p></div>
    </li>
  </ul>
</z-accordion>

<!-- Non-collapsible (at least one item always stays open) -->
<z-accordion no-collapsible>
  <ul class="z-accordion">
    <li class="z-open">
      <button class="z-accordion-title" type="button">Always One Open</button>
      <div class="z-accordion-content">
        <p>Cannot collapse this while it is the only open item.</p>
      </div>
    </li>
    <li>
      <button class="z-accordion-title" type="button">Switch To Second</button>
      <div class="z-accordion-content" hidden><p>Opening this closes the first.</p></div>
    </li>
  </ul>
</z-accordion>
```

## Heading wrappers & disabled items

For WAI-ARIA accordion semantics, you may wrap `.z-accordion-title` inside a heading (`<h1>`–`<h6>`, `<header>`, or `<div>`). Add `.z-disabled` on the item or trigger (or `disabled` on a `<button>`) to disable an item and exclude it from keyboard navigation.

```html
<z-accordion>
  <div class="z-accordion">
    <div class="z-open">
      <h3>
        <button class="z-accordion-title" type="button">Semantic Heading Trigger</button>
      </h3>
      <div class="z-accordion-content">
        <p>Heading wrapper is detected automatically.</p>
      </div>
    </div>
    <div class="z-disabled">
      <h3>
        <button class="z-accordion-title" type="button" disabled>Disabled Item</button>
      </h3>
      <div class="z-accordion-content" hidden>
        <p>Cannot be toggled.</p>
      </div>
    </div>
  </div>
</z-accordion>
```

## Icons

Place `.z-accordion-icon` (using `<z-icon>` or an inline `<svg>`) inside `.z-accordion-title` for zero-CLS rendering on frame 0. Kit CSS rotates `.z-accordion-icon` automatically when `.z-open` or `aria-expanded="true"` is active.

```html
<z-accordion>
  <ul class="z-accordion">
    <li>
      <button class="z-accordion-title" type="button">
        <span>With Chevron Icon</span>
        <z-icon class="z-accordion-icon" icon="chevron-down"></z-icon>
      </button>
      <div class="z-accordion-content" hidden><p>Rotates smoothly on toggle.</p></div>
    </li>
  </ul>
</z-accordion>
```

## Collapsible navigation (`.z-nav`)

`<z-accordion>` also drives collapsible `.z-nav` sidebar parent menus (`.z-parent` + `.z-nav-sub`):

```html
<z-accordion>
  <ul class="z-nav z-nav-default">
    <li class="z-parent z-open">
      <a href="#">
        <span>Getting Started</span>
        <z-icon class="z-nav-parent-icon" icon="chevron-down"></z-icon>
      </a>
      <ul class="z-nav-sub">
        <li class="z-active"><a href="#install">Installation</a></li>
        <li><a href="#tokens">Design Tokens</a></li>
      </ul>
    </li>
    <li class="z-parent">
      <a href="#">
        <span>Components</span>
        <z-icon class="z-nav-parent-icon" icon="chevron-down"></z-icon>
      </a>
      <ul class="z-nav-sub" hidden>
        <li><a href="#dialog">Dialog</a></li>
        <li><a href="#accordion">Accordion</a></li>
      </ul>
    </li>
  </ul>
</z-accordion>
```

## Deferred `<template>` panels & programmatic controls

Active panels should render live HTML so there is zero CLS on frame 0. For heavy **inactive** panels, wrap the inner markup in `<template data-fn="template">` — `<z-accordion>` unwraps it once on first open and dispatches `z-accordion:mount`.

Inside or alongside `<z-accordion>`, elements with `data-accordion-item` (`"open-all"`, `"close-all"`, `"next"`, `"previous"`, a 0-based index, or a `data-value`) trigger state changes declaratively.

```html
<z-accordion multiple>
  <div class="display-flex gap mb" style="--gap: 2; --mb: 3">
    <button
      class="z-button z-button-default z-button-sm"
      data-accordion-item="open-all"
      type="button"
    >
      Open All
    </button>
    <button
      class="z-button z-button-default z-button-sm"
      data-accordion-item="close-all"
      type="button"
    >
      Close All
    </button>
  </div>
  <ul class="z-accordion">
    <li>
      <button class="z-accordion-title" type="button">Deferred Content</button>
      <div class="z-accordion-content" hidden>
        <template data-fn="template">
          <p>Mounted lazily on first expand.</p>
        </template>
      </div>
    </li>
  </ul>
</z-accordion>
```

## Component attributes

| Attribute        | Value   | Default | Description                                                                         |
| ---------------- | ------- | ------- | ----------------------------------------------------------------------------------- |
| `multiple`       | Boolean | `false` | Allows multiple items to be open at the same time.                                  |
| `no-collapsible` | Boolean | `false` | Prevents closing the last remaining open item.                                      |
| `active`         | String  | `""`    | Comma/space-separated 0-based index(es) or `data-value`(s) (`"-1"` for all closed). |
| `duration`       | Number  | `150`   | Expand/collapse transition duration in milliseconds.                                |
| `no-animation`   | Boolean | `false` | Disables the expand/collapse animation.                                             |
| `targets`        | String  | `""`    | Custom item selector scoped to the container.                                       |
| `trigger`        | String  | `""`    | Custom trigger selector scoped to each item.                                        |
| `content`        | String  | `""`    | Custom content panel selector scoped to each item.                                  |

## CSS custom properties

Customize `.z-accordion` via Tier-2 variables (inline, via `stl`, or in CSS):

| Variable                     | Default                               | Description                                      |
| ---------------------------- | ------------------------------------- | ------------------------------------------------ |
| `--z-accordion-border`       | `var(--z-border)`                     | Item divider border base color.                  |
| `--z-accordion-border-o`     | `var(--z-border-o)`                   | Item divider border opacity percentage.          |
| `--z-accordion-border-w`     | `0 0 1px 0`                           | Item divider border width.                       |
| `--z-accordion-border-style` | `solid`                               | Item divider border style.                       |
| `--z-accordion-transition`   | `150ms cubic-bezier(0.16, 1, 0.3, 1)` | Transition curve and duration for icon rotation. |

## JavaScript

### Events

All events bubble from `<z-accordion>` (`composed: true`):

| Name                      | Cancelable | Detail / Description                                                                                      |
| ------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `z-accordion:before-show` | Yes        | Fires before an item opens. Detail: `{ index, item, trigger, content, value }`. Call `preventDefault()`.  |
| `z-accordion:show`        | No         | Fires when an item begins opening. Detail: `{ index, item, trigger, content, value }`.                    |
| `z-accordion:shown`       | No         | Fires after an item open transition finishes. Detail: `{ index, item, trigger, content, value }`.         |
| `z-accordion:before-hide` | Yes        | Fires before an item closes. Detail: `{ index, item, trigger, content, value }`. Call `preventDefault()`. |
| `z-accordion:hide`        | No         | Fires when an item begins closing. Detail: `{ index, item, trigger, content, value }`.                    |
| `z-accordion:hidden`      | No         | Fires after an item close transition finishes. Detail: `{ index, item, trigger, content, value }`.        |
| `z-accordion:change`      | No         | Fires when open state changes. Detail: `{ activeIndices, index, open, item, trigger, content, value }`.   |
| `z-accordion:mount`       | No         | Fires when a deferred `<template>` inside a panel is unwrapped. Detail: `{ index, item, content }`.       |

### Methods

```javascript
const accordion = document.getElementById('my-accordion');
await accordion.toggle(1); // toggle item index 1 (accepts index, id, href, or data-value)
await accordion.open(0); // open item index 0
await accordion.close(0, false); // close immediately without animation
await accordion.openAll(); // open all enabled items (when multiple is enabled)
await accordion.closeAll(); // close open items (respects no-collapsible)
accordion.activeIndices(); // e.g. [0, 2]
accordion.refresh(); // re-scan dynamically added/removed items
```

## Accessibility

- Wires `aria-expanded`, `aria-controls`, `aria-labelledby`, `role="button"` (for non-`<button>` triggers), `role="region"` (for non-list panels), and `aria-disabled="true"` (for disabled items or the locked open header in `no-collapsible` mode).
- Auto-injected icons carry `aria-hidden="true"`.
- Supports <kbd>↑</kbd> / <kbd>↓</kbd> to move focus between enabled accordion headers, <kbd>Home</kbd> / <kbd>End</kbd> to jump to first/last enabled header, and <kbd>Enter</kbd> / <kbd>Space</kbd> to toggle.
