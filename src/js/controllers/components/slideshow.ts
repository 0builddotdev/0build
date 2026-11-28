import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  applyDeckSlideFrame,
  clampNumber,
  clearDeckSlideStyles,
  createDeckTransition,
} from '../../shared/helpers/animation';
import {
  computeVelocity,
  recordVelocitySample,
  startPointerTrack,
  type DragVelocitySample,
} from '../../shared/helpers/gesture';
import { CarouselBase, type CarouselSlideEntry } from '../shared/carousel';

export type SlideshowAnimation = 'slide' | 'fade' | 'scale' | 'pull' | 'push';

const DRAG_THRESHOLD_PX = 6;
const FLICK_VELOCITY_THRESHOLD = 0.35;
const MIN_FLICK_DISTANCE_PX = 12;

@customElement('z-slideshow')
export class Slideshow extends CarouselBase {
  protected readonly eventPrefix = 'z-slideshow' as const;

  protected readonly itemAttr = 'data-slideshow-item' as const;

  protected readonly ignoreAttr = 'data-slideshow-ignore' as const;

  protected readonly listSelector = '.z-slideshow-items, [data-part="items"], [data-part="list"]';

  protected readonly navSelector = '.z-slideshow-nav, [data-part="nav"]';

  protected readonly defaultDuration = 450;

  protected readonly defaultEasing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  @property({ type: String })
  animation: SlideshowAnimation = 'slide';

  @property({ type: String })
  ratio: string = '16:9';

  @property({ type: String, attribute: 'min-height' })
  'min-height': string = '';

  @property({ type: String, attribute: 'max-height' })
  'max-height': string = '';

  private boundList: HTMLElement | null = null;

  private readonly deckTransition = createDeckTransition();

  private stopPointerTrack: (() => void) | null = null;

  private startX: number = 0;

  private startY: number = 0;

  private dragDir: 1 | -1 = 1;

  private dragNextIndex: number = -1;

  private dragPercent: number = 0;

  private dragSamples: DragVelocitySample[] = [];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.finalizeActiveTransition();
    this.resetDragVisuals();
    this.detachListListeners();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeSlideshow();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (this.hasChanged(changedProperties, ['ratio', 'min-height', 'max-height'])) {
      const list = this.resolveList();

      if (list) {
        this.syncContainerSizing(list);
      }
    }

    if (changedProperties.has('finite')) {
      const list = this.resolveList();

      if (list) {
        const slides = this.resolveSlides(list);

        this.syncStaticState(list, slides);
      }
    }

    if (changedProperties.has('active') && this.active >= 0) {
      void this.show(this.active, true);
    }
  }

  public refresh(): void {
    this.finalizeActiveTransition();
    this.resetDragVisuals();
    this.detachListListeners();
    this.initializeSlideshow();
  }

  public async show(
    target: number | 'next' | 'previous' | 'first' | 'last' | string,
    animate: boolean = true,
  ): Promise<boolean> {
    const list = this.resolveList();

    if (!list) {
      return false;
    }

    const slides = this.resolveSlides(list);

    if (slides.length === 0) {
      return false;
    }

    this.finalizeActiveTransition();

    const resolved = this.resolveTarget(target, slides);

    if (!resolved) {
      return false;
    }

    const { targetIndex, dir } = resolved;

    if (targetIndex === this.currentIndex) {
      return true;
    }

    const previousIndex = this.currentIndex;
    const prevSlide = previousIndex >= 0 ? (slides[previousIndex] ?? null) : null;
    const nextSlide = slides[targetIndex] ?? null;

    if (!nextSlide) {
      return false;
    }

    const detail = this.createSlideDetail(targetIndex, previousIndex, nextSlide.el, {
      previousSlide: prevSlide?.el ?? null,
      value: nextSlide.value,
      dir,
    });

    if (!this.emit('before-change', detail, true)) {
      this._active = previousIndex;

      return false;
    }

    if (prevSlide && !this.emit('before-hide', detail, true)) {
      this._active = previousIndex;

      return false;
    }

    if (!this.emit('before-show', detail, true)) {
      this._active = previousIndex;

      return false;
    }

    return this.runTransition(list, slides, prevSlide, nextSlide, dir, 0, animate, detail);
  }

  private initializeSlideshow(): void {
    const list = this.resolveList();

    if (!list) {
      this.isInitialized = true;

      return;
    }

    this.syncContainerSizing(list);

    const slides = this.resolveSlides(list);

    this.syncNavStructure(slides);

    const initialIndex = this.resolveInitialIndex(slides);

    this.currentIndex = initialIndex;
    this._active = initialIndex;
    this.syncStaticState(list, slides);
    this.bindListListeners(list);
    this.isInitialized = true;

    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  private normalizeCssLength(raw: string): string {
    const trimmed = raw.trim();

    if (!trimmed) {
      return '';
    }

    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return `${trimmed}px`;
    }

    return trimmed;
  }

  private syncContainerSizing(list: HTMLElement): void {
    const rawRatio = this.ratio.trim();

    if (rawRatio === 'false' || rawRatio === 'none') {
      list.style.removeProperty('--z-slideshow-ratio');
      list.style.aspectRatio = 'auto';
    } else if (rawRatio) {
      const normalized = rawRatio.replace(':', ' / ');

      list.style.setProperty('--z-slideshow-ratio', normalized);
      list.style.aspectRatio = normalized;
    } else {
      list.style.removeProperty('--z-slideshow-ratio');
      list.style.removeProperty('aspect-ratio');
    }

    const minH = this.normalizeCssLength(this['min-height']);
    const maxH = this.normalizeCssLength(this['max-height']);

    if (minH) {
      list.style.minHeight = minH;
    } else {
      list.style.removeProperty('min-height');
    }

    if (maxH) {
      list.style.maxHeight = maxH;
    } else {
      list.style.removeProperty('max-height');
    }
  }

  private resolveInitialIndex(slides: CarouselSlideEntry[]): number {
    if (slides.length === 0) {
      return -1;
    }

    if (this.hasAttribute('active') && this.active >= 0) {
      return this.clampIndex(this.active, slides.length);
    }

    const preActive = slides.find(slide => this.hasClasses(slide.el, this.$cls.active));

    if (preActive) {
      return preActive.index;
    }

    return 0;
  }

  private clampIndex(rawIndex: number, count: number): number {
    if (count === 0) {
      return -1;
    }

    if (this.finite) {
      return clampNumber(rawIndex, 0, count - 1);
    }

    return ((rawIndex % count) + count) % count;
  }

  private resolveTarget(
    target: number | 'next' | 'previous' | 'first' | 'last' | string,
    slides: CarouselSlideEntry[],
  ): { targetIndex: number; dir: 1 | -1 } | null {
    const count = slides.length;

    if (count === 0) {
      return null;
    }

    const current = this.currentIndex >= 0 ? this.currentIndex : 0;

    if (target === 'first') {
      return { targetIndex: 0, dir: current === 0 ? 1 : -1 };
    }

    if (target === 'last') {
      return { targetIndex: count - 1, dir: count - 1 >= current ? 1 : -1 };
    }

    if (target === 'next' || target === 'previous') {
      const step = target === 'next' ? 1 : -1;

      return {
        targetIndex: this.clampIndex(current + step, count),
        dir: step,
      };
    }

    let resolved: number | null = null;

    if (typeof target === 'number') {
      if (Number.isInteger(target)) {
        resolved = target;
      }
    } else {
      resolved = this.resolveCommandToIndex(target, slides);
    }

    if (resolved === null) {
      return null;
    }

    const targetIndex = this.clampIndex(resolved, count);

    return {
      targetIndex,
      dir: targetIndex >= current ? 1 : -1,
    };
  }

  private syncStaticState(list: HTMLElement, slides: CarouselSlideEntry[]): void {
    const activeSet = new Set<number>(this.currentIndex >= 0 ? [this.currentIndex] : []);

    for (const slide of slides) {
      const isActive = activeSet.has(slide.index);

      this.clearSlideInlineStyles(slide.el);

      if (isActive) {
        this.unwrapSlideTemplate(slide.el, slide.index);
      }

      this.toggleClasses(slide.el, this.$cls.active, isActive);
      slide.el.classList.toggle('z-transition-active', isActive);
      slide.el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    }

    this.syncSlideMedia(slides, activeSet);
    this.syncAriaAndControls(list, slides, this.currentIndex, Math.max(0, slides.length - 1), null);
  }

  private clearSlideInlineStyles(el: HTMLElement): void {
    clearDeckSlideStyles(el);
  }

  private applyDeckFrame(
    prevEl: HTMLElement | null,
    nextEl: HTMLElement,
    percent: number,
    effectiveDir: number,
  ): void {
    applyDeckSlideFrame(prevEl, nextEl, percent, effectiveDir, this.animation);
  }

  private finalizeActiveTransition(): void {
    this.deckTransition.finalize();
  }

  private runTransition(
    list: HTMLElement,
    slides: CarouselSlideEntry[],
    prevSlide: CarouselSlideEntry | null,
    nextSlide: CarouselSlideEntry,
    dir: 1 | -1,
    startPercent: number,
    animate: boolean,
    detail: Record<string, unknown>,
  ): Promise<boolean> {
    this.currentIndex = nextSlide.index;
    this._active = nextSlide.index;

    this.unwrapSlideTemplate(nextSlide.el, nextSlide.index);
    this.toggleClasses(nextSlide.el, this.$cls.active, true);
    nextSlide.el.classList.remove('z-transition-active');
    nextSlide.el.setAttribute('aria-hidden', 'false');

    if (prevSlide) {
      prevSlide.el.classList.remove('z-transition-active');
    }

    this.syncAriaAndControls(list, slides, nextSlide.index, Math.max(0, slides.length - 1), null);

    if (prevSlide) {
      this.emit('hide', detail);
    }

    this.emit('show', detail);
    this.emit('change', detail);

    const totalDuration = animate ? this.resolveEffectiveDuration() : 0;
    const clampedStart = clampNumber(startPercent, 0, 1);
    const remainingDuration = Math.round(totalDuration * (1 - clampedStart));
    const effectiveDir = dir * (this.isRtl() ? -1 : 1);

    const finalizeState = () => {
      if (prevSlide) {
        this.clearSlideInlineStyles(prevSlide.el);
        this.toggleClasses(prevSlide.el, this.$cls.active, false);
        prevSlide.el.classList.remove('z-transition-active');
        prevSlide.el.setAttribute('aria-hidden', 'true');
      }

      this.clearSlideInlineStyles(nextSlide.el);
      this.toggleClasses(nextSlide.el, this.$cls.active, true);
      nextSlide.el.classList.add('z-transition-active');
      nextSlide.el.setAttribute('aria-hidden', 'false');

      this.syncSlideMedia(slides, new Set([nextSlide.index]));

      if (prevSlide) {
        this.emit('hidden', detail);
      }

      this.emit('shown', detail);
    };

    if (!animate || remainingDuration <= 0 || !prevSlide || typeof window === 'undefined') {
      finalizeState();

      return Promise.resolve(true);
    }

    this.applyDeckFrame(prevSlide.el, nextSlide.el, clampedStart, effectiveDir);

    return this.deckTransition.animate({
      durationMs: remainingDuration,
      easing: this.resolveEffectiveEasing(),
      isConnected: () => this.isConnected,
      onFrame: eased =>
        this.applyDeckFrame(
          prevSlide.el,
          nextSlide.el,
          clampedStart + (1 - clampedStart) * eased,
          effectiveDir,
        ),
      onFinish: finalizeState,
    });
  }

  private snapBackDraggedTransition(
    prevSlide: CarouselSlideEntry,
    nextSlide: CarouselSlideEntry,
    dir: 1 | -1,
    startPercent: number,
  ): void {
    const effectiveDir = dir * (this.isRtl() ? -1 : 1);
    const clampedStart = clampNumber(startPercent, 0, 1);
    const durationMs = this.resolveEffectiveDuration(220);

    const finalizeSnapBack = () => {
      this.clearSlideInlineStyles(prevSlide.el);
      this.clearSlideInlineStyles(nextSlide.el);
      this.toggleClasses(nextSlide.el, this.$cls.active, false);
      nextSlide.el.classList.remove('z-transition-active');
      nextSlide.el.setAttribute('aria-hidden', 'true');
      this.toggleClasses(prevSlide.el, this.$cls.active, true);
      prevSlide.el.classList.add('z-transition-active');
      prevSlide.el.setAttribute('aria-hidden', 'false');
    };

    if (durationMs <= 0 || clampedStart <= 0 || typeof window === 'undefined') {
      finalizeSnapBack();

      return;
    }

    void this.deckTransition.animate({
      durationMs,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      isConnected: () => this.isConnected,
      onFrame: eased =>
        this.applyDeckFrame(prevSlide.el, nextSlide.el, clampedStart * (1 - eased), effectiveDir),
      onFinish: finalizeSnapBack,
    });
  }

  private bindListListeners(list: HTMLElement): void {
    if (this.boundList === list) {
      return;
    }

    this.detachListListeners();
    this.boundList = list;
    list.addEventListener('pointerdown', this.handlePointerDown);
  }

  private detachListListeners(): void {
    if (!this.boundList) {
      return;
    }

    this.boundList.removeEventListener('pointerdown', this.handlePointerDown);
    this.boundList = null;
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (
      !this.isDragEnabled() ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      event.defaultPrevented
    ) {
      return;
    }

    const list = this.boundList ?? this.resolveList();
    const target = event.target instanceof Element ? event.target : null;

    if (!list || !target || this.isInteractiveDragBlocker(target)) {
      return;
    }

    const slides = this.resolveSlides(list);

    if (slides.length < 2) {
      return;
    }

    this.finalizeActiveTransition();
    this.isDragging = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragNextIndex = -1;
    this.dragPercent = 0;
    this.dragSamples = [];
    this.stopPointerTrack?.();
    this.stopPointerTrack = startPointerTrack(event.pointerId, {
      onMove: this.handlePointerMove,
      onUp: this.handlePointerUp,
      onCancel: this.handlePointerCancel,
    });
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.boundList) {
      return;
    }

    const list = this.boundList;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (!this.isDragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
        return;
      }

      if (Math.abs(dy) > Math.abs(dx)) {
        this.resetDragVisuals();

        return;
      }

      this.isDragging = true;
      this.toggleClasses(list, this.$cls.dragging, true);
      recordVelocitySample(this.dragSamples, event.clientX);
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const slides = this.resolveSlides(list);
    const prevIndex = this.currentIndex >= 0 ? this.currentIndex : 0;
    const prevSlide = slides[prevIndex];

    if (!prevSlide) {
      return;
    }

    const rtl = this.isRtl();
    const logicalDx = dx * (rtl ? -1 : 1);
    const dir: 1 | -1 = logicalDx <= 0 ? 1 : -1;
    const candidateNext = this.clampIndex(prevIndex + dir, slides.length);

    if (this.dragNextIndex !== -1 && this.dragNextIndex !== candidateNext) {
      const oldNext = slides[this.dragNextIndex];

      if (oldNext && oldNext !== prevSlide) {
        this.clearSlideInlineStyles(oldNext.el);
        this.toggleClasses(oldNext.el, this.$cls.active, false);
        oldNext.el.classList.remove('z-transition-active');
        oldNext.el.setAttribute('aria-hidden', 'true');
      }
    }

    this.dragDir = dir;
    this.dragNextIndex = candidateNext;

    if (candidateNext === prevIndex) {
      this.dragPercent = 0;
      const rubber = Math.sign(dx) * Math.min(28, Math.abs(dx) * 0.2);

      prevSlide.el.style.transform = `translate3d(${rubber}px, 0, 0)`;
      recordVelocitySample(this.dragSamples, event.clientX);

      return;
    }

    const nextSlide = slides[candidateNext];

    if (!nextSlide) {
      return;
    }

    this.unwrapSlideTemplate(nextSlide.el, nextSlide.index);
    prevSlide.el.classList.remove('z-transition-active');
    this.toggleClasses(nextSlide.el, this.$cls.active, true);
    nextSlide.el.classList.remove('z-transition-active');
    nextSlide.el.setAttribute('aria-hidden', 'false');

    const width = Math.max(1, list.clientWidth);

    this.dragPercent = clampNumber(Math.abs(dx) / width, 0, 1);
    this.applyDeckFrame(prevSlide.el, nextSlide.el, this.dragPercent, dir * (rtl ? -1 : 1));
    recordVelocitySample(this.dragSamples, event.clientX);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const wasDragging = this.isDragging;
    const list = this.boundList;
    const dx = event.clientX - this.startX;
    const dragDir = this.dragDir;
    const dragNextIndex = this.dragNextIndex;
    const dragPercent = this.dragPercent;
    const rawVelocity = computeVelocity(this.dragSamples);

    this.stopPointerTrack?.();
    this.stopPointerTrack = null;
    this.isDragging = false;
    this.dragNextIndex = -1;
    this.dragPercent = 0;
    this.dragSamples = [];

    if (list) {
      this.toggleClasses(list, this.$cls.dragging, false);
    }

    if (!wasDragging || !list) {
      return;
    }

    this.scheduleSuppressClick();

    const slides = this.resolveSlides(list);
    const prevIndex = this.currentIndex >= 0 ? this.currentIndex : 0;
    const prevSlide = slides[prevIndex] ?? null;

    if (!prevSlide) {
      return;
    }

    if (dragNextIndex === -1 || dragNextIndex === prevIndex || dragPercent <= 0) {
      this.clearSlideInlineStyles(prevSlide.el);

      return;
    }

    const nextSlide = slides[dragNextIndex] ?? null;

    if (!nextSlide) {
      this.clearSlideInlineStyles(prevSlide.el);

      return;
    }

    const rtl = this.isRtl();
    const logicalVelocity = rawVelocity * (rtl ? -1 : 1);
    const flickTowardCommit =
      -logicalVelocity * dragDir >= FLICK_VELOCITY_THRESHOLD &&
      Math.abs(dx) >= MIN_FLICK_DISTANCE_PX;
    const shouldCommit = dragPercent >= 0.2 || flickTowardCommit;

    if (!shouldCommit) {
      this.snapBackDraggedTransition(prevSlide, nextSlide, dragDir, dragPercent);

      return;
    }

    const detail = this.createSlideDetail(nextSlide.index, prevIndex, nextSlide.el, {
      previousSlide: prevSlide.el,
      value: nextSlide.value,
      dir: dragDir,
    });

    if (
      !this.emit('before-change', detail, true) ||
      !this.emit('before-hide', detail, true) ||
      !this.emit('before-show', detail, true)
    ) {
      this.snapBackDraggedTransition(prevSlide, nextSlide, dragDir, dragPercent);

      return;
    }

    void this.runTransition(list, slides, prevSlide, nextSlide, dragDir, dragPercent, true, detail);
  };

  private handlePointerCancel = (): void => {
    this.resetDragVisuals();
  };

  private resetDragVisuals(): void {
    this.stopPointerTrack?.();
    this.stopPointerTrack = null;
    this.isDragging = false;

    const list = this.boundList ?? this.resolveList();

    if (list) {
      this.toggleClasses(list, this.$cls.dragging, false);

      const slides = this.resolveSlides(list);
      const prevSlide = this.currentIndex >= 0 ? (slides[this.currentIndex] ?? null) : null;

      if (prevSlide) {
        this.clearSlideInlineStyles(prevSlide.el);
        this.toggleClasses(prevSlide.el, this.$cls.active, true);
        prevSlide.el.classList.add('z-transition-active');
        prevSlide.el.setAttribute('aria-hidden', 'false');
      }

      if (this.dragNextIndex >= 0 && this.dragNextIndex !== this.currentIndex) {
        const nextSlide = slides[this.dragNextIndex];

        if (nextSlide) {
          this.clearSlideInlineStyles(nextSlide.el);
          this.toggleClasses(nextSlide.el, this.$cls.active, false);
          nextSlide.el.classList.remove('z-transition-active');
          nextSlide.el.setAttribute('aria-hidden', 'true');
        }
      }
    }

    this.dragNextIndex = -1;
    this.dragPercent = 0;
    this.dragSamples = [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-slideshow': Slideshow;
  }
}
