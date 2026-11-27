# Sticky

## Usage

The Sticky component (`<z-sticky>`) is an **in-flow sticky wrapper** over live HTML with **zero CLS**. `<z-sticky>` itself acts as the sticky container — no extra inner wrapper is required.

By default, `<z-sticky>` uses a native `position: sticky` fast-path inside CSS Grid and Flexbox columns (updating `top` dynamically via `ResizeObserver` and passive scroll listeners without injecting extra placeholder nodes). When escaping parent bounds (`end="false"`), using delayed `start`, `show-on-up`, `animation`, or `position="bottom"`, it automatically switches to `position: fixed` with a `.z-sticky-placeholder` slot.

```html
<z-sticky offset="16">
  <div class="z-card z-card-body">Sticks 16px from the top within its parent container.</div>
</z-sticky>
```

## Offset & dynamic selector offsets

The `offset` attribute accepts plain pixel numbers (`"80"`), CSS length units (`"1.5rem"`, `"10vh"`), or CSS selectors to match the live height of another element (such as a fixed header). You can also add or subtract an offset (`"#main-navbar + 16px"`), and use `!<selector>` to target the closest matching ancestor.

```html
<!-- Match a sticky navbar height plus 16px breathing room -->
<z-sticky offset="#main-navbar + 16px">
  <aside class="z-card z-card-body">Always clears #main-navbar cleanly.</aside>
</z-sticky>
```

## Bi-directional tall sidebar rails

When a sticky sidebar or table of contents is taller than the viewport (`100vh`), `<z-sticky>` scrolls naturally on downward scroll until its bottom edge reaches `offset-end`, then immediately unpins and scrolls back up on upward scroll until its top edge reaches `offset`.

Set `overflow-flip` if you prefer flipping a tall element directly to the opposite viewport edge instead of bi-directional scrolling.

```html
<div class="display-grid md:grid-cols gap" style="--md-grid-cols: 4; --gap: 6">
  <z-sticky offset="24" offset-end="24">
    <nav class="z-card z-card-body">
      <!-- Tall sidebar navigation exceeding 100vh -->
    </nav>
  </z-sticky>
  <main class="md:col-span" style="--md-col-span: 3">
    <!-- Long article content -->
  </main>
</div>
```

## Start & end boundaries

- **Parent bounds (default)**: `<z-sticky>` remains pinned until it reaches the bottom of its parent container (minus parent padding/border).
- **Escape parent bounds (`end="false"`)**: Allows the sticky element to stay pinned for the entire document scroll height.
- **Custom selectors & offsets**: Pass a selector (e.g. `start="#hero"`, `end="#article-body"`) or pixel/unit distance (`start="200"`).

```html
<!-- Sticky header that escapes its wrapper and stays pinned down the page -->
<z-sticky end="false">
  <header class="z-card z-card-body">Global Sticky Bar</header>
</z-sticky>

<!-- Start sticking after #hero scrolls out, and unpin at the end of #article-body -->
<z-sticky start="#hero" end="#article-body" offset="16">
  <aside class="z-card z-card-body">Article TOC</aside>
</z-sticky>
```

## Show on scroll up & animations

Add `show-on-up` so a sticky navbar hides while scrolling down and reveals smoothly when the user scrolls back up (with scroll-delta hysteresis to prevent jitter). Combine with `animation` (`"fade"`, `"scale"`, `"slide-top"`, `"slide-bottom"`, or any `.z-animation-*` class) and `duration` (default `150` ms).

```html
<z-sticky end="false" show-on-up animation="slide-top" duration="150">
  <nav class="z-card z-card-body">Reveals on upward scroll</nav>
</z-sticky>
```

## Responsive breakpoint gating (`media`) & anchor offset (`target-offset`)

- **`media`**: Only activate sticky behavior when the viewport matches a breakpoint (`sm`, `md`, `lg`, `xl`, `2xl`, pixel width like `768`, or a CSS media query).
- **`target-offset`**: Automatically scrolls past the sticky bar height when navigating to `#hash` anchor links (optionally specify extra padding such as `target-offset="16"`).

```html
<z-sticky media="lg" offset="24" target-offset="16">
  <nav class="z-card z-card-body">Sticky on desktop (>= 64rem) with anchor compensation.</nav>
</z-sticky>
```

## Component attributes

| Attribute       | Value               | Default            | Description                                                                                           |
| --------------- | ------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `position`      | `'top' \| 'bottom'` | `'top'`            | Viewport edge to pin against.                                                                         |
| `offset`        | String              | `'0'`              | Top (or bottom) offset in px, CSS units, or selector height (e.g. `#navbar + 16px`).                  |
| `offset-end`    | String              | `'0'`              | Bottom viewport clearance for tall bi-directional rails.                                              |
| `start`         | String              | `""`               | Start boundary (`""` natural position, px/unit offset, `'true'` parent, or CSS selector).             |
| `end`           | String              | `""`               | End boundary (`""`/`'true'` parent bottom, `'false'` full page, px/unit, or CSS selector).            |
| `show-on-up`    | Boolean             | `false`            | Only show fixed bar when scrolling upward (below its natural position).                               |
| `overflow-flip` | Boolean             | `false`            | Flip sticky alignment to opposite edge instead of bi-directional scrolling when taller than viewport. |
| `animation`     | String              | `""`               | Entrance/leave preset (`fade`, `scale`, `slide-top`, `slide-bottom`) or `.z-animation-*` class.       |
| `duration`      | Number (ms)         | `150`              | Animation duration in milliseconds.                                                                   |
| `media`         | String              | `""`               | Breakpoint (`sm`, `md`, `lg`, `xl`, `2xl`, px width, or media query) required to stick.               |
| `target-offset` | String              | `""`               | Enables `#hash` anchor scroll compensation (with optional extra px/unit padding).                     |
| `sel-target`    | String              | `""`               | Optional inner element selector that receives `cls-active` / `cls-inactive`.                          |
| `cls-active`    | String              | `'z-active'`       | Class(es) applied when sticky is active.                                                              |
| `cls-inactive`  | String              | `""`               | Class(es) applied when sticky is inactive.                                                            |
| `cls-fixed`     | String              | `'z-sticky-fixed'` | Class(es) applied while in fixed positioning mode.                                                    |
| `cls-below`     | String              | `'z-sticky-below'` | Class(es) applied when scroll position is below the element's natural bottom edge.                    |

## JavaScript

### Events

All events bubble from `<z-sticky>` (`composed: true`):

| Name                | Cancelable | Detail / Description                                                                               |
| ------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `z-sticky:active`   | No         | Fires when the element enters its active sticky state. Detail: `{ fixed, below, scroll, target }`. |
| `z-sticky:inactive` | No         | Fires when the element leaves its active sticky state. Detail: `{ fixed, below, scroll, target }`. |
| `z-sticky:change`   | No         | Fires whenever active state changes. Detail: `{ active, fixed, below, scroll, target }`.           |

### Methods

```javascript
const sticky = document.getElementById('my-sticky');
sticky.isActive(); // true when currently active/stuck
sticky.isFixed(); // true when using position: fixed mode
sticky.isBelow(); // true when scrolled past natural bottom edge
sticky.refresh(); // recalculate boundaries and sync scroll position
```
