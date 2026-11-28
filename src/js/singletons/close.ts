import { hasClasses, prefersReducedMotion, toggleClasses } from '$js/shared/base';
import { parseAttrObject } from '$js/shared/helpers/options';
import { readCollapseMetrics, zeroCollapseFrame } from '$js/shared/helpers/animation';

export interface ZCloseOptions {
  animation?: boolean;
  duration?: number;
}

export interface ParsedCloseAttr {
  targetSelector: string;
  animation: boolean;
  duration: number;
}

export interface ParsedToggleAttr {
  targetSelector: string;
  cls: string;
}

const DEFAULT_DISMISS_DURATION_MS = 150;
const KNOWN_CLOSE_KEYS = new Set(['target', 'animation', 'duration']);
const KNOWN_TOGGLE_KEYS = new Set(['target', 'cls']);
const SIMPLE_ID_SELECTOR = /^#[A-Za-z0-9_-]+$/;

const dismissingElements = new WeakSet<HTMLElement>();

export function parseCloseAttr(raw: string): ParsedCloseAttr {
  const trimmed = raw.trim();
  const parsed = parseAttrObject(trimmed, KNOWN_CLOSE_KEYS);

  if (!parsed) {
    return {
      targetSelector: trimmed,
      animation: true,
      duration: DEFAULT_DISMISS_DURATION_MS,
    };
  }

  const parsedDuration = Number(parsed.duration);

  return {
    targetSelector: typeof parsed.target === 'string' ? parsed.target.trim() : '',
    animation: parsed.animation !== false && parsed.animation !== 'false',
    duration:
      parsed.duration !== undefined && Number.isFinite(parsedDuration)
        ? Math.max(0, parsedDuration)
        : DEFAULT_DISMISS_DURATION_MS,
  };
}

export function parseToggleAttr(raw: string): ParsedToggleAttr {
  const trimmed = raw.trim();
  const parsed = parseAttrObject(trimmed, KNOWN_TOGGLE_KEYS);

  if (!parsed) {
    return {
      targetSelector: trimmed,
      cls: '',
    };
  }

  return {
    targetSelector: typeof parsed.target === 'string' ? parsed.target.trim() : '',
    cls: typeof parsed.cls === 'string' ? parsed.cls.trim() : '',
  };
}

export function resolvePlainDomTargets(
  selector: string,
  trigger: HTMLElement,
  fallbackSelf: boolean,
): HTMLElement[] {
  const trimmed = selector.trim();

  if (!trimmed) {
    const href = trigger.getAttribute('href')?.trim() ?? '';

    if (href.startsWith('#') && href.length > 1) {
      const byHref = document.getElementById(href.slice(1));

      return byHref ? [byHref] : [];
    }

    return fallbackSelf ? [trigger] : [];
  }

  if (SIMPLE_ID_SELECTOR.test(trimmed)) {
    const byId = document.getElementById(trimmed.slice(1));

    return byId ? [byId] : [];
  }

  const directId = document.getElementById(trimmed);

  if (directId) {
    return [directId];
  }

  try {
    return Array.from(document.querySelectorAll<HTMLElement>(trimmed));
  } catch {
    return [];
  }
}

export async function dismissElement(
  target: HTMLElement,
  trigger?: HTMLElement | null,
  options?: ZCloseOptions,
): Promise<boolean> {
  if (!target.isConnected || dismissingElements.has(target)) {
    return false;
  }

  const detail = { target, trigger: trigger ?? null };
  const beforeClose = new CustomEvent('z-close:before', {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail,
  });

  target.dispatchEvent(beforeClose);

  if (beforeClose.defaultPrevented) {
    return false;
  }

  const isAlert = target.classList.contains('z-alert');

  if (isAlert) {
    const beforeAlertHide = new CustomEvent('z-alert:before-hide', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });

    target.dispatchEvent(beforeAlertHide);

    if (beforeAlertHide.defaultPrevented) {
      return false;
    }
  }

  dismissingElements.add(target);

  const shouldAnimate = options?.animation !== false && !prefersReducedMotion();
  const duration = options?.duration ?? DEFAULT_DISMISS_DURATION_MS;

  if (shouldAnimate && duration > 0 && target.offsetHeight > 0) {
    target.style.overflow = 'hidden';

    const animation = target.animate([readCollapseMetrics(target, true), zeroCollapseFrame(true)], {
      duration,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
    });

    await animation.finished.catch(() => undefined);
  }

  target.hidden = true;

  if (isAlert) {
    target.dispatchEvent(
      new CustomEvent('z-alert:hide', {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  target.dispatchEvent(
    new CustomEvent('z-close:after', {
      bubbles: true,
      composed: true,
      detail,
    }),
  );

  target.remove();

  return true;
}

export function togglePlainElements(
  targets: HTMLElement[],
  trigger: HTMLElement,
  cls: string,
  forceOpen: boolean = false,
): void {
  const hasCls = Boolean(cls && cls !== 'false' && cls.trim());
  let lastOpen: boolean | null = null;

  for (const el of targets) {
    const isCurrentlyOpen = hasCls ? hasClasses(el, cls) : !el.hidden;
    const nextOpen = forceOpen ? true : !isCurrentlyOpen;

    if (forceOpen && isCurrentlyOpen) {
      lastOpen = true;
      continue;
    }

    const beforeEvent = new CustomEvent('z-toggle:before', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { target: el, trigger, open: nextOpen },
    });

    el.dispatchEvent(beforeEvent);

    if (beforeEvent.defaultPrevented) {
      continue;
    }

    if (hasCls) {
      toggleClasses(el, cls, nextOpen);
    } else {
      el.hidden = !nextOpen;
    }

    lastOpen = nextOpen;
    el.dispatchEvent(
      new CustomEvent('z-toggle:after', {
        bubbles: true,
        composed: true,
        detail: { target: el, trigger, open: nextOpen },
      }),
    );
  }

  if (lastOpen !== null && (!hasCls || trigger.hasAttribute('aria-expanded'))) {
    trigger.setAttribute('aria-expanded', String(lastOpen));
  }
}
