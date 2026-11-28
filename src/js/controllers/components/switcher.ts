import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { isDisabledElement, isLayoutChild } from '$js/shared/base';
import { Controller } from '$js/controllers/controller';
import { resolveAnimationPreset, runCssAnimation } from '../../shared/helpers/animation';
import { observeMediaQuery } from '../../shared/helpers/css';

interface TabEntry {
  index: number;
  itemEl: HTMLElement;
  triggerEl: HTMLElement;
  disabled: boolean;
  value: string;
}

@customElement('z-switcher')
export class Switcher extends Controller {
  protected readonly eventPrefix = 'z-switcher';

  protected override readonly 'cls-default-element': string = 'active';

  protected override $cls: { active: string; [key: string]: string } = {
    active: 'z-active',
  };

  private _active: number = -1;

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

  @property({ type: String })
  connect: string = '';

  @property({ type: Boolean, attribute: 'no-connect' })
  'no-connect': boolean = false;

  @property({ type: Boolean })
  manual: boolean = false;

  @property({ type: Boolean })
  collapsible: boolean = false;

  @property({ type: String })
  orientation: '' | 'horizontal' | 'vertical' = '';

  @property({ type: String })
  media: string = '';

  @property({ type: String })
  animation: string = '';

  @property({ type: Number })
  duration: number = 150;

  @property({ type: Boolean, attribute: 'no-indicator' })
  'no-indicator': boolean = false;

  private currentIndex: number = -1;

  private focusedIndex: number = 0;

  private hasValidIndicatorMeasurement: boolean = false;

  private boundTablist: HTMLElement | null = null;

  private boundSwitcherContainers: HTMLElement[] = [];

  private originalSideClass: 'z-tab-left' | 'z-tab-right' | '' = '';

  private resizeObserver: ResizeObserver | null = null;

  private stopMediaQuery: (() => void) | null = null;

  private animationCleanupMap: WeakMap<HTMLElement, () => void> = new WeakMap();

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.detachListeners();
    this.detachResizeObserver();
    this.detachMediaListener();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeSwitcher();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (changedProperties.has('media')) {
      this.setupMediaQuery();
    }

    if (this.hasChanged(changedProperties, ['connect', 'no-connect'])) {
      this.refresh();

      return;
    }

    if (this.hasChanged(changedProperties, ['orientation', 'no-indicator', 'collapsible'])) {
      this.syncState(this.currentIndex, false);
    }

    if (changedProperties.has('active')) {
      this.show(this.active);
    }

    if (changedProperties.has('cls')) {
      const tablist = this.resolveTablist();

      if (tablist && this.$prevCls.active && this.$prevCls.active !== this.$cls.active) {
        const els: Element[] = [];

        for (const entry of this.resolveTabEntries(tablist)) {
          els.push(entry.itemEl, entry.triggerEl);
        }

        for (const container of this.resolveSwitcherContainers()) {
          els.push(...this.getDirectPanels(container));
        }

        this.clearPrevClasses(els, this.$prevCls.active, this.$cls.active);
      }

      this.syncState(this.currentIndex, false);
    }
  }

  public index(): number {
    return this.currentIndex;
  }

  public refresh(): void {
    this.detachListeners();
    this.detachResizeObserver();
    this.detachMediaListener();
    this.hasValidIndicatorMeasurement = false;
    this.initializeSwitcher();
  }

  public show(target: number | 'next' | 'previous' | string): boolean {
    const tablist = this.resolveTablist();

    if (!tablist) {
      return false;
    }

    const entries = this.resolveTabEntries(tablist);
    const targetIndex = this.resolveTargetIndex(target, entries);

    if (targetIndex === null) {
      return false;
    }

    if (targetIndex === this.currentIndex) {
      return true;
    }

    const previousIndex = this.currentIndex;
    const targetEntry = targetIndex >= 0 ? entries[targetIndex] : undefined;
    const detail = {
      index: targetIndex,
      previousIndex,
      item: targetEntry?.itemEl ?? null,
      trigger: targetEntry?.triggerEl ?? null,
      value: targetEntry?.value ?? null,
    };

    if (!this.emit('before-change', detail, true)) {
      this.syncActiveProp(previousIndex);

      return false;
    }

    this.currentIndex = targetIndex;

    if (targetIndex >= 0) {
      this.focusedIndex = targetIndex;
    }

    this.syncActiveProp(targetIndex);
    this.syncState(targetIndex, true, previousIndex);
    this.emit('change', detail);

    return true;
  }

  private initializeSwitcher(): void {
    const tablist = this.resolveTablist();

    if (!tablist) {
      this.isInitialized = true;

      return;
    }

    this.captureOriginalSideClass(tablist);
    this.setupMediaQuery();

    const entries = this.resolveTabEntries(tablist);
    const containers = this.resolveSwitcherContainers();
    const initialIndex = this.resolveInitialIndex(entries, containers);

    this.currentIndex = initialIndex;
    this.focusedIndex =
      initialIndex >= 0 ? initialIndex : (entries.find(entry => !entry.disabled)?.index ?? 0);

    this.syncActiveProp(initialIndex);
    this.bindTablistEvents(tablist);
    this.bindSwitcherContainerEvents(containers);
    this.observeTablistResize(tablist);
    this.syncState(initialIndex, false);
    this.isInitialized = true;
  }

  private syncActiveProp(value: number): void {
    this._active = value;
  }

  private isOwnedElement(el: Element): boolean {
    return this.owns(el) && !el.closest('.z-switcher, z-drop');
  }

  private resolveTablist(): HTMLElement | null {
    const explicit = Array.from(
      this.querySelectorAll<HTMLElement>('[data-part="tablist"], [role="tablist"]'),
    ).find(el => this.isOwnedElement(el));

    if (explicit) {
      return explicit;
    }

    const semantic = Array.from(
      this.querySelectorAll<HTMLElement>('.z-tab, .z-tab-alt, .z-subnav, .z-nav'),
    ).find(el => this.isOwnedElement(el));

    if (semantic) {
      return semantic;
    }

    for (const child of Array.from(this.children)) {
      if (isLayoutChild(child) && !child.classList.contains('z-switcher')) {
        return child;
      }
    }

    return null;
  }

  private resolveTabEntries(tablist: HTMLElement): TabEntry[] {
    const entries: TabEntry[] = [];

    for (const child of Array.from(tablist.children)) {
      if (!(child instanceof HTMLElement)) {
        continue;
      }

      if (
        child.classList.contains('z-nav-header') ||
        child.classList.contains('z-nav-divider') ||
        child.hasAttribute('data-switcher-ignore')
      ) {
        continue;
      }

      const isDirectTrigger =
        child.tagName === 'A' || child.tagName === 'BUTTON' || child.getAttribute('role') === 'tab';

      const triggerEl = isDirectTrigger
        ? child
        : (child.querySelector<HTMLElement>(':scope > a, :scope > button, :scope > [role="tab"]') ??
          null);

      if (!triggerEl) {
        continue;
      }

      if (triggerEl.hasAttribute('data-toggle') || triggerEl.hasAttribute('data-open')) {
        continue;
      }

      const disabled = isDisabledElement(child) || isDisabledElement(triggerEl);

      const index = entries.length;
      const value =
        triggerEl.dataset.value ??
        child.dataset.value ??
        triggerEl.getAttribute('href') ??
        String(index);

      entries.push({
        index,
        itemEl: child,
        triggerEl,
        disabled,
        value,
      });
    }

    return entries;
  }

  private resolveSwitcherContainers(): HTMLElement[] {
    if (this['no-connect']) {
      return [];
    }

    const selector = this.connect.trim();

    if (selector) {
      return Array.from(document.querySelectorAll<HTMLElement>(selector));
    }

    const innerContainers = Array.from(this.querySelectorAll<HTMLElement>('.z-switcher')).filter(
      el => this.owns(el),
    );

    if (innerContainers.length > 0) {
      return innerContainers;
    }

    if (
      this.nextElementSibling instanceof HTMLElement &&
      this.nextElementSibling.classList.contains('z-switcher')
    ) {
      return [this.nextElementSibling];
    }

    return [];
  }

  private resolveInitialIndex(entries: TabEntry[], containers: HTMLElement[]): number {
    if (entries.length === 0) {
      return -1;
    }

    if (this.hasAttribute('active')) {
      if (this.active < 0) {
        return this.collapsible ? -1 : (entries.find(entry => !entry.disabled)?.index ?? -1);
      }

      const exact = entries[this.active];

      if (exact && !exact.disabled) {
        return exact.index;
      }

      return entries.find(entry => !entry.disabled)?.index ?? -1;
    }

    const activeClasses = this.splitClasses(this.$cls.active);
    const hasAllActive = (el: HTMLElement) =>
      activeClasses.length > 0 && activeClasses.every(token => el.classList.contains(token));

    const activeEntry = entries.find(
      entry => !entry.disabled && (hasAllActive(entry.itemEl) || hasAllActive(entry.triggerEl)),
    );

    if (activeEntry) {
      return activeEntry.index;
    }

    const primaryPanels = this.getDirectPanels(containers[0]);
    const activePanelIndex = primaryPanels.findIndex(panel => hasAllActive(panel));

    if (
      activePanelIndex !== -1 &&
      entries[activePanelIndex] &&
      !entries[activePanelIndex].disabled
    ) {
      return activePanelIndex;
    }

    return entries.find(entry => !entry.disabled)?.index ?? -1;
  }

  private resolveTargetIndex(
    target: number | 'next' | 'previous' | string,
    entries: TabEntry[],
  ): number | null {
    if (entries.length === 0) {
      return null;
    }

    if (target === 'next' || target === 'previous') {
      const enabled = entries.filter(entry => !entry.disabled);

      if (enabled.length === 0) {
        return null;
      }

      if (this.currentIndex < 0) {
        return target === 'next' ? enabled[0].index : enabled[enabled.length - 1].index;
      }

      const pos = enabled.findIndex(entry => entry.index === this.currentIndex);
      const step = target === 'next' ? 1 : -1;
      const nextPos = pos === -1 ? 0 : (pos + step + enabled.length) % enabled.length;

      return enabled[nextPos].index;
    }

    if (typeof target === 'number') {
      if (target < 0) {
        return this.collapsible ? -1 : null;
      }

      const entry = entries[target];

      return entry && !entry.disabled ? entry.index : null;
    }

    const trimmed = target.trim();

    if (!trimmed) {
      return null;
    }

    if (/^-?\d+$/.test(trimmed)) {
      return this.resolveTargetIndex(Number.parseInt(trimmed, 10), entries);
    }

    const matched = entries.find(
      entry =>
        !entry.disabled &&
        (entry.value === trimmed ||
          entry.triggerEl.getAttribute('href') === trimmed ||
          entry.triggerEl.getAttribute('href') === `#${trimmed}`),
    );

    return matched ? matched.index : null;
  }

  private getDirectPanels(container: HTMLElement | undefined): HTMLElement[] {
    if (!container) {
      return [];
    }

    return Array.from(container.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.tagName !== 'SCRIPT' && child.tagName !== 'TEMPLATE',
    );
  }

  private captureOriginalSideClass(tablist: HTMLElement): void {
    if (tablist.classList.contains('z-tab-left')) {
      this.originalSideClass = 'z-tab-left';
    } else if (tablist.classList.contains('z-tab-right')) {
      this.originalSideClass = 'z-tab-right';
    } else {
      this.originalSideClass = '';
    }
  }

  private setupMediaQuery(): void {
    this.detachMediaListener();

    if (!this.originalSideClass) {
      return;
    }

    this.stopMediaQuery = observeMediaQuery(this.media, (matches, isInitial) => {
      this.applyMediaQueryState(matches, !isInitial);
    });
  }

  private applyMediaQueryState(matches: boolean, shouldSync: boolean): void {
    const tablist = this.resolveTablist();

    if (!tablist || !this.originalSideClass) {
      return;
    }

    if (matches) {
      tablist.classList.add(this.originalSideClass);
    } else {
      tablist.classList.remove('z-tab-left', 'z-tab-right');
    }

    if (shouldSync) {
      this.syncState(this.currentIndex, false);
    }
  }

  private detachMediaListener(): void {
    this.stopMediaQuery?.();
    this.stopMediaQuery = null;
  }

  private getEffectiveOrientation(tablist: HTMLElement): 'horizontal' | 'vertical' {
    if (this.orientation === 'horizontal' || this.orientation === 'vertical') {
      return this.orientation;
    }

    if (
      tablist.classList.contains('z-tab-left') ||
      tablist.classList.contains('z-tab-right') ||
      (tablist.classList.contains('z-nav') && !tablist.classList.contains('z-subnav'))
    ) {
      return 'vertical';
    }

    return 'horizontal';
  }

  private syncState(activeIndex: number, animate: boolean, previousIndex: number = -1): void {
    const tablist = this.resolveTablist();

    if (!tablist) {
      return;
    }

    const entries = this.resolveTabEntries(tablist);
    const containers = this.resolveSwitcherContainers();
    const orientation = this.getEffectiveOrientation(tablist);

    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-orientation', orientation);

    const primaryPanels = this.getDirectPanels(containers[0]);
    const fallbackFocusIndex = entries.find(entry => !entry.disabled)?.index ?? 0;
    const effectiveFocusIndex =
      this.focusedIndex >= 0 && entries[this.focusedIndex] && !entries[this.focusedIndex].disabled
        ? this.focusedIndex
        : activeIndex >= 0
          ? activeIndex
          : fallbackFocusIndex;

    for (const entry of entries) {
      const isActive = entry.index === activeIndex;

      if (entry.itemEl !== entry.triggerEl && !entry.itemEl.hasAttribute('role')) {
        entry.itemEl.setAttribute('role', 'presentation');
      }

      if (!entry.triggerEl.id) {
        entry.triggerEl.id = `z-switcher-tab-${this.uid}-${entry.index}`;
      }

      entry.triggerEl.setAttribute('role', 'tab');
      entry.triggerEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
      entry.triggerEl.setAttribute(
        'tabindex',
        !entry.disabled && entry.index === effectiveFocusIndex ? '0' : '-1',
      );

      if (entry.disabled) {
        entry.triggerEl.setAttribute('aria-disabled', 'true');
      } else {
        entry.triggerEl.removeAttribute('aria-disabled');
      }

      this.toggleClasses(entry.itemEl, this.$cls.active, isActive);

      if (entry.triggerEl !== entry.itemEl) {
        this.toggleClasses(entry.triggerEl, this.$cls.active, isActive);
      }

      const primaryPanel = primaryPanels[entry.index];

      if (primaryPanel) {
        if (!primaryPanel.id) {
          primaryPanel.id = `z-switcher-panel-${this.uid}-${entry.index}`;
        }

        entry.triggerEl.setAttribute('aria-controls', primaryPanel.id);
      }
    }

    for (const container of containers) {
      const panels = this.getDirectPanels(container);

      panels.forEach((panel, panelIndex) => {
        const isActive = panelIndex === activeIndex;
        const tabEntry = entries[panelIndex];

        if (!panel.id) {
          panel.id = `z-switcher-panel-${this.uid}-${panelIndex}`;
        }

        panel.setAttribute('role', 'tabpanel');

        if (tabEntry) {
          panel.setAttribute('aria-labelledby', tabEntry.triggerEl.id);
        }

        if (isActive) {
          panel.removeAttribute('hidden');
          this.unwrapDeferredTemplate(panel, panelIndex);
        }

        if (!isActive) {
          this.animationCleanupMap.get(panel)?.();
        }

        const activeClasses = this.splitClasses(this.$cls.active);
        const wasActive =
          activeClasses.length > 0 && activeClasses.every(token => panel.classList.contains(token));

        for (const token of activeClasses) {
          panel.classList.toggle(token, isActive);
        }

        if (isActive && !wasActive && animate && this.animation.trim()) {
          this.applyPanelAnimation(panel, activeIndex >= previousIndex);
        }
      });
    }

    this.updateIndicator(tablist, entries, activeIndex, animate);
  }

  private unwrapDeferredTemplate(panel: HTMLElement, index: number): void {
    this.unwrapTemplate(panel, { index, panel });
  }

  private resolveAnimationClass(isForward: boolean): string {
    const raw = this.animation.trim();

    if (!raw) {
      return '';
    }

    const preset = resolveAnimationPreset(raw, true);
    const parts = preset
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return '';
    }

    if (parts.length === 1) {
      return parts[0];
    }

    return isForward ? parts[0] : parts[1];
  }

  private applyPanelAnimation(panel: HTMLElement, isForward: boolean): void {
    this.animationCleanupMap.get(panel)?.();

    const animClass = this.resolveAnimationClass(isForward);

    if (!animClass) {
      return;
    }

    const classes = this.splitClasses(animClass);
    const durationMs = Number.isFinite(this.duration) && this.duration >= 0 ? this.duration : 150;
    const cancel = runCssAnimation(panel, classes, {
      duration: durationMs,
      onCleanup: () => {
        if (this.animationCleanupMap.get(panel) === cancel) {
          this.animationCleanupMap.delete(panel);
        }
      },
    });

    if (cancel) {
      this.animationCleanupMap.set(panel, cancel);
    }
  }

  private getOffsetRelativeTo(
    el: HTMLElement,
    ancestor: HTMLElement,
  ): { x: number; y: number; w: number; h: number } {
    let x = 0;
    let y = 0;
    let current: HTMLElement | null = el;

    while (current && current !== ancestor) {
      x += current.offsetLeft;
      y += current.offsetTop;
      current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
    }

    if (current === ancestor) {
      return {
        x,
        y,
        w: el.offsetWidth,
        h: el.offsetHeight,
      };
    }

    const ancestorRect = ancestor.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    return {
      x: elRect.left - ancestorRect.left + ancestor.scrollLeft,
      y: elRect.top - ancestorRect.top + ancestor.scrollTop,
      w: elRect.width,
      h: elRect.height,
    };
  }

  private clearIndicatorAttributes(tablist: HTMLElement): void {
    tablist.removeAttribute('data-indicator-ready');
    tablist.removeAttribute('data-indicator-animate');
    tablist.style.removeProperty('--z-tab-indicator-x');
    tablist.style.removeProperty('--z-tab-indicator-y');
    tablist.style.removeProperty('--z-tab-indicator-w');
    tablist.style.removeProperty('--z-tab-indicator-h');
  }

  private updateIndicator(
    tablist: HTMLElement,
    entries: TabEntry[],
    activeIndex: number,
    animate: boolean,
  ): void {
    const supportsIndicator =
      !this['no-indicator'] &&
      (tablist.classList.contains('z-tab') || tablist.classList.contains('z-tab-alt'));

    if (!supportsIndicator || activeIndex < 0) {
      this.clearIndicatorAttributes(tablist);

      if (activeIndex < 0) {
        this.hasValidIndicatorMeasurement = false;
      }

      return;
    }

    const activeEntry = entries[activeIndex];

    if (!activeEntry || (tablist.offsetWidth === 0 && tablist.offsetHeight === 0)) {
      tablist.removeAttribute('data-indicator-ready');
      tablist.removeAttribute('data-indicator-animate');
      this.hasValidIndicatorMeasurement = false;

      return;
    }

    const rect = this.getOffsetRelativeTo(activeEntry.triggerEl, tablist);

    if (rect.w === 0 && rect.h === 0) {
      tablist.removeAttribute('data-indicator-ready');
      tablist.removeAttribute('data-indicator-animate');
      this.hasValidIndicatorMeasurement = false;

      return;
    }

    const shouldAnimate = animate && this.hasValidIndicatorMeasurement;

    if (shouldAnimate) {
      tablist.setAttribute('data-indicator-animate', '');
    } else {
      tablist.removeAttribute('data-indicator-animate');
    }

    tablist.style.setProperty('--z-tab-indicator-x', `${rect.x}px`);
    tablist.style.setProperty('--z-tab-indicator-y', `${rect.y}px`);
    tablist.style.setProperty('--z-tab-indicator-w', `${rect.w}px`);
    tablist.style.setProperty('--z-tab-indicator-h', `${rect.h}px`);
    tablist.setAttribute('data-indicator-ready', '');
    this.hasValidIndicatorMeasurement = true;
  }

  private observeTablistResize(tablist: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      const entries = this.resolveTabEntries(tablist);

      this.updateIndicator(tablist, entries, this.currentIndex, false);
    });

    this.resizeObserver.observe(tablist);
  }

  private detachResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private bindTablistEvents(tablist: HTMLElement): void {
    this.boundTablist = tablist;
    tablist.addEventListener('click', this.handleTablistClick);
    tablist.addEventListener('keydown', this.handleTablistKeydown);
  }

  private bindSwitcherContainerEvents(containers: HTMLElement[]): void {
    this.boundSwitcherContainers = [this, ...containers];

    const seen = new Set<HTMLElement>();

    for (const container of this.boundSwitcherContainers) {
      if (seen.has(container)) {
        continue;
      }

      seen.add(container);
      container.addEventListener('click', this.handleSwitcherItemClick);
    }
  }

  private detachListeners(): void {
    if (this.boundTablist) {
      this.boundTablist.removeEventListener('click', this.handleTablistClick);
      this.boundTablist.removeEventListener('keydown', this.handleTablistKeydown);
      this.boundTablist = null;
    }

    for (const container of this.boundSwitcherContainers) {
      container.removeEventListener('click', this.handleSwitcherItemClick);
    }

    this.boundSwitcherContainers = [];
  }

  private handleTablistClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element) || !this.boundTablist) {
      return;
    }

    const entries = this.resolveTabEntries(this.boundTablist);
    const clickedEntry = entries.find(
      entry => entry.triggerEl.contains(event.target as Node) || entry.itemEl === event.target,
    );

    if (!clickedEntry) {
      return;
    }

    const href = clickedEntry.triggerEl.getAttribute('href');
    const hasContainers = this.resolveSwitcherContainers().length > 0;

    if (hasContainers || href === null || href === '' || href.startsWith('#')) {
      event.preventDefault();
    }

    if (clickedEntry.disabled) {
      return;
    }

    if (clickedEntry.index === this.currentIndex && this.collapsible) {
      this.show(-1);

      return;
    }

    this.show(clickedEntry.index);
  };

  private findNextEnabledIndex(
    entries: TabEntry[],
    fromIndex: number,
    direction: 'next' | 'previous',
  ): number {
    const enabled = entries.filter(entry => !entry.disabled);

    if (enabled.length === 0) {
      return -1;
    }

    const currentPos = enabled.findIndex(entry => entry.index === fromIndex);
    const step = direction === 'next' ? 1 : -1;
    const nextPos = currentPos === -1 ? 0 : (currentPos + step + enabled.length) % enabled.length;

    return enabled[nextPos].index;
  }

  private moveFocusToTab(entries: TabEntry[], targetIndex: number): void {
    if (targetIndex < 0 || !entries[targetIndex]) {
      return;
    }

    this.focusedIndex = targetIndex;

    for (const entry of entries) {
      entry.triggerEl.setAttribute('tabindex', entry.index === targetIndex ? '0' : '-1');
    }

    entries[targetIndex].triggerEl.focus();
  }

  private handleTablistKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element) || !this.boundTablist) {
      return;
    }

    const entries = this.resolveTabEntries(this.boundTablist);
    const focusedEntry = entries.find(entry => entry.triggerEl.contains(event.target as Node));

    if (!focusedEntry) {
      return;
    }

    const orientation = this.getEffectiveOrientation(this.boundTablist);
    const isRtl = this.isRtl(this.boundTablist);

    let targetIndex: number | null = null;

    if (orientation === 'horizontal') {
      if (event.key === 'ArrowRight') {
        targetIndex = this.findNextEnabledIndex(
          entries,
          focusedEntry.index,
          isRtl ? 'previous' : 'next',
        );
      } else if (event.key === 'ArrowLeft') {
        targetIndex = this.findNextEnabledIndex(
          entries,
          focusedEntry.index,
          isRtl ? 'next' : 'previous',
        );
      }
    } else if (event.key === 'ArrowDown') {
      targetIndex = this.findNextEnabledIndex(entries, focusedEntry.index, 'next');
    } else if (event.key === 'ArrowUp') {
      targetIndex = this.findNextEnabledIndex(entries, focusedEntry.index, 'previous');
    }

    if (event.key === 'Home') {
      targetIndex = entries.find(entry => !entry.disabled)?.index ?? null;
    } else if (event.key === 'End') {
      const enabled = entries.filter(entry => !entry.disabled);

      targetIndex = enabled.length > 0 ? enabled[enabled.length - 1].index : null;
    }

    if (targetIndex !== null && targetIndex >= 0) {
      event.preventDefault();
      this.moveFocusToTab(entries, targetIndex);

      if (!this.manual) {
        this.show(targetIndex);
      }

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (focusedEntry.disabled) {
        return;
      }

      if (focusedEntry.index === this.currentIndex && this.collapsible) {
        this.show(-1);
      } else {
        this.show(focusedEntry.index);
      }
    }
  };

  private handleSwitcherItemClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const trigger = event.target.closest<HTMLElement>('[data-switcher-item]');

    if (!trigger) {
      return;
    }

    const target = trigger.getAttribute('data-switcher-item');

    if (target === null) {
      return;
    }

    event.preventDefault();
    this.show(target);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'z-switcher': Switcher;
  }
}
