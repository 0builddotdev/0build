import { prefersReducedMotion } from '$js/shared/base';
import { getGlobalI18n, getGlobalIconStrings } from '$js/hwc/hwc';
import { parseOptions } from '$js/shared/helpers/options';
import { randomString } from '$js/shared/helpers/common';
import { readCssPxVar } from '$js/shared/helpers/css';
import { svgIconMarkup } from '$js/shared/helpers/svg';

export type ZToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ZToastStatus =
  | 'default'
  | 'success'
  | 'danger'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading';

type NormalizedToastStatus = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'loading';

export type ZToastPart =
  | 'toaster'
  | 'toast'
  | 'icon'
  | 'content'
  | 'title'
  | 'description'
  | 'actions'
  | 'action'
  | 'cancel'
  | 'close';

export interface ZToastAction {
  label: string;
  onClick?: (event: MouseEvent, id: string) => void | boolean;
  cls?: string;
  stl?: string;
}

export interface ZToastOptions {
  id?: string;
  title?: string;
  description?: string;
  message?: string;
  status?: ZToastStatus;
  position?: ZToastPosition;
  duration?: number;
  dismissible?: boolean;
  closeButton?: boolean;
  richColors?: boolean;
  blur?: boolean;
  icon?: string | Element | null | false;
  action?: ZToastAction;
  cancel?: ZToastAction;
  cls?: string | Partial<Record<ZToastPart, string>>;
  stl?: string | Partial<Record<ZToastPart, string>>;
  onDismiss?: (id: string) => void;
  onAutoClose?: (id: string) => void;
}

export interface ZToastGlobalConfig {
  position?: ZToastPosition;
  duration?: number;
  max?: number;
  expand?: boolean;
  dismissible?: boolean;
  closeButton?: boolean;
  richColors?: boolean;
  blur?: boolean;
  gap?: number;
  offset?: number | string;
  cls?: string | Partial<Record<ZToastPart, string>>;
  stl?: string | Partial<Record<ZToastPart, string>>;
  i18n?: {
    notifications?: string;
    close?: string;
  };
}

export interface ZToastPromiseOptions<T> {
  id?: string;
  position?: ZToastPosition;
  loading: string | ZToastOptions;
  success?: string | ZToastOptions | ((data: T) => string | ZToastOptions);
  error?: string | ZToastOptions | ((error: unknown) => string | ZToastOptions);
  danger?: string | ZToastOptions | ((error: unknown) => string | ZToastOptions);
  finally?: () => void | Promise<void>;
}

export interface ZToastPromiseResult<T> extends PromiseLike<T> {
  id: string;
  unwrap: () => Promise<T>;
  catch: Promise<T>['catch'];
  finally: Promise<T>['finally'];
}

export interface ZToast {
  (input: string | ZToastOptions, options?: ZToastOptions): string;
  message: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  success: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  danger: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  error: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  warning: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  info: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  loading: (input: string | ZToastOptions, options?: ZToastOptions) => string;
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: ZToastPromiseOptions<T>,
  ) => ZToastPromiseResult<T>;
  update: (id: string, input: string | ZToastOptions, options?: ZToastOptions) => string;
  dismiss: (id?: string) => void;
  config: (options?: ZToastGlobalConfig) => Readonly<InternalGlobalConfig>;
}

interface InternalGlobalConfig {
  position: ZToastPosition;
  duration: number;
  max: number;
  expand: boolean;
  dismissible: boolean;
  closeButton: boolean;
  richColors: boolean;
  blur: boolean;
  gap: number | undefined;
  offset: number | string | undefined;
  cls: Partial<Record<ZToastPart, string>>;
  stl: Partial<Record<ZToastPart, string>>;
  i18n: {
    notifications?: string;
    close?: string;
  };
}

interface ToastRecord {
  id: string;
  position: ZToastPosition;
  status: NormalizedToastStatus;
  options: ZToastOptions;
  el: HTMLLIElement;
  measuredHeight: number;
  duration: number;
  remainingMs: number;
  startedAt: number | null;
  timerId: number | null;
  removed: boolean;
  dismissible: boolean;
  swiping: boolean;
  cleanupResize: (() => void) | null;
}

interface ToasterGroup {
  position: ZToastPosition;
  el: HTMLOListElement;
  items: ToastRecord[];
  isHovered: boolean;
  isFocused: boolean;
  resizeObserver: ResizeObserver | null;
}

const VALID_POSITIONS = new Set<ZToastPosition>([
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]);

const STATUS_ALIASES: Record<ZToastStatus, NormalizedToastStatus> = {
  default: 'default',
  success: 'success',
  danger: 'danger',
  error: 'danger',
  warning: 'warning',
  info: 'info',
  loading: 'loading',
};

const DEFAULT_CLS: Record<ZToastPart, string> = {
  toaster: 'z-toaster',
  toast: 'z-toast',
  icon: 'z-toast-icon',
  content: 'z-toast-content',
  title: 'z-toast-title',
  description: 'z-toast-description',
  actions: 'z-toast-actions',
  action: 'z-button z-button-primary z-button-xsmall z-toast-action',
  cancel: 'z-button z-button-default z-button-xsmall z-toast-cancel',
  close: 'z-toast-close',
};

const BUILTIN_ICONS: Record<
  'success' | 'danger' | 'warning' | 'info' | 'loading' | 'close',
  string
> = {
  success: svgIconMarkup('circle-check'),
  danger: svgIconMarkup('circle-alert'),
  warning: svgIconMarkup('triangle-alert'),
  info: svgIconMarkup('info'),
  loading:
    '<span class="z-spinner" aria-hidden="true"><svg viewBox="0 0 30 30" width="16" height="16"><circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="2"></circle></svg></span>',
  close: svgIconMarkup('x', 14),
};

const DEFAULT_GAP_PX = 12;
const EXIT_DURATION_MS = 200;
const SWIPE_THRESHOLD_PX = 45;
const SWIPE_VELOCITY_THRESHOLD = 0.35;
const DRAG_LOCK_PX = 4;
const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, [data-no-drag]';

const globalConfig: InternalGlobalConfig = {
  position: 'bottom-right',
  duration: 4000,
  max: 3,
  expand: false,
  dismissible: true,
  closeButton: true,
  richColors: false,
  blur: false,
  gap: undefined,
  offset: undefined,
  cls: {},
  stl: {},
  i18n: {},
};

const groups = new Map<ZToastPosition, ToasterGroup>();
const recordsById = new Map<string, ToastRecord>();
const pendingBodyQueue: Array<() => void> = [];

let isBodyWaitAttached = false;
let isVisibilityListenerAttached = false;

function getI18nLabel(key: 'notifications' | 'close', fallback: string): string {
  const localVal = globalConfig.i18n[key];

  if (localVal) {
    return localVal;
  }

  const globalI18n = getGlobalI18n();
  const scoped = globalI18n['z-toaster'];

  if (scoped && typeof scoped === 'object' && key in scoped) {
    const scopedVal = (scoped as Record<string, unknown>)[key];

    if (typeof scopedVal === 'string' && scopedVal) {
      return scopedVal;
    }
  }

  const topVal = globalI18n[key];

  if (typeof topVal === 'string' && topVal) {
    return topVal;
  }

  return fallback;
}

function parsePartMap(
  input: string | Partial<Record<ZToastPart, string>> | undefined,
  defaultPart: ZToastPart,
): Partial<Record<ZToastPart, string>> {
  if (!input) {
    return {};
  }

  if (typeof input === 'string') {
    const parsed = parseOptions(input);

    if (typeof parsed === 'string') {
      return parsed ? { [defaultPart]: parsed } : {};
    }

    return parsed as Partial<Record<ZToastPart, string>>;
  }

  return input;
}

function joinClasses(...parts: Array<string | undefined>): string {
  return parts
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

function joinStyles(...parts: Array<string | undefined>): string {
  return parts
    .map(part => part?.trim().replace(/;+$/, ''))
    .filter((part): part is string => Boolean(part))
    .join('; ');
}

function normalizePosition(position?: ZToastPosition): ZToastPosition {
  if (position && VALID_POSITIONS.has(position)) {
    return position;
  }

  return globalConfig.position;
}

function normalizeStatus(status?: ZToastStatus): NormalizedToastStatus {
  if (status && status in STATUS_ALIASES) {
    return STATUS_ALIASES[status];
  }

  return 'default';
}

function normalizeOptions(input: string | ZToastOptions, extra?: ZToastOptions): ZToastOptions {
  const base = typeof input === 'string' ? { title: input } : { ...input };
  const merged = extra ? { ...base, ...extra } : base;

  if (!merged.title && merged.message) {
    merged.title = merged.message;
  }

  return merged;
}

function resolveDuration(options: ZToastOptions, status: NormalizedToastStatus): number {
  if (typeof options.duration === 'number') {
    return options.duration;
  }

  if (status === 'loading') {
    return Number.POSITIVE_INFINITY;
  }

  return globalConfig.duration;
}

function createIconNode(iconMarkup: string): Node | null {
  const template = document.createElement('template');

  template.innerHTML = iconMarkup.trim();

  return template.content.firstChild ? template.content.cloneNode(true) : null;
}

function resolveStatusIcon(options: ZToastOptions, status: NormalizedToastStatus): Node | null {
  if (options.icon === false || options.icon === null) {
    return null;
  }

  const globalIcons = getGlobalIconStrings();

  if (options.icon instanceof Element) {
    return options.icon.cloneNode(true);
  }

  if (typeof options.icon === 'string') {
    const trimmed = options.icon.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('<')) {
      return createIconNode(trimmed);
    }

    const byKey = globalIcons.get(trimmed);

    if (byKey) {
      return createIconNode(byKey);
    }

    return null;
  }

  if (status === 'default') {
    return null;
  }

  const markup =
    globalIcons.get(`toast-${status}`) ?? globalIcons.get(status) ?? BUILTIN_ICONS[status];

  return markup ? createIconNode(markup) : null;
}

function resolveCloseIcon(): Node | null {
  const globalIcons = getGlobalIconStrings();
  const markup = globalIcons.get('toast-close') ?? globalIcons.get('close') ?? BUILTIN_ICONS.close;

  return createIconNode(markup);
}

function getGapPx(group: ToasterGroup): number {
  if (typeof globalConfig.gap === 'number' && Number.isFinite(globalConfig.gap)) {
    return globalConfig.gap;
  }

  return readCssPxVar(group.el, '--z-toaster-gap', DEFAULT_GAP_PX);
}

function isGroupPaused(group: ToasterGroup): boolean {
  const isSwiping = group.items.some(item => item.swiping);
  const isDocHidden = typeof document !== 'undefined' && document.hidden;

  return group.isHovered || group.isFocused || isSwiping || isDocHidden;
}

function pauseGroupTimers(group: ToasterGroup): void {
  const now = performance.now();

  for (const item of group.items) {
    if (item.timerId !== null) {
      window.clearTimeout(item.timerId);
      item.timerId = null;

      if (item.startedAt !== null) {
        item.remainingMs = Math.max(0, item.remainingMs - (now - item.startedAt));
        item.startedAt = null;
      }
    }
  }
}

function startItemTimer(record: ToastRecord, group: ToasterGroup): void {
  if (record.removed || !Number.isFinite(record.duration) || record.duration <= 0) {
    return;
  }

  if (isGroupPaused(group) || record.timerId !== null) {
    return;
  }

  if (record.remainingMs <= 0) {
    dismissToastRecord(record, 'auto');

    return;
  }

  record.startedAt = performance.now();
  record.timerId = window.setTimeout(() => {
    record.timerId = null;
    record.startedAt = null;
    dismissToastRecord(record, 'auto');
  }, record.remainingMs);
}

function resumeGroupTimers(group: ToasterGroup): void {
  if (isGroupPaused(group)) {
    return;
  }

  for (const item of group.items) {
    startItemTimer(item, group);
  }
}

function syncVisibilityListener(): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (recordsById.size > 0 && !isVisibilityListenerAttached) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    isVisibilityListenerAttached = true;
  } else if (recordsById.size === 0 && isVisibilityListenerAttached) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    isVisibilityListenerAttached = false;
  }
}

function handleVisibilityChange(): void {
  for (const group of groups.values()) {
    if (document.hidden) {
      pauseGroupTimers(group);
    } else {
      resumeGroupTimers(group);
    }
  }
}

function recalculateGroupLayout(group: ToasterGroup): void {
  const expanded = globalConfig.expand || group.isHovered || group.isFocused;
  const activeItems = group.items.filter(item => !item.removed);
  const gapPx = getGapPx(group);
  const frontHeight = activeItems[0]?.measuredHeight ?? 0;
  let offset = 0;

  group.el.setAttribute('data-expanded', String(expanded));

  activeItems.forEach((item, index) => {
    const el = item.el;

    el.setAttribute('data-expanded', String(expanded));
    el.setAttribute('data-front', String(index === 0));
    el.setAttribute('data-visible', String(index < globalConfig.max));
    el.style.setProperty('--z-toast-index', String(index));
    el.style.setProperty('--z-toast-offset', `${offset}px`);
    el.style.setProperty('--z-toast-initial-height', `${item.measuredHeight}px`);
    el.style.setProperty('--z-toast-front-height', `${frontHeight}px`);

    offset += item.measuredHeight + gapPx;
  });
}

function applyGroupConfigAttributes(group: ToasterGroup): void {
  const el = group.el;

  el.className = joinClasses(
    DEFAULT_CLS.toaster,
    globalConfig.blur ? 'z-toaster-blur' : undefined,
    globalConfig.cls.toaster,
  );
  el.style.cssText = '';

  if (globalConfig.stl.toaster) {
    el.style.cssText = globalConfig.stl.toaster;
  }

  if (typeof globalConfig.gap === 'number' && Number.isFinite(globalConfig.gap)) {
    el.style.setProperty('--z-toaster-gap', `${globalConfig.gap}px`);
  }

  if (globalConfig.offset !== undefined) {
    const offsetVal =
      typeof globalConfig.offset === 'number' ? `${globalConfig.offset}px` : globalConfig.offset;

    el.style.setProperty('--z-toaster-offset-x', offsetVal);
    el.style.setProperty('--z-toaster-offset-y', offsetVal);
  }

  el.setAttribute('data-position', group.position);
  el.setAttribute('aria-label', getI18nLabel('notifications', 'Notifications'));
}

function getOrCreateGroup(position: ZToastPosition): ToasterGroup {
  const existing = groups.get(position);

  if (existing) {
    return existing;
  }

  const el = document.createElement('ol');

  el.setAttribute('role', 'region');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('tabindex', '-1');

  const group: ToasterGroup = {
    position,
    el,
    items: [],
    isHovered: false,
    isFocused: false,
    resizeObserver: null,
  };

  if (typeof ResizeObserver !== 'undefined') {
    group.resizeObserver = new ResizeObserver(entries => {
      let changed = false;

      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const id = target.getAttribute('data-toast-id');

        if (!id) {
          continue;
        }

        const record = recordsById.get(id);

        if (!record || record.removed) {
          continue;
        }

        const isExpanded = target.getAttribute('data-expanded') === 'true';
        const isFront = target.getAttribute('data-front') === 'true';

        if (!isExpanded && !isFront) {
          continue;
        }

        const height = target.getBoundingClientRect().height;

        if (height > 0 && Math.abs(height - record.measuredHeight) > 0.5) {
          record.measuredHeight = height;
          changed = true;
        }
      }

      if (changed) {
        recalculateGroupLayout(group);
      }
    });
  }

  el.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') {
      return;
    }

    group.isHovered = true;
    pauseGroupTimers(group);
    recalculateGroupLayout(group);
  });

  el.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') {
      return;
    }

    group.isHovered = false;
    recalculateGroupLayout(group);
    resumeGroupTimers(group);
  });

  el.addEventListener('focusin', () => {
    group.isFocused = true;
    pauseGroupTimers(group);
    recalculateGroupLayout(group);
  });

  el.addEventListener('focusout', event => {
    const next = event.relatedTarget as Node | null;

    if (next && el.contains(next)) {
      return;
    }

    group.isFocused = false;
    recalculateGroupLayout(group);
    resumeGroupTimers(group);
  });

  applyGroupConfigAttributes(group);
  document.body.appendChild(el);
  groups.set(position, group);

  return group;
}

function cleanupGroupIfEmpty(group: ToasterGroup): void {
  if (group.items.length > 0) {
    return;
  }

  group.resizeObserver?.disconnect();
  group.resizeObserver = null;
  group.el.remove();
  groups.delete(group.position);
}

function dismissToastRecord(record: ToastRecord, reason: 'manual' | 'auto'): void {
  if (record.removed) {
    return;
  }

  record.removed = true;

  if (record.timerId !== null) {
    window.clearTimeout(record.timerId);
    record.timerId = null;
  }

  record.el.setAttribute('data-removed', 'true');
  recordsById.delete(record.id);
  syncVisibilityListener();

  const group = groups.get(record.position);

  if (group) {
    recalculateGroupLayout(group);
  }

  if (reason === 'auto') {
    record.options.onAutoClose?.(record.id);
  } else {
    record.options.onDismiss?.(record.id);
  }

  const exitMs = prefersReducedMotion() ? 0 : EXIT_DURATION_MS;

  window.setTimeout(() => {
    record.cleanupResize?.();
    record.el.remove();

    if (group) {
      const idx = group.items.indexOf(record);

      if (idx !== -1) {
        group.items.splice(idx, 1);
      }

      recalculateGroupLayout(group);
      cleanupGroupIfEmpty(group);
    }
  }, exitMs);
}

function renderToastContents(record: ToastRecord): void {
  const { el, options, status } = record;
  const clsMap = parsePartMap(options.cls, 'toast');
  const stlMap = parsePartMap(options.stl, 'toast');
  const yPosition = record.position.startsWith('top') ? 'top' : 'bottom';
  const xPosition = record.position.endsWith('left')
    ? 'left'
    : record.position.endsWith('center')
      ? 'center'
      : 'right';
  const useBlur = options.blur ?? globalConfig.blur;
  const useRichColors = options.richColors ?? globalConfig.richColors;
  const dismissible = options.dismissible ?? globalConfig.dismissible;
  const showCloseButton = dismissible && (options.closeButton ?? globalConfig.closeButton);

  record.dismissible = dismissible;

  el.className = joinClasses(
    DEFAULT_CLS.toast,
    useBlur ? 'z-toast-blur' : undefined,
    globalConfig.cls.toast,
    clsMap.toast,
  );

  const customToastStyle = joinStyles(globalConfig.stl.toast, stlMap.toast);

  if (customToastStyle) {
    el.style.cssText = `${el.style.cssText}; ${customToastStyle}`;
  }

  el.setAttribute('data-toast-id', record.id);
  el.setAttribute('data-status', status);
  el.setAttribute('data-y-position', yPosition);
  el.setAttribute('data-x-position', xPosition);
  el.setAttribute('data-rich-colors', String(useRichColors));
  el.setAttribute('data-dismissible', String(dismissible));
  el.setAttribute('data-close-button', String(showCloseButton));
  el.setAttribute('role', status === 'danger' ? 'alert' : 'status');
  el.setAttribute('aria-atomic', 'true');

  el.replaceChildren();

  const iconNode = resolveStatusIcon(options, status);

  if (iconNode) {
    const iconWrapper = document.createElement('span');

    iconWrapper.className = joinClasses(DEFAULT_CLS.icon, globalConfig.cls.icon, clsMap.icon);
    iconWrapper.style.cssText = joinStyles(globalConfig.stl.icon, stlMap.icon);
    iconWrapper.setAttribute('data-part', 'icon');
    iconWrapper.appendChild(iconNode);
    el.appendChild(iconWrapper);
  }

  const contentEl = document.createElement('div');

  contentEl.className = joinClasses(DEFAULT_CLS.content, globalConfig.cls.content, clsMap.content);
  contentEl.style.cssText = joinStyles(globalConfig.stl.content, stlMap.content);
  contentEl.setAttribute('data-part', 'content');

  if (options.title) {
    const titleEl = document.createElement('div');

    titleEl.className = joinClasses(DEFAULT_CLS.title, globalConfig.cls.title, clsMap.title);
    titleEl.style.cssText = joinStyles(globalConfig.stl.title, stlMap.title);
    titleEl.setAttribute('data-part', 'title');
    titleEl.textContent = options.title;
    contentEl.appendChild(titleEl);
  }

  if (options.description) {
    const descEl = document.createElement('div');

    descEl.className = joinClasses(
      DEFAULT_CLS.description,
      globalConfig.cls.description,
      clsMap.description,
    );
    descEl.style.cssText = joinStyles(globalConfig.stl.description, stlMap.description);
    descEl.setAttribute('data-part', 'description');
    descEl.textContent = options.description;
    contentEl.appendChild(descEl);
  }

  el.appendChild(contentEl);

  if (options.cancel || options.action) {
    const actionsEl = document.createElement('div');

    actionsEl.className = joinClasses(
      DEFAULT_CLS.actions,
      globalConfig.cls.actions,
      clsMap.actions,
    );
    actionsEl.style.cssText = joinStyles(globalConfig.stl.actions, stlMap.actions);
    actionsEl.setAttribute('data-part', 'actions');

    if (options.cancel) {
      actionsEl.appendChild(createActionButton(options.cancel, 'cancel', record, clsMap, stlMap));
    }

    if (options.action) {
      actionsEl.appendChild(createActionButton(options.action, 'action', record, clsMap, stlMap));
    }

    el.appendChild(actionsEl);
  }

  if (showCloseButton) {
    const closeBtn = document.createElement('button');

    closeBtn.type = 'button';
    closeBtn.className = joinClasses(DEFAULT_CLS.close, globalConfig.cls.close, clsMap.close);
    closeBtn.style.cssText = joinStyles(globalConfig.stl.close, stlMap.close);
    closeBtn.setAttribute('data-part', 'close');
    closeBtn.setAttribute('aria-label', getI18nLabel('close', 'Close'));

    const closeIcon = resolveCloseIcon();

    if (closeIcon) {
      closeBtn.appendChild(closeIcon);
    }

    closeBtn.addEventListener('click', event => {
      event.stopPropagation();
      dismissToastRecord(record, 'manual');
    });

    el.appendChild(closeBtn);
  }
}

function createActionButton(
  action: ZToastAction,
  kind: 'action' | 'cancel',
  record: ToastRecord,
  clsMap: Partial<Record<ZToastPart, string>>,
  stlMap: Partial<Record<ZToastPart, string>>,
): HTMLButtonElement {
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.className = joinClasses(DEFAULT_CLS[kind], globalConfig.cls[kind], clsMap[kind], action.cls);
  btn.style.cssText = joinStyles(globalConfig.stl[kind], stlMap[kind], action.stl);
  btn.setAttribute('data-part', kind);
  btn.textContent = action.label;

  btn.addEventListener('click', event => {
    const result = action.onClick?.(event, record.id);

    if (result !== false && !event.defaultPrevented && record.dismissible) {
      dismissToastRecord(record, 'manual');
    }
  });

  return btn;
}

function attachSwipeHandlers(record: ToastRecord): void {
  const el = record.el;
  let activePointerId = -1;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let axis: 'x' | 'y' | null = null;
  let lastDeltaX = 0;
  let lastDeltaY = 0;

  const resetSwipeStyles = () => {
    el.removeAttribute('data-swiping');
    el.style.setProperty('--z-toast-swipe-x', '0px');
    el.style.setProperty('--z-toast-swipe-y', '0px');
    el.style.opacity = '';
  };

  el.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !record.dismissible || record.removed) {
      return;
    }

    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    axis = null;
    lastDeltaX = 0;
    lastDeltaY = 0;
  });

  el.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointerId || record.removed) {
      return;
    }

    const rawDx = event.clientX - startX;
    const rawDy = event.clientY - startY;

    if (!axis) {
      if (Math.abs(rawDx) < DRAG_LOCK_PX && Math.abs(rawDy) < DRAG_LOCK_PX) {
        return;
      }

      axis = Math.abs(rawDx) >= Math.abs(rawDy) ? 'x' : 'y';
      record.swiping = true;
      el.setAttribute('data-swiping', 'true');

      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failure on detached elements
      }

      const group = groups.get(record.position);

      if (group) {
        pauseGroupTimers(group);
      }
    }

    const isTop = record.position.startsWith('top');
    const isLeft = record.position.endsWith('left');
    const isRight = record.position.endsWith('right');

    if (axis === 'x') {
      const resistLeft = isRight && rawDx < 0;
      const resistRight = isLeft && rawDx > 0;

      lastDeltaX = resistLeft || resistRight ? rawDx * 0.2 : rawDx;
      lastDeltaY = 0;
    } else {
      const resistY = (isTop && rawDy > 0) || (!isTop && rawDy < 0);

      lastDeltaX = 0;
      lastDeltaY = resistY ? rawDy * 0.2 : rawDy;
    }

    const primaryDist = Math.abs(axis === 'x' ? lastDeltaX : lastDeltaY);

    el.style.setProperty('--z-toast-swipe-x', `${lastDeltaX}px`);
    el.style.setProperty('--z-toast-swipe-y', `${lastDeltaY}px`);
    el.style.opacity = String(Math.max(0.25, 1 - primaryDist / 140));
  });

  const finishSwipe = (event: PointerEvent, canceled: boolean) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    activePointerId = -1;

    if (!record.swiping) {
      return;
    }

    record.swiping = false;

    try {
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release failure
    }

    const elapsed = Math.max(1, performance.now() - startTime);
    const isTop = record.position.startsWith('top');
    const isLeft = record.position.endsWith('left');
    const isRight = record.position.endsWith('right');
    const validX =
      axis === 'x' &&
      ((isRight && lastDeltaX > 0) ||
        (isLeft && lastDeltaX < 0) ||
        (!isLeft && !isRight && Math.abs(lastDeltaX) > 0));
    const validY = axis === 'y' && ((isTop && lastDeltaY < 0) || (!isTop && lastDeltaY > 0));
    const primaryDist = Math.abs(axis === 'x' ? lastDeltaX : lastDeltaY);
    const velocity = primaryDist / elapsed;
    const shouldDismiss =
      !canceled &&
      (validX || validY) &&
      (primaryDist >= SWIPE_THRESHOLD_PX ||
        (primaryDist >= 16 && velocity >= SWIPE_VELOCITY_THRESHOLD));

    if (shouldDismiss) {
      el.removeAttribute('data-swiping');
      el.setAttribute('data-swipe-out', 'true');
      el.style.opacity = '';

      if (axis === 'x') {
        const outX = lastDeltaX >= 0 ? '100%' : '-100%';

        el.style.setProperty('--z-toast-swipe-out-x', outX);
        el.style.setProperty('--z-toast-swipe-out-y', '0px');
      } else {
        const outY = lastDeltaY >= 0 ? '100%' : '-100%';

        el.style.setProperty('--z-toast-swipe-out-x', '0px');
        el.style.setProperty('--z-toast-swipe-out-y', outY);
      }

      dismissToastRecord(record, 'manual');

      return;
    }

    resetSwipeStyles();

    const group = groups.get(record.position);

    if (group) {
      resumeGroupTimers(group);
    }
  };

  el.addEventListener('pointerup', event => finishSwipe(event, false));
  el.addEventListener('pointercancel', event => finishSwipe(event, true));
}

function measureRecordHeight(record: ToastRecord): number {
  const height = record.el.getBoundingClientRect().height;

  return height > 0 ? height : record.measuredHeight;
}

function mountOrUpdateToast(id: string, options: ZToastOptions, forceUpdate: boolean): void {
  const existing = recordsById.get(id);
  const status = normalizeStatus(options.status);

  if (existing && !existing.removed) {
    const nextPosition = options.position ? normalizePosition(options.position) : existing.position;
    const prevGroup = groups.get(existing.position);

    if (prevGroup && nextPosition !== existing.position) {
      const idx = prevGroup.items.indexOf(existing);

      if (idx !== -1) {
        prevGroup.items.splice(idx, 1);
      }

      existing.cleanupResize?.();
      recalculateGroupLayout(prevGroup);
      cleanupGroupIfEmpty(prevGroup);

      const nextGroup = getOrCreateGroup(nextPosition);

      existing.position = nextPosition;
      nextGroup.items.unshift(existing);
      nextGroup.el.prepend(existing.el);

      if (nextGroup.resizeObserver) {
        nextGroup.resizeObserver.observe(existing.el);
        existing.cleanupResize = () => nextGroup.resizeObserver?.unobserve(existing.el);
      }
    }

    const activeGroup = getOrCreateGroup(existing.position);

    existing.status = status;
    existing.options = forceUpdate ? { ...existing.options, ...options, id } : { ...options, id };

    if (existing.timerId !== null) {
      window.clearTimeout(existing.timerId);
      existing.timerId = null;
      existing.startedAt = null;
    }

    const nextDuration = resolveDuration(existing.options, status);

    existing.duration = nextDuration;
    existing.remainingMs = nextDuration;

    renderToastContents(existing);
    existing.measuredHeight = measureRecordHeight(existing);
    recalculateGroupLayout(activeGroup);
    startItemTimer(existing, activeGroup);

    return;
  }

  const position = normalizePosition(options.position);
  const group = getOrCreateGroup(position);
  const el = document.createElement('li');
  const duration = resolveDuration(options, status);

  el.setAttribute('data-mounted', 'false');
  el.setAttribute('data-removed', 'false');

  const record: ToastRecord = {
    id,
    position,
    status,
    options: { ...options, id },
    el,
    measuredHeight: 0,
    duration,
    remainingMs: duration,
    startedAt: null,
    timerId: null,
    removed: false,
    dismissible: options.dismissible ?? globalConfig.dismissible,
    swiping: false,
    cleanupResize: null,
  };

  renderToastContents(record);
  attachSwipeHandlers(record);

  group.items.unshift(record);
  group.el.prepend(el);
  recordsById.set(id, record);
  syncVisibilityListener();

  if (group.resizeObserver) {
    group.resizeObserver.observe(el);
    record.cleanupResize = () => group.resizeObserver?.unobserve(el);
  }

  record.measuredHeight = measureRecordHeight(record);
  recalculateGroupLayout(group);

  window.requestAnimationFrame(() => {
    if (record.removed) {
      return;
    }

    el.setAttribute('data-mounted', 'true');
    startItemTimer(record, group);
  });
}

function enqueueWhenBodyReady(task: () => void): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.body) {
    task();

    return;
  }

  pendingBodyQueue.push(task);

  if (!isBodyWaitAttached) {
    isBodyWaitAttached = true;
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        isBodyWaitAttached = false;

        while (pendingBodyQueue.length > 0) {
          const next = pendingBodyQueue.shift();

          next?.();
        }
      },
      { once: true },
    );
  }
}

function dispatchToast(
  input: string | ZToastOptions,
  extra?: ZToastOptions,
  presetStatus?: ZToastStatus,
  forceUpdate: boolean = false,
): string {
  const options = normalizeOptions(input, extra);

  if (presetStatus) {
    options.status = presetStatus;
  }

  const id = options.id ?? `z-toast-${randomString(6)}`;

  enqueueWhenBodyReady(() => {
    mountOrUpdateToast(id, options, forceUpdate);
  });

  return id;
}

function resolvePromiseBranch<T>(
  branch: string | ZToastOptions | ((value: T) => string | ZToastOptions) | undefined,
  value: T,
): ZToastOptions | null {
  if (!branch) {
    return null;
  }

  const resolved = typeof branch === 'function' ? branch(value) : branch;

  return normalizeOptions(resolved);
}

function createZToast(): ZToast {
  const fn = ((input: string | ZToastOptions, options?: ZToastOptions): string =>
    dispatchToast(input, options)) as ZToast;

  fn.message = (input, options) => dispatchToast(input, options, 'default');
  fn.success = (input, options) => dispatchToast(input, options, 'success');
  fn.danger = (input, options) => dispatchToast(input, options, 'danger');
  fn.error = (input, options) => dispatchToast(input, options, 'danger');
  fn.warning = (input, options) => dispatchToast(input, options, 'warning');
  fn.info = (input, options) => dispatchToast(input, options, 'info');
  fn.loading = (input, options) => dispatchToast(input, options, 'loading');

  fn.update = (id, input, options) => {
    const normalized = normalizeOptions(input, options);

    normalized.id = id;

    return dispatchToast(normalized, undefined, undefined, true);
  };

  fn.dismiss = (id?: string) => {
    if (id === undefined) {
      pendingBodyQueue.length = 0;

      for (const record of Array.from(recordsById.values())) {
        dismissToastRecord(record, 'manual');
      }

      return;
    }

    const record = recordsById.get(id);

    if (record) {
      dismissToastRecord(record, 'manual');
    }
  };

  fn.config = (options?: ZToastGlobalConfig) => {
    if (options) {
      if (options.position && VALID_POSITIONS.has(options.position)) {
        globalConfig.position = options.position;
      }

      if (typeof options.duration === 'number') {
        globalConfig.duration = options.duration;
      }

      if (typeof options.max === 'number' && options.max > 0) {
        globalConfig.max = options.max;
      }

      if (typeof options.expand === 'boolean') {
        globalConfig.expand = options.expand;
      }

      if (typeof options.dismissible === 'boolean') {
        globalConfig.dismissible = options.dismissible;
      }

      if (typeof options.closeButton === 'boolean') {
        globalConfig.closeButton = options.closeButton;
      }

      if (typeof options.richColors === 'boolean') {
        globalConfig.richColors = options.richColors;
      }

      if (typeof options.blur === 'boolean') {
        globalConfig.blur = options.blur;
      }

      if (options.gap !== undefined) {
        globalConfig.gap = options.gap;
      }

      if (options.offset !== undefined) {
        globalConfig.offset = options.offset;
      }

      if (options.cls !== undefined) {
        globalConfig.cls = parsePartMap(options.cls, 'toaster');
      }

      if (options.stl !== undefined) {
        globalConfig.stl = parsePartMap(options.stl, 'toaster');
      }

      if (options.i18n) {
        globalConfig.i18n = { ...globalConfig.i18n, ...options.i18n };
      }

      for (const group of groups.values()) {
        applyGroupConfigAttributes(group);
        recalculateGroupLayout(group);
      }
    }

    return {
      ...globalConfig,
      cls: { ...globalConfig.cls },
      stl: { ...globalConfig.stl },
      i18n: { ...globalConfig.i18n },
    };
  };

  fn.promise = <T>(
    promiseInput: Promise<T> | (() => Promise<T>),
    options: ZToastPromiseOptions<T>,
  ): ZToastPromiseResult<T> => {
    const loadingOpts = normalizeOptions(options.loading);
    const id = dispatchToast(
      {
        ...loadingOpts,
        ...(options.id ? { id: options.id } : {}),
        ...(options.position ? { position: options.position } : {}),
      },
      undefined,
      'loading',
    );

    const rawPromise = typeof promiseInput === 'function' ? promiseInput() : promiseInput;
    const trackedPromise = rawPromise
      .then(data => {
        const successOpts = resolvePromiseBranch(options.success, data);

        if (successOpts) {
          dispatchToast(
            {
              ...successOpts,
              id,
              ...(options.position ? { position: options.position } : {}),
              status: 'success',
            },
            undefined,
            'success',
          );
        } else {
          fn.dismiss(id);
        }

        return data;
      })
      .catch(error => {
        const errorBranch = options.danger ?? options.error;
        const errorOpts = resolvePromiseBranch(errorBranch, error);

        if (errorOpts) {
          dispatchToast(
            {
              ...errorOpts,
              id,
              ...(options.position ? { position: options.position } : {}),
              status: 'danger',
            },
            undefined,
            'danger',
          );
        } else {
          fn.dismiss(id);
        }

        throw error;
      })
      .finally(() => options.finally?.());

    // Attach internal rejection sink so fire-and-forget usage does not trigger UnhandledPromiseRejection
    trackedPromise.catch(() => undefined);

    return {
      id,
      unwrap: () => trackedPromise,
      then: trackedPromise.then.bind(trackedPromise),
      catch: trackedPromise.catch.bind(trackedPromise),
      finally: trackedPromise.finally.bind(trackedPromise),
    };
  };

  return fn;
}

export const zToast: ZToast = createZToast();
