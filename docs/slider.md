# Slider

## Usage

The Slider component (`<z-slider>`) is an **in-flow scoped controller** for horizontal multi-column strips and card carousels over `.z-slider-items`.

Unlike out-of-flow overlays (`<z-dialog>`, `<z-drawer>`), `<z-slider>` wraps **live HTML directly** (`noChange` render) and builds on native CSS `scroll-snap` so slides paint accurately on frame 0 with **zero CLS**.

Place `.z-slider-items` inside `<z-slider>`, optionally alongside `.z-slidenav` previous/next buttons (using `<z-icon>` inside `.z-slidenav` for zero-CLS frame-0 icons) and an empty `<ul class="z-slider-nav z-dotnav"></ul>` (auto-populated with dot buttons when empty).

```html
<z-slider>
  <div class="z-position-relative">
    <div class="z-slider-container">
      <ul class="z-slider-items display-flex gap" style="--gap: 4">
        <li class="w=full sm:w=1/2 md:w=1/3">
          <div class="z-card z-card-body">Slide 1</div>
        </li>
        <li class="w=full sm:w=1/2 md:w=1/3">
          <div class="z-card z-card-body">Slide 2</div>
        </li>
        <li class="w=full sm:w=1/2 md:w=1/3">
          <div class="z-card z-card-body">Slide 3</div>
        </li>
        <li class="w=full sm:w=1/2 md:w=1/3">
          <div class="z-card z-card-body">Slide 4</div>
        </li>
      </ul>
    </div>

    <button
      class="z-slidenav z-slidenav-previous z-position-center-left z-position-small"
      data-slider-item="previous"
      type="button"
      aria-label="Previous slide"
    >
      <z-icon icon="chevron-left"></z-icon>
    </button>
    <button
      class="z-slidenav z-slidenav-next z-position-center-right z-position-small"
      data-slider-item="next"
      type="button"
      aria-label="Next slide"
    >
      <z-icon icon="chevron-right"></z-icon>
    </button>
  </div>

  <ul class="z-slider-nav z-dotnav justify-center mt" style="--mt: 4"></ul>
</z-slider>
```

## Responsive sets, center alignment & finite mode

- **`sets`**: Paginates by full visible viewport sets instead of single slides, updating dot indicators to one dot per set and re-evaluating automatically on resize via `ResizeObserver`.
- **`center`**: Aligns the active slide to the horizontal center of `.z-slider-items` (`scroll-snap-align: center`).
- **`finite`**: Disables seamless zero-clone infinite looping and hides/disables boundary `previous`/`next` controls (`.z-invisible`) when at the first or last valid stop.
- **`active-mode`**: Controls `.z-active` placement across slides (`"all"` marks every slide currently in view; `"first"` marks only the primary active index).

```html
<z-slider sets finite>
  <div class="z-slider-container">
    <ul class="z-slider-items">
      <li class="w=1/2 md:w=1/3"><div>Item 1</div></li>
      <li class="w=1/2 md:w=1/3"><div>Item 2</div></li>
      <li class="w=1/2 md:w=1/3"><div>Item 3</div></li>
      <li class="w=1/2 md:w=1/3"><div>Item 4</div></li>
      <li class="w=1/2 md:w=1/3"><div>Item 5</div></li>
    </ul>
  </div>
  <ul class="z-slider-nav z-dotnav justify-center mt" style="--mt: 4"></ul>
</z-slider>
```

## Autoplay, pointer drag & icons

- **Autoplay**: Add `autoplay` and customize timing with `autoplay-interval="5000"` (ms). Autoplay pauses automatically on hover (unless `no-pause-on-hover` is set), focus within the slider, or when the browser tab is hidden.
- **Native touch + desktop mouse drag**: Touch and trackpad gestures use native hardware-accelerated CSS `scroll-snap`; desktop mouse drag scrubs smoothly and snaps on release. Pass `no-drag` to disable mouse drag.
- **Icons**: Place `<z-icon icon="chevron-left"></z-icon>` / `<z-icon icon="chevron-right"></z-icon>` (or any custom `<z-icon>`) inside `.z-slidenav` controls for zero-CLS rendering on frame 0.

```html
<z-slider autoplay autoplay-interval="4000" center>
  <div class="z-position-relative">
    <div class="z-slider-container">
      <ul class="z-slider-items">
        <!-- slides -->
      </ul>
    </div>
    <button
      class="z-slidenav z-slidenav-previous z-position-center-left z-position-small"
      data-slider-item="previous"
      type="button"
      aria-label="Previous slide"
    >
      <z-icon icon="arrow-left"></z-icon>
    </button>
    <button
      class="z-slidenav z-slidenav-next z-position-center-right z-position-small"
      data-slider-item="next"
      type="button"
      aria-label="Next slide"
    >
      <z-icon icon="arrow-right"></z-icon>
    </button>
  </div>
</z-slider>
```

## Deferred `<template>` slides

Keep initially visible slides as live HTML for zero CLS. Heavy offscreen slides can wrap their inner markup inside `<template data-fn="template">` — `<z-slider>` unwraps it once when the slide enters view and emits `z-slider:mount`.

```html
<z-slider finite>
  <ul class="z-slider-items">
    <li class="z-active w=full"><div>Live Slide 1</div></li>
    <li class="w=full">
      <template data-fn="template">
        <div>Mounted lazily when scrolled or navigated into view.</div>
      </template>
    </li>
  </ul>
</z-slider>
```

## Component attributes

| Attribute           | Value              | Default                           | Description                                                                  |
| ------------------- | ------------------ | --------------------------------- | ---------------------------------------------------------------------------- |
| `active`            | Number             | `-1`                              | 0-based active slide index (auto-detects `.z-active` or `0` when omitted).   |
| `sets`              | Boolean            | `false`                           | Paginate by full visible sets instead of single slides.                      |
| `center`            | Boolean            | `false`                           | Center-align active slides within the viewport.                              |
| `finite`            | Boolean            | `false`                           | Disable infinite looping and clamp at start/end boundaries.                  |
| `active-mode`       | `'all' \| 'first'` | `'all'`                           | Whether `.z-active` applies to all visible slides or only the primary index. |
| `autoplay`          | Boolean            | `false`                           | Automatically advance slides on an interval.                                 |
| `autoplay-interval` | Number (ms)        | `7000`                            | Delay between automatic slide advances.                                      |
| `no-pause-on-hover` | Boolean            | `false`                           | Keep autoplay running while the pointer hovers over `<z-slider>`.            |
| `no-drag`           | Boolean            | `false`                           | Disable desktop mouse drag scrubbing.                                        |
| `duration`          | Number (ms)        | `0` (`350` computed)              | Override programmatic transition duration in milliseconds.                   |
| `velocity`          | Number             | `1`                               | Speed multiplier when `duration` is not explicitly set.                      |
| `easing`            | String             | `'cubic-bezier(0.16, 1, 0.3, 1)'` | Timing function (`linear`, `ease`, `ease-out`, or `cubic-bezier(...)`).      |

## JavaScript

### Events

All events bubble from `<z-slider>` (`composed: true`):

| Name                     | Cancelable | Detail / Description                                                                           |
| ------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `z-slider:before-change` | Yes        | Fires before navigating. Detail: `{ index, previousIndex, slide, previousSlide, value, dir }`. |
| `z-slider:before-show`   | Yes        | Fires before entering the target slide. Call `preventDefault()` to cancel.                     |
| `z-slider:before-hide`   | Yes        | Fires before leaving the previous slide. Call `preventDefault()` to cancel.                    |
| `z-slider:show`          | No         | Fires when transition to target slide starts.                                                  |
| `z-slider:hide`          | No         | Fires when leaving previous slide starts.                                                      |
| `z-slider:change`        | No         | Fires when active index updates (programmatically or via native scroll).                       |
| `z-slider:shown`         | No         | Fires after transition or user scroll settles on the active slide.                             |
| `z-slider:hidden`        | No         | Fires after leaving the previous slide settles.                                                |
| `z-slider:mount`         | No         | Fires when a deferred `<template>` inside a slide is unwrapped. Detail: `{ index, slide }`.    |

### Methods

```javascript
const slider = document.getElementById('my-slider');
await slider.show(2); // scroll smoothly to slide index 2
await slider.next(); // advance to next slide or set
await slider.previous(false); // jump immediately to previous slide or set
slider.index(); // current 0-based active index
slider.count(); // total number of slides
slider.startAutoplay(); // start autoplay (requires autoplay attribute/property)
slider.stopAutoplay(); // pause autoplay
slider.refresh(); // re-scan dynamically added/removed slides
```

## Accessibility

- Sets `role="region"` and `aria-roledescription="carousel"` on `<z-slider>`, `aria-live` (`"polite"` or `"off"` during autoplay) on `.z-slider-items`, and `role="tabpanel"` / `role="group"` + `aria-label` on slides.
- Offscreen slides are marked `aria-hidden="true"` and `inert` so keyboard focus skips hidden items.
- Dot navigation uses `role="tablist"` / `role="tab"` with roving `tabindex` and <kbd>←</kbd> / <kbd>→</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> keyboard navigation (RTL-aware).
