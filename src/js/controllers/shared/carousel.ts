import { type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { Controller } from '$js/controllers/controller';

export interface DragVelocitySample {
  time: number;
  value: number;
}

export interface CarouselSlideEntry {
  index: number;
  el: HTMLElement;
  value: string;
}

export interface CarouselControlEntry {
  el: HTMLElement;
  trigger: HTMLElement;
  command: string;
}

const NAMED_EASINGS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

const INTERACTIVE_DRAG_BLOCKER_SELECTOR = [
  'button',
  'input',
  'textarea',
  'select',
  'label',
  '[contenteditable="true"]',
  '[data-no-drag]',
  '.z-slidenav',
  '[data-slider-item]',
  '[data-slideshow-item]',
  'z-input-range',
  'z-select',
  'z-rte',
].join(', ');

const VELOCITY_WINDOW_MS = 120;

export function clampNumber(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function sampleCubicBezier(p1: number, p2: number, t: number): number {
  const inv = 1 - t;

  return 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t;
}

function sampleCubicBezierDerivative(p1: number, p2: number, t: number): number {
  const inv = 1 - t;

  return 3 * inv * inv * p1 + 6 * inv * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

function solveCubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  let t = x;

  for (let i = 0; i < 6; i++) {
    const err = sampleCubicBezier(x1, x2, t) - x;

    if (Math.abs(err) < 1e-5) {
      return sampleCubicBezier(y1, y2, t);
    }

    const deriv = sampleCubicBezierDerivative(x1, x2, t);

    if (Math.abs(deriv) < 1e-6) {
      break;
    }

    t = clampNumber(t - err / deriv, 0, 1);
  }

  let lo = 0;
  let hi = 1;

  t = x;

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) * 0.5;
    const val = sampleCubicBezier(x1, x2, mid);

    if (Math.abs(val - x) < 1e-5) {
      t = mid;
      break;
    }

    if (val < x) {
      lo = mid;
    } else {
      hi = mid;
    }

    t = mid;
  }

  return sampleCubicBezier(y1, y2, t);
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

export function recordVelocitySample(samples: DragVelocitySample[], value: number): void {
  const now = performance.now();
  const cutoff = now - VELOCITY_WINDOW_MS;

  samples.push({ time: now, value });

  while (samples.length > 2 && samples[0].time < cutoff) {
    samples.shift();
  }
}

export function computeVelocity(samples: DragVelocitySample[]): number {
  if (samples.length < 2) {
    return 0;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = last.time - first.time;

  if (elapsed <= 0) {
    return 0;
  }

  return (last.value - first.value) / elapsed;
}

export abstract class CarouselBase extends Controller {
  protected override readonly 'cls-default-element': string = 'active';

  protected override $cls: { active: string; dragging: string; [key: string]: string } = {
    active: 'z-active',
    dragging: 'z-dragging',
  };

  protected abstract readonly itemAttr: 'data-slider-item' | 'data-slideshow-item';

  protected abstract readonly ignoreAttr: 'data-slider-ignore' | 'data-slideshow-ignore';

  protected abstract readonly listSelector: string;

  protected abstract readonly navSelector: string;

  protected abstract readonly defaultDuration: number;

  protected abstract readonly defaultEasing: string;

  protected _active: number = -1;

  @property({ type: Number, noAccessor: true })
  get active(): number {
    return this._active;
  }

  set active(value: number) {
    const old = this._active;

    if (old === value) {
      return;
    }

    this._active = value;
    this.requestUpdate('active', old);
  }

  @property({ type: Boolean })
  finite: boolean = false;

  @property({ type: Boolean })
  autoplay: boolean = false;

  @property({ type: Number, attribute: 'autoplay-interval' })
  'autoplay-interval': number = 7000;

  @property({ type: Boolean, attribute: 'no-pause-on-hover' })
  'no-pause-on-hover': boolean = false;

  @property({ type: Boolean, attribute: 'no-drag' })
  'no-drag': boolean = false;

  @property({ type: Number })
  duration: number = 0;

  @property({ type: Number })
  velocity: number = 1;

  @property({ type: String })
  easing: string = '';

  protected currentIndex: number = -1;

  protected isHovered: boolean = false;

  protected isFocusWithin: boolean = false;

  protected isDragging: boolean = false;

  private autoplayTimer: number | null = null;

  private suppressNextClick: boolean = false;

  private suppressClickTimer: number | null = null;

  private isBaseEventsBound: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.bindBaseEvents();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopAutoplay();
    this.clearSuppressClick();
    this.unbindBaseEvents();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (changedProperties.has('autoplay') || changedProperties.has('autoplay-interval')) {
      const list = this.resolveList();

      if (list) {
        list.setAttribute('aria-live', this.autoplay ? 'off' : 'polite');
      }

      if (this.autoplay) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }

    if (changedProperties.has('cls')) {
      const prevActive = this.splitClasses(this.$prevCls.active ?? '');
      const prevDragging = this.splitClasses(this.$prevCls.dragging ?? '');
      const list = this.resolveList();

      if (prevActive.length > 0 && this.$prevCls.active !== this.$cls.active) {
        if (list) {
          for (const slide of this.resolveSlides(list)) {
            slide.el.classList.remove(...prevActive);
          }
        }

        for (const control of this.resolveControlElements()) {
          control.el.classList.remove(...prevActive);
          control.trigger.classList.remove(...prevActive);
        }
      }

      if (list && prevDragging.length > 0 && this.$prevCls.dragging !== this.$cls.dragging) {
        list.classList.remove(...prevDragging);
      }

      this.refresh();
    }
  }

  protected toggleClassList(el: Element, raw: string, force: boolean): void {
    for (const token of this.splitClasses(raw)) {
      el.classList.toggle(token, force);
    }
  }

  protected hasClassList(el: Element, raw: string): boolean {
    const tokens = this.splitClasses(raw);

    return tokens.length > 0 && tokens.every(token => el.classList.contains(token));
  }

  public index(): number {
    return this.currentIndex;
  }

  public count(): number {
    const list = this.resolveList();

    return list ? this.resolveSlides(list).length : 0;
  }

  public next(animate: boolean = true): Promise<boolean> {
    return this.show('next', animate);
  }

  public previous(animate: boolean = true): Promise<boolean> {
    return this.show('previous', animate);
  }

  public startAutoplay(): void {
    this.stopAutoplay();

    if (!this.autoplay || typeof window === 'undefined') {
      return;
    }

    const intervalMs =
      Number.isFinite(this['autoplay-interval']) && this['autoplay-interval'] > 0
        ? Math.max(500, this['autoplay-interval'])
        : 7000;

    this.autoplayTimer = window.setInterval(() => {
      if (this.shouldSkipAutoplayTick()) {
        return;
      }

      void this.show('next', true);
    }, intervalMs);
  }

  public stopAutoplay(): void {
    if (this.autoplayTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  public abstract show(
    target: number | 'next' | 'previous' | 'first' | 'last' | string,
    animate?: boolean,
  ): Promise<boolean>;

  protected isDragEnabled(): boolean {
    return !this['no-drag'] && this.getAttribute('draggable') !== 'false';
  }

  protected isPauseOnHoverEnabled(): boolean {
    return !this['no-pause-on-hover'] && this.getAttribute('pause-on-hover') !== 'false';
  }

  protected isOwnedElement(el: Element): boolean {
    return el.closest('z-slider, z-slideshow') === this;
  }

  protected isInteractiveDragBlocker(target: Element): boolean {
    return Boolean(target.closest(INTERACTIVE_DRAG_BLOCKER_SELECTOR));
  }

  protected resolveEffectiveDuration(fallbackMs?: number): number {
    if (this.prefersReducedMotion()) {
      return 0;
    }

    if (Number.isFinite(this.duration) && this.duration > 0) {
      return this.duration;
    }

    if (this.hasAttribute('duration') && this.duration === 0) {
      return 0;
    }

    const base = fallbackMs ?? this.defaultDuration;
    const vel = Number.isFinite(this.velocity) && this.velocity > 0 ? this.velocity : 1;

    return Math.max(120, Math.round(base / vel));
  }

  protected resolveEffectiveEasing(): string {
    return this.easing.trim() || this.defaultEasing;
  }

  protected scheduleSuppressClick(): void {
    this.suppressNextClick = true;

    if (this.suppressClickTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.suppressClickTimer);
    }

    if (typeof window !== 'undefined') {
      this.suppressClickTimer = window.setTimeout(() => {
        this.suppressNextClick = false;
        this.suppressClickTimer = null;
      }, 100);
    }
  }

  protected clearSuppressClick(): void {
    this.suppressNextClick = false;

    if (this.suppressClickTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.suppressClickTimer);
      this.suppressClickTimer = null;
    }
  }

  protected resolveList(): HTMLElement | null {
    return (
      Array.from(this.querySelectorAll<HTMLElement>(this.listSelector)).find(el =>
        this.isOwnedElement(el),
      ) ?? null
    );
  }

  protected resolveSlides(list: HTMLElement): CarouselSlideEntry[] {
    const entries: CarouselSlideEntry[] = [];

    for (const child of Array.from(list.children)) {
      if (
        !(child instanceof HTMLElement) ||
        child.tagName === 'SCRIPT' ||
        child.tagName === 'TEMPLATE' ||
        child.hasAttribute(this.ignoreAttr)
      ) {
        continue;
      }

      const index = entries.length;
      const value = child.dataset.value ?? (child.id ? child.id : String(index));

      entries.push({ index, el: child, value });
    }

    return entries;
  }

  protected resolveNavLists(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(this.navSelector)).filter(el =>
      this.isOwnedElement(el),
    );
  }

  protected syncNavStructure(slides: CarouselSlideEntry[]): void {
    const navLists = this.resolveNavLists();

    for (const nav of navLists) {
      nav.setAttribute('role', 'tablist');

      if (
        nav.classList.contains('z-dotnav-vertical') ||
        nav.classList.contains('z-thumbnav-vertical')
      ) {
        nav.setAttribute('aria-orientation', 'vertical');
      } else {
        nav.removeAttribute('aria-orientation');
      }

      const directChildren = Array.from(nav.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child.tagName !== 'SCRIPT' &&
          child.tagName !== 'TEMPLATE',
      );
      const allAuto =
        directChildren.length > 0 &&
        directChildren.every(el => el.hasAttribute('data-auto-nav-item'));

      if (directChildren.length === 0 || allAuto) {
        if (directChildren.length !== slides.length || !allAuto) {
          nav.replaceChildren();

          for (let i = 0; i < slides.length; i++) {
            const li = document.createElement('li');
            const btn = document.createElement('button');

            li.setAttribute('data-auto-nav-item', '');
            li.setAttribute(this.itemAttr, String(i));
            li.setAttribute('role', 'presentation');
            btn.type = 'button';
            li.appendChild(btn);
            nav.appendChild(li);
          }
        }
      } else {
        directChildren.forEach((child, idx) => {
          if (!child.hasAttribute(this.itemAttr)) {
            child.setAttribute(this.itemAttr, String(idx));
          }

          if (child.tagName === 'LI' && !child.hasAttribute('role')) {
            child.setAttribute('role', 'presentation');
          }
        });
      }
    }
  }

  protected resolveControlElements(): CarouselControlEntry[] {
    const selector = `[${this.itemAttr}], [data-part="previous"], [data-part="next"], .z-slidenav-previous, .z-slidenav-next`;
    const matched = Array.from(this.querySelectorAll<HTMLElement>(selector)).filter(el =>
      this.isOwnedElement(el),
    );
    const seen = new Set<HTMLElement>();
    const entries: CarouselControlEntry[] = [];

    for (const el of matched) {
      if (seen.has(el)) {
        continue;
      }

      seen.add(el);

      let command = el.getAttribute(this.itemAttr)?.trim() ?? '';

      if (!command) {
        const part = el.getAttribute('data-part')?.trim();

        if (part === 'previous' || part === 'next') {
          command = part;
        } else if (el.classList.contains('z-slidenav-previous')) {
          command = 'previous';
        } else if (el.classList.contains('z-slidenav-next')) {
          command = 'next';
        }
      }

      if (!command) {
        continue;
      }

      const isDirectTrigger = el.matches('a, button');
      const trigger = isDirectTrigger ? el : (el.querySelector<HTMLElement>('a, button') ?? el);

      entries.push({ el, trigger, command });
    }

    return entries;
  }

  protected isAtBoundary(command: string, activeIndex: number, maxIndex: number): boolean {
    if (!this.finite) {
      return false;
    }

    if (command === 'previous') {
      return activeIndex <= 0;
    }

    if (command === 'next') {
      return activeIndex >= maxIndex;
    }

    return false;
  }

  protected syncAriaAndControls(
    list: HTMLElement,
    slides: CarouselSlideEntry[],
    activeIndex: number,
    maxIndex: number,
    allowedNavIndices: Set<number> | null,
  ): void {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'region');
    }

    if (!this.hasAttribute('aria-roledescription')) {
      this.setAttribute('aria-roledescription', 'carousel');
    }

    if (!list.id) {
      list.id = `${this.eventPrefix}-list-${this.uid}`;
    }

    list.setAttribute('aria-live', this.autoplay ? 'off' : 'polite');

    if (list.tagName === 'UL' && !list.hasAttribute('role')) {
      list.setAttribute('role', 'presentation');
    }

    const navLists = this.resolveNavLists();
    const hasNav = navLists.length > 0;
    const total = slides.length;

    slides.forEach(slide => {
      if (!slide.el.id) {
        slide.el.id = `${this.eventPrefix}-slide-${this.uid}-${slide.index}`;
      }

      slide.el.setAttribute('role', hasNav ? 'tabpanel' : 'group');

      if (hasNav) {
        slide.el.removeAttribute('aria-roledescription');
      } else {
        slide.el.setAttribute('aria-roledescription', 'slide');
      }

      if (!slide.el.hasAttribute('aria-label')) {
        slide.el.setAttribute('aria-label', `${slide.index + 1} of ${total}`);
      }
    });

    const controls = this.resolveControlElements();
    let firstVisibleNavTrigger: HTMLElement | null = null;
    let hasActiveTabFocusStop = false;

    for (const control of controls) {
      const { el, trigger, command } = control;

      if (command === 'previous' || command === 'next') {
        if (trigger.tagName === 'A' && !trigger.hasAttribute('role')) {
          trigger.setAttribute('role', 'button');
        }

        trigger.setAttribute('aria-controls', list.id);

        if (!trigger.hasAttribute('aria-label') && !trigger.hasAttribute('aria-labelledby')) {
          trigger.setAttribute(
            'aria-label',
            command === 'previous' ? 'Previous slide' : 'Next slide',
          );
        }

        el.hidden = maxIndex <= 0;

        const atBoundary = this.isAtBoundary(command, activeIndex, maxIndex);

        el.classList.toggle('z-invisible', atBoundary);

        if (trigger !== el) {
          trigger.classList.toggle('z-invisible', atBoundary);
        }

        if (atBoundary) {
          trigger.setAttribute('aria-disabled', 'true');
          trigger.setAttribute('tabindex', '-1');
        } else {
          trigger.removeAttribute('aria-disabled');

          if (
            trigger.tagName !== 'BUTTON' &&
            !(trigger.tagName === 'A' && trigger.hasAttribute('href'))
          ) {
            trigger.setAttribute('tabindex', '0');
          } else if (trigger.getAttribute('tabindex') === '-1') {
            trigger.removeAttribute('tabindex');
          }
        }

        continue;
      }

      const resolvedIdx = this.resolveCommandToIndex(command, slides);

      if (resolvedIdx === null) {
        continue;
      }

      const isActive = resolvedIdx === activeIndex;
      const targetSlide = slides[resolvedIdx];
      const isHidden =
        maxIndex <= 0 ||
        resolvedIdx > maxIndex ||
        (allowedNavIndices !== null && !allowedNavIndices.has(resolvedIdx));

      el.hidden = isHidden;
      this.toggleClassList(el, this.$cls.active, isActive);

      if (trigger !== el) {
        this.toggleClassList(trigger, this.$cls.active, isActive);
      }

      if (el.closest(this.navSelector)) {
        trigger.setAttribute('role', 'tab');
        trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
        trigger.setAttribute('tabindex', isActive && !isHidden ? '0' : '-1');

        if (isActive && !isHidden) {
          hasActiveTabFocusStop = true;
        }

        if (!firstVisibleNavTrigger && !isHidden) {
          firstVisibleNavTrigger = trigger;
        }
      }

      if (targetSlide) {
        trigger.setAttribute('aria-controls', targetSlide.el.id);
      }

      if (!trigger.hasAttribute('aria-label') && !trigger.hasAttribute('aria-labelledby')) {
        const hasText = (trigger.textContent ?? '').trim().length > 0;
        const hasAltImg = Boolean(trigger.querySelector('img[alt]:not([alt=""])'));

        if (!hasText && !hasAltImg) {
          trigger.setAttribute('aria-label', `Slide ${resolvedIdx + 1}`);
        }
      }
    }

    if (!hasActiveTabFocusStop && firstVisibleNavTrigger) {
      firstVisibleNavTrigger.setAttribute('tabindex', '0');
    }

    for (const nav of navLists) {
      nav.hidden = maxIndex <= 0;
    }
  }

  protected resolveCommandToIndex(command: string, slides: CarouselSlideEntry[]): number | null {
    const trimmed = command.trim();

    if (!trimmed) {
      return null;
    }

    if (/^\d+$/.test(trimmed)) {
      const idx = Number.parseInt(trimmed, 10);

      return idx >= 0 && idx < slides.length ? idx : null;
    }

    const matched = slides.find(slide => slide.value === trimmed || slide.el.id === trimmed);

    return matched ? matched.index : null;
  }

  protected unwrapSlideTemplate(slide: HTMLElement, index: number): void {
    this.unwrapTemplate(slide, { index, slide });
  }

  protected syncSlideMedia(slides: CarouselSlideEntry[], activeIndices: Set<number>): void {
    for (const slide of slides) {
      const videos = Array.from(slide.el.querySelectorAll('video'));

      if (videos.length === 0) {
        continue;
      }

      const isActive = activeIndices.has(slide.index);

      for (const video of videos) {
        if (isActive) {
          if (video.autoplay || video.hasAttribute('data-autoplay')) {
            void video.play().catch(() => {});
          }
        } else if (!video.hasAttribute('data-keep-playing') && !video.paused) {
          video.pause();
        }
      }
    }
  }

  protected createSlideDetail(
    index: number,
    previousIndex: number,
    slide: HTMLElement | null,
    extra?: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      index,
      previousIndex,
      slide,
      ...extra,
    };
  }

  private shouldSkipAutoplayTick(): boolean {
    if (!this.isConnected || typeof document === 'undefined' || document.hidden) {
      return true;
    }

    if (this.isDragging) {
      return true;
    }

    if (this.getClientRects().length === 0) {
      return true;
    }

    if (this.isPauseOnHoverEnabled() && this.isHovered) {
      return true;
    }

    if (this.isFocusWithin && document.activeElement !== this) {
      return true;
    }

    return false;
  }

  private bindBaseEvents(): void {
    if (this.isBaseEventsBound) {
      return;
    }

    this.isBaseEventsBound = true;
    this.addEventListener('click', this.handleCaptureSuppressClick, true);
    this.addEventListener('click', this.handleControlClick);
    this.addEventListener('keydown', this.handleKeyDown);
    this.addEventListener('dragstart', this.handleDragStart);
    this.addEventListener('mouseenter', this.handleMouseEnter);
    this.addEventListener('mouseleave', this.handleMouseLeave);
    this.addEventListener('focusin', this.handleFocusIn);
    this.addEventListener('focusout', this.handleFocusOut);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private unbindBaseEvents(): void {
    if (!this.isBaseEventsBound) {
      return;
    }

    this.isBaseEventsBound = false;
    this.removeEventListener('click', this.handleCaptureSuppressClick, true);
    this.removeEventListener('click', this.handleControlClick);
    this.removeEventListener('keydown', this.handleKeyDown);
    this.removeEventListener('dragstart', this.handleDragStart);
    this.removeEventListener('mouseenter', this.handleMouseEnter);
    this.removeEventListener('mouseleave', this.handleMouseLeave);
    this.removeEventListener('focusin', this.handleFocusIn);
    this.removeEventListener('focusout', this.handleFocusOut);

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleCaptureSuppressClick = (event: MouseEvent): void => {
    if (!this.suppressNextClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.clearSuppressClick();
  };

  private handleDragStart = (event: DragEvent): void => {
    if (!this.isDragEnabled()) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const list = this.resolveList();

    if (target && list && list.contains(target)) {
      event.preventDefault();
    }
  };

  private handleMouseEnter = (): void => {
    this.isHovered = true;
  };

  private handleMouseLeave = (): void => {
    this.isHovered = false;
  };

  private handleFocusIn = (): void => {
    this.isFocusWithin = true;
  };

  private handleFocusOut = (event: FocusEvent): void => {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;

    if (!nextTarget || !this.contains(nextTarget)) {
      this.isFocusWithin = false;
    }
  };

  private handleVisibilityChange = (): void => {
    if (!this.autoplay) {
      return;
    }

    if (document.hidden) {
      this.stopAutoplay();
    } else {
      this.startAutoplay();
    }
  };

  private handleControlClick = (event: MouseEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;

    if (!target) {
      return;
    }

    const selector = `[${this.itemAttr}], [data-part="previous"], [data-part="next"], .z-slidenav-previous, .z-slidenav-next`;
    const controlEl = target.closest<HTMLElement>(selector);

    if (!controlEl || !this.isOwnedElement(controlEl)) {
      return;
    }

    const controlEntry = this.resolveControlElements().find(entry => entry.el === controlEl);

    if (!controlEntry) {
      return;
    }

    if (
      controlEntry.el.classList.contains('z-disabled') ||
      controlEntry.trigger.getAttribute('aria-disabled') === 'true'
    ) {
      event.preventDefault();

      return;
    }

    if (controlEntry.trigger.tagName === 'A') {
      event.preventDefault();
    }

    void this.show(controlEntry.command, true);
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;

    if (!target) {
      return;
    }

    if (target.closest('z-slider, z-slideshow, z-switcher') !== this) {
      return;
    }

    if (target.matches('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    const navList = target.closest<HTMLElement>(this.navSelector);

    if (navList && this.isOwnedElement(navList)) {
      this.handleNavKeyDown(event, navList, target);

      return;
    }

    const rtl = this.isRtl();

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void this.show(rtl ? 'next' : 'previous', true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      void this.show(rtl ? 'previous' : 'next', true);
    }
  };

  private handleNavKeyDown(event: KeyboardEvent, navList: HTMLElement, target: HTMLElement): void {
    const rtl = this.isRtl();
    const isVertical = navList.getAttribute('aria-orientation') === 'vertical';
    let cmd: 'previous' | 'next' | 'first' | 'last' | string | null = null;

    if (isVertical) {
      if (event.key === 'ArrowUp') {
        cmd = 'previous';
      } else if (event.key === 'ArrowDown') {
        cmd = 'next';
      }
    } else {
      if (event.key === 'ArrowLeft') {
        cmd = rtl ? 'next' : 'previous';
      } else if (event.key === 'ArrowRight') {
        cmd = rtl ? 'previous' : 'next';
      }
    }

    if (event.key === 'Home') {
      cmd = 'first';
    } else if (event.key === 'End') {
      cmd = 'last';
    } else if (event.key === 'Enter' || event.key === ' ') {
      const controlEl = target.closest<HTMLElement>(`[${this.itemAttr}]`);

      if (controlEl && this.isOwnedElement(controlEl)) {
        cmd = controlEl.getAttribute(this.itemAttr);
      }
    }

    if (!cmd) {
      return;
    }

    event.preventDefault();

    void this.show(cmd, true).then(changed => {
      if (!changed) {
        return;
      }

      const activeSelector = this.splitClasses(this.$cls.active)
        .map(token => `.${CSS.escape(token)}`)
        .join('');
      const activeTab = activeSelector
        ? navList.querySelector<HTMLElement>(
            `${activeSelector} a, ${activeSelector} button, ${activeSelector}[role="tab"]`,
          )
        : null;

      activeTab?.focus();
    });
  }
}
