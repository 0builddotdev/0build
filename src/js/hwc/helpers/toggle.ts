import {
  dismissElement,
  parseCloseAttr,
  parseToggleAttr,
  resolvePlainDomTargets,
  togglePlainElements,
} from '../singletons/close';

export interface ToggleableElement extends HTMLElement {
  readonly openOnPointerDown?: boolean;
  show(trigger?: HTMLElement | null): Promise<void> | void;
  hide(restoreFocus?: boolean): Promise<void> | void;
  toggle(trigger?: HTMLElement | null): Promise<void> | void;
}

export interface ActiveDropEntry {
  readonly element: HTMLElement;
  readonly 'no-esc-close'?: boolean;
  getAnchorElement(): HTMLElement | null;
  containsNode(node: Node | null): boolean;
  hide(restoreFocus?: boolean): Promise<void> | void;
}

let isToggleListenerAttached = false;
let pointerDownTrigger: HTMLElement | null = null;
const activeDrops: ActiveDropEntry[] = [];

export function registerActiveDrop(entry: ActiveDropEntry): void {
  if (!activeDrops.includes(entry)) {
    activeDrops.push(entry);
  }
}

export function unregisterActiveDrop(entry: ActiveDropEntry): void {
  const index = activeDrops.indexOf(entry);

  if (index !== -1) {
    activeDrops.splice(index, 1);
  }
}

export function getActiveDrops(): readonly ActiveDropEntry[] {
  return activeDrops;
}

export function isToggleable(el: Element | null | undefined): el is ToggleableElement {
  if (!(el instanceof HTMLElement)) {
    return false;
  }

  const candidate = el as Partial<ToggleableElement>;

  return (
    typeof candidate.show === 'function' &&
    typeof candidate.hide === 'function' &&
    typeof candidate.toggle === 'function'
  );
}

export function resolveToggleTarget(selector: string): ToggleableElement | null {
  const trimmed = selector.trim();

  if (!trimmed) {
    return null;
  }

  let target: Element | null = null;

  if (trimmed.startsWith('#')) {
    target = document.getElementById(trimmed.slice(1));
  } else {
    target = document.getElementById(trimmed);

    if (!target) {
      try {
        target = document.querySelector(trimmed);
      } catch {
        target = null;
      }
    }
  }

  return isToggleable(target) ? target : null;
}

function findNearestCloseTarget(start: Element | null): ToggleableElement | HTMLElement | null {
  let current = start?.parentElement ?? null;

  while (current) {
    if (isToggleable(current)) {
      return current;
    }

    if (current.matches('.z-alert, [data-dismissible]')) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function handleDocumentPointerDown(event: PointerEvent): void {
  pointerDownTrigger = null;

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.pointerType === 'touch' ||
    !(event.target instanceof Element)
  ) {
    return;
  }

  const trigger = event.target.closest<HTMLElement>('[data-toggle], [data-open]');

  if (!trigger) {
    return;
  }

  const toggleSelector = trigger.getAttribute('data-toggle');

  if (toggleSelector !== null) {
    const spec = parseToggleAttr(toggleSelector);
    const target = spec.targetSelector ? resolveToggleTarget(spec.targetSelector) : null;

    if (target && !spec.cls && target.openOnPointerDown) {
      pointerDownTrigger = trigger;
      void target.toggle(trigger);
    }

    return;
  }

  const openSelector = trigger.getAttribute('data-open');

  if (openSelector !== null) {
    const spec = parseToggleAttr(openSelector);
    const target = spec.targetSelector ? resolveToggleTarget(spec.targetSelector) : null;

    if (target && !spec.cls && target.openOnPointerDown) {
      pointerDownTrigger = trigger;
      void target.show(trigger);
    }
  }
}

function handleDocumentPointerCancel(): void {
  pointerDownTrigger = null;
}

function handleDocumentClick(event: MouseEvent): void {
  const clickedElement = event.target instanceof Element ? event.target : null;
  const trigger = clickedElement?.closest<HTMLElement>('[data-toggle], [data-open], [data-close]');

  if (trigger && pointerDownTrigger === trigger) {
    pointerDownTrigger = null;
    event.preventDefault();

    return;
  }

  pointerDownTrigger = null;

  if (event.defaultPrevented || !trigger) {
    return;
  }

  const toggleSelector = trigger.getAttribute('data-toggle');

  if (toggleSelector !== null) {
    const spec = parseToggleAttr(toggleSelector);
    const target = spec.targetSelector ? resolveToggleTarget(spec.targetSelector) : null;

    if (target && !spec.cls) {
      event.preventDefault();
      void target.toggle(trigger);

      return;
    }

    const plainTargets = resolvePlainDomTargets(spec.targetSelector, trigger, true).filter(
      el => !isToggleable(el),
    );

    if (plainTargets.length > 0) {
      event.preventDefault();
      togglePlainElements(plainTargets, trigger, spec.cls, false);
    }

    return;
  }

  const openSelector = trigger.getAttribute('data-open');

  if (openSelector !== null) {
    const spec = parseToggleAttr(openSelector);
    const target = spec.targetSelector ? resolveToggleTarget(spec.targetSelector) : null;

    if (target && !spec.cls) {
      event.preventDefault();
      void target.show(trigger);

      return;
    }

    const plainTargets = resolvePlainDomTargets(spec.targetSelector, trigger, false).filter(
      el => !isToggleable(el),
    );

    if (plainTargets.length > 0) {
      event.preventDefault();
      togglePlainElements(plainTargets, trigger, spec.cls, true);
    }

    return;
  }

  const closeSelector = trigger.getAttribute('data-close');

  if (closeSelector !== null) {
    const spec = parseCloseAttr(closeSelector);

    if (spec.targetSelector) {
      const toggleable = resolveToggleTarget(spec.targetSelector);

      if (toggleable) {
        event.preventDefault();
        void toggleable.hide();

        return;
      }

      let matched: HTMLElement | null = null;

      try {
        matched = trigger.closest<HTMLElement>(spec.targetSelector);
      } catch {
        matched = null;
      }

      if (!matched) {
        matched = resolvePlainDomTargets(spec.targetSelector, trigger, false)[0] ?? null;
      }

      if (matched) {
        event.preventDefault();

        if (isToggleable(matched)) {
          void matched.hide();
        } else {
          void dismissElement(matched, trigger, spec);
        }
      }

      return;
    }

    const ancestor = findNearestCloseTarget(trigger);

    if (ancestor) {
      event.preventDefault();

      if (isToggleable(ancestor)) {
        void ancestor.hide();
      } else {
        void dismissElement(ancestor, trigger, spec);
      }
    }
  }
}

export function ensureToggleListener(): void {
  if (isToggleListenerAttached || typeof document === 'undefined') {
    return;
  }

  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('pointercancel', handleDocumentPointerCancel);
  document.addEventListener('click', handleDocumentClick);
  isToggleListenerAttached = true;
}
