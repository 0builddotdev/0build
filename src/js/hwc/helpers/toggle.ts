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

  const target = trimmed.startsWith('#')
    ? document.getElementById(trimmed.slice(1))
    : (document.getElementById(trimmed) ?? document.querySelector(trimmed));

  return isToggleable(target) ? target : null;
}

function findNearestToggleableAncestor(start: Element | null): ToggleableElement | null {
  let current = start?.parentElement ?? null;

  while (current) {
    if (isToggleable(current)) {
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
    const target = resolveToggleTarget(toggleSelector);

    if (target?.openOnPointerDown) {
      pointerDownTrigger = trigger;
      void target.toggle(trigger);
    }

    return;
  }

  const openSelector = trigger.getAttribute('data-open');

  if (openSelector !== null) {
    const target = resolveToggleTarget(openSelector);

    if (target?.openOnPointerDown) {
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
    const target = resolveToggleTarget(toggleSelector);

    if (target) {
      event.preventDefault();
      void target.toggle(trigger);
    }

    return;
  }

  const openSelector = trigger.getAttribute('data-open');

  if (openSelector !== null) {
    const target = resolveToggleTarget(openSelector);

    if (target) {
      event.preventDefault();
      void target.show(trigger);
    }

    return;
  }

  const closeSelector = trigger.getAttribute('data-close');

  if (closeSelector !== null) {
    const target = closeSelector.trim()
      ? resolveToggleTarget(closeSelector)
      : findNearestToggleableAncestor(trigger);

    if (target) {
      event.preventDefault();
      void target.hide();
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
