# Slideshow

## Usage

The Slideshow component (`<z-slideshow>`) is an **in-flow scoped controller** for stacked, single-slide hero and media decks over `.z-slideshow-items`.

Unlike out-of-flow overlays (`<z-dialog>`, `<z-drawer>`), `<z-slideshow>` wraps **live HTML directly** (`noChange` render) and locks aspect ratio in CSS on frame 0 so the initial `.z-active` slide paints immediately with **zero CLS**.

```html
<z-slideshow animation="slide" ratio="16:9">
  <div class="z-position-relative">
    <ul class="z-slideshow-items z-rounded">
      <li class="z-active">
        <img src="/images/slide-1.jpg" alt="First slide" data-z-cover />
      </li>
      <li>
        <img src="/images/slide-2.jpg" alt="Second slide" data-z-cover />
      </li>
      <li>
        <img src="/images/slide-3.jpg" alt="Third slide" data-z-cover />
      </li>
    </ul>

    <button
      class="z-slidenav z-slidenav-previous z-position-center-left z-position-small"
      data-slideshow-item="previous"
      type="button"
      aria-label="Previous slide"
    >
      <z-icon icon="chevron-left"></z-icon>
    </button>
    <button
      class="z-slidenav z-slidenav-next z-position-center-right z-position-small"
      data-slideshow-item="next"
      type="button"
      aria-label="Next slide"
    >
      <z-icon icon="chevron-right"></z-icon>
    </button>
  </div>

  <ul class="z-slideshow-nav z-dotnav justify-center mt" style="--mt: 4"></ul>
</z-slideshow>
```

## Animations & caption transitions

Set `animation` to `"slide"` (default), `"fade"`, `"scale"`, `"pull"`, or `"push"`. All deck transitions run smoothly via compositor properties (`transform`, `opacity`, `z-index`) and support 1:1 pointer and touch drag scrubbing.

When a slide finishes entering, `<z-slideshow>` applies `.z-transition-active` alongside `.z-active` so Kit CSS `.z-transition-*` overlays animate automatically:

```html
<z-slideshow animation="pull">
  <div class="z-position-relative">
    <ul class="z-slideshow-items">
      <li class="z-active">
        <img src="/images/hero-1.jpg" alt="Hero 1" data-z-cover />
        <div class="z-position-bottom z-position-small z-text-center">
          <div class="z-transition-slide-bottom-small z-card z-card-body">
            <h3>Animated Caption</h3>
            <p>Reveals automatically when the slide settles.</p>
          </div>
        </div>
      </li>
      <li>
        <img src="/images/hero-2.jpg" alt="Hero 2" data-z-cover />
      </li>
    </ul>
  </div>
</z-slideshow>
```

## Aspect ratio & height bounds

- **`ratio`**: Defaults to `"16:9"`, mapping to `--z-slideshow-ratio` / CSS `aspect-ratio` on `.z-slideshow-items`. Pass `"false"` or `"none"` to opt out of fixed aspect ratio (for example, when driving height strictly via `min-height` / `max-height` or custom CSS).
- **`min-height` / `max-height`**: Constrain deck height across viewports (numeric values default to `px`, or pass any CSS length like `"24rem"` or `"70dvh"`).

```html
<z-slideshow ratio="21:9" min-height="260" max-height="70dvh">
  <ul class="z-slideshow-items">
    <li class="z-active"><img src="/images/wide-1.jpg" alt="Wide 1" data-z-cover /></li>
    <li><img src="/images/wide-2.jpg" alt="Wide 2" data-z-cover /></li>
  </ul>
</z-slideshow>
```

## Thumbnail navigation (`.z-thumbnav`)

Author custom thumbnail buttons inside `.z-slideshow-nav.z-thumbnav` (using `<button type="button">` or `<a href="#">`). `<z-slideshow>` preserves your thumbnail markup, binds `data-slideshow-item` indices automatically if omitted, and syncs `.z-active` + keyboard navigation.

```html
<z-slideshow animation="fade">
  <ul class="z-slideshow-items">
    <li class="z-active"><img src="/images/photo-1.jpg" alt="Photo 1" data-z-cover /></li>
    <li><img src="/images/photo-2.jpg" alt="Photo 2" data-z-cover /></li>
    <li><img src="/images/photo-3.jpg" alt="Photo 3" data-z-cover /></li>
  </ul>

  <ul class="z-slideshow-nav z-thumbnav mt" style="--mt: 3">
    <li class="z-active" data-slideshow-item="0">
      <button type="button"><img src="/images/thumb-1.jpg" width="80" alt="Photo 1" /></button>
    </li>
    <li data-slideshow-item="1">
      <button type="button"><img src="/images/thumb-2.jpg" width="80" alt="Photo 2" /></button>
    </li>
    <li data-slideshow-item="2">
      <button type="button"><img src="/images/thumb-3.jpg" width="80" alt="Photo 3" /></button>
    </li>
  </ul>
</z-slideshow>
```

## Autoplay, video handling & deferred slides

- **Autoplay**: Add `autoplay` and `autoplay-interval="6000"` (ms). Pauses on hover (unless `no-pause-on-hover` is set), focus within, or hidden tab.
- **Video slides**: Inactive `<video>` elements inside slides are paused automatically when switching away (add `data-keep-playing` to opt out); `<video autoplay>` / `<video data-autoplay>` resumes when its slide becomes active.
- **Deferred `<template>` slides**: Wrap heavy inactive slide bodies in `<template data-fn="template">` to mount them lazily on first activation (`z-slideshow:mount`).

## Component attributes

| Attribute           | Value                                              | Default                                  | Description                                                                |
| ------------------- | -------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `active`            | Number                                             | `-1`                                     | 0-based active slide index (auto-detects `.z-active` or `0` when omitted). |
| `animation`         | `'slide' \| 'fade' \| 'scale' \| 'pull' \| 'push'` | `'slide'`                                | Deck transition style.                                                     |
| `ratio`             | String                                             | `'16:9'`                                 | Aspect ratio (`"16:9"`, `"4:3"`, or `"false"` / `"none"` for `auto`).      |
| `min-height`        | String                                             | `""`                                     | Minimum height on `.z-slideshow-items` (px number or CSS length).          |
| `max-height`        | String                                             | `""`                                     | Maximum height on `.z-slideshow-items` (px number or CSS length).          |
| `finite`            | Boolean                                            | `false`                                  | Disable looping and clamp at first/last slide boundaries.                  |
| `autoplay`          | Boolean                                            | `false`                                  | Automatically advance slides on an interval.                               |
| `autoplay-interval` | Number (ms)                                        | `7000`                                   | Delay between automatic slide advances.                                    |
| `no-pause-on-hover` | Boolean                                            | `false`                                  | Keep autoplay running while the pointer hovers over `<z-slideshow>`.       |
| `no-drag`           | Boolean                                            | `false`                                  | Disable interactive pointer/touch drag scrubbing.                          |
| `duration`          | Number (ms)                                        | `0` (`450` computed)                     | Override transition duration in milliseconds.                              |
| `velocity`          | Number                                             | `1`                                      | Speed multiplier when `duration` is not explicitly set.                    |
| `easing`            | String                                             | `'cubic-bezier(0.25, 0.46, 0.45, 0.94)'` | Timing function (`linear`, `ease`, `ease-out`, or `cubic-bezier(...)`).    |

## JavaScript

### Events

All events bubble from `<z-slideshow>` (`composed: true`):

| Name                        | Cancelable | Detail / Description                                                                                 |
| --------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `z-slideshow:before-change` | Yes        | Fires before switching slides. Detail: `{ index, previousIndex, slide, previousSlide, value, dir }`. |
| `z-slideshow:before-show`   | Yes        | Fires before showing the target slide. Call `preventDefault()` to cancel.                            |
| `z-slideshow:before-hide`   | Yes        | Fires before hiding the previous slide. Call `preventDefault()` to cancel.                           |
| `z-slideshow:show`          | No         | Fires when transition to target slide starts.                                                        |
| `z-slideshow:hide`          | No         | Fires when leaving previous slide starts.                                                            |
| `z-slideshow:change`        | No         | Fires when active index updates.                                                                     |
| `z-slideshow:shown`         | No         | Fires after transition finishes and `.z-transition-active` is applied.                               |
| `z-slideshow:hidden`        | No         | Fires after the previous slide is deactivated.                                                       |
| `z-slideshow:mount`         | No         | Fires when a deferred `<template>` inside a slide is unwrapped. Detail: `{ index, slide }`.          |

### Methods

```javascript
const slideshow = document.getElementById('my-slideshow');
await slideshow.show(1); // transition to slide index 1
await slideshow.next(); // transition to next slide
await slideshow.previous(false); // switch immediately without animation
slideshow.index(); // current 0-based active index
slideshow.count(); // total number of slides
slideshow.startAutoplay(); // start autoplay (requires autoplay attribute/property)
slideshow.stopAutoplay(); // pause autoplay
slideshow.refresh(); // re-scan dynamically added/removed slides
```

## Accessibility

- Sets `role="region"` and `aria-roledescription="carousel"` on `<z-slideshow>`, `aria-live` (`"polite"` or `"off"` during autoplay) on `.z-slideshow-items`, and `aria-hidden` on inactive slides.
- Dotnav and thumbnav lists use `role="tablist"` / `role="tab"` (with `aria-orientation="vertical"` for `.z-dotnav-vertical` / `.z-thumbnav-vertical`), roving `tabindex`, and arrow-key navigation (RTL-aware).
- Respects `prefers-reduced-motion: reduce` by completing transitions immediately without motion.
