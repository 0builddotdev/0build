import { cleanEmptyStyle, prefersReducedMotion } from '$js/shared/base';

const NAMED_EASINGS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

const ANIMATION_PRESETS: Record<string, string> = {
  fade: 'z-animation-fade',
  scale: 'z-animation-scale-up',
  'scale-up': 'z-animation-scale-up',
  'scale-down': 'z-animation-scale-down',
  'slide-top': 'z-animation-slide-top',
  'slide-bottom': 'z-animation-slide-bottom',
  'slide-left': 'z-animation-slide-left',
  'slide-right': 'z-animation-slide-right',
  'slide-top-small': 'z-animation-slide-top-small',
  'slide-bottom-small': 'z-animation-slide-bottom-small',
  'slide-left-small': 'z-animation-slide-left-small',
  'slide-right-small': 'z-animation-slide-right-small',
  'slide-top-medium': 'z-animation-slide-top-medium',
  'slide-bottom-medium': 'z-animation-slide-bottom-medium',
  'slide-left-medium': 'z-animation-slide-left-medium',
  'slide-right-medium': 'z-animation-slide-right-medium',
};

const SMALL_DIRECTIONAL_PRESETS: Record<string, string> = {
  slide: 'z-animation-slide-right-small, z-animation-slide-left-small',
  'slide-left': 'z-animation-slide-left-small',
  'slide-right': 'z-animation-slide-right-small',
  'slide-top': 'z-animation-slide-top-small',
  'slide-bottom': 'z-animation-slide-bottom-small',
};

export function clampNumber(value: number, min: number, max: number): number {
  return max < min ? min : Math.min(Math.max(value, min), max);
}

function bezierAt(p1: number, p2: number, t: number): number {
  const a = 1 - 3 * p2 + 3 * p1;
  const b = 3 * p2 - 6 * p1;
  const c = 3 * p1;

  return ((a * t + b) * t + c) * t;
}

function solveCubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  let lo = 0;
  let hi = 1;
  let t = x;

  for (let i = 0; i < 6; i++) {
    const err = bezierAt(x1, x2, t) - x;

    if (Math.abs(err) < 1e-5) {
      return bezierAt(y1, y2, t);
    }

    const deriv = ((3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1);

    if (Math.abs(deriv) < 1e-6) {
      break;
    }

    t = clampNumber(t - err / deriv, 0, 1);
  }

  t = x;

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) * 0.5;
    const val = bezierAt(x1, x2, mid);

    t = mid;

    if (Math.abs(val - x) < 1e-5) {
      break;
    }

    if (val < x) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return bezierAt(y1, y2, t);
}

export function evaluateEasing(easing: string, t: number): number {
  const clamped = clampNumber(t, 0, 1);

  if (clamped === 0 || clamped === 1) {
    return clamped;
  }

  const normalized = easing.trim().toLowerCase();

  if (normalized === 'linear') {
    return clamped;
  }

  const named = NAMED_EASINGS[normalized];

  if (named) {
    return solveCubicBezier(named[0], named[1], named[2], named[3], clamped);
  }

  const match = /^cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)$/.exec(normalized);

  if (match) {
    const x1 = Number.parseFloat(match[1]);
    const y1 = Number.parseFloat(match[2]);
    const x2 = Number.parseFloat(match[3]);
    const y2 = Number.parseFloat(match[4]);

    if (Number.isFinite(x1) && Number.isFinite(y1) && Number.isFinite(x2) && Number.isFinite(y2)) {
      return solveCubicBezier(clampNumber(x1, 0, 1), y1, clampNumber(x2, 0, 1), y2, clamped);
    }
  }

  return solveCubicBezier(0.16, 1, 0.3, 1, clamped);
}

export function resolveAnimationPreset(
  token: string,
  smallDirectionalSlides: boolean = false,
): string {
  if (smallDirectionalSlides && token in SMALL_DIRECTIONAL_PRESETS) {
    return SMALL_DIRECTIONAL_PRESETS[token];
  }

  return ANIMATION_PRESETS[token] ?? token;
}

export interface CssAnimationOptions {
  duration?: number;
  easing?: string;
  reverse?: boolean;
  fallbackTimeoutMs?: number;
  onFinish?: () => void;
  onCleanup?: () => void;
}

export function runCssAnimation(
  el: HTMLElement,
  classes: readonly string[],
  options: CssAnimationOptions = {},
): (() => void) | null {
  const { duration, easing, reverse = false, fallbackTimeoutMs = 800, onFinish, onCleanup } = options;

  if (classes.length === 0 || duration === 0 || prefersReducedMotion()) {
    onFinish?.();

    return null;
  }

  if (reverse) {
    el.classList.remove(...classes, 'z-animation-reverse');
    void el.offsetWidth;
  }

  const applied = reverse ? [...classes, 'z-animation-reverse'] : classes;
  const hasDuration = duration !== undefined && duration > 0;
  const prevDuration = el.style.animationDuration;
  const prevTiming = el.style.animationTimingFunction;

  if (hasDuration) {
    el.style.animationDuration = `${duration}ms`;
  }

  if (easing) {
    el.style.animationTimingFunction = easing;
  }

  el.classList.add(...applied);

  let finished = false;
  let timer: number | null = null;

  const cleanup = (triggerCallback: boolean) => {
    if (finished) {
      return;
    }

    finished = true;
    el.removeEventListener('animationend', handleAnimationEnd);
    el.removeEventListener('animationcancel', handleAnimationEnd);

    if (timer !== null && typeof window !== 'undefined') {
      window.clearTimeout(timer);
    }

    el.classList.remove(...applied);

    if (hasDuration) {
      el.style.animationDuration = prevDuration;
    }

    if (easing) {
      el.style.animationTimingFunction = prevTiming;
    }

    cleanEmptyStyle(el);
    onCleanup?.();

    if (triggerCallback) {
      onFinish?.();
    }
  };

  const handleAnimationEnd = (event: AnimationEvent) => {
    if (event.target === el) {
      cleanup(true);
    }
  };

  if (typeof window !== 'undefined') {
    const timeoutMs = (hasDuration ? duration : fallbackTimeoutMs) + 50;

    timer = window.setTimeout(() => cleanup(true), timeoutMs);
  }

  el.addEventListener('animationend', handleAnimationEnd);
  el.addEventListener('animationcancel', handleAnimationEnd);

  return () => cleanup(false);
}

export function readCollapseMetrics(el: HTMLElement, includeBorder: boolean = false): Keyframe {
  const cs = window.getComputedStyle(el);
  const parsedOpacity = Number.parseFloat(cs.opacity);
  const frame: Keyframe = {
    height: `${el.getBoundingClientRect().height}px`,
    paddingTop: cs.paddingTop,
    paddingBottom: cs.paddingBottom,
    marginTop: cs.marginTop,
    marginBottom: cs.marginBottom,
    opacity: Number.isFinite(parsedOpacity) ? parsedOpacity : 1,
  };

  if (includeBorder) {
    frame.borderTopWidth = cs.borderTopWidth;
    frame.borderBottomWidth = cs.borderBottomWidth;
  }

  return frame;
}

export function zeroCollapseFrame(includeBorder: boolean = false): Keyframe {
  const frame: Keyframe = {
    height: '0px',
    paddingTop: '0px',
    paddingBottom: '0px',
    marginTop: '0px',
    marginBottom: '0px',
    opacity: 0,
  };

  if (includeBorder) {
    frame.borderTopWidth = '0px';
    frame.borderBottomWidth = '0px';
  }

  return frame;
}
