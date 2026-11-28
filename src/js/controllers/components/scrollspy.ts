import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { removeClasses } from '$js/shared/base';
import { Controller } from '$js/controllers/controller';
import { resolveAnimationPreset, runCssAnimation } from '../../shared/helpers/animation';
import { resolveOffsetPx } from '../../shared/helpers/css';

interface RevealEntry {
  index: number;
  el: HTMLElement;
  classes: string[];
  animClasses: string[];
  inview: boolean;
  show: boolean;
  queued: boolean;
  timerId: number | null;
  cleanupAnim: (() => void) | null;
  savedOpacity: string;
}

interface NavEntry {
  index: number;
  linkEl: HTMLAnchorElement;
  itemEl: HTMLElement;
  targetEl: HTMLElement;
}

const NAV_CONTAINER_SELECTOR =
  'nav, [role="navigation"], .z-nav, .z-subnav, .z-tab, .z-tab-alt, .z-dotnav, .z-thumbnav';

interface Cls extends Record<string, string> {
  default: string;
  active: string;
  inview: string;
  reveal: string;
}

@customElement('z-scrollspy')
export class Scrollspy extends Controller {
  protected readonly eventPrefix = 'z-scrollspy';

  protected override readonly 'cls-default-element': string = 'default';

  protected override $cls: Cls = {
    default: '',
    active: 'z-active',
    inview: 'z-scrollspy-inview',
    reveal: '',
  };

  @property({ type: String })
  mode: '' | 'nav' | 'reveal' = '';

  @property({ type: Boolean })
  nav: boolean = false;

  @property({ type: String })
  target: string = '';

  @property({ type: String })
  animation: string = '';

  @property({ type: Boolean, attribute: 'no-hidden' })
  'no-hidden': boolean = false;

  @property({ type: String })
  margin: string = '-1px';

  @property({ type: Number })
  threshold: number = 0;

  @property({ type: Boolean })
  repeat: boolean = false;

  @property({ type: Number })
  delay: number = 0;

  @property({ type: Number })
  duration: number = 0;

  @property({ type: String, attribute: 'closest' })
  closestSelector: string = '';

  @property({ type: String })
  offset: string = '0';

  @property({ type: Boolean, attribute: 'scroll' })
  smoothScroll: boolean = false;

  @property({ type: Boolean, attribute: 'active-parent' })
  'active-parent': boolean = false;

  private activeMode: 'nav' | 'reveal' = 'reveal';

  private revealEntries: RevealEntry[] = [];

  private revealObserver: IntersectionObserver | null = null;

  private revealQueueChain: Promise<void> = Promise.resolve();

  private navEntries: NavEntry[] = [];

  private navObserver: IntersectionObserver | null = null;

  private navResizeObserver: ResizeObserver | null = null;

  private observedNavElements: Set<Element> = new Set();

  private boundScrollTarget: Window | HTMLElement | null = null;

  private navSyncRafId: number | null = null;

  private currentActiveIndex: number = -1;

  private isNavClickBound: boolean = false;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.teardown();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeScrollspy();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (
      this.hasChanged(changedProperties, [
        'mode',
        'nav',
        'target',
        'cls',
        'animation',
        'no-hidden',
        'margin',
        'threshold',
        'repeat',
        'closestSelector',
        'offset',
        'smoothScroll',
        'active-parent',
      ])
    ) {
      this.refresh();
    }
  }

  public refresh(): void {
    this.teardown();
    this.initializeScrollspy();
  }

  public activeIndex(): number {
    return this.activeMode === 'nav' ? this.currentActiveIndex : -1;
  }

  public inviewElements(): HTMLElement[] {
    if (this.activeMode !== 'reveal') {
      return [];
    }

    return this.revealEntries.filter(entry => entry.inview).map(entry => entry.el);
  }

  private initializeScrollspy(): void {
    this.activeMode = this.resolveMode();

    if (this.activeMode === 'nav') {
      this.initializeNavMode();
    } else {
      this.initializeRevealMode();
    }

    this.isInitialized = true;
  }

  private teardown(): void {
    this.teardownReveal();
    this.teardownNav();
  }

  private resolveAnimationClasses(raw: string): string[] {
    const tokens = this.splitClasses(raw);
    const resolved: string[] = [];

    for (const token of tokens) {
      resolved.push(...this.splitClasses(resolveAnimationPreset(token)));
    }

    return resolved;
  }

  private resolveMode(): 'nav' | 'reveal' {
    if (this.mode === 'nav' || this.nav) {
      return 'nav';
    }

    if (this.mode === 'reveal') {
      return 'reveal';
    }

    const clsSource = this.$cls.reveal.trim() || this.$cls.default.trim();
    const clsTokens = this.resolveAnimationClasses(clsSource);
    const hasRevealSignals =
      this.repeat ||
      this.delay > 0 ||
      this['no-hidden'] ||
      this.animation.trim().length > 0 ||
      clsTokens.some(token => token.startsWith('z-animation-'));

    if (hasRevealSignals) {
      return 'reveal';
    }

    const hasNavAttrs =
      this.closestSelector.trim().length > 0 ||
      this.smoothScroll ||
      this.hasAttribute('offset') ||
      this['active-parent'];

    if (hasNavAttrs) {
      return 'nav';
    }

    const firstChild = this.firstElementChild;

    if (
      this.matches(NAV_CONTAINER_SELECTOR) ||
      (firstChild instanceof Element && firstChild.matches(NAV_CONTAINER_SELECTOR))
    ) {
      return 'nav';
    }

    if (!clsSource && this.findOwnedHashLinks().length > 0) {
      return 'nav';
    }

    return 'reveal';
  }

  // ============================================
  // Reveal Mode
  // ============================================

  private resolveRevealTargets(): HTMLElement[] {
    const rawTarget = this.target.trim();

    if (!rawTarget) {
      return [this];
    }

    try {
      const selector = this.normalizeScopedSelector(rawTarget);

      return Array.from(this.querySelectorAll<HTMLElement>(selector)).filter(el => this.owns(el));
    } catch {
      return [this];
    }
  }

  private initializeRevealMode(): void {
    const targets = this.resolveRevealTargets();
    const fallbackRaw =
      this.animation.trim() || this.$cls.reveal.trim() || this.$cls.default.trim();
    const inviewClasses = this.splitClasses(this.$cls.inview);
    const reduced = this.prefersReducedMotion();

    this.revealQueueChain = Promise.resolve();
    this.revealEntries = targets.map((el, index) => {
      const localRaw = el.getAttribute('data-scrollspy-class')?.trim() || fallbackRaw;
      const classes = this.resolveAnimationClasses(localRaw);
      const animClasses = classes.filter(token => token.startsWith('z-animation-'));
      const alreadyInview =
        inviewClasses.length > 0 && inviewClasses.every(token => el.classList.contains(token));
      const savedOpacity = el.style.opacity;

      if (!this['no-hidden'] && !reduced && !alreadyInview) {
        el.style.opacity = '0';
      }

      return {
        index,
        el,
        classes,
        animClasses,
        inview: alreadyInview,
        show: alreadyInview,
        queued: false,
        timerId: null,
        cleanupAnim: null,
        savedOpacity,
      };
    });

    if (this.revealEntries.length === 0 || typeof IntersectionObserver === 'undefined') {
      for (const entry of this.revealEntries) {
        this.applyReveal(entry, true, false);
      }

      return;
    }

    const thresholdVal = Number.isFinite(this.threshold)
      ? Math.min(Math.max(this.threshold, 0), 1)
      : 0;
    const rootMargin = this.margin.trim() || '-1px';

    try {
      this.revealObserver = new IntersectionObserver(this.handleRevealIntersection, {
        rootMargin,
        threshold: thresholdVal,
      });
    } catch {
      this.revealObserver = new IntersectionObserver(this.handleRevealIntersection, {
        rootMargin: '-1px',
        threshold: thresholdVal,
      });
    }

    for (const entry of this.revealEntries) {
      this.revealObserver.observe(entry.el);
    }
  }

  private handleRevealIntersection = (records: IntersectionObserverEntry[]): void => {
    const reduced = this.prefersReducedMotion();

    for (const record of records) {
      const entry = this.revealEntries.find(item => item.el === record.target);

      if (!entry) {
        continue;
      }

      if (record.isIntersecting) {
        if (!this.repeat && entry.inview) {
          continue;
        }

        entry.show = true;

        if (reduced) {
          this.applyReveal(entry, true, false);

          if (!this.repeat) {
            this.revealObserver?.unobserve(entry.el);
          }

          continue;
        }

        if (!entry.inview && !entry.queued) {
          this.enqueueReveal(entry);
        }
      } else {
        entry.show = false;

        if (entry.timerId !== null && typeof window !== 'undefined') {
          window.clearTimeout(entry.timerId);
          entry.timerId = null;
          entry.queued = false;
        }

        if (this.repeat && entry.inview) {
          this.applyReveal(entry, false, false);
        }
      }
    }
  };

  private enqueueReveal(entry: RevealEntry): void {
    entry.queued = true;

    const delayMs = Number.isFinite(this.delay) && this.delay > 0 ? this.delay : 0;

    this.revealQueueChain = this.revealQueueChain.then(
      () =>
        new Promise<void>(resolve => {
          if (!this.isConnected || !entry.show) {
            entry.queued = false;
            resolve();

            return;
          }

          if (delayMs <= 0 || typeof window === 'undefined') {
            entry.queued = false;
            this.applyReveal(entry, true, true);

            if (!this.repeat) {
              this.revealObserver?.unobserve(entry.el);
            }

            resolve();

            return;
          }

          entry.timerId = window.setTimeout(() => {
            entry.timerId = null;
            entry.queued = false;

            if (this.isConnected && entry.show) {
              this.applyReveal(entry, true, true);

              if (!this.repeat) {
                this.revealObserver?.unobserve(entry.el);
              }
            }

            resolve();
          }, delayMs);
        }),
    );
  }

  private applyReveal(entry: RevealEntry, inview: boolean, animate: boolean): void {
    entry.cleanupAnim?.();
    entry.cleanupAnim = null;

    const el = entry.el;
    const inviewClasses = this.splitClasses(this.$cls.inview);
    const nonAnimClasses = entry.classes.filter(token => !token.startsWith('z-animation-'));

    if (inview) {
      el.style.opacity = entry.savedOpacity;
      this.cleanEmptyStyle(el);
      el.classList.add(...inviewClasses, ...nonAnimClasses);

      if (animate && entry.animClasses.length > 0) {
        const customDuration =
          Number.isFinite(this.duration) && this.duration > 0 ? this.duration : undefined;

        entry.cleanupAnim = runCssAnimation(el, entry.animClasses, {
          duration: customDuration,
          fallbackTimeoutMs: 850,
          onCleanup: () => {
            entry.cleanupAnim = null;
          },
        });
      }

      entry.inview = true;
      this.emit('inview', { index: entry.index, target: el });
    } else {
      el.classList.remove(...inviewClasses, ...entry.classes);

      if (!this['no-hidden'] && !this.prefersReducedMotion()) {
        el.style.opacity = '0';
      }

      entry.inview = false;
      this.emit('outview', { index: entry.index, target: el });
    }
  }

  private teardownReveal(): void {
    if (this.revealObserver) {
      this.revealObserver.disconnect();
      this.revealObserver = null;
    }

    for (const entry of this.revealEntries) {
      if (entry.timerId !== null && typeof window !== 'undefined') {
        window.clearTimeout(entry.timerId);
        entry.timerId = null;
      }

      entry.cleanupAnim?.();
      entry.cleanupAnim = null;

      if (!entry.inview && !this['no-hidden']) {
        entry.el.style.opacity = entry.savedOpacity;
        this.cleanEmptyStyle(entry.el);
      }
    }

    this.revealEntries = [];
    this.revealQueueChain = Promise.resolve();
  }

  // ============================================
  // Nav / TOC Mode
  // ============================================

  private resolveHashTarget(link: HTMLAnchorElement): HTMLElement | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    const rawHref = link.getAttribute('href')?.trim() ?? '';

    if (!rawHref || rawHref === '#' || rawHref === '#!') {
      return null;
    }

    let parsed: URL;

    try {
      parsed = new URL(rawHref, window.location.href);
    } catch {
      return null;
    }

    if (
      parsed.origin !== window.location.origin ||
      parsed.pathname !== window.location.pathname ||
      !parsed.hash ||
      parsed.hash.length < 2
    ) {
      return null;
    }

    const rawId = parsed.hash.slice(1);
    let decodedId = rawId;

    try {
      decodedId = decodeURIComponent(rawId);
    } catch {
      decodedId = rawId;
    }

    return document.getElementById(decodedId) ?? document.getElementById(rawId);
  }

  private findOwnedHashLinks(): Array<{ linkEl: HTMLAnchorElement; targetEl: HTMLElement }> {
    const rawTarget = this.target.trim();
    const selector = rawTarget
      ? this.normalizeScopedSelector(rawTarget)
      : 'a[href]:not([role="button"])';

    let candidates: HTMLElement[];

    try {
      candidates = Array.from(this.querySelectorAll<HTMLElement>(selector)).filter(el =>
        this.owns(el),
      );
    } catch {
      return [];
    }

    const resolved: Array<{ linkEl: HTMLAnchorElement; targetEl: HTMLElement }> = [];

    for (const candidate of candidates) {
      const linkEl =
        candidate instanceof HTMLAnchorElement
          ? candidate
          : candidate.querySelector<HTMLAnchorElement>('a[href]');

      if (!linkEl || !this.owns(linkEl)) {
        continue;
      }

      const targetEl = this.resolveHashTarget(linkEl);

      if (targetEl) {
        resolved.push({ linkEl, targetEl });
      }
    }

    return resolved;
  }

  private resolveNavItemElement(linkEl: HTMLAnchorElement): HTMLElement {
    const rawClosest = this.closestSelector.trim();

    if (rawClosest === 'false' || rawClosest === 'self') {
      return linkEl;
    }

    if (rawClosest) {
      try {
        const matched = linkEl.closest<HTMLElement>(rawClosest);

        if (matched && this.contains(matched)) {
          return matched;
        }
      } catch {
        // Ignore invalid selector and fall back to default item resolution.
      }
    }

    const parent = linkEl.parentElement;

    if (parent && parent.tagName === 'LI' && this.contains(parent)) {
      return parent;
    }

    return linkEl;
  }

  private resolveScrollContainer(targets: HTMLElement[]): Window | HTMLElement {
    if (typeof window === 'undefined') {
      return this;
    }

    if (targets.length === 0) {
      return window;
    }

    let current: HTMLElement | null = targets[0].parentElement;

    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);

      if (
        (style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflowY === 'overlay') &&
        current.scrollHeight > current.clientHeight + 1
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return window;
  }

  private initializeNavMode(): void {
    const pairs = this.findOwnedHashLinks();

    this.navEntries = pairs.map((pair, index) => ({
      index,
      linkEl: pair.linkEl,
      itemEl: this.resolveNavItemElement(pair.linkEl),
      targetEl: pair.targetEl,
    }));

    this.currentActiveIndex = -1;

    if (this.navEntries.length === 0) {
      return;
    }

    const scrollTarget = this.resolveScrollContainer(this.navEntries.map(entry => entry.targetEl));

    this.bindNavListeners(scrollTarget);
    this.observeNavTargets(scrollTarget);
    this.syncNavActive();
  }

  private bindNavListeners(scrollTarget: Window | HTMLElement): void {
    this.boundScrollTarget = scrollTarget;
    scrollTarget.addEventListener('scroll', this.handleNavScroll, { passive: true });

    if (typeof window !== 'undefined' && scrollTarget !== window) {
      window.addEventListener('resize', this.handleNavScroll, { passive: true });
    }

    if (!this.isNavClickBound) {
      this.addEventListener('click', this.handleNavClick);
      this.isNavClickBound = true;
    }
  }

  private observeNavTargets(scrollTarget: Window | HTMLElement): void {
    if (typeof IntersectionObserver !== 'undefined') {
      const rootEl = scrollTarget instanceof HTMLElement ? scrollTarget : null;

      this.navObserver = new IntersectionObserver(this.handleNavIntersection, {
        root: rootEl,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      });

      for (const entry of this.navEntries) {
        this.navObserver.observe(entry.targetEl);
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      const observed = new Set<Element>([document.documentElement]);

      if (scrollTarget instanceof HTMLElement) {
        observed.add(scrollTarget);
      }

      resolveOffsetPx(this.offset, this, typeof window !== 'undefined' ? window.innerHeight : 0, observed);

      this.navResizeObserver = new ResizeObserver(() => {
        this.scheduleNavSync();
      });

      this.observedNavElements = observed;

      for (const el of this.observedNavElements) {
        this.navResizeObserver.observe(el);
      }
    }
  }

  private handleNavIntersection = (): void => {
    this.scheduleNavSync();
  };

  private handleNavScroll = (): void => {
    this.scheduleNavSync();
  };

  private scheduleNavSync(): void {
    if (this.navSyncRafId !== null || typeof window === 'undefined') {
      return;
    }

    this.navSyncRafId = window.requestAnimationFrame(() => {
      this.navSyncRafId = null;
      this.syncNavActive();
    });
  }

  private syncNavActive(): void {
    if (!this.isConnected || this.getClientRects().length === 0 || this.navEntries.length === 0) {
      return;
    }

    const visibleEntries = this.navEntries.filter(
      entry => entry.targetEl.getClientRects().length > 0,
    );

    if (visibleEntries.length === 0) {
      return;
    }

    const scrollTarget = this.boundScrollTarget ?? window;
    let scrollTop = 0;
    let viewportTop = 0;
    let viewportHeight = 0;
    let scrollHeight = 0;

    if (scrollTarget instanceof HTMLElement) {
      scrollTop = scrollTarget.scrollTop;
      viewportTop = scrollTarget.getBoundingClientRect().top;
      viewportHeight = scrollTarget.clientHeight;
      scrollHeight = scrollTarget.scrollHeight;
    } else {
      const docEl = document.scrollingElement ?? document.documentElement;

      scrollTop = window.scrollY || docEl.scrollTop || 0;
      viewportTop = 0;
      viewportHeight = window.innerHeight;
      scrollHeight = docEl.scrollHeight;
    }

    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    const offsetPx = resolveOffsetPx(this.offset, this, viewportHeight);
    const hasExplicitOffset = Boolean(this.offset.trim() && this.offset.trim() !== '0');
    const tolerance = hasExplicitOffset ? 12 : Math.min(viewportHeight * 0.12, 72);
    const activationY = viewportTop + offsetPx + tolerance;

    let nextActiveIndex = -1;

    if (maxScroll > 0 && scrollTop >= maxScroll - 2) {
      nextActiveIndex = visibleEntries[visibleEntries.length - 1].index;
    } else {
      for (const entry of visibleEntries) {
        const top = entry.targetEl.getBoundingClientRect().top;

        if (top <= activationY) {
          nextActiveIndex = entry.index;
        }
      }
    }

    if (nextActiveIndex === this.currentActiveIndex) {
      return;
    }

    const previousIndex = this.currentActiveIndex;

    this.currentActiveIndex = nextActiveIndex;
    this.applyNavClasses(nextActiveIndex);

    const activeEntry = nextActiveIndex >= 0 ? (this.navEntries[nextActiveIndex] ?? null) : null;
    const detail = {
      index: nextActiveIndex,
      previousIndex,
      item: activeEntry?.itemEl ?? null,
      link: activeEntry?.linkEl ?? null,
      target: activeEntry?.targetEl ?? null,
      id: activeEntry?.targetEl.id ?? null,
    };

    this.emit('active', detail);
    this.emit('change', detail);
  }

  private applyNavClasses(activeIndex: number): void {
    const activeRaw = this.$cls.default.trim() || this.$cls.active;

    for (const entry of this.navEntries) {
      const isActive = entry.index === activeIndex;

      this.toggleClasses(entry.itemEl, activeRaw, isActive);

      if (isActive) {
        entry.linkEl.setAttribute('aria-current', 'location');
      } else {
        entry.linkEl.removeAttribute('aria-current');
      }
    }

    if (this['active-parent'] && activeRaw) {
      const parents = Array.from(this.querySelectorAll<HTMLElement>('li.z-parent')).filter(el =>
        this.owns(el),
      );
      const activeEntry = activeIndex >= 0 ? (this.navEntries[activeIndex] ?? null) : null;

      for (const parentEl of parents) {
        const containsActive = Boolean(activeEntry && parentEl.contains(activeEntry.linkEl));

        this.toggleClasses(parentEl, activeRaw, containsActive);
      }
    }
  }

  private handleNavClick = (event: MouseEvent): void => {
    if (!this.smoothScroll || event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest<HTMLAnchorElement>('a[href]');

    if (!link || !this.owns(link)) {
      return;
    }

    const entry = this.navEntries.find(item => item.linkEl === link);

    if (!entry) {
      return;
    }

    const detail = {
      index: entry.index,
      item: entry.itemEl,
      link: entry.linkEl,
      target: entry.targetEl,
      id: entry.targetEl.id,
    };

    if (!this.emit('before-scroll', detail, true)) {
      return;
    }

    event.preventDefault();

    if (typeof window !== 'undefined' && entry.targetEl.id) {
      const nextHash = `#${entry.targetEl.id}`;

      if (window.location.hash !== nextHash) {
        window.history.pushState(null, '', nextHash);
      }
    }

    const scrollTarget = this.boundScrollTarget ?? window;
    const behavior: ScrollBehavior = this.prefersReducedMotion() ? 'auto' : 'smooth';

    if (scrollTarget instanceof HTMLElement) {
      const offsetPx = resolveOffsetPx(this.offset, this, scrollTarget.clientHeight);
      const containerRect = scrollTarget.getBoundingClientRect();
      const targetRect = entry.targetEl.getBoundingClientRect();
      const destination = Math.max(
        0,
        scrollTarget.scrollTop + (targetRect.top - containerRect.top) - offsetPx,
      );

      scrollTarget.scrollTo({ top: destination, behavior });
    } else if (typeof window !== 'undefined') {
      const offsetPx = resolveOffsetPx(this.offset, this, window.innerHeight);
      const currentTop = window.scrollY || document.documentElement.scrollTop || 0;
      const targetTop = entry.targetEl.getBoundingClientRect().top + currentTop;
      const destination = Math.max(0, targetTop - offsetPx);

      window.scrollTo({ top: destination, behavior });
    }

    this.emit('scrolled', detail);
  };

  private teardownNav(): void {
    if (this.navSyncRafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.navSyncRafId);
      this.navSyncRafId = null;
    }

    if (this.navObserver) {
      this.navObserver.disconnect();
      this.navObserver = null;
    }

    if (this.navResizeObserver) {
      this.navResizeObserver.disconnect();
      this.navResizeObserver = null;
    }

    this.observedNavElements.clear();

    if (this.boundScrollTarget) {
      this.boundScrollTarget.removeEventListener('scroll', this.handleNavScroll);

      if (typeof window !== 'undefined' && this.boundScrollTarget !== window) {
        window.removeEventListener('resize', this.handleNavScroll);
      }

      this.boundScrollTarget = null;
    }

    if (this.isNavClickBound) {
      this.removeEventListener('click', this.handleNavClick);
      this.isNavClickBound = false;
    }

    if (this.navEntries.length > 0) {
      this.applyNavClasses(-1);
    }

    const prevRaw = this.$prevCls.default?.trim() || this.$prevCls.active || '';

    if (prevRaw) {
      removeClasses(
        this.navEntries.map(entry => entry.itemEl),
        prevRaw,
      );

      const parents = Array.from(this.querySelectorAll<HTMLElement>('li.z-parent')).filter(el =>
        this.owns(el),
      );

      removeClasses(parents, prevRaw);
    }

    this.navEntries = [];
    this.currentActiveIndex = -1;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-scrollspy': Scrollspy;
  }
}
