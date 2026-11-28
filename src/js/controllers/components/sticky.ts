import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { removeClasses } from '$js/shared/base';
import { Controller } from '$js/controllers/controller';
import { resolveAnimationPreset, runCssAnimation } from '$js/shared/helpers/animation';
import {
  observeMediaQuery,
  queryOffsetElement,
  resolveOffsetPx,
  toPx,
} from '$js/shared/helpers/css';

interface StickyMetrics {
  naturalTop: number;
  slotLeft: number;
  slotWidth: number;
  elHeight: number;
  naturalMargin: string;
  marginBottom: number;
  viewportHeight: number;
  maxScroll: number;
  effectiveOffset: number;
  overflow: number;
  startScroll: number;
  endScroll: number;
  useNativeSticky: boolean;
}

interface Cls extends Record<string, string> {
  active: string;
  inactive: string;
  fixed: string;
  below: string;
}

@customElement('z-sticky')
export class Sticky extends Controller {
  protected readonly eventPrefix = 'z-sticky';

  protected override readonly 'cls-default-element': string = 'active';

  protected override $cls: Cls = {
    active: 'z-active',
    inactive: '',
    fixed: 'z-sticky-fixed',
    below: 'z-sticky-below',
  };

  @property({ type: String })
  position: 'top' | 'bottom' = 'top';

  @property({ type: String })
  offset: string = '0';

  @property({ type: String, attribute: 'offset-end' })
  'offset-end': string = '0';

  @property({ type: String })
  start: string = '';

  @property({ type: String })
  end: string = '';

  @property({ type: Boolean, attribute: 'show-on-up' })
  'show-on-up': boolean = false;

  @property({ type: Boolean, attribute: 'overflow-flip' })
  'overflow-flip': boolean = false;

  @property({ type: String })
  animation: string = '';

  @property({ type: Number })
  duration: number = 150;

  @property({ type: String })
  media: string = '';

  @property({ type: String, attribute: 'target-offset' })
  'target-offset': string = '';

  @property({ type: String, attribute: 'sel-target' })
  'sel-target': string = '';

  private isEventsBound: boolean = false;

  private activeState: boolean = false;

  private fixedState: boolean = false;

  private belowState: boolean = false;

  private inactiveState: boolean = false;

  private isMediaMatched: boolean = true;

  private isLeaving: boolean = false;

  private overflowScroll: number = 0;

  private prevScrollY: number = 0;

  private prevDir: 'down' | 'up' = 'down';

  private gestureScroll: number = 0;

  private lastScrollTime: number = 0;

  private lastAppliedNativeTop: string = '';

  private metrics: StickyMetrics | null = null;

  private placeholderEl: HTMLElement | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private observedElements: Set<Element> = new Set();

  private resizeRafId: number | null = null;

  private stopMediaQuery: (() => void) | null = null;

  private animationCleanup: (() => void) | null = null;

  private appliedActiveClasses: string[] = [];

  private appliedInactiveClasses: string[] = [];

  private appliedFixedClasses: string[] = [];

  private appliedBelowClasses: string[] = [];

  connectedCallback(): void {
    if (this.isInitialized) {
      this.setupMediaQuery();
      this.bindEvents();
    }

    super.connectedCallback();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.detachListeners();
    this.detachResizeObserver();
    this.detachMediaListener();
    this.cancelAnimation();

    if (this.resizeRafId !== null) {
      window.cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }

    this.unfix();
    this.clearInlinePositionStyles();
    this.setActiveState(false, this.getScrollY());
    removeClasses(this.resolveTargetElement(), this.appliedInactiveClasses);
    this.appliedInactiveClasses = [];
    this.placeholderEl?.remove();
    this.placeholderEl = null;
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.setupMediaQuery();
    this.bindEvents();
    this.prevScrollY = this.getScrollY();
    this.gestureScroll = this.prevScrollY;
    this.syncTargetInactiveClass(false);
    this.recalculate();
    this.syncScroll(false);
    this.isInitialized = true;

    if (
      typeof window !== 'undefined' &&
      window.location.hash &&
      this.getScrollY() > 0 &&
      this.isTargetOffsetEnabled()
    ) {
      this.handleHashNavigation();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (changedProperties.has('media')) {
      this.setupMediaQuery();
    }

    if (this.hasChanged(changedProperties, ['sel-target', 'cls'])) {
      this.reapplyManagedClasses();
    }

    if (
      this.hasChanged(changedProperties, [
        'position',
        'offset',
        'offset-end',
        'start',
        'end',
        'show-on-up',
        'overflow-flip',
        'animation',
        'media',
      ])
    ) {
      this.refresh();
    }
  }

  public isActive(): boolean {
    return this.activeState;
  }

  public isFixed(): boolean {
    return this.fixedState;
  }

  public isBelow(): boolean {
    return this.belowState;
  }

  public refresh(): void {
    this.recalculate();
    this.syncScroll(false);
  }

  private getScrollY(): number {
    if (typeof window === 'undefined') {
      return 0;
    }

    return Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
  }

  private clamp(value: number, min: number, max: number): number {
    if (max < min) {
      return min;
    }

    return Math.min(Math.max(value, min), max);
  }

  private resolveTargetElement(): HTMLElement {
    const sel = this['sel-target'].trim();

    if (sel) {
      try {
        const matched = this.querySelector<HTMLElement>(sel);

        if (matched) {
          return matched;
        }
      } catch {
        // Ignore invalid selector and fall back to host.
      }
    }

    return this;
  }

  private isTargetOffsetEnabled(): boolean {
    return this.hasAttribute('target-offset') && this['target-offset'].trim() !== 'false';
  }

  private setupMediaQuery(): void {
    this.detachMediaListener();
    this.stopMediaQuery = observeMediaQuery(this.media, (matches, isInitial) => {
      this.isMediaMatched = matches;

      if (!isInitial) {
        this.refresh();
      }
    });

    if (!this.stopMediaQuery) {
      this.isMediaMatched = true;
    }
  }

  private detachMediaListener(): void {
    this.stopMediaQuery?.();
    this.stopMediaQuery = null;
  }

  private isElementVisible(el: HTMLElement): boolean {
    if (!el.isConnected) {
      return false;
    }

    return el.getClientRects().length > 0;
  }

  private getVisibleParent(): HTMLElement | null {
    let parent = this.parentElement;

    while (parent) {
      if (this.isElementVisible(parent)) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return null;
  }

  private canAncestorsSupportSticky(): boolean {
    let current = this.parentElement;

    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);

      if (
        /^(hidden|scroll|auto)$/.test(style.overflowX) ||
        /^(hidden|scroll|auto)$/.test(style.overflowY)
      ) {
        return false;
      }

      current = current.parentElement;
    }

    return true;
  }

  private clearInlinePositionStyles(): void {
    this.style.removeProperty('position');
    this.style.removeProperty('top');
    this.style.removeProperty('left');
    this.style.removeProperty('width');
    this.lastAppliedNativeTop = '';

    if (this.getAttribute('style')?.trim() === '') {
      this.removeAttribute('style');
    }
  }

  private ensurePlaceholder(): HTMLElement {
    if (this.placeholderEl) {
      if (this.placeholderEl.previousElementSibling !== this) {
        this.after(this.placeholderEl);
      }

      return this.placeholderEl;
    }

    const next = this.nextElementSibling;

    if (next instanceof HTMLElement && next.classList.contains('z-sticky-placeholder')) {
      this.placeholderEl = next;

      return next;
    }

    const created = document.createElement('div');

    created.className = 'z-sticky-placeholder';
    created.setAttribute('aria-hidden', 'true');
    created.hidden = true;
    this.after(created);
    this.placeholderEl = created;

    return created;
  }

  private syncPlaceholderBox(metrics: StickyMetrics): void {
    if (metrics.useNativeSticky) {
      if (this.placeholderEl) {
        this.placeholderEl.hidden = true;
      }

      return;
    }

    const placeholder = this.ensurePlaceholder();

    placeholder.style.boxSizing = 'border-box';
    placeholder.style.width = `${metrics.slotWidth}px`;
    placeholder.style.height = `${metrics.elHeight}px`;
    placeholder.style.margin = metrics.naturalMargin;
  }

  private updateResizeObserver(targets: Set<Element>): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    let changed = targets.size !== this.observedElements.size;

    if (!changed) {
      for (const el of targets) {
        if (!this.observedElements.has(el)) {
          changed = true;
          break;
        }
      }
    }

    if (!changed) {
      return;
    }

    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.resizeRafId !== null) {
          return;
        }

        this.resizeRafId = window.requestAnimationFrame(() => {
          this.resizeRafId = null;

          if (this.isConnected) {
            this.refresh();
          }
        });
      });
    } else {
      this.resizeObserver.disconnect();
    }

    this.observedElements = new Set(targets);

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

  private recalculate(): void {
    if (typeof window === 'undefined' || !this.isConnected) {
      return;
    }

    const scrollY = this.getScrollY();

    if (!this.isMediaMatched) {
      this.inactiveState = true;
      this.metrics = null;
      this.unfix();
      this.clearInlinePositionStyles();
      this.setActiveState(false, scrollY);

      return;
    }

    const observedTargets = new Set<Element>([this, document.documentElement]);
    const visibleParent = this.getVisibleParent();

    if (visibleParent) {
      observedTargets.add(visibleParent);
    }

    let naturalTop = 0;
    let slotLeft = 0;
    let slotWidth = 0;
    let elHeight = 0;
    let naturalMargin = '0px';
    let marginBottom = 0;
    let visible = false;

    if (this.fixedState && this.placeholderEl && !this.placeholderEl.hidden) {
      const slotRect = this.placeholderEl.getBoundingClientRect();
      const computedSlot = window.getComputedStyle(this.placeholderEl);
      const rect = this.getBoundingClientRect();

      visible = this.isElementVisible(this.placeholderEl) && this.isElementVisible(this);
      naturalTop = slotRect.top + scrollY;
      slotLeft = slotRect.left;
      slotWidth = slotRect.width;
      elHeight = this.offsetHeight || rect.height;
      naturalMargin = `${computedSlot.marginTop} ${computedSlot.marginRight} ${computedSlot.marginBottom} ${computedSlot.marginLeft}`;
      marginBottom = Number.parseFloat(computedSlot.marginBottom) || 0;
      observedTargets.add(this.placeholderEl);
    } else {
      if (this.style.position === 'sticky') {
        this.style.removeProperty('position');
        this.style.removeProperty('top');
        this.lastAppliedNativeTop = '';
      }

      visible = this.isElementVisible(this);

      if (visible) {
        const rect = this.getBoundingClientRect();
        const computed = window.getComputedStyle(this);
        const translateY =
          computed.transform && computed.transform !== 'none'
            ? new DOMMatrixReadOnly(computed.transform).m42
            : 0;

        naturalTop = rect.top - translateY + scrollY;
        slotLeft = rect.left;
        slotWidth = rect.width;
        elHeight = rect.height;
        naturalMargin = `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`;
        marginBottom = Number.parseFloat(computed.marginBottom) || 0;
      }
    }

    const viewportHeight = window.innerHeight;
    const docScrollHeight =
      document.scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight;
    const maxScroll = Math.max(0, docScrollHeight - viewportHeight);

    if (!visible || elHeight <= 0 || slotWidth <= 0 || maxScroll <= 0) {
      this.inactiveState = true;
      this.metrics = null;
      this.unfix();
      this.clearInlinePositionStyles();
      this.setActiveState(false, scrollY);
      this.updateResizeObserver(observedTargets);

      return;
    }

    const rawOffsetPx = resolveOffsetPx(this.offset, this, viewportHeight, observedTargets);
    const offsetEndPx = resolveOffsetPx(
      this['offset-end'],
      this,
      viewportHeight,
      observedTargets,
    );

    let overflow = 0;
    let effectiveOffset = rawOffsetPx;

    if (this['overflow-flip'] && elHeight + rawOffsetPx + offsetEndPx > viewportHeight) {
      overflow = 0;
      effectiveOffset =
        this.position === 'bottom' ? rawOffsetPx : viewportHeight - elHeight - offsetEndPx;
    } else if (this.position === 'bottom') {
      overflow = Math.max(0, elHeight + rawOffsetPx + offsetEndPx - viewportHeight);
      effectiveOffset = overflow > 0 ? offsetEndPx : viewportHeight - elHeight - rawOffsetPx;
    } else {
      overflow = Math.max(0, elHeight + rawOffsetPx + offsetEndPx - viewportHeight);
      effectiveOffset = rawOffsetPx;
    }

    let parentInnerBottom = docScrollHeight;

    if (visibleParent) {
      const parentRect = visibleParent.getBoundingClientRect();
      const parentStyle = window.getComputedStyle(visibleParent);
      const padBottom = Number.parseFloat(parentStyle.paddingBottom) || 0;
      const borderBottom = Number.parseFloat(parentStyle.borderBottomWidth) || 0;

      parentInnerBottom = parentRect.bottom + scrollY - padBottom - borderBottom;
    }

    const rawEnd = this.end.trim();
    const rawStart = this.start.trim();

    let endEl: HTMLElement | null = null;
    let endLimitBottom = docScrollHeight;

    if (!rawEnd || rawEnd === 'true' || rawEnd === 'parent') {
      endLimitBottom = parentInnerBottom - marginBottom;
    } else if (rawEnd === 'false' || rawEnd === 'none') {
      endLimitBottom = docScrollHeight;
    } else {
      const endPx = toPx(rawEnd, elHeight, this);

      if (endPx !== null) {
        endLimitBottom = naturalTop + elHeight + endPx;
      } else {
        endEl = queryOffsetElement(rawEnd, this);

        if (endEl) {
          observedTargets.add(endEl);
          const endRect = endEl.getBoundingClientRect();
          const endStyle = window.getComputedStyle(endEl);
          const containsSelf = endEl.contains(this);
          const inset = containsSelf
            ? (Number.parseFloat(endStyle.paddingBottom) || 0) +
              (Number.parseFloat(endStyle.borderBottomWidth) || 0) +
              marginBottom
            : 0;

          endLimitBottom = endRect.bottom + scrollY - inset;
        } else {
          endLimitBottom = parentInnerBottom - marginBottom;
        }
      }
    }

    let startBoundaryTop = naturalTop;

    if (rawStart) {
      if (rawStart === 'true' || rawStart === 'parent') {
        startBoundaryTop = parentInnerBottom;
      } else {
        const startPx = toPx(rawStart, elHeight, this);

        if (startPx !== null) {
          startBoundaryTop = naturalTop + startPx;
        } else {
          const startEl = queryOffsetElement(rawStart, this);

          if (startEl) {
            observedTargets.add(startEl);
            const startRect = startEl.getBoundingClientRect();
            const startElTop = startRect.top + scrollY;
            const startElBottom = startRect.bottom + scrollY;

            if (endEl && startEl === endEl) {
              startBoundaryTop = startElTop;
            } else if (startElTop > naturalTop + elHeight) {
              startBoundaryTop = startElTop;
            } else {
              startBoundaryTop = startElBottom;
            }
          }
        }
      }
    }

    const startScroll = startBoundaryTop - effectiveOffset;
    const endScroll = Math.min(maxScroll, endLimitBottom - elHeight - effectiveOffset + overflow);

    const isDefaultEnd = !rawEnd || rawEnd === 'true' || rawEnd === 'parent';
    const useNativeSticky =
      this.position !== 'bottom' &&
      !this['show-on-up'] &&
      !this.animation.trim() &&
      !rawStart &&
      isDefaultEnd &&
      this.canAncestorsSupportSticky();

    const nextMetrics: StickyMetrics = {
      naturalTop,
      slotLeft,
      slotWidth,
      elHeight,
      naturalMargin,
      marginBottom,
      viewportHeight,
      maxScroll,
      effectiveOffset,
      overflow,
      startScroll,
      endScroll,
      useNativeSticky,
    };

    if (useNativeSticky && this.fixedState) {
      this.unfix();
    } else if (!useNativeSticky && this.style.position === 'sticky' && !this.fixedState) {
      this.clearInlinePositionStyles();
    }

    this.inactiveState = false;
    this.metrics = nextMetrics;

    if (!useNativeSticky) {
      this.syncPlaceholderBox(nextMetrics);

      if (this.placeholderEl) {
        observedTargets.add(this.placeholderEl);
      }
    } else if (this.placeholderEl) {
      this.placeholderEl.hidden = true;
    }

    if (scrollY <= startScroll) {
      this.overflowScroll = 0;
    } else {
      this.overflowScroll = this.clamp(this.overflowScroll, 0, overflow);
    }

    this.updateResizeObserver(observedTargets);
  }

  private syncScroll(isScrollEvent: boolean): void {
    if (this.inactiveState || !this.metrics) {
      return;
    }

    const m = this.metrics;
    const scrollY = this.clamp(this.getScrollY(), 0, m.maxScroll);
    const dir: 'down' | 'up' = scrollY >= this.prevScrollY ? 'down' : 'up';

    if (scrollY <= m.startScroll) {
      this.overflowScroll = 0;
    } else if (m.overflow > 0 && m.endScroll > m.startScroll) {
      const delta =
        this.clamp(scrollY, m.startScroll, m.endScroll) -
        this.clamp(this.prevScrollY, m.startScroll, m.endScroll);

      this.overflowScroll = this.clamp(this.overflowScroll + delta, 0, m.overflow);
    }

    const below = scrollY > m.naturalTop + m.elHeight;

    if (m.useNativeSticky) {
      const nextTop = `${m.effectiveOffset - this.overflowScroll}px`;

      if (this.style.position !== 'sticky') {
        this.style.position = 'sticky';
      }

      if (this.lastAppliedNativeTop !== nextTop) {
        this.style.top = nextTop;
        this.lastAppliedNativeTop = nextTop;
      }

      const shouldBeActive =
        m.endScroll >= m.startScroll &&
        (m.startScroll > 0 ? scrollY >= m.startScroll : scrollY > 0);

      this.setBelowState(below && shouldBeActive);
      this.setActiveState(shouldBeActive, scrollY);
      this.prevScrollY = scrollY;
      this.prevDir = dir;

      return;
    }

    const now = Date.now();

    if (dir !== this.prevDir || now - this.lastScrollTime > 300) {
      this.gestureScroll = scrollY;
    }

    this.lastScrollTime = now;

    if (this['show-on-up']) {
      if (scrollY <= m.startScroll || m.endScroll < m.startScroll) {
        if (this.fixedState || this.isLeaving) {
          this.cancelAnimation();
          this.unfix();
        }
      } else if (dir === 'down' && isScrollEvent) {
        if (this.fixedState && !this.isLeaving && Math.abs(scrollY - this.gestureScroll) > 5) {
          this.hideFixed(below, scrollY);
        } else if (this.fixedState && this.isLeaving) {
          this.updateFixedPosition(scrollY, below);
        }
      } else if (dir === 'up') {
        if (!this.fixedState) {
          const movedEnough =
            Math.abs(this.gestureScroll - scrollY) > 30 ||
            Math.abs(this.prevScrollY - scrollY) > 10;

          if (below && movedEnough) {
            this.enterFixed(scrollY, below, true);
          }
        } else {
          if (this.isLeaving) {
            this.cancelAnimation();
            this.isLeaving = false;

            if (this.animation.trim() && below) {
              this.runAnimation(false);
            }
          }

          this.updateFixedPosition(scrollY, below);
        }
      } else if (this.fixedState) {
        this.updateFixedPosition(scrollY, below);
      }

      this.prevScrollY = scrollY;
      this.prevDir = dir;

      return;
    }

    const hasExplicitStart = Boolean(this.start.trim());
    const inRange =
      m.endScroll >= m.startScroll &&
      (m.startScroll > 0 || this.position === 'bottom' || hasExplicitStart
        ? scrollY >= m.startScroll
        : scrollY > 0);

    if (!inRange) {
      if (this.fixedState) {
        this.hideFixed(below, scrollY);
      }
    } else if (!this.fixedState) {
      this.enterFixed(scrollY, below, Boolean(this.animation.trim() && below));
    } else {
      if (this.isLeaving) {
        this.cancelAnimation();
        this.isLeaving = false;
      }

      this.updateFixedPosition(scrollY, below);
    }

    this.prevScrollY = scrollY;
    this.prevDir = dir;
  }

  private enterFixed(scrollY: number, below: boolean, shouldAnimate: boolean): void {
    if (!this.metrics) {
      return;
    }

    this.cancelAnimation();
    this.isLeaving = false;

    const placeholder = this.ensurePlaceholder();

    this.syncPlaceholderBox(this.metrics);
    placeholder.hidden = false;
    this.fixedState = true;

    this.applyFixedClasses();
    this.updateFixedPosition(scrollY, below);

    if (shouldAnimate && this.animation.trim()) {
      this.runAnimation(false);
    }
  }

  private hideFixed(below: boolean, scrollY: number): void {
    if (!this.fixedState) {
      return;
    }

    if (this.animation.trim() && below) {
      if (this.isLeaving) {
        return;
      }

      this.isLeaving = true;
      this.runAnimation(true, () => {
        if (this.isLeaving) {
          this.isLeaving = false;
          this.unfix(scrollY);
        }
      });

      return;
    }

    this.cancelAnimation();
    this.isLeaving = false;
    this.unfix(scrollY);
  }

  private unfix(scrollY: number = this.getScrollY()): void {
    this.isLeaving = false;
    this.fixedState = false;
    removeClasses(this, this.appliedFixedClasses);
    this.appliedFixedClasses = [];
    this.setBelowState(false);

    if (this.placeholderEl) {
      this.placeholderEl.hidden = true;
    }

    this.clearInlinePositionStyles();
    this.setActiveState(false, scrollY);
  }

  private updateFixedPosition(scrollY: number, below: boolean): void {
    if (!this.metrics) {
      return;
    }

    const m = this.metrics;
    const endOvershoot = Math.max(0, scrollY - m.endScroll);
    const fixedTop = m.effectiveOffset - this.overflowScroll - endOvershoot;

    this.style.position = 'fixed';
    this.style.top = `${fixedTop}px`;
    this.style.left = `${m.slotLeft}px`;
    this.style.width = `${m.slotWidth}px`;

    this.setBelowState(below);

    const isActive = m.startScroll !== 0 || scrollY > m.startScroll || this.position === 'bottom';

    this.setActiveState(isActive, scrollY);
  }

  private resolveAnimationClasses(): string[] {
    const raw = this.animation.trim();

    if (!raw) {
      return [];
    }

    return resolveAnimationPreset(raw)
      .split(/[\s,]+/)
      .map(token => token.trim())
      .filter(Boolean);
  }

  private cancelAnimation(): void {
    if (this.animationCleanup) {
      this.animationCleanup();
      this.animationCleanup = null;
    }
  }

  private runAnimation(reverse: boolean, onFinish?: () => void): void {
    this.cancelAnimation();

    const durationMs = Number.isFinite(this.duration) && this.duration >= 0 ? this.duration : 150;

    this.animationCleanup = runCssAnimation(this, this.resolveAnimationClasses(), {
      duration: durationMs,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      reverse,
      onFinish,
      onCleanup: () => {
        this.animationCleanup = null;
      },
    });
  }

  private applyFixedClasses(): void {
    removeClasses(this, this.appliedFixedClasses);
    this.appliedFixedClasses = this.splitClasses(this.$cls.fixed);

    if (this.appliedFixedClasses.length > 0) {
      this.classList.add(...this.appliedFixedClasses);
    }
  }

  private setBelowState(below: boolean): void {
    if (this.belowState === below) {
      return;
    }

    this.belowState = below;
    removeClasses(this, this.appliedBelowClasses);

    if (below) {
      this.appliedBelowClasses = this.splitClasses(this.$cls.below);

      if (this.appliedBelowClasses.length > 0) {
        this.classList.add(...this.appliedBelowClasses);
      }
    } else {
      this.appliedBelowClasses = [];
    }
  }

  private syncTargetInactiveClass(active: boolean): void {
    const target = this.resolveTargetElement();

    removeClasses(target, this.appliedActiveClasses);
    removeClasses(target, this.appliedInactiveClasses);

    if (active) {
      this.appliedInactiveClasses = [];
      this.appliedActiveClasses = this.splitClasses(this.$cls.active);

      if (this.appliedActiveClasses.length > 0) {
        target.classList.add(...this.appliedActiveClasses);
      }
    } else {
      this.appliedActiveClasses = [];
      this.appliedInactiveClasses = this.splitClasses(this.$cls.inactive);

      if (this.appliedInactiveClasses.length > 0) {
        target.classList.add(...this.appliedInactiveClasses);
      }
    }
  }

  private reapplyManagedClasses(): void {
    const target = this.resolveTargetElement();

    removeClasses(target, this.appliedActiveClasses);
    removeClasses(target, this.appliedInactiveClasses);
    removeClasses(this, this.appliedActiveClasses);
    removeClasses(this, this.appliedInactiveClasses);
    this.appliedActiveClasses = [];
    this.appliedInactiveClasses = [];
    this.syncTargetInactiveClass(this.activeState);

    removeClasses(this, this.appliedFixedClasses);
    this.appliedFixedClasses = [];

    if (this.fixedState) {
      this.applyFixedClasses();
    }

    const wasBelow = this.belowState;

    removeClasses(this, this.appliedBelowClasses);
    this.appliedBelowClasses = [];
    this.belowState = false;

    if (wasBelow) {
      this.setBelowState(true);
    }
  }

  private setActiveState(active: boolean, scrollY: number): void {
    if (this.activeState === active) {
      return;
    }

    this.activeState = active;
    this.syncTargetInactiveClass(active);

    const target = this.resolveTargetElement();
    const detail = {
      active,
      fixed: this.fixedState,
      below: this.belowState,
      scroll: scrollY,
      target,
    };

    this.emit(active ? 'active' : 'inactive', {
      fixed: this.fixedState,
      below: this.belowState,
      scroll: scrollY,
      target,
    });

    this.emit('change', detail);
  }

  private handleScroll = (): void => {
    this.syncScroll(true);
  };

  private handleViewportResize = (): void => {
    this.refresh();
  };

  private handleHashNavigation = (): void => {
    if (!this.isTargetOffsetEnabled() || typeof window === 'undefined') {
      return;
    }

    const scrollingElement = document.scrollingElement;
    const hash = window.location.hash;

    if (!scrollingElement || !hash || scrollingElement.scrollTop === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (!this.isConnected) {
        return;
      }

      let hashTarget: HTMLElement | null = null;
      const rawId = hash.slice(1);

      if (rawId) {
        try {
          hashTarget = document.getElementById(decodeURIComponent(rawId));
        } catch {
          hashTarget = document.getElementById(rawId);
        }
      }

      if (!hashTarget) {
        hashTarget = queryOffsetElement(hash, this);
      }

      if (!hashTarget) {
        return;
      }

      this.refresh();

      if (!this.activeState && !this.fixedState) {
        return;
      }

      const stickyRect = this.getBoundingClientRect();
      const targetRect = hashTarget.getBoundingClientRect();
      const extraOffsetRaw = this['target-offset'].trim();
      const extraOffset =
        extraOffsetRaw && extraOffsetRaw !== 'true'
          ? (toPx(extraOffsetRaw, window.innerHeight, this) ?? 0)
          : 0;

      if (
        stickyRect.height > 0 &&
        targetRect.top < stickyRect.bottom + extraOffset &&
        targetRect.bottom > stickyRect.top
      ) {
        scrollingElement.scrollTop = Math.max(
          0,
          Math.ceil(scrollingElement.scrollTop + targetRect.top - stickyRect.bottom - extraOffset),
        );
      }
    });
  };

  private bindEvents(): void {
    if (this.isEventsBound || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleViewportResize, { passive: true });
    window.visualViewport?.addEventListener('resize', this.handleViewportResize);
    window.addEventListener('hashchange', this.handleHashNavigation);
    window.addEventListener('popstate', this.handleHashNavigation);
    this.isEventsBound = true;
  }

  private detachListeners(): void {
    if (!this.isEventsBound || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleViewportResize);
    window.visualViewport?.removeEventListener('resize', this.handleViewportResize);
    window.removeEventListener('hashchange', this.handleHashNavigation);
    window.removeEventListener('popstate', this.handleHashNavigation);
    this.isEventsBound = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-sticky': Sticky;
  }
}
