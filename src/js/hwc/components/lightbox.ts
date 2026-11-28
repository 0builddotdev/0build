import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Hwc } from '$js/hwc/hwc';
import {
  clampNumber,
  computeVelocity,
  evaluateEasing,
  recordVelocitySample,
  type DragVelocitySample,
} from '../../controllers/shared/carousel';
import { DialogMixin } from '../mixins/dialog';

export type LightboxMediaType = 'image' | 'video' | 'youtube' | 'vimeo' | 'iframe';

export interface LightboxItem {
  source: string;
  embedUrl: string;
  type: LightboxMediaType;
  caption: string;
  alt: string;
  poster: string;
  thumb: string;
  srcset: string;
  sizes: string;
  triggerEl: HTMLElement | null;
}

interface Cls extends Record<string, string> {
  overlay: string;
  items: string;
  toolbar: string;
  counter: string;
  actions: string;
  zoom: string;
  close: string;
  prev: string;
  next: string;
  footer: string;
  caption: string;
  dotnav: string;
  thumbnav: string;
}

interface Stl extends Record<string, string> {
  overlay: string;
  items: string;
  toolbar: string;
  counter: string;
  actions: string;
  zoom: string;
  close: string;
  prev: string;
  next: string;
  footer: string;
  caption: string;
  dotnav: string;
  thumbnav: string;
}

interface ActiveSlideTransition {
  rafId: number | null;
  finalize: () => void;
}

const IMAGE_URL_PATTERN = /\.(avif|jpe?g|jfif|a?png|gif|svg|webp|bmp|ico)($|\?|#)/i;
const VIDEO_URL_PATTERN = /\.(mp4|webm|ogv|ogg|mov)($|\?|#)/i;
const YOUTUBE_URL_PATTERN =
  /\/\/(?:.*?youtube(-nocookie)?\..*?(?:[?&]v=|\/shorts\/|\/embed\/)|youtu\.be\/)([\w-]{11})([&?].*)?$/i;
const VIMEO_URL_PATTERN = /\/\/(?:player\.)?vimeo\.[a-z]+\/(?:video\/)?(\d+)([&?].*)?$/i;

const DRAG_THRESHOLD_PX = 8;
const FLICK_VELOCITY_THRESHOLD = 0.35;
const MIN_FLICK_DISTANCE_PX = 16;

@customElement('z-lightbox')
export class Lightbox extends DialogMixin(Hwc) {
  protected readonly 'cls-default-element': string = 'overlay';

  protected readonly 'stl-default-element': string = 'overlay';

  protected readonly 'dialog-event-prefix': string = 'z-lightbox';

  override inline: boolean = true;

  override unmount: boolean = true;

  @property({ type: String })
  target: string = 'a[href]';

  @property({ type: Number })
  active: number = 0;

  @property({ type: String })
  animation: 'slide' | 'fade' | 'scale' = 'slide';

  @property({ type: Boolean })
  finite: boolean = false;

  @property({ type: Boolean, attribute: 'no-counter' })
  'no-counter': boolean = false;

  @property({ type: String })
  nav: '' | 'dotnav' | 'thumbnav' | 'none' | 'false' = 'dotnav';

  @property({ type: Boolean, attribute: 'no-slidenav' })
  'no-slidenav': boolean = false;

  @property({ type: Boolean, attribute: 'no-zoom' })
  'no-zoom': boolean = false;

  @property({ type: Boolean, attribute: 'no-swipe' })
  'no-swipe': boolean = false;

  @property({ type: Number, attribute: 'delay-controls' })
  'delay-controls': number = 3000;

  @property({ type: Number })
  preload: number = 1;

  @property({ type: Boolean, attribute: 'video-autoplay' })
  'video-autoplay': boolean = false;

  @property({ type: Number })
  duration: number = 280;

  @property({ type: String, attribute: 'aria-label' })
  ariaLabelText: string = 'Media viewer';

  @state()
  protected $cls: Cls = {
    overlay: 'z-lightbox',
    items: 'z-lightbox-items',
    toolbar: 'z-lightbox-toolbar z-lightbox-chrome',
    counter: 'z-lightbox-counter',
    actions: 'z-lightbox-toolbar-actions',
    zoom: 'z-slidenav z-lightbox-zoom-btn',
    close: 'z-slidenav z-lightbox-close',
    prev: 'z-slidenav z-lightbox-slidenav z-position-center-left z-position-small z-lightbox-chrome',
    next: 'z-slidenav z-lightbox-slidenav z-position-center-right z-position-small z-lightbox-chrome',
    footer: 'z-lightbox-footer z-lightbox-chrome',
    caption: 'z-lightbox-caption',
    dotnav: 'z-lightbox-dotnav z-dotnav',
    thumbnav: 'z-lightbox-thumbnav z-thumbnav',
  };

  @state()
  protected $stl: Stl = {
    overlay: '',
    items: '',
    toolbar: '',
    counter: '',
    actions: '',
    zoom: '',
    close: '',
    prev: '',
    next: '',
    footer: '',
    caption: '',
    dotnav: '',
    thumbnav: '',
  };

  @state()
  private items: LightboxItem[] = [];

  @state()
  private currentIndex: number = 0;

  @state()
  private outgoingIndex: number = -1;

  @state()
  private isZoomed: boolean = false;

  @state()
  private controlsHidden: boolean = false;

  @state()
  private preloadedIndices: Set<number> = new Set();

  @state()
  private loadedIndices: Set<number> = new Set();

  @state()
  private errorIndices: Set<number> = new Set();

  @state()
  private zoomableIndices: Set<number> = new Set();

  private readonly defaultI18n: Record<string, string> = {
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    counter: '{current} / {total}',
    slideLabel: 'Item {index} of {total}',
    error: 'Unable to load media.',
  };

  private portalRoot: HTMLElement | null = null;

  private activeTransition: ActiveSlideTransition | null = null;

  private controlsTimer: number | null = null;

  private isHostListenersBound: boolean = false;

  private isPortalListenersBound: boolean = false;

  private activePointerId: number = -1;

  private isTrackingWindow: boolean = false;

  private isSwiping: boolean = false;

  private startX: number = 0;

  private startY: number = 0;

  private swipeDir: 1 | -1 = 1;

  private swipeNextIndex: number = -1;

  private swipePercent: number = 0;

  private swipeSamples: DragVelocitySample[] = [];

  private suppressNextClick: boolean = false;

  private suppressClickTimer: number | null = null;

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    if (!this.portalRoot && typeof document !== 'undefined') {
      this.portalRoot = document.createElement('div');
      this.portalRoot.setAttribute('data-lightbox-portal', this.uid);
    }

    return this.portalRoot ?? this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.bindHostListeners();
    this.syncTriggerRoles();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unbindHostListeners();
    this.unbindPortalListeners();
    this.clearControlsTimer();
    this.clearSuppressClick();
    this.finalizeActiveTransition();
    this.resetSwipeState();

    if (this.portalRoot && this.portalRoot.parentElement) {
      this.portalRoot.remove();
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('target')) {
      this.syncTriggerRoles();
    }

    if (changedProperties.has('active') && this.$open && Number.isInteger(this.active)) {
      void this.goTo(this.active, true);
    }
  }

  public index(): number {
    return this.currentIndex;
  }

  public refresh(): void {
    this.syncTriggerRoles();
    this.items = this.collectItems();
  }

  public override async show(target?: number | HTMLElement | null): Promise<void> {
    const collected = this.collectItems();

    if (collected.length === 0) {
      return;
    }

    this.items = collected;

    let resolvedIndex = 0;
    let triggerEl: HTMLElement | null = null;

    if (typeof target === 'number') {
      resolvedIndex = clampNumber(target, 0, collected.length - 1);
      triggerEl = collected[resolvedIndex]?.triggerEl ?? null;
    } else if (target instanceof HTMLElement) {
      triggerEl = target;

      const parsed = this.parseTriggerItem(target);
      const matchedIdx = collected.findIndex(
        item => item.triggerEl === target || (parsed !== null && item.source === parsed.source),
      );

      resolvedIndex = matchedIdx !== -1 ? matchedIdx : 0;
    } else {
      resolvedIndex = clampNumber(this.active, 0, collected.length - 1);
      triggerEl = collected[resolvedIndex]?.triggerEl ?? null;
    }

    if (this.$open) {
      await this.goTo(resolvedIndex, true);

      return;
    }

    this.currentIndex = resolvedIndex;
    this.outgoingIndex = -1;
    this.isZoomed = false;
    this.controlsHidden = false;
    this.loadedIndices = new Set();
    this.errorIndices = new Set();
    this.zoomableIndices = new Set();
    this.preloadedIndices = this.computePreloadSet(resolvedIndex, collected.length);

    await super.show(triggerEl);
  }

  public next(animate: boolean = true): Promise<boolean> {
    return this.goTo('next', animate);
  }

  public previous(animate: boolean = true): Promise<boolean> {
    return this.goTo('previous', animate);
  }

  public async goTo(
    target: number | 'next' | 'previous' | 'first' | 'last',
    animate: boolean = true,
  ): Promise<boolean> {
    if (!this.$open || this.items.length === 0) {
      return false;
    }

    this.finalizeActiveTransition();

    const count = this.items.length;
    const prevIndex = this.currentIndex;
    let nextIndex = prevIndex;
    let dir: 1 | -1 = 1;

    if (target === 'first') {
      nextIndex = 0;
      dir = nextIndex >= prevIndex ? 1 : -1;
    } else if (target === 'last') {
      nextIndex = count - 1;
      dir = nextIndex >= prevIndex ? 1 : -1;
    } else if (target === 'next' || target === 'previous') {
      dir = target === 'next' ? 1 : -1;
      nextIndex = this.finite
        ? clampNumber(prevIndex + dir, 0, count - 1)
        : (prevIndex + dir + count) % count;
    } else if (Number.isInteger(target)) {
      nextIndex = this.finite
        ? clampNumber(target, 0, count - 1)
        : ((target % count) + count) % count;
      dir = nextIndex >= prevIndex ? 1 : -1;
    } else {
      return false;
    }

    if (nextIndex === prevIndex) {
      return true;
    }

    const detail = {
      index: nextIndex,
      previousIndex: prevIndex,
      item: this.items[nextIndex] ?? null,
      dir,
    };

    const allowed = this.dispatchEvent(
      new CustomEvent('z-lightbox:before-item-change', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    if (!allowed) {
      return false;
    }

    return this.runItemTransition(prevIndex, nextIndex, dir, 0, animate, detail);
  }

  public toggleZoom(): void {
    if (this['no-zoom'] || !this.canZoomCurrent()) {
      return;
    }

    this.isZoomed = !this.isZoomed;

    if (this.isZoomed) {
      void this.updateComplete.then(() => {
        this.applyZoomScale(this.currentIndex);
      });
    } else {
      this.clearZoomScale(this.currentIndex);
    }

    this.resetControlsTimer();
  }

  protected override onDialogMount(): void {
    if (this.portalRoot && typeof document !== 'undefined' && document.body) {
      if (this.portalRoot.parentElement !== document.body) {
        document.body.appendChild(this.portalRoot);
      }
    }

    this.HTMLOverlay = this.renderRoot.querySelector<HTMLElement>('[data-part="overlay"]');
    this.HTMLDialogPanel = this.HTMLOverlay;
    this.bindPortalListeners();
  }

  protected override onDialogOpen(): void {
    super.onDialogOpen();
    this.resetControlsTimer();
    this.syncMediaPlayback();
  }

  protected override onDialogHide(): void {
    this.clearControlsTimer();
    this.finalizeActiveTransition();
    this.resetSwipeState();
    this.pauseAllVideos();
    this.clearZoomScale(this.currentIndex);
    this.isZoomed = false;
  }

  protected override onDialogDestroy(): void {
    this.unbindPortalListeners();
    this.clearControlsTimer();
    this.finalizeActiveTransition();
    this.resetSwipeState();

    if (this.portalRoot && this.portalRoot.parentElement) {
      this.portalRoot.remove();
    }

    this.outgoingIndex = -1;
    this.isZoomed = false;
    this.controlsHidden = false;
    this.preloadedIndices = new Set();
    this.loadedIndices = new Set();
    this.errorIndices = new Set();
    this.zoomableIndices = new Set();
  }

  protected override isRtl(el: Element = this.HTMLOverlay ?? this): boolean {
    return super.isRtl(el);
  }

  private canZoomCurrent(): boolean {
    const item = this.items[this.currentIndex];

    return Boolean(
      !this['no-zoom'] &&
      item &&
      item.type === 'image' &&
      this.zoomableIndices.has(this.currentIndex),
    );
  }

  private computePreloadSet(centerIndex: number, total: number): Set<number> {
    const next = new Set<number>();

    if (total <= 0) {
      return next;
    }

    const radius = Math.max(0, Math.floor(this.preload));

    for (let offset = -radius; offset <= radius; offset++) {
      if (this.finite) {
        const idx = clampNumber(centerIndex + offset, 0, total - 1);

        next.add(idx);
      } else {
        next.add((((centerIndex + offset) % total) + total) % total);
      }
    }

    return next;
  }

  private addPreloadAround(centerIndex: number): void {
    const nextSet = new Set(this.preloadedIndices);
    const additions = this.computePreloadSet(centerIndex, this.items.length);

    additions.forEach(idx => nextSet.add(idx));
    this.preloadedIndices = nextSet;
  }

  private getOwnedTriggers(): HTMLElement[] {
    const selector = this.target.trim() || 'a[href]';

    try {
      return Array.from(this.querySelectorAll<HTMLElement>(selector)).filter(
        el => el.closest('z-lightbox') === this && !el.closest('[data-lightbox-ignore]'),
      );
    } catch {
      return [];
    }
  }

  private syncTriggerRoles(): void {
    for (const el of this.getOwnedTriggers()) {
      if (el.tagName === 'A' && !el.hasAttribute('role')) {
        el.setAttribute('role', 'button');
      }
    }
  }

  private resolveMediaType(
    source: string,
    explicitType: string,
    triggerEl: HTMLElement | null,
  ): { type: LightboxMediaType; embedUrl: string } {
    if (explicitType === 'youtube') {
      const ytMatch = YOUTUBE_URL_PATTERN.exec(source);

      if (ytMatch) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube${ytMatch[1] || ''}.com/embed/${ytMatch[2]}${ytMatch[3] ? ytMatch[3] : ''}`,
        };
      }

      return { type: 'youtube', embedUrl: source };
    }

    if (explicitType === 'vimeo') {
      const vmMatch = VIMEO_URL_PATTERN.exec(source);

      if (vmMatch) {
        return {
          type: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${vmMatch[1]}${vmMatch[2] ? vmMatch[2] : ''}`,
        };
      }

      return { type: 'vimeo', embedUrl: source };
    }

    if (explicitType === 'video') {
      return { type: 'video', embedUrl: source };
    }

    if (explicitType === 'image') {
      return { type: 'image', embedUrl: source };
    }

    if (explicitType === 'iframe') {
      return { type: 'iframe', embedUrl: source };
    }

    const ytMatch = YOUTUBE_URL_PATTERN.exec(source);

    if (ytMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube${ytMatch[1] || ''}.com/embed/${ytMatch[2]}${ytMatch[3] ? ytMatch[3] : ''}`,
      };
    }

    const vmMatch = VIMEO_URL_PATTERN.exec(source);

    if (vmMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vmMatch[1]}${vmMatch[2] ? vmMatch[2] : ''}`,
      };
    }

    if (VIDEO_URL_PATTERN.test(source)) {
      return { type: 'video', embedUrl: source };
    }

    if (IMAGE_URL_PATTERN.test(source) || source.startsWith('data:image/')) {
      return { type: 'image', embedUrl: source };
    }

    if (triggerEl?.querySelector('img')) {
      return { type: 'image', embedUrl: source };
    }

    return { type: 'iframe', embedUrl: source };
  }

  private parseTriggerItem(el: HTMLElement): LightboxItem | null {
    const source =
      el.getAttribute('data-source')?.trim() ||
      el.getAttribute('href')?.trim() ||
      el.getAttribute('src')?.trim() ||
      '';

    if (!source || source === '#' || source === '#!') {
      return null;
    }

    const explicitType = (el.getAttribute('data-type') ?? '').trim().toLowerCase();
    const { type, embedUrl } = this.resolveMediaType(source, explicitType, el);
    const innerImg = el.querySelector<HTMLImageElement>('img');
    const innerVideo = el.querySelector<HTMLVideoElement>('video');
    const caption = el.getAttribute('data-caption')?.trim() ?? '';
    const alt =
      el.getAttribute('data-alt')?.trim() ?? innerImg?.getAttribute('alt')?.trim() ?? caption;
    const poster =
      el.getAttribute('data-poster')?.trim() ?? innerVideo?.getAttribute('poster')?.trim() ?? '';
    const thumb =
      el.getAttribute('data-thumb')?.trim() ||
      poster ||
      innerImg?.currentSrc ||
      innerImg?.getAttribute('src')?.trim() ||
      (type === 'image' ? source : '');
    const srcset = el.getAttribute('data-srcset')?.trim() ?? '';
    const sizes = el.getAttribute('data-sizes')?.trim() ?? '';

    return {
      source,
      embedUrl,
      type,
      caption,
      alt,
      poster,
      thumb,
      srcset,
      sizes,
      triggerEl: el,
    };
  }

  private collectItems(): LightboxItem[] {
    const configItems = (this.$config as { items?: unknown[] })?.items;
    const collected: LightboxItem[] = [];
    const seenSources = new Set<string>();

    if (Array.isArray(configItems) && configItems.length > 0) {
      for (const raw of configItems) {
        if (!raw || typeof raw !== 'object') {
          continue;
        }

        const record = raw as Record<string, unknown>;
        const source = typeof record.source === 'string' ? record.source.trim() : '';

        if (!source || seenSources.has(source)) {
          continue;
        }

        seenSources.add(source);

        const explicitType = typeof record.type === 'string' ? record.type.toLowerCase() : '';
        const { type, embedUrl } = this.resolveMediaType(source, explicitType, null);

        collected.push({
          source,
          embedUrl,
          type,
          caption: typeof record.caption === 'string' ? record.caption : '',
          alt: typeof record.alt === 'string' ? record.alt : '',
          poster: typeof record.poster === 'string' ? record.poster : '',
          thumb: typeof record.thumb === 'string' ? record.thumb : type === 'image' ? source : '',
          srcset: typeof record.srcset === 'string' ? record.srcset : '',
          sizes: typeof record.sizes === 'string' ? record.sizes : '',
          triggerEl: null,
        });
      }

      return collected;
    }

    for (const el of this.getOwnedTriggers()) {
      const item = this.parseTriggerItem(el);

      if (!item || seenSources.has(item.source)) {
        continue;
      }

      seenSources.add(item.source);
      collected.push(item);
    }

    return collected;
  }

  private getSlideElement(index: number): HTMLElement | null {
    if (!this.HTMLOverlay || index < 0) {
      return null;
    }

    return this.HTMLOverlay.querySelector<HTMLElement>(`[data-lightbox-slide="${index}"]`);
  }

  private clearSlideInlineStyles(el: HTMLElement | null): void {
    if (!el) {
      return;
    }

    el.style.removeProperty('transform');
    el.style.removeProperty('opacity');
    el.style.removeProperty('z-index');
    el.style.removeProperty('display');

    if (el.getAttribute('style')?.trim() === '') {
      el.removeAttribute('style');
    }
  }

  private applySlideFrame(
    prevEl: HTMLElement | null,
    nextEl: HTMLElement,
    percent: number,
    effectiveDir: number,
  ): void {
    const p = clampNumber(percent, 0, 1);

    nextEl.style.display = 'flex';

    if (prevEl) {
      prevEl.style.display = 'flex';
    }

    if (this.animation === 'fade') {
      if (prevEl) {
        prevEl.style.removeProperty('transform');
        prevEl.style.opacity = String(1 - p);
        prevEl.style.zIndex = '1';
      }

      nextEl.style.removeProperty('transform');
      nextEl.style.opacity = String(p);
      nextEl.style.zIndex = '2';

      return;
    }

    if (this.animation === 'scale') {
      if (prevEl) {
        const prevScale = 1 - 0.1 * p;

        prevEl.style.opacity = String(1 - p);
        prevEl.style.transform = `scale3d(${prevScale}, ${prevScale}, 1)`;
        prevEl.style.zIndex = '1';
      }

      const nextScale = 0.92 + 0.08 * p;

      nextEl.style.opacity = String(p);
      nextEl.style.transform = `scale3d(${nextScale}, ${nextScale}, 1)`;
      nextEl.style.zIndex = '2';

      return;
    }

    if (prevEl) {
      prevEl.style.removeProperty('opacity');
      prevEl.style.transform = `translate3d(${-100 * effectiveDir * p}%, 0, 0)`;
      prevEl.style.zIndex = '1';
    }

    nextEl.style.removeProperty('opacity');
    nextEl.style.transform = `translate3d(${100 * effectiveDir * (1 - p)}%, 0, 0)`;
    nextEl.style.zIndex = '2';
  }

  private finalizeActiveTransition(): void {
    if (!this.activeTransition) {
      return;
    }

    const active = this.activeTransition;

    this.activeTransition = null;

    if (active.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(active.rafId);
    }

    active.finalize();
  }

  private async runItemTransition(
    prevIndex: number,
    nextIndex: number,
    dir: 1 | -1,
    startPercent: number,
    animate: boolean,
    detail: Record<string, unknown>,
  ): Promise<boolean> {
    this.clearZoomScale(prevIndex);
    this.isZoomed = false;
    this.outgoingIndex = prevIndex;
    this.currentIndex = nextIndex;
    this.addPreloadAround(nextIndex);

    this.dispatchEvent(
      new CustomEvent('z-lightbox:item-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );

    await this.updateComplete;

    const prevEl = this.getSlideElement(prevIndex);
    const nextEl = this.getSlideElement(nextIndex);
    const totalDuration =
      animate && !this.prefersReducedMotion() && Number.isFinite(this.duration) && this.duration > 0
        ? this.duration
        : 0;
    const clampedStart = clampNumber(startPercent, 0, 1);
    const remainingDuration = Math.round(totalDuration * (1 - clampedStart));
    const effectiveDir = dir * (this.isRtl() ? -1 : 1);

    const finishTransition = () => {
      this.clearSlideInlineStyles(prevEl);
      this.clearSlideInlineStyles(nextEl);
      this.outgoingIndex = -1;
      this.syncMediaPlayback();
      this.resetControlsTimer();
      this.dispatchEvent(
        new CustomEvent('z-lightbox:item-shown', {
          detail,
          bubbles: true,
          composed: true,
        }),
      );
    };

    if (!animate || remainingDuration <= 0 || !prevEl || !nextEl || typeof window === 'undefined') {
      finishTransition();

      return true;
    }

    const startTime = performance.now();

    this.applySlideFrame(prevEl, nextEl, clampedStart, effectiveDir);

    return new Promise<boolean>(resolve => {
      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;

        if (this.activeTransition?.finalize === finish) {
          this.activeTransition = null;
        }

        finishTransition();
        resolve(true);
      };

      const record: ActiveSlideTransition = {
        rafId: null,
        finalize: finish,
      };

      this.activeTransition = record;

      const step = (now: number) => {
        if (settled || this.activeTransition !== record || !this.isConnected) {
          return;
        }

        const elapsed = now - startTime;
        const progress = clampNumber(elapsed / remainingDuration, 0, 1);
        const eased = evaluateEasing('cubic-bezier(0.16, 1, 0.3, 1)', progress);
        const framePercent = clampedStart + (1 - clampedStart) * eased;

        this.applySlideFrame(prevEl, nextEl, framePercent, effectiveDir);

        if (progress >= 1) {
          finish();

          return;
        }

        record.rafId = window.requestAnimationFrame(step);
      };

      record.rafId = window.requestAnimationFrame(step);
    });
  }

  private snapBackSwipe(
    prevEl: HTMLElement,
    nextEl: HTMLElement,
    dir: 1 | -1,
    startPercent: number,
  ): void {
    const effectiveDir = dir * (this.isRtl() ? -1 : 1);
    const clampedStart = clampNumber(startPercent, 0, 1);
    const durationMs = this.prefersReducedMotion() ? 0 : 200;

    const finalizeSnapBack = () => {
      this.clearSlideInlineStyles(prevEl);
      this.clearSlideInlineStyles(nextEl);
      this.outgoingIndex = -1;
    };

    if (durationMs <= 0 || clampedStart <= 0 || typeof window === 'undefined') {
      finalizeSnapBack();

      return;
    }

    const startTime = performance.now();
    const record: ActiveSlideTransition = {
      rafId: null,
      finalize: finalizeSnapBack,
    };

    this.activeTransition = record;

    const step = (now: number) => {
      if (this.activeTransition !== record || !this.isConnected) {
        return;
      }

      const elapsed = now - startTime;
      const progress = clampNumber(elapsed / durationMs, 0, 1);
      const eased = evaluateEasing('cubic-bezier(0.16, 1, 0.3, 1)', progress);
      const framePercent = clampedStart * (1 - eased);

      this.applySlideFrame(prevEl, nextEl, framePercent, effectiveDir);

      if (progress >= 1) {
        this.activeTransition = null;
        finalizeSnapBack();

        return;
      }

      record.rafId = window.requestAnimationFrame(step);
    };

    record.rafId = window.requestAnimationFrame(step);
  }

  private applyZoomScale(index: number): void {
    const slideEl = this.getSlideElement(index);
    const img = slideEl?.querySelector<HTMLImageElement>('img');

    if (!slideEl || !img) {
      return;
    }

    const rect = img.getBoundingClientRect();
    const renderedWidth = rect.width || img.clientWidth || 1;
    const naturalRatio = img.naturalWidth > 0 ? img.naturalWidth / renderedWidth : 2;
    const scale = Math.max(2, Number(naturalRatio.toFixed(2)));

    slideEl.style.setProperty('--z-lightbox-zoom-scale', String(scale));
  }

  private clearZoomScale(index: number): void {
    const slideEl = this.getSlideElement(index);

    if (slideEl) {
      slideEl.style.removeProperty('--z-lightbox-zoom-scale');
    }
  }

  private syncMediaPlayback(): void {
    if (!this.HTMLOverlay) {
      return;
    }

    const slides = Array.from(
      this.HTMLOverlay.querySelectorAll<HTMLElement>('[data-lightbox-slide]'),
    );

    for (const slide of slides) {
      const idx = Number.parseInt(slide.getAttribute('data-lightbox-slide') ?? '-1', 10);
      const videos = Array.from(slide.querySelectorAll('video'));

      for (const video of videos) {
        if (idx === this.currentIndex) {
          if (this['video-autoplay']) {
            void video.play().catch(() => {});
          }
        } else if (!video.paused) {
          video.pause();
        }
      }
    }
  }

  private pauseAllVideos(): void {
    if (!this.HTMLOverlay) {
      return;
    }

    for (const video of Array.from(this.HTMLOverlay.querySelectorAll('video'))) {
      if (!video.paused) {
        video.pause();
      }
    }
  }

  private clearControlsTimer(): void {
    if (this.controlsTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.controlsTimer);
      this.controlsTimer = null;
    }
  }

  private resetControlsTimer(): void {
    this.controlsHidden = false;
    this.clearControlsTimer();

    if (
      !this.$open ||
      !Number.isFinite(this['delay-controls']) ||
      this['delay-controls'] <= 0 ||
      typeof window === 'undefined'
    ) {
      return;
    }

    this.controlsTimer = window.setTimeout(() => {
      if (!this.$open || !this.HTMLOverlay) {
        return;
      }

      const hoveringChrome = Boolean(this.HTMLOverlay.querySelector('.z-lightbox-chrome:hover'));
      const activeEl = document.activeElement;
      const focusInsideChrome = Boolean(
        activeEl instanceof Element && activeEl.closest('.z-lightbox-chrome'),
      );

      if (hoveringChrome || focusInsideChrome) {
        this.resetControlsTimer();

        return;
      }

      this.controlsHidden = true;
    }, this['delay-controls']);
  }

  private bindHostListeners(): void {
    if (this.isHostListenersBound) {
      return;
    }

    this.isHostListenersBound = true;
    this.addEventListener('click', this.handleHostClick);
  }

  private unbindHostListeners(): void {
    if (!this.isHostListenersBound) {
      return;
    }

    this.isHostListenersBound = false;
    this.removeEventListener('click', this.handleHostClick);
  }

  private bindPortalListeners(): void {
    if (this.isPortalListenersBound || !this.portalRoot) {
      return;
    }

    this.isPortalListenersBound = true;
    this.portalRoot.addEventListener('keydown', this.handleOverlayKeydown);
    this.portalRoot.addEventListener('pointermove', this.handleOverlayActivity, { passive: true });
    this.portalRoot.addEventListener('focusin', this.handleOverlayActivity);
    this.portalRoot.addEventListener('click', this.handleCaptureSuppressClick, true);
  }

  private unbindPortalListeners(): void {
    if (!this.isPortalListenersBound || !this.portalRoot) {
      return;
    }

    this.isPortalListenersBound = false;
    this.portalRoot.removeEventListener('keydown', this.handleOverlayKeydown);
    this.portalRoot.removeEventListener('pointermove', this.handleOverlayActivity);
    this.portalRoot.removeEventListener('focusin', this.handleOverlayActivity);
    this.portalRoot.removeEventListener('click', this.handleCaptureSuppressClick, true);
  }

  private handleHostClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const selector = this.target.trim() || 'a[href]';
    let triggerEl: HTMLElement | null = null;

    try {
      triggerEl = event.target.closest<HTMLElement>(selector);
    } catch {
      return;
    }

    if (
      !triggerEl ||
      triggerEl.closest('z-lightbox') !== this ||
      triggerEl.closest('[data-lightbox-ignore]')
    ) {
      return;
    }

    if (
      triggerEl.classList.contains('z-disabled') ||
      triggerEl.hasAttribute('disabled') ||
      triggerEl.getAttribute('aria-disabled') === 'true'
    ) {
      event.preventDefault();

      return;
    }

    event.preventDefault();
    void this.show(triggerEl);
  };

  private handleOverlayActivity = (): void => {
    this.resetControlsTimer();
  };

  private handleOverlayKeydown = (event: KeyboardEvent): void => {
    if (!this.$open || event.defaultPrevented) {
      return;
    }

    this.resetControlsTimer();

    const rtl = this.isRtl();

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void this.goTo(rtl ? 'next' : 'previous', true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      void this.goTo(rtl ? 'previous' : 'next', true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      void this.goTo('first', true);
    } else if (event.key === 'End') {
      event.preventDefault();
      void this.goTo('last', true);
    } else if (event.key === '+' || event.key === '=' || event.key === '-') {
      if (this.canZoomCurrent()) {
        event.preventDefault();
        this.toggleZoom();
      }
    }
  };

  private scheduleSuppressClick(): void {
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

  private clearSuppressClick(): void {
    this.suppressNextClick = false;

    if (this.suppressClickTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.suppressClickTimer);
      this.suppressClickTimer = null;
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

  private handleItemsPointerDown = (event: PointerEvent): void => {
    if (
      !this.$open ||
      this['no-swipe'] ||
      this.isZoomed ||
      this.items.length < 2 ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      event.defaultPrevented
    ) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;

    if (!target || target.closest('button, a, video, iframe, .z-lightbox-chrome')) {
      return;
    }

    this.finalizeActiveTransition();
    this.activePointerId = event.pointerId;
    this.isSwiping = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.swipeNextIndex = -1;
    this.swipePercent = 0;
    this.swipeSamples = [];
    this.attachWindowSwipeListeners();
  };

  private attachWindowSwipeListeners(): void {
    if (this.isTrackingWindow || typeof window === 'undefined') {
      return;
    }

    this.isTrackingWindow = true;
    window.addEventListener('pointermove', this.handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', this.handleWindowPointerUp);
    window.addEventListener('pointercancel', this.handleWindowPointerCancel);
  }

  private detachWindowSwipeListeners(): void {
    if (!this.isTrackingWindow || typeof window === 'undefined') {
      return;
    }

    this.isTrackingWindow = false;
    window.removeEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointerup', this.handleWindowPointerUp);
    window.removeEventListener('pointercancel', this.handleWindowPointerCancel);
  }

  private handleWindowPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId || !this.HTMLOverlay) {
      return;
    }

    const itemsEl = this.HTMLOverlay.querySelector<HTMLElement>('[data-part="items"]');

    if (!itemsEl) {
      return;
    }

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (!this.isSwiping) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
        return;
      }

      if (Math.abs(dy) > Math.abs(dx)) {
        this.resetSwipeState();

        return;
      }

      this.isSwiping = true;
      itemsEl.classList.add('z-dragging');
      recordVelocitySample(this.swipeSamples, event.clientX);
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const count = this.items.length;
    const prevIndex = this.currentIndex;
    const prevEl = this.getSlideElement(prevIndex);

    if (!prevEl || count < 2) {
      return;
    }

    const rtl = this.isRtl();
    const logicalDx = dx * (rtl ? -1 : 1);
    const dir: 1 | -1 = logicalDx <= 0 ? 1 : -1;
    const candidateNext = this.finite
      ? clampNumber(prevIndex + dir, 0, count - 1)
      : (prevIndex + dir + count) % count;

    if (this.swipeNextIndex !== -1 && this.swipeNextIndex !== candidateNext) {
      this.clearSlideInlineStyles(this.getSlideElement(this.swipeNextIndex));
    }

    this.swipeDir = dir;
    this.swipeNextIndex = candidateNext;

    if (candidateNext === prevIndex) {
      this.swipePercent = 0;
      const rubber = Math.sign(dx) * Math.min(32, Math.abs(dx) * 0.2);

      prevEl.style.transform = `translate3d(${rubber}px, 0, 0)`;
      recordVelocitySample(this.swipeSamples, event.clientX);

      return;
    }

    const nextEl = this.getSlideElement(candidateNext);

    if (!nextEl) {
      return;
    }

    const width = Math.max(1, itemsEl.clientWidth);

    this.swipePercent = clampNumber(Math.abs(dx) / width, 0, 1);
    this.applySlideFrame(prevEl, nextEl, this.swipePercent, dir * (rtl ? -1 : 1));
    recordVelocitySample(this.swipeSamples, event.clientX);
  };

  private handleWindowPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    const wasSwiping = this.isSwiping;
    const dx = event.clientX - this.startX;
    const swipeDir = this.swipeDir;
    const swipeNextIndex = this.swipeNextIndex;
    const swipePercent = this.swipePercent;
    const rawVelocity = computeVelocity(this.swipeSamples);
    const itemsEl = this.HTMLOverlay?.querySelector<HTMLElement>('[data-part="items"]');

    this.detachWindowSwipeListeners();
    this.activePointerId = -1;
    this.isSwiping = false;
    this.swipeNextIndex = -1;
    this.swipePercent = 0;
    this.swipeSamples = [];
    itemsEl?.classList.remove('z-dragging');

    if (!wasSwiping) {
      return;
    }

    this.scheduleSuppressClick();

    const prevIndex = this.currentIndex;
    const prevEl = this.getSlideElement(prevIndex);

    if (!prevEl) {
      return;
    }

    if (swipeNextIndex === -1 || swipeNextIndex === prevIndex || swipePercent <= 0) {
      this.clearSlideInlineStyles(prevEl);

      return;
    }

    const nextEl = this.getSlideElement(swipeNextIndex);

    if (!nextEl) {
      this.clearSlideInlineStyles(prevEl);

      return;
    }

    const rtl = this.isRtl();
    const logicalVelocity = rawVelocity * (rtl ? -1 : 1);
    const flickTowardCommit =
      -logicalVelocity * swipeDir >= FLICK_VELOCITY_THRESHOLD &&
      Math.abs(dx) >= MIN_FLICK_DISTANCE_PX;
    const shouldCommit = swipePercent >= 0.2 || flickTowardCommit;

    if (!shouldCommit) {
      this.snapBackSwipe(prevEl, nextEl, swipeDir, swipePercent);

      return;
    }

    const detail = {
      index: swipeNextIndex,
      previousIndex: prevIndex,
      item: this.items[swipeNextIndex] ?? null,
      dir: swipeDir,
    };

    const allowed = this.dispatchEvent(
      new CustomEvent('z-lightbox:before-item-change', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    if (!allowed) {
      this.snapBackSwipe(prevEl, nextEl, swipeDir, swipePercent);

      return;
    }

    void this.runItemTransition(prevIndex, swipeNextIndex, swipeDir, swipePercent, true, detail);
  };

  private handleWindowPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.resetSwipeState();
  };

  private resetSwipeState(): void {
    this.detachWindowSwipeListeners();
    this.activePointerId = -1;
    this.isSwiping = false;

    const itemsEl = this.HTMLOverlay?.querySelector<HTMLElement>('[data-part="items"]');

    itemsEl?.classList.remove('z-dragging');

    if (this.currentIndex >= 0) {
      this.clearSlideInlineStyles(this.getSlideElement(this.currentIndex));
    }

    if (this.swipeNextIndex >= 0 && this.swipeNextIndex !== this.currentIndex) {
      this.clearSlideInlineStyles(this.getSlideElement(this.swipeNextIndex));
    }

    this.swipeNextIndex = -1;
    this.swipePercent = 0;
    this.swipeSamples = [];
  }

  private handleSlideClick(event: MouseEvent): void {
    if (event.defaultPrevented || this['no-bg-close'] || this.isSwiping) {
      return;
    }

    if (event.target === event.currentTarget && !this.isZoomed) {
      void this.hide();
    }
  }

  private handleImageLoad(index: number, event: Event): void {
    const img = event.currentTarget instanceof HTMLImageElement ? event.currentTarget : null;
    const nextLoaded = new Set(this.loadedIndices);

    nextLoaded.add(index);
    this.loadedIndices = nextLoaded;

    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const nextZoomable = new Set(this.zoomableIndices);

      nextZoomable.add(index);
      this.zoomableIndices = nextZoomable;
    }

    this.dispatchEvent(
      new CustomEvent('z-lightbox:item-load', {
        detail: { index, item: this.items[index] ?? null },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleImageError(index: number): void {
    const nextErrors = new Set(this.errorIndices);

    nextErrors.add(index);
    this.errorIndices = nextErrors;

    this.dispatchEvent(
      new CustomEvent('z-lightbox:item-error', {
        detail: { index, item: this.items[index] ?? null },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderIcon(
    keys: string[],
    fallbackIcon: 'x' | 'chevron-left' | 'chevron-right' | 'zoom-in' | 'zoom-out',
  ): TemplateResult {
    for (const key of keys) {
      const custom = this.$icons(key);

      if (custom) {
        return custom;
      }
    }

    switch (fallbackIcon) {
      case 'chevron-left':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        `;
      case 'chevron-right':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        `;
      case 'zoom-in':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
            <line x1="11" x2="11" y1="8" y2="14" />
            <line x1="8" x2="14" y1="11" y2="11" />
          </svg>
        `;
      case 'zoom-out':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
            <line x1="8" x2="14" y1="11" y2="11" />
          </svg>
        `;
      case 'x':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        `;
    }
  }

  private renderSlideMedia(item: LightboxItem, index: number): TemplateResult | typeof nothing {
    if (!this.preloadedIndices.has(index)) {
      return nothing;
    }

    if (this.errorIndices.has(index)) {
      return html`
        <div class="z-card z-card-body z-text-center">
          <p class="z-text-small">${this.getI18nText('error', this.defaultI18n)}</p>
        </div>
      `;
    }

    if (item.type === 'image') {
      const isLoaded = this.loadedIndices.has(index);
      const canZoom = !this['no-zoom'] && this.zoomableIndices.has(index);

      return html`
        ${isLoaded ? nothing : html`<span class="z-lightbox-loader" role="status"></span>`}
        <img
          src="${item.source}"
          alt="${item.alt}"
          srcset="${ifDefined(item.srcset || undefined)}"
          sizes="${ifDefined(item.sizes || undefined)}"
          class="${canZoom ? 'z-lightbox-zoom' : ''}"
          style="${isLoaded ? '' : 'position: absolute; opacity: 0; pointer-events: none;'}"
          draggable="false"
          @load=${(event: Event) => this.handleImageLoad(index, event)}
          @error=${() => this.handleImageError(index)}
          @dblclick=${() => {
            if (canZoom && index === this.currentIndex) {
              this.toggleZoom();
            }
          }}
        />
      `;
    }

    if (item.type === 'video') {
      return html`
        <video
          src="${item.source}"
          poster="${ifDefined(item.poster || undefined)}"
          controls
          playsinline
          preload="metadata"
        ></video>
      `;
    }

    return html`
      <iframe
        src="${item.embedUrl}"
        class="z-lightbox-iframe"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
    `;
  }

  private renderNav(): TemplateResult | typeof nothing {
    if (this.items.length < 2 || this.nav === 'none' || this.nav === 'false') {
      return nothing;
    }

    if (this.nav === 'thumbnav') {
      return html`
        <ul
          data-part="thumbnav"
          class="${this.$cls['thumbnav']}"
          style="${this.$stl['thumbnav']}"
          role="tablist"
        >
          ${this.items.map(
            (item, idx) => html`
              <li role="presentation" class="${idx === this.currentIndex ? 'z-active' : ''}">
                <button
                  type="button"
                  role="tab"
                  aria-selected="${idx === this.currentIndex ? 'true' : 'false'}"
                  aria-label="${item.alt || item.caption || `Item ${idx + 1}`}"
                  @click=${() => void this.goTo(idx, true)}
                >
                  ${item.thumb ? html`<img src="${item.thumb}" alt="" />` : nothing}
                </button>
              </li>
            `,
          )}
        </ul>
      `;
    }

    return html`
      <ul
        data-part="dotnav"
        class="${this.$cls['dotnav']}"
        style="${this.$stl['dotnav']}"
        role="tablist"
      >
        ${this.items.map(
          (_item, idx) => html`
            <li role="presentation" class="${idx === this.currentIndex ? 'z-active' : ''}">
              <button
                type="button"
                role="tab"
                aria-selected="${idx === this.currentIndex ? 'true' : 'false'}"
                aria-label="${`Item ${idx + 1}`}"
                @click=${() => void this.goTo(idx, true)}
              ></button>
            </li>
          `,
        )}
      </ul>
    `;
  }

  render() {
    if (!this.$mounted) {
      return nothing;
    }

    const total = this.items.length;
    const currentItem = this.items[this.currentIndex] ?? null;
    const overlayClasses = [
      this.$cls['overlay'],
      this.controlsHidden ? 'z-lightbox-controls-hidden' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const itemsClasses = [this.$cls['items'], !this.isZoomed ? 'z-lightbox-items-fit' : '']
      .filter(Boolean)
      .join(' ');
    const canZoom = this.canZoomCurrent();
    const atFirst = this.finite && this.currentIndex <= 0;
    const atLast = this.finite && this.currentIndex >= total - 1;
    const showSlidenav = !this['no-slidenav'] && total > 1;
    const counterText = this.getI18nText('counter', this.defaultI18n, {
      current: this.currentIndex + 1,
      total,
    });
    const zoomLabel = this.getI18nText(this.isZoomed ? 'zoomOut' : 'zoomIn', this.defaultI18n);
    const prevLabel = this.getI18nText('previous', this.defaultI18n);
    const nextLabel = this.getI18nText('next', this.defaultI18n);
    const closeLabel = this.getI18nText('close', this.defaultI18n);
    const hasFooter =
      Boolean(currentItem?.caption) || (total > 1 && this.nav !== 'none' && this.nav !== 'false');

    return html`
      <div
        data-host-inner
        data-part="overlay"
        class="${overlayClasses}"
        style="${this.$stl['overlay']}"
        role="dialog"
        aria-modal="true"
        aria-label="${this.ariaLabelText || 'Media viewer'}"
        tabindex="-1"
      >
        <div
          data-part="items"
          class="${itemsClasses}"
          style="${this.$stl['items']}"
          @pointerdown=${this.handleItemsPointerDown}
        >
          ${this.items.map((item, idx) => {
            const isActive = idx === this.currentIndex;
            const isOutgoing = idx === this.outgoingIndex;
            const slideClasses = [
              isActive ? 'z-active' : '',
              isActive && this.isZoomed ? 'z-lightbox-zoomed' : '',
              isOutgoing ? 'z-active' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return html`
              <div
                data-lightbox-slide="${idx}"
                class="${slideClasses}"
                role="group"
                aria-roledescription="slide"
                aria-label="${this.getI18nText('slideLabel', this.defaultI18n, {
                  index: idx + 1,
                  total,
                })}"
                aria-hidden="${isActive ? 'false' : 'true'}"
                @click=${(event: MouseEvent) => this.handleSlideClick(event)}
              >
                ${this.renderSlideMedia(item, idx)}
              </div>
            `;
          })}
        </div>

        <div data-part="toolbar" class="${this.$cls['toolbar']}" style="${this.$stl['toolbar']}">
          ${!this['no-counter'] && total > 1
            ? html`
                <div
                  data-part="counter"
                  class="${this.$cls['counter']}"
                  style="${this.$stl['counter']}"
                  aria-live="polite"
                >
                  ${counterText}
                </div>
              `
            : nothing}

          <div data-part="actions" class="${this.$cls['actions']}" style="${this.$stl['actions']}">
            ${canZoom
              ? html`
                  <button
                    type="button"
                    data-part="zoom"
                    class="${this.$cls['zoom']}"
                    style="${this.$stl['zoom']}"
                    aria-label="${zoomLabel}"
                    aria-pressed="${this.isZoomed ? 'true' : 'false'}"
                    @click=${() => this.toggleZoom()}
                  >
                    ${this.isZoomed
                      ? this.renderIcon(['zoom-out'], 'zoom-out')
                      : this.renderIcon(['zoom-in'], 'zoom-in')}
                  </button>
                `
              : nothing}

            <button
              type="button"
              data-part="close"
              class="${this.$cls['close']}"
              style="${this.$stl['close']}"
              aria-label="${closeLabel}"
              @click=${() => void this.hide()}
            >
              ${this.renderIcon(['close', 'close-icon', 'x'], 'x')}
            </button>
          </div>
        </div>

        ${showSlidenav
          ? html`
              <button
                type="button"
                data-part="prev"
                class="${this.$cls['prev']} ${atFirst ? 'z-invisible' : ''}"
                style="${this.$stl['prev']}"
                aria-label="${prevLabel}"
                aria-disabled="${atFirst ? 'true' : 'false'}"
                tabindex="${atFirst ? '-1' : '0'}"
                @click=${() => void this.previous(true)}
              >
                ${this.renderIcon(
                  ['previous', 'slidenav-previous', 'chevron-left'],
                  'chevron-left',
                )}
              </button>

              <button
                type="button"
                data-part="next"
                class="${this.$cls['next']} ${atLast ? 'z-invisible' : ''}"
                style="${this.$stl['next']}"
                aria-label="${nextLabel}"
                aria-disabled="${atLast ? 'true' : 'false'}"
                tabindex="${atLast ? '-1' : '0'}"
                @click=${() => void this.next(true)}
              >
                ${this.renderIcon(['next', 'slidenav-next', 'chevron-right'], 'chevron-right')}
              </button>
            `
          : nothing}
        ${hasFooter
          ? html`
              <div data-part="footer" class="${this.$cls['footer']}" style="${this.$stl['footer']}">
                ${currentItem?.caption
                  ? html`
                      <div
                        data-part="caption"
                        class="${this.$cls['caption']}"
                        style="${this.$stl['caption']}"
                      >
                        ${currentItem.caption}
                      </div>
                    `
                  : nothing}
                ${this.renderNav()}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-lightbox': Lightbox;
  }
}
