import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { clampNumber, evaluateEasing } from '../../shared/helpers/animation';
import {
  computeVelocity,
  recordVelocitySample,
  startPointerTrack,
  type DragVelocitySample,
} from '../../shared/helpers/gesture';
import { CarouselBase, type CarouselSlideEntry } from '../shared/carousel';

interface SlideGeometry {
  index: number;
  start: number;
  end: number;
  width: number;
  snapScroll: number;
}

interface SliderTrackMetrics {
  listWidth: number;
  scrollWidth: number;
  maxScroll: number;
  maxIndex: number;
  setAnchors: number[];
  canSeamlessLoop: boolean;
  geometries: Map<number, SlideGeometry>;
}

const DRAG_THRESHOLD_PX = 6;
const FLICK_VELOCITY_THRESHOLD = 0.35;
const MIN_FLICK_DISTANCE_PX = 12;

@customElement('z-slider')
export class Slider extends CarouselBase {
  protected readonly eventPrefix = 'z-slider' as const;

  protected readonly itemAttr = 'data-slider-item' as const;

  protected readonly ignoreAttr = 'data-slider-ignore' as const;

  protected readonly listSelector = '.z-slider-items, [data-part="items"], [data-part="list"]';

  protected readonly navSelector = '.z-slider-nav, [data-part="nav"]';

  protected readonly defaultDuration = 350;

  protected readonly defaultEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';

  @property({ type: Boolean })
  sets: boolean = false;

  @property({ type: Boolean })
  center: boolean = false;

  @property({ type: String, attribute: 'active-mode' })
  'active-mode': 'all' | 'first' = 'all';

  private visualOrder: number[] = [];

  private boundList: HTMLElement | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private observedElements: Set<Element> = new Set();

  private resizeRafId: number | null = null;

  private scrollSyncRafId: number | null = null;

  private scrollTweenRafId: number | null = null;

  private scrollSettleTimer: number | null = null;

  private tweenFinishResolver: (() => void) | null = null;

  private isProgrammaticTween: boolean = false;

  private isAdjustingOrder: boolean = false;

  private stopPointerTrack: (() => void) | null = null;

  private startX: number = 0;

  private startY: number = 0;

  private dragOriginX: number = 0;

  private dragOriginScroll: number = 0;

  private dragSamples: DragVelocitySample[] = [];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cancelScrollTween();
    this.cleanupDrag(true);
    this.detachListListeners();
    this.detachResizeObserver();
    this.clearTimers();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeSlider();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (
      changedProperties.has('finite') ||
      changedProperties.has('sets') ||
      changedProperties.has('center') ||
      changedProperties.has('active-mode')
    ) {
      this.refresh();

      return;
    }

    if (changedProperties.has('active') && this.active >= 0) {
      void this.show(this.active, true);
    }
  }

  public refresh(): void {
    this.cancelScrollTween();
    this.cleanupDrag(true);
    this.detachListListeners();
    this.detachResizeObserver();
    this.clearTimers();
    this.initializeSlider();
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

    const metrics = this.measureTrack(list, slides);
    const resolved = this.resolveTarget(target, slides, metrics);

    if (!resolved) {
      return false;
    }

    const { targetIndex, dir } = resolved;

    if (targetIndex === this.currentIndex) {
      const targetGeo = metrics.geometries.get(targetIndex);

      if (targetGeo) {
        if (animate) {
          await this.tweenScrollTo(list, targetGeo.snapScroll, this.resolveEffectiveDuration());
        } else {
          this.setLogicalScroll(list, targetGeo.snapScroll);
        }
      }

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

    this.cancelScrollTween();

    const updatedMetrics = this.prepareWrapForTarget(list, slides, metrics, targetIndex, dir);

    this.currentIndex = targetIndex;
    this._active = targetIndex;

    this.unwrapSlideTemplate(nextSlide.el, nextSlide.index);

    if (prevSlide) {
      this.emit('hide', detail);
    }

    this.emit('show', detail);
    this.emit('change', detail);

    const targetGeo = updatedMetrics.geometries.get(targetIndex);
    const targetScroll = targetGeo ? targetGeo.snapScroll : 0;
    const durationMs = animate ? this.resolveEffectiveDuration() : 0;

    if (!animate || durationMs <= 0) {
      this.setLogicalScroll(list, targetScroll);
      this.syncVisualState(list, slides, updatedMetrics);

      if (prevSlide) {
        this.emit('hidden', detail);
      }

      this.emit('shown', detail);

      return true;
    }

    this.syncVisualState(list, slides, updatedMetrics);
    await this.tweenScrollTo(list, targetScroll, durationMs);

    if (this.isConnected) {
      const settledMetrics = this.measureTrack(list, slides);

      this.syncVisualState(list, slides, settledMetrics);
    }

    if (prevSlide) {
      this.emit('hidden', detail);
    }

    this.emit('shown', detail);

    return true;
  }

  private initializeSlider(): void {
    const list = this.resolveList();

    if (!list) {
      this.isInitialized = true;

      return;
    }

    const slides = this.resolveSlides(list);

    this.syncVisualOrderArray(slides.length, true);
    this.syncNavStructure(slides);

    const metrics = this.measureTrack(list, slides);
    const initialIndex = this.resolveInitialIndex(slides, metrics);

    this.currentIndex = initialIndex;
    this._active = initialIndex;

    const initialGeo = initialIndex >= 0 ? metrics.geometries.get(initialIndex) : undefined;

    if (initialGeo) {
      this.isAdjustingOrder = true;
      list.style.scrollSnapType = 'none';
      list.style.scrollBehavior = 'auto';
      this.setLogicalScroll(list, initialGeo.snapScroll);
      list.style.removeProperty('scroll-snap-type');
      list.style.removeProperty('scroll-behavior');
      this.isAdjustingOrder = false;
    }

    const postMetrics = this.measureTrack(list, slides);

    this.syncVisualState(list, slides, postMetrics);
    this.bindListListeners(list);
    this.observeResize(list, slides);
    this.isInitialized = true;

    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  private clearTimers(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.resizeRafId !== null) {
      window.cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }

    if (this.scrollSyncRafId !== null) {
      window.cancelAnimationFrame(this.scrollSyncRafId);
      this.scrollSyncRafId = null;
    }

    if (this.scrollSettleTimer !== null) {
      window.clearTimeout(this.scrollSettleTimer);
      this.scrollSettleTimer = null;
    }
  }

  private syncVisualOrderArray(count: number, forceReset: boolean = false): void {
    if (
      forceReset ||
      this.finite ||
      count < 2 ||
      this.visualOrder.length !== count ||
      !this.visualOrder.every(idx => idx >= 0 && idx < count)
    ) {
      this.visualOrder = Array.from({ length: count }, (_, idx) => idx);
    }
  }

  private getLogicalScroll(list: HTMLElement): number {
    if (this.isRtl()) {
      return Math.max(0, -list.scrollLeft);
    }

    return Math.max(0, list.scrollLeft);
  }

  private setLogicalScroll(list: HTMLElement, value: number): void {
    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    const clamped = clampNumber(value, 0, maxScroll);

    list.scrollLeft = this.isRtl() ? -clamped : clamped;
  }

  private measureTrack(list: HTMLElement, slides: CarouselSlideEntry[]): SliderTrackMetrics {
    this.syncVisualOrderArray(slides.length, false);

    if (this.finite || slides.length < 2) {
      for (const slide of slides) {
        if (slide.el.style.order) {
          slide.el.style.removeProperty('order');
        }
      }
    } else {
      this.visualOrder.forEach((slideIndex, orderPos) => {
        const slide = slides[slideIndex];

        if (slide) {
          slide.el.style.order = String(orderPos);
        }
      });
    }

    const rtl = this.isRtl();
    const listWidth = list.clientWidth;
    const scrollWidth = list.scrollWidth;
    const maxScroll = Math.max(0, scrollWidth - listWidth);
    const logicalScroll = this.getLogicalScroll(list);
    const listRect = list.getBoundingClientRect();
    const contentLeft = listRect.left + list.clientLeft;
    const contentRight = contentLeft + listWidth;
    const computedStyle = typeof window !== 'undefined' ? window.getComputedStyle(list) : null;
    const gap = computedStyle ? Number.parseFloat(computedStyle.columnGap) || 0 : 0;

    const geometries = new Map<number, SlideGeometry>();
    const canonicalWidths: number[] = new Array(slides.length).fill(0);
    let maxSlideWidth = 0;

    for (const slide of slides) {
      const rect = slide.el.getBoundingClientRect();
      const width = rect.width;
      const start = rtl
        ? contentRight - rect.right + logicalScroll
        : rect.left - contentLeft + logicalScroll;
      const end = start + width;

      canonicalWidths[slide.index] = width;
      maxSlideWidth = Math.max(maxSlideWidth, width);

      const rawSnap = this.center ? start - (listWidth - width) / 2 : start;
      const snapScroll = clampNumber(rawSnap, 0, maxScroll);

      geometries.set(slide.index, {
        index: slide.index,
        start,
        end,
        width,
        snapScroll,
      });
    }

    const canonicalStarts: number[] = [];
    let accLeft = 0;

    for (let i = 0; i < slides.length; i++) {
      canonicalStarts.push(accLeft);
      accLeft += canonicalWidths[i] + (i < slides.length - 1 ? gap : 0);
    }

    let maxIndex = Math.max(0, slides.length - 1);

    if (maxScroll <= 1 || slides.length <= 1) {
      maxIndex = 0;
    } else if (this.finite && !this.center) {
      const firstTrailing = canonicalStarts.findIndex(pos => pos >= maxScroll - 1);

      maxIndex = firstTrailing !== -1 ? firstTrailing : slides.length - 1;
    }

    const setAnchors: number[] = [];

    if (this.sets && slides.length > 0 && listWidth > 0) {
      let setWidth = 0;

      for (let i = 0; i < slides.length; i++) {
        const w = canonicalWidths[i];

        if (i > 0 && setWidth + gap + w > listWidth + 1) {
          setWidth = 0;
        }

        if (this.center) {
          const nextW = canonicalWidths[(i + 1) % slides.length] ?? 0;

          if (setWidth < listWidth / 2 && setWidth + w + nextW / 2 > listWidth / 2) {
            setAnchors.push(i);
            setWidth = (listWidth - w) / 2;
          }
        } else if (setWidth === 0) {
          const anchor = this.finite ? Math.min(i, maxIndex) : i;

          if (!setAnchors.includes(anchor)) {
            setAnchors.push(anchor);
          }
        }

        setWidth += w + gap;
      }

      if (setAnchors.length === 0) {
        setAnchors.push(0);
      }

      if (this.finite && this.center && setAnchors.length > 0) {
        maxIndex = setAnchors[setAnchors.length - 1];
      }
    }

    const setAnchorLookup = this.sets && setAnchors.length > 0 ? new Set(setAnchors) : null;

    for (const slide of slides) {
      if (setAnchorLookup) {
        slide.el.style.scrollSnapAlign = setAnchorLookup.has(slide.index)
          ? this.center
            ? 'center'
            : 'start'
          : 'none';
      } else if (slide.el.style.scrollSnapAlign) {
        slide.el.style.removeProperty('scroll-snap-align');
      }
    }

    const totalTrackWidth =
      canonicalWidths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, slides.length - 1);
    const requiredBuffer = maxSlideWidth + gap + (this.center ? listWidth * 0.5 : 0);
    const canSeamlessLoop =
      !this.finite &&
      slides.length > 1 &&
      maxScroll > 1 &&
      listWidth > 0 &&
      totalTrackWidth >= listWidth + requiredBuffer;

    return {
      listWidth,
      scrollWidth,
      maxScroll,
      maxIndex,
      setAnchors,
      canSeamlessLoop,
      geometries,
    };
  }

  private resolveInitialIndex(slides: CarouselSlideEntry[], metrics: SliderTrackMetrics): number {
    if (slides.length === 0) {
      return -1;
    }

    if (this.hasAttribute('active') && this.active >= 0) {
      return this.clampValidIndex(this.active, slides.length, metrics);
    }

    const preActive = slides.find(slide => this.hasClasses(slide.el, this.$cls.active));

    if (preActive) {
      return this.clampValidIndex(preActive.index, slides.length, metrics);
    }

    return 0;
  }

  private clampValidIndex(rawIndex: number, count: number, metrics: SliderTrackMetrics): number {
    if (count === 0) {
      return -1;
    }

    const clamped = this.finite
      ? clampNumber(rawIndex, 0, metrics.maxIndex)
      : ((rawIndex % count) + count) % count;

    if (this.sets && metrics.setAnchors.length > 0) {
      if (metrics.setAnchors.includes(clamped)) {
        return clamped;
      }

      let best = metrics.setAnchors[0];

      for (const anchor of metrics.setAnchors) {
        if (anchor <= clamped) {
          best = anchor;
        }
      }

      return best;
    }

    return clamped;
  }

  private resolveTarget(
    target: number | 'next' | 'previous' | 'first' | 'last' | string,
    slides: CarouselSlideEntry[],
    metrics: SliderTrackMetrics,
  ): { targetIndex: number; dir: 1 | -1 } | null {
    const count = slides.length;

    if (count === 0) {
      return null;
    }

    const current = this.currentIndex >= 0 ? this.currentIndex : 0;

    if (target === 'first') {
      const firstIdx = this.sets && metrics.setAnchors.length > 0 ? metrics.setAnchors[0] : 0;

      return { targetIndex: firstIdx, dir: firstIdx >= current ? 1 : -1 };
    }

    if (target === 'last') {
      const lastIdx =
        this.sets && metrics.setAnchors.length > 0
          ? metrics.setAnchors[metrics.setAnchors.length - 1]
          : metrics.maxIndex;

      return { targetIndex: lastIdx, dir: lastIdx >= current ? 1 : -1 };
    }

    if (target === 'next' || target === 'previous') {
      const step = target === 'next' ? 1 : -1;

      if (this.sets && metrics.setAnchors.length > 0) {
        const anchors = metrics.setAnchors;
        const pos = anchors.indexOf(current);
        const currentPos = pos !== -1 ? pos : 0;
        const nextPos = this.finite
          ? clampNumber(currentPos + step, 0, anchors.length - 1)
          : (currentPos + step + anchors.length) % anchors.length;

        return { targetIndex: anchors[nextPos], dir: step };
      }

      if (this.finite) {
        return {
          targetIndex: clampNumber(current + step, 0, metrics.maxIndex),
          dir: step,
        };
      }

      return {
        targetIndex: (current + step + count) % count,
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

    const validIndex = this.clampValidIndex(resolved, count, metrics);
    let dir: 1 | -1 = validIndex >= current ? 1 : -1;

    if (!this.finite && count > 2) {
      const forwardDist = (validIndex - current + count) % count;
      const backwardDist = (current - validIndex + count) % count;

      dir = forwardDist <= backwardDist ? 1 : -1;
    }

    return { targetIndex: validIndex, dir };
  }

  private applyVisualOrder(
    list: HTMLElement,
    slides: CarouselSlideEntry[],
    nextOrder: number[],
    anchorSlide: HTMLElement,
  ): void {
    this.isAdjustingOrder = true;
    list.style.scrollSnapType = 'none';
    list.style.scrollBehavior = 'auto';

    const beforeX = anchorSlide.getBoundingClientRect().left;

    nextOrder.forEach((slideIndex, pos) => {
      const slide = slides[slideIndex];

      if (slide) {
        slide.el.style.order = String(pos);
      }
    });

    this.visualOrder = nextOrder;

    const afterX = anchorSlide.getBoundingClientRect().left;

    list.scrollLeft += afterX - beforeX;
    list.style.removeProperty('scroll-snap-type');
    list.style.removeProperty('scroll-behavior');
    this.isAdjustingOrder = false;
  }

  private prepareWrapForTarget(
    list: HTMLElement,
    slides: CarouselSlideEntry[],
    metrics: SliderTrackMetrics,
    targetIndex: number,
    dir: 1 | -1,
  ): SliderTrackMetrics {
    if (this.finite || !metrics.canSeamlessLoop || this.currentIndex < 0) {
      return metrics;
    }

    const anchorSlide = slides[this.currentIndex]?.el;

    if (!anchorSlide) {
      return metrics;
    }

    let currentMetrics = metrics;

    for (let guard = 0; guard < slides.length; guard++) {
      const currentPos = this.visualOrder.indexOf(this.currentIndex);
      const targetPos = this.visualOrder.indexOf(targetIndex);
      const targetGeo = currentMetrics.geometries.get(targetIndex);
      const logicalScroll = this.getLogicalScroll(list);

      if (!targetGeo) {
        break;
      }

      if (dir > 0) {
        const hasTrailingRoom =
          !this.center ||
          targetGeo.start - (currentMetrics.listWidth - targetGeo.width) / 2 <=
            currentMetrics.maxScroll + 1;

        if (targetPos > currentPos && hasTrailingRoom) {
          break;
        }

        const firstIdx = this.visualOrder[0];
        const firstGeo = currentMetrics.geometries.get(firstIdx);

        if (firstIdx === this.currentIndex || !firstGeo || firstGeo.end > logicalScroll + 2) {
          break;
        }

        const nextOrder = [...this.visualOrder.slice(1), firstIdx];

        this.applyVisualOrder(list, slides, nextOrder, anchorSlide);
        currentMetrics = this.measureTrack(list, slides);
      } else {
        const hasLeadingRoom =
          !this.center || targetGeo.start - (currentMetrics.listWidth - targetGeo.width) / 2 >= -1;

        if (targetPos < currentPos && hasLeadingRoom) {
          break;
        }

        const lastIdx = this.visualOrder[this.visualOrder.length - 1];
        const lastGeo = currentMetrics.geometries.get(lastIdx);

        if (
          lastIdx === this.currentIndex ||
          !lastGeo ||
          lastGeo.start < logicalScroll + currentMetrics.listWidth - 2
        ) {
          break;
        }

        const nextOrder = [lastIdx, ...this.visualOrder.slice(0, -1)];

        this.applyVisualOrder(list, slides, nextOrder, anchorSlide);
        currentMetrics = this.measureTrack(list, slides);
      }
    }

    return currentMetrics;
  }

  private shiftLoopIfAtDragEdge(
    list: HTMLElement,
    slides: CarouselSlideEntry[],
    nextLogicalScroll: number,
  ): number {
    if (this.finite || this.visualOrder.length < 2) {
      return 0;
    }

    const listWidth = list.clientWidth;
    const maxScroll = Math.max(0, list.scrollWidth - listWidth);
    const currentAnchorIdx = this.visualOrder[Math.min(1, this.visualOrder.length - 1)];
    const anchorSlide = slides[currentAnchorIdx]?.el;

    if (!anchorSlide) {
      return 0;
    }

    if (nextLogicalScroll < 0) {
      const lastIdx = this.visualOrder[this.visualOrder.length - 1];
      const metrics = this.measureTrack(list, slides);
      const lastGeo = metrics.geometries.get(lastIdx);
      const logicalScroll = this.getLogicalScroll(list);

      if (metrics.canSeamlessLoop && lastGeo && lastGeo.start >= logicalScroll + listWidth - 2) {
        const prevScroll = this.getLogicalScroll(list);
        const nextOrder = [lastIdx, ...this.visualOrder.slice(0, -1)];

        this.applyVisualOrder(list, slides, nextOrder, anchorSlide);

        const newScroll = this.getLogicalScroll(list);

        return newScroll - prevScroll;
      }
    } else if (nextLogicalScroll > maxScroll) {
      const firstIdx = this.visualOrder[0];
      const metrics = this.measureTrack(list, slides);
      const firstGeo = metrics.geometries.get(firstIdx);
      const logicalScroll = this.getLogicalScroll(list);

      if (metrics.canSeamlessLoop && firstGeo && firstGeo.end <= logicalScroll + 2) {
        const prevScroll = this.getLogicalScroll(list);
        const nextOrder = [...this.visualOrder.slice(1), firstIdx];

        this.applyVisualOrder(list, slides, nextOrder, anchorSlide);

        const newScroll = this.getLogicalScroll(list);

        return newScroll - prevScroll;
      }
    }

    return 0;
  }

  private cancelScrollTween(): void {
    if (this.scrollTweenRafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.scrollTweenRafId);
      this.scrollTweenRafId = null;
    }

    this.isProgrammaticTween = false;

    if (this.boundList) {
      this.boundList.style.removeProperty('scroll-snap-type');
      this.boundList.style.removeProperty('scroll-behavior');
    }

    if (this.tweenFinishResolver) {
      const resolve = this.tweenFinishResolver;

      this.tweenFinishResolver = null;
      resolve();
    }
  }

  private tweenScrollTo(
    list: HTMLElement,
    targetLogicalScroll: number,
    durationMs: number,
  ): Promise<void> {
    this.cancelScrollTween();

    const startScroll = this.getLogicalScroll(list);
    const delta = targetLogicalScroll - startScroll;

    if (Math.abs(delta) < 0.5 || durationMs <= 0 || typeof window === 'undefined') {
      this.setLogicalScroll(list, targetLogicalScroll);

      return Promise.resolve();
    }

    this.isProgrammaticTween = true;
    list.style.scrollSnapType = 'none';
    list.style.scrollBehavior = 'auto';

    const easingStr = this.resolveEffectiveEasing();
    const startTime = performance.now();

    return new Promise<void>(resolve => {
      this.tweenFinishResolver = resolve;

      const step = (now: number) => {
        if (!this.isProgrammaticTween || !this.isConnected) {
          return;
        }

        const elapsed = now - startTime;
        const progress = clampNumber(elapsed / durationMs, 0, 1);
        const eased = evaluateEasing(easingStr, progress);

        this.setLogicalScroll(list, startScroll + delta * eased);

        if (progress >= 1) {
          this.scrollTweenRafId = null;
          this.isProgrammaticTween = false;
          list.style.removeProperty('scroll-snap-type');
          list.style.removeProperty('scroll-behavior');
          this.tweenFinishResolver = null;
          resolve();

          return;
        }

        this.scrollTweenRafId = window.requestAnimationFrame(step);
      };

      this.scrollTweenRafId = window.requestAnimationFrame(step);
    });
  }

  private findClosestIndexForScroll(
    slides: CarouselSlideEntry[],
    metrics: SliderTrackMetrics,
    logicalScroll: number,
  ): number {
    const candidates =
      this.sets && metrics.setAnchors.length > 0
        ? metrics.setAnchors
        : slides
            .filter(slide => !this.finite || slide.index <= metrics.maxIndex)
            .map(slide => slide.index);

    if (candidates.length === 0) {
      return 0;
    }

    let bestIndex = candidates[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const idx of candidates) {
      const geo = metrics.geometries.get(idx);

      if (!geo) {
        continue;
      }

      const dist = Math.abs(geo.snapScroll - logicalScroll);

      if (dist < bestDistance) {
        bestDistance = dist;
        bestIndex = idx;
      }
    }

    return bestIndex;
  }

  private syncVisualState(
    list: HTMLElement,
    slides: CarouselSlideEntry[],
    metrics: SliderTrackMetrics,
  ): void {
    const logicalScroll = this.getLogicalScroll(list);
    const hasMeasuredViewport = metrics.listWidth > 0;
    const viewLeft = logicalScroll - 2;
    const viewRight = logicalScroll + metrics.listWidth + 2;
    const visibleIndices = new Set<number>();

    if (hasMeasuredViewport) {
      for (const slide of slides) {
        const geo = metrics.geometries.get(slide.index);

        if (!geo) {
          continue;
        }

        const clampedWidth = Math.min(geo.width, metrics.listWidth);

        if (geo.start >= viewLeft && geo.start + clampedWidth <= viewRight) {
          visibleIndices.add(slide.index);
        }
      }
    }

    if (visibleIndices.size === 0 && this.currentIndex >= 0 && slides[this.currentIndex]) {
      visibleIndices.add(this.currentIndex);
    }

    const activeIndices =
      this['active-mode'] === 'first'
        ? new Set(this.currentIndex >= 0 ? [this.currentIndex] : [])
        : visibleIndices;

    for (const slide of slides) {
      const isActive = activeIndices.has(slide.index);
      const isInView = visibleIndices.has(slide.index);

      if (isInView) {
        this.unwrapSlideTemplate(slide.el, slide.index);
      }

      this.toggleClasses(slide.el, this.$cls.active, isActive);

      if (hasMeasuredViewport) {
        slide.el.setAttribute('aria-hidden', isInView ? 'false' : 'true');
        slide.el.inert = !isInView;
      } else {
        const keepAccessible = slide.index === this.currentIndex;

        slide.el.setAttribute('aria-hidden', keepAccessible ? 'false' : 'true');
        slide.el.inert = !keepAccessible;
      }
    }

    this.syncSlideMedia(slides, activeIndices);

    const allowedNavIndices =
      this.sets && metrics.setAnchors.length > 0 ? new Set(metrics.setAnchors) : null;

    this.syncAriaAndControls(list, slides, this.currentIndex, metrics.maxIndex, allowedNavIndices);
  }

  private bindListListeners(list: HTMLElement): void {
    if (this.boundList === list) {
      return;
    }

    this.detachListListeners();
    this.boundList = list;
    list.addEventListener('scroll', this.handleListScroll, { passive: true });
    list.addEventListener('scrollend', this.handleListScrollEnd);
    list.addEventListener('wheel', this.handleUserScrollInterrupt, { passive: true });
    list.addEventListener('touchstart', this.handleUserScrollInterrupt, { passive: true });
    list.addEventListener('pointerdown', this.handlePointerDown);
  }

  private detachListListeners(): void {
    if (!this.boundList) {
      return;
    }

    this.boundList.removeEventListener('scroll', this.handleListScroll);
    this.boundList.removeEventListener('scrollend', this.handleListScrollEnd);
    this.boundList.removeEventListener('wheel', this.handleUserScrollInterrupt);
    this.boundList.removeEventListener('touchstart', this.handleUserScrollInterrupt);
    this.boundList.removeEventListener('pointerdown', this.handlePointerDown);
    this.boundList = null;
  }

  private handleUserScrollInterrupt = (): void => {
    if (this.isProgrammaticTween) {
      this.cancelScrollTween();
    }
  };

  private handleListScroll = (): void => {
    if (this.isAdjustingOrder || this.isProgrammaticTween || typeof window === 'undefined') {
      return;
    }

    if (this.scrollSyncRafId === null) {
      this.scrollSyncRafId = window.requestAnimationFrame(() => {
        this.scrollSyncRafId = null;
        this.syncFromCurrentScroll(false);
      });
    }

    if (this.scrollSettleTimer !== null) {
      window.clearTimeout(this.scrollSettleTimer);
    }

    this.scrollSettleTimer = window.setTimeout(() => {
      this.scrollSettleTimer = null;
      this.syncFromCurrentScroll(true);
    }, 120);
  };

  private handleListScrollEnd = (): void => {
    if (this.isAdjustingOrder || this.isProgrammaticTween) {
      return;
    }

    if (this.scrollSettleTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.scrollSettleTimer);
      this.scrollSettleTimer = null;
    }

    this.syncFromCurrentScroll(true);
  };

  private syncFromCurrentScroll(isSettled: boolean): void {
    const list = this.boundList ?? this.resolveList();

    if (!list || !this.isConnected) {
      return;
    }

    const slides = this.resolveSlides(list);

    if (slides.length === 0) {
      return;
    }

    const metrics = this.measureTrack(list, slides);
    const logicalScroll = this.getLogicalScroll(list);
    const nextIndex = this.findClosestIndexForScroll(slides, metrics, logicalScroll);

    if (nextIndex !== this.currentIndex) {
      const previousIndex = this.currentIndex;
      const prevSlide = previousIndex >= 0 ? (slides[previousIndex] ?? null) : null;
      const nextSlide = slides[nextIndex] ?? null;

      this.currentIndex = nextIndex;
      this._active = nextIndex;

      if (nextSlide) {
        const detail = this.createSlideDetail(nextIndex, previousIndex, nextSlide.el, {
          previousSlide: prevSlide?.el ?? null,
          value: nextSlide.value,
        });

        this.emit('change', detail);

        if (isSettled) {
          if (prevSlide) {
            this.emit('hidden', detail);
          }

          this.emit('shown', detail);
        }
      }
    }

    this.syncVisualState(list, slides, metrics);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (
      !this.isDragEnabled() ||
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
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

    this.cancelScrollTween();
    this.isDragging = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragOriginX = event.clientX;
    this.dragOriginScroll = this.getLogicalScroll(list);
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
        this.cleanupDrag(false);

        return;
      }

      this.isDragging = true;
      this.dragOriginX = event.clientX;
      this.dragOriginScroll = this.getLogicalScroll(list);
      this.toggleClasses(list, this.$cls.dragging, true);
      recordVelocitySample(this.dragSamples, event.clientX);
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const rtl = this.isRtl();
    const deltaFromOrigin = (event.clientX - this.dragOriginX) * (rtl ? -1 : 1);
    let desiredScroll = this.dragOriginScroll - deltaFromOrigin;
    const slides = this.resolveSlides(list);
    const shift = this.shiftLoopIfAtDragEdge(list, slides, desiredScroll);

    if (shift !== 0) {
      this.dragOriginScroll += shift;
      desiredScroll += shift;
    }

    this.setLogicalScroll(list, desiredScroll);
    recordVelocitySample(this.dragSamples, event.clientX);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const wasDragging = this.isDragging;
    const list = this.boundList;
    const dragDeltaX = event.clientX - this.dragOriginX;
    const pointerVelocity = computeVelocity(this.dragSamples);

    this.cleanupDrag(false);

    if (!wasDragging || !list) {
      return;
    }

    this.scheduleSuppressClick();

    const slides = this.resolveSlides(list);
    const metrics = this.measureTrack(list, slides);
    const logicalScroll = this.getLogicalScroll(list);
    const rtl = this.isRtl();
    const logicalVelocity = pointerVelocity * (rtl ? -1 : 1);
    const logicalDragDist = Math.abs(dragDeltaX);

    let targetIndex = this.findClosestIndexForScroll(slides, metrics, logicalScroll);

    if (
      Math.abs(logicalVelocity) >= FLICK_VELOCITY_THRESHOLD &&
      logicalDragDist >= MIN_FLICK_DISTANCE_PX &&
      targetIndex === this.currentIndex
    ) {
      const flickDir = logicalVelocity < 0 ? 'next' : 'previous';
      const flickResolved = this.resolveTarget(flickDir, slides, metrics);

      if (flickResolved) {
        targetIndex = flickResolved.targetIndex;
      }
    }

    if (targetIndex !== this.currentIndex) {
      void this.show(targetIndex, true);
    } else {
      const targetGeo = metrics.geometries.get(targetIndex);

      if (targetGeo) {
        void this.tweenScrollTo(list, targetGeo.snapScroll, this.resolveEffectiveDuration(220));
      }
    }
  };

  private handlePointerCancel = (): void => {
    this.cleanupDrag(true);
  };

  private cleanupDrag(snapBack: boolean): void {
    this.stopPointerTrack?.();
    this.stopPointerTrack = null;
    this.isDragging = false;
    this.dragSamples = [];

    if (this.boundList) {
      this.toggleClasses(this.boundList, this.$cls.dragging, false);

      if (snapBack && this.currentIndex >= 0) {
        const slides = this.resolveSlides(this.boundList);
        const metrics = this.measureTrack(this.boundList, slides);
        const targetGeo = metrics.geometries.get(this.currentIndex);

        if (targetGeo) {
          this.setLogicalScroll(this.boundList, targetGeo.snapScroll);
        }
      }
    }
  }

  private observeResize(list: HTMLElement, slides: CarouselSlideEntry[]): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const targets = new Set<Element>([this, list, ...slides.map(slide => slide.el)]);

    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.resizeRafId !== null || typeof window === 'undefined') {
          return;
        }

        this.resizeRafId = window.requestAnimationFrame(() => {
          this.resizeRafId = null;

          if (!this.isConnected || this.isDragging || this.isProgrammaticTween) {
            return;
          }

          const activeList = this.resolveList();

          if (!activeList) {
            return;
          }

          const activeSlides = this.resolveSlides(activeList);
          const metrics = this.measureTrack(activeList, activeSlides);
          const validIndex = this.clampValidIndex(
            this.currentIndex >= 0 ? this.currentIndex : 0,
            activeSlides.length,
            metrics,
          );

          if (validIndex !== this.currentIndex) {
            this.currentIndex = validIndex;
            this._active = validIndex;
          }

          const targetGeo = metrics.geometries.get(validIndex);

          if (targetGeo && metrics.listWidth > 0) {
            this.isAdjustingOrder = true;
            activeList.style.scrollSnapType = 'none';
            activeList.style.scrollBehavior = 'auto';
            this.setLogicalScroll(activeList, targetGeo.snapScroll);
            activeList.style.removeProperty('scroll-snap-type');
            activeList.style.removeProperty('scroll-behavior');
            this.isAdjustingOrder = false;
          }

          this.syncVisualState(activeList, activeSlides, metrics);
        });
      });
    } else {
      this.resizeObserver.disconnect();
    }

    this.observedElements = targets;

    for (const el of this.observedElements) {
      this.resizeObserver.observe(el);
    }
  }

  private detachResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.observedElements.clear();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-slider': Slider;
  }
}
