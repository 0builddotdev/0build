export interface ToggleableElement extends HTMLElement {
  show(trigger?: HTMLElement | null): Promise<void> | void;
  hide(): Promise<void> | void;
  toggle(trigger?: HTMLElement | null): Promise<void> | void;
}

let isToggleListenerAttached = false;

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

function handleDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented || !(event.target instanceof Element)) {
    return;
  }

  const trigger = event.target.closest<HTMLElement>('[data-toggle], [data-open], [data-close]');

  if (!trigger) {
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

  document.addEventListener('click', handleDocumentClick);
  isToggleListenerAttached = true;
}
