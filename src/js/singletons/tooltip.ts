import { autoUpdate, computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom';
import { isDisabledElement } from '$js/shared/base';
import { parseAttrObject } from '$js/shared/helpers/options';

export interface ZTooltipOptions {
  title: string;
  placement: Placement;
  offset: number;
  delay: number;
  flip: boolean;
  shift: boolean;
  blur: boolean;
  cls: string;
  stl: string;
}

const TOOLTIP_ID = 'z-tooltip-singleton';
const DEFAULT_DELAY_MS = 100;
const DEFAULT_OFFSET_PX = 8;
const WARMUP_WINDOW_MS = 350;

const KNOWN_TOOLTIP_KEYS = new Set([
  'title',
  'text',
  'pos',
  'placement',
  'offset',
  'delay',
  'flip',
  'shift',
  'blur',
  'cls',
  'stl',
]);

const POS_MAP: Record<string, Placement> = {
  top: 'top',
  'top-left': 'top-start',
  'top-start': 'top-start',
  'top-right': 'top-end',
  'top-end': 'top-end',
  bottom: 'bottom',
  'bottom-left': 'bottom-start',
  'bottom-start': 'bottom-start',
  'bottom-right': 'bottom-end',
  'bottom-end': 'bottom-end',
  left: 'left',
  'left-top': 'left-start',
  'left-start': 'left-start',
  'left-bottom': 'left-end',
  'left-end': 'left-end',
  right: 'right',
  'right-top': 'right-start',
  'right-start': 'right-start',
  'right-bottom': 'right-end',
  'right-end': 'right-end',
};

const stashedTitles = new WeakMap<HTMLElement, string>();

let isTooltipListenerAttached = false;
let tooltipEl: HTMLDivElement | null = null;
let activeTrigger: HTMLElement | null = null;
let pendingTrigger: HTMLElement | null = null;
let showTimer: number | null = null;
let cleanupAutoUpdate: (() => void) | null = null;
let lastHideTime = 0;

function resolvePlacement(rawPos: unknown): Placement {
  if (typeof rawPos !== 'string') {
    return 'top';
  }

  const normalized = rawPos.trim().toLowerCase();

  return POS_MAP[normalized] ?? 'top';
}

function parseTooltipOptions(trigger: HTMLElement): ZTooltipOptions {
  if (trigger.hasAttribute('title')) {
    const nativeTitle = trigger.getAttribute('title') ?? '';

    stashedTitles.set(trigger, nativeTitle);
    trigger.removeAttribute('title');
  }

  const raw = (trigger.getAttribute('data-tooltip') ?? '').trim();
  const parsed = parseAttrObject(raw, KNOWN_TOOLTIP_KEYS) ?? (raw ? { title: raw } : {});
  const rawTitle = parsed.title ?? parsed.text ?? stashedTitles.get(trigger) ?? '';
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : String(rawTitle).trim();
  const parsedOffset = Number(parsed.offset);
  const parsedDelay = Number(parsed.delay);

  return {
    title,
    placement: resolvePlacement(parsed.placement ?? parsed.pos),
    offset: Number.isFinite(parsedOffset) ? parsedOffset : DEFAULT_OFFSET_PX,
    delay:
      parsed.delay !== undefined && Number.isFinite(parsedDelay)
        ? Math.max(0, parsedDelay)
        : DEFAULT_DELAY_MS,
    flip: parsed.flip !== false && parsed.flip !== 'false',
    shift: parsed.shift !== false && parsed.shift !== 'false',
    blur: parsed.blur === true || parsed.blur === 'true',
    cls: typeof parsed.cls === 'string' ? parsed.cls.trim() : '',
    stl: typeof parsed.stl === 'string' ? parsed.stl.trim() : '',
  };
}

function restoreStashedTitle(trigger: HTMLElement): void {
  const stashed = stashedTitles.get(trigger);

  if (stashed !== undefined && !trigger.hasAttribute('title')) {
    trigger.setAttribute('title', stashed);
  }
}

function attachAriaDescribedBy(trigger: HTMLElement): void {
  const current = trigger.getAttribute('aria-describedby') ?? '';
  const tokens = current.split(/\s+/).filter(Boolean);

  if (!tokens.includes(TOOLTIP_ID)) {
    tokens.push(TOOLTIP_ID);
    trigger.setAttribute('aria-describedby', tokens.join(' '));
  }
}

function detachAriaDescribedBy(trigger: HTMLElement): void {
  const current = trigger.getAttribute('aria-describedby');

  if (!current) {
    return;
  }

  const tokens = current.split(/\s+/).filter(token => token && token !== TOOLTIP_ID);

  if (tokens.length > 0) {
    trigger.setAttribute('aria-describedby', tokens.join(' '));
  } else {
    trigger.removeAttribute('aria-describedby');
  }
}

function ensureTooltipElement(): HTMLDivElement {
  if (tooltipEl && tooltipEl.isConnected) {
    return tooltipEl;
  }

  const existing = document.getElementById(TOOLTIP_ID);

  if (existing instanceof HTMLDivElement) {
    tooltipEl = existing;

    return existing;
  }

  const el = document.createElement('div');

  el.id = TOOLTIP_ID;
  el.className = 'z-tooltip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  tooltipEl = el;

  return el;
}

function clearShowTimer(): void {
  if (showTimer !== null) {
    window.clearTimeout(showTimer);
    showTimer = null;
  }
}

function stopAutoUpdate(): void {
  if (cleanupAutoUpdate) {
    cleanupAutoUpdate();
    cleanupAutoUpdate = null;
  }
}

function emitTooltipEvent(trigger: HTMLElement, name: 'show' | 'hide', el: HTMLDivElement): void {
  trigger.dispatchEvent(
    new CustomEvent(`z-tooltip:${name}`, {
      bubbles: true,
      composed: true,
      detail: { trigger, tooltip: el },
    }),
  );
}

async function updateTooltipPosition(
  trigger: HTMLElement,
  el: HTMLDivElement,
  opts: ZTooltipOptions,
): Promise<void> {
  if (activeTrigger !== trigger || !trigger.isConnected) {
    hideTooltip(false);

    return;
  }

  const middleware = [offset(opts.offset)];

  if (opts.flip) {
    middleware.push(flip());
  }

  if (opts.shift) {
    middleware.push(shift({ padding: 8 }));
  }

  const { x, y, placement } = await computePosition(trigger, el, {
    strategy: 'fixed',
    placement: opts.placement,
    middleware,
  });

  if (activeTrigger !== trigger || !trigger.isConnected) {
    return;
  }

  const side = placement.split('-')[0];

  el.setAttribute('data-side', side);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function showTooltip(trigger: HTMLElement): void {
  if (!trigger.isConnected || isDisabledElement(trigger)) {
    return;
  }

  const opts = parseTooltipOptions(trigger);

  if (!opts.title) {
    restoreStashedTitle(trigger);

    return;
  }

  if (activeTrigger && activeTrigger !== trigger) {
    detachAriaDescribedBy(activeTrigger);
    restoreStashedTitle(activeTrigger);
  }

  stopAutoUpdate();

  const el = ensureTooltipElement();

  activeTrigger = trigger;
  pendingTrigger = null;

  el.textContent = opts.title;
  el.className = ['z-tooltip', 'z-active', opts.blur ? 'z-tooltip-blur' : '', opts.cls]
    .filter(Boolean)
    .join(' ');
  el.style.cssText = opts.stl;

  attachAriaDescribedBy(trigger);
  cleanupAutoUpdate = autoUpdate(trigger, el, () => {
    void updateTooltipPosition(trigger, el, opts);
  });

  emitTooltipEvent(trigger, 'show', el);
}

function scheduleTooltip(trigger: HTMLElement, immediate: boolean): void {
  clearShowTimer();

  if (pendingTrigger && pendingTrigger !== trigger && pendingTrigger !== activeTrigger) {
    restoreStashedTitle(pendingTrigger);
  }

  if (isDisabledElement(trigger)) {
    return;
  }

  const opts = parseTooltipOptions(trigger);

  if (!opts.title) {
    restoreStashedTitle(trigger);

    return;
  }

  const isWarm = activeTrigger !== null || performance.now() - lastHideTime < WARMUP_WINDOW_MS;
  const delay = immediate || isWarm ? 0 : opts.delay;

  pendingTrigger = trigger;

  if (delay <= 0) {
    showTooltip(trigger);

    return;
  }

  showTimer = window.setTimeout(() => {
    showTimer = null;

    if (pendingTrigger === trigger) {
      showTooltip(trigger);
    }
  }, delay);
}

export function hideTooltip(recordWarmup: boolean = false): void {
  clearShowTimer();
  stopAutoUpdate();

  if (pendingTrigger) {
    restoreStashedTitle(pendingTrigger);
    pendingTrigger = null;
  }

  const previousTrigger = activeTrigger;

  activeTrigger = null;

  if (tooltipEl) {
    tooltipEl.className = 'z-tooltip';
    tooltipEl.removeAttribute('data-side');
    tooltipEl.style.cssText = '';
    tooltipEl.textContent = '';
  }

  if (previousTrigger) {
    detachAriaDescribedBy(previousTrigger);
    restoreStashedTitle(previousTrigger);

    if (recordWarmup) {
      lastHideTime = performance.now();
    }

    if (tooltipEl) {
      emitTooltipEvent(previousTrigger, 'hide', tooltipEl);
    }
  }
}

function handleDocumentPointerOver(event: PointerEvent): void {
  if (event.pointerType === 'touch' || !(event.target instanceof Element)) {
    return;
  }

  const trigger = event.target.closest<HTMLElement>('[data-tooltip]');

  if (!trigger || isDisabledElement(trigger)) {
    return;
  }

  if (trigger === activeTrigger || trigger === pendingTrigger) {
    return;
  }

  scheduleTooltip(trigger, false);
}

function handleDocumentPointerOut(event: PointerEvent): void {
  if (event.pointerType === 'touch' || !(event.target instanceof Element)) {
    return;
  }

  const current = activeTrigger ?? pendingTrigger;

  if (!current || !current.contains(event.target)) {
    return;
  }

  const related = event.relatedTarget as Node | null;

  if (related && current.contains(related)) {
    return;
  }

  hideTooltip(true);
}

function handleDocumentFocusIn(event: FocusEvent): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  const trigger = event.target.closest<HTMLElement>('[data-tooltip]');

  if (!trigger || isDisabledElement(trigger)) {
    return;
  }

  let isFocusVisible = false;

  try {
    isFocusVisible = trigger.matches(':focus-visible');
  } catch {
    isFocusVisible = false;
  }

  if (!isFocusVisible) {
    return;
  }

  scheduleTooltip(trigger, true);
}

function handleDocumentFocusOut(event: FocusEvent): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  const current = activeTrigger ?? pendingTrigger;

  if (!current || !current.contains(event.target)) {
    return;
  }

  const related = event.relatedTarget as Node | null;

  if (related && current.contains(related)) {
    return;
  }

  hideTooltip(false);
}

function handleDocumentPointerDown(): void {
  if (activeTrigger || pendingTrigger) {
    hideTooltip(false);
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) {
    return;
  }

  if (activeTrigger) {
    event.preventDefault();
    hideTooltip(false);

    return;
  }

  if (pendingTrigger) {
    hideTooltip(false);
  }
}

export function ensureTooltipListener(): void {
  if (isTooltipListenerAttached || typeof document === 'undefined') {
    return;
  }

  document.addEventListener('pointerover', handleDocumentPointerOver);
  document.addEventListener('pointerout', handleDocumentPointerOut);
  document.addEventListener('focusin', handleDocumentFocusIn);
  document.addEventListener('focusout', handleDocumentFocusOut);
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('keydown', handleDocumentKeydown, true);
  isTooltipListenerAttached = true;
}
